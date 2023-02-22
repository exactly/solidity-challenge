import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai, { expect } from "chai";
import { ethers } from "hardhat";
import { ETHPool } from "../typechain-types";
import { solidity } from 'ethereum-waffle'
import { near } from "./assertion";
import { evm_increaseTime, evm_mine_blocks } from "./helper";

chai.use(solidity)
chai.use(near)

const ONE_WEEK = 60 * 60 * 24 * 7;

describe("ETHPool", function () {
  let ethPool: ETHPool;
  let owner: SignerWithAddress;
  let teamWallet: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  before(async () => {
    [owner, teamWallet, user1, user2, user3] = await ethers.getSigners();

    const ETHPool = await ethers.getContractFactory("ETHPool");
    ethPool = await ETHPool.deploy();
  });

  describe("Team priviledged function", () => {
    it("Only owner can set team wallet", async () => {
      await expect(
        ethPool.connect(user1).setTeamWallet(teamWallet.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')

      await expect(
        ethPool.setTeamWallet(ethers.constants.AddressZero)
      ).to.be.revertedWith('invalid address')

      await expect(
        ethPool.setTeamWallet(teamWallet.address)
      ).to.be.emit(ethPool, "TeamWalletUpdated").withArgs(teamWallet.address)

      expect(
        await ethPool.teamWallet()
      ).to.be.equal(teamWallet.address)
    });

    it("Only team wallet can deposit rewards", async () => {
      const reward = ethers.utils.parseEther("100");
      const beforePoolBalance = await ethers.provider.getBalance(ethPool.address);

      await expect(
        ethPool.connect(user1).depositReward({ value: reward })
      ).to.be.revertedWith("ETHPool: caller is not the team");

      await expect(
        ethPool.connect(teamWallet).depositReward({ value: 0 })
      ).to.be.revertedWith("ETHPool: zero reward");

      await expect(
        ethPool.connect(teamWallet).depositReward({ value: reward })
      ).to.be.emit(ethPool, "RewardDeposited").withArgs(
        teamWallet.address,
        reward
      );

      const afterPoolBalance = await ethers.provider.getBalance(ethPool.address);
      expect(afterPoolBalance.sub(beforePoolBalance)).to.equal(reward);
      expect(await ethPool.epochId()).to.be.equal(1);

      expect(
        await ethPool.getETHBalanceOfPool()
      ).to.be.equal(afterPoolBalance.sub(beforePoolBalance));
    })

    it("Team should be able to charge rewards after 1 week", async () => {
      const reward = ethers.utils.parseEther("100");
      await expect(
        ethPool.connect(teamWallet).depositReward({ value: reward })
      ).to.be.revertedWith("ETHPool: Can charge reward after week");

      await evm_increaseTime(ONE_WEEK);
      await ethPool.connect(teamWallet).depositReward({ value: reward });

      expect(await ethPool.epochId()).to.be.equal(2)
    })
  })

  describe("Stake / Unstake", () => {
    const stakeAmount1 = ethers.utils.parseEther("10");
    const stakeAmount2 = ethers.utils.parseEther("15");

    before(async () => {
      const ETHPool = await ethers.getContractFactory("ETHPool");
      ethPool = await ETHPool.deploy();
      ethPool.setTeamWallet(teamWallet.address);
    });

    it("users should be able to stake eth in the pool", async () => {
      const beforePoolBalance = await ethers.provider.getBalance(ethPool.address);
      await expect(
        ethPool.connect(user1).stake({ value: 0 })
      ).to.be.revertedWith("ETHPool: stake zero");

      // User1 stake 10
      await expect(
        ethPool.connect(user1).stake({ value: stakeAmount1 })
      ).to.be.emit(ethPool, "Staked").withArgs(user1.address, stakeAmount1)

      // User2 stake 15
      await ethPool.connect(user2).stake({ value: stakeAmount2 });

      const afterPoolBalance = await ethers.provider.getBalance(ethPool.address);
      await expect(afterPoolBalance.sub(beforePoolBalance)).to.equal(stakeAmount1.add(stakeAmount2));
    })

    it("should be able to get pending rewards", async () => {
      const reward = ethers.utils.parseEther("100");
      await ethPool.connect(teamWallet).depositReward({ value: reward });
      await evm_mine_blocks(1);

      let user1PendingReward = await ethPool.getPendingReward(user1.address);
      let user2PendingReward = await ethPool.getPendingReward(user2.address);
      let user3PendingReward = await ethPool.getPendingReward(user3.address);

      // User1 pending reward: 100 * 10 / (10 + 15) = 1000 / 25 = 40
      await expect(user1PendingReward).to.equal(ethers.utils.parseEther("40"));
      // User2 pending reward: 100 * 15 / 25 = 1500 / 25 = 60
      await expect(user2PendingReward).to.equal(ethers.utils.parseEther("60"));
      // User3 pending reward: 0
      await expect(user3PendingReward).to.equal(0);
    })

    it("should be able to unstake staked balance with rewards", async () => {
      const beforeBalance = await ethers.provider.getBalance(user1.address);
      const beforePoolBalance = await ethers.provider.getBalance(ethPool.address);

      await expect(
        ethPool.connect(user3).unstake()
      ).to.be.revertedWith("ETHPool: no staked amount");

      // User1 withdraw: 10 + 40 = 50
      const withdrawnAmount = ethers.utils.parseEther("50");
      await expect(
        ethPool.connect(user1).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user1.address,
        stakeAmount1,
        ethers.utils.parseEther("40")
      )

      const afterBalance = await ethers.provider.getBalance(user1.address);
      const afterPoolBalance = await ethers.provider.getBalance(ethPool.address);
      // considering gas fee
      await expect(afterBalance.sub(beforeBalance)).to.be.near(withdrawnAmount)
      await expect(beforePoolBalance.sub(afterPoolBalance)).to.be.equal(withdrawnAmount);
    })
  })

  describe("More testing scenarios", () => {
    beforeEach(async () => {
      const ETHPool = await ethers.getContractFactory("ETHPool");
      ethPool = await ETHPool.deploy();
      ethPool.setTeamWallet(teamWallet.address);
    })

    it("A stake 100, B stake 300, T deposit 200 rewards => A withdraw 25%, B withdraw 75% rewards", async () => {
      const stakeAmountA = ethers.utils.parseEther("100");
      const stakeAmountB = ethers.utils.parseEther("300");
      const rewardAmount = ethers.utils.parseEther("200");

      await ethPool.connect(user1).stake({ value: stakeAmountA });
      await ethPool.connect(user2).stake({ value: stakeAmountB });
      await ethPool.connect(teamWallet).depositReward({ value: rewardAmount });
      await evm_mine_blocks(1);

      expect(await ethPool.getPendingReward(user1.address)).to.be.equal(rewardAmount.div(4));
      expect(await ethPool.getPendingReward(user2.address)).to.be.equal(rewardAmount.mul(3).div(4));

      await expect(
        ethPool.connect(user1).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user1.address,
        stakeAmountA,
        rewardAmount.div(4)
      )
      await expect(
        ethPool.connect(user2).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user2.address,
        stakeAmountB,
        rewardAmount.mul(3).div(4)
      )
    })

    it("A stake 100, T deposit 200 rewards, B stake 300 => A withdraw 100%, B withdraw 0% rewards", async () => {
      const stakeAmountA = ethers.utils.parseEther("100");
      const stakeAmountB = ethers.utils.parseEther("300");
      const rewardAmount = ethers.utils.parseEther("200");

      await ethPool.connect(user1).stake({ value: stakeAmountA });
      await ethPool.connect(teamWallet).depositReward({ value: rewardAmount });
      await ethPool.connect(user2).stake({ value: stakeAmountB });
      await evm_mine_blocks(1);

      expect(await ethPool.getPendingReward(user1.address)).to.be.equal(rewardAmount);
      expect(await ethPool.getPendingReward(user2.address)).to.be.equal(0);

      await expect(
        ethPool.connect(user1).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user1.address,
        stakeAmountA,
        rewardAmount
      )
      await expect(
        ethPool.connect(user2).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user2.address,
        stakeAmountB,
        0
      )
    })

    it("A stake 100, T deposit 200 rewards, A stake 300 again => A withdraw 100%", async () => {
      const stakeAmountA = ethers.utils.parseEther("100");
      const stakeAmountB = ethers.utils.parseEther("300");
      const rewardAmount = ethers.utils.parseEther("200");

      await ethPool.connect(user1).stake({ value: stakeAmountA });
      await ethPool.connect(teamWallet).depositReward({ value: rewardAmount });
      await ethPool.connect(user1).stake({ value: stakeAmountB });
      await evm_mine_blocks(1);

      expect(await ethPool.getPendingReward(user1.address)).to.be.equal(rewardAmount);

      await expect(
        ethPool.connect(user1).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user1.address,
        stakeAmountA.add(stakeAmountB),
        rewardAmount
      )
    })

    it("A stake 100, A stake 300 again, T deposit 200 rewards  => A withdraw 100%", async () => {
      const stakeAmountA = ethers.utils.parseEther("100");
      const stakeAmountB = ethers.utils.parseEther("300");
      const rewardAmount = ethers.utils.parseEther("200");

      await ethPool.connect(user1).stake({ value: stakeAmountA });
      await ethPool.connect(user1).stake({ value: stakeAmountB });
      await ethPool.connect(teamWallet).depositReward({ value: rewardAmount });
      await evm_mine_blocks(1);

      expect(await ethPool.getPendingReward(user1.address)).to.be.equal(rewardAmount);

      await expect(
        ethPool.connect(user1).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user1.address,
        stakeAmountA.add(stakeAmountB),
        rewardAmount
      )
    })

    it("A stake 100, B stake 200, A stake 200 again, T deposit 200 rewards  => A withdraw 60%, B withdraw 40%", async () => {
      const stakeAmountA = ethers.utils.parseEther("100");
      const stakeAmountB = ethers.utils.parseEther("200");
      const rewardAmount = ethers.utils.parseEther("200");

      await ethPool.connect(user1).stake({ value: stakeAmountA });
      await ethPool.connect(user2).stake({ value: stakeAmountB });
      await ethPool.connect(user1).stake({ value: stakeAmountB });
      await ethPool.connect(teamWallet).depositReward({ value: rewardAmount });
      await evm_mine_blocks(1);

      expect(await ethPool.getPendingReward(user1.address)).to.be.equal(rewardAmount.mul(6).div(10));
      expect(await ethPool.getPendingReward(user2.address)).to.be.equal(rewardAmount.mul(4).div(10));

      await expect(
        ethPool.connect(user1).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user1.address,
        stakeAmountA.add(stakeAmountB),
        rewardAmount.mul(6).div(10)
      )
      await expect(
        ethPool.connect(user2).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user2.address,
        stakeAmountB,
        rewardAmount.mul(4).div(10)
      )
    })

    it("A - 100, B - 300, T - 200 | A - 100, T - 200 | A - 300, B - 100, T - 200  => A rewards 400, B withdraw 200", async () => {
      const stakeAmountA = ethers.utils.parseEther("100");
      const stakeAmountB = ethers.utils.parseEther("300");
      const rewardAmount = ethers.utils.parseEther("200");

      await ethPool.connect(user1).stake({ value: stakeAmountA });
      await ethPool.connect(user2).stake({ value: stakeAmountB });
      await ethPool.connect(teamWallet).depositReward({ value: rewardAmount });
      await evm_increaseTime(ONE_WEEK);

      await ethPool.connect(user1).stake({ value: stakeAmountA });
      await ethPool.connect(teamWallet).depositReward({ value: rewardAmount });
      await evm_increaseTime(ONE_WEEK);

      await ethPool.connect(user1).stake({ value: stakeAmountB });
      await ethPool.connect(user2).stake({ value: stakeAmountA });
      await ethPool.connect(teamWallet).depositReward({ value: rewardAmount });
      await evm_increaseTime(ONE_WEEK);

      expect(await ethPool.getPendingReward(user1.address)).to.be.equal(rewardAmount.mul(2));
      expect(await ethPool.getPendingReward(user2.address)).to.be.equal(rewardAmount);

      await expect(
        ethPool.connect(user1).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user1.address,
        stakeAmountA.add(stakeAmountA).add(stakeAmountB),
        rewardAmount.mul(2)
      )
      await expect(
        ethPool.connect(user2).unstake()
      ).to.be.emit(ethPool, "Unstaked").withArgs(
        user2.address,
        stakeAmountA.add(stakeAmountB),
        rewardAmount
      )
    })
  })
});
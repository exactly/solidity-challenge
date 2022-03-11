import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import { ethers, waffle } from "hardhat";

import { expect } from "chai";

describe("ETHPool", function () {
  let team: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    pool: Contract;
  let provider = waffle.provider;

  beforeEach(async function () {
    [team, user1, user2, user3] = await ethers.getSigners();
    const ETHPool = await ethers.getContractFactory("ETHPool", team);
    pool = await ETHPool.deploy();
  });

  const stakeAmountOfUser1 = ethers.utils.parseEther("1");
  const stakeAmountOfUser2 = ethers.utils.parseEther("2");
  const initialDepositAmount = ethers.utils.parseEther("3");
  const initialStaking = async () => {
    await user1.sendTransaction({
      to: pool.address,
      value: stakeAmountOfUser1,
    });
    await user2.sendTransaction({
      to: pool.address,
      value: stakeAmountOfUser2,
    });
  };

  const initialStakingAndDeposit = async () => {
    await initialStaking();
    await pool.connect(team).deposit({ value: initialDepositAmount });
  };

  describe("Staking", async () => {
    it("Should be able to stake", async () => {
      await user1.sendTransaction({
        to: pool.address,
        value: stakeAmountOfUser1,
      });
      expect(await pool.balanceOf(user1.address)).to.be.equal(
        stakeAmountOfUser1
      );
    });
    it("should emit a Stake event", async function () {
      const tx = await user1.sendTransaction({
        to: pool.address,
        value: stakeAmountOfUser1,
      });
      const receipt = await tx.wait();
      expect(tx)
        .to.emit(pool, "Stake")
        .withArgs(
          user1.address,
          stakeAmountOfUser1,
          (await provider.getBlock(receipt.blockNumber)).timestamp
        );
    });
  });

  describe("Deposit", async () => {
    it("Should not be able to deposit without staking", async () => {
      await expect(pool.connect(team).deposit({ value: initialDepositAmount }))
        .to.be.reverted;
    });
    it("should emit a Deposit event", async function () {
      await initialStaking();
      const tx = await pool
        .connect(team)
        .deposit({ value: initialDepositAmount });
      const receipt = await tx.wait();
      expect(tx)
        .to.emit(pool, "Deposit")
        .withArgs(
          initialDepositAmount,
          (await provider.getBlock(receipt.blockNumber)).timestamp
        );
    });
  });

  describe("Withdraw", async () => {
    it("Should be able to withdraw correct amount", async () => {
      await initialStakingAndDeposit();
      const originalBalanceOfUser1: BigNumber = await provider.getBalance(
        user1.address
      );
      const tx1 = await pool.connect(user1).withdraw();
      const receipt1 = await tx1.wait();
      expect(await provider.getBalance(user1.address)).to.be.equal(
        ethers.utils
          .parseEther("2")
          .add(originalBalanceOfUser1)
          .sub(receipt1.effectiveGasPrice * receipt1.gasUsed)
      );
      const originalBalanceOfUser2: BigNumber = await provider.getBalance(
        user2.address
      );
      const tx2 = await pool.connect(user2).withdraw();
      const receipt2 = await tx2.wait();

      expect(await provider.getBalance(user2.address)).to.be.equal(
        ethers.utils
          .parseEther("4")
          .add(originalBalanceOfUser2)
          .sub(receipt2.effectiveGasPrice * receipt2.gasUsed)
      );
    });

    it("only users who staked before deposit should able to get rewards", async () => {
      await initialStakingAndDeposit();
      const originalBalance = await provider.getBalance(user3.address);
      await user3.sendTransaction({
        to: pool.address,
        value: ethers.utils.parseEther("3"),
      });
      await pool.connect(user3).withdraw();
      expect(await provider.getBalance(user3.address)).to.be.lte(
        originalBalance
      );
    });

    it("should not able to withdraw without staking", async () => {
      await initialStakingAndDeposit();
      const tx = pool.connect(user3).withdraw();
      await expect(tx).to.be.reverted;
    });
    it("should not able to withdraw twice or more", async () => {
      await initialStakingAndDeposit();
      await pool.connect(user1).withdraw();
      await expect(pool.connect(user1).withdraw()).to.be.reverted;
    });
  });
});

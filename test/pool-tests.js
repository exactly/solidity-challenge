const { expect } = require("chai");
const { ethers, network } = require("hardhat");

/**
 * Performed with Hardhat tests 
 * @test Change "PoolManagement.sol" variable and function status:
 * bytes32 POOL_MANAGER changed visibility:  private ----> public.
 * function sixDecimals() visibility: private ----> public. 
 * 
 * 
*/

describe("Pool Contract", function () {

  beforeEach(async() => {
    [owner, userA, userB, nonUser, poolManager] = await ethers.getSigners();
    Pool = await ethers.getContractFactory("PoolManagement");
    pool = await Pool.deploy();
    await pool.deployed();
    // Set base pool variables to test other behaviors.
    await pool.connect(owner).setRewardsInterval(7);
    await pool.connect(owner).setRewardsInterest(10000);
    const initialContLimit = ethers.utils.parseEther('10');
    await pool.connect(owner).setContributionLimit(initialContLimit);
    await pool.connect(owner).setPoolFees(1000);
    await pool.connect(owner).setPoolLive(true);
  });

  describe("Role Management", function () {

    it("Should allow the owner to add pool managers.", async function () {
      await pool.connect(owner).addPoolManager(poolManager.address);
      expect(await pool.hasRole(pool.POOL_MANAGER(), poolManager.address)).to.eq(true);
    });

    it("Should allow the owner to remove pool managers.", async function () {
      await pool.connect(owner).addPoolManager(poolManager.address);
      expect(await pool.hasRole(pool.POOL_MANAGER(), poolManager.address)).to.eq(true);

      await pool.connect(owner).removePoolManager(poolManager.address);
      expect(await pool.hasRole(pool.POOL_MANAGER(), poolManager.address)).to.eq(false);
    });

    it("Shouldn't allow anyone but the Admin to assign/revoke roles.", async function () {
      expect(pool.connect(nonUser).addPoolManager(nonUser.address)).to.be.reverted;
      expect(pool.connect(userA).addPoolManager(userA.address)).to.be.reverted;
      expect(pool.connect(userB).addPoolManager(userB.address)).to.be.reverted;
      expect(pool.connect(nonUser).removePoolManager(nonUser.address)).to.be.reverted;
      expect(pool.connect(userA).removePoolManager(userA.address)).to.be.reverted;
      expect(pool.connect(userB).removePoolManager(userB.address)).to.be.reverted;
      await pool.connect(owner).addPoolManager(poolManager.address);
      expect(pool.connect(poolManager).removePoolManager(owner.address)).to.be.reverted;
    });
 
  });

  describe("Staking Process", function () {

    it("Shouldn't allow users to invest if the pool is paused.", async function () {
      const userAInvestment = ethers.utils.parseEther('5');
      await pool.connect(owner).setPoolLive(false);
      expect(pool.connect(userA).stakeETH( {value: userAInvestment} )).to.be.reverted;
    });

    it("Shouldn't allow users to invest if the pool lacks rewards period.", async function () {
      const userAInvestment = ethers.utils.parseEther('5');
      await pool.connect(owner).setPoolLive(false);
      await pool.connect(owner).setRewardsInterval(0);
      await pool.connect(owner).setPoolLive(true);
      expect(pool.connect(userA).stakeETH( {value: userAInvestment} )).to.be.reverted;
    });

    it("Shouldn't allow users to invest if the pool lacks rewards interest.", async function () {
      const userAInvestment = ethers.utils.parseEther('5');
      await pool.connect(owner).setPoolLive(false);
      await pool.connect(owner).setRewardsInterest(0);
      await pool.connect(owner).setPoolLive(true);
      expect(pool.connect(userA).stakeETH( {value: userAInvestment} )).to.be.reverted;
    });

    it("Shouldn't allow users to invest more than the Contribution Limit.", async function () {
      const userAInvestment = ethers.utils.parseEther('11');
      expect(pool.connect(userA).stakeETH( {value: userAInvestment} )).to.be.reverted;
    });

    it("Should allow users to invest ETH and get rwETH back.", async function () {
      const userAInvestment = ethers.utils.parseEther('10');
      const userBInvestment = ethers.utils.parseEther('5');

      await pool.connect(owner).setPoolFees(0);

      await pool.connect(userA).stakeETH( {value: userAInvestment} );
      await pool.connect(userB).stakeETH( {value: userBInvestment} );

      expect(await pool.lastAmountStakedByUser(userA.address)).to.eq(userAInvestment);
      expect(await pool.lastAmountStakedByUser(userB.address)).to.eq(userBInvestment);

      expect(await pool.balanceOf(userA.address)).to.eq(userAInvestment);
      expect(await pool.balanceOf(userB.address)).to.eq(userBInvestment);

    });

    it("Should allow the Team to earn fees.", async function () {
      await pool.connect(owner).setPoolFees(1000);
      const userAInvestment = ethers.utils.parseEther('10');
      
      const poolFees = await pool.poolFees();
      const sixDecimals = await pool._sixDecimals();
      const feesCalculated =  userAInvestment.mul(poolFees).div(sixDecimals);

      await pool.connect(userA).stakeETH( {value: userAInvestment} );
      expect(await pool.getFeeEarnings()).to.eq(feesCalculated);
    });

  });

  describe("Rewards calculation & injection.", function () {

    beforeEach(async() => {
      const userAInvestment = ethers.utils.parseEther('10');
      const userBInvestment = ethers.utils.parseEther('5');
      await pool.connect(userA).stakeETH( {value: userAInvestment} );
      await pool.connect(userB).stakeETH( {value: userBInvestment} );
    });      

    it("Should allow the owner to calculate Rewards.", async function () {
      const rewardsCalculate = await pool.connect(owner).calculateRewards();
     
      expect(pool.connect(userA).calculateRewards()).to.be.reverted;
      expect(pool.connect(userB).calculateRewards()).to.be.reverted;
      expect(pool.connect(nonUser).calculateRewards()).to.be.reverted;
      
      const currentInterest = await pool.rewardsInterestPerPeriod();
      const currentLockedEther = await pool.lockedEther();
      const sixDecimals = await pool._sixDecimals(); 
      const expectedRewards = currentInterest.mul(currentLockedEther).div(sixDecimals);

      const contractRewards = await pool.getRewardsToInject();
              
      expect(contractRewards).to.eq(expectedRewards);
    });

    it("Should allow the owner to inject Rewards.", async function () {
      const rewardsCalculate = await pool.connect(owner).calculateRewards();
      const contractRewards = await pool.getRewardsToInject();
      const preRewardsPoolBalance = await pool.lockedEther();

      await pool.connect(owner).setPoolLive(false);
      const rewardsInjection = await pool.connect(owner).injectRewards( {value: contractRewards} );
      
      const calcFinalPoolBalance = preRewardsPoolBalance.add(contractRewards);

      const finalPoolBalance = await pool.lockedEther();

      const wrongAmount = contractRewards.sub(ethers.utils.parseEther('0.00001'));

      expect(pool.connect(owner).injectRewards( {value: wrongAmount} )).to.be.reverted; 
      expect(finalPoolBalance).to.eq(calcFinalPoolBalance);
    });

    it("Should allow the users to unstake their ETH + Rewards.", async function () {
      // Rewards injection
      const rewardsCalculate = await pool.connect(owner).calculateRewards();
      const contractRewards = await pool.getRewardsToInject();

      await pool.connect(owner).setPoolLive(false);
      const rewardsInjection = await pool.connect(owner).injectRewards( {value: contractRewards} );
      await pool.connect(owner).setPoolLive(true);

      const lockedEther = await pool.lockedEther();
      const rwETHTotalSupply = await pool.totalSupply();
      console.log(rwETHTotalSupply);

      const userArwEthBalance = await pool.balanceOf(userA.address);
      const userBrwEthBalance = await pool.balanceOf(userB.address);
      console.log(userArwEthBalance);
      console.log(userBrwEthBalance);

      const userAExpectedETHBalance = userArwEthBalance.mul(lockedEther).div(rwETHTotalSupply);
      const userBExpectedETHBalance = userBrwEthBalance.mul(lockedEther).div(rwETHTotalSupply);
      
      await pool.connect(userA).unstakeETH(userArwEthBalance);
      const userAUnstakedETH = pool.lastAmountUnstakedByUser(userA.address);
      await pool.connect(userB).unstakeETH(userBrwEthBalance);
      const userBUnstakedETH = pool.lastAmountUnstakedByUser(userB.address);

      console.log(userAUnstakedETH);
      console.log(userBUnstakedETH);
    
      expect(userAUnstakedETH).to.eq(userACalcBalance);
      expect(userBUnstakedETH).to.eq(userBCalcBalance);

    });

      
 
  });
  

});

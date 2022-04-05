const { expect, assert } = require("chai");
const { ethers } = require("hardhat");


describe("Staking Pool Network", function () {
  // Environmental variables to be used among the tests.
  let provider;
  let contracts, contractsAddresses;
  let contractNames;
  let walletAccounts, walletAddresses;

  let poolMaxSize;
  let rewardsInterval;
  let rewardsInterest;
  let contrLimit;
  let minContr;
  

  beforeEach(async() => {

    [admin, userA, userB, nonUser, manager] = await ethers.getSigners();
    provider = ethers.providers.getDefaultProvider("http://localhost:8545");

    walletAccounts = [admin, userA, userB, nonUser, manager];
    walletAddresses = await Promise.all(walletAccounts.map(async(item) => {
      return await item.getAddress();
    }));

    // Contract deployments.
    // Deploying DataStorage Contract (ds)
    DS = await ethers.getContractFactory("DataStorage");
    ds = await DS.deploy();
    await ds.deployed();

    // Deploying TokenBalances Contract (tb):
    TB = await ethers.getContractFactory("TokenBalances");
    tb = await TB.deploy(ds.address);
    await tb.deployed();

    // Deploying rwETHToken Contract (rwETH):
    rwETH = await ethers.getContractFactory("rwETHToken");
    rweth = await rwETH.deploy(ds.address);
    await rweth.deployed();

    // Deploying PoolVault Contract (pv):
    PV = await ethers.getContractFactory("PoolVault");
    pv = await PV.deploy(ds.address);
    await pv.deployed();

    // Deploying PoolClient Contract (pc):
    PC = await ethers.getContractFactory("PoolClient");
    pc = await PC.deploy(ds.address);
    await pc.deployed();

    // Deploying PoolBase Contract (pb):
    PB = await ethers.getContractFactory("PoolBase");
    pb = await PB.deploy(ds.address);
    await pb.deployed();

    contracts = [ds, pb, tb, rweth, pv, pc];
    contractsAddresses = (contracts.map((item) => {return item.address;}));
    contractNames = ["DataStorage", "PoolBase", "TokenBalances", "rwETHToken", "PoolVault", "PoolClient"];

    // console.log("DataStorage Deployed to: ", ds.address);
    // console.log("PoolBase Deployed to: ", pb.address);
    // console.log("TokenBalances Deployed to: ", tb.address);
    // console.log("rwETHToken Deployed to: ", rweth.address);
    // console.log("PoolVault Deployed to: ", pv.address);
    // console.log("PoolClient Deployed to: ", pc.address);
  });

  describe("Contract Addresses & Existances", function () {
    
    it("Should have stored each contract address & existance on DataStorage", async function () {
       for (let index = 0; index < contracts.length; index++) {
        // console.log(contractNames[index], contractsAddresses[index]);
        // solidityKeccak256 condenses the keccak256 + abi.encodePacked implementation of Solidity.
        let boolStorageTag = ethers.utils.solidityKeccak256(["string", "address"], ["contract_exists", contractsAddresses[index]]);
        let addressStorageTag = ethers.utils.solidityKeccak256(["string", "string"], ["contract_address", contractNames[index]]);
        
        expect(await ds.getBoolStorage(boolStorageTag)).to.be.true;
        expect(await ds.getAddressStorage(addressStorageTag)).to.be.eq(contractsAddresses[index]);
      }
    });
  });

  describe("DataStorage Contract", function () {
    
    it("Should allow only the guardian (admin) to set the storage live", async function () {
      for (let index = 1; index < walletAccounts.length; index++) {
        expect(ds.connect(walletAccounts[index]).setStorageLive()).to.be.reverted;
      }   
      await ds.connect(admin).setStorageLive();
      expect(await ds.getStorageStatus()).to.be.true;
    });

    it("Should allow just the pool contracts to set values once the storage is live", async function () {
      await ds.connect(admin).setStorageLive();
      // Testing arbitrary tags and values. The goal is to get the call reverted.
      let arbitraryTag = ethers.utils.solidityKeccak256(["string", "string"], ["arbitrary", "tag"]);
      let arbitraryVal = ethers.BigNumber.from("15");
      for (let index = 0; index < walletAccounts.length; index++) {
        expect(ds.connect(walletAccounts[index]).setUintStorage(arbitraryTag, arbitraryVal)).to.be.revertedWith("The contract address or sender is invalid.");
        expect(ds.connect(walletAccounts[index]).increaseUintStorage(arbitraryTag, 1)).to.be.revertedWith("The contract address or sender is invalid.");
        expect(ds.connect(walletAccounts[index]).decreaseUintStorage(arbitraryTag, 1)).to.be.revertedWith("The contract address or sender is invalid.");
        expect(ds.connect(walletAccounts[index]).setBoolStorage(arbitraryTag, true)).to.be.revertedWith("The contract address or sender is invalid.");
        expect(ds.connect(walletAccounts[index]).setAddressStorage(arbitraryTag, walletAddresses[0])).to.be.revertedWith("The contract address or sender is invalid.");

        expect(ds.connect(walletAccounts[index]).deleteUintStorage(arbitraryTag)).to.be.revertedWith("The contract address or sender is invalid.");
        expect(ds.connect(walletAccounts[index]).deleteBoolStorage(arbitraryTag)).to.be.revertedWith("The contract address or sender is invalid.");
        expect(ds.connect(walletAccounts[index]).deleteAddressStorage(arbitraryTag)).to.be.revertedWith("The contract address or sender is invalid.");
      }
      // Test via the built-in functions that retrieve data from DataStorage. Testing each variable type container.
      // PoolBase: Set variables to test that differ with the default values. 
        poolMaxSize = ethers.utils.parseEther("1000");
        await pb.connect(admin).setPoolMaxSize(poolMaxSize);
        await pb.connect(admin).setPoolLive(true);
        expect(await pb.getPoolBaseAddress()).to.be.eq(contractsAddresses[1]);
        expect(await pb.getPoolState()).to.be.true;
        expect(await pb.getPoolMaxSize()).to.be.eq(poolMaxSize);
      // PoolClient: Call a getter. Checking non reversal.
        expect(await pc.connect(admin).getRewardsToInject()).to.be.eq(0);
        expect(await pc.getPoolClientAddress()).to.be.eq(contractsAddresses[5]);
      // PoolVault: Call a getter. Checking non reversal.
        expect(await pv.poolEtherSize()).to.be.eq(0);  
        expect(await pv.getPoolVaultAddress()).to.be.eq(contractsAddresses[4]);
      // rwETHToken : Call a getter. Checking non reversal.
        expect(await rweth.getRwETHTokenAddress()).to.be.eq(contractsAddresses[3]);    
      // TokenBalances : Call a getter. Checking non reversal.
        expect(await tb.getTokenBalancesAddress()).to.be.eq(contractsAddresses[2]);  
        expect(await tb.getTotalEtherStaked()).to.be.eq(0);      
    });

  });

  describe("PoolBase Contract", function () {

    beforeEach(async () => {
      // Set the contract network. Allow only network contracts to communicate each other.
      await ds.connect(admin).setStorageLive();
      expect(await ds.getStorageStatus()).to.be.true;
    })

    describe("Setting Environmental Variables", function () {

      it("Should allow only the Admin on first place to setup the settings of the pool", async function () {
        // Set base pool variables to test other behaviors.
        poolMaxSize = ethers.utils.parseEther("1000");
        rewardsInterval = ethers.BigNumber.from("7"); // (days)
        rewardsInterest = ethers.BigNumber.from("1000");
        contrLimit = ethers.utils.parseEther("5");
        minContr = ethers.utils.parseEther("0.1");
        

        expect(pb.connect(nonUser).setPoolMaxSize(poolMaxSize)).to.be.reverted;
        expect(pb.connect(nonUser).setRewardsInterval(rewardsInterval)).to.be.reverted;
        expect(pb.connect(nonUser).setRewardsInterest(rewardsInterest)).to.be.reverted;
        expect(pb.connect(nonUser).setContributionLimit(contrLimit)).to.be.reverted;
        expect(pb.connect(nonUser).setMinContribution(minContr)).to.be.reverted;
        
        await pb.connect(admin).setPoolMaxSize(poolMaxSize);
        await pb.connect(admin).setRewardsInterval(rewardsInterval);
        await pb.connect(admin).setRewardsInterest(rewardsInterest);
        await pb.connect(admin).setContributionLimit(contrLimit);
        await pb.connect(admin).setMinContribution(minContr);
       
        expect(await pb.getPoolMaxSize()).to.be.eq(poolMaxSize);
        expect(await pb.getRewardsInterval()).to.be.eq(rewardsInterval);
        expect(await pb.getRewardsInterest()).to.be.eq(rewardsInterest);
        expect(await pb.getContributionLimit()).to.be.eq(contrLimit);
        expect(await pb.getMinContribution()).to.be.eq(minContr);
        
      });

      it("Should allow the Admin to add and remove Managers", async function () {
        //Expecting reversion for all nonAdmin users while granting role.
        for (let index = 1; index < walletAccounts.length; index++) {
          for (let subIndex = 1; subIndex <= walletAccounts.length; subIndex++) {
            expect(pb.connect(walletAccounts[index]).addPoolManager(walletAddresses[subIndex])).to.be.reverted;
          }
        }    
        let poolManagerRole = await pb.POOL_MANAGER();
        await pb.connect(admin).addPoolManager(walletAddresses[4]);
        expect(await pb.hasRole(poolManagerRole, walletAddresses[4])).to.be.true;

        await pb.connect(admin).removePoolManager(walletAddresses[4]);
        expect(await pb.hasRole(poolManagerRole, walletAddresses[4])).to.be.false;
      });

      it("Should allow Managers to setup the settings of the pool", async function () {    
        // Set base pool variables to test other behaviors.
        poolMaxSize = ethers.utils.parseEther("1000");
        rewardsInterval = ethers.BigNumber.from("7"); // (days)
        rewardsInterest = ethers.BigNumber.from("1000");
        contrLimit = ethers.utils.parseEther("5");
        minContr = ethers.utils.parseEther("0.1");
        
        let poolManagerRole = await pb.POOL_MANAGER();
        await pb.connect(admin).addPoolManager(walletAddresses[4]);
        expect(await pb.hasRole(poolManagerRole, walletAddresses[4])).to.be.true;

        await pb.connect(manager).setPoolMaxSize(poolMaxSize);
        await pb.connect(manager).setRewardsInterval(rewardsInterval);
        await pb.connect(manager).setRewardsInterest(rewardsInterest);
        await pb.connect(manager).setContributionLimit(contrLimit);
        await pb.connect(manager).setMinContribution(minContr);
        
        expect(await pb.getPoolMaxSize()).to.be.eq(poolMaxSize);
        expect(await pb.getRewardsInterval()).to.be.eq(rewardsInterval);
        expect(await pb.getRewardsInterest()).to.be.eq(rewardsInterest);
        expect(await pb.getContributionLimit()).to.be.eq(contrLimit);
        expect(await pb.getMinContribution()).to.be.eq(minContr);
      });

    });


  });

  describe("Staking, Unstaking, rwETH Token and PoolVault Interactions", function () {
    let arbitratyDeposit;

      beforeEach(async () =>{
        // Set base pool variables to test other behaviors.
        poolMaxSize = ethers.utils.parseEther("1000");
        rewardsInterval = ethers.BigNumber.from("7"); // (days)
        rewardsInterest = ethers.BigNumber.from("1000");
        contrLimit = ethers.utils.parseEther("5");
        minContr = ethers.utils.parseEther("0.1");

        // Set the contract network. Allow only network contracts to communicate each other.
        await ds.connect(admin).setStorageLive();
        expect(await ds.getStorageStatus()).to.be.true;
      });
    
      it("Deposit should revert if the depositCompliance is not satisfied", async function () {
        /// @dev While testing, the Paused Pool Status has been moved to the end of the require set.
        arbitratyDeposit = ethers.utils.parseEther("0.5");

        rewardsInterval = ethers.BigNumber.from("7"); // (days)
        rewardsInterest = ethers.BigNumber.from("1000");
        contrLimit = ethers.utils.parseEther("0.4");
        minContr = ethers.utils.parseEther("0.6");

        poolMaxSize = ethers.utils.parseEther("0.4");

        // Reversals:
        // Days Interval
        expect(pc.connect(userA).deposit({value: arbitratyDeposit})).to.be.revertedWith("The team needs to set a reward interval.");
        await pb.connect(admin).setRewardsInterval(rewardsInterval);

        // Rewards Ratio
        expect(pc.connect(userA).deposit({value: arbitratyDeposit})).to.be.revertedWith("The team needs to set a reward ratio.");
        await pb.connect(admin).setRewardsInterest(rewardsInterest);

        // Contribution Limit Set
        expect(pc.connect(userA).deposit({value: arbitratyDeposit})).to.be.revertedWith("The team needs to set a contribution limit.");
        await pb.connect(admin).setContributionLimit(contrLimit);

        // Contribution Limit Excess
        expect(pc.connect(userA).deposit({value: arbitratyDeposit})).to.be.revertedWith("Max. current contribution limit exceeded.");
        let newLimit = ethers.utils.parseEther("10");
        await pb.connect(admin).setContributionLimit(newLimit);

        // Min Contr. Limit
        await pb.connect(admin).setMinContribution(minContr);
        expect(pc.connect(userA).deposit({value: arbitratyDeposit})).to.be.revertedWith("Value to deposit needs to be higher than the current minimum contribution limit.");
        let newMin = ethers.utils.parseEther("0.1");
        await pb.connect(admin).setMinContribution(newMin);

        // Max. Pool Size
        await pb.connect(admin).setPoolMaxSize(poolMaxSize);
        expect(pc.connect(userA).deposit({value: arbitratyDeposit})).to.be.revertedWith("Max. Pool size overflow with that amount of deposit.");
        let newPoolSize = ethers.utils.parseEther("100");
        await pb.connect(admin).setPoolMaxSize(newPoolSize);  

        // Pause
        expect(pc.connect(userA).deposit({value: arbitratyDeposit})).to.be.revertedWith("The pool is currently paused");
        await pb.connect(admin).setPoolLive(true);  
        
        // Check that the ETH balance deducts from UserA (just checking that the call goes through the modifier).
        // This estimation does not consider the gas spent (thus the rounding).
        arbitratyDeposit = ethers.utils.parseEther("1");
        let userAInitialBalance = ethers.utils.formatEther(await provider.getBalance(walletAddresses[1]));
        userAInitialBalance = Math.round(Number(userAInitialBalance));

        let formatedDeposit = ethers.utils.formatEther(arbitratyDeposit);
        formatedDeposit = Math.round(Number(formatedDeposit));

        await pc.connect(userA).deposit({value: arbitratyDeposit});

        let userAFinalBalance = ethers.utils.formatEther(await provider.getBalance(walletAddresses[1]));
        userAFinalBalance = Math.round(Number(userAFinalBalance));

        expect((userAInitialBalance-formatedDeposit)).to.be.eq(userAFinalBalance);
      });

      it("Should mint 1:1 rwETH on deposit", async function () {
        await pb.connect(admin).setPoolMaxSize(poolMaxSize);
        await pb.connect(admin).setRewardsInterval(rewardsInterval);
        await pb.connect(admin).setRewardsInterest(rewardsInterest);
        await pb.connect(admin).setContributionLimit(contrLimit);
        await pb.connect(admin).setMinContribution(minContr);
        await pb.connect(admin).setPoolLive(true);  

        // Pool Empty (1:1 exchange rate).
        arbitratyDeposit = ethers.utils.parseEther("1");
        await pc.connect(walletAccounts[1]).deposit({value: arbitratyDeposit});
        expect(await rweth.balanceOf(walletAddresses[1])).to.be.eq(arbitratyDeposit)
      });
      
      it("Should allow only the team to calculate and inject rewards", async function () {
        await pb.connect(admin).setPoolMaxSize(poolMaxSize);
        await pb.connect(admin).setRewardsInterval(rewardsInterval);
        await pb.connect(admin).setRewardsInterest(rewardsInterest);
        await pb.connect(admin).setContributionLimit(contrLimit);
        await pb.connect(admin).setMinContribution(minContr);
        await pb.connect(admin).setPoolLive(true);  

        // Pool Empty (1:1 exchange rate). Generate a pool balance of 1 ether. UserA deposits.
        arbitratyDeposit = ethers.utils.parseEther("1");
        await pc.connect(walletAccounts[1]).deposit({value: arbitratyDeposit});
        expect(await rweth.balanceOf(walletAddresses[1])).to.be.eq(arbitratyDeposit)

        // The team injects rewards and then userB comes to invest.
        // Adding Manager
        let poolManagerRole = await pb.POOL_MANAGER();
        await pc.connect(admin).addPoolManager(walletAddresses[4]);
        await pb.connect(admin).addPoolManager(walletAddresses[4]);
        assert.isTrue(await pc.hasRole(poolManagerRole, walletAddresses[4]) , "Caller lacks manager permissions");

        // Checking non-team reversal (admin, first array item; manager, last one).
        for (let index = 1; index < walletAccounts.length-1; index++) {
          expect(pc.connect(walletAccounts[index]).calculateRewards()).to.be.reverted;
        }   

        expect(pc.connect(walletAccounts[4]).calculateRewards()).to.be.revertedWith("The pool is currently live.");
        await pb.connect(walletAccounts[4]).setPoolLive(false);
      
        // Checking the rewards calculus
        await pc.connect(walletAccounts[4]).calculateRewards();
        let rewardsToInject = await pc.connect(walletAccounts[4]).getRewardsToInject();
        let etherStaked = await tb.getTotalEtherStaked(); 
        let decimals = (ethers.BigNumber.from("10")).pow(6)
        let rewardsCalculated  = etherStaked.mul(rewardsInterest).div(decimals);
        expect(rewardsToInject).to.be.eq(rewardsCalculated);

        // Testing injection reversal
        await pb.connect(walletAccounts[4]).setPoolLive(true);
        expect(pc.connect(walletAccounts[4]).rewardsInjector({value: rewardsToInject})).to.be.revertedWith("The pool is currently live.");
        await pb.connect(walletAccounts[4]).setPoolLive(false);
        expect(pc.connect(walletAccounts[4]).rewardsInjector({value: 1})).to.be.revertedWith("Invalid ether interest injected.");

        // Inject Rewards
        await pc.connect(walletAccounts[4]).rewardsInjector({value: rewardsToInject});
        // Check total_ether_staked Storage State
        // Tokenflow: User --> PoolClient --> PoolVault
        etherStaked = await tb.getTotalEtherStaked();
        let vaultBalance = await provider.getBalance(contractsAddresses[4]); // Balance of PoolVault
        let clientBalance = await provider.getBalance(contractsAddresses[5]); // Balance of PoolClient
        expect(arbitratyDeposit.add(rewardsToInject)).to.be.eq(etherStaked);
        expect(arbitratyDeposit.add(rewardsToInject)).to.be.eq(vaultBalance);
        expect(0).to.be.eq(clientBalance);

      });

      it("Should reprice rwETH on deposit after rewards injection", async function () {
        await pb.connect(admin).setPoolMaxSize(poolMaxSize);
        await pb.connect(admin).setRewardsInterval(rewardsInterval);
        await pb.connect(admin).setRewardsInterest(rewardsInterest);
        await pb.connect(admin).setContributionLimit(contrLimit);
        await pb.connect(admin).setMinContribution(minContr);
        await pb.connect(admin).setPoolLive(true);  

        // Pool Empty (1:1 exchange rate). Generate a pool balance of 1 ether. UserA deposits.
        arbitratyDeposit = ethers.utils.parseEther("1");
        await pc.connect(walletAccounts[1]).deposit({value: arbitratyDeposit});

        // The team injects rewards and then userB comes to invest.
        // Adding Manager
        let poolManagerRole = await pb.POOL_MANAGER();
        await pc.connect(admin).addPoolManager(walletAddresses[4]);
        await pb.connect(admin).addPoolManager(walletAddresses[4]);
        await pb.connect(walletAccounts[4]).setPoolLive(false);
      
        // Checking the rewards calculus
        await pc.connect(walletAccounts[4]).calculateRewards();
        let rewardsToInject = await pc.connect(walletAccounts[4]).getRewardsToInject();
        let etherStaked = await tb.getTotalEtherStaked(); 
        let decimals = (ethers.BigNumber.from("10")).pow(6)
        let rewardsCalculated  = etherStaked.mul(rewardsInterest).div(decimals);
        expect(rewardsToInject).to.be.eq(rewardsCalculated);

        // Inject Rewards
        await pc.connect(walletAccounts[4]).rewardsInjector({value: rewardsToInject});

        /* 
        Once the rewards are injected, the repricing system starts to work when userB deposits.
        With the repricing, the time on which each user deposits and withdraws depends 
        on the exchange rate of the reward token. Thus, if the user B wants to deposit and withdraw
        at this moment, he will only lose gas fees and no interests will be perceived.        
        */
        await pb.connect(walletAccounts[4]).setPoolLive(true);
        arbitratyDeposit = ethers.utils.parseEther("2"); //
        await pc.connect(walletAccounts[2]).deposit({value: arbitratyDeposit});
        // expect(await rweth.balanceOf(walletAddresses[2])).to.be.eq(arbitratyDeposit) // This wont work because there is no 1:1 ex rate anymore,
        let rwCalculated  = await rweth.calcRwEthValue(arbitratyDeposit);
        //console.log(ethers.utils.formatEther(rwCalculated), ethers.utils.formatEther(await rweth.balanceOf(walletAddresses[2])));
        expect(await rweth.balanceOf(walletAddresses[2])).to.be.eq(rwCalculated);
      });

      it("Should allow each user to withdraw their funds and interests (if applies)", async function () {
        await pb.connect(admin).setPoolMaxSize(poolMaxSize);
        await pb.connect(admin).setRewardsInterval(rewardsInterval);
        await pb.connect(admin).setRewardsInterest(rewardsInterest);
        await pb.connect(admin).setContributionLimit(contrLimit);
        await pb.connect(admin).setMinContribution(minContr);
        await pb.connect(admin).setPoolLive(true);  

        // Fill the pool with deposits.
        let userADeposit = ethers.utils.parseEther("1");
        let userBDeposit = ethers.utils.parseEther("3");
        await pc.connect(walletAccounts[1]).deposit({value: userADeposit});
        await pc.connect(walletAccounts[2]).deposit({value: userBDeposit});

        // Inject interests.
        await pb.connect(walletAccounts[0]).setPoolLive(false);
        await pc.connect(walletAccounts[0]).calculateRewards();
        let rewardsToInject = await pc.connect(walletAccounts[0]).getRewardsToInject();
        await pc.connect(walletAccounts[0]).rewardsInjector({value: rewardsToInject});

        await pb.connect(walletAccounts[0]).setPoolLive(true);

        // UserA invests again (gets repriced rwEth back).
        let initialABalance = await rweth.balanceOf(walletAddresses[1]);
        userADeposit = ethers.utils.parseEther("2");
        await pc.connect(walletAccounts[1]).deposit({value: userADeposit});
        let finalABalance = await rweth.balanceOf(walletAddresses[1]);
        let rwCalculated  = await rweth.calcRwEthValue(userADeposit);
        expect(finalABalance.sub(initialABalance)).to.be.eq(rwCalculated); // UserA already had a rewardETH balance from before.

        // UserB withdraws ether and their interests (due to repricing).
        let hugeAmount = ethers.utils.parseEther("100");
        expect(pc.connect(walletAccounts[2]).withdraw(hugeAmount)).to.be.revertedWith("You don't have that amount of tokens on your account.");
       
        // initial states
        let initialBBalance = await rweth.balanceOf(walletAddresses[2]);
        let totalRwSupply0 = await rweth.totalSupply();
        let contractRwSupplyControl0 = await tb.getTotalrwEthSupply();

        await pc.connect(walletAccounts[2]).withdraw(initialBBalance);

        // final states
        let finalBBalance = await rweth.balanceOf(walletAddresses[2]);
        let totalRwSupply1 = await rweth.totalSupply();
        let contractRwSupplyControl1 = await tb.getTotalrwEthSupply();

        expect(finalBBalance).to.be.eq(0);
        expect(totalRwSupply1.sub(totalRwSupply0)).to.be.eq(initialBBalance);
        expect(contractRwSupplyControl1.sub(contractRwSupplyControl0)).to.be.eq(initialBBalance);
        
    
      
      });




    // describe("Contract Operations", function () {
    //   beforeEach(async() => {
    //     // Set base pool variables to test other behaviors.
    //     poolMaxSize = ethers.utils.parseEther("1000");
    //     rewardsInterval = ethers.BigNumber.from("7"); // (days)
    //     rewardsInterest = ethers.BigNumber.from("1000");
    //     contrLimit = ethers.utils.parseEther("5");
    //     minContr = ethers.utils.parseEther("0.1");
    //    

    //     await pb.connect(admin).setPoolMaxSize(poolMaxSize);
    //     await pb.connect(admin).setRewardsInterval(rewardsInterval);
    //     await pb.connect(admin).setRewardsInterest(rewardsInterest);
    //     await pb.connect(admin).setContributionLimit(contrLimit);
    //     await pb.connect(admin).setMinContribution(minContr);
    //     
    //   });
    // });

  });



});

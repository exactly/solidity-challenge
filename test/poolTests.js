const { expect } = require("chai");
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
  let poolFees;

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

    contracts = [ds, tb, rweth, pv, pc, pb];
    contractsAddresses = (contracts.map((item) => {return item.address;}));
    contractNames = ["DataStorage", "TokenBalances", "rwETHToken", "PoolVault", "PoolClient", "PoolBase"];

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
        expect(await pb.getPoolBaseAddress()).to.be.eq(contractsAddresses[5]);
        expect(await pb.getPoolState()).to.be.true;
        expect(await pb.getPoolMaxSize()).to.be.eq(poolMaxSize);
      // PoolClient: Call a getter. Checking non reversal.
        expect(await pc.connect(admin).getRewardsToInject()).to.be.eq(0);
        expect(await pb.getPoolClientAddress()).to.be.eq(contractsAddresses[4]);
      // PoolVault: Call a getter. Checking non reversal.
      expect(await pb.getPoolVaultAddress()).to.be.eq(contractsAddresses[3]);
      // rwETHToken : Call a getter. Checking non reversal.
      expect(await pb.getRwETHTokenAddress()).to.be.eq(contractsAddresses[2]);              


    });

  });

  describe("PoolBase Contract", function () {

    describe("Setting Environmental Variables", function () {

      it("Should allow only the Admin on first place to setup the settings of the pool", async function () {
        // Set base pool variables to test other behaviors.
        poolMaxSize = ethers.utils.parseEther("1000");
        rewardsInterval = ethers.BigNumber.from("7"); // (days)
        rewardsInterest = ethers.BigNumber.from("1000");
        contrLimit = ethers.utils.parseEther("5");
        minContr = ethers.utils.parseEther("0.1");
        poolFees = ethers.BigNumber.from("500");

        expect(pb.connect(nonUser).setPoolMaxSize(poolMaxSize)).to.be.reverted;
        expect(pb.connect(nonUser).setRewardsInterval(rewardsInterval)).to.be.reverted;
        expect(pb.connect(nonUser).setRewardsInterest(rewardsInterest)).to.be.reverted;
        expect(pb.connect(nonUser).setContributionLimit(contrLimit)).to.be.reverted;
        expect(pb.connect(nonUser).setMinContribution(minContr)).to.be.reverted;
        expect(pb.connect(nonUser).setPoolFees(poolFees)).to.be.reverted;

        await pb.connect(admin).setPoolMaxSize(poolMaxSize);
        await pb.connect(admin).setRewardsInterval(rewardsInterval);
        await pb.connect(admin).setRewardsInterest(rewardsInterest);
        await pb.connect(admin).setContributionLimit(contrLimit);
        await pb.connect(admin).setMinContribution(minContr);
        await pb.connect(admin).setPoolFees(poolFees);

        expect(await pb.getPoolMaxSize()).to.be.eq(poolMaxSize);
        expect(await pb.getRewardsInterval()).to.be.eq(rewardsInterval);
        expect(await pb.getRewardsInterest()).to.be.eq(rewardsInterest);
        expect(await pb.getContributionLimit()).to.be.eq(contrLimit);
        expect(await pb.getMinContribution()).to.be.eq(minContr);
        expect(await pb.getPoolFees()).to.be.eq(poolFees);
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
        poolFees = ethers.BigNumber.from("500");

        let poolManagerRole = await pb.POOL_MANAGER();
        await pb.connect(admin).addPoolManager(walletAddresses[4]);
        expect(await pb.hasRole(poolManagerRole, walletAddresses[4])).to.be.true;

        await pb.connect(manager).setPoolMaxSize(poolMaxSize);
        await pb.connect(manager).setRewardsInterval(rewardsInterval);
        await pb.connect(manager).setRewardsInterest(rewardsInterest);
        await pb.connect(manager).setContributionLimit(contrLimit);
        await pb.connect(manager).setMinContribution(minContr);
        await pb.connect(manager).setPoolFees(poolFees);

        expect(await pb.getPoolMaxSize()).to.be.eq(poolMaxSize);
        expect(await pb.getRewardsInterval()).to.be.eq(rewardsInterval);
        expect(await pb.getRewardsInterest()).to.be.eq(rewardsInterest);
        expect(await pb.getContributionLimit()).to.be.eq(contrLimit);
        expect(await pb.getMinContribution()).to.be.eq(minContr);
        expect(await pb.getPoolFees()).to.be.eq(poolFees);
      });

    });


  });



});

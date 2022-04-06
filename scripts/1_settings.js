const { ethers } = require("hardhat");
const { expect } = require("chai");
const Settings = require("../config/settings.json");
const pbDeployData = require("../artifacts/contracts/PoolBase.sol/PoolBase.json");
require("dotenv").config();

// Setup the pool settings.
async function setup() {
    
    let networkIndex = Settings.networkIndex;
    let admin;
    let provider;
    let pbContract;

    const pbAddress = Settings.poolBaseAddress;
    let poolMaxSize = ethers.utils.parseEther(Settings.poolMaxEtherSize);
    let rewardsInterval = ethers.BigNumber.from(Settings.rewardsInterval);
    let rewardsInterest = ethers.BigNumber.from(Settings.rewardsInterest);
    let contrLimit = ethers.utils.parseEther(Settings.contrLimit);
    let minContr = ethers.utils.parseEther(Settings.minContr);     

    // LocalHost 
    if (networkIndex === 0) {
        provider = ethers.providers.getDefaultProvider("http://localhost:8545");
        admin = new ethers.Wallet(process.env.HARDHAT_PRIVATE_KEY, provider);
    }

    // Ropsten 
    if (networkIndex === 1) {
        provider = new ethers.providers.AlchemyProvider("ropsten", process.env.ALCHEMY_ROPSTEN_KEY)
        admin = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    }  

    console.log("Setting up the pool settings with: ", admin.address);
    const pb = new ethers.Contract(
        pbAddress,
        pbDeployData.abi,
        admin
    );
    
    // Set the Pool Settings
    let gasLimit = ethers.BigNumber.from("100000"); // AVG consumption estimated around 50k. Just to be sure...
    await pb.connect(admin).setPoolMaxSize(poolMaxSize, {gasLimit: gasLimit});
    await pb.connect(admin).setRewardsInterval(rewardsInterval, {gasLimit: gasLimit});
    await pb.connect(admin).setRewardsInterest(rewardsInterest, {gasLimit: gasLimit});
    await pb.connect(admin).setContributionLimit(contrLimit, {gasLimit: gasLimit});
    await pb.connect(admin).setMinContribution(minContr, {gasLimit: gasLimit});  

    // Check that the settings were applied
    let getPoolMaxSize = await pb.getPoolMaxSize();
    let getRewardsInterval = await pb.connect(admin).getRewardsInterval();
    let getRewardsInterest = await pb.connect(admin).getRewardsInterest();
    let getContLimit = await pb.connect(admin).getContributionLimit();
    let getMinContr = await pb.connect(admin).getMinContribution();

    expect(getPoolMaxSize).to.be.eq(poolMaxSize);
    expect(getRewardsInterval).to.be.eq(rewardsInterval);
    expect(getRewardsInterest).to.be.eq(rewardsInterest);
    expect(getContLimit).to.be.eq(contrLimit);
    expect(getMinContr).to.be.eq(minContr);
    console.log("All settings were applied successfully.");
}



setup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
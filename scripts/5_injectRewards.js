const { ethers } = require("hardhat");
const { expect } = require("chai");
const Settings = require("../config/settings.json");
const pcDeployData = require("../artifacts/contracts/PoolClient.sol/PoolClient.json");
const tbDeployData = require("../artifacts/contracts/TokenBalances.sol/TokenBalances.json");
const pbDeployData = require("../artifacts/contracts/PoolBase.sol/PoolBase.json");
require("dotenv").config();

// Injects rewards.
async function injectRewards() {
    
    let networkIndex = Settings.networkIndex;
    let admin;
    let provider;

    const pcAddress = Settings.poolClientAddress;
    const tbAddress = Settings.tokenBalancesAddress;
    const pbAddress = Settings.poolBaseAddress;

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

    console.log("Injecting rewards with: ", admin.address);

    const pc = new ethers.Contract(
        pcAddress,
        pcDeployData.abi,
        admin
    );

    const tb = new ethers.Contract(
        tbAddress,
        tbDeployData.abi,
        admin
    );

    const pb = new ethers.Contract(
        pbAddress,
        pbDeployData.abi,
        admin
    );
    
    // if the pool is live, it needs to be set as paused.
    let getPoolStatus = await pb.getPoolState();
    if (getPoolStatus) {
        await pb.connect(admin).setPoolLive(false);
    }

    // Calculating the rewards to inject
    await pc.connect(admin).calculateRewards();
    let calculatedRew = await pc.getRewardsToInject();
    console.log(`${ethers.utils.formatEther(calculatedRew)} ether to be injected.`);

    // Calculate the rewards injected so far
    let previousInjetions = await tb.getTotalRewardsInjected();

    // Inject the rewards
    await pc.connect(admin).rewardsInjector({value: calculatedRew});
    
    // Check that the actions were applied
    let currentInjection = await tb.getTotalRewardsInjected();

    expect(previousInjetions.add(calculatedRew)).to.be.eq(currentInjection);
    calculatedRew = ethers.utils.formatEther(calculatedRew);
    let currentPoolSize = ethers.utils.formatEther(await tb.getTotalEtherStaked());
    console.log(`Injected ${calculatedRew} ether successfully into the pool.`);
    console.log(`The pool currently has ${currentPoolSize} ether locked.`);
}

injectRewards()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
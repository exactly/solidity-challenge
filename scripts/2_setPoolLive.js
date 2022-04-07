const { ethers } = require("hardhat");
const { expect } = require("chai");
const Settings = require("../config/settings.json");
const pbDeployData = require("../artifacts/contracts/PoolBase.sol/PoolBase.json");
require("dotenv").config();

// Sets the pool live and open to new deposits / withdrawals.
async function setLive() {
    
    let networkIndex = Settings.networkIndex;
    let admin;
    let provider;

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

    console.log("Setting the pool Live with: ", admin.address);

    const pb = new ethers.Contract(
        pbAddress,
        pbDeployData.abi,
        admin
    );
    
    // Set the Pool Live
    let gasLimit = ethers.BigNumber.from("100000");
    await pb.connect(admin).setPoolLive(true, {gasLimit: gasLimit});

    // Check that the settings were applied
    let getPoolStatus = await pb.getPoolState();

    expect(getPoolStatus).to.be.true;
    console.log("The pool is now live.");
}



setLive()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const { ethers } = require("hardhat");
const { expect } = require("chai");
const Settings = require("../config/settings.json");
const dsDeployData = require("../artifacts/contracts/dataStorage.sol/dataStorage.json");
require("dotenv").config();

// Set the storage live and seal the pool.
async function setStorageLive() {
    
    let networkIndex = Settings.networkIndex;
    let admin;
    let provider;

    const dsAddress = Settings.dataStorageAddress;

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

    console.log("Setting the storage live with: ", admin.address);
    const ds = new ethers.Contract(
        dsAddress,
        dsDeployData.abi,
        admin
    );
    
    // Set the Pool Settings
    await ds.connect(admin).setStorageLive();


    console.log("Storage is now live and the contract network is sealed.");
}



setStorageLive()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
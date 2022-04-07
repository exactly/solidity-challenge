const { ethers } = require("hardhat");

const Settings = require("../config/settings.json");
require("dotenv").config();

// Injects rewards.
async function increaseTime() {
    
    let networkIndex = Settings.networkIndex;
    let provider;
    let daysToIncrease = 7;

    // LocalHost 
    if (networkIndex === 0) {
        provider = ethers.providers.getDefaultProvider("http://localhost:8545");
    }

    console.log(`Increasing ${daysToIncrease} days on the hardhat node`);
    await ethers.provider.send("evm_increaseTime", [daysToIncrease * 24 * 60 * 60]);

}

increaseTime()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
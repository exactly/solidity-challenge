const { ethers } = require("hardhat");
const { expect } = require("chai");
const Settings = require("../config/settings.json");

const tbDeployData = require("../artifacts/contracts/TokenBalances.sol/TokenBalances.json");
const pvDeployData = require("../artifacts/contracts/PoolVault.sol/PoolVault.json");
require("dotenv").config();

// Get the current Pool Balance.
async function getPoolBalance() {
    
    let networkIndex = Settings.networkIndex;
    let admin;
    let provider;

    const tbAddress = Settings.tokenBalancesAddress;
    const pvAddress = Settings.poolVaultAddress;

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

    console.log("Querying the current staking pool balance...");

    tb = new ethers.Contract(
        tbAddress,
        tbDeployData.abi,
        admin
    );

    pv = new ethers.Contract(
        pvAddress,
        pvDeployData.abi,
        admin
    );
    
    // Querying both the state variable of the pool and the data directly from the provider (must be the same).
    let getContractBalance = await provider.getBalance(pvAddress);
    let stakedBalance = await tb.getTotalEtherStaked();

    // Checking that both state variables get the same value.
    expect(getContractBalance).to.be.eq(stakedBalance);
    getContractBalance = ethers.utils.formatEther(getContractBalance);    
    console.log(`The staking pool currently has a balance of ${getContractBalance} ether.`);
}

getPoolBalance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
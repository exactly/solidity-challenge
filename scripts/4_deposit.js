const { ethers } = require("hardhat");
const { expect } = require("chai");
const Settings = require("../config/settings.json");
const pcDeployData = require("../artifacts/contracts/PoolClient.sol/PoolClient.json");
const tbDeployData = require("../artifacts/contracts/TokenBalances.sol/TokenBalances.json");
require("dotenv").config();

// Deposits ether in exchange of rwEther.
async function depositEth() {
    
    let networkIndex = Settings.networkIndex;
    let etherDeposit = "0.2";
    let admin;
    let provider;

    const pcAddress = Settings.poolClientAddress;
    const tbAddress = Settings.tokenBalancesAddress;

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

    console.log("Staking ether with: ", admin.address);

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
    
    // Deposit of the ethers (just for testing the rewards injection script purposes).
    let previousStakedEth = await tb.getTotalEtherStaked();
    let etherToDeposit = ethers.utils.parseEther(etherDeposit);
    console.log(`Trying to stake ${ethers.utils.formatEther(etherToDeposit)} ether....`); 

    let gasLimit = ethers.BigNumber.from("250000");
    let deposit = await pc.connect(admin).deposit({value: etherToDeposit, gasLimit: gasLimit});
    deposit.wait();

    let currentStakedEth = await tb.getTotalEtherStaked();

    expect(previousStakedEth.add(etherToDeposit)).to.be.eq(currentStakedEth);

    console.log(`Staked ${ethers.utils.formatEther(etherToDeposit)} ether successfully into the pool.`);
}

depositEth()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
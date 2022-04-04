require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("dotenv").config();
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
require('@nomiclabs/hardhat-ethers');

// // This is a sample Hardhat task. To learn how to create your own go to
// // https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });


module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 150,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      blockGasLimit: 30000000      // (30 MM) The gas limit per block on mainnet by Apr. 2022. 
    },
    rinkeby: {
      url: process.env.NETWORK_RINKEBY_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.NETWORK_MAINNET_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "ETH",
    coinmarketcap: process.env.GAS_REPORTER_COIN_MARKET_CAP_API_KEY !== undefined,
    gasPriceApi: process.env.ETHERSCAN_GAS_API, 
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

// To verify run:
// npx hardhat verify --constructor-args config/contractArguments.js CONTRACT_ADDRESS --network rinkeby

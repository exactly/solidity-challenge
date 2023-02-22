import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import 'solidity-coverage';
import 'hardhat-abi-exporter';
import 'hardhat-contract-sizer';
import '@openzeppelin/hardhat-upgrades'
import { HardhatUserConfig } from 'hardhat/config';
import dotenv from 'dotenv';

dotenv.config();

let deployAccountKey: string;
if (!process.env.DEPLOY_ACCOUNT_KEY) {
  throw new Error("Please set your DEPLOY_ACCOUNT_KEY in a .env file");
} else {
  deployAccountKey = process.env.DEPLOY_ACCOUNT_KEY;
}

let alchemyapi: string;
if (!process.env.ALCHEMY_API_KEY) {
  throw new Error("Please set your ALCHEMY_API_KEY in a .env file");
} else {
  alchemyapi = process.env.ALCHEMY_API_KEY;
}

const config: HardhatUserConfig = {
  typechain: {
    target: 'ethers-v5',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      }
    ],
  },
  networks: {
    goerli: {
      accounts: [deployAccountKey],
      url: `https://eth-goerli.alchemyapi.io/v2/${alchemyapi}`,
    },
  },
  abiExporter: {
    path: "./abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  mocha: {
    timeout: 100000000
  }
};

export default config;

require("@nomiclabs/hardhat-waffle");

require("@nomiclabs/hardhat-web3");

// Automatic verification on etherscan, bscscan and others
// command: npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS
require("@nomiclabs/hardhat-etherscan");

// command: npx hardhat coverage
require("solidity-coverage");

// Writes bytecode sizes of smart contracts
require("hardhat-contract-sizer");

// Writes information of gas usage in tests
require("hardhat-gas-reporter");

// Exports smart contract ABIs on compilation
require("hardhat-abi-exporter");

// Writes SPDX License Identifier into sol files
// Type of license it takes from package.json
require("hardhat-spdx-license-identifier");

// command: npx hardhat check
require("@nomiclabs/hardhat-solhint");

// Prints events when running tests
// command: npx hardhat test --logs
require("hardhat-tracer");

let config = require("./config.js");

module.exports = {
    defaultNetwork: 'rinkeby',
    networks: {
        hardhat: {},
        ethereumMainnet: {
            url: "https://rinkeby.infura.io/v3/" + config.infuraIdProject,
            accounts: config.mainnetAccounts,
        },
        ropsten: {
            url: "https://ropsten.infura.io/v3/" + config.infuraIdProject,
            accounts: config.testnetAccounts,
        },
        kovan: {
            url: "https://kovan.infura.io/v3/" + config.infuraIdProject,
            accounts: config.testnetAccounts,
        },
        rinkeby: {
            url: "https://rinkeby.infura.io/v3/" + config.infuraIdProject,
            accounts: config.testnetAccounts,
        },
        goerli: {
            url: "https://goerli.infura.io/v3/" + config.infuraIdProject,
            accounts: config.testnetAccounts,
        },
        bscMainnet: {
            url: "https://bsc-dataseed3.binance.org",
            accounts: config.mainnetAccounts,
        },
        bscTestnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            accounts: config.testnetAccounts,
        },
        polygonMainnet: {
            url: "https://rpc-mainnet.maticvigil.com",
            accounts: config.mainnetAccounts,
        },
        polygonTestnet: {
            url: "https://matic-mumbai.chainstacklabs.com",
            accounts: config.testnetAccounts,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.0",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            /* {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            }, */
        ],
    },
    mocha: {
        timeout: 100000,
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
    },
    gasReporter: {
        currency: "USD",
        coinmarketcap: config.coinmarketcapApi,
    },
    abiExporter: {
        path: "./data/abi",
        clear: true,
        flat: true,
        spacing: 2,
    },
    spdxLicenseIdentifier: {
        overwrite: false,
        runOnCompile: true,
    },
    etherscan: {
        apiKey: config.apiKey
    }
};

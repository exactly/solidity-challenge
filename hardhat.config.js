require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  // defaultNetwork: "hardhat",

  networks: {

    hardhat: {
      chainId: 1337
    },
    
     rinkeby: {
      url: process.env.RINKEBY_ALCHEMY_URL,
      accounts: [process.env.RINKEBY_PRIVATE_KEY]
     },

  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }

};

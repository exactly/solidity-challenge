require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


module.exports = {
  solidity: "0.8.9",
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

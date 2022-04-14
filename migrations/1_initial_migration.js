const Migrations = artifacts.require("Migrations");

module.exports = function (deployer, network, accounts) {
  console.log(accounts)
  if (network == 'ropsten' || network == 'rinkeby') {
    deployer.deploy(Migrations, { from: accounts[1] });
  }
  else {
    deployer.deploy(Migrations);
  }
};

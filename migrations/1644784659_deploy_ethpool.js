const ETHpool = artifacts.require('ETHpool');

module.exports = function (deployer, network, accounts) {
  // Use deployer to state migration tasks.
  console.log(accounts)
  if (network == 'ropsten' || network == 'rinkeby') {
    deployer.deploy(ETHpool, { from: accounts[1] });
  }
  else {
    deployer.deploy(ETHpool);
  }
};
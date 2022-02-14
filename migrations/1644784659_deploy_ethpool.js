const ETHpool = artifacts.require('ETHpool');
 
module.exports = function(deployer) {
  // Use deployer to state migration tasks.
  deployer.deploy(ETHpool);
};
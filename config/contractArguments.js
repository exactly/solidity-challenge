const {ethers} = require("hardhat");
const contractArguments = require("./settings.json");

module.exports = [
    ethers.utils.getAddress(contractArguments.dataStorageAddress),
];

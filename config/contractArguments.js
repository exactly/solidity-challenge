const {ethers} = require("hardhat");
const contractArguments = require("./settings.json");

module.exports = [
    contractArguments.dataStorageAddress,
];

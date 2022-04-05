const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const DS = await ethers.getContractFactory("DataStorage");
  const ds = await DS.deploy();
  await ds.deployed();

  // Deploying TokenBalances Contract (tb):
  const TB = await ethers.getContractFactory("TokenBalances");
  const tb = await TB.deploy(ds.address);
  await tb.deployed();

  // Deploying rwETHToken Contract (rwETH):
  const rwETH = await ethers.getContractFactory("rwETHToken");
  const rweth = await rwETH.deploy(ds.address);
  await rweth.deployed();

  // Deploying PoolVault Contract (pv):
  const PV = await ethers.getContractFactory("PoolVault");
  const pv = await PV.deploy(ds.address);
  await pv.deployed();

  
  // Deploying PoolClient Contract (pc):
  const PC = await ethers.getContractFactory("PoolClient");
  const pc = await PC.deploy(ds.address);
  await pc.deployed();

  // Deploying PoolBase Contract (pb):
  const PB = await ethers.getContractFactory("PoolBase");
  const pb = await PB.deploy(ds.address);

  contracts = [ds, pb, tb, rweth, pv, pc];
  contractNames = ["DataStorage", "PoolBase", "TokenBalances", "rwETHToken", "PoolVault", "PoolClient"];

  for (let index = 0; index < contracts.length; index++) {
    console.log(`${contractNames[index]} deployed with address: `, contracts[index].address);
  }
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
import fs from 'fs';
import { ethers, network } from "hardhat";

const deploymentPath = "./deployments";
const deploymentFilePath = `${deploymentPath}/${network.name}.json`;

function writeDeployments(deployment: any) {
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath);
  }
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deployment, null, 2));
}

async function main(): Promise<void> {
  const deployment = fs.existsSync(deploymentFilePath)
    ? JSON.parse(fs.readFileSync(deploymentFilePath).toString())
    : {};

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy ETH Pool
  const ETHPool = await ethers.getContractFactory("ETHPool");
  const pool = await ETHPool.deploy();
  await pool.deployed();
  console.log("ETHPool: ", pool.address);

  deployment.ETHPool = pool.address;
  writeDeployments(deployment);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

import fs from 'fs';
import { ethers, network } from "hardhat";
import { ETHPool } from '../typechain-types';

const deploymentPath = "./deployments";
const deploymentFilePath = `${deploymentPath}/${network.name}.json`;

async function main(): Promise<void> {
  const deployment = fs.existsSync(deploymentFilePath)
    ? JSON.parse(fs.readFileSync(deploymentFilePath).toString())
    : {};

  const ethPool = <ETHPool>await ethers.getContractAt("ETHPool", deployment.ETHPool);
  const balance = await ethPool.getETHBalanceOfPool();
  console.log("ETHPool Balance:", ethers.utils.formatEther(balance));

  const providerBalance = await ethers.provider.getBalance(ethPool.address);
  console.log("ETHPool Balance:", ethers.utils.formatEther(providerBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

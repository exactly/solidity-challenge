import { ethers } from "hardhat";

async function main() {
  const ETHPool = await ethers.getContractFactory("ETHPool");
  const ethPool = await ETHPool.deploy();

  console.log("ETHPool deployed to:", ethPool.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

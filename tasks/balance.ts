import { task } from "hardhat/config";
import { abi } from "../artifacts/contracts/ETHPool.sol/ETHPool.json";
task("balance", "Fetch the contract balance and total balance")
  .addParam("address", "The contract's address")
  .setAction(async (taskArgs, { ethers }) => {
    const address = taskArgs.address;

    if ((await ethers.provider.getCode(address)) === "0x") {
      console.error("You need to deploy your contract first");
      return;
    }

    const contract = new ethers.Contract(address, abi, ethers.provider);
    const totalBalance = await contract.totalBalance();

    console.log(`Total balance of contract: ${totalBalance}`);
  });

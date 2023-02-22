import { ethers } from "hardhat";

export const latestBlockNumber = async () => {
  return await ethers.provider.getBlockNumber();
};

export const evm_increaseTime = async (seconds: number) => {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await evm_mine_blocks(1);
};

export const evm_mine_blocks = async (n: number) => {
  for (let i = 0; i < n; i++) {
    await ethers.provider.send("evm_mine", []);
  }
};

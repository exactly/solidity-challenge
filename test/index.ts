import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


describe("ETHPool", function () {
  let pool: Contract, poolAddr: string;
  
  let A: string, ASigner: SignerWithAddress;
  let B: string, BSigner: SignerWithAddress;
  let T: string, TSigner: SignerWithAddress;

  beforeEach(async function() {
    const ETHPool = await ethers.getContractFactory("ETHPool");
    pool = await ETHPool.deploy();

    await pool.deployed();
    poolAddr = pool.address;

    [TSigner, ASigner, BSigner, ] = await ethers.getSigners();
    [T, A, B] = [TSigner, ASigner, BSigner].map(sign => sign.address);
  });

  it("Team should be changed only previous team calls", async function () {
    // no team is set now. owner is T. set team with A
    await pool.changeTeam(A);
    expect(await pool.team())
      .to.equal(A);

    // team is A now. try to change team to B again. should be failed
    await expect(pool.changeTeam(B))
        .to.be.revertedWith('should be current team');

    // team is A now. try to change team with A. should be success
    await pool.connect(ASigner).changeTeam(B);
    expect(await pool.team())
      .to.equal(B);
  });

  it("Should be divided into 25% and 75%", async function () {
    await ASigner.sendTransaction({
      to: poolAddr,
      value: ethers.utils.parseEther("100")
    });
    await BSigner.sendTransaction({
      to: poolAddr,
      value: ethers.utils.parseEther("300")
    });
    await TSigner.sendTransaction({
      to: poolAddr,
      value: ethers.utils.parseEther("200")
    });

    expect(await pool.currentRewards(A))
      .to.equal(ethers.utils.parseEther("50"));
    expect(await pool.currentRewards(B))
      .to.equal(ethers.utils.parseEther("150"));
  });

  it("Should be reward to only A", async function () {
    await ASigner.sendTransaction({
      to: poolAddr,
      value: ethers.utils.parseEther("100")
    });
    await TSigner.sendTransaction({
      to: poolAddr,
      value: ethers.utils.parseEther("200")
    });
    await BSigner.sendTransaction({
      to: poolAddr,
      value: ethers.utils.parseEther("300")
    });

    expect(await pool.currentRewards(A))
      .to.equal(ethers.utils.parseEther("200"));
    expect(await pool.currentRewards(B))
      .to.equal(ethers.utils.parseEther("0"));
  });
});

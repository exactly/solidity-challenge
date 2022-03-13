import { expect } from 'chai'
import { ethers } from 'hardhat'
import '@nomiclabs/hardhat-ethers'

import { ETHPool__factory, ETHPool } from '../build/types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const { getContractFactory, getSigners } = ethers

describe('ETHPool', async () => {
  let ETHPool: ETHPool
  let signers: SignerWithAddress[];
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  beforeEach(async () => {
    signers = await getSigners();
    alice = signers[1];
    bob = signers[2];
    carol = signers[3];
    const ethpoolFactory = (await getContractFactory('ETHPool', signers[0])) as ETHPool__factory;
    ETHPool = await ethpoolFactory.deploy();
    await ETHPool.deployed();
  })
  describe('Team', async () => {
    it('should reject not-owner rewards', async () => {
      const options = {value: ethers.utils.parseEther("100.0")}
      await expect( ETHPool.connect(alice).functions.depositRewards(options)).to.be.reverted;
    })
  }),  
  describe('User', async ()=> {
    it('should accept deposits from users', async () => {
      const options = {value: ethers.utils.parseEther("100.0")}
      await ETHPool.connect(alice).functions.deposit(options);
      expect(await ethers.provider.getBalance(ETHPool.address)).to.eq(ethers.utils.parseEther("100.0"));
    }),

    it('should accept withdrawals from users', async () => {
      const options = {value: ethers.utils.parseEther("0.9")}
      await ETHPool.connect(alice).functions.deposit(options);
      await ETHPool.connect(alice).functions.withdraw();
      expect(await ethers.provider.getBalance(ETHPool.address)).to.eq(ethers.utils.parseEther("0.0"));
    }), 

    it('should reject withdrawls without deposit', async () => {
      await expect( ETHPool.connect(alice).functions.withdraw()).to.be.reverted;
    }),

    it('should give rewards to alice', async () => {
      // A deposits =>  T deposits
      // B deposits, A withraws, B withdraws
      const options = {value: ethers.utils.parseEther("10.0")}
      await expect(await ETHPool.connect(alice).functions.deposit(options)).to.changeEtherBalance(alice, ethers.utils.parseEther("-10.0") );
      await ETHPool.functions.depositRewards({value: ethers.utils.parseEther("1.0")});
      await expect(await ETHPool.connect(bob).functions.deposit(options)).to.changeEtherBalance(bob, ethers.utils.parseEther("-10.0") );
      await expect(await ETHPool.connect(alice).functions.withdraw()).to.changeEtherBalance(alice, ethers.utils.parseEther("11.0") );
      await expect(await ETHPool.connect(bob).functions.withdraw()).to.changeEtherBalance(bob, ethers.utils.parseEther("10.0") );
    }),

    it('should split rewards 25% alice and 75% bob ', async () => {
      // A deposits, B deposits =>  T deposits
      // A withraws, B withdraws
      await expect(await ETHPool.connect(alice).functions.deposit({value: ethers.utils.parseEther("25.0")})).to.changeEtherBalance(alice, ethers.utils.parseEther("-25.0") );
      await expect(await ETHPool.connect(bob).functions.deposit({value: ethers.utils.parseEther("75.0")})).to.changeEtherBalance(bob, ethers.utils.parseEther("-75.0") );
      await ETHPool.functions.depositRewards({value: ethers.utils.parseEther("100.0")});
      await expect(await ETHPool.connect(alice).functions.withdraw()).to.changeEtherBalance(alice, ethers.utils.parseEther("50.0") );
      await expect(await ETHPool.connect(bob).functions.withdraw()).to.changeEtherBalance(bob, ethers.utils.parseEther("150.0") );
    }),

    it('should not give double rewards', async () => {
      // A deposits, A deposits =>  T deposits
      // A withraws
      await expect(await ETHPool.connect(alice).functions.deposit({value: ethers.utils.parseEther("2.0")})).to.changeEtherBalance(alice, ethers.utils.parseEther("-2.0") );
      await expect(await ETHPool.connect(alice).functions.deposit({value: ethers.utils.parseEther("2.0")})).to.changeEtherBalance(alice, ethers.utils.parseEther("-2.0") );
      await ETHPool.functions.depositRewards({value: ethers.utils.parseEther("100.0")});
      await expect(await ETHPool.connect(alice).functions.withdraw()).to.changeEtherBalance(alice, ethers.utils.parseEther("104.0") );
    })

    it('should give correct rewards after some rewards cycles', async () => {
      // A deposits =>  T deposits
      // B deposits =>  T deposits 
      // A deposits, C deposits => T deposits
      // A withraws
      await expect(await ETHPool.connect(alice).functions.deposit({value: ethers.utils.parseEther("100.0")})).to.changeEtherBalance(alice, ethers.utils.parseEther("-100.0") );
      await ETHPool.functions.depositRewards({value: ethers.utils.parseEther("100.0")});
      await expect(await ETHPool.connect(bob).functions.deposit({value: ethers.utils.parseEther("100.0")})).to.changeEtherBalance(bob, ethers.utils.parseEther("-100.0") );
      await ETHPool.functions.depositRewards({value: ethers.utils.parseEther("100.0")});
      await expect(await ETHPool.connect(alice).functions.deposit({value: ethers.utils.parseEther("100.0")})).to.changeEtherBalance(alice, ethers.utils.parseEther("-100.0") );
      await expect(await ETHPool.connect(carol).functions.deposit({value: ethers.utils.parseEther("100.0")})).to.changeEtherBalance(carol, ethers.utils.parseEther("-100.0") );
      await ETHPool.functions.depositRewards({value: ethers.utils.parseEther("100.0")});
      await expect(await ETHPool.connect(alice).functions.withdraw()).to.changeEtherBalance(alice, ethers.utils.parseEther("400.0") );
    })
  })
})

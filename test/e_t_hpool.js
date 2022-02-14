const ETHpool = artifacts.require("ETHpool");
const truffleAssert = require('truffle-assertions');


/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */


contract("ETHpool", function (accounts) {
  it("Should return the list of accounts", async () => {
    console.log(accounts);
  });

  let instance;
  beforeEach('Should setup the contract instance', async () => {
    instance = await ETHpool.deployed();
  });

  it("Should return the name", async () => {
    const value = await instance.name();
    assert.equal(value, 'ETHPool');
  });

  /*
  it("should return change the name", async () => {
    await instance.changeName('your name');
    const value = await instance.getName();

    assert.equal(value, 'your name');
  });

  it('should execute only by the owner', async () => {
    await instance.changeName('modifier');
    const value = await instance.getName();

    assert.equal(value, 'modifier');
  })
  */

  it('Test case from Exactly Github: A->100, B->300 ,T->200 ... A->150, B->450'
    , async () => {

      var accountA = accounts[1]
      var accountB = accounts[2]
      var accountT = accounts[0]

      //A -> 100
      const stakeFromA = await instance.Stake({
        'from': accountA,
        'value': web3.toWei(100, "gwei")
      });
      const poolStatusA = await instance.poolStatus()
      assert.equal(poolStatusA.poolBalance, web3.toWei(100, "gwei"));

      //B -> 300
      const stakeFromB = await instance.Stake({
        'from': accountB,
        'value': web3.toWei(300, "gwei")
      });
      const poolStatusB = await instance.poolStatus()
      assert.equal(poolStatusB.poolBalance, web3.toWei(400, "gwei"));

      //T -> 200
      const rewardFromT = await instance.Stake({
        'from': accountAT,
        'value': web3.towei(200, "gwei")
      });
      const poolStatusT = await instance.poolStatus()
      assert.equal(poolStatusT.rewardsBalance, web3.toWei(200, "gwei"));


      //A <- 150
      const withdrawA = await instance.Withdraw({
        'from': accountA
      });
      assert.equal(withdrawA, web3.toWei(150, "gwei"));

      //B <- 450
      const withdrawB = await instance.Withdraw({
        'from': accountB
      });
      assert.equal(withdrawB, web3.toWei(450, "gwei"));
    })


  it('Should fail: pausePool called by not Team members', async () => {
    await truffleAssert.reverts(instance.pausePool({
      'from': accounts[1]
    }));
  });

  it('Should fail: endPool called by not Team members', async () => {
    await truffleAssert.reverts(instance.endPool({
      'from': accounts[1]
    }));
  });

  it('Should fail: resumePool called by not Team members', async () => {
    await truffleAssert.reverts(instance.resumePool({
      'from': accounts[1]
    }));
  });
});

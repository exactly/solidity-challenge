const ETHpool = artifacts.require("ETHpool");
const truffleAssert = require('truffle-assertions');

const contractName = 'ETHpool'

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */


contract(contractName, function (accounts) {
  it("Should return the list of accounts", async () => {
    console.log(accounts);
  });

  let instance;
  beforeEach('Should setup the contract instance', async () => {
    instance = await ETHpool.deployed();
  });

  it("Should return the name", async () => {
    const value = await instance.name();
    assert.equal(value, contractName)
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
      const stakeA = 100
      const stakeFromAvalue = web3.utils.toWei('' + stakeA, "gwei")
      const stakeFromA = await instance.Stake({
        'from': accountA,
        'value': stakeFromAvalue
      });
      truffleAssert.eventEmitted(stakeFromA, 'StakeEvent', (event) => {
        return event._value == stakeFromAvalue
      })
      const poolStatusA = await instance.poolStatus()
      assert.equal(poolStatusA.poolBalance, stakeFromAvalue);


      //B -> 300
      const stakeB = 300
      const stakeFromBvalue = web3.utils.toWei('' + stakeB, "gwei")
      const stakeFromB = await instance.Stake({
        'from': accountB,
        'value': stakeFromBvalue
      });
      truffleAssert.eventEmitted(stakeFromB, 'StakeEvent', (event) => {
        return event._value == stakeFromBvalue
      })
      const poolStatusB = await instance.poolStatus()
      assert.equal(poolStatusB.poolBalance, web3.utils.toWei('' + (stakeA + stakeB), "gwei"));//A+B

      //T -> 200
      const rewardT = 200
      const rewardFromTvalue = web3.utils.toWei('' + rewardT, "gwei")
      const rewardFromT = await instance.DepositRewards({
        'from': accountT,
        'value': rewardFromTvalue
      });
      truffleAssert.eventEmitted(rewardFromT, 'DepositRewardsEvent', (event) => {
        return event._rewards == rewardFromTvalue
      })
      const poolStatusT = await instance.poolStatus()
      assert.equal(poolStatusT.rewardsBalance, rewardFromTvalue);


      //A <- 150
      const withdrawA = await instance.Withdraw({
        'from': accountA
      });
      truffleAssert.prettyPrintEmittedEvents(withdrawA)
      truffleAssert.eventEmitted(withdrawA, 'WithdrawEvent', (event) => {
        //console.log("Llegó a WithdrawEvent",web3.utils.toWei(''+(stakeA+rewardT*(stakeA/(stakeA+stakeB))), "gwei"))
        //150000000000 150000000000 50000000000
        return event._value == web3.utils.toWei('' + (stakeA + rewardT * (stakeA / (stakeA + stakeB))), "gwei")
      })

      //B <- 450
      const withdrawB = await instance.Withdraw({
        'from': accountB
      });
      truffleAssert.prettyPrintEmittedEvents(withdrawB)
      truffleAssert.eventEmitted(withdrawB, 'WithdrawEvent', (event) => {
        //console.log("Llegó a WithdrawEvent",web3.utils.toWei(''+(stakeA+rewardT*(stakeA/(stakeA+stakeB))), "gwei"))
        //150000000000 150000000000 50000000000
        return event._value == web3.utils.toWei('' + (stakeB + rewardT * (stakeB / (stakeA + stakeB))), "gwei")
      })
    });

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

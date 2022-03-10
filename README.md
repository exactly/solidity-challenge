# Ether staking and get reward per week

#### Summary

ETHPool provides a service where people can deposit ETH and they will receive weekly rewards. Users must be able to take out their deposits along with their portion of rewards at any time. New rewards are deposited manually into the pool by the ETHPool team each week using a contract function.

#### Requirements

- Only the team can deposit rewards.
- Deposited rewards go to the pool of users, not to individual users.
- Users should be able to withdraw their deposits along with their share of rewards considering the time when they deposited.

Example:

> Let say we have user **A** and **B** and team **T**.
>
> **A** deposits 100, and **B** deposits 300 for a total of 400 in the pool. Now **A** has 25% of the pool and **B** has 75%. When **T** deposits 200 rewards, **A** should be able to withdraw 150 and **B** 450.
>
> What if the following happens? **A** deposits then **T** deposits then **B** deposits then **A** withdraws and finally **B** withdraws.
> **A** should get their deposit + all the rewards.
> **B** should only get their deposit because rewards were sent to the pool before they participated.

# Keep staking principle.
First week: 
- A deposit 100, B deposit 150 and T deposit 500
- A withdraw 100 + 200 = 300 
- ** B don't withdraw
- Pool Ether: 100 + 150 + 500 - 300 = 450
- B reward: 500 * 150 / 250 = 300

Second week:
- C deposit 100 and T deposit 500
- Total balance: 450 + 100 + 500 = 1050
- Then B available withdraw amount ???
- Not this: 1050 * 150 / (150 + 100) = 630

** B will be able to withdraw: 
300 + 500 * 150 / (150 + 100) = 600

Test network contract: https://rinkeby.etherscan.io/address/0x00322a7E8e774157B3f160245Ac6365ae024D9f3#code

### Test Result

```solidity
 ·-----------------|-------------·
 |  Contract Name  ·  Size (Kb)  │
 ··················|··············
 |  console        ·       0.08  │
 ··················|··············
 |  SafeMath       ·       0.08  │
 ··················|··············
 |  Staking        ·       3.05  │
 ·-----------------|-------------·

  Token test
    √ Add Admin
    √ Stake
    √ Get Pending Reward
    √ UnSake
    √ Next week
    √ Next week: Get Pending Reward

·------------------------------|---------------------------|-------------|-----------------------------·
|     Solc version: 0.8.0      ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 30000000 gas  │
·······························|···························|·············|······························
|  Methods                                                                                             │
·············|·················|·············|·············|·············|···············|··············
|  Contract  ·  Method         ·  Min        ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
·············|·················|·············|·············|·············|···············|··············
|  Staking   ·  addAdmin       ·      47394  ·      47406  ·      47400  ·            2  ·          -  │
·············|·················|·············|·············|·············|···············|··············
|  Staking   ·  depositReward  ·      54178  ·      59653  ·      56916  ·            2  ·          -  │
·············|·················|·············|·············|·············|···············|··············
|  Staking   ·  stake          ·      54877  ·      74777  ·      67210  ·            3  ·          -  │
·············|·················|·············|·············|·············|···············|··············
|  Staking   ·  unStake        ·          -  ·          -  ·      50834  ·            1  ·          -  │
·············|·················|·············|·············|·············|···············|··············
|  Deployments                 ·                                         ·  % of limit   ·             │
·······························|·············|·············|·············|···············|··············
|  Staking                     ·          -  ·          -  ·     820165  ·        2.7 %  ·          -  │
·------------------------------|-------------|-------------|-------------|---------------|-------------·

  6 passing (806ms)


```
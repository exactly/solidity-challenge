# ETHPool Hardhat Project

ETHPool provides a service where people can deposit ETH and they will receive weekly rewards. Users must be able to take out their deposits along with their portion of rewards at any time. New rewards are deposited manually into the pool by the ETHPool team each week using a contract function.

Requirements
  - Only the team can deposit rewards.
  - Deposited rewards go to the pool of users, not to individual users.
  - Users should be able to withdraw their deposits along with their share of rewards considering the time when they deposited.

Try running some of the following tasks:

```shell
npx hardhat node
npx hardhat --network hardhat test test/challenge.js
npx hardhat run scripts/deploy.js
npx hardhat verify DEPLOYED_CONTRACT_ADDRESS
npx hardhat help
```

Deployed address on ropsten testnet: 0xDD62bCA1234cAd9712a7e69a2d1a6038CacDd07a

### Comments

Build in foundry.

Some domain assumptions;
- each week is a different pool with different rewards
- week number is defined by current timestamp / (7*24*60*60)
- if you deposit 10 ether in week 1, and withdraw 10 ether in week 2, your rewards will be 0% for week 1 and 2
- if you deposit 10 ether in week 1, and withdraw 5 ether in week 2, and on week 3 you withdraw 5 ether your rewards will be 0% for week 1, (5 ether / total deposits week 2)% of rewards for week 2, and 0 for week 3
- Use WETH but send ether on withdraw and claims, it would be easier just use WETH
- didnt fully tested, it may be really buggy

### Deployed and verify on Goerli
[0x729da725cfdb6c0f240aa6c473066c76fcdec57f](https://goerli.etherscan.io/address/0x729da725cfdb6c0f240aa6c473066c76fcdec57f)

### Test coverage

100% test coverge, however it may need mor test cases

```bash
(base) ➜  exactly-solidity-challenge git:(main) ✗  forge coverage
[⠊] Compiling...
[⠒] Compiling 15 files with 0.8.4
[⠆] Solc 0.8.4 finished in 1.07s
Compiler run successful
Analysing contracts...
Running tests...
+---------------------+-----------------+-----------------+-----------------+-----------------+
| File                | % Lines         | % Statements    | % Branches      | % Funcs         |
+=============================================================================================+
| script/Deploy.s.sol | 0.00% (0/4)     | 0.00% (0/4)     | 100.00% (0/0)   | 0.00% (0/2)     |
|---------------------+-----------------+-----------------+-----------------+-----------------|
| src/ETHPool.sol     | 100.00% (87/87) | 100.00% (96/96) | 100.00% (36/36) | 100.00% (13/13) |
|---------------------+-----------------+-----------------+-----------------+-----------------|
| src/mock/WETH.sol   | 100.00% (3/3)   | 100.00% (3/3)   | 100.00% (0/0)   | 100.00% (2/2)   |
|---------------------+-----------------+-----------------+-----------------+-----------------|
| Total               | 95.74% (90/94)  | 96.12% (99/103) | 100.00% (36/36) | 88.24% (15/17)  |
+---------------------+-----------------+-----------------+-----------------+-----------------+
```

---

# Smart Contract Challenge

## A) Challenge

### 1) Setup a project and create a contract

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

#### Goal

Design and code a contract for ETHPool, take all the assumptions you need to move forward.

You can use any development tools you prefer: Hardhat, Truffle, Brownie, Solidity, Vyper.

Useful resources:

- Solidity Docs: https://docs.soliditylang.org/en/v0.8.4
- Educational Resource: https://github.com/austintgriffith/scaffold-eth
- Project Starter: https://github.com/abarmat/solidity-starter

### 2) Write tests

Make sure that all your code is tested properly

### 3) Deploy your contract

Deploy the contract to any Ethereum testnet of your preference. Keep record of the deployed address.

Bonus:

- Verify the contract in Etherscan

### 4) Interact with the contract

Create a script (or a Hardhat task) to query the total amount of ETH held in the contract.

_You can use any library you prefer: Ethers.js, Web3.js, Web3.py, eth-brownie_

### 5) Contact
If you want to apply to this position, please share your solution to our Solidity Challenge to the following email: jobs@exact.ly

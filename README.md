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

# Solution - Repricing Approach
## 0) Ropsten Verified Contracts
- DataStorage: https://ropsten.etherscan.io/address/0x5d8c2fd496A05bb68329Fe39E8A12B424D25E1b4
- PoolBase: https://ropsten.etherscan.io/address/0x601a16CEBd0E607822995B2E8407891AE6BE4bAb
- TokenBalances: https://ropsten.etherscan.io/address/0x169105b18148b45acb1d4e0354f48a17fe560629
- rwEthToken: https://ropsten.etherscan.io/address/0x0Ddf2C71Ca974A6c40A0Fb83f670029AA7D678ea
- PoolVault: https://ropsten.etherscan.io/address/0xeb69E5c8F8Bb00F683ffb9589466CD4D20325D60
- PoolClient: https://ropsten.etherscan.io/address/0xdB0210D3FdAFCAA410811D9aa7034E64dde31DdF

## B) Mockup and Project Theorical Context (click on image to enlarge)
- The interest period can be modified just by injecting rewards in a different time-range.
- The amount to inject is calculated with a contract function that takes as input the fixed interest rate for the current interest period. [Here](#tool-interest-calculator-for-a-period-of-time-takes-apy-as-input) is a simple tool to get a fast calculus of the interests.
- At the beginning, a fee was meant to be charged for each transaction with the pool. That proposal is dismissed for the pool implementation. The fee can be implicit with the current interest rate of the pool. For example, if the market is offering an average of 5% yearly yield, while giving 4.9% p.y, you are implicitly charging a 0.1% yearly.

![StakingPool](https://user-images.githubusercontent.com/97247251/161983422-de3255bb-6664-47e7-a9f8-a61e81b0a810.png)


## C) Contract Relationships Tree (click on image to enlarge)
- The displayed contracts within the mockup have been "exploded" into several modules of contracts for organization and operativeness.
- The state variables and mappings are stored in a separate module **"DataStorage"**.
- The user and the team will be only allowed to handle tokens via **"PoolClient"**.
- The team will setup the pool settings on the **PoolBase** contract. <br/>

![Staking Pool Contracts Tree drawio](https://user-images.githubusercontent.com/97247251/161981129-2f708754-9ec8-456c-bd96-d0e17aec2162.png)


## D) Usage and Deployment Inscructions
### 1) Deployment order and constuctor parameters ()
- DataStorage(), TokenBalances(_dataStorageAddress), rwETHToken(_dataStorageAddress), PoolVault(_dataStorageAddress), PoolClient(_dataStorageAddress), PoolBase(_dataStorageAddress).

### 2) Setting up the Pool
- The Admin (deployer) can add local managers to assist with the task of managing de pool. The managers added will work only on the contract from where the **addPoolManager** function was called. This helps to constraint the range of application of the managers permissions. The **addPoolManager** is available on the **PoolBase** contract and all of their childs.
- Once every pool contract is deployed, only the Admin (Storage guardian) should call dataStorage:  **setStorageLive()**.
- The team or manager needs to call from PoolBase: **setPoolMaxSize**, **setRewardsInterval**, **setRewardsInterest**, **setContributionLimit**, **setMinContribution**. Those functions can only be called if the investing pool is closed (deposits and withdrawals are halted).
- To set the pool as operational, the team or manager just needs to call **setPoolLive** from the PoolBase Contract.
- It is advised to setup also managing roles for the management of the PoolClient Contract by calling the **addPoolManager** function from the mentioned contract. 

### 2) Operating the Pool
- While being live, the users can deposit ether and getting rwEther back by calling **deposit** from the **PoolClient** contract. The amount of rwEther that they get back depends on the current locked ether and rwEther supplies (repricing). 
- Once the rewarding time has passed, the team needs to **setPoolLive** as false and call **calculateRewards** from the **PoolClient** contract. Once the rewards are calculated, they can be get by calling **getRewardsToInject** (please note that the output of this function will be a WEI value, 18 decimals).
- Afterwards, the team needs to inject the exact same amount returned from before of ether in concept of rewards into the pool by calling **rewardsInjector** (remember that the role clearances of the **PoolBase** contract are not passed through the **PoolClient**; if it is desired to call this function by a team member, their role must be assigned within this contract). 
- NOTE: When the team injects rewards the equilibrium between both ether and reward ether supplies is broken, this is when the repricing system starts to work.
- After the team injected the rewards and set the pool as live, the users can leave their tokens staking or withdraw their funds by calling **withdraw(rewards to cash out)** from the **PoolClient** contract.

## E) Security Measures Taken
- Pool contract calls can only be performed between contracts of the pool. To perform this action, the **onlyByPoolContract** modifier of the DataStorage contract, while deploying, checks that the transaction origin is the same as the one of the guardian (deployer of DataStorage). It is extremely important that the deployments are made directly by the Guardian (deployer a.k.a admin) instead of using third party contracts that may result on storing a malicious contract (tx.origin is checked). It is a key factor to setup the storage live once every contract is deployed thus not checking anymore the tx.origin as a condition. 
- Reentrancy mutex modifier has been applied into relevant functions.
- By using an ERC20 compliant model for the rwETH token, they can be transfered between accound freely. 
- In addition to the latter, no internal mapping of "amount staked by user" is performed (allowing you to get some tokens by transfer and cashing out the rewards assigned to that amount of rwEther). It is checked the user balance of the reward tokens instead. 
- The ether deposited as well as the rewards injected (more ether) are stored within a "vaulted contract" a.k.a PoolVault. No user or team member can access the funds of that contract directly. They can only be accesed by the PoolClient contract.
- While withdrawing, both payable(to).call and reentrancy mutex are combined to prevent attacks. To keep the rwEth balance, the tokens are burned.

## F) Scripts
The project provides scripts to set quickly the pool variables and perform several actions. Also, it is provided a balance getter script that not only retrieves the pool balance but also checks that the balance is the same as the one stored in the contract mapping.

## Tool: Interest Calculator for a Period of Time (takes APY as input)
https://github.com/lior-abadi/challenge/blob/main/Theory%20and%20Initial%20Mockups/Interest%20Calculator.xlsm

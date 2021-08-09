# ETHPool contract

## 1) General Contract methods:

- 1: stake(): It's a payable method, it's used to deposit ETH by the users.

- 2: notifyRewardAmount(): It's a payable method, it's used to deposit rewards and start the pool every week, it's called by the owner of the contract.

- 3: withdraw(): It's used to withdraw deposited ETH, called by the users.

- 4: getRewards():  It's used to claim the rewards, called by the users.




 
## 2) Steps to run node script to query the total amount of ETH held in the contract.

- 1: install node modules using `npm install` command

- 2: run `node index` command

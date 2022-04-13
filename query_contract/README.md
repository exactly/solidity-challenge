# exactly-private
Script to query "ETHPool" contract.

# Smart Contract Challenge


#### Summary

QueryEthPool will connect to Infura and query the ETHPool contract to know their status.
It will return data about the balance of the pool (total staked), of the rewards pool (total of rewards), the last index of pool composition, the count of rewards provided, the time of the last reward, and the status of the pool.

#### Requirements

- Python 3
- File _../.secrets_ with the mnemonics of your test wallet (Please do not commit this file)
- File _../.infurakey_ with your Infura Project ID (Please do not commit this file)
- Web3.py installed
> pip install Web3
> or
> pip install -r requirements.txt (it will install a lot of bloatware, you're noticed)


Example:

>>Exactly\exactly-private\query_contract> **py .\queryEthPool.py**
>Connected? **True**
>Balance of Wallet Test: 0.138237453946299695 ropstenETH
>Ahora vamos al contrato...
>**Pool Balance:** 0
>**Rewards Balance:** 0
>**Last Reward Multiplied:** 0
>**Rewards count:** 0
>**Last Reward Time:** 0
>**Status:** 0


_Contract verified at: https://ropsten.etherscan.io/address/0x40985d7c0357e31332860ffdea279e23ec0d5fc3#code_

### Interact with the contract

Create a script (or a Hardhat task) to query the total amount of ETH held in the contract.

_You can use any library you prefer: Ethers.js, Web3.js, Web3.py, eth-brownie_

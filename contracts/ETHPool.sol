pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract ETHPool is Context,Ownable,ReentrancyGuard {
	using SafeMath for uint256;
	using Address for address payable;

	event Deposit(address user,uint256 balance);
	event Withdraw(address user,uint256 balance);

	struct Account {
		uint256 balance;
		uint256 shares;
		uint64 lastBalanceChange;
	}

	mapping (address=>Account) public depositAccount;
	uint256 public totalBalance=0;

	struct Reward {
		uint256 settleBalance;
		uint256 reward;
	}

	Reward[] public rewardHistory;
	uint256 public rewardPool=0;

	//update must before user's balance change.
	function updateShares(Account storage account) private {
		for (uint256 index = account.lastBalanceChange; index < rewardHistory.length; index++) {
			//add shares for each time.
			Reward storage history=rewardHistory[index];
			account.shares=account.shares.add(history.reward.mul(account.balance).div(history.settleBalance));
		}
		account.lastBalanceChange=uint64(rewardHistory.length);
	}

	function deposit() public payable {
		address user=address(_msgSender());
		uint256 amount=msg.value;
		require(amount>0);

		Account storage account=depositAccount[user];
		updateShares(account);
		account.balance=account.balance.add(amount);
		totalBalance=totalBalance.add(amount);
		emit Deposit(user, account.balance.add(account.shares));
	}

	function withdraw(uint256 amount) public nonReentrant {
		address payable user=payable(_msgSender());
		Account storage account=depositAccount[user];
		updateShares(account);
		require(account.balance.add(account.shares)>=amount);

		//withdraw from balance first
		uint256 amountFromBalance=amount;
		if(amount>account.balance) {
			amountFromBalance=account.balance;
			uint256 amountFromShares=amount.sub(account.balance);
			account.shares=account.shares.sub(amountFromShares);
		}
		account.balance=account.balance.sub(amountFromBalance);
		totalBalance=totalBalance.sub(amountFromBalance);
		//avoid from potential vulnerability
		user.sendValue(amount);
		emit Withdraw(user, account.balance.add(account.shares));
	}

	function depositReward() public payable onlyOwner {
		uint256 amount=msg.value;
		rewardPool=rewardPool.add(amount);
		rewardHistory.push(Reward({settleBalance:totalBalance,reward:amount}));
	}

	function balanceOf(address user) public returns(uint256) {
		Account storage account=depositAccount[user];
		updateShares(account);
		return account.balance.add(account.shares);
	}
}
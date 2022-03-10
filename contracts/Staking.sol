// SPDX-License-Identifier: UNLICENSED

/**
 * Staking contract
*/

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

pragma solidity ^0.8.0;

/**
 * @dev Staking module
 * ETHPool provides a service where people can deposit ETH and they will receive weekly rewards.
 * Users must be able to take out their deposits along with their portion of rewards at any time.
 * New rewards are deposited manually into the pool by the ETHPool team each week using a contract function.
 */

contract Staking is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // Info of each user.
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingAmount;
    }

    mapping (address => UserInfo) public userInfo;

    mapping(address => bool) public admins;

    uint256 public lastRewardBlock;
    uint256 public accRewardPerShare;

    uint256 public totalStakedAmount;

    uint256 public rewardBalance;



    event AddAdmin(address indexed admin);
    event RemoveAdmin(address indexed admin);

    event Stake(address indexed user, uint256 amount);
    event ReStake(address indexed user, uint256 amount);
    event DepositReward(address indexed user, uint256 amount);
    event UnStake(address indexed user, uint256 unStakeAmount, uint256 rewardAmount);

    /**
     * @dev Throws if called by any account other than the admin.
     */
    modifier onlyAdmin() {
        require(admins[msg.sender], "caller is not the admin");
        _;
    }

    constructor(
    ) {
        lastRewardBlock = block.number;
        admins[owner()] = true;
    }

    function addAdmin(address _address) external onlyOwner {
        require(_address != address(0x0), "address error");
        admins[_address] = true;
        emit AddAdmin(_address);
    }

    function removeAdmin(address _address) external onlyOwner {
        require(admins[_address], "this address is not admin!");
        admins[_address] = false;
        emit RemoveAdmin(_address);
    }

    function getETHBalanceOfPool() external view returns (uint256) {
        return address(this).balance;
    }

    function depositReward() external payable onlyAdmin {
        require(msg.value > 0, "amount is 0");
        uint amount = msg.value;
        if (totalStakedAmount > 0)
            accRewardPerShare = accRewardPerShare.add(rewardBalance.mul(10 ** 12).div(totalStakedAmount));
        rewardBalance = amount;
        emit DepositReward(msg.sender, amount);
        lastRewardBlock = block.number;
    }

    function getPending(address _user) external view returns (uint256) {
        uint256 pending = _getPending(_user);
        return pending;
    }

    function _getPending(address _user) private view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 acc = accRewardPerShare;
        if (block.number > lastRewardBlock && totalStakedAmount != 0 && rewardBalance > 0) {
            acc = acc.add(rewardBalance.mul(10 ** 12).div(totalStakedAmount));
        }
        return user.amount.mul(acc).div(10 ** 12).sub(user.rewardDebt).add(user.pendingAmount);
    }

    function stake() external payable {
        require(msg.value > 0, "stake amount is 0");
        uint256 _amount = msg.value;
        UserInfo storage user = userInfo[msg.sender];
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(accRewardPerShare).div(10 ** 12).sub(user.rewardDebt);
            user.pendingAmount = user.pendingAmount.add(pending);
        }

        totalStakedAmount = totalStakedAmount.add(_amount);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(accRewardPerShare).div(10 ** 12);
        emit Stake(msg.sender, _amount);
    }

    function unStake() external payable {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount > 0, "You didn't stake!");
        uint256 rewardAmount = _getPending(msg.sender);
        uint256 stakedAmount = user.amount;
        uint256 withdrawAmount = stakedAmount + rewardAmount;
        bool isSent = payable(msg.sender).send(withdrawAmount);
        require(isSent, "Failed to send ETH");
        rewardBalance = rewardBalance.sub(rewardAmount);
        totalStakedAmount = totalStakedAmount.sub(stakedAmount);
        user.pendingAmount = 0;
        user.amount = 0;
        user.rewardDebt = 0;
        emit UnStake(msg.sender, stakedAmount, rewardAmount);
    }
}

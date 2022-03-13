// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ETHPool is Ownable, AccessControl {
    bytes32 public constant TEAM_MEMBER = keccak256("TEAM_MEMBER");

    /// @notice Info of User who deposit to the pool.
    /// `amount` Amount of Eth the user has deposited.
    /// `pendingRewards` Pending rewards Amount of Eth.
    /// `lastRewardCycleId` Last Reward Cycle Id that user has been rewarded.
    struct UserInfo {
        uint amount;
        uint pendingRewards;
        uint lastRewardCycleId;
    }

    /// @notice Info of Reward Cycle that rewards deposited by the team.
    /// `poolAmount` Amount of Eth that users deposited in the current reward cycle.
    /// `rewardsAmount` Rewards Amount of Eth deposited by the team.
    struct RewardCycleInfo {
        uint poolAmount;
        uint rewardsAmount;
    }

    /// @notice Info of all users.
    mapping (address => UserInfo) public userInfo;
    /// @notice RewardCycleId => amount of users to be rewarded
    mapping (uint => RewardCycleInfo) public rewardCycle;
    /// @notice Current Reward Cycle Id
    uint curRewardCycleId;


    event Deposit(address indexed user, uint amount);
    event DepositRewards(address user, uint amount);
    event Withdraw(address indexed user, uint amount, uint rewards);

    constructor() {
        _grantRole(TEAM_MEMBER, msg.sender);
    }

    function setTeamMember(address _team) external onlyOwner {
        _setupRole(TEAM_MEMBER, _team);
    }

    /// @notice deposit Eth to the pool
    function withdraw() public {
        UserInfo storage user = userInfo[msg.sender];
        uint amount = user.amount;
        require(amount > 0);
        user.pendingRewards += getRewards(amount, user.lastRewardCycleId, curRewardCycleId);

        rewardCycle[curRewardCycleId].poolAmount -= amount;
        uint rewards = user.pendingRewards;
        user.amount = user.pendingRewards = 0;
        user.lastRewardCycleId = curRewardCycleId;
        
        (bool success, ) = msg.sender.call{
            value: amount + rewards
        }("");
        require(success, "EthPool: Transfer failed.");
        emit Withdraw(msg.sender, amount, rewards);
    }

    /// @notice deposit Eth to the pool
    function deposit() public payable {
        UserInfo storage user = userInfo[msg.sender];
        user.pendingRewards += getRewards(user.amount, user.lastRewardCycleId, curRewardCycleId);
        userInfo[msg.sender].amount += msg.value;
        userInfo[msg.sender].lastRewardCycleId = curRewardCycleId;
        rewardCycle[curRewardCycleId].poolAmount += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice team deposit rewards
    function depositRewards() public payable onlyRole(TEAM_MEMBER) {
        RewardCycleInfo storage curRewardCycle = rewardCycle[curRewardCycleId];
        require(curRewardCycle.poolAmount > 0, "EthPool: empty pool");
        curRewardCycle.rewardsAmount = msg.value;
        rewardCycle[curRewardCycleId+1].poolAmount = curRewardCycle.poolAmount;
        curRewardCycleId ++;
        emit DepositRewards(msg.sender, msg.value);
    }

    /// @notice withdraw deposits along with their share of rewards considering the time when they deposited
    function getRewards(uint amount, uint startCycleId, uint endCycleId) internal view returns (uint rewards) {
        for (uint i = startCycleId; i < endCycleId; i ++)
            rewards += amount * rewardCycle[i].rewardsAmount / rewardCycle[i].poolAmount;
    }
}

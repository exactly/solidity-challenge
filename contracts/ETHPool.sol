// SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity 0.8.17;

/**
 * @notice ETHPool
 * ETHPool provides a service where people can deposit ETH and they will receive weekly rewards.
 * Users must be able to take out their deposits along with their portion of rewards at any time.
 * New rewards are deposited manually into the pool by the ETHPool team each week using a contract function.
 */

contract ETHPool is Ownable, ReentrancyGuard {
    /// @dev Info of each user.
    struct UserInfo {
        uint256 totalAmount;
        uint256 lastDepositAmount;
        uint256 lastPendingReward;
        uint256 lastDepositEpoch;
    }
    /// @dev Info of each epoch
    struct EpochInfo {
        uint256 rewards;
        uint256 totalStaked;
        uint256 startTime;
    }

    /// @dev user address => user info
    mapping(address => UserInfo) public userInfo;
    /// @dev epoch id => epoch info
    mapping(uint256 => EpochInfo) public epochInfo;

    /// @dev Address of team wallet
    address public teamWallet;

    // Current Epoch Info
    /// @dev Amount of total staked in current pending epoch
    uint256 public pendingStakedAmount;
    /// @dev Current Epoch ID
    uint256 public epochId;

    event TeamWalletUpdated(address indexed teamWallet);
    event RewardDeposited(address indexed teamWallet, uint256 amount);

    event Staked(address indexed user, uint256 amount);
    event Unstaked(
        address indexed user,
        uint256 unStakeAmount,
        uint256 rewardAmount
    );

    modifier onlyTeam() {
        require(_msgSender() == teamWallet, "ETHPool: caller is not the team");
        _;
    }

    /**
     * @notice Set team wallet
     * @dev Only owner can set the team wallet
     * @param teamWallet_ Address of new team wallet
     */
    function setTeamWallet(address teamWallet_) external onlyOwner {
        require(teamWallet_ != address(0x0), "invalid address");
        teamWallet = teamWallet_;
        emit TeamWalletUpdated(teamWallet_);
    }

    /**
     * @notice Deposit Rewards of current epoch
     * @dev Only team wallet can charge the rewards
     *      It fills current epoch and starts new epoch
     */
    function depositReward() external payable onlyTeam {
        require(msg.value > 0, "ETHPool: zero reward");
        uint256 amount = msg.value;
        EpochInfo storage curEpoch = epochInfo[epochId];
        require(
            block.timestamp > curEpoch.startTime + 1 weeks,
            "ETHPool: Can charge reward after week"
        );
        curEpoch.totalStaked = pendingStakedAmount;
        curEpoch.rewards = amount;

        // Start new epoch
        epochId++;
        EpochInfo storage nextEpoch = epochInfo[epochId];
        nextEpoch.startTime = block.timestamp;
        pendingStakedAmount = 0;
        emit RewardDeposited(_msgSender(), amount);
    }

    /**
     * @notice Calculate the pending rewards of overall epochs
     * @dev Calculate the reward of last deposited epoch by user then sum up with prev pending rewards
     * @param _user Address of user to calculate the pending rewards
     */
    function getPendingReward(address _user) public view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        EpochInfo storage lastEpoch = epochInfo[user.lastDepositEpoch];
        uint256 prevTotalStaked = lastEpoch.totalStaked;
        uint256 latestEpochReward;
        if (prevTotalStaked > 0) {
            latestEpochReward =
                (user.lastDepositAmount * lastEpoch.rewards) /
                prevTotalStaked;
        }
        return user.lastPendingReward + latestEpochReward;
    }

    /**
     * @notice Deposit ETH to the pool
     * @dev Users can deposit eth at anytime without considering the epoch.
     */
    function stake() external payable {
        require(msg.value > 0, "ETHPool: stake zero");
        uint256 amount = msg.value;
        UserInfo storage user = userInfo[_msgSender()];

        user.lastPendingReward = getPendingReward(_msgSender());
        user.totalAmount += amount;
        if (user.lastDepositEpoch == epochId) {
            user.lastDepositAmount += amount;
        } else {
            user.lastDepositAmount = amount;
        }
        user.lastDepositEpoch = epochId;
        pendingStakedAmount += amount;

        emit Staked(_msgSender(), amount);
    }

    /**
     * @notice Withdraw staked ETH from the pool, with accrued rewards
     */
    function unstake() external payable nonReentrant {
        UserInfo storage user = userInfo[_msgSender()];
        require(user.totalAmount > 0, "ETHPool: no staked amount");

        uint256 rewardAmount = getPendingReward(_msgSender());
        uint256 stakedAmount = user.totalAmount;
        uint256 withdrawAmount = stakedAmount + rewardAmount;

        bool isSent = payable(_msgSender()).send(withdrawAmount);
        require(isSent, "Failed to send ETH");

        user.totalAmount = 0;
        user.lastDepositAmount = 0;
        user.lastPendingReward = 0;

        emit Unstaked(_msgSender(), stakedAmount, rewardAmount);
    }

    /**
     * @notice Get total ETH balance of the pool
     */
    function getETHBalanceOfPool() external view returns (uint256) {
        return address(this).balance;
    }
}

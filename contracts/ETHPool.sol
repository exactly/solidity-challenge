// SPDX-License-Identifier: MIT


pragma solidity ^0.8.7;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract ETHPool is Ownable, AccessControl {

  bytes32 public constant TEAM = keccak256("TEAM");

  uint256 public period = 1 weeks;

  /// @notice the last time when the team deposited reward
  uint256 lastTime;

  /// @notice total liquidity in the pool
  uint256 totalLiquidity = 0;

  /// @notice total rewards in the pool
  uint256 totalRewards = 0;

  /// @notice total number of registered users
  uint256 userCount = 0;

  struct User {
    uint256 liquidity;
    uint256 rewards;
  }

  /**
   * 0 => address1
   * 1 => address2
   * 2 => address3
   * ...
   */
  mapping (uint256 => address) userList;

  /**
   * address1 => 1 (if registered)
   * address2 => 0 (if not registered)
   * ...
   */
  mapping (address => uint8) registered;

  mapping (address => User) userInfos;

  constructor() {
    lastTime = 0;
  }

  /// @notice this function is only needed for test (because we can't wait a week for a team to deposit rewards again)
  function setLastTime(uint256 _lastTime) external onlyOwner {
    lastTime = _lastTime;
  }
  
  /**
   * @param _team team account's address
   * @notice accept _team as a TEAM member
   */
  function setTeamMember(address _team) external onlyOwner {
    _setupRole(TEAM, _team);
  }

  /// @notice get pool's total liquidity
  function getTotalLiquidity() external view returns (uint256) {
    return totalLiquidity;
  }

  /// @notice get pool's total rewards
  function getTotalRewards() external view returns (uint256) {
    return totalRewards;
  }

  /// @notice get team's last deposition time
  function getLastRewardDepositionTime() external view returns (uint256) {
    return lastTime;
  }

  /// @notice users deposit liquidity to this pool by calling this function
  function deposit() external payable {
    address user = msg.sender;
    uint256 amount = msg.value;

    if (registered[user] == 0) {
      registered[user] = 1;
      userList[userCount] = user;
      userCount += 1;
    }
    userInfos[user].liquidity += amount;
    totalLiquidity += amount;

    emit Deposit(user, amount);
  }

  /// @notice team members deposit rewards to this pool. (only team members can call this function)
  function depositRewards() external payable onlyRole(TEAM) {
    require (lastTime / period != block.timestamp / period, "Can't deposit rewards any more this week.");

    address team = msg.sender;
    uint256 amount = msg.value;
    require (amount > 0, "Error in depositing reward amount.");

    lastTime = block.timestamp;
    totalRewards += amount;

    for (uint256 i = 0; i < userCount; i++) {
      userInfos[userList[i]].rewards += amount * userInfos[userList[i]].liquidity / totalLiquidity;
    }

    emit DepositRewards(team, amount);
  }

  /// @notice withdraw deposits along with their share of rewards
  function withdraw() external {
    address user = msg.sender;
    require (registered[user] == 1, "You are not registered.");

    uint256 amount = userInfos[user].liquidity + userInfos[user].rewards;
    require (amount <= totalLiquidity + totalRewards, "Insufficient amount of funds.");
            
    totalLiquidity -= userInfos[user].liquidity;
    totalRewards -= userInfos[user].rewards;

    userInfos[user].liquidity = 0;
    userInfos[user].rewards = 0;
    
    payable(msg.sender).transfer(amount);

    emit Withdraw(user, amount);
  }

  /// @notice withdraw only rewards
  function withdrawRewards() external {
    address user = msg.sender;
    require (registered[user] == 1, "You are not registered.");

    uint256 amount = userInfos[user].rewards;
    require (amount > 0, "Withdraw amount can't be 0.");
    require (amount <= totalRewards, "Insufficient rewards amount.");
    
    userInfos[user].rewards = 0;
    totalRewards -= amount;
    
    payable(msg.sender).transfer(amount);

    emit Withdraw(user, amount);
  }

  function setPeriod(uint256 _newPeriod) public onlyOwner {
    period = _newPeriod;
  }

  /// @notice get total liquidity of _user
  function getLiquidity(address _user) public view returns (uint256) {
    require (registered[_user] == 1, "That user is not registered");

    return userInfos[_user].liquidity;
  }

  /// @notice get total rewards of _user
  function getRewards(address _user) public view returns (uint256) {
    require (registered[_user] == 1, "That user is not registered");

    return userInfos[_user].rewards;
  }

  function getBalance(address _user) public view returns (uint256) {
    return getLiquidity(_user) + getRewards(_user);
  }

  event Deposit(address indexed user, uint256 amount);
  event DepositRewards(address indexed team, uint256 amount);
  event Withdraw(address indexed user, uint256 amount);
}
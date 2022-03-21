// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract ETHPool {
  uint256 private constant MAGNITUDE = 10 ** 30;

  mapping(address => uint256) private _stakedAmount;
  mapping(address => uint256) private _stakeEntry;
  mapping(address => uint256) private _accured;
  uint256 private _totalStaked;
  uint256 private _totalReward;
  uint256 private _totalAccured;

  address private _owner;
  address private _team;

  constructor() {
    _owner = msg.sender;
  }

  function isTeam() internal view returns (bool) {
    if(_team == address(0))
      return (msg.sender == _owner);
    return (msg.sender == _team);
  }

  function changeTeam(address newTeam) external {
    require(isTeam(), "should be current team");
    require(newTeam != address(0), "Team should not be zero");
    _team = newTeam;
  }

  function team() external view returns (address) {
    return _team;
  }

  function deposit(uint256 newReward) internal {
    require(_totalStaked > 0, "No one has staked yet");

    _totalReward = _totalReward + newReward;
    _totalAccured = _totalAccured + newReward * MAGNITUDE / _totalStaked;
  }

  function stake(uint256 stakeAmount) public {
    if(_stakedAmount[msg.sender] > 0)
      _accured[msg.sender] = currentRewards(msg.sender);

    _stakedAmount[msg.sender] = _stakedAmount[msg.sender] + stakeAmount;
    _totalStaked = _totalStaked + stakeAmount;
    
    _stakeEntry[msg.sender] = _totalAccured;
  }

  receive() external payable {
    require(msg.value > 0, "deposit should be positive");

    if(isTeam()) {
      // team deposit reward
      deposit(msg.value);
    } else {
      // user deposit eth
      stake(msg.value);
    }
  }

  function unstakeAll() public {
    require(_stakedAmount[msg.sender] > 0, "You have no stake");

    _accured[msg.sender] = currentRewards(msg.sender);
    uint256 unstakeAmount = _stakedAmount[msg.sender];
    _totalStaked = _totalStaked - unstakeAmount;
    _stakedAmount[msg.sender] = 0;

    _stakeEntry[msg.sender] = _totalAccured;

    address payable receiver = payable(msg.sender);
    receiver.transfer(unstakeAmount);
  }

  function harvest() public {
    require(currentRewards(msg.sender) > 0, "Insufficient accured reward");

    uint256 reward = currentRewards(msg.sender);
    _totalReward = _totalReward - reward;
    _accured[msg.sender] = 0;
    _stakeEntry[msg.sender] = _totalAccured;
    
    address payable receiver = payable(msg.sender);
    receiver.transfer(reward);
  }

  function currentRewards(address addy) public view returns (uint256) {
    return _accured[addy] + _calculateReward(addy);
  }

  function currentStake(address addy) public view returns (uint256) {
    return _stakedAmount[addy];
  }

  function _calculateReward(address addy) private view returns (uint256) {
    return _stakedAmount[addy] * (_totalAccured - _stakeEntry[addy]) / MAGNITUDE;
  } 
}
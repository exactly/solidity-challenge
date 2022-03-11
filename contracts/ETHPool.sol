// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract ETHPool is Ownable {

  using EnumerableSet for EnumerableSet.AddressSet;

  EnumerableSet.AddressSet private addresses;

  mapping (address=> uint256) balanceOfUsers;

  uint256 public totalBalance;

  event Deposit(uint256 amount, uint256 date);
  event Withdraw(address to, uint256 amount);
  event Stake(address from, uint256 amount, uint256 date);

  function deposit() public payable onlyOwner {
    require(addresses.length() > 0, "No stakers!");
    for (uint256 index = 0; index < addresses.length(); index++) {
      uint256 _userBalance = balanceOfUsers[addresses.at(index)];
      balanceOfUsers[addresses.at(index)] += _userBalance * msg.value / totalBalance; 
    }
    totalBalance += msg.value;
    emit Deposit(msg.value, block.timestamp);
  }

  function withdraw() public {
    require(addresses.contains(msg.sender), "No fund to withdraw!");
    uint256 _amountToWithdraw = balanceOfUsers[msg.sender];
    totalBalance -= _amountToWithdraw;
    balanceOfUsers[msg.sender] = 0;
    addresses.remove(msg.sender);
    (bool success, ) = msg.sender.call{value: _amountToWithdraw}("");
    require(success, "withdraw failed!");
    emit Withdraw(msg.sender, _amountToWithdraw);
  }

  function balanceOf(address user) public view returns (uint256) {
    return balanceOfUsers[user];
  }

  receive() external payable {
    if (!addresses.contains(msg.sender)) {
      addresses.add(msg.sender);
    }
    balanceOfUsers[msg.sender] += msg.value;
    totalBalance += msg.value;
    emit Stake(msg.sender, msg.value, block.timestamp);
  }
}
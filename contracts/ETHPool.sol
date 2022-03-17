// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ETHPool is Ownable, AccessControl {
    bytes32 public constant TEAM = keccak256("TEAM");

    /// @notice Info of User who deposit to the pool.
    /// `liquidity` The funds to withdraw(The power to get distributed rewards of pool).
    struct UserInfo {
        uint256 liquidity;
        bool registered;
    }

    /// @notice Info of all users.
    mapping(address => UserInfo) public userInfo;

    address[] public users;

    event Deposit(address indexed user, uint256 amount);
    event DepositRewards(address user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor() {
        _grantRole(TEAM, msg.sender);
    }

    function setTeamMember(address _team) external onlyOwner {
        _setupRole(TEAM, _team);
    }

    /// @notice withdraw deposits along with their share of rewards considering the time when they deposited
    function withdraw() external {
        UserInfo storage user = userInfo[msg.sender];
        uint256 amount = user.liquidity;
        require(amount > 0);

        user.liquidity = 0;

        (bool success, ) = msg.sender.call{ value: amount }("");
        require(success, "EthPool: Transfer failed.");

        emit Withdraw(msg.sender, amount);
    }

    /// @notice deposit Eth to the pool
    function deposit() external payable {
        UserInfo storage user = userInfo[msg.sender];
        user.liquidity += msg.value;
        if (!user.registered) {
            users.push(msg.sender);
            user.registered = true;
        }

        emit Deposit(msg.sender, msg.value);
    }

    /// @notice team deposit rewards
    function depositRewards() external payable onlyRole(TEAM) {
        uint256 totalDeposits = getTotalNewDeposits();
        require(totalDeposits > 0);

        uint256 length = users.length;
        uint256 amount = msg.value;
        require(amount > 0);

        for (uint256 i = 0; i < length; i++) {
            UserInfo storage user = userInfo[users[i]];
            user.liquidity += user.liquidity * amount / totalDeposits;
        }

        emit DepositRewards(msg.sender, msg.value);
    }

    /// @notice get pending rewards for user
    function getPendingRewards(address account) external view returns (uint256 pendingRewards) {
        UserInfo storage user = userInfo[account];
        pendingRewards = user.liquidity;
    }

    /// @notice get funds held by pool
    function balanceOfPool() external view returns (uint256 balance) {
        uint256 length = users.length;
        for (uint256 i = 0; i < length; i++) {
            balance += userInfo[users[i]].liquidity;
        }
    }

    function getTotalNewDeposits() internal view returns (uint256 deposits) {
        uint256 length = users.length;
        for (uint256 i = 0; i < length; i++) {
            deposits += userInfo[users[i]].liquidity;
        }
    }
}

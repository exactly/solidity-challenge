// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

// for testing porpourses
// import "forge-std/console2.sol";

// Challenge, just for fun
// https://github.com/eugenioclrc/solidity-challenge

// assumption, each week is a different pool with different rewards
// a week number is defined by current timestamp / (7*24*60*60)
// if you deposit 10 ether in week 1, and withdraw 10 ether in
// week 2, your rewards will be 0 for week 1 and 2
// if you deposit 10 ether in week 1, and withdraw 5 ether in
// week 2, and on week 3 you withdraw 5 ether your rewards will
// be 0 for week 1, 100% of rewards for week 1, and 0 for week 3

// test coverage is 100%, try to run al edge cases that i could
// imagine, how ever might not be enough, also

// i use WETH but send ether on withdraw and claims, it would be
// easier just use WETH

import {ReentrancyGuard} from "solmate/utils/ReentrancyGuard.sol";
import {SafeTransferLib} from "solmate/utils/SafeTransferLib.sol";
import {Owned} from "solmate/auth/Owned.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

import {IWETH} from "./IWETH.sol";

contract ETHPool is Owned(msg.sender), ReentrancyGuard {
    uint256 constant WEEK = 60 * 60 * 24 * 7;

    // contract week start number
    uint32 immutable GENESIS;
    // weth contract
    IWETH immutable WETH;

    address team;

    // total deposits
    uint256 public totalDeposits;
    // total deposits per week
    mapping(uint32 => uint256) public totalDepositsWeek;

    // rewards per week
    mapping(uint32 => uint256) public weekRewards;

    // user balances
    mapping(address => uint256) balances;
    // user balances per week
    mapping(address => mapping(uint32 => uint256)) public weekBalance;

    mapping(address => uint32) lastUserClaim;
    mapping(address => uint32) lastUserUpdate;
    uint32 _lastUpdate;

    event Withdraw(address indexed user, uint32 indexed week, uint256 amount);
    event Deposit(address indexed user, uint32 indexed week, uint256 amount);
    event Claim(address indexed user, uint256 amount);

    event SetTeamWallet(address teamWallet);
    event AddReward(uint32 week, uint256 amount);
    event RescueReward(uint32 week, uint256 amount);

    constructor(address _WETH) {
        WETH = IWETH(_WETH);
        GENESIS = currentWeek();
        _lastUpdate = currentWeek();
    }

    // private functions

    function batchCalcsPredeposit(uint32 _currentWeek) private {
        if (_currentWeek > _lastUpdate) {
            for (uint32 i = _lastUpdate; i < _currentWeek;) {
                unchecked {
                    totalDepositsWeek[i + 1] = totalDepositsWeek[i];
                    i++;                    
                }
            }
        }

        _lastUpdate = _currentWeek;
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    // tricky batch calculations
    function batchCalculations(address user, uint32 _currentWeek) private {
        // user week calcs
        if (lastUserUpdate[user] == 0) {
            lastUserUpdate[user] = _currentWeek;
            return;
        }

        if (_currentWeek > lastUserUpdate[user]) {
            for (uint32 i = lastUserUpdate[user]; i < _currentWeek;) {
                unchecked { 
                    weekBalance[user][i + 1] = weekBalance[user][i];
                    i++;
                }
            }
        }

        lastUserUpdate[user] = _currentWeek;
    }

    // owner functions
    function setTeam(address _team) external onlyOwner {
        team = _team;
        emit SetTeamWallet(_team);
    }

    // team functions
    function addRewards() external payable {
        addRewards(currentWeek() + 1);
    }

    function addRewards(uint32 week) public payable {
        require(msg.sender == team, "only team can add rewards");
        require(msg.value > 0, "send some ETH!");
        require(week > currentWeek(), "week must => current week");

        weekRewards[week] += msg.value;
        WETH.deposit{value: msg.value}();
        emit AddReward(week, msg.value);
    }

    function withdrawStuckRewards(uint32 week) public payable {
        require(_lastUpdate > week, "week must > last update");
        require(msg.sender == team, "only team can add rewards");
        require(week < currentWeek(), "week must < current week");

        require(min(totalDepositsWeek[week], totalDepositsWeek[week - 1]) == 0, "rewards arent stuck");

        uint256 _rewards = weekRewards[week];
        weekRewards[week] = 0;
        WETH.withdraw(_rewards);
        SafeTransferLib.safeTransferETH(team, _rewards);
            
        emit RescueReward(week, _rewards);
    }

    // public-external functions

    function deposit() external payable {
        require(msg.value > 0, "deposit must be greater than 0");
        deposit(0);
    }

    function deposit(uint256 amount) public payable nonReentrant {
        uint32 _currentWeek = currentWeek();
        batchCalcsPredeposit(_currentWeek);
        batchCalculations(msg.sender, _currentWeek);
        claim();

        if (msg.value > 0) {
            WETH.deposit{value: msg.value}();
            amount = msg.value;
        } else if (amount > 0) {
            require(msg.value == 0, "Using WETH, dont send ether");
            SafeTransferLib.safeTransferFrom(ERC20(address(WETH)), msg.sender, address(this), amount);
        }

        totalDeposits += amount;
        balances[msg.sender] += amount;

        totalDepositsWeek[_currentWeek] = totalDeposits;
        weekBalance[msg.sender][_currentWeek] = balances[msg.sender];

        emit Deposit(msg.sender, _currentWeek, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        uint32 _currentWeek = currentWeek();
        batchCalcsPredeposit(_currentWeek);
        batchCalculations(msg.sender, _currentWeek);
        claim();

        balances[msg.sender] -= amount;
        totalDeposits -= amount;

        totalDepositsWeek[_currentWeek] = totalDeposits;
        weekBalance[msg.sender][_currentWeek] = balances[msg.sender];

        WETH.withdraw(amount);
        SafeTransferLib.safeTransferETH(msg.sender, amount);

        emit Withdraw(msg.sender, _currentWeek, amount);
    }

    function claim() public {
        uint32 _currentWeek = currentWeek();

        totalDepositsWeek[_currentWeek] = totalDeposits;
        weekBalance[msg.sender][_currentWeek] = balances[msg.sender];

        uint256 _earn = pendingRewards(msg.sender);

        lastUserClaim[msg.sender] = _currentWeek;

        if (_earn > 0) {
            WETH.withdraw(_earn);
            SafeTransferLib.safeTransferETH(msg.sender, _earn);
            emit Claim(msg.sender, _earn);
        }
    }

    function pendingRewards(address user) public /*view*/ returns (uint256 _earn) {
        uint32 _currentWeek = currentWeek();
        totalDepositsWeek[_currentWeek] = totalDeposits;
        weekBalance[msg.sender][_currentWeek] = balances[msg.sender];

        batchCalcsPredeposit(_currentWeek);
        batchCalculations(user, _currentWeek);

        uint32 start = lastUserClaim[user];
        if (start == 0) {
            start = GENESIS;
        }

        for (uint32 i = start; i < _currentWeek;) {
            uint256 _rewards = weekRewards[i];
            if (_rewards == 0) {
                unchecked {
                    i++;
                }
                continue;
            }
            uint256 denominator = min(totalDepositsWeek[i], totalDepositsWeek[i - 1]);
            if (totalDepositsWeek[i] > 0) {
                _earn += (_rewards * min(weekBalance[user][i], weekBalance[user][i - 1])) / denominator;
            }
            unchecked {
                i++;
            }
        }
    }

    function currentWeek() public view returns (uint32) {
        return uint32(block.timestamp / WEEK);
    }

    // we can receive ether from the WETH contract
    // but if someone sends ether to the contract, it will get stuck
    // it would be best just use WETH
    receive() external payable {}
}

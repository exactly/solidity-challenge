// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
// import {ETHPool} from "src/ETHPool.sol";
import {ETHPool} from "src/ETHPool.sol";
import {WETH as WETHMock} from "src/mock/WETH.sol";

contract ContractTest is Test {
    WETHMock public weth;
    // ETHPool public ethPool;
    ETHPool ethPool;

    address immutable alice;
    address immutable bob;
    address immutable team;

    uint32 constant DAY = 60 * 60 * 24;
    uint32 constant WEEK = 60 * 60 * 24 * 7;

    constructor() {
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        team = makeAddr("team");
    }

    function setUp() public {
        // week number will always be greater than 0
        vm.warp(WEEK * 2);

        weth = new WETHMock();
        ethPool = new ETHPool(address(weth));

        vm.label(address(ethPool), "ethPool");
        vm.label(address(weth), "weth");
        vm.deal(alice, 10_000 ether);
        vm.deal(bob, 10_000 ether);
        vm.deal(team, 10_000 ether);

        ethPool.setTeam(team);
    }

    function testJustDepositNWithdraw() public {
        vm.startPrank(alice);
        assertEq(ethPool.weekBalance(alice, 0), 0);
        assertEq(ethPool.totalDepositsWeek(0), 0);

        console.log(block.timestamp / WEEK);
        ethPool.deposit{value: 10}();
        assertEq(ethPool.weekBalance(alice, 0), 0);
        assertEq(ethPool.totalDepositsWeek(0), 0);
        assertEq(ethPool.weekBalance(alice, 2), 10);
        assertEq(ethPool.totalDepositsWeek(2), 10);

        skip(2 * WEEK);

        ethPool.deposit{value: 50}();
        // console.log(block.timestamp / WEEK);
        assertEq(ethPool.totalDepositsWeek(3), 10, "wrong weekly balance");
        assertEq(ethPool.totalDepositsWeek(4), 60, "wrong weekly balance");
        assertEq(ethPool.weekBalance(alice, 3), 10);

        assertEq(ethPool.weekBalance(alice, 4), 60);
        assertEq(ethPool.totalDepositsWeek(4), 60, "wrong weekly balance");
        ethPool.withdraw(10);
        assertEq(ethPool.weekBalance(alice, 4), 50);
        assertEq(ethPool.totalDepositsWeek(4), 50, "wrong weekly balance");
    }

    function testSipleDeposit() public {
        vm.startPrank(bob);
        ethPool.deposit{value: 300 ether}();
        weth.approve(address(ethPool), 300 ether);
        weth.deposit{value: 100 ether}();
        ethPool.deposit(100 ether);
        vm.stopPrank();
    }

    function testWeeks() public {
        vm.warp(0); // next week
        for (uint256 i; i < 20; i++) {
            assertEq(ethPool.currentWeek(), i);
            skip(WEEK);
        }
    }

    function testFull() public {
        vm.prank(alice);
        ethPool.deposit{value: 100 ether}();

        vm.startPrank(bob);
        weth.deposit{value: 300 ether}();
        weth.approve(address(ethPool), 300 ether);
        ethPool.deposit(100 ether);
        ethPool.deposit(200 ether);
        vm.stopPrank();

        // lets set the rewards to next week, otherwise, ether will get stuck
        vm.startPrank(team);
        ethPool.addRewards{value: 200 ether}(ethPool.currentWeek() + 1);
        vm.stopPrank();

        // A deposits 100, and B deposits 300 for a total of 400 in the pool.
        assertEq(ethPool.totalDeposits(), 400 ether, "totalDeposit should be 400 ETHER");
        assertEq(ethPool.pendingRewards(alice), 0, "alice rewards should be 0 ETH");
        assertEq(ethPool.pendingRewards(bob), 0, "bob rewards should be 0 ETH");

        skip(WEEK * 3); // next week

        assertEq(ethPool.pendingRewards(alice), 50 ether, "wrong alice rewards");
        assertEq(ethPool.weekBalance(alice, 2), 100 ether, "alice week deposit should be 100 ETH");
        assertEq(ethPool.pendingRewards(bob), uint256(200 ether * 3 / 4), "wrong bob rewards");
        assertEq(ethPool.weekBalance(bob, 2), 300 ether, "bob week deposit should be 300 ETH");

        skip(WEEK * 3); // next week

        vm.startPrank(alice);
        uint256 balanceBefore = alice.balance;
        ethPool.withdraw(30 ether);
        assertEq(alice.balance - balanceBefore, 30 ether + 50 ether, "wrong alice withdraw");
    }
}

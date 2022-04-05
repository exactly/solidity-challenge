// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface PoolClientInterface {

    function deposit() external payable;
    function withdraw() external payable;
    function calculateRewards() external;
    function setAllowance(uint _amount) external returns(uint);
    function getPoolClientAddress() external view returns(address);
    
}
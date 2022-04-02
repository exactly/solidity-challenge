// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface PoolBaseInterface {
    function getPoolState() external view returns(bool);
    function getPoolMaxSize() external view returns(uint);
    function getRewardsInterval() external view returns(uint);
    function getRewardsInterest() external view returns(uint);
    function getContributionLimit() external view returns(uint);
    function setMinContribution() external view returns(uint);
    function getPoolFees() external view returns(uint);
}
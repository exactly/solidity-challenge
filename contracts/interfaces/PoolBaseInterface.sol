// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface PoolBaseInterface {

    function addPoolManager (address _address) external;
    function removePoolManager (address _address) external;

    function setPoolLive(bool _live) external;
    function setPoolMaxSize(uint _maxSize) external; 
    function setRewardsInterval(uint _daysToRewards) external;
    function setRewardsInterest(uint _rewardsInterest) external;
    function setContributionLimit(uint _newContrLimit) external;
    function setMinContribution(uint _newMinContr) external;

    function poolBaseAddress() external view returns(address);
    function getPoolState() external view returns(bool);
    function getPoolMaxSize() external view returns(uint);
    function getRewardsInterval() external view returns(uint);
    function getRewardsInterest() external view returns(uint);
    function getContributionLimit() external view returns(uint);
    function getMinContribution() external view returns(uint);

}
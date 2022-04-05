// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface PoolVaultInterface {

    function poolEtherSize() external view returns(uint);
    function storeEther(address _from) external payable;
    function processRewards() external payable;
    function withdrawEther(address _to, uint _ethAmount) external;
    function getPoolVaultAddress() external view returns(address);
            

}
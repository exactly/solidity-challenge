// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;


interface TokenBalancesInterface {
 
    function getTotalEthSupply() external view returns(uint);
    function getTotalrwEthSupply() external view returns(uint);
    function getRwEthBurned() external view returns(uint);   

    function getTotalEtherStaked() external view returns(uint);
    function getTotalRewardsInjected() external view returns(uint);
    function getRwEthMintedByUser(address _user) external view returns(uint);     
    function getTokenBalancesAddress() external view returns(address);
}
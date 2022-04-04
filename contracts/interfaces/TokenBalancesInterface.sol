// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;


interface TokenBalancesInterface {
 
    function getTotalEthSupply() external view returns(uint);
    function getTotalrwEthSupply() external view returns(uint);
    function getTotalEtherStaked() external view returns(uint);
    function getTokenBalancesAddress() external view returns(address);
}
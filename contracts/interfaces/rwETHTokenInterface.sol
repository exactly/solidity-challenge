// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 

interface rwETHTokenInterface is IERC20 {

    function setRwETHTokenAddress() external;    
    function calcEthValue(uint _rwEthAmount) external view returns(uint);
    function calcRwEthValue(uint _ethAmount) external view returns(uint);
    function getUnitPrice(uint _ethAmount) external view returns(uint);
    function mint(address _to, uint _ethAmount) external;
    function burn(uint _rwEthAmount) external;
    function getRwETHTokenAddress() external view returns(address);
             

}
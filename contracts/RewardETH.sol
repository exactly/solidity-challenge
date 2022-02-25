// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardETH is ERC20, Ownable {
    constructor() ERC20("Reward ETH", "rwETH") {}

    function mint(address to, uint256 amount) internal {
        _mint(to, amount);
    }

    

}
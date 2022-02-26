// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RewardETH is ERC20, AccessControl {

    constructor() ERC20("Reward ETH", "rwETH") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
    }

    function mint(address to, uint256 amount) internal {
        _mint(to, amount);
    }

    

}
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";


/// @dev This contract handles the modifiers and environmental parameters that control the pool. 

contract PoolBase is AccessControl {

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }



           


















}
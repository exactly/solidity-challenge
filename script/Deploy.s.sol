// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "src/ETHPool.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        // goerli weth address
        // https://goerli.etherscan.io/address/0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6
        address WETH = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
        
        vm.startBroadcast();
        new ETHPool(WETH);
        vm.stopBroadcast();
    }
}

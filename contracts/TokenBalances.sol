// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./PoolBase.sol";

abstract contract TokenBalances is PoolBase {

    // ===== Setter functions =====
    function setTotalETH(uint _amount) private {
        bytes32 ethBalTag = keccak256(abi.encodePacked("balance_pool_ether"));
        dataStorage.setUintStorage(ethBalTag, _amount);
    }

    function setTotalrwETH(uint _amount) private {
        bytes32 rwEthBalTag = keccak256(abi.encodePacked("balance_rewardEther"));
        dataStorage.setUintStorage(rwEthBalTag, _amount);
    }

    function setAllBalances(uint _etherAmount, uint _rwEtherAmount) private {
        setTotalETH(_etherAmount);
        setTotalrwETH(_rwEtherAmount);
    }

    // ===== Getter functions =====
    function getTotalEthSupply() external view returns(uint){
        bytes32 ethBalTag = keccak256(abi.encodePacked("balance_pool_ether"));
        return dataStorage.getUintStorage(ethBalTag);
    }

    function getTotalrwEthSupply() external view returns(uint){
        bytes32 rwEthBalTag = keccak256(abi.encodePacked("balance_rewardEther"));
        return dataStorage.getUintStorage(rwEthBalTag);
    }    

}


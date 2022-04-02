// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/// @title TokenBalances, Token Balances Contract,
/// @author liorabadi
/// @notice Tracking and setters of the token related variables.

import "./PoolBase.sol";

abstract contract TokenBalances is PoolBase {


    constructor (DataStorageInterface _dataStorageAddress) PoolBase(_dataStorageAddress) {
        _setTokenBalancesAddress();
    }

    /// @dev Store this contract address and existance on the main storage.
    /// @notice Called while deploying the contract. 
    function _setTokenBalancesAddress() private{
        dataStorage.setBoolStorage(keccak256(abi.encodePacked("contract_exists", address(this))), true);
        dataStorage.setAddressStorage(keccak256(abi.encodePacked("contract_address", "TokenBalances")), address(this));
    }    

    // ===== Getter functions =====
    function getTotalEthSupply() external view returns(uint){
        bytes32 ethBalTag = keccak256(abi.encodePacked("totalSupply_Ether"));
        return dataStorage.getUintStorage(ethBalTag);
    }

    function getTotalrwEthSupply() external view returns(uint){
        bytes32 rwEthBalTag = keccak256(abi.encodePacked("totalSupply_rewardEther"));
        return dataStorage.getUintStorage(rwEthBalTag);
    }

    function getTotalEtherStaked() external view returns(uint){
        bytes32 currentPoolSizeTag = keccak256(abi.encodePacked("total_ether_staked"));
        return dataStorage.getUintStorage(currentPoolSizeTag);
    }    
}


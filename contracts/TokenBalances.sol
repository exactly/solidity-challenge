// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/// @title TokenBalances, Token Balances Contract,
/// @author liorabadi
/// @notice Tracking and setters of the token related variables.

import "./PoolBase.sol";

contract TokenBalances is PoolBase {


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

    function getRwEthBurned() external view returns(uint){
        bytes32 burnedRwEtherTag = keccak256(abi.encodePacked("totalBurned_rewardEther"));
        return dataStorage.getUintStorage(burnedRwEtherTag);
    }    

    function getTotalEtherStaked() external view returns(uint){
        bytes32 currentPoolSizeTag = keccak256(abi.encodePacked("total_ether_staked"));
        return dataStorage.getUintStorage(currentPoolSizeTag);
    }  
    
    function getTotalRewardsInjected() external view returns(uint){
        bytes32 totalRewardsInjectedTag = keccak256(abi.encodePacked("totalRewardsInjected"));   
        return dataStorage.getUintStorage(totalRewardsInjectedTag);
    }    
    
    function getRwEthMintedByUser(address _user) external view returns(uint){
        bytes32 mintedRwEtherTag = keccak256(abi.encodePacked("minted_rwEther", _user));
        return dataStorage.getUintStorage(mintedRwEtherTag);
    }      

    function getTokenBalancesAddress() public view returns(address){
        bytes32 addressTag = keccak256(abi.encodePacked("contract_address", "TokenBalances"));
        address contractAddress = dataStorage.getAddressStorage(addressTag);
        return contractAddress;
    }        
}


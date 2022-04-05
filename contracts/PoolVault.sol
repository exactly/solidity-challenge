// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/// @title PoolVault, Pool Vault Contract,
/// @author liorabadi
/// @notice Where all the tokens and assets are held. 
/// @notice No user can interact with this contract. Works only with contracts of the pool. 
/// @notice There are no getter nor public functions on this contract. Information only accessible via TokenBalances Contract.

import "./PoolBase.sol";
import "./interfaces/rwETHTokenInterface.sol";

contract PoolVault is PoolBase {

    constructor(DataStorageInterface _dataStorageAddress) PoolBase(_dataStorageAddress) {
        _setPoolVaultAddress();
    }

    modifier onlyByPoolContract {
        bytes32 contractTag = keccak256(abi.encodePacked("contract_exists", msg.sender));
        require(dataStorage.getBoolStorage(contractTag), "The contract address is invalid.");
      _;
    }

    /// @dev Store this contract address and existance on the main storage.
    /// @notice Called while deploying the contract. 
    function _setPoolVaultAddress() private {
        dataStorage.setBoolStorage(keccak256(abi.encodePacked("contract_exists", address(this))), true);
        dataStorage.setAddressStorage(keccak256(abi.encodePacked("contract_address", "PoolVault")), address(this));
    }     

    function poolEtherSize() external view returns(uint){
        bytes32 etherVaultedTag = keccak256(abi.encodePacked("total_ether_staked"));
        return dataStorage.getUintStorage(etherVaultedTag);
    }

    function storeEther(address _from) external payable onlyByPoolContract {
        bytes32 etherVaultedTag = keccak256(abi.encodePacked("total_ether_staked"));
        bytes32 stakedByUserTag = keccak256(abi.encodePacked("ether_staked_by_user", _from));
        dataStorage.increaseUintStorage(etherVaultedTag, msg.value);
        dataStorage.increaseUintStorage(stakedByUserTag, msg.value);
    }
    
    function withdrawEther(address _to, uint _ethAmount) external onlyByPoolContract nonReentrant() {
        bytes32 etherVaultedTag = keccak256(abi.encodePacked("total_ether_staked"));
        bytes32 ethBalTag = keccak256(abi.encodePacked("totalSupply_Ether"));
        bytes32 stakedByUserTag = keccak256(abi.encodePacked("ether_staked_by_user", _to));

        require(dataStorage.getUintStorage(etherVaultedTag) - _ethAmount >= 0 , "Pool lacking of ether to perform this action.");
        require(dataStorage.getUintStorage(stakedByUserTag) - _ethAmount >= 0 , "User lacking of ether to perform this action.");

        dataStorage.decreaseUintStorage(etherVaultedTag, _ethAmount);   
        dataStorage.decreaseUintStorage(ethBalTag, _ethAmount);   
        dataStorage.decreaseUintStorage(stakedByUserTag, _ethAmount);

        (bool success, ) = payable(_to).call{value: _ethAmount}("");
        require(success);
    }

    function processRewards() external payable onlyByPoolContract nonReentrant(){
        bytes32 etherVaultedTag = keccak256(abi.encodePacked("total_ether_staked"));
        dataStorage.increaseUintStorage(etherVaultedTag, msg.value);
    }

    function getPoolVaultAddress() public view returns(address){
        bytes32 addressTag = keccak256(abi.encodePacked("contract_address", "PoolVault"));
        address contractAddress = dataStorage.getAddressStorage(addressTag);
        return contractAddress;
    }    
        

 
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/// @dev All trackers and state variables that handle the pool balances and information are stored in here.

contract DataStorage {

    mapping(bytes32 => uint256) private uintStorage;
    mapping(bytes32 => bool)    private boolStorage;
    mapping(bytes32 => address) private addressStorage;
    mapping(bytes32 => bytes32) private bytes32Storage;


    // === Storage Mappings Getters
    function getUintStorage(bytes32 _id) external view returns(uint256){
        return uintStorage[_id];
    }

    function getBoolStorage(bytes32 _id) external view returns(bool){
        return boolStorage[_id];
    }

    function getAddressStorage(bytes32 _id) external view returns(address){
        return addressStorage[_id];
    }   
    
    function getBytes32Storage(bytes32 _id) external view returns(bytes32){
        return bytes32Storage[_id];
    }

    
    // === Storage Mappings Setters
    function setUintStorage(bytes32 _id, uint256 _value) external{
        uintStorage[_id] = _value;
    }    
    
    function setBoolStorage(bytes32 _id, bool _value) external{
        boolStorage[_id] = _value;
    }    


}
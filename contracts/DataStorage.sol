// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./interfaces/DataStorageInterface.sol";


/// @dev All trackers and state variables that handle the pool balances and information are stored in here.

contract DataStorage is DataStorageInterface{

    mapping(bytes32 => uint256) private uintStorage;
    mapping(bytes32 => bool)    private boolStorage;
    mapping(bytes32 => address) private addressStorage;
    mapping(bytes32 => bytes32) private bytes32Storage;

    // Initialization flag
    bool storageLive = false;

    // Address of the Storage Guardian
    address currentGuardian;
    address newGuardian;

    event GuardChange(address indexed _lastGuardian, address _newGuardian);


    constructor() {
        currentGuardian = msg.sender;
    }

    // The guardian needs to store the other Pool contracts within the Bool State tracker before setting the DataStorage contract as live.
    // tx.origin is checked only in deployment.
    modifier onlyByPoolContract {
            if(!storageLive){
                require(tx.origin == currentGuardian || boolStorage[keccak256(abi.encodePacked("contract_exists", msg.sender))], "The contract address is invalid or the caller is not allowed.");
            } else {
                require(boolStorage[keccak256(abi.encodePacked("contract_exists", msg.sender))], "The contract address is invalid.");
            }
        _;
    }

    // ====== Storage Contract Control ======
    function getStorageStatus() external view returns(bool){
        return storageLive;
    }    

    function getCurrentGuardian() external view returns(address){
        return currentGuardian;
    }

    function setNewGuardian(address _newGuardian) external {
        require(msg.sender == currentGuardian, "Only callable by current storage guardian.");
        newGuardian = _newGuardian;
    }

    function confirmGuard() external {
        require(msg.sender == newGuardian, "Only callable by the new storage guardian.");
        address oldGuardian = currentGuardian;
        currentGuardian = newGuardian;
        delete newGuardian;
        emit GuardChange(oldGuardian, currentGuardian);
    } 

    // Not reversible. Once it is live, stays thay way.
    function setStorageLive() external {
        require(msg.sender == currentGuardian, "Only callable by current guardian.");
        storageLive = true;
    }   

    // ====== Storage Mappings Getters ======
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

    
    // ====== Storage Mappings Setters ======
    function setUintStorage(bytes32 _id, uint256 _value) external onlyByPoolContract{
        uintStorage[_id] = _value;
    }    
    
    function setBoolStorage(bytes32 _id, bool _value) external onlyByPoolContract{
        boolStorage[_id] = _value;
    }    

    function setAddressStorage(bytes32 _id, address _value) external onlyByPoolContract{
        addressStorage[_id] = _value;
    } 

    function setBytes32Storage(bytes32 _id, bytes32 _value) external onlyByPoolContract{
        bytes32Storage[_id] = _value;
    }


    // ====== Storage Mappings Deleters ======
    function deleteUintStorage(bytes32 _id) external onlyByPoolContract{
        delete uintStorage[_id];
    }    
    
    function deleteBoolStorage(bytes32 _id) external onlyByPoolContract{
        delete boolStorage[_id];
    }    

    function deleteAddressStorage(bytes32 _id) external onlyByPoolContract{
        delete addressStorage[_id];
    } 

    function deleteBytes32Storage(bytes32 _id) external onlyByPoolContract{
        delete bytes32Storage[_id];
    }
    
}
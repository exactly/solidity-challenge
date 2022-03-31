// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface DataStorageInterface {

    // ====== Storage Contract Control ======
    function getStorageStatus() external view returns(bool);
    function getCurrentGuardian() external view returns(address);
    function setNewGuardian(address _newGuardian) external;
    function confirmGuard() external;
    function setStorageLive() external;

    // ====== Storage Mappings Getters ======
    function getUintStorage(bytes32 _id) external view returns(uint256);
    function getBoolStorage(bytes32 _id) external view returns(bool);
    function getAddressStorage(bytes32 _id) external view returns(address);
    function getBytes32Storage(bytes32 _id) external view returns(bytes32);
    
    // ====== Storage Mappings Setters ======
    function setUintStorage(bytes32 _id, uint256 _value) external;
    function setBoolStorage(bytes32 _id, bool _value) external;
    function setAddressStorage(bytes32 _id, address _value) external; 
    function setBytes32Storage(bytes32 _id, bytes32 _value) external;

    // ====== Storage Mappings Deleters ======
    function deleteUintStorage(bytes32 _id) external;
    function deleteBoolStorage(bytes32 _id) external;
    function deleteAddressStorage(bytes32 _id) external;
    function deleteBytes32Storage(bytes32 _id) external;
    
}
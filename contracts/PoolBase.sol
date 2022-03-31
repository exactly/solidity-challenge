// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./interfaces/DataStorageInterface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @dev This contract handles the modifiers and environmental parameters that control the pool. 

contract PoolBase is AccessControl {


    bytes32 public constant POOL_MANAGER = keccak256("POOL_MANAGER"); // 

    // Events
    event NewManagerAdded(address indexed _newManager);
    event ManagerRemoved(address indexed _removedManager);

    // Getting access to the DataStorage Contract.
    DataStorageInterface dataStorage;
    
    // This contract will be deployed by the same address of the initial guardian. Afterwards Guardian may not be the same as the admin
    // if the guardian renounces to their guard.
    constructor(DataStorageInterface _dataStorageAddress){
        dataStorage = DataStorageInterface(_dataStorageAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(POOL_MANAGER, msg.sender);
    }


    // ====== Contract Modifiers ======
    // Besides the access control contract, the following modifiers will be used.
    modifier onlyCurrentGuardian() {
        require(msg.sender == dataStorage.getCurrentGuardian(), "Only callable by current guardian.");
        _;
    }

    modifier onlyPoolContract(){
        require(dataStorage.getBoolStorage(keccak256(abi.encodePacked("contract_exists", msg.sender))), "Invalid Contract Address.");
        _;
    }


    // ====== Pool Clearance  ======
    function addPoolManager (address _address) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(POOL_MANAGER, _address);
        emit NewManagerAdded(_address);
    }

    function removePoolManager (address _address) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(POOL_MANAGER, _address);
        emit ManagerRemoved(_address);
    }    

    // ====== Pool Environmental Variables  ======
    function setPoolBaseAddress() public onlyCurrentGuardian{
        dataStorage.setBoolStorage(keccak256(abi.encodePacked("contract_exists", address(this))), true);
        dataStorage.setAddressStorage(keccak256(abi.encodePacked("PoolBase_contract", address(this))), address(this));
    }

    function setPoolLive(bool _live) public onlyRole(POOL_MANAGER) {
        dataStorage.setBoolStorage(keccak256(abi.encodePacked("isPoolLive")), _live);
    }

    function setRewardsInterval(uint _daysToRewards) public onlyRole(POOL_MANAGER) {
        require(dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 daysRewBytes = keccak256(abi.encodePacked("daysToRewards"));
        dataStorage.setUintStorage(daysRewBytes, _daysToRewards * 1 days);
    }














}
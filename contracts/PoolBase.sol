// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./interfaces/DataStorageInterface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title This contract handles the modifiers and environmental parameters that control the pool. 

contract PoolBase is AccessControl, ReentrancyGuard{

    bytes32 public constant POOL_MANAGER = keccak256("POOL_MANAGER"); // 

    // Events
    event NewManagerAdded(address indexed _newManager);
    event ManagerRemoved(address indexed _removedManager);

    /// @notice Getting access to the DataStorage Contract.
    DataStorageInterface dataStorage;
    
    /// @notice This contract will be deployed by the same address of the initial guardian. Afterwards Guardian may not be the same as the admin
    /// @notice if the guardian renounces to their guard.
    constructor(DataStorageInterface _dataStorageAddress){
        dataStorage = DataStorageInterface(_dataStorageAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(POOL_MANAGER, msg.sender);
    }


    // ====== Contract Modifiers ======
    /// @notice Besides the access control contract, the following modifiers will be used.
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

    function updateDataStorageAddress(address _newAddress) public onlyRole(POOL_MANAGER){
        dataStorage = DataStorageInterface(_newAddress);
    }    

    // ====== Pool Environmental Variables  ======
    function setPoolBaseAddress() public onlyCurrentGuardian{
        dataStorage.setBoolStorage(keccak256(abi.encodePacked("contract_exists", address(this))), true);
        dataStorage.setAddressStorage(keccak256(abi.encodePacked("contract__address", "PoolBase")), address(this));
    }

    /// @dev Toggles the Pool Investing Switch. 
    /// @notice While live, anyone can invest but any state variable can be modified nor deleted.
    function setPoolLive(bool _live) public onlyRole(POOL_MANAGER) {
        bytes32 statusTag = keccak256(abi.encodePacked("isPoolLive"));
        dataStorage.setBoolStorage(statusTag, _live);
    }

    /// @dev Set the interval in days of the rewards period.
    function setRewardsInterval(uint _daysToRewards) public onlyRole(POOL_MANAGER) {
        require(dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 daysRewTag = keccak256(abi.encodePacked("daysToRewards"));
        dataStorage.setUintStorage(daysRewTag, _daysToRewards * 1 days);
    }

    /// @dev Set the interest per effective period.
    /// @param _rewardsInterest within the storage has 6 decimals.
    /// @notice E.G. If 0.001134 rate is desired, 0.001134 * (10**6) = 1134.
    function setRewardsInterest(uint _rewardsInterest) public onlyRole(POOL_MANAGER) {
        require(dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 rewardsIntTag = keccak256(abi.encodePacked("rewardsInterestPerPeriod"));
        dataStorage.setUintStorage(rewardsIntTag, _rewardsInterest);
    }

    /// @dev Set the max. contribution allowed for each user.
    /// @param _newContrLimit is a WEI value.
    function setContributionLimit(uint _newContrLimit) public onlyRole(POOL_MANAGER){
        require(dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 contrLimitTag = keccak256(abi.encodePacked("contributionLimit"));
        dataStorage.setUintStorage(contrLimitTag, _newContrLimit);
    }

    /// @dev Set the pool fees fraction that the pool charges for each deposit.
    /// @param _poolFees within the storage has 6 decimals.
    /// @notice E.G. If 0.001235 fees fraction are desired, 0.001235 * (10**6) = 1235.
    /// @notice Also it sets the state variable "poolFeesSet" as true.
    function setPoolFees(uint _poolFees) public onlyRole(POOL_MANAGER) {
        require(dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 poolFeesTag = keccak256(abi.encodePacked("poolFees"));
        bytes32 poolFeesSetTag = keccak256(abi.encodePacked("poolFeesSet"));
        
        dataStorage.setUintStorage(poolFeesTag, _poolFees);
        dataStorage.setBoolStorage(poolFeesSetTag, true);
        
    } 

    // ====== Pool Management Variables  ======   


    // ====== Pool Data Query  ======
    function getContractAddress(string memory _contractName) internal view returns(address){
        bytes32 addressTag = keccak256(abi.encodePacked("contract__address", _contractName));
        address contractAddress = dataStorage.getAddressStorage(addressTag);
        require(contractAddress == address(0x0), "Contract address not found.");
        return contractAddress;
    }







}
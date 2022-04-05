// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/// @title PoolBase, Base Pool Management Contract,
/// @author liorabadi
/// @notice Base control and management of the pool operation.

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
        _setPoolBaseAddress();
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

    // ====== Pool Variables Setters  ======
    /// @dev Store this contract address and existance on the main storage.
    /// @notice Called while deploying the contract. 
    function _setPoolBaseAddress() private {
        dataStorage.setBoolStorage(keccak256(abi.encodePacked("contract_exists", address(this))), true);
        dataStorage.setAddressStorage(keccak256(abi.encodePacked("contract_address", "PoolBase")), address(this));
    }

    /// @dev Toggles the Pool Investing Switch. 
    /// @notice While live, anyone can invest but any state variable can be modified nor deleted.
    function setPoolLive(bool _live) public onlyRole(POOL_MANAGER) {
        bytes32 statusTag = keccak256(abi.encodePacked("isPoolLive"));
        dataStorage.setBoolStorage(statusTag, _live);
    }

    /// @dev Sets the Pool Maximium size expressed on ether.
    /// @param _maxSize is a WEI value (or BigInt / BigNumber).
    function setPoolMaxSize(uint _maxSize) public onlyRole(POOL_MANAGER) {
        require(!dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 poolMaxSizeTag = keccak256(abi.encodePacked("poolMaxSize"));
        dataStorage.setUintStorage(poolMaxSizeTag, _maxSize);
    }    

    /// @dev Set the interval in days of the rewards period.
    function setRewardsInterval(uint _daysToRewards) public onlyRole(POOL_MANAGER) {
        require(!dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 daysRewTag = keccak256(abi.encodePacked("daysToRewards"));
        dataStorage.setUintStorage(daysRewTag, _daysToRewards);
    }

    /// @dev Set the interest per effective period.
    /// @param _rewardsInterest within the storage has 6 decimals.
    /// @notice E.G. If 0.001134 rate is desired, 0.001134 * (10**6) = 1134.
    function setRewardsInterest(uint _rewardsInterest) public onlyRole(POOL_MANAGER) {
        require(!dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 rewardsIntTag = keccak256(abi.encodePacked("rewardsInterestPerPeriod"));
        dataStorage.setUintStorage(rewardsIntTag, _rewardsInterest);
    }

    /// @dev Set the max. contribution allowed for each user.
    /// @param _newContrLimit is a WEI value.
    function setContributionLimit(uint _newContrLimit) public onlyRole(POOL_MANAGER){
        require(!dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 contrLimitTag = keccak256(abi.encodePacked("contributionLimit"));
        dataStorage.setUintStorage(contrLimitTag, _newContrLimit);
    }

    /// @dev Set the min. contribution allowed for each user.
    /// @param _newMinContr is a WEI value.
    function setMinContribution(uint _newMinContr) public onlyRole(POOL_MANAGER){
        bytes32 contrLimitTag = keccak256(abi.encodePacked("contributionLimit"));
        require(!dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        require(dataStorage.getUintStorage(contrLimitTag) > _newMinContr, "The min. contr. limit needs to be smaller than the max. limit.");
        
        bytes32 minContrTag = keccak256(abi.encodePacked("minContribution"));
        dataStorage.setUintStorage(minContrTag, _newMinContr);
    }
    

    /// @dev Set the pool fees fraction that the pool charges for each deposit.
    /// @param _poolFees within the storage has 6 decimals.
    /// @notice E.G. If 0.001235 fees fraction are desired, 0.001235 * (10**6) = 1235.
    /// @notice Also it sets the state variable "poolFeesSet" as true.
    /// @notice If the poolFees are higher than the Interest Per period, it means tha the user will have to 
    /// @notice wait more than one period to recover that fee. Management & Operation choices...
    function setPoolFees(uint _poolFees) public onlyRole(POOL_MANAGER) {
        require(!dataStorage.getBoolStorage(keccak256(abi.encodePacked("isPoolLive"))), "The pool is currently closed.");
        bytes32 poolFeesTag = keccak256(abi.encodePacked("poolFees"));
        bytes32 poolFeesSetTag = keccak256(abi.encodePacked("poolFeesSet"));
        
        dataStorage.setUintStorage(poolFeesTag, _poolFees);
        dataStorage.setBoolStorage(poolFeesSetTag, true);
    } 

    // ====== Pool Data Getters  ======
    /// @dev Getters for each pool variable.

    function getContractAddress(string memory _contractName) internal view returns(address){
        bytes32 addressTag = keccak256(abi.encodePacked("contract_address", _contractName));
        address contractAddress = dataStorage.getAddressStorage(addressTag);
        require(contractAddress != address(0x0), "Contract address not found.");
        return contractAddress;
    }

    function getPoolBaseAddress() public view returns(address){
        bytes32 addressTag = keccak256(abi.encodePacked("contract_address", "PoolBase"));
        address contractAddress = dataStorage.getAddressStorage(addressTag);
        return contractAddress;
    }    

    function getPoolState() public view returns(bool){
        bytes32 statusTag = keccak256(abi.encodePacked("isPoolLive"));
        return dataStorage.getBoolStorage(statusTag);
    }

    function getPoolMaxSize() public view returns(uint){
        bytes32 poolMaxSizeTag = keccak256(abi.encodePacked("poolMaxSize"));
        return dataStorage.getUintStorage(poolMaxSizeTag);        
    }

    function getRewardsInterval() public view returns(uint){
        bytes32 daysRewTag = keccak256(abi.encodePacked("daysToRewards"));
        return dataStorage.getUintStorage(daysRewTag);
    }

    function getRewardsInterest() public view returns(uint){
        bytes32 rewardsIntTag = keccak256(abi.encodePacked("rewardsInterestPerPeriod"));
        return dataStorage.getUintStorage(rewardsIntTag);
    }

    function getContributionLimit() public view returns(uint){
        bytes32 contrLimitTag = keccak256(abi.encodePacked("contributionLimit"));
        return dataStorage.getUintStorage(contrLimitTag);
    }

    function getMinContribution() public view returns(uint){
        bytes32 minContrTag = keccak256(abi.encodePacked("minContribution"));
        return dataStorage.getUintStorage(minContrTag);
    }    

    function getPoolFees() public view returns(uint){
        bytes32 poolFeesTag = keccak256(abi.encodePacked("poolFees"));
        return dataStorage.getUintStorage(poolFeesTag);
    }






}
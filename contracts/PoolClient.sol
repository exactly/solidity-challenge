// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/// @title PoolClient, Pool Client Contract,
/// @author liorabadi
/// @notice Contract to perform deposits, withdrawals and injections.
/// @notice No tokens are stored on this contract.
/// @notice The tokens are sent back and forth between this contract and the PoolVault.
/// @notice The tokens are sent back and forth between this contract and the PoolVault.

import "./PoolBase.sol";
import "./interfaces/rwETHTokenInterface.sol";
import "./interfaces/PoolClientInterface.sol";
import "./interfaces/TokenBalancesInterface.sol";
import "./interfaces/PoolVaultInterface.sol";

contract PoolClient is PoolBase {

    event UserStaked(address indexed _staker, uint _ethAmount, uint _time);
    event RewardsInjected(uint _lastRewardTime, uint _amountInjected);
    event UserUnstaked(address indexed _unstaker, uint _ethAmount, uint _time);

    constructor(DataStorageInterface _dataStorageAddress) PoolBase(_dataStorageAddress) {
        _setPoolClientAddress();
    }

    modifier depositCompliance() {
        PoolVaultInterface poolVault = PoolVaultInterface(getContractAddress("PoolVault"));
        bytes32 statusTag = keccak256(abi.encodePacked("isPoolLive"));
        bytes32 daysRewTag = keccak256(abi.encodePacked("daysToRewards"));
        bytes32 rewardsIntTag = keccak256(abi.encodePacked("rewardsInterestPerPeriod"));
        bytes32 contrLimitTag = keccak256(abi.encodePacked("contributionLimit"));
        bytes32 minContrTag = keccak256(abi.encodePacked("minContribution"));
        bytes32 poolMaxSizeTag = keccak256(abi.encodePacked("poolMaxSize"));
        bytes32 stakedByUserTag = keccak256(abi.encodePacked("ether_staked_by_user", msg.sender));
        uint newBalance  = dataStorage.getUintStorage(stakedByUserTag) + msg.value;
        
        require(dataStorage.getUintStorage(daysRewTag) != 0, "The team needs to set a reward interval.");
        require(dataStorage.getUintStorage(rewardsIntTag) != 0 , "The team needs to set a reward ratio.");
        require(dataStorage.getUintStorage(contrLimitTag) != 0, "The team needs to set a contribution limit.");
        require(newBalance <= dataStorage.getUintStorage(contrLimitTag), "Max. current contribution limit exceeded.");
        require(dataStorage.getUintStorage(minContrTag) <= msg.value, "Value to deposit needs to be higher than the current minimum contribution limit.");
        require(poolVault.poolEtherSize() + msg.value <= dataStorage.getUintStorage(poolMaxSizeTag), "Max. Pool size overflow with that amount of deposit.");
        
        _;
    }

    modifier withdrawCompliance(uint _rwEtherWithdrawal) {
        PoolVaultInterface poolVault = PoolVaultInterface(getContractAddress("PoolVault"));
        rwETHTokenInterface rwEthToken = rwETHTokenInterface(getContractAddress("rwETHToken"));
        bytes32 statusTag = keccak256(abi.encodePacked("isPoolLive"));

        require(rwEthToken.balanceOf(msg.sender) >= _rwEtherWithdrawal, "You don't have that amount of tokens in your account.");
        require(poolVault.poolEtherSize() - rwEthToken.calcEthValue(_rwEtherWithdrawal) >= 0, "Pool size cannot be smaller than zero.");
        require(dataStorage.getBoolStorage(statusTag), "The pool is currently paused");
        _;
    }

    modifier injectionComliance() {
        bytes32 statusTag = keccak256(abi.encodePacked("isPoolLive"));

        require(!dataStorage.getBoolStorage(statusTag), "The pool is currently live.");
      _;
    }
   
    /// @dev Store this contract address and existance on the main storage.
    /// @notice Called while deploying the contract. 
    function _setPoolClientAddress() private {
        dataStorage.setBoolStorage(keccak256(abi.encodePacked("contract_exists", address(this))), true);
        dataStorage.setAddressStorage(keccak256(abi.encodePacked("contract_address", "PoolClient")), address(this));
    }     

    /// @dev Main Staking function. Allows users to deposit ether in exchange of rwEther.
    /// @notice The exchange rate (ETH / rwETH) is calculated within the mint function.  
    /// @notice The minting function updates only the current rwEth supply.
    /// @notice The mint function comes with a built-in ether/rwEther converter.
    /// @notice Once the user deposits, the ether go to the vault contract.
    function deposit() external payable depositCompliance() nonReentrant() {
        rwETHTokenInterface rwEthToken = rwETHTokenInterface(getContractAddress("rwETHToken"));
        rwEthToken.mint(msg.sender, msg.value);

        bytes32 currentEthSupplyTag = keccak256(abi.encodePacked("totalSupply_Ether"));
        dataStorage.increaseUintStorage(currentEthSupplyTag, msg.value);

        emit UserStaked(msg.sender, msg.value , block.timestamp);
        _depositToVault();
    }

    /// @dev Transfers the staked ether to the vault.
    function _depositToVault() private {
        PoolVaultInterface poolVault = PoolVaultInterface(getContractAddress("PoolVault"));
        poolVault.storeEther{value: msg.value}(msg.sender);
    }
  

    /// @dev Helps the team calculate the rewards. Also, assigns the amount to inject into a variable.
    function calculateRewards() public onlyRole(POOL_MANAGER) injectionComliance() {
        TokenBalancesInterface poolTokenBalances = TokenBalancesInterface(getContractAddress("TokenBalances"));
        
        bytes32 rewardsToInjectTag = keccak256(abi.encodePacked("rewardsToInject"));
               
        uint rewardsInterest = getRewardsInterest();
        uint rewardsToInject = poolTokenBalances.getTotalEtherStaked() * rewardsInterest / (10**6);
        dataStorage.setUintStorage(rewardsToInjectTag, rewardsToInject);
    }

    /// @dev Gets the lastest amount of ether to inject.
    function getRewardsToInject() public view onlyRole(POOL_MANAGER) returns(uint){
        bytes32 rewardsToInjectTag = keccak256(abi.encodePacked("rewardsToInject"));
        return dataStorage.getUintStorage(rewardsToInjectTag);
    }
    
    /// @dev This function logic prevents the team to inject a wrong amount of ether as rewards.
    /// @notice With this function, both the team and the users will have the insuarance that the right amount will be injected.
    /// @notice the require reverts the process if a wrong amount is willed to be injected.
    /// @notice this function does not updates the poolEther size, it just updates the total amount of ether on the contract network.
    function rewardsInjector() public payable onlyRole(POOL_MANAGER) injectionComliance() {
        require(msg.value == getRewardsToInject(), "Invalid ether interest injected.");
        PoolVaultInterface poolVault = PoolVaultInterface(getContractAddress("PoolVault"));

        bytes32 lastRewardTimeTag = keccak256(abi.encodePacked("lastRewardTime"));
        bytes32 totalRewardsInjectedTag = keccak256(abi.encodePacked("totalRewardsInjected"));   
        bytes32 currentEthSupplyTag = keccak256(abi.encodePacked("totalSupply_Ether"));             
     
        dataStorage.setUintStorage(lastRewardTimeTag, block.timestamp);
        dataStorage.increaseUintStorage(totalRewardsInjectedTag, msg.value);
        dataStorage.increaseUintStorage(currentEthSupplyTag, msg.value);        

        poolVault.processRewards{value: msg.value}();
        emit RewardsInjected(dataStorage.getUintStorage(lastRewardTimeTag), msg.value);
    }

    /// @dev Main Unstaking function. Allows users to deposit rwEther in exchange of Ether.
    /// @notice The withdrawEther function updates the total_ether_supply and its staked amount.
    /// @notice Once it is called, the rwEth amount is burned and the vault sends to this contract the ether counterpart.
    function withdraw(uint _rwEthAmount) external withdrawCompliance(_rwEthAmount) nonReentrant(){
        rwETHTokenInterface rwEthToken = rwETHTokenInterface(getContractAddress("rwETHToken"));
        PoolVaultInterface poolVault = PoolVaultInterface(getContractAddress("PoolVault"));

        rwEthToken.transfer(address(this), _rwEthAmount);
        uint etherToUnstake = rwEthToken.calcEthValue(_rwEthAmount);
        rwEthToken.burn(_rwEthAmount);

        poolVault.withdrawEther(msg.sender, etherToUnstake);
        emit UserStaked(msg.sender, etherToUnstake, block.timestamp);
    }

    function getPoolClientAddress() public view returns(address){
        bytes32 addressTag = keccak256(abi.encodePacked("contract_address", "PoolClient"));
        address contractAddress = dataStorage.getAddressStorage(addressTag);
        return contractAddress;
    }    
    




}

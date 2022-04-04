// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./RewardETH.sol";

contract PoolManagement is RewardETH {

    // ================= VARIABLES ====================   
    address public team;
    address poolManagement;
    
    bytes32 public constant POOL_MANAGER = keccak256("POOL_MANAGER"); // 
          
    uint256 public lockedEther =  0 ether;    
    uint256 daysToRewards;
    uint256 public lastRewardTime;
    uint256 public totalRewardsInjected; // WEI Value
    uint256 rewardsToInject; // WEI Value
    uint256 public contributionLimit; // WEI Value
    uint256 public rewardsInterestPerPeriod;
    uint256 public poolFees;
    uint256 feesEarnings;
    uint256 public rwETH_Threshold;
    uint256 public rwEthCirc;
    
    bool public poolLive = false;
    bool public poolFeesSet = false;
    
    mapping(address => uint256) public lastTimeInvested;
    mapping(address => uint256) public amountStakedByUser;
    mapping(address => uint256) public lastAmountStakedByUser;
    mapping(address => uint256) public lastAmountUnstakedByUser;
    mapping(address => uint256) public etherPaidToUser;
    mapping(address => uint256) public rwEtherCollected;
    

    // ==================== EVENTS ====================

    event NewManagerAdded(address indexed _address);
    event ManagerRemoved(address indexed _address);
    event PoolLive(bool _state);
    event RewardsIntervalChanged(uint _time, uint _newInterval);
    event InterestChanged(uint _time, uint _newInterest);
    event StakeInvestment(address indexed _user, uint _time, uint _amount);
    event UnstakeInvestment(address indexed _user, uint _time, uint _amount);
    event RewardsInjected(uint _time, uint _amount);
    
    /// @dev There is an initial mint amount of rewards while deploying to get a liquid supply of tokens.
    /// @dev The ever first "lastRewardTime" registered will be the deployment time, afterwards this will be overwritten by the next rewards timestamps.
    /// @dev The team should also set a Threshold of rwETH balance of the contract to assure its supply while its operating.
    constructor() {
        team = msg.sender;
        poolManagement = address(this);
        lastRewardTime = block.timestamp;
        _setupRole(POOL_MANAGER, msg.sender);
        mint(poolManagement, 10 * 10**decimals()    );
    }


    // ============== FUNCTION MODIFIERS ==============

    modifier stakeCompliance() {
        require(poolLive, "The pool is currently paused.");
        require(daysToRewards != 0, "The team needs to set a reward interval.");
        require(rewardsInterestPerPeriod != 0, "The team needs to set a reward ratio.");
        require(contributionLimit != 0, "The team needs to set a contribution limit.");
        require(poolFeesSet, "The team needs to set the pool fees.");
        require(msg.value <= contributionLimit, "Max. Contribution Limit exceeded.");
        // Prevent other contracts from interacting with this function.
        require(tx.origin == msg.sender);
        _;
    }

    modifier unstakeCompliance(uint _rwEtherDeposit) {
        require(poolLive, "The pool is currently paused.");
        require(amountStakedByUser[msg.sender] > 0, "You haven't staked any Ethers.");
        require(balanceOf(msg.sender) >= _rwEtherDeposit, "You don't have that amount of rwEther in your account.");
        // Prevent other contracts from interacting with this function.
        require(tx.origin == msg.sender);
        _;
    }


    // ============== TEAM FUNCTIONS ==================

    /// @dev Inmediately after deploying tasks to do by the team to get this contract operational:
    /// @dev 1) Should set Rewards Interval, Rewards Interest, rwETH Threshold & Contribution Limit, Pool Fees.
    /// @dev NOTE: The Contr. Limit. can't be higher than the threshold. It is recommended to define the Threshold as x times the Contr Limit (e.g 2x)
    /// @dev NOTE: All the Token Values are expressed with 18 decimals (e.g. WEI for Ether)
    /// @dev 2) Should set the Pool Live
    /// @dev 3) OPTIONAL: Add Pool Managers to help with this tasks.

    function addPoolManager (address _address) public onlyRole(DEFAULT_ADMIN_ROLE) {
      grantRole(POOL_MANAGER, _address);
      emit NewManagerAdded(_address);
    }

    function removePoolManager (address _address) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(POOL_MANAGER, _address);
        emit ManagerRemoved(_address);
    }

    function setPoolLive(bool _live) public onlyRole(POOL_MANAGER) {
        poolLive = _live;
        emit PoolLive(_live);
    }

    function setRewardsInterval(uint _daysToRewards) public onlyRole(POOL_MANAGER) {
        require(!poolLive, "The pool is currently live.");
        daysToRewards = _daysToRewards * 1 days; // The pool should be paused to perform this action.
        emit RewardsIntervalChanged(block.timestamp, _daysToRewards);
    }

     function setRewardsInterest(uint _rewardsInterest) public onlyRole(POOL_MANAGER) {
        require(!poolLive, "The pool is currently live."); // 6 decimals. If 0.001834 rate desired, 0.001834 * (10**6) = 1834.
        rewardsInterestPerPeriod = _rewardsInterest; // Should be calculated with the desired APY taking into account the compound interest. A spreadsheet is provided to do so.
        emit InterestChanged(block.timestamp, rewardsInterestPerPeriod);
    }

    function setContrLimitAndTheshold(uint _newContributionLimit, uint _newThreshold) public onlyRole(POOL_MANAGER) {
        require(!poolLive, "The pool is currently live.");
        require(_newContributionLimit < _newThreshold, "The Threshold needs to be higher than the Contribution Limit.");
        contributionLimit = _newContributionLimit; // WEI value.
        rwETH_Threshold = _newThreshold; // WEI value.
    }

    function setPoolFees(uint _poolFees) public onlyRole(POOL_MANAGER) {
        poolFees = _poolFees; //   // 6 decimals. If 0.001134 rate desired, 0.001134 * (10**6) = 1134. 
        poolFeesSet = true; // // Smaller than the rewardsInterestPerPeriod (If that happens, investors should leave their money more than one period).
    }

    function calculateRewards() public onlyRole(POOL_MANAGER) returns(uint) { 
            rewardsToInject = lockedEther * rewardsInterestPerPeriod / (10**6);
            return rewardsToInject; // Will be a WEI value!
    }

    function getRewardsToInject() public view onlyRole(POOL_MANAGER) returns(uint) { 
            return rewardsToInject; // This function is a gas-free way for the team to get the last rewardsToInject calculated value and make the injectRewards process easier.
    }

    function getFeeEarnings() public view onlyRole(POOL_MANAGER) returns(uint) { 
            return feesEarnings;
    }

    function injectRewards() public onlyRole(POOL_MANAGER) nonReentrant() payable {
        require(!poolLive, "The pool is open at this moment.");
        require(msg.value == rewardsToInject,  "The team needs to inject the right amount.");
        
        lastRewardTime = block.timestamp;

        totalRewardsInjected += msg.value;
        lockedEther += msg.value;

        emit RewardsInjected(lastRewardTime, msg.value);
    }

    function updateCircRewardEther() public onlyRole(POOL_MANAGER) returns(uint256){
        rwEthCirc = _updateCircRewardEther();
        return rwEthCirc;
    }

    
    // ============ COMMON USAGE FUNCTIONS ============

    function stakeETH() public payable stakeCompliance() nonReentrant() {
        // Update Total Amount of rwEth circulating.
        rwEthCirc = _updateCircRewardEther();

        lastTimeInvested[msg.sender] = block.timestamp;

        /// @dev automatically before excecuting any further code, the function checks if the balance respects the theshold.
        if (balanceOf(poolManagement) < rwETH_Threshold ){
            mint(poolManagement, rwETH_Threshold);
        }

        // Actual Stake Investment & Fees Collected by the Team.
        (uint amountToStake, uint feesCollected) = _feesCalc(msg.value);

        // Store the amount staked by user and its staking state.
        amountStakedByUser[msg.sender] += amountToStake;
        lastAmountStakedByUser[msg.sender] = amountToStake;
        uint rwEtherToMint;
        
        // Calculate the rwETH in exchange.
        /// @dev It is taken into account the rewards circulating instead of the TotalSupply to both prevent running out from rwEth to provide 
        /// @dev and also to track the real market price based in its available supply (the circulating one).
        /// @dev If no rwEther is circulating (outside this contract) the price should be 1:1
        /// @dev When there is rwEth in circulation, the price will be calculated with the ratio of rwEthCirculating/ETHlocked.

        if(rwEthCirc > 0){
            rwEtherToMint = amountToStake  * rwEthCirc / lockedEther;
            rwEtherCollected[msg.sender] += rwEtherToMint;            
        } else {
            rwEtherToMint = amountToStake / 1 ;
            rwEtherCollected[msg.sender] += rwEtherToMint;
        }        

        // Increase the pool size.
        lockedEther += amountToStake;
        // rwETH management.
        /// @dev If the desired amount to mint 
        if (rwEtherToMint < balanceOf(poolManagement))
        ...
        mint(msg.sender, rwEtherToMint);
        
        // Transfer fees back to the Team.
        payable(team).transfer(feesCollected);
        feesEarnings += feesCollected;
         
        emit StakeInvestment(msg.sender, lastTimeInvested[msg.sender], amountToStake);
    }   

    //Input _rwEtherDeposit has 18 decimals.
    function unstakeETH(uint _rwEtherDeposit) public payable unstakeCompliance(_rwEtherDeposit) nonReentrant() {
        
        uint amountToUnstake;

        // Take out the rwETH tokens. Input _rwEtherDeposit has 18 decimals.
        if(totalSupply() != 0){
            amountToUnstake = _rwEtherDeposit * lockedEther / totalSupply();
        } else {
            amountToUnstake = _rwEtherDeposit * 1;
        }        
        
        require(lockedEther >= amountToUnstake, "Contract lacking ether.");
        _burn(msg.sender, _rwEtherDeposit);

        rwEtherCollected[msg.sender] -= _rwEtherDeposit;
        
        // Transfer Ether back to the Caller.
        payable(msg.sender).transfer(amountToUnstake);
                
        emit UnstakeInvestment(msg.sender, block.timestamp, amountToUnstake);

        // Update the Staking variables.
        lastAmountUnstakedByUser[msg.sender] = amountToUnstake;
        amountStakedByUser[msg.sender] -= amountToUnstake;
        lockedEther -= amountToUnstake;
    }


    // =============== GETTER FUNCTIONS ===============

    // Has 8 decimals.
    function myPoolShare() public view returns(uint){
        require(lockedEther > 0, "The pool has no investors");
        require(amountStakedByUser[msg.sender] > 0, "You have not invested anything.");
        return amountStakedByUser[msg.sender] / lockedEther  * (10**8);
    }

    function showRewardPeriod() public view returns(uint){
        require(daysToRewards > 0, "No period set yet");
        return daysToRewards / (1 days); // Outputs days.
    }

    function timeToRewards() public view returns(uint){
        require(daysToRewards > 0, "No period set yet");
        return (lastRewardTime + daysToRewards - block.timestamp) / (1 days); // Outputs days.
    }

    // ============== INTERNAL FUNCTIONS ==============

    function _feesCalc(uint _initialInvestment) internal view returns(uint, uint){
        require(poolFeesSet, "The team needs to set the pool fees.");
        uint netAmount = _initialInvestment - _initialInvestment * poolFees / _sixDecimals();
        uint feeCollected = _initialInvestment * poolFees / _sixDecimals();
        return(netAmount, feeCollected);
    }

    function _sixDecimals() internal pure returns(uint){
        return 10**6;
    }
    
    function _updateCircRewardEther() internal returns(uint){
        rwEthCirc = totalSupply() - balanceOf(poolManagement);
        return rwEthCirc;
    }

    
}



// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./RewardETH.sol";

contract PoolManagement is RewardETH {

    // ================= VARIABLES ====================   

    address public team;
    address poolManagement;
          
    uint256 public lockedEther =  0 ether;    
    uint256 daysToRewards;
    uint256 public lastRewardTime;
    uint256 public totalRewardsInjected;
    uint256 rewardsToInject;
    uint256 public contributionLimit; // WEI value.
    uint256 public rewardsInterestPerPeriod;
    uint256 public poolFees;
    
    bool public poolLive = false;
    bool public poolFeesSet = false;
    bool reEntrancyMutex = false;

    mapping(address => uint256) public lastTimeInvested;
    mapping(address => uint256) public amountStakedByUser;
    mapping(address => uint256) public etherPaidToUser;
    mapping(address => uint256) public rwEtherCollected;
    

    // ==================== EVENTS ====================

    event PoolLive(bool _state);
    event RewardsIntervalChanged(uint _time, uint _newInterval);
    event InterestChanged(uint _time, uint _newInterest);
    event StakeInvestment(address _user, uint _time, uint _amount);
    event UnstakeInvestment(address _user, uint _time, uint _amount);
    event RewardsInjected(uint _time, uint _amount);
        
    constructor() {
        team = msg.sender;
        poolManagement = address(this);
        lastRewardTime = block.timestamp;
    }


    // ============== FUNCTION MODIFIERS ==============

    modifier stakeCompliance() {
        require(poolLive, "The pool is currently paused.");
        require(daysToRewards != 0, "The team needs to set a reward interval.");
        require(rewardsInterestPerPeriod != 0, "The team needs to set a reward ratio.");
        require(contributionLimit != 0, "The team needs to set a contribution limit.");
        require(poolFeesSet, "The team needs to set the pool fees.");
        require(msg.value <= contributionLimit, "Max. Contribution Limit exceeded.");
        _;
    }

    modifier unstakeCompliance(uint _rwEtherDeposit) {
        require(poolLive, "The pool is currently paused.");
        require(amountStakedByUser[msg.sender] > 0, "You haven't staked any Ethers.");
        require(balanceOf(msg.sender) >= _rwEtherDeposit, "You don't have that amount of rwEther in your account.");
        require(!reEntrancyMutex);
        // Prevent other contracts from interacting with this function.
        require(tx.origin == msg.sender);
        _;
    }


    // ============== TEAM FUNCTIONS ==================

    function setPoolLive(bool _live) public onlyOwner {
        poolLive = _live;
        emit PoolLive(_live);
    }

    function setRewardsInterval(uint _daysToRewards) public onlyOwner {
        require(!poolLive, "The pool is currently live.");
        daysToRewards = _daysToRewards * 1 days; // The pool should be paused to perform this action.
        emit RewardsIntervalChanged(block.timestamp, _daysToRewards);
    }

     function setRewardsInterest(uint _rewardsInterest) public onlyOwner {
        require(!poolLive, "The pool is currently live."); // 6 decimals. If 0.001834 rate desired, 0.001834 * (10**6) = 1834.
        rewardsInterestPerPeriod = _rewardsInterest; // Should be calculated with the desired APY taking into account the compound interest. A spreadsheet is provided to do so.
        emit InterestChanged(block.timestamp, rewardsInterestPerPeriod);
    }

    function setContributionLimit(uint _newContributionLimit) public onlyOwner {
        require(!poolLive, "The pool is currently live.");
        contributionLimit = _newContributionLimit; // WEI value.
    }

    function setPoolFees(uint _poolFees) public onlyOwner {
        poolFees = _poolFees; //   // 6 decimals. If 0.001134 rate desired, 0.001134 * (10**6) = 1134. 
        poolFeesSet = true; // // Smaller than the rewardsInterestPerPeriod (If that happens, investors should leave their money more than one period).
    }

    function calculateRewards() public onlyOwner returns(uint) { 
            rewardsToInject = lockedEther * rewardsInterestPerPeriod / (10**6);
            return rewardsToInject; // Will be a WEI value!
    }

    function seeRewardsToInject() public view onlyOwner returns(uint) { 
            return rewardsToInject; // This function is a gas-free way for the team to get the last rewardsToInject calculated value and make the injectRewards process easier.
    }

    function injectRewards() public onlyOwner payable {
        require(!poolLive, "The pool is open at this moment.");
        require(msg.value == rewardsToInject,  "The team needs to inject the right amount.");
        
        lastRewardTime = block.timestamp;

        totalRewardsInjected += msg.value;
        lockedEther += msg.value;

        emit RewardsInjected(lastRewardTime, msg.value);
    }

    
    // ============ COMMON USAGE FUNCTIONS ============

    function stakeETH() public payable stakeCompliance() {
        // Prevent other contracts from interacting with this function.
        require(tx.origin == msg.sender);

        lastTimeInvested[msg.sender] = block.timestamp;

        // Actual Stake Investment & Fees Collected by the Team.
        (uint amountToStake, uint feesCollected) = _feesCalc(msg.value);

        // Store the amount staked by user and its staking state.
        amountStakedByUser[msg.sender] += amountToStake;
        uint rwEtherToMint;
        
        // Calculate the rwETH in exchange.
        if(totalSupply() != 0){
            rwEtherToMint = amountToStake  *  totalSupply() / lockedEther;
            rwEtherCollected[msg.sender] += rwEtherToMint;            
        } else {
            rwEtherToMint = amountToStake / 1 ;
            rwEtherCollected[msg.sender] += rwEtherToMint;
        }        

        // Increase the pool size.
        lockedEther += amountToStake;
        // Send the rwETH.
        mint(msg.sender, rwEtherToMint);
        
        // Transfer fees back to the Team.
        payable(team).transfer(feesCollected);
         
        emit StakeInvestment(msg.sender, lastTimeInvested[msg.sender], amountToStake);
    }   

    //Input _rwEtherDeposit has 18 decimals.
    function unstakeETH(uint _rwEtherDeposit) public payable unstakeCompliance(_rwEtherDeposit){
        
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
        reEntrancyMutex = true;
        payable(msg.sender).transfer(amountToUnstake);
        reEntrancyMutex = false;
         
        emit UnstakeInvestment(msg.sender, block.timestamp, amountToUnstake);

        // Update the Staking variables.
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
        uint netAmount = _initialInvestment - _initialInvestment * poolFees / (10**6);
        uint feeCollected = _initialInvestment * poolFees / (10**6);
        return(netAmount, feeCollected);
    }


}



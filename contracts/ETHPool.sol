// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

    ///@title ETHPool Challenge
    ///@author Jeisson Niño
    /**
    @notice ETHPool provides a service where 
    people can deposit ETH and they will receive weekly rewards
    */   
contract ETHPool {
    
    uint256 public lastRewardDate;

    /**@dev    
    They are used to carry the total of 
    these values ​​and thus not have to make arrangement tours
    */
    uint256 public totalReward;
    uint256 public totalUserDeposits;

    struct detailUser {
        uint256 deposit;
        uint256 dateDeposit;
    }
    mapping(address => detailUser) public users;

    mapping(address => bool) public usersTeam;

    ///@dev Emitted when the team deposits the winnings
    ///@param from The address of the user who deposits
    ///@param value ETH value sent by user
    ///@param date date when the deposit is made
    event DepositRewardTeam(
        address from,
        uint256 value,
        uint256 date
    );


    ///@dev Emitted when the team deposits the winnings
    ///@param from The address of the team who deposits
    ///@param value ETH value sent by team
    ///@param date date when the deposit is made
    event DepositEthUser(
        address from, 
        uint256 value, 
        uint256 date);


    ///@dev Emitted when the user withdraws
    ///@param from The address of the user making the withdrawal
    ///@param value ETH withdrawn value
    ///@param date date of when the withdrawal is made
    event Withdraw(
        address from,
        uint256 value,
        uint256 date);


    modifier onlyTeam() {
        require(
            usersTeam[msg.sender] == true,
            "Exclusive function of the team"
        );
        _;
    }  

    
    constructor() {
        lastRewardDate = block.timestamp;
        usersTeam[msg.sender] = true;
    }


    function depositRewardTeam() external payable onlyTeam {
        require(
            block.timestamp > (lastRewardDate + 1 weeks),
            "It hasn't been a week"
        );
        
        totalReward += msg.value;
        lastRewardDate = block.timestamp;
        emit DepositRewardTeam(
            msg.sender,
            msg.value,
            block.timestamp
        );
    }

    function depositEthUser() external payable {
      
        users[msg.sender].deposit += msg.value;
        users[msg.sender].dateDeposit = block.timestamp;

        totalUserDeposits += msg.value;

        emit DepositEthUser(msg.sender, msg.value,  block.timestamp);
    }



    /**@dev        
    Withdrawal of winnings plus the deposit 
    is allowed if the user blocked the ETH before 
    the team deposited the winnings into the contract. 
    if not and you have blocked ETH, you can withdraw it.

    The percentage is handled using the state variables. 
    The treatment of converting decimals into integers is done
    */ 
    function withdraw() external {
      
        require(
            users[msg.sender].deposit > 0,
            "The user has not deposited"
        );
       
        if (users[msg.sender].dateDeposit < lastRewardDate) {
            uint256 porcentagePool = (users[msg.sender].deposit * 1 ether) /
                totalUserDeposits;

            uint256 earningsAndDeposit = users[msg.sender].deposit +
                (totalReward * porcentagePool) /
                1 ether;

            totalUserDeposits -= users[msg.sender].deposit;

            totalReward =
                totalReward -
                (totalReward * porcentagePool) /
                1 ether;

            users[msg.sender].deposit = 0;

            (bool success, ) = payable(msg.sender).call{
                value: earningsAndDeposit
            }("");

            require(success, "Transfer failed");

            emit Withdraw(
                msg.sender,
                earningsAndDeposit,
                block.timestamp
            );
        } else {
            (bool success, ) = payable(msg.sender).call{
                value: users[msg.sender].deposit
            }("");

            require(success, "Transfer failed");
        }
    }
}

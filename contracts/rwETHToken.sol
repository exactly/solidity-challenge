// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/// @title rwETHToken, Reward Ether Token contract,
/// @author liorabadi
/// @notice Cretion of the reward token and its functions. 


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./PoolBase.sol";
import "./interfaces/TokenBalancesInterface.sol";

contract rwETHToken is PoolBase, ERC20 {

    event TokensMinted(address indexed _to, uint _rwEthAmount, uint _ethAmount);
    event TokensBurned(address indexed _from, uint _rwEthAmount);

    constructor(DataStorageInterface _dataStorageAddress) PoolBase(_dataStorageAddress) ERC20("Reward ETH Token", "rwETH"){
        _setRwETHTokenAddress();
    }

    /// @dev Store this contract address and existance on the main storage.
    /// @notice Called while deploying the contract. 
    function _setRwETHTokenAddress() private {
        dataStorage.setBoolStorage(keccak256(abi.encodePacked("contract_exists", address(this))), true);
        dataStorage.setAddressStorage(keccak256(abi.encodePacked("contract_address", "rwETHToken")), address(this));
    }    
    
    /// @dev Calculate the equivalent Ether to a certain rwEther amount.
    function calcEthValue(uint _rwEthAmount) public view returns(uint){
        TokenBalancesInterface poolTokenBalances = TokenBalancesInterface(getContractAddress("TokenBalances"));
        uint currentEthBalance = poolTokenBalances.getTotalEthSupply();
        uint currentRwEthSupply = poolTokenBalances.getTotalrwEthSupply();

        if(currentRwEthSupply != 0){
            return  (_rwEthAmount * currentEthBalance / currentRwEthSupply);            
        }
        return _rwEthAmount;
    } 

    /// @dev Calculate the equivalent rwEther to a certain Ether amount.
    function calcRwEthValue(uint _ethAmount) public view returns(uint){
        TokenBalancesInterface poolTokenBalances = TokenBalancesInterface(getContractAddress("TokenBalances"));
        uint currentEthBalance = poolTokenBalances.getTotalEthSupply();
        uint currentRwEthSupply = poolTokenBalances.getTotalrwEthSupply();

        if(currentRwEthSupply != 0){
            require(currentEthBalance > 0, "Currently there are no ether stored. Cannot divide by zero.");
            return  (_ethAmount * currentRwEthSupply / currentEthBalance );            
        }
        return _ethAmount;
    }   

    /// @dev Calculate the Eth / rwEth ratio a.k.a rwEth price expressed in Ether (wei)
    function getUnitPrice() public view returns(uint){
        return calcEthValue(1 ether);
    }  

    /// @dev Mints reward ether (rwEth) as a receipt of investment.
    function mint(address _to, uint _ethAmount) external onlyPoolContract(){
        bytes32 rwEthSupplyTag = keccak256(abi.encodePacked("totalSupply_rewardEther"));
        require(_ethAmount > 0 , "Mint amount needs to be greater than zero.");
        // Calculate the equivalent rwEth amount (deppends on the current repricing status).
        uint rwEtherCalc = calcRwEthValue(_ethAmount);
        _mint(_to, rwEtherCalc);
        dataStorage.increaseUintStorage(rwEthSupplyTag, rwEtherCalc);
        emit TokensMinted(_to, rwEtherCalc, _ethAmount);
    }

    /// @dev Burns rwEther.
    /// @notice Used while withdrawing funds to keep balanced the system.
    /// @notice No counterpart of ethers are transfered back to the burner while performing this call.
    /// @notice After calling this function, it is needed to perform the ether counterpart transfer to the involved parts.
    function burn(uint _rwEthAmount) external onlyPoolContract(){
        TokenBalancesInterface poolTokenBalances = TokenBalancesInterface(getContractAddress("TokenBalances"));
        bytes32 rwEthSupplyTag = keccak256(abi.encodePacked("totalSupply_rewardEther"));
        
        require(_rwEthAmount > 0 , "Burn amount needs to be greater than zero.");
        require(balanceOf(msg.sender) > 0,"Insufficient rwEth balance.");

        // Calculate the equivalent rwEth amount (deppends on the current repricing status).
        uint etherCalc = calcEthValue(_rwEthAmount);
        require(etherCalc < poolTokenBalances.getTotalEthSupply(), "There aren't enough backed ethers to perform this action.");
        dataStorage.decreaseUintStorage(rwEthSupplyTag, _rwEthAmount);
        _burn(msg.sender, _rwEthAmount);
        emit TokensBurned(msg.sender, _rwEthAmount);
    }
    function getRwETHTokenAddress() public view returns(address){
        bytes32 addressTag = keccak256(abi.encodePacked("contract_address", "rwETHToken"));
        address contractAddress = dataStorage.getAddressStorage(addressTag);
        return contractAddress;
    }    
            

}

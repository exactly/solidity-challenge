
import { ethers } from "ethers";

import {abi} from '../artifacts/contracts/ETHPool.sol/ETHPool.json'
require("dotenv").config();

async function balance() {

    const address = "0xfD24E1f372B82B473E4a42248CAF810304606E71"

    const projeId=process.env.INFURA_PROJECT_ID


    var provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${projeId}`)

    var contractETHPool  = new ethers.Contract( address , abi , provider )

    var balanceETHEquipo = await contractETHPool.totalReward()
    var balanceUsuarios = await contractETHPool.totalUserDeposits()
    

    var mensaje  = "Total ETH Team locked : " 
                     +ethers.utils.formatEther(balanceETHEquipo) + " | "
                     +"Total ETH User locked : "
                     +ethers.utils.formatEther(balanceUsuarios)

    return { mensaje }
} 

 balance().then((x)=> console.log(x.mensaje))


const ETHPool =require("./contract/contract")
const web3= require("./web3")

async function getTotalETH(){
    try {
        
        let bal= await ETHPool.methods.totalETH().call();
        bal=web3.utils.fromWei(bal);
        console.log(`Total amount of ETH held: ${parseFloat(bal).toFixed(4)} ETH`)
    } catch (error) {
        console.log("error:", error)
    }
}

(async () => await getTotalETH())();
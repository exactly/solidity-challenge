const Web3 = require("web3");

(async ()=>
{
	const contract="0xFe834810F61ABf397B53eC21bCc2652f91d1F7fD";
	let web3=new Web3(`https://ropsten.infura.io/v3/e61d7489169641adb4ba7a698ad81d51`);
	console.log("pool has "+web3.utils.fromWei(await web3.eth.getBalance(contract))+" ethers");
})();
import { ethers } from "hardhat";

const deploy = async() => {    
    const [deployer] = await ethers.getSigners();
    console.log('Deploying contrat with the account: ', deployer.address)
    const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
    const ETHPoolDeploy = await ETHPoolFactory.deploy();
   
    console.log("ETHPool isdeployed at:", ETHPoolDeploy.address )
}

deploy().then(()=> process.exit(0)).catch(error => {
    console.log(error);
    process.exit(1);
});
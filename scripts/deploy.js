async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const TestingNFT = await ethers.getContractFactory("TestingNFT");
  const testingNFT = await TestingNFT.deploy();

  console.log("Contract address:", testingNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
async function main() {
  // We get the contract to deploy
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy();

  console.log("staking deployed to:", staking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
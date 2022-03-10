const { time } = require('@openzeppelin/test-helpers');
const { expect } = require("chai");
const { ethers } = require('hardhat');

const BN = ethers.BigNumber;
const Decimals = BN.from(18);
const ETH = BN.from(10).pow(Decimals);

const moment = require('moment')

describe("Token test", function () {
	let staking;
	let owner, admin1, admin2, user1, user2, user3;

    before(async () => {
		const StakingContract = await ethers.getContractFactory("Staking");
		staking = await StakingContract.deploy();
		[owner, admin1, admin2, user1, user2, user3] = await ethers.getSigners();

	});

    it("Add Admin", async () => {
		await staking.addAdmin(admin1.address);
		await staking.addAdmin(admin2.address);

		// deposit 500
		await expect(staking.connect(user1).depositReward({value: ETH.mul(500)})).to.be.revertedWith("caller is not the admin");

		await staking.connect(admin1).depositReward({value: ETH.mul(500)});
		let contractETHBalance = await ethers.provider.getBalance(staking.address);

		// current balance 500
		await expect(ethers.utils.formatEther(contractETHBalance)).to.equal('500.0');
    });

    it("Stake", async () => {
    	await expect(staking.connect(user1).stake({value: ETH.mul(0)})).to.be.revertedWith("stake amount is 0");

    	// stake 100
    	await staking.connect(user1).stake({value: ETH.mul(100)});
    	// stake 150
    	await staking.connect(user2).stake({value: ETH.mul(150)});

    	let contractETHBalance = await ethers.provider.getBalance(staking.address);
    	// current balance 750
		await expect(ethers.utils.formatEther(contractETHBalance)).to.equal('750.0');
	});

    it("Get Pending Reward", async () => {
    	let user1PendingReward = await staking.getPending(user1.address);
    	let user2PendingReward = await staking.getPending(user2.address);

    	// for user1 pending reward: 500 * 100 / (100 + 150) = 500 * 100 / 250 = 200
    	await expect(ethers.utils.formatEther(user1PendingReward)).to.equal('200.0');
    	// for user1 pending reward: 500 * 150 / 250 = 300
    	await expect(ethers.utils.formatEther(user2PendingReward)).to.equal('300.0');
	});

	it("UnSake", async () => {
		// withdraw: 100 + 200 = 300
		await staking.connect(user1).unStake();

		let contractETHBalance = await ethers.provider.getBalance(staking.address);
    	// current balance: 750 - 300 = 450
		await expect(ethers.utils.formatEther(contractETHBalance)).to.equal('450.0');
	});

	it("Next week", async () => {
		// depoist 500
		await staking.connect(admin1).depositReward({value: ETH.mul(500)});
		let contractETHBalance = await ethers.provider.getBalance(staking.address);
    	// current balance: 450 + 500 = 950
		await expect(ethers.utils.formatEther(contractETHBalance)).to.equal('950.0');
	});


	it("Next week: Get Pending Reward", async () => {
		// User 3 stake 100
    	await staking.connect(user3).stake({value: ETH.mul(100)});

    	let contractETHBalance = await ethers.provider.getBalance(staking.address);
    	// current balance: 950 + 100 = 1050
		await expect(ethers.utils.formatEther(contractETHBalance)).to.equal('1050.0');

    	let user2PendingReward = await staking.getPending(user2.address);
    	// for user1 pending reward: 300 + 500 * 150 / (150 + 100) = 600
    	await expect(ethers.utils.formatEther(user2PendingReward)).to.equal('600.0');
	});

});
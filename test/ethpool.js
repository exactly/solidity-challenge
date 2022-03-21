const { assert } = require("chai");
const Web3 = require("web3");
const expect = require('chai').expect;
const ETHPool = artifacts.require("ETHPool");


contract("ethpool test", async (accounts) => {
	let [owner,alice,bob,charlie] = accounts;
	let [reward_amount,alice_amount,bob_amount,charlie_amount]=[1,5,10,2];
	let instanceOfPool;
	let web3;
	let weis=function(num) {
		return web3.utils.toWei(String(num), "ether");
	}
    before(async () => {
		instanceOfPool = await ETHPool.deployed();
		console.log("pool:"+instanceOfPool.address);
		console.log("alice:"+alice+"\nbob:"+bob);
		web3 = new Web3(Web3.givenProvider || 'ws://127.0.0.1:7545');
    });
	
	it("check contract and alice balance after alice deposit", async () => {
		let result = await instanceOfPool.deposit({from:alice,value:weis(alice_amount)});
		expect(result.receipt.status).to.equal(true);
		expect(await web3.eth.getBalance(instanceOfPool.address)).to.equal(weis(alice_amount));
		result=String(await instanceOfPool.balanceOf.call(alice));
		expect(result).to.equal(weis(alice_amount));
	});
	it("check contract and bob balance after bob deposit", async () => {
		let result = await instanceOfPool.deposit({from:bob,value:weis(bob_amount)});
		expect(result.receipt.status).to.equal(true);
		expect(await web3.eth.getBalance(instanceOfPool.address)).to.equal(weis(alice_amount+bob_amount));
		result=String(await instanceOfPool.balanceOf.call(bob));
		expect(result).to.equal(weis(bob_amount));
	});
	it("check contract and users balance after reward deposit", async () => {
		let result = await instanceOfPool.depositReward({from:owner,value:weis(reward_amount)});
		expect(result.receipt.status).to.equal(true);
		expect(await web3.eth.getBalance(instanceOfPool.address)).to.equal(weis(reward_amount+alice_amount+bob_amount));
		//range based check
		result=Number(await instanceOfPool.balanceOf.call(alice));
		expect(result).to.greaterThan(Number(weis(alice_amount+0.99*reward_amount/3)));
		expect(result).to.lessThan(Number(weis(alice_amount+1.01*reward_amount/3)));
		result=Number(await instanceOfPool.balanceOf.call(bob));
		expect(result).to.greaterThan(Number(weis(bob_amount+1.99*reward_amount/3)));
		expect(result).to.lessThan(Number(weis(bob_amount+2.01*reward_amount/3)));
	});
	it("check contract and charlie balance after charlie deposit", async () => {
		let result = await instanceOfPool.deposit({from:charlie,value:weis(charlie_amount)});
		expect(result.receipt.status).to.equal(true);
		expect(await web3.eth.getBalance(instanceOfPool.address)).to.equal(weis(reward_amount+alice_amount+bob_amount+charlie_amount));
		result=String(await instanceOfPool.balanceOf.call(charlie));
		expect(result).to.equal(weis(charlie_amount));
	});
	it("check contract and alice balance after alice withdraw", async () => {
		let contractBalance=Number(await web3.eth.getBalance(instanceOfPool.address));
		let balance=Number(await instanceOfPool.balanceOf.call(alice));
		let result = await instanceOfPool.withdraw(String(balance),{from:alice});
		expect(result.receipt.status).to.equal(true);
		//Don't know where 2000 weis went
		result=Number(await web3.eth.getBalance(instanceOfPool.address));
		expect(result).to.greaterThan((contractBalance-balance)*0.99);
		expect(result).to.lessThan((contractBalance-balance)*1.01);
		//neither
		result=Number(await instanceOfPool.balanceOf.call(alice));
		expect(result).to.greaterThan(0);
		expect(result).to.lessThan(2000);
	});

	it("check insufficient deposit", async () => {
		try {
			let result = await instanceOfPool.deposit({from:alice,value:weis(1000)});
			assert(false);
		} catch {}
	});
	it("check non-owner depositReward", async () => {
		try {
			let result = await instanceOfPool.depositReward({from:alice,value:weis(alice_amount)});
			assert(false);
		} catch {}
	});
	it("check insufficient withdraw", async () => {
		try {
			let result = await instanceOfPool.withdraw(weis(100),{from:bob});
			assert(false);
		} catch {}
	});
});
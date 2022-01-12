
import { ethers } from "hardhat";
import { expect } from 'chai'
import { BigNumber } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


function getRandomArbitrary(min: number, max: number) {

    return Math.floor(Math.random() * max) + min;
}



describe("test of ETHPools", function () {


    const dataETHPool = async () => {
        const [owner, user1, user2, user3, user4] = await ethers.getSigners();
        const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
        const ETHPoolDeploy = await ETHPoolFactory.deploy();
        const earningsDeposited: BigNumber = ethers.utils.parseEther("10")


        return {
            owner,
            user1, user2, user3, user4,
            ETHPoolDeploy,
            earningsDeposited
        }
    }

    describe("Test team options", function () {
        
        it('The account you display is the team account', async () => {
            const { owner, user1, ETHPoolDeploy } = await dataETHPool()

            const isTeam: boolean = await ETHPoolDeploy.usersTeam(owner.address)
            const isUser: boolean = await ETHPoolDeploy.usersTeam(user1.address)

            expect(isTeam).to.equal(true)
            expect(isUser).to.equal(false)
        })


        it('The team CANNOT deposit before one week', async () => {
            const { ETHPoolDeploy, earningsDeposited } = await dataETHPool()

            await expect(ETHPoolDeploy.depositRewardTeam({ value: earningsDeposited })).to.be.revertedWith("It hasn't been a week")
        })


        it('The team can deposit after one week', async () => {
            const { ETHPoolDeploy, earningsDeposited } = await dataETHPool()

            await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1])

            await ETHPoolDeploy.depositRewardTeam({ value: earningsDeposited })

            const reward: BigNumber = await ETHPoolDeploy.totalReward()

            expect(earningsDeposited).to.equal(reward)
        })
    })


    describe("User functionality test", function () {


        describe("Deposit", function () {
            it("Can be deposited by users", async () => {

                const { user1, ETHPoolDeploy } = await dataETHPool()

                const userdeposit : BigNumber = ethers.utils.parseEther("10")

                const beforeTotalUsersDeposites = await ETHPoolDeploy.totalUserDeposits()

                const tx = await ETHPoolDeploy.connect(user1).depositEthUser({ value: userdeposit })

                const timestamp = (await ethers.provider.getBlock(tx.blockNumber)).timestamp;

                var depositUser = await ETHPoolDeploy.users(user1.address)

                expect(depositUser.deposit).to.equal(userdeposit)
                expect(depositUser.dateDeposit).to.equal(timestamp)
                expect(await ETHPoolDeploy.totalUserDeposits()).to.equal(userdeposit)
            })
        })



        describe("Withdra", function () {         

            it("Restrict if user has not deposited anything", async () => {
                const { owner, user1, ETHPoolDeploy, earningsDeposited } = await dataETHPool()

                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1])
                await ETHPoolDeploy.connect(owner).depositRewardTeam({ value: earningsDeposited })

                await expect(ETHPoolDeploy.connect(user1).withdraw()).to.be.revertedWith("The user has not deposited")
            })

            it("Delivery of deposits without profit", async () => {
                const { user1, ETHPoolDeploy, earningsDeposited } = await dataETHPool()

                await ETHPoolDeploy.connect(user1).depositEthUser({ value: earningsDeposited })

                var balanceUsurBefore  =  await ethers.provider.getBalance(user1.address)

                var tx = await ETHPoolDeploy.connect(user1).withdraw()

                const gasUsed: BigNumber = (await tx.wait()).gasUsed
                const gasPrice: BigNumber = tx.gasPrice
                var gasCost: BigNumber = gasUsed.mul(gasPrice)

                var balanceUsurAfter  =  await ethers.provider.getBalance(user1.address)

                expect(balanceUsurAfter).to.equal(balanceUsurBefore.add(earningsDeposited).sub(gasCost))
                                
            })

            // test with 4 users
            // reward from team 10 eth
            // I deposit by users randomly (between 1 and 10 eth)
            it("Delivering returns with random deposits", async () => {
                const { owner, user1, user2, user3, user4, ETHPoolDeploy } = await dataETHPool()

                interface IuserDeposit {
                    user: SignerWithAddress;
                    value: BigNumber;
                }

                const eth = ethers.constants.WeiPerEther;

                var totalReward: BigNumber = ethers.utils.parseEther("10")

                var userDepositArray: IuserDeposit[] = new Array();

                var userArray: SignerWithAddress[] = [user1, user2, user3, user4]

                var totalDespositUser: BigNumber = ethers.constants.Zero;


                // user deposit, random amount of ETH
                // value between 1 and 10 ETH
                for (const item of userArray) {
                    var depositUser: BigNumber = ethers.utils.parseEther(
                        getRandomArbitrary(1, 10).toString())

                    await ETHPoolDeploy.connect(item).depositEthUser({
                        value: depositUser.toString()
                    })

                    userDepositArray.push({
                        user: item,
                        value: depositUser,
                    })

                    totalDespositUser = totalDespositUser.add(depositUser)
                }



                // deposit of the reward by the team
                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1])

                await ETHPoolDeploy.connect(owner).depositRewardTeam({
                    value: totalReward.toString()
                })



                // user withdrawal
                for (const item of userDepositArray) {

                    var percentagePool: BigNumber = item.value.mul(eth).div(totalDespositUser)

                    var balanceUserBefore = await ethers.provider.getBalance(item.user.address)

                    var earningsAndDeposit: BigNumber =
                        item.value.add(totalReward.mul(percentagePool).div(eth))

                    var tx = await ETHPoolDeploy.connect(item.user).withdraw()

                    totalDespositUser = totalDespositUser.sub(item.value)

                    totalReward = totalReward.sub(totalReward.mul(percentagePool).div(eth))

                    const gasUsed: BigNumber = (await tx.wait()).gasUsed
                    const gasPrice: BigNumber = tx.gasPrice
                    var gasCost: BigNumber = gasUsed.mul(gasPrice)

                    var balanceUser = await ethers.provider.getBalance(item.user.address)

                    balanceUserBefore = balanceUserBefore.add(earningsAndDeposit.sub(gasCost))

                    expect(balanceUserBefore).to.equal(balanceUser)
                }

            })

            it("Withdrawal of deposits without profit", async () => {
                const { owner, user1, user2, ETHPoolDeploy } = await dataETHPool()


                var totalReward: BigNumber = ethers.utils.parseEther("10")

                // value between 1 and 10 ETH
                var depositUser: BigNumber = ethers.utils.parseEther(
                    getRandomArbitrary(1, 10).toString())
                //------------------------------------------------------------


                //deposit user1    
                await ETHPoolDeploy.connect(user1).depositEthUser({
                    value: depositUser.toString()
                })
                //------------------------------------------------------------


                // deposit of the reward by the team
                await ethers.provider.send("evm_increaseTime", [(60 * 60 * 24 * 7) + 1])

                await ETHPoolDeploy.connect(owner).depositRewardTeam({
                    value: totalReward.toString()
                })
                //------------------------------------------------------------                


                //user1 withdrawal 
                //balance user1 - deposit - gas

                var balanceUser1Before = await ethers.provider.getBalance(user1.address)

                var tx = await ETHPoolDeploy.connect(user1).withdraw()
                const gasUsedUser1: BigNumber = (await tx.wait()).gasUsed
                const gasPriceUser1: BigNumber = tx.gasPrice
                var gasCost: BigNumber = gasUsedUser1.mul(gasPriceUser1)

                balanceUser1Before = balanceUser1Before.add(totalReward).add(depositUser).sub(gasCost)

                var balanceUser1After = await ethers.provider.getBalance(user1.address)

                expect(balanceUser1Before).to.equal(balanceUser1After)
                //------------------------------------------------------------



                //deposit user2
                await ETHPoolDeploy.connect(user2).depositEthUser({
                    value: depositUser.toString()
                })
                //------------------------------------------------------------


                //user2 withdrawal
                var balanceUser2Before = await ethers.provider.getBalance(user2.address)
                var tx = await ETHPoolDeploy.connect(user2).withdraw()
                const gasUsedUser2: BigNumber = (await tx.wait()).gasUsed
                const gasPriceUser2: BigNumber = tx.gasPrice
                var gasCostUser2: BigNumber = gasUsedUser2.mul(gasPriceUser2)

                var balanceUser2After = await ethers.provider.getBalance(user2.address)
                balanceUser2Before = balanceUser2Before.add(depositUser).sub(gasCostUser2)

                expect(balanceUser2Before).to.equal(balanceUser2After)
                //------------------------------------------------------------


            })


        })

    })

})



const { expect } = require('chai')
const buidler = require("@nomiclabs/buidler")
/*

Hodlers:

V3 Dai (25000): 0xcaacebe2fdac9d3783563b9b80c714df82705226
Pool Dai (5600): 0x42e6746f6c76782ea0184bb5ab74dfec3d041391
Pool Usdc (500): 0x57bba930e24d2b2c16202f586a8ea09f51bd218d
Dai Pod (50): 0x8E347d882538db71D9Df856B1B139cdBAdf9e6A6
Usdc Pod (10): 0xdEAA2a690a4B34504658dab1c4d4a015D253040F

*/

async function forkTest() {
  const { ethers, deployments, getNamedAccounts } = buidler
  const { provider, getContractAt } = ethers

  const fromWei = ethers.utils.formatEther
  const toWei = ethers.utils.parseEther

  const {
    poolDaiToken,
    poolUsdcToken,
    poolDaiPod,
    poolUsdcPod,
    v3Token
  } = await getNamedAccounts()

  const v3TicketSigner = await provider.getSigner('0xcaacebe2fdac9d3783563b9b80c714df82705226')
  const poolDaiSigner = await provider.getSigner('0x42e6746f6c76782ea0184bb5ab74dfec3d041391')
  const poolUsdcSigner = await provider.getSigner('0x57bba930e24d2b2c16202f586a8ea09f51bd218d')
  const daiPodSigner = await provider.getSigner('0x8E347d882538db71D9Df856B1B139cdBAdf9e6A6')
  const usdcPodSigner = await provider.getSigner('0xdEAA2a690a4B34504658dab1c4d4a015D253040F')

  await v3TicketSigner.sendTransaction({ to: poolDaiSigner._address, value: toWei('0.5') })
  await v3TicketSigner.sendTransaction({ to: poolUsdcSigner._address, value: toWei('0.5') })
  await v3TicketSigner.sendTransaction({ to: daiPodSigner._address, value: toWei('0.5') })
  await v3TicketSigner.sendTransaction({ to: usdcPodSigner._address, value: toWei('0.5') })

  const d = await deployments.all()
  const migrate = await getContractAt('MigrateV2ToV3', d.MigrateV2ToV3.address, v3TicketSigner)

  v3Tickets = await getContractAt('IERC20', v3Token, v3TicketSigner)

  // Transfer tickets to migrate script
  let v3Balance = await v3Tickets.balanceOf(v3TicketSigner._address)
  console.log(`Transferring ${fromWei(v3Balance)} V3 tickets...`)
  await v3Tickets.transfer(migrate.address, v3Balance)

  console.log("Converting Pool Dai tickets...")

  const poolDai = await getContractAt('IERC777', poolDaiToken, poolDaiSigner)
  const poolDaiBalance = await poolDai.balanceOf(poolDaiSigner._address)
  await poolDai.send(migrate.address, poolDaiBalance, [])
  expect(await poolDai.balanceOf(poolDaiSigner._address)).to.equal('0')
  expect(await v3Tickets.balanceOf(poolDaiSigner._address)).to.equal(poolDaiBalance)

  console.log("Converting Pool Usdc tickets...")

  const poolUsdc = await getContractAt('IERC777', poolUsdcToken, poolUsdcSigner)
  const poolUsdcBalance = await poolUsdc.balanceOf(poolUsdcSigner._address)
  await poolUsdc.send(migrate.address, poolUsdcBalance, [])
  expect(await poolUsdc.balanceOf(poolUsdcSigner._address)).to.equal('0')
  expect(await v3Tickets.balanceOf(poolUsdcSigner._address)).to.equal(poolUsdcBalance.mul(toWei('0.000001')))

  console.log("Converting Dai Pod tickets...")

  const daiPod = await getContractAt('MixedPodInterface', poolDaiPod, daiPodSigner)
  const daiPodBalance = await daiPod.balanceOf(daiPodSigner._address)
  const daiPodUnderlyingBalance = await daiPod.balanceOfUnderlying(daiPodSigner._address)
  await daiPod.send(migrate.address, daiPodBalance, [])
  expect(await daiPod.balanceOf(daiPodSigner._address)).to.equal('0')
  expect(await v3Tickets.balanceOf(daiPodSigner._address)).to.equal(daiPodUnderlyingBalance)

  console.log("Converting Usdc Pod tickets...")

  const usdcPod = await getContractAt('MixedPodInterface', poolUsdcPod, usdcPodSigner)
  const usdcPodBalance = await usdcPod.balanceOf(usdcPodSigner._address)
  const usdcPodUnderlyingBalance = await usdcPod.balanceOfUnderlying(usdcPodSigner._address)
  await usdcPod.send(migrate.address, usdcPodBalance, [])
  expect(await usdcPod.balanceOf(usdcPodSigner._address)).to.equal('0')
  expect(await v3Tickets.balanceOf(usdcPodSigner._address)).to.equal(usdcPodUnderlyingBalance.mul(toWei('0.000001')))
}

forkTest()
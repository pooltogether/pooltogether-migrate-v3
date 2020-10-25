const { expect } = require("chai");
const buidler = require('@nomiclabs/buidler')
const ERC20Mintable = require('../artifacts/ERC20Mintable.json')
const ERC777Mintable = require('../artifacts/ERC777Mintable.json')
const { deployContract, deployMockContract } = require('ethereum-waffle')
const { AddressZero } = require("ethers").constants
const { deployments, ethers } = buidler;

const overrides = { gasLimit: 20000000 }

const toWei = ethers.utils.parseEther

const debug = require('debug')('ptv3:MigrateV2ToV3.test')

describe('MigrateV2ToV3', () => {

  let wallet, wallet2

  let provider

  let registry, poolDai, poolUsdc, poolDaiPod, poolUsdcPod

  beforeEach(async () => {
    [wallet, wallet2] = await buidler.ethers.getSigners()
    provider = buidler.ethers.provider

    await deployments.fixture()

    migrate = await ethers.getContractAt(
      "MigrateV2ToV3",
      (await deployments.get("MigrateV2ToV3")).address,
      wallet
    )

    poolDai = await ethers.getContractAt(
      'ERC777Mintable',
      await migrate.poolDaiToken(),
      wallet
    )

    poolUsdc = await ethers.getContractAt(
      'ERC777Mintable',
      await migrate.poolUsdcToken(),
      wallet
    )

    poolDaiPod = await ethers.getContractAt(
      'MockPod',
      await migrate.poolDaiPod(),
      wallet
    )
    await poolDaiPod.setValue(toWei('100'))

    poolUsdcPod = await ethers.getContractAt(
      'MockPod',
      await migrate.poolUsdcPod(),
      wallet
    )
    await poolUsdcPod.setValue(toWei('100'))

    v3Token = await ethers.getContractAt(
      'ERC20Mintable',
      await migrate.v3Token(),
      wallet
    )
  })

  describe('migrate pool dai', async () => {
    it('should work', async () => {
      await poolDai.mint(wallet._address, toWei('100'))
      await v3Token.mint(migrate.address, toWei('10000'))
      await poolDai.send(migrate.address, toWei('100'), [])
      expect(await v3Token.balanceOf(wallet._address)).to.equal(toWei('100'))
    })

    it('should revert if insufficient balance', async () => {
      await poolDai.mint(wallet._address, toWei('100'))
      await expect(poolDai.send(migrate.address, toWei('100'), [])).to.be.revertedWith("ERC20: transfer amount exceeds balance")
    })
  })

  describe('migrate pool usdc', async () => {
    it('should work', async () => {
      await poolUsdc.mint(wallet._address, toWei('100'))
      await v3Token.mint(migrate.address, toWei('10000'))
      await poolUsdc.send(migrate.address, toWei('100'), [])
      expect(await v3Token.balanceOf(wallet._address)).to.equal(toWei('100'))
    })

    it('should revert if insufficient balance', async () => {
      await poolUsdc.mint(wallet._address, toWei('100'))
      await expect(poolUsdc.send(migrate.address, toWei('100'), [])).to.be.revertedWith("ERC20: transfer amount exceeds balance")
    })
  })

  describe('migrate pool dai pod', async () => {
    it('should work', async () => {
      await poolDaiPod.mint(wallet._address, toWei('999'))
      await v3Token.mint(migrate.address, toWei('1000'))
      await poolDaiPod.send(migrate.address, toWei('999'), [])
      expect(await v3Token.balanceOf(wallet._address)).to.equal(toWei('100'))
    })

    it('should revert if insufficient balance', async () => {
      await poolDaiPod.mint(wallet._address, toWei('100'))
      await expect(poolDaiPod.send(migrate.address, toWei('100'), [])).to.be.revertedWith("ERC20: transfer amount exceeds balance")
    })
  })

  describe('migrate pool usdc pod', async () => {
    it('should work', async () => {
      await poolUsdcPod.mint(wallet._address, toWei('999'))
      await v3Token.mint(migrate.address, toWei('1000'))
      await poolUsdcPod.send(migrate.address, toWei('999'), [])
      expect(await v3Token.balanceOf(wallet._address)).to.equal(toWei('100'))
    })

    it('should revert if insufficient balance', async () => {
      await poolUsdcPod.mint(wallet._address, toWei('100'))
      await expect(poolUsdcPod.send(migrate.address, toWei('100'), [])).to.be.revertedWith("ERC20: transfer amount exceeds balance")
    })
  })

  describe('withdraw()', async () => {
    it('should allow owner to withdraw tokens', async () => {
      await poolUsdcPod.mint(wallet._address, toWei('999'))
      await v3Token.mint(migrate.address, toWei('1000'))
      await poolUsdcPod.send(migrate.address, toWei('999'), [])

      await migrate.withdrawERC777(poolUsdcPod.address)
      expect(await poolUsdcPod.balanceOf(wallet._address)).to.equal(toWei('999'))
    })

    it('should not allow anyone else to withdraw', async () => {
      await poolUsdcPod.mint(wallet._address, toWei('999'))
      await v3Token.mint(migrate.address, toWei('1000'))
      await poolUsdcPod.send(migrate.address, toWei('999'), [])

      await expect(migrate.connect(wallet2).withdrawERC777(poolUsdcPod.address)).to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

})

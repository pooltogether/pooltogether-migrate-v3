const { expect } = require("chai");
const buidler = require('@nomiclabs/buidler')
const ERC721Mintable = require('../artifacts/ERC721Mintable.json')
const ERC20Mintable = require('../artifacts/ERC20Mintable.json')
const { deployContract } = require('ethereum-waffle')
const { deployments, ethers } = buidler;

const overrides = { gasLimit: 20000000 }

const toWei = ethers.utils.parseEther

const fromUsdc = (usdc) => ethers.utils.parseUnits(usdc, 6)

const debug = require('debug')('ptv3:MigrateV2ToV3.test')

describe('MigrateV2ToV3', () => {

  let wallet, wallet2

  let provider

  let poolDai, poolUsdc, poolDaiPod, poolUsdcPod, nft, erc20

  beforeEach(async () => {
    [wallet, wallet2] = await buidler.ethers.getSigners()
    provider = buidler.ethers.provider

    await deployments.fixture()

    nft = await deployContract(wallet, ERC721Mintable, [], overrides)

    erc20 = await deployContract(wallet, ERC20Mintable, [], overrides)

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
    await poolUsdcPod.setValue(fromUsdc('100'))

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
      await poolUsdc.mint(wallet._address, fromUsdc('100'))
      await v3Token.mint(migrate.address, toWei('10000'))
      await poolUsdc.send(migrate.address, fromUsdc('100'), [])
      expect(await v3Token.balanceOf(wallet._address)).to.equal(toWei('100'))
    })

    it('should revert if insufficient balance', async () => {
      await poolUsdc.mint(wallet._address, fromUsdc('100'))
      await expect(poolUsdc.send(migrate.address, fromUsdc('100'), [])).to.be.revertedWith("ERC20: transfer amount exceeds balance")
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

  describe('withdrawERC777()', async () => {
    it('should allow owner to withdraw tokens', async () => {
      await poolUsdcPod.mint(wallet._address, toWei('999'))
      await v3Token.mint(migrate.address, toWei('1000'))
      await poolUsdcPod.send(migrate.address, toWei('999'), [])

      await migrate.withdrawERC777(poolUsdcPod.address, wallet._address)
      expect(await poolUsdcPod.balanceOf(wallet._address)).to.equal(toWei('999'))
    })

    it('should not allow anyone else to withdraw', async () => {
      await poolUsdcPod.mint(wallet._address, toWei('999'))
      await v3Token.mint(migrate.address, toWei('1000'))
      await poolUsdcPod.send(migrate.address, toWei('999'), [])

      await expect(migrate.connect(wallet2).withdrawERC777(poolUsdcPod.address, wallet._address)).to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe('withdrawERC20()', async () => {
    it('should allow owner to withdraw tokens', async () => {
      await v3Token.mint(migrate.address, toWei('999'))
      await migrate.withdrawERC20(v3Token.address, wallet._address)
      expect(await v3Token.balanceOf(wallet._address)).to.equal(toWei('999'))
    })

    it('should not allow anyone else to withdraw', async () => {
      await v3Token.mint(migrate.address, toWei('999'))
      await expect(migrate.connect(wallet2).withdrawERC20(v3Token.address, wallet._address)).to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe('withdrawERC20Batch()', async () => {
    it('should allow owner to withdraw tokens', async () => {
      await erc20.mint(migrate.address, toWei('999'))
      await v3Token.mint(migrate.address, toWei('999'))
      await migrate.withdrawERC20Batch([v3Token.address, erc20.address], wallet._address)
      expect(await v3Token.balanceOf(wallet._address)).to.equal(toWei('999'))
      expect(await erc20.balanceOf(wallet._address)).to.equal(toWei('999'))
      expect(await v3Token.balanceOf(migrate.address)).to.equal('0')
      expect(await erc20.balanceOf(migrate.address)).to.equal('0')
    })

    it('should not allow anyone else to withdraw', async () => {
      await expect(migrate.connect(wallet2).withdrawERC20Batch([v3Token.address], wallet._address)).to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe('withdrawERC721()', async () => {
    it('should be able to withdraw an nft', async () => {
      await nft.mint(migrate.address, '1234')
      await migrate.withdrawERC721(nft.address, '1234', wallet._address)
      expect(await nft.ownerOf('1234')).to.equal(wallet._address)
    })

    it('should not allow anyone but the owner to withdraw', async () => {
      await nft.mint(migrate.address, '1234')
      await expect(migrate.connect(wallet2).withdrawERC721(nft.address, '1234', wallet._address)).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

})

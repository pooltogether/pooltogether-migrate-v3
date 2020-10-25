const debug = require('debug')('custom-prize-strategy:deploy')
const { deploy1820 } = require('deploy-eip-1820')

module.exports = async (buidler) => {
  const { getNamedAccounts, deployments } = buidler
  const { deploy } = deployments  

  const signers = await buidler.ethers.getSigners()

  async function deployIfNotDef(overrideAddress, name, contract = 'ERC777Mintable') {
    let address
    if (overrideAddress) {
      address = overrideAddress
    } else {
      const poolDaiTokenResult = await deploy(name, {
        contract,
        from: deployer,
        skipIfAlreadyDeployed: true
      });
      address = poolDaiTokenResult.address
    }

    return address
  }

  const {
    deployer,
    poolDaiToken,
    poolUsdcToken,
    poolDaiPod,
    poolUsdcPod,
    v3Token,
    erc1820Registry
  } = await getNamedAccounts()

  if (!erc1820Registry) {
    await deploy1820(signers[0])
  }

  let poolDaiTokenAddress = await deployIfNotDef(poolDaiToken, 'PoolDaiToken')
  let poolUsdcTokenAddress = await deployIfNotDef(poolUsdcToken, 'PoolUsdcToken')
  let poolDaiPodAddress = await deployIfNotDef(poolDaiPod, 'PoolDaiPod', 'MockPod')
  let poolUsdcPodAddress = await deployIfNotDef(poolUsdcPod, 'PoolUsdcPod', 'MockPod')

  let v3TokenAddress
  if (v3Token) {
    v3TokenAddress = v3Token
  } else {
    const v3TokenResult = await deploy('V3Token', {
      contract: 'ERC20Mintable',
      from: deployer,
      skipIfAlreadyDeployed: true
    });
    v3TokenAddress = v3TokenResult.address
  }

  await deploy('MigrateV2ToV3', {
    args: [
      poolDaiTokenAddress,
      poolUsdcTokenAddress,
      poolDaiPodAddress,
      poolUsdcPodAddress,
      v3TokenAddress
    ],
    from: deployer,
    skipIfAlreadyDeployed: true
  });

};

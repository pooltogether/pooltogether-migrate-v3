usePlugin("@nomiclabs/buidler-ethers");
usePlugin("@nomiclabs/buidler-waffle");
usePlugin("buidler-deploy");
usePlugin("@nomiclabs/buidler-etherscan");

module.exports = {
  solc: {
    version: "0.6.12",
    optimizer: {
      enabled: true,
      runs: 200
    },
    evmVersion: "istanbul"
  },
  networks: {
    buidlerevm: {
    },
    pt: {
      url: 'http://127.0.0.1:8545'
    }
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    poolDaiToken: {
      1: '0x49d716DFe60b37379010A75329ae09428f17118d'
    },
    poolUsdcToken: {
      1: '0xBD87447F48ad729C5c4b8bcb503e1395F62e8B98'
    },
    poolDaiPod: {
      1: '0x9f4c5d8d9be360df36e67f52ae55c1b137b4d0c4'
    },
    poolUsdcPod: {
      1: '0x6f5587e191c8b222f634c78111f97c4851663ba4'
    },
    v3Token: {
      1: '0x334cbb5858417aee161b53ee0d5349ccf54514cf'
    },
    erc1820Registry: {
      1: '0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24'
    }
  }
};

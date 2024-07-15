require("@nomicfoundation/hardhat-toolbox");
require("@matterlabs/hardhat-zksync")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  zksolc: {
    version: "latest",
    settings: {
      enableEraVMExtensions: true,
    },
  },
  solidity: {
    version: "0.8.20",
    eraVersion: "1.0.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    }
  },
  deployerAccounts: {
    'zkTestnet': 0,
    dafault: 0,
  },
  defaultNetwork: "zkSyncTestnet",
  networks: {
    hardhat: {
      zksync: true,
    },
    zkSyncTestnet: {
      url: "http://localhost:8011",
      ethNetwork: "localhost",
      zksync: true,
      chainId: 260
    },
    zkSyncSepoliaTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      zksync: true,
      chainId: 300,
      verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
    },
    dockerizedNode: {
      url: "http://localhost:3050",
      ethNetwork: "http://localhost:8545",
      zksync: true,
      chainId: 270
    },
    zkSyncMainnet: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: "mainnet",
      zksync: true,
      verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    //outputFile: 'gas-reporter.txt',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
};

require('@nomicfoundation/hardhat-toolbox');

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const ARC_RPC_URL = process.env.ARC_RPC_URL || process.env.VITE_ARC_RPC_URL;
const ARC_CHAIN_ID = Number(process.env.ARC_CHAIN_ID || process.env.VITE_ARC_CHAIN_ID || 0);

const networks = {};

if (ARC_RPC_URL && ARC_CHAIN_ID) {
  networks.arc = {
    url: ARC_RPC_URL,
    chainId: ARC_CHAIN_ID,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
  };
}

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks,
};

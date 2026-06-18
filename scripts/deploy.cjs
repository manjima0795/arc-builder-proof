const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error('No deployer signer available. Set DEPLOYER_PRIVATE_KEY for live Arc-compatible deployment.');
  }

  console.log(`Deploying ArcBuilderProof with ${deployer.address} on chain ${hre.network.name}`);
  const ArcBuilderProof = await hre.ethers.getContractFactory('ArcBuilderProof');
  const contract = await ArcBuilderProof.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`ArcBuilderProof deployed to: ${address}`);
  console.log('Set VITE_CONTRACT_ADDRESS to this address before building the frontend.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

# Arc Builder Proof

Grant-ready MVP for Arry's Arc application strategy: a static GitHub Pages app plus an EVM-compatible smart contract that lets builders publish an onchain profile and public project proof.

Target repo: `https://github.com/manjima0795/arc-builder-proof`

## Short grant description

Arc Builder Proof gives Arc builders a simple public proof-of-build page: connect a wallet, save a builder profile, create project proofs with source/proof/metadata links, and share reviewer-friendly URLs. The MVP is intentionally lightweight so it can be deployed quickly to GitHub Pages while the Solidity contract can be deployed to any Arc-compatible EVM testnet/mainnet once Arc RPC, chain id, explorer, faucet, and deployer wallet are available.

## What is included

- Vite + React static frontend deployable to GitHub Pages.
- Wallet connect flow for injected wallets such as MetaMask or Rabby.
- Solidity `ArcBuilderProof` contract for:
  - create/update builder profile,
  - create project proof,
  - update project proof by owner,
  - public proof and builder lookup.
- Public proof route using static-safe hash URLs such as `#/proof/1`.
- Demo mode: if no contract address is configured, the app can create local demo proofs in `localStorage` for pitch/demo screenshots.
- Hardhat tests for the contract.
- GitHub Actions workflow for GitHub Pages.

## Tech stack

- Frontend: Vite, React, TypeScript, ethers v6.
- Contract/devnet: Solidity `0.8.24`, Hardhat.
- Deployment target: GitHub Pages + configurable Arc-compatible EVM chain.

## Security notes

- Do not commit private keys or `.env` files.
- Live deployment uses `DEPLOYER_PRIVATE_KEY` only from the shell environment.
- Frontend configuration uses public values only: contract address, RPC URL, chain id, chain name, explorer URL.
- The contract stores public strings. Do not publish secrets or sensitive personal data in profile/proof metadata.

## Quick start

```bash
npm install
npm run compile
npm test
npm run build
```

Local frontend:

```bash
npm run dev
```

Open the printed local URL. Without a deployed contract, use the local demo proof flow. After creating a demo proof, share a URL like:

```text
http://localhost:5173/#/proof/1
```

## Configure Arc-compatible chain

Copy the example env file:

```bash
cp .env.example .env
```

Set public frontend values after contract deployment:

```bash
VITE_CONTRACT_ADDRESS=0xYourDeployedContract
VITE_ARC_CHAIN_ID=12345
VITE_ARC_CHAIN_NAME=Arc Testnet
VITE_ARC_RPC_URL=https://rpc.example
VITE_ARC_BLOCK_EXPLORER=https://explorer.example
```

If real Arc RPC/docs are not available yet, keep these as placeholders and deploy to any EVM testnet for validation. The contract is EVM-compatible and does not use chain-specific opcodes.

## Deploy the contract

For a local Hardhat check:

```bash
npm run compile
npm test
```

For a live Arc-compatible deployment, export runtime-only secrets and chain details. Never commit these values.

```bash
export DEPLOYER_PRIVATE_KEY=<runtime-only-private-key>
export ARC_RPC_URL=https://rpc.example
export ARC_CHAIN_ID=12345
npm run deploy -- --network arc
```

The deploy script prints the new contract address. Put that address into `VITE_CONTRACT_ADDRESS` before building the frontend.

## GitHub Pages deployment

1. Push this repo to `manjima0795/arc-builder-proof` on GitHub.
2. In repository Settings -> Pages, set source to GitHub Actions.
3. In repository Settings -> Secrets and variables -> Actions -> Variables, add public variables if contract is deployed:
   - `VITE_CONTRACT_ADDRESS`
   - `VITE_ARC_CHAIN_ID`
   - `VITE_ARC_CHAIN_NAME`
   - `VITE_ARC_RPC_URL`
   - `VITE_ARC_BLOCK_EXPLORER`
4. Push to `main` or run the `Deploy static app to GitHub Pages` workflow manually.
5. Live app URL should be:

```text
https://manjima0795.github.io/arc-builder-proof/
```

## User flow

1. Connect wallet.
2. Save builder profile onchain.
3. Create a project proof with title, description, proof URI, source URI, and metadata URI.
4. Copy/share the proof page URL: `https://manjima0795.github.io/arc-builder-proof/#/proof/<id>`.
5. Reviewers can open the public proof page and inspect builder/project metadata.

## Contract API

Contract: `contracts/ArcBuilderProof.sol`

Main functions:

- `upsertBuilderProfile(string name, string bio, string skills, string metadataURI)`
- `createProjectProof(string title, string description, string proofURI, string sourceURI, string metadataURI) returns (uint256 proofId)`
- `updateProjectProof(uint256 proofId, string title, string description, string proofURI, string sourceURI, string metadataURI)`
- `getBuilderProfile(address builder)`
- `getProjectProof(uint256 proofId)`
- `getProofIdsByBuilder(address builder)`

Events:

- `BuilderProfileUpserted`
- `ProjectProofCreated`
- `ProjectProofUpdated`

## Real Arc deployment blocker

This MVP is ready for an EVM-compatible deployment, but a real Arc deployment needs Arry's operational inputs:

- Arc RPC URL,
- Arc chain id,
- block explorer URL,
- funded deployer wallet,
- faucet/testnet token access if deploying to testnet.

Until those are available, deploy to a standard EVM testnet or run in demo mode for grant/application review.

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID || 0);
export const ARC_CHAIN_NAME = import.meta.env.VITE_ARC_CHAIN_NAME || 'Arc-compatible EVM';
export const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || '';
export const ARC_BLOCK_EXPLORER = import.meta.env.VITE_ARC_BLOCK_EXPLORER || '';

export const ARC_BUILDER_PROOF_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'bio', type: 'string' },
      { internalType: 'string', name: 'skills', type: 'string' },
      { internalType: 'string', name: 'metadataURI', type: 'string' },
    ],
    name: 'upsertBuilderProfile',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'string', name: 'proofURI', type: 'string' },
      { internalType: 'string', name: 'sourceURI', type: 'string' },
      { internalType: 'string', name: 'metadataURI', type: 'string' },
    ],
    name: 'createProjectProof',
    outputs: [{ internalType: 'uint256', name: 'proofId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proofId', type: 'uint256' },
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'string', name: 'proofURI', type: 'string' },
      { internalType: 'string', name: 'sourceURI', type: 'string' },
      { internalType: 'string', name: 'metadataURI', type: 'string' },
    ],
    name: 'updateProjectProof',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'builder', type: 'address' }],
    name: 'getBuilderProfile',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'bio', type: 'string' },
          { internalType: 'string', name: 'skills', type: 'string' },
          { internalType: 'string', name: 'metadataURI', type: 'string' },
          { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
          { internalType: 'bool', name: 'exists', type: 'bool' },
        ],
        internalType: 'struct ArcBuilderProof.BuilderProfile',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'proofId', type: 'uint256' }],
    name: 'getProjectProof',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'address', name: 'builder', type: 'address' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'string', name: 'proofURI', type: 'string' },
          { internalType: 'string', name: 'sourceURI', type: 'string' },
          { internalType: 'string', name: 'metadataURI', type: 'string' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
          { internalType: 'bool', name: 'exists', type: 'bool' },
        ],
        internalType: 'struct ArcBuilderProof.ProjectProof',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'builder', type: 'address' }],
    name: 'getProofIdsByBuilder',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextProofId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

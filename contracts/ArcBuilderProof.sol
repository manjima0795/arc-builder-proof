// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ArcBuilderProof
/// @notice Lightweight onchain registry for builder profiles and project proofs.
/// @dev Designed for any EVM-compatible Arc testnet/mainnet once RPC and chain id are available.
contract ArcBuilderProof {
    struct BuilderProfile {
        address owner;
        string name;
        string bio;
        string skills;
        string metadataURI;
        uint256 updatedAt;
        bool exists;
    }

    struct ProjectProof {
        uint256 id;
        address builder;
        string title;
        string description;
        string proofURI;
        string sourceURI;
        string metadataURI;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    mapping(address => BuilderProfile) private profiles;
    mapping(uint256 => ProjectProof) private projectProofs;
    mapping(address => uint256[]) private proofsByBuilder;

    uint256 public nextProofId = 1;

    event BuilderProfileUpserted(
        address indexed builder,
        string name,
        string metadataURI,
        uint256 updatedAt
    );
    event ProjectProofCreated(
        uint256 indexed proofId,
        address indexed builder,
        string title,
        string proofURI
    );
    event ProjectProofUpdated(
        uint256 indexed proofId,
        address indexed builder,
        string title,
        string proofURI
    );

    error EmptyName();
    error EmptyTitle();
    error ProofNotFound();
    error NotProofOwner();

    function upsertBuilderProfile(
        string calldata name,
        string calldata bio,
        string calldata skills,
        string calldata metadataURI
    ) external {
        if (bytes(name).length == 0) revert EmptyName();

        profiles[msg.sender] = BuilderProfile({
            owner: msg.sender,
            name: name,
            bio: bio,
            skills: skills,
            metadataURI: metadataURI,
            updatedAt: block.timestamp,
            exists: true
        });

        emit BuilderProfileUpserted(msg.sender, name, metadataURI, block.timestamp);
    }

    function createProjectProof(
        string calldata title,
        string calldata description,
        string calldata proofURI,
        string calldata sourceURI,
        string calldata metadataURI
    ) external returns (uint256 proofId) {
        if (bytes(title).length == 0) revert EmptyTitle();

        proofId = nextProofId++;
        projectProofs[proofId] = ProjectProof({
            id: proofId,
            builder: msg.sender,
            title: title,
            description: description,
            proofURI: proofURI,
            sourceURI: sourceURI,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        });
        proofsByBuilder[msg.sender].push(proofId);

        emit ProjectProofCreated(proofId, msg.sender, title, proofURI);
    }

    function updateProjectProof(
        uint256 proofId,
        string calldata title,
        string calldata description,
        string calldata proofURI,
        string calldata sourceURI,
        string calldata metadataURI
    ) external {
        ProjectProof storage proof = projectProofs[proofId];
        if (!proof.exists) revert ProofNotFound();
        if (proof.builder != msg.sender) revert NotProofOwner();
        if (bytes(title).length == 0) revert EmptyTitle();

        proof.title = title;
        proof.description = description;
        proof.proofURI = proofURI;
        proof.sourceURI = sourceURI;
        proof.metadataURI = metadataURI;
        proof.updatedAt = block.timestamp;

        emit ProjectProofUpdated(proofId, msg.sender, title, proofURI);
    }

    function getBuilderProfile(address builder) external view returns (BuilderProfile memory) {
        return profiles[builder];
    }

    function getProjectProof(uint256 proofId) external view returns (ProjectProof memory) {
        ProjectProof memory proof = projectProofs[proofId];
        if (!proof.exists) revert ProofNotFound();
        return proof;
    }

    function getProofIdsByBuilder(address builder) external view returns (uint256[] memory) {
        return proofsByBuilder[builder];
    }
}

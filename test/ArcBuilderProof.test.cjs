const { expect } = require('chai');
const { ethers } = require('hardhat');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

describe('ArcBuilderProof', function () {
  async function deployFixture() {
    const [builder, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('ArcBuilderProof');
    const registry = await Factory.deploy();
    await registry.waitForDeployment();
    return { registry, builder, other };
  }

  it('creates and updates a builder profile', async function () {
    const { registry, builder } = await deployFixture();

    await expect(
      registry.upsertBuilderProfile('Arry', 'Builder of Arc Network agents', 'Next.js, Solidity, AI Agents', 'ipfs://profile')
    )
      .to.emit(registry, 'BuilderProfileUpserted')
      .withArgs(builder.address, 'Arry', 'ipfs://profile', anyValue);

    const profile = await registry.getBuilderProfile(builder.address);
    expect(profile.owner).to.equal(builder.address);
    expect(profile.name).to.equal('Arry');
    expect(profile.exists).to.equal(true);
  });

  it('creates project proof and lists it by builder', async function () {
    const { registry, builder } = await deployFixture();

    await expect(
      registry.createProjectProof(
        'Arc Builder Proof',
        'Grant-ready MVP',
        'https://github.com/manjima0795/arc-builder-proof',
        'https://arc.network',
        'ipfs://project'
      )
    )
      .to.emit(registry, 'ProjectProofCreated')
      .withArgs(1, builder.address, 'Arc Builder Proof', 'https://github.com/manjima0795/arc-builder-proof');

    const proof = await registry.getProjectProof(1);
    expect(proof.builder).to.equal(builder.address);
    expect(proof.title).to.equal('Arc Builder Proof');
    expect(proof.exists).to.equal(true);

    const ids = await registry.getProofIdsByBuilder(builder.address);
    expect(ids.map((id) => Number(id))).to.deep.equal([1]);
  });

  it('allows only the proof owner to update project proof', async function () {
    const { registry, other } = await deployFixture();
    await registry.createProjectProof('Original', 'desc', 'proof', 'source', 'meta');

    await expect(
      registry.connect(other).updateProjectProof(1, 'Hacked', 'desc', 'proof', 'source', 'meta')
    ).to.be.revertedWithCustomError(registry, 'NotProofOwner');

    await expect(registry.updateProjectProof(1, 'Updated', 'desc2', 'proof2', 'source2', 'meta2'))
      .to.emit(registry, 'ProjectProofUpdated')
      .withArgs(1, (await ethers.getSigners())[0].address, 'Updated', 'proof2');

    const proof = await registry.getProjectProof(1);
    expect(proof.title).to.equal('Updated');
    expect(proof.description).to.equal('desc2');
  });

  it('rejects empty profile names and empty proof titles', async function () {
    const { registry } = await deployFixture();
    await expect(registry.upsertBuilderProfile('', '', '', '')).to.be.revertedWithCustomError(registry, 'EmptyName');
    await expect(registry.createProjectProof('', '', '', '', '')).to.be.revertedWithCustomError(registry, 'EmptyTitle');
  });
});

import React, { useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider, isAddress } from 'ethers';
import {
  ARC_BLOCK_EXPLORER,
  ARC_BUILDER_PROOF_ABI,
  ARC_CHAIN_ID,
  ARC_CHAIN_NAME,
  ARC_RPC_URL,
  CONTRACT_ADDRESS,
} from './contract';
import './styles.css';

type EthereumWindow = Window & {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  };
};

type BuilderProfile = {
  owner: string;
  name: string;
  bio: string;
  skills: string;
  metadataURI: string;
  updatedAt: bigint;
  exists: boolean;
};

type ProjectProof = {
  id: bigint;
  builder: string;
  title: string;
  description: string;
  proofURI: string;
  sourceURI: string;
  metadataURI: string;
  createdAt: bigint;
  updatedAt: bigint;
  exists: boolean;
};

const emptyProfile = {
  name: '',
  bio: '',
  skills: '',
  metadataURI: '',
};

const emptyProof = {
  title: '',
  description: '',
  proofURI: '',
  sourceURI: '',
  metadataURI: '',
};

function getProofIdFromHash() {
  const match = window.location.hash.match(/#\/proof\/(\d+)/);
  return match?.[1] ?? '';
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function formatTs(value: bigint) {
  if (!value || value === 0n) return '—';
  return new Date(Number(value) * 1000).toLocaleString();
}

function txLink(hash: string) {
  return ARC_BLOCK_EXPLORER ? `${ARC_BLOCK_EXPLORER.replace(/\/$/, '')}/tx/${hash}` : '';
}

function addressLink(address: string) {
  return ARC_BLOCK_EXPLORER ? `${ARC_BLOCK_EXPLORER.replace(/\/$/, '')}/address/${address}` : '';
}

function App() {
  const [account, setAccount] = useState('');
  const [status, setStatus] = useState('Ready. Connect a wallet to save your builder profile or create a project proof onchain.');
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [proofForm, setProofForm] = useState(emptyProof);
  const [lookupId, setLookupId] = useState(getProofIdFromHash());
  const [loadedProof, setLoadedProof] = useState<ProjectProof | null>(null);
  const [loadedProfile, setLoadedProfile] = useState<BuilderProfile | null>(null);
  const [builderProofIds, setBuilderProofIds] = useState<string[]>([]);
  const [lastTx, setLastTx] = useState('');
  const [demoProofs, setDemoProofs] = useState<Record<string, ProjectProof>>({});

  const hasContract = CONTRACT_ADDRESS && isAddress(CONTRACT_ADDRESS);
  const readProvider = useMemo(() => {
    if (!ARC_RPC_URL) return null;
    return new JsonRpcProvider(ARC_RPC_URL, ARC_CHAIN_ID || undefined);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('arc-builder-proof-demo');
    if (saved) {
      try {
        setDemoProofs(JSON.parse(saved, (_key, value) => {
          if (typeof value === 'string' && /^\d+n$/.test(value)) return BigInt(value.slice(0, -1));
          return value;
        }));
      } catch {
        localStorage.removeItem('arc-builder-proof-demo');
      }
    }
  }, []);

  useEffect(() => {
    const onHash = () => setLookupId(getProofIdFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  async function switchChainIfConfigured() {
    const ethereum = (window as EthereumWindow).ethereum;
    if (!ethereum || !ARC_CHAIN_ID || !ARC_RPC_URL) return;
    const chainHex = `0x${ARC_CHAIN_ID.toString(16)}`;
    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainHex }] });
    } catch (switchError) {
      const maybe = switchError as { code?: number };
      if (maybe.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainHex,
              chainName: ARC_CHAIN_NAME,
              rpcUrls: [ARC_RPC_URL],
              blockExplorerUrls: ARC_BLOCK_EXPLORER ? [ARC_BLOCK_EXPLORER] : [],
              nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  async function connectWallet() {
    setError('');
    const ethereum = (window as EthereumWindow).ethereum;
    if (!ethereum) {
      setError('No injected wallet found. Install MetaMask/Rabby or use a wallet-enabled browser.');
      return;
    }
    await switchChainIfConfigured();
    const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
    setAccount(accounts[0] || '');
    setStatus(`Connected ${accounts[0] || ''}`);
  }

  async function writeContract() {
    const ethereum = (window as EthereumWindow).ethereum;
    if (!ethereum) throw new Error('Connect an injected wallet first.');
    if (!hasContract) throw new Error('Set VITE_CONTRACT_ADDRESS to a deployed ArcBuilderProof contract.');
    const browserProvider = new BrowserProvider(ethereum);
    const signer = await browserProvider.getSigner();
    return new Contract(CONTRACT_ADDRESS, ARC_BUILDER_PROOF_ABI, signer);
  }

  function readContract() {
    if (!hasContract) throw new Error('Set VITE_CONTRACT_ADDRESS to a deployed ArcBuilderProof contract.');
    if (readProvider) return new Contract(CONTRACT_ADDRESS, ARC_BUILDER_PROOF_ABI, readProvider);
    const ethereum = (window as EthereumWindow).ethereum;
    if (!ethereum) throw new Error('Set VITE_ARC_RPC_URL for public reads or connect a wallet.');
    return new Contract(CONTRACT_ADDRESS, ARC_BUILDER_PROOF_ABI, new BrowserProvider(ethereum));
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const contract = await writeContract();
      const tx = await contract.upsertBuilderProfile(
        profileForm.name,
        profileForm.bio,
        profileForm.skills,
        profileForm.metadataURI,
      );
      setStatus(`Profile tx submitted: ${tx.hash}`);
      setLastTx(tx.hash);
      await tx.wait();
      setStatus('Builder profile saved onchain.');
      if (account) await loadBuilder(account);
    } catch (err) {
      setError(normalizeError(err));
    }
  }

  async function createProof(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if (!hasContract) {
        const now = BigInt(Math.floor(Date.now() / 1000));
        const id = String(Object.keys(demoProofs).length + 1);
        const demo: ProjectProof = {
          id: BigInt(id),
          builder: account || '0x0000000000000000000000000000000000000000',
          title: proofForm.title,
          description: proofForm.description,
          proofURI: proofForm.proofURI,
          sourceURI: proofForm.sourceURI,
          metadataURI: proofForm.metadataURI,
          createdAt: now,
          updatedAt: now,
          exists: true,
        };
        const next = { ...demoProofs, [id]: demo };
        setDemoProofs(next);
        localStorage.setItem('arc-builder-proof-demo', JSON.stringify(next, (_key, value) => typeof value === 'bigint' ? `${value}n` : value));
        window.location.hash = `/proof/${id}`;
        setStatus(`Demo proof #${id} saved locally. Deploy the contract for onchain proofs.`);
        return;
      }

      const contract = await writeContract();
      const tx = await contract.createProjectProof(
        proofForm.title,
        proofForm.description,
        proofForm.proofURI,
        proofForm.sourceURI,
        proofForm.metadataURI,
      );
      setStatus(`Proof tx submitted: ${tx.hash}`);
      setLastTx(tx.hash);
      const receipt = await tx.wait();
      const eventLog = receipt.logs
        .map((log: unknown) => {
          try { return contract.interface.parseLog(log as never); } catch { return null; }
        })
        .find((log: { name?: string } | null) => log?.name === 'ProjectProofCreated');
      const id = eventLog?.args?.proofId?.toString() || '';
      setStatus(`Project proof saved onchain${id ? ` as #${id}` : ''}.`);
      if (id) window.location.hash = `/proof/${id}`;
      if (account) await loadBuilder(account);
    } catch (err) {
      setError(normalizeError(err));
    }
  }

  async function loadProof(event?: React.FormEvent) {
    event?.preventDefault();
    setError('');
    try {
      if (!lookupId) throw new Error('Enter a proof id.');
      if (!hasContract && demoProofs[lookupId]) {
        setLoadedProof(demoProofs[lookupId]);
        setLoadedProfile(null);
        setStatus(`Loaded local demo proof #${lookupId}.`);
        return;
      }
      const contract = readContract();
      const proof = await contract.getProjectProof(lookupId) as ProjectProof;
      setLoadedProof(proof);
      if (proof.builder && proof.builder !== '0x0000000000000000000000000000000000000000') {
        const profile = await contract.getBuilderProfile(proof.builder) as BuilderProfile;
        setLoadedProfile(profile.exists ? profile : null);
      }
      setStatus(`Loaded proof #${lookupId}.`);
    } catch (err) {
      setError(normalizeError(err));
    }
  }

  async function loadBuilder(builder: string) {
    setError('');
    try {
      if (!builder || !isAddress(builder)) throw new Error('Enter a valid builder address.');
      const contract = readContract();
      const profile = await contract.getBuilderProfile(builder) as BuilderProfile;
      const ids = await contract.getProofIdsByBuilder(builder) as bigint[];
      setLoadedProfile(profile.exists ? profile : null);
      setBuilderProofIds(ids.map((id) => id.toString()));
      setStatus(`Loaded ${ids.length} proof id(s) for builder.`);
    } catch (err) {
      setError(normalizeError(err));
    }
  }

  useEffect(() => {
    if (lookupId) void loadProof();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupId, demoProofs]);

  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Arc grant proof-of-build MVP</p>
        <h1>Arc Builder Proof</h1>
        <p className="lede">
          Publish a builder profile and public project proof to an Arc-compatible EVM contract,
          then share a static GitHub Pages proof URL with reviewers, grant committees, and partners.
        </p>
        <div className="actions">
          <button onClick={connectWallet}>{account ? 'Wallet connected' : 'Connect wallet'}</button>
          <a className="button ghost" href="https://github.com/manjima0795/arc-builder-proof" target="_blank" rel="noreferrer">GitHub repo</a>
        </div>
        <div className="status-grid">
          <Status label="Wallet" value={account || 'Not connected'} />
          <Status label="Contract" value={hasContract ? CONTRACT_ADDRESS : 'Not configured: demo/readme mode'} />
          <Status label="Network" value={ARC_CHAIN_ID ? `${ARC_CHAIN_NAME} (${ARC_CHAIN_ID})` : 'Configurable Arc-compatible EVM'} />
        </div>
      </section>

      <section className="notice">
        <strong>Status:</strong> {status}
        {lastTx && <span> · <a href={txLink(lastTx) || undefined} target="_blank" rel="noreferrer">{lastTx.slice(0, 10)}…</a></span>}
        {error && <p className="error">{error}</p>}
      </section>

      <div className="grid two">
        <form className="card" onSubmit={saveProfile}>
          <h2>1. Builder profile</h2>
          <Input label="Name" value={profileForm.name} onChange={(name) => setProfileForm({ ...profileForm, name })} required />
          <Textarea label="Bio" value={profileForm.bio} onChange={(bio) => setProfileForm({ ...profileForm, bio })} />
          <Input label="Skills" value={profileForm.skills} onChange={(skills) => setProfileForm({ ...profileForm, skills })} />
          <Input label="Metadata URI" value={profileForm.metadataURI} onChange={(metadataURI) => setProfileForm({ ...profileForm, metadataURI })} />
          <button type="submit" disabled={!account || !hasContract}>Save builder profile onchain</button>
          {!hasContract && <p className="hint">Deploy the contract and set VITE_CONTRACT_ADDRESS to enable this write.</p>}
        </form>

        <form className="card" onSubmit={createProof}>
          <h2>2. Project proof</h2>
          <Input label="Title" value={proofForm.title} onChange={(title) => setProofForm({ ...proofForm, title })} required />
          <Textarea label="Description" value={proofForm.description} onChange={(description) => setProofForm({ ...proofForm, description })} />
          <Input label="Proof URI" value={proofForm.proofURI} onChange={(proofURI) => setProofForm({ ...proofForm, proofURI })} />
          <Input label="Source URI" value={proofForm.sourceURI} onChange={(sourceURI) => setProofForm({ ...proofForm, sourceURI })} />
          <Input label="Metadata URI" value={proofForm.metadataURI} onChange={(metadataURI) => setProofForm({ ...proofForm, metadataURI })} />
          <button type="submit">{hasContract ? 'Create proof onchain' : 'Create local demo proof'}</button>
        </form>
      </div>

      <section className="card">
        <h2>3. Public proof page</h2>
        <form className="inline" onSubmit={loadProof}>
          <Input label="Proof ID" value={lookupId} onChange={setLookupId} placeholder="1" />
          <button type="submit">Load proof</button>
        </form>
        {loadedProof ? <ProofView proof={loadedProof} profile={loadedProfile} /> : <p className="hint">Share URLs like <code>{window.location.origin}{window.location.pathname}#/proof/1</code>.</p>}
      </section>

      <section className="card">
        <h2>4. Builder lookup</h2>
        <form className="inline" onSubmit={(event) => { event.preventDefault(); void loadBuilder(account); }}>
          <Input label="Builder address" value={account} onChange={setAccount} placeholder="0x…" />
          <button type="submit" disabled={!hasContract}>Load builder</button>
        </form>
        {loadedProfile && <ProfileView profile={loadedProfile} />}
        {builderProofIds.length > 0 && (
          <p>Proof IDs: {builderProofIds.map((id) => <a key={id} href={`#/proof/${id}`}>#{id} </a>)}</p>
        )}
      </section>
    </main>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function Input({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return <label>{label}<input value={value} required={required} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ProofView({ proof, profile }: { proof: ProjectProof; profile: BuilderProfile | null }) {
  const builderHref = addressLink(proof.builder);
  return (
    <article className="proof">
      <p className="eyebrow">Proof #{proof.id.toString()}</p>
      <h3>{proof.title}</h3>
      <p>{proof.description}</p>
      <dl>
        <dt>Builder</dt><dd>{builderHref ? <a href={builderHref} target="_blank" rel="noreferrer">{proof.builder}</a> : proof.builder}</dd>
        <dt>Proof URI</dt><dd><ExternalLink value={proof.proofURI} /></dd>
        <dt>Source URI</dt><dd><ExternalLink value={proof.sourceURI} /></dd>
        <dt>Metadata URI</dt><dd><ExternalLink value={proof.metadataURI} /></dd>
        <dt>Created</dt><dd>{formatTs(proof.createdAt)}</dd>
        <dt>Updated</dt><dd>{formatTs(proof.updatedAt)}</dd>
      </dl>
      {profile && <ProfileView profile={profile} />}
    </article>
  );
}

function ProfileView({ profile }: { profile: BuilderProfile }) {
  return (
    <article className="profile">
      <h3>{profile.name}</h3>
      <p>{profile.bio}</p>
      <p><strong>Skills:</strong> {profile.skills}</p>
      <p><strong>Metadata:</strong> <ExternalLink value={profile.metadataURI} /></p>
      <p><strong>Updated:</strong> {formatTs(profile.updatedAt)}</p>
    </article>
  );
}

function ExternalLink({ value }: { value: string }) {
  if (!value) return <>—</>;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return <a href={value} target="_blank" rel="noreferrer">{value}</a>;
  }
  return <>{value}</>;
}

export default App;

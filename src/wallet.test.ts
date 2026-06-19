import { describe, expect, it } from 'vitest';
import { describeWalletError, isUnknownChainError, toChainHex } from './wallet';

describe('wallet helpers', () => {
  it('formats Arc Testnet chain id as EIP-3085 hex', () => {
    expect(toChainHex(5042002)).toBe('0x4cef52');
  });

  it('detects unknown-chain errors from MetaMask and Rabby shapes', () => {
    expect(isUnknownChainError({ code: 4902 })).toBe(true);
    expect(isUnknownChainError({ code: '4902' })).toBe(true);
    expect(isUnknownChainError({ data: { originalError: { code: 4902 } } })).toBe(true);
    expect(isUnknownChainError(new Error('Unrecognized chain ID. Try adding the chain first.'))).toBe(true);
    expect(isUnknownChainError({ code: 4001, message: 'User rejected the request' })).toBe(false);
  });

  it('keeps wallet errors readable for diagnostics', () => {
    expect(describeWalletError({ code: 4001, message: 'User rejected the request' })).toBe('User rejected the request');
  });
});

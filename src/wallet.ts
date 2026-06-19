export type Eip1193ErrorLike = {
  code?: number | string;
  message?: string;
  data?: unknown;
};

export function toChainHex(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

function readNestedCode(value: unknown): number | string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const direct = record.code;
  if (typeof direct === 'number' || typeof direct === 'string') return direct;
  return readNestedCode(record.data) ?? readNestedCode(record.originalError);
}

export function isUnknownChainError(error: unknown) {
  const code = readNestedCode(error);
  if (code === 4902 || code === '4902') return true;

  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message ?? '')
    : String(error ?? '');

  return /unrecognized chain|unknown chain|chain.*not.*(added|found|configured)|wallet_addethereumchain/i.test(message);
}

export function describeWalletError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const maybe = error as Eip1193ErrorLike;
    if (maybe.message) return maybe.message;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

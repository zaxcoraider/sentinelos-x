import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// repo root is two levels up from packages/casper/src
export const REPO_ROOT = resolve(__dirname, '../../..');

loadEnv({ path: resolve(REPO_ROOT, '.env') });

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.startsWith('REPLACE_')) {
    throw new Error(`Missing required env var ${name} (check .env)`);
  }
  return v;
}

/** Strip a `hash-`/`contract-package-` style prefix, returning bare hex. */
export function bareHex(formatted: string): string {
  return formatted.replace(/^(hash-|contract-package-|contract-|entity-|package-)/, '');
}

export const NODE_URL = process.env.CASPER_NODE_URL ?? 'https://node.testnet.casper.network/rpc';
export const CHAIN_NAME = process.env.CASPER_CHAIN_NAME ?? 'casper-test';
export const PACKAGE_HASH = bareHex(required('TREASURY_GUARD_PACKAGE_HASH'));
export const CONTRACT_HASH = bareHex(required('TREASURY_GUARD_CONTRACT_HASH'));
export const SECRET_KEY_PATH = resolve(REPO_ROOT, process.env.CASPER_SECRET_KEY_PATH ?? './keys/secret_key.pem');
export const PAYMENT_RECORD_ACTION = Number(process.env.CASPER_CALL_PAYMENT ?? 20_000_000_000);
/** Gas payment for a native CSPR transfer (the x402 settlement). 0.1 CSPR. */
export const PAYMENT_NATIVE_TRANSFER = Number(process.env.CASPER_TRANSFER_PAYMENT ?? 100_000_000);
export const EXPLORER_BASE = 'https://testnet.cspr.live';

// --- CSPR.cloud REST API (real on-chain activity feed) ---
export const CSPR_CLOUD_REST_URL = process.env.CSPR_CLOUD_REST_URL ?? 'https://api.testnet.cspr.cloud';
export const CSPR_CLOUD_API_KEY = process.env.CSPR_CLOUD_API_KEY ?? '';
export const PUBLIC_KEY_HEX = process.env.CASPER_PUBLIC_KEY_HEX ?? '';

export function readSecretKeyPem(): string {
  return readFileSync(SECRET_KEY_PATH, 'utf8');
}

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_BASE}/transaction/${hash}`;
}

export function explorerContractUrl(): string {
  return `${EXPLORER_BASE}/contract-package/${PACKAGE_HASH}`;
}

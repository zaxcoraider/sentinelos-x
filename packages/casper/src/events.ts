// Real on-chain activity feed via the CSPR.cloud REST API. Reads the sentinel
// account's deploys, filters to `record_action` calls on TreasuryGuard, and
// returns the actual recorded actions with real tx hashes — no mock data.

import {
  CSPR_CLOUD_REST_URL,
  CSPR_CLOUD_API_KEY,
  PUBLIC_KEY_HEX,
  PACKAGE_HASH,
  CONTRACT_HASH,
  explorerTxUrl,
} from './config.js';

export interface OnChainAction {
  txHash: string;
  agent: string;
  action: string;
  severity: number | null;
  value: number | null;
  timestamp: string;
  blockHeight?: number;
  success: boolean;
  explorerUrl: string;
}

interface CsprCloudArg {
  parsed?: unknown;
}
interface CsprCloudDeploy {
  deploy_hash: string;
  timestamp: string;
  block_height?: number;
  error_message?: string | null;
  contract_hash?: string;
  contract_package_hash?: string;
  args?: Record<string, CsprCloudArg>;
}

const num = (v: unknown): number | null => (typeof v === 'number' ? v : v != null && !isNaN(Number(v)) ? Number(v) : null);

/**
 * Fetches the most recent `record_action` transactions on TreasuryGuard from
 * CSPR.cloud (real, verifiable). Returns [] if the API key isn't configured or
 * the feed is unreachable — callers treat this as best-effort.
 */
export async function readRecentActions(limit = 15): Promise<OnChainAction[]> {
  if (!CSPR_CLOUD_API_KEY || !PUBLIC_KEY_HEX) return [];
  try {
    const url = `${CSPR_CLOUD_REST_URL}/accounts/${PUBLIC_KEY_HEX}/deploys?page=1&page_size=${Math.min(limit * 3, 50)}`;
    const res = await fetch(url, {
      headers: { Authorization: CSPR_CLOUD_API_KEY },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: CsprCloudDeploy[] };
    const rows = body.data ?? [];
    return rows
      .filter(
        (r) =>
          (r.contract_package_hash === PACKAGE_HASH || r.contract_hash === CONTRACT_HASH) &&
          r.args?.agent?.parsed != null,
      )
      .slice(0, limit)
      .map((r) => ({
        txHash: r.deploy_hash,
        agent: String(r.args?.agent?.parsed ?? 'unknown'),
        action: String(r.args?.action?.parsed ?? '—'),
        severity: num(r.args?.severity?.parsed),
        value: num(r.args?.value?.parsed),
        timestamp: r.timestamp,
        blockHeight: r.block_height,
        success: !r.error_message,
        explorerUrl: explorerTxUrl(r.deploy_hash),
      }));
  } catch {
    return [];
  }
}

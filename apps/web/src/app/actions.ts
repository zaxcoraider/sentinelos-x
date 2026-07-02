'use server';

import {
  readState,
  recordAction,
  explorerTxUrl,
  type TreasuryState,
  type RecordActionResult,
} from '@sentinelos/casper';

/** Server-only: re-read live on-chain TreasuryGuard state for an agent. */
export async function fetchState(agent = 'treasury'): Promise<TreasuryState> {
  return readState(agent);
}

/** Success carries the tx; failure carries the REAL error (Next redacts thrown
 *  Server-Action errors in production, so we return the message as data). */
export type WriteResult = ({ ok: true } & RecordActionResult) | { ok: false; error: string };

/**
 * Server-only: sign + submit a real `record_action` transaction to Casper
 * Testnet. The signing key never leaves the server. Returns the tx hash and an
 * explorer URL immediately after submission (execution is confirmed by polling
 * fresh state from the client).
 */
export async function recordTreasuryAction(): Promise<WriteResult> {
  try {
    const r = await recordAction('treasury', 'REBALANCE', 80, 1000);
    return { ok: true, ...r };
  } catch (e) {
    console.error('[approve] record_action failed:', e);
    return { ok: false, error: e instanceof Error ? e.message : 'record_action failed to submit' };
  }
}

export { explorerTxUrl };

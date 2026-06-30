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

/**
 * Server-only: sign + submit a real `record_action` transaction to Casper
 * Testnet. The signing key never leaves the server. Returns the tx hash and an
 * explorer URL immediately after submission (execution is confirmed by polling
 * fresh state from the client).
 */
export async function recordTreasuryAction(): Promise<RecordActionResult> {
  return recordAction('treasury', 'REBALANCE', 80, 1000);
}

export { explorerTxUrl };

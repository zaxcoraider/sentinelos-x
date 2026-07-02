'use server';

import { recordAction as chainRecordAction, type RecordActionResult } from '@sentinelos/casper';

/** Success carries the tx; failure carries the real error (Next redacts thrown
 *  Server-Action errors in production, so we return the message as data). */
export type WriteResult = ({ ok: true } & RecordActionResult) | { ok: false; error: string };

/**
 * Server-only: submit the council's motion on-chain — a real `record_action`
 * to TreasuryGuard under the "governance" agent. The signing key stays server-side.
 */
export async function recordAction(
  agent: string,
  action: string,
  severity: number,
): Promise<WriteResult> {
  try {
    const r = await chainRecordAction(agent, action, Math.round(severity), 0);
    return { ok: true, ...r };
  } catch (e) {
    console.error('[governance submit] record_action failed:', e);
    return { ok: false, error: e instanceof Error ? e.message : 'record_action failed to submit' };
  }
}

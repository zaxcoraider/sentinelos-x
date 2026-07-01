'use server';

import { recordAction as chainRecordAction, type RecordActionResult } from '@sentinelos/casper';

/**
 * Server-only: submit the council's motion on-chain — a real `record_action`
 * to TreasuryGuard under the "governance" agent. The signing key stays server-side.
 */
export async function recordAction(
  agent: string,
  action: string,
  severity: number,
): Promise<RecordActionResult> {
  return chainRecordAction(agent, action, Math.round(severity), 0);
}

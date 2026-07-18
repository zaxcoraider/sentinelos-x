// Real on-chain activity for the header notifications bell — the latest
// record_action transactions on TreasuryGuard, indexed by CSPR.cloud. Cached
// briefly server-side so an open dashboard doesn't hammer the indexer.
import { readRecentActions } from '@sentinelos/casper';

export const runtime = 'nodejs';
export const revalidate = 30;

export async function GET() {
  // readRecentActions is best-effort and returns [] when the CSPR.cloud key
  // isn't configured or the indexer is unreachable — never throws.
  const actions = await readRecentActions(8);
  return Response.json({ actions, updatedAt: new Date().toISOString() });
}

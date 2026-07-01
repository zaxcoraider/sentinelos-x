import { readState } from '@sentinelos/casper';
import { MissionControl } from '@/components/mission-control';

// On-chain reads must never be cached — always reflect live Testnet state.
export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialTotalActions: number | null = null;
  try {
    const state = await readState('treasury');
    initialTotalActions = state.totalActions;
  } catch {
    /* offline — panels still render, chain tiles show — */
  }

  return <MissionControl initialTotalActions={initialTotalActions} />;
}

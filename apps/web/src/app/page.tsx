import { readState, explorerContractUrl, PACKAGE_HASH, type TreasuryState } from '@sentinelos/casper';
import { Dashboard } from '@/components/dashboard';

// On-chain reads must never be cached — always reflect live Testnet state.
export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialState: TreasuryState | null = null;
  let error: string | null = null;
  try {
    initialState = await readState('treasury');
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to read chain state';
  }

  return (
    <Dashboard
      initialState={initialState}
      initialError={error}
      contractUrl={explorerContractUrl()}
      packageHash={PACKAGE_HASH}
    />
  );
}

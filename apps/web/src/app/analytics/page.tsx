import { BarChart3 } from 'lucide-react';
import { readState, readRecentActions, type OnChainAction } from '@sentinelos/casper';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { PageHeader } from '@/components/mc/page-header';

export const metadata = { title: 'Analytics — SentinelOS' };

// Reads live chain state — never cached.
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  let totalActions: number | null = null;
  try {
    const state = await readState('treasury');
    totalActions = state.totalActions;
  } catch {
    totalActions = null;
  }

  let recent: OnChainAction[] = [];
  try {
    recent = await readRecentActions(50);
  } catch {
    recent = [];
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Protocol Intelligence"
        title="Analytics"
        icon={BarChart3}
        tone="251, 191, 36"
        subtitle="The sentinel team's on-chain output, aggregated — live TreasuryGuard state, the indexed record_action history from CSPR.cloud, and the real economics of an incident."
      />
      <AnalyticsDashboard totalActions={totalActions} recent={recent} />
    </main>
  );
}

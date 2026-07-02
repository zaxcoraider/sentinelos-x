import { ShieldAlert } from 'lucide-react';
import { readState, readRecentActions, explorerContractUrl, type OnChainAction } from '@sentinelos/casper';
import { SecurityCenter, type AgentState } from '@/components/security-center';
import { PageHeader } from '@/components/mc/page-header';

// Reads live chain state — never cached.
export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const names = ['treasury', 'governance'];
  let totalActions: number | null = null;
  const agents: AgentState[] = [];

  for (const agent of names) {
    try {
      const state = await readState(agent);
      totalActions = state.totalActions;
      agents.push({ agent, lastAction: state.lastAction, lastSeverity: state.lastSeverity });
    } catch {
      agents.push({ agent, lastAction: null, lastSeverity: null });
    }
  }

  let recent: OnChainAction[] = [];
  try {
    recent = await readRecentActions(12);
  } catch {
    recent = [];
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Threat Monitoring"
        title="Security Center"
        icon={ShieldAlert}
        tone="239, 68, 68"
        subtitle="Live threat radar over the on-chain TreasuryGuard contract — the sentinel's recorded responses and current threat level, straight from Casper state."
      />

      <SecurityCenter
        agents={agents}
        totalActions={totalActions}
        contractUrl={explorerContractUrl()}
        recent={recent}
      />
    </main>
  );
}

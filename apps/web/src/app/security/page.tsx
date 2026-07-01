import { readState, explorerContractUrl } from '@sentinelos/casper';
import { SecurityCenter, type AgentState } from '@/components/security-center';

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

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Security Center</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Live threat radar over the on-chain TreasuryGuard contract — the sentinel&apos;s recorded
          responses and current threat level, straight from Casper state.
        </p>
      </header>

      <SecurityCenter agents={agents} totalActions={totalActions} contractUrl={explorerContractUrl()} />
    </main>
  );
}

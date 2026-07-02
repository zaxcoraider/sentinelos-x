import { Bot } from 'lucide-react';
import { readState } from '@sentinelos/casper';
import { AgentRoster } from '@/components/agent-roster';
import { PageHeader } from '@/components/mc/page-header';

// Reads live chain state — never cached.
export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  let totalActions: number | null = null;
  try {
    const state = await readState('treasury');
    totalActions = state.totalActions;
  } catch {
    totalActions = null;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="Agent Roster"
        title="Agent Team"
        icon={Bot}
        tone="96, 165, 250"
        subtitle="SentinelOS runs a team of 12 autonomous agents on your protocol — all live and acting on Casper today. Treasury and Governance execute on-chain; the rest add real data and analysis. Every agent anchors a verifiable record — nothing here is mocked."
      />

      <AgentRoster totalActions={totalActions} />
    </main>
  );
}

import { readState } from '@sentinelos/casper';
import { AgentRoster } from '@/components/agent-roster';

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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Agent Team</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          SentinelOS runs a team of autonomous agents on your protocol. Four are live and acting
          on Casper today; the rest ship in v1. Live agents act for real — nothing here is mocked.
        </p>
      </header>

      <AgentRoster totalActions={totalActions} />
    </main>
  );
}

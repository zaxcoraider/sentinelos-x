'use client';

import { useCallback, useMemo, useState } from 'react';
import { Zap, Loader2, Network } from 'lucide-react';
import type { TraceStep } from '@sentinelos/agents';
import { Button } from '@/components/ui/button';
import { fetchState, recordTreasuryAction } from '@/app/actions';
import { useCrisisStream } from '@/hooks/use-crisis-stream';
import { StatusStrip } from '@/components/mc/status-strip';
import { LiveMarket } from '@/components/mc/live-market';
import { AgentGraph } from '@/components/mc/agent-graph';
import { EventTimeline } from '@/components/mc/event-timeline';
import { ThinkingPanel } from '@/components/mc/thinking-panel';
import { cn } from '@/lib/utils';

interface TxInfo {
  txHash: string;
  explorerUrl: string;
}

function severityFromSteps(steps: TraceStep[]): number | null {
  const risk = steps.find((s) => s.agent === 'Risk');
  const v = risk?.detail?.severity;
  return typeof v === 'number' ? v : null;
}

function Panel({
  title,
  icon: Icon,
  right,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  icon?: typeof Network;
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('flex flex-col overflow-hidden rounded-xl border border-border bg-card-elevated/40', className)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {title}
        {right && <div className="ml-auto">{right}</div>}
      </div>
      <div className={cn('flex-1', bodyClassName)}>{children}</div>
    </section>
  );
}

export function MissionControl({ initialTotalActions }: { initialTotalActions: number | null }) {
  const { phase, steps, result, error, activeAgent, seenAgents, running, trigger } = useCrisisStream();
  const [totalActions, setTotalActions] = useState<number | null>(initialTotalActions);
  const [approving, setApproving] = useState(false);
  const [approvedTx, setApprovedTx] = useState<TxInfo | null>(null);

  // Real-time operational threat: null at standby (no active incident → healthy),
  // spikes to the Risk score during a run, and returns to resolved once the
  // treasury has acted (routed). Historical severity lives in the Security Center.
  const severity = useMemo(() => {
    if (running) return severityFromSteps(steps);
    if (phase === 'done') return result?.routed ? 0 : (result?.severity ?? severityFromSteps(steps));
    return null;
  }, [running, phase, result, steps]);

  const onTrigger = useCallback(() => {
    setApprovedTx(null);
    // Dashboard trigger reasons live but doesn't auto-write on-chain — the human
    // Approve below is the on-chain action (matches the human-in-the-loop demo).
    void trigger({ dry: true });
  }, [trigger]);

  const onApprove = useCallback(async () => {
    setApproving(true);
    try {
      const tx = await recordTreasuryAction();
      setApprovedTx(tx);
      // Reflect the new on-chain action count once it lands.
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        try {
          const next = await fetchState('treasury');
          if (totalActions === null || next.totalActions > totalActions) {
            setTotalActions(next.totalActions);
            break;
          }
        } catch {
          /* keep polling */
        }
      }
    } catch {
      /* surfaced via the panel staying on Approve */
    } finally {
      setApproving(false);
    }
  }, [totalActions]);

  const phaseChip =
    phase === 'running'
      ? { label: 'Responding', tone: 'text-warning', dot: 'bg-warning animate-pulse' }
      : phase === 'done'
        ? result?.routed
          ? { label: 'Recovered', tone: 'text-success', dot: 'bg-success' }
          : { label: 'Monitoring', tone: 'text-sky-400', dot: 'bg-sky-400' }
        : { label: 'Standby', tone: 'text-muted-foreground', dot: 'bg-muted-foreground' };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mission Control</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Live agent operations over the on-chain treasury — real reasoning, real Casper txs.
          </p>
        </div>
        <Button
          onClick={onTrigger}
          disabled={running}
          className="bg-danger text-white hover:bg-danger/90"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {running ? 'Agents responding…' : phase === 'done' ? 'Trigger again' : 'Trigger incident'}
        </Button>
      </header>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <LiveMarket />

      <StatusStrip totalActions={totalActions} severity={severity} running={running} />

      {/* Agent network + reasoning */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="Live Agent Network"
          icon={Network}
          className="lg:col-span-2"
          right={
            <span className={cn('inline-flex items-center gap-1.5 text-[11px] normal-case', phaseChip.tone)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', phaseChip.dot)} />
              {phaseChip.label}
            </span>
          }
          bodyClassName="p-2"
        >
          <div className="h-[360px]">
            <AgentGraph activeAgent={activeAgent} seenAgents={seenAgents} running={running} />
          </div>
        </Panel>

        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card-elevated/40 lg:col-span-1">
          <ThinkingPanel
            steps={steps}
            result={result}
            running={running}
            activeAgent={activeAgent}
            onApprove={onApprove}
            approving={approving}
            approvedTx={approvedTx}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="flex max-h-[340px] min-h-[200px] flex-col overflow-hidden rounded-xl border border-border bg-card-elevated/40">
        <EventTimeline steps={steps} running={running} />
      </div>

      <footer className="text-[11px] text-muted-foreground">
        Trigger runs a stress drill (a simulated USDC depeg) through the real agents — live market data
        over x402, real reasoning — and the on-chain write happens when you Approve. Every hash links to
        cspr.live. Live prices from CoinGecko; the depeg is a drill, everything else is real.
      </footer>
    </main>
  );
}

'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2, Network, Cpu, Radar, Receipt, Radio, Coins } from 'lucide-react';
import type { TraceStep } from '@sentinelos/agents';
import { Button } from '@/components/ui/button';
import { fetchState, recordTreasuryAction } from '@/app/actions';
import { useCrisisStream } from '@/hooks/use-crisis-stream';
import { StatusStrip } from '@/components/mc/status-strip';
import { LiveMarket } from '@/components/mc/live-market';
import { AgentGraph } from '@/components/mc/agent-graph';
import { EventTimeline } from '@/components/mc/event-timeline';
import { ThinkingPanel } from '@/components/mc/thinking-panel';
import { ThreatRadar } from '@/components/mc/threat-radar';
import { TransactionFeed } from '@/components/mc/transaction-feed';
import { TreasuryRecommendation } from '@/components/mc/treasury-recommendation';
import { StatusBar } from '@/components/mc/status-bar';
import { Magnetic } from '@/components/mc/magnetic';
import { Panel } from '@/components/mc/panel';
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

export function MissionControl({ initialTotalActions }: { initialTotalActions: number | null }) {
  const { phase, steps, result, error, activeAgent, seenAgents, running, trigger } = useCrisisStream();
  const [totalActions, setTotalActions] = useState<number | null>(initialTotalActions);
  const [approving, setApproving] = useState(false);
  const [approvedTx, setApprovedTx] = useState<TxInfo | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);

  const severity = useMemo(() => {
    if (running) return severityFromSteps(steps);
    if (phase === 'done') return result?.routed ? 0 : (result?.severity ?? severityFromSteps(steps));
    return null;
  }, [running, phase, result, steps]);

  const protectedUsd = result?.decision ? Math.round(result.decision.expectedSavingsUsd) : 0;

  const onTrigger = useCallback(() => {
    setApprovedTx(null);
    setApproveError(null);
    setRejected(false);
    void trigger({ dry: true });
  }, [trigger]);

  const onReject = useCallback(() => {
    setRejected(true);
    setApproveError(null);
  }, []);

  const onApprove = useCallback(async () => {
    setApproving(true);
    setApproveError(null);
    try {
      const res = await recordTreasuryAction();
      if (!res.ok) {
        setApproveError(res.error);
        return;
      }
      setApprovedTx({ txHash: res.txHash, explorerUrl: res.explorerUrl });
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        try {
          const next = await fetchState('treasury');
          if (totalActions === null || next.totalActions > totalActions) {
            setTotalActions(next.totalActions);
            break;
          }
        } catch {
          /* keep polling — the write is submitted; execution confirms shortly */
        }
      }
    } catch (e) {
      setApproveError(e instanceof Error ? e.message : 'Transaction failed to submit');
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
        : { label: 'Live', tone: 'text-success', dot: 'bg-success animate-pulse' };

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-5 px-6 py-7">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mission Control</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Live agent operations over the on-chain treasury — real reasoning, real Casper txs.
          </p>
        </div>
        <Magnetic>
          <Button onClick={onTrigger} disabled={running} className="bg-danger text-white hover:bg-danger/90">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {running ? 'Agents responding…' : phase === 'done' ? 'Trigger again' : 'Trigger incident'}
          </Button>
        </Magnetic>
      </header>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <LiveMarket />

      <StatusStrip totalActions={totalActions} severity={severity} running={running} protectedUsd={protectedUsd} />

      {/* Network + right rail */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="Live Agent Network"
          icon={Network}
          tone="96, 165, 250"
          className="lg:col-span-2"
          right={
            <span className={cn('inline-flex items-center gap-1.5 text-[11px]', phaseChip.tone)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', phaseChip.dot)} />
              {phaseChip.label}
            </span>
          }
          bodyClassName="p-2"
        >
          <div className="h-[400px]">
            <AgentGraph activeAgent={activeAgent} seenAgents={seenAgents} running={running} />
          </div>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="AI Thinking Stream" icon={Cpu} tone="167, 139, 250" className="min-h-[220px]">
            <ThinkingPanel steps={steps} result={result} running={running} activeAgent={activeAgent} />
          </Panel>

          <Panel title="Threat Radar" icon={Radar} tone={severity !== null && severity >= 60 ? '239, 68, 68' : '34, 197, 94'}>
            <ThreatRadar severity={severity} running={running} />
          </Panel>

          <Panel
            title="Transaction Feed"
            icon={Receipt}
            tone="56, 189, 248"
            right={
              totalActions !== null ? (
                <span className="font-mono text-[11px] text-muted-foreground">{totalActions} total</span>
              ) : undefined
            }
            className="max-h-[300px]"
          >
            <TransactionFeed steps={steps} approvedTx={approvedTx} />
          </Panel>
        </div>
      </div>

      {/* Timeline + recommendation */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Live Activity Timeline"
          icon={Radio}
          tone="34, 197, 94"
          className="max-h-[360px] min-h-[220px]"
        >
          <EventTimeline steps={steps} running={running} />
        </Panel>

        <Panel title="Treasury Agent Recommendation" icon={Coins} tone="34, 197, 94" className="min-h-[220px]">
          <TreasuryRecommendation
            result={result}
            onApprove={onApprove}
            onReject={onReject}
            approving={approving}
            approvedTx={approvedTx}
            approveError={approveError}
            dismissed={rejected}
          />
        </Panel>
      </div>

      <StatusBar running={running} />

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[11px] text-muted-foreground"
      >
        Trigger runs a stress drill (a simulated USDC depeg) through the real agents — live market data over x402,
        real reasoning — and the on-chain write happens when you Approve. Every hash links to cspr.live. Live prices
        from CoinGecko; the depeg is a drill, everything else is real.
      </motion.footer>
    </main>
  );
}

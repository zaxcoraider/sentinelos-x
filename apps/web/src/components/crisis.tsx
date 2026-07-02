'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Compass,
  Coins,
  Landmark,
  ArrowUpRight,
  Loader2,
  Zap,
  CheckCircle2,
  Activity,
  CreditCard,
} from 'lucide-react';
import type {
  MarketEvent,
  TraceStep,
  PipelineResult,
  AgentRole,
} from '@sentinelos/agents';
import { Button } from '@/components/ui/button';
import { IconTile, Panel, PanelCard } from '@/components/mc/panel';
import { cn, shortHash } from '@/lib/utils';

type Phase = 'idle' | 'running' | 'done' | 'error';

const DEFAULT_EVENT: MarketEvent = { type: 'DEPEG', asset: 'USDC', deviation: 0.07 };

const AGENT_META: Record<AgentRole, { icon: typeof ShieldAlert; color: string; ring: string; label: string }> = {
  Risk: { icon: ShieldAlert, color: 'text-amber-400', ring: 'ring-amber-500/30', label: 'Risk Agent' },
  Commander: { icon: Compass, color: 'text-sky-400', ring: 'ring-sky-500/30', label: 'Commander' },
  Treasury: { icon: Coins, color: 'text-emerald-400', ring: 'ring-emerald-500/30', label: 'Treasury Agent' },
  Governance: { icon: Landmark, color: 'text-violet-400', ring: 'ring-violet-500/30', label: 'Governance Agent' },
};

function TxLink({ url, hash }: { url: string; hash: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs text-foreground hover:underline"
    >
      {shortHash(hash)}
      <ArrowUpRight className="h-3 w-3" />
    </a>
  );
}

export function Crisis() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dry, setDry] = useState(false);
  const running = phase === 'running';

  // Peg health derived from phase: nominal → depegged → recovered.
  const deviation = DEFAULT_EVENT.deviation ?? 0.07;
  const pegState: 'stable' | 'depegged' | 'recovered' | 'monitoring' =
    phase === 'idle'
      ? 'stable'
      : phase === 'running'
        ? 'depegged'
        : result?.routed
          ? 'recovered'
          : phase === 'done'
            ? 'monitoring'
            : 'depegged';
  const pegPrice =
    pegState === 'stable' ? 1 : pegState === 'depegged' ? 1 - deviation : pegState === 'recovered' ? 0.999 : 1 - deviation;

  const abortRef = useRef<AbortController | null>(null);

  const trigger = useCallback(async () => {
    setPhase('running');
    setSteps([]);
    setResult(null);
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/crisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: DEFAULT_EVENT, live: !dry }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error('No response stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Read the NDJSON stream, dispatching each event as it arrives.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          const msg = JSON.parse(line) as
            | { type: 'start' }
            | { type: 'step'; step: TraceStep }
            | { type: 'result'; result: PipelineResult }
            | { type: 'error'; message: string };
          if (msg.type === 'step') setSteps((prev) => [...prev, msg.step]);
          else if (msg.type === 'result') setResult(msg.result);
          else if (msg.type === 'error') {
            setError(msg.message);
            setPhase('error');
            return;
          }
        }
      }
      setPhase('done');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Crisis run failed');
      setPhase('error');
    }
  }, [dry]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      {/* Page title */}
      <header className="flex items-start gap-3.5">
        <IconTile icon={Zap} tone="239, 68, 68" size="lg" />
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
            Incident Response
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Crisis Response</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Autonomous depeg → detect · pay · decide · execute · recover
          </p>
        </div>
      </header>

      {/* Peg health panel */}
      <PanelCard hover={false}>
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">USDC peg</div>
              <div className="mt-1 flex items-baseline gap-2">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={pegPrice}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={cn(
                      'font-mono text-4xl font-semibold tabular-nums',
                      pegState === 'depegged'
                        ? 'text-red-400'
                        : pegState === 'recovered'
                          ? 'text-emerald-400'
                          : 'text-foreground',
                    )}
                  >
                    ${pegPrice.toFixed(4)}
                  </motion.span>
                </AnimatePresence>
                <span className="text-sm text-muted-foreground">/ $1.0000 target</span>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1',
                pegState === 'stable' && 'text-muted-foreground ring-border',
                pegState === 'depegged' && 'text-red-400 ring-red-500/30 bg-red-500/5',
                pegState === 'recovered' && 'text-emerald-400 ring-emerald-500/30 bg-emerald-500/5',
                pegState === 'monitoring' && 'text-sky-400 ring-sky-500/30 bg-sky-500/5',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  pegState === 'stable' && 'bg-muted-foreground',
                  pegState === 'depegged' && 'bg-red-500 animate-pulse',
                  pegState === 'recovered' && 'bg-emerald-400',
                  pegState === 'monitoring' && 'bg-sky-400',
                )}
              />
              {pegState === 'stable' && 'Peg nominal'}
              {pegState === 'depegged' && 'Depeg detected'}
              {pegState === 'recovered' && 'Protocol recovered'}
              {pegState === 'monitoring' && 'Monitoring — no action'}
            </span>
          </div>

          {/* Peg bar */}
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn(
                'h-full rounded-full',
                pegState === 'depegged' ? 'bg-red-500' : pegState === 'recovered' ? 'bg-emerald-400' : 'bg-foreground',
              )}
              animate={{ width: `${Math.max(0, Math.min(1, pegPrice)) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-sm text-sm text-muted-foreground">
              Injects a {(deviation * 100).toFixed(0)}% USDC depeg and turns the live agent team loose:
              Risk scores it, Commander routes, Treasury buys premium data over{' '}
              <span className="font-mono text-foreground">x402</span> and acts, Governance drafts an
              emergency proposal — all anchored on Casper.
            </p>
            <div className="flex flex-col items-end gap-2">
              <Button onClick={trigger} disabled={running} className="bg-red-500 text-white hover:bg-red-500/90">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {running ? 'Agents responding…' : 'Simulate USDC depeg'}
              </Button>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={dry}
                  onChange={(e) => setDry(e.target.checked)}
                  disabled={running}
                  className="h-3 w-3 accent-foreground"
                />
                Dry run (no on-chain tx / no CSPR spent)
              </label>
            </div>
          </div>
        </div>
      </PanelCard>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Agent trace timeline */}
      {steps.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Agent trace
          </div>
          <ol className="relative flex flex-col gap-3 border-l border-border pl-6">
            <AnimatePresence initial={false}>
              {steps.map((step, i) => {
                const meta = AGENT_META[step.agent];
                const Icon = meta.icon;
                const txHash = step.detail?.txHash as string | undefined;
                const explorerUrl = step.detail?.explorerUrl as string | undefined;
                return (
                  <motion.li
                    key={`${step.agent}-${i}-${step.at}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                  >
                    <span
                      className={cn(
                        'absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-card ring-1',
                        meta.ring,
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', meta.color)} />
                    </span>
                    <div className="rounded-md border border-border bg-card px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('text-sm font-semibold', meta.color)}>{meta.label}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(step.at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground/90">{step.summary}</p>
                      {txHash && explorerUrl && (
                        <div className="mt-2">
                          <TxLink url={explorerUrl} hash={txHash} />
                        </div>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {running && (
              <motion.li
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative flex items-center gap-2 py-1 text-xs text-muted-foreground"
              >
                <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-card ring-1 ring-border">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </span>
                agents working…
              </motion.li>
            )}
          </ol>
        </section>
      )}

      {/* x402 payment + Governance proposal cards (from the final result) */}
      <AnimatePresence>
        {result?.x402 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Panel
              title="x402 premium data"
              icon={CreditCard}
              tone="56, 189, 248"
              right={
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {result.x402.mode}
                </span>
              }
              bodyClassName="flex flex-col gap-2 p-5"
            >
              <p className="text-sm text-muted-foreground">
                Paid {Number(result.x402.amountMotes).toLocaleString()} motes for the premium volatility
                feed before deciding.
              </p>
              {result.x402.facilitator && (
                <div className="flex items-start gap-1.5 rounded-md border border-sky-500/25 bg-sky-500/5 px-2.5 py-1.5 text-xs text-sky-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                  <span>
                    Verified against the official <span className="font-medium">Casper x402 facilitator</span> ·{' '}
                    <span className="font-mono">{result.x402.facilitator.network}</span>
                    {result.x402.facilitator.feePayer && (
                      <> · feePayer <span className="font-mono">{result.x402.facilitator.feePayer.slice(0, 10)}…</span></>
                    )}
                  </span>
                </div>
              )}
              {result.x402.explorerUrl && (
                <TxLink url={result.x402.explorerUrl} hash={result.x402.txHash} />
              )}
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result?.governance && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Panel
              title="Emergency proposal"
              icon={Landmark}
              tone="167, 139, 250"
              bodyClassName="flex flex-col gap-3 p-5"
            >
              <div>
                <div className="text-base font-semibold">{result.governance.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{result.governance.summary}</p>
              </div>
              {result.governance.parameterChanges.length > 0 && (
                <ul className="flex flex-col gap-1 text-sm text-foreground/90">
                  {result.governance.parameterChanges.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-violet-400">›</span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Action: <span className="font-mono text-foreground">{result.governance.action}</span></span>
                <span>Quorum: <span className="text-foreground">{result.governance.quorumPercent}%</span></span>
                <span>Window: <span className="text-foreground">{result.governance.votingWindowHours}h</span></span>
              </div>
              {result.governanceTx && (
                <div className="border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">Anchored on Casper · </span>
                  <TxLink url={result.governanceTx.explorerUrl} hash={result.governanceTx.txHash} />
                </div>
              )}
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recovery banner */}
      <AnimatePresence>
        {phase === 'done' && result?.routed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="text-emerald-300">
              Crisis handled autonomously — Treasury acted{result.decision ? ` (${result.decision.action})` : ''} and
              the response is anchored on Casper. A human only needs to approve.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="text-xs text-muted-foreground">
        Phase 6 · live agents (Risk · Commander · Treasury · Governance) + x402 + on-chain records. No mock data.
      </footer>
    </main>
  );
}

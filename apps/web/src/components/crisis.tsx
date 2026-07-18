'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  ShieldAlert,
  LineChart,
  Compass,
  ScrollText,
  Droplets,
  Coins,
  Umbrella,
  Sprout,
  Users,
  Gavel,
  Landmark,
  ArrowUpRight,
  Loader2,
  Zap,
  CheckCircle2,
  Activity,
  CreditCard,
  HandCoins,
  XCircle,
} from 'lucide-react';
import type {
  MarketEvent,
  TraceStep,
  PipelineResult,
  AgentRole,
  A2aPayment,
} from '@sentinelos/agents';
import { Button } from '@/components/ui/button';
import { IconTile, Panel, PanelCard } from '@/components/mc/panel';
import { cn, shortHash } from '@/lib/utils';

type Phase = 'idle' | 'running' | 'done' | 'error';

const DEFAULT_EVENT: MarketEvent = { type: 'DEPEG', asset: 'USDC', deviation: 0.07 };

const AGENT_META: Record<AgentRole, { icon: typeof ShieldAlert; color: string; ring: string; label: string }> = {
  Oracle: { icon: Radio, color: 'text-sky-400', ring: 'ring-sky-500/30', label: 'Oracle Agent' },
  Risk: { icon: ShieldAlert, color: 'text-amber-400', ring: 'ring-amber-500/30', label: 'Risk Agent' },
  Analytics: { icon: LineChart, color: 'text-orange-400', ring: 'ring-orange-500/30', label: 'Analytics Agent' },
  Commander: { icon: Compass, color: 'text-blue-400', ring: 'ring-blue-500/30', label: 'Commander' },
  Compliance: { icon: ScrollText, color: 'text-teal-400', ring: 'ring-teal-500/30', label: 'Compliance Agent' },
  Liquidity: { icon: Droplets, color: 'text-cyan-400', ring: 'ring-cyan-500/30', label: 'Liquidity Agent' },
  Treasury: { icon: Coins, color: 'text-emerald-400', ring: 'ring-emerald-500/30', label: 'Treasury Agent' },
  Insurance: { icon: Umbrella, color: 'text-violet-300', ring: 'ring-violet-400/30', label: 'Insurance Agent' },
  Growth: { icon: Sprout, color: 'text-lime-400', ring: 'ring-lime-500/30', label: 'Growth Agent' },
  Community: { icon: Users, color: 'text-pink-400', ring: 'ring-pink-500/30', label: 'Community Agent' },
  Legal: { icon: Gavel, color: 'text-slate-300', ring: 'ring-slate-400/30', label: 'Legal Agent' },
  Governance: { icon: Landmark, color: 'text-violet-400', ring: 'ring-violet-500/30', label: 'Governance Agent' },
};

/** 'risk' → 'Risk' — payroll roles are lowercase, AGENT_META keys are not. */
const toAgentRole = (role: string): AgentRole =>
  (role.charAt(0).toUpperCase() + role.slice(1)) as AgentRole;

const sosc = (motes: string) =>
  (Number(motes) / 1e9).toLocaleString('en-US', { maximumFractionDigits: 2 });

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
  /** Agents the Commander hired this run (payroll roster, in hire order). */
  const [roster, setRoster] = useState<string[]>([]);
  /** x402 payroll fees, appended live as each one settles on-chain. */
  const [payments, setPayments] = useState<A2aPayment[]>([]);
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
    setRoster([]);
    setPayments([]);
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
            | { type: 'payment'; payment: A2aPayment }
            | { type: 'result'; result: PipelineResult }
            | { type: 'error'; message: string };
          if (msg.type === 'step') {
            setSteps((prev) => [...prev, msg.step]);
            const hired = msg.step.detail?.payrollRoster as string[] | undefined;
            if (hired) setRoster(hired);
          } else if (msg.type === 'payment') setPayments((prev) => [...prev, msg.payment]);
          else if (msg.type === 'result') {
            setResult(msg.result);
            if (msg.result.a2a) setPayments(msg.result.a2a.payments);
          } else if (msg.type === 'error') {
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
              Risk scores it, Commander routes and hires the specialists — paying each one a real{' '}
              <span className="font-mono text-foreground">SOSC</span> fee over{' '}
              <span className="font-mono text-foreground">x402</span> — Treasury buys premium data and
              acts, Governance drafts an emergency proposal — all anchored on Casper.
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

      {/* Agent-to-agent x402 payroll — streams live as each fee settles */}
      <AnimatePresence>
        {(roster.length > 0 || payments.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Panel
              title="Agent economy — x402 payroll"
              icon={HandCoins}
              tone="52, 211, 153"
              right={
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {payments.filter((p) => p.status === 'settled').length}/{roster.length || payments.length} settled
                </span>
              }
              bodyClassName="flex flex-col gap-3 p-5"
            >
              <p className="text-sm text-muted-foreground">
                The Commander hires the team and pays each specialist a real{' '}
                <span className="font-mono text-foreground">SOSC</span> service fee to its own Casper
                wallet — EIP-712 CEP-18 transfers verified &amp; settled on-chain by the official{' '}
                <span className="font-medium">Casper x402 facilitator</span>, gas sponsored.
              </p>
              <ul className="flex flex-col divide-y divide-border/60">
                {(roster.length > 0 ? roster : payments.map((p) => p.role)).map((role) => {
                  const meta = AGENT_META[toAgentRole(role)];
                  const Icon = meta?.icon ?? HandCoins;
                  const payment = payments.find((p) => p.role === role);
                  return (
                    <li key={role} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <span className="flex items-center gap-2.5">
                        <span className={cn('flex h-6 w-6 items-center justify-center rounded-full bg-card ring-1', meta?.ring)}>
                          <Icon className={cn('h-3.5 w-3.5', meta?.color)} />
                        </span>
                        <span className="text-sm font-medium">{meta?.label ?? role}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        {payment && (
                          <span className="font-mono text-xs tabular-nums text-foreground">
                            {sosc(payment.amountMotes)} SOSC
                          </span>
                        )}
                        {!payment ? (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" /> settling…
                          </span>
                        ) : payment.status === 'settled' ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            {payment.explorerUrl && payment.txHash && (
                              <TxLink url={payment.explorerUrl} hash={payment.txHash} />
                            )}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-red-400" title={payment.error}>
                            <XCircle className="h-3.5 w-3.5" /> failed
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {result?.a2a && (
                <div className="border-t border-border pt-2.5 text-xs text-muted-foreground">
                  {result.a2a.settledCount} on-chain payments · {sosc(result.a2a.totalMotes)} SOSC paid out ·
                  every agent wallet independently verifiable on Casper testnet
                </div>
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
        Live agents (Risk · Commander · Treasury · Governance) + agent-to-agent x402 economy + on-chain records. No mock data.
      </footer>
    </main>
  );
}

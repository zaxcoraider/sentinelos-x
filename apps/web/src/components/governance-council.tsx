'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Coins,
  Landmark,
  Compass,
  Scale,
  Gavel,
  Loader2,
  Users,
  ArrowUpRight,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { TraceStep } from '@sentinelos/agents';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { recordAction } from '@/app/governance-actions';
import { useCrisisStream } from '@/hooks/use-crisis-stream';
import { cn, shortHash } from '@/lib/utils';

interface Seat {
  name: string;
  role: string;
  icon: LucideIcon;
  color: string;
  text: string;
}
const COMPLIANCE: Seat = { name: 'Compliance', role: 'Regulatory review', icon: Scale, color: '#6B7280', text: 'text-muted-foreground' };
const LEGAL: Seat = { name: 'Legal', role: 'Entity & contracts', icon: Gavel, color: '#6B7280', text: 'text-muted-foreground' };

function decisionFrom(steps: TraceStep[]) {
  const d = steps
    .map((s) => s.detail)
    .find((x) => x && typeof x.action === 'string' && typeof x.confidence === 'number') as
    | { action: string; confidence: number; expectedSavingsUsd: number; reasoning: string }
    | undefined;
  return d ?? null;
}

function Bubble({
  seat,
  children,
  index,
}: {
  seat: Seat;
  children: React.ReactNode;
  index: number;
}) {
  const Icon = seat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.2) }}
      className="flex gap-3"
    >
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1"
        style={{ backgroundColor: '#0e1420', borderColor: seat.color }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color: seat.color }} />
      </div>
      <div className="flex-1 rounded-xl rounded-tl-sm border border-border bg-card-elevated/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: seat.color }}>
            {seat.name}
          </span>
          <span className="text-[11px] text-muted-foreground">· {seat.role}</span>
        </div>
        <div className="mt-1 text-sm leading-relaxed text-foreground/90">{children}</div>
      </div>
    </motion.div>
  );
}

interface TxInfo {
  txHash: string;
  explorerUrl: string;
}

export function GovernanceCouncil() {
  const { phase, steps, result, error, running, trigger, seenAgents } = useCrisisStream();
  const [submitTx, setSubmitTx] = useState<TxInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const risk = steps.find((s) => s.agent === 'Risk');
  const riskSeverity = risk?.detail?.severity as number | undefined;
  const riskRationale = risk?.detail?.rationale as string | undefined;
  const decision = result?.decision ?? decisionFrom(steps);
  const gov = result?.governance ?? null;

  const convene = useCallback(() => {
    setSubmitTx(null);
    void trigger({ dry: true });
  }, [trigger]);

  const submit = useCallback(async () => {
    if (!gov) return;
    setSubmitting(true);
    try {
      const tx = await recordAction('governance', 'PROPOSAL', Math.round(result?.severity ?? riskSeverity ?? 80));
      setSubmitTx(tx);
    } catch {
      /* stays on submit */
    } finally {
      setSubmitting(false);
    }
  }, [gov, result, riskSeverity]);

  const idle = phase === 'idle';

  return (
    <div className="flex flex-col gap-6">
      {/* Council bench */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ai/10 text-ai ring-1 ring-ai/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">AI Governance Council</div>
              <div className="text-xs text-muted-foreground">
                Live agents debate the response and reach consensus — real reasoning, on-chain motion.
              </div>
            </div>
          </div>
          <Button onClick={convene} disabled={running} className="bg-ai text-white hover:bg-ai/90">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            {running ? 'Council deliberating…' : phase === 'done' ? 'Convene again' : 'Convene the council'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {idle ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          The council is seated. Convene it to open a debate on the live incident.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Risk raises the alarm */}
          {risk && (
            <Bubble
              seat={{ name: 'Risk Agent', role: 'raises the alarm', icon: ShieldAlert, color: '#F59E0B', text: 'text-warning' }}
              index={0}
            >
              <span className="font-medium text-warning">Severity {riskSeverity ?? '—'}/100.</span>{' '}
              {riskRationale ?? 'Assessing the event…'} I move that we act.
            </Bubble>
          )}

          {/* Treasury proposes the fix */}
          {decision && (
            <Bubble
              seat={{ name: 'Treasury Agent', role: 'proposes the fix', icon: Coins, color: '#22C55E', text: 'text-success' }}
              index={1}
            >
              I recommend <span className="font-semibold text-success">{decision.action}</span> —{' '}
              {decision.reasoning}{' '}
              <span className="text-muted-foreground">
                (confidence {decision.confidence}%, ~${Math.round(decision.expectedSavingsUsd).toLocaleString()} protected)
              </span>
              .
            </Bubble>
          )}

          {/* Compliance / Legal — roadmap seats */}
          {(decision || gov) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[COMPLIANCE, LEGAL].map((seat) => (
                <div key={seat.name} className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 opacity-60">
                  <seat.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">{seat.name}</span>
                    <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground">
                      seat · v1
                    </span>
                    <div className="text-xs text-muted-foreground/70">{seat.role} — joins the council in v1</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Governance drafts the motion */}
          {gov && (
            <Bubble
              seat={{ name: 'Governance Agent', role: 'drafts the motion', icon: Landmark, color: '#8B5CF6', text: 'text-ai' }}
              index={2}
            >
              I put forward a motion: <span className="font-semibold text-ai">{gov.title}</span>. {gov.summary}
            </Bubble>
          )}

          {/* Commander consensus */}
          <AnimatePresence>
            {gov && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-primary">
                      <Compass className="h-4 w-4" />
                      <span className="text-sm font-semibold">Commander · consensus reached</span>
                    </div>
                    <div className="mt-2 text-base font-semibold">{gov.action}</div>
                    {gov.parameterChanges.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground/90">
                        {gov.parameterChanges.map((c, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary">›</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>Quorum <span className="text-foreground">{gov.quorumPercent}%</span></span>
                      <span>Voting window <span className="text-foreground">{gov.votingWindowHours}h</span></span>
                    </div>

                    <div className="mt-4">
                      {submitTx ? (
                        <a
                          href={submitTx.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs font-medium text-success hover:bg-success/15"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Motion submitted on-chain · {shortHash(submitTx.txHash)}
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      ) : (
                        <Button onClick={submit} disabled={submitting} className="bg-primary text-white hover:bg-primary/90">
                          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                          {submitting ? 'Submitting…' : 'Submit motion on-chain'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {running && !gov && (
            <div className="flex items-center gap-2 pl-12 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {seenAgents.has('Treasury') ? 'Governance drafting the motion…' : 'Council deliberating…'}
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Every argument above is a real agent output from the live pipeline; Compliance and Legal seats join in
        v1. Submitting the motion writes a real <code className="font-mono">record_action</code> to TreasuryGuard.
      </p>
    </div>
  );
}

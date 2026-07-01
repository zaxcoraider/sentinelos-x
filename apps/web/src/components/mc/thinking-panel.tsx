'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Loader2, Check, ArrowUpRight, ShieldCheck } from 'lucide-react';
import type { TraceStep, PipelineResult, AgentRole } from '@sentinelos/agents';
import { Button } from '@/components/ui/button';
import { AGENT_META } from './agent-meta';
import { cn, shortHash } from '@/lib/utils';

interface TxInfo {
  txHash: string;
  explorerUrl: string;
}

export function ThinkingPanel({
  steps,
  result,
  running,
  activeAgent,
  onApprove,
  approving,
  approvedTx,
}: {
  steps: TraceStep[];
  result: PipelineResult | null;
  running: boolean;
  activeAgent: AgentRole | null;
  onApprove: () => void;
  approving: boolean;
  approvedTx: TxInfo | null;
}) {
  const decision = result?.decision ?? null;
  const gov = result?.governance ?? null;
  const activeMeta = activeAgent ? AGENT_META[activeAgent] : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Cpu className="h-3.5 w-3.5 text-ai" />
        AI reasoning
        {running && activeMeta && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px]" style={{ color: activeMeta.color }}>
            <Loader2 className="h-3 w-3 animate-spin" />
            {activeMeta.label} thinking…
          </span>
        )}
      </div>

      <div className="mc-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {steps.length === 0 && !running && (
          <div className="flex h-full min-h-[120px] items-center justify-center text-center text-xs text-muted-foreground">
            The agents&apos; reasoning appears here as they work.
          </div>
        )}

        {/* reasoning checklist */}
        {steps.length > 0 && (
          <ul className="space-y-2">
            {steps.map((s, i) => {
              const meta = AGENT_META[s.agent];
              const last = i === steps.length - 1;
              return (
                <li key={`${s.agent}-${i}`} className="flex items-start gap-2 text-xs">
                  {running && last ? (
                    <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: meta.color }} />
                  ) : (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: meta.color }} />
                  )}
                  <span className="text-foreground/80">{s.summary}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Treasury recommendation — human in the loop */}
        <AnimatePresence>
          {decision && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-success/30 bg-success/5 p-4"
            >
              <div className="text-[10px] font-medium uppercase tracking-wider text-success">Treasury recommendation</div>
              <div className="mt-1 text-lg font-semibold">{decision.action}</div>
              <p className="mt-1 text-xs text-muted-foreground">{decision.reasoning}</p>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Protected</div>
                  <div className="font-mono text-sm font-semibold text-success">
                    ~${Math.round(decision.expectedSavingsUsd).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Confidence</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-success" style={{ width: `${decision.confidence}%` }} />
                    </div>
                    <span className="font-mono text-xs">{decision.confidence}%</span>
                  </div>
                </div>
              </div>

              {approvedTx ? (
                <a
                  href={approvedTx.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs font-medium text-success hover:bg-success/15"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Approved · recorded {shortHash(approvedTx.txHash)}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    onClick={onApprove}
                    disabled={approving}
                    className="flex-1 bg-success text-background hover:bg-success/90"
                  >
                    {approving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {approving ? 'Recording…' : 'Approve'}
                  </Button>
                  <Button variant="outline" disabled={approving} className="flex-1">
                    Reject
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Governance consensus */}
        <AnimatePresence>
          {gov && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-ai/30 bg-ai/5 p-4"
            >
              <div className="text-[10px] font-medium uppercase tracking-wider text-ai">Governance consensus</div>
              <div className="mt-1 text-sm font-semibold">{gov.title}</div>
              <div className={cn('mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground')}>
                <span>
                  Action <span className="font-mono text-foreground">{gov.action}</span>
                </span>
                <span>
                  Quorum <span className="text-foreground">{gov.quorumPercent}%</span>
                </span>
                <span>
                  Window <span className="text-foreground">{gov.votingWindowHours}h</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

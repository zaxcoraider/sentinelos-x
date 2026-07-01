'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, ArrowUpRight, Check, X, Coins } from 'lucide-react';
import type { PipelineResult } from '@sentinelos/agents';
import { Button } from '@/components/ui/button';
import { Donut, MeterBar } from './primitives';
import { shortHash } from '@/lib/utils';

interface TxInfo {
  txHash: string;
  explorerUrl: string;
}

export function TreasuryRecommendation({
  result,
  onApprove,
  approving,
  approvedTx,
}: {
  result: PipelineResult | null;
  onApprove: () => void;
  approving: boolean;
  approvedTx: TxInfo | null;
}) {
  const decision = result?.decision ?? null;
  const gov = result?.governance ?? null;

  if (!decision) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
          <Coins className="h-5 w-5" />
        </span>
        <div className="text-sm font-medium text-foreground/80">No active recommendation</div>
        <p className="max-w-xs text-xs text-muted-foreground">
          Trigger an incident — the Treasury Agent drafts a protective action here for you to approve on-chain.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-success">Recommendation</div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-lg font-semibold leading-snug"
        >
          {decision.action}
        </motion.div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{decision.reasoning}</p>

        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] text-muted-foreground">Value Protected</div>
            <div className="font-mono text-lg font-semibold text-success">
              ~${Math.round(decision.expectedSavingsUsd).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Confidence</div>
            <div className="mt-1.5 flex items-center gap-2">
              <MeterBar value={decision.confidence} tone="34, 197, 94" />
              <span className="font-mono text-xs text-success">{decision.confidence}%</span>
            </div>
          </div>
        </div>

        {gov && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-ai/25 bg-ai/5 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-ai">Governance</span>
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
        )}

        {approvedTx ? (
          <a
            href={approvedTx.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs font-medium text-success hover:bg-success/15"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Approved · recorded {shortHash(approvedTx.txHash)}
            <ArrowUpRight className="h-3 w-3" />
          </a>
        ) : (
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={onApprove} disabled={approving} className="flex-1 bg-success text-background hover:bg-success/90">
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {approving ? 'Recording…' : 'Approve'}
            </Button>
            <Button variant="outline" disabled={approving} className="flex-1 hover:border-danger/40 hover:text-danger">
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-center">
        <Donut value={decision.confidence} tone="34, 197, 94" label={`${decision.confidence}%`} sub="confidence" />
      </div>
    </div>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, Inbox } from 'lucide-react';
import type { TraceStep } from '@sentinelos/agents';
import { shortHash } from '@/lib/utils';

interface TxInfo {
  txHash: string;
  explorerUrl: string;
}

interface Row {
  label: string;
  sub: string;
  txHash: string;
  explorerUrl: string;
  at?: string;
}

function clock(at?: string) {
  const d = at ? new Date(at) : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** Real on-chain writes surfaced this session: agent txs + the approved action. */
export function TransactionFeed({ steps, approvedTx }: { steps: TraceStep[]; approvedTx: TxInfo | null }) {
  const rows: Row[] = [];
  for (const s of steps) {
    const txHash = s.detail?.txHash as string | undefined;
    const explorerUrl = s.detail?.explorerUrl as string | undefined;
    if (txHash && explorerUrl) {
      rows.push({ label: `${s.agent} write`, sub: s.summary.slice(0, 42), txHash, explorerUrl, at: s.at });
    }
  }
  if (approvedTx) {
    rows.push({ label: 'Treasury action', sub: 'Approved · record_action', ...approvedTx });
  }
  rows.reverse();

  return (
    <div className="flex h-full flex-col">
      <div className="mc-scroll flex-1 overflow-y-auto px-2 py-2">
        {rows.length === 0 ? (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <Inbox className="h-5 w-5 opacity-50" />
            No on-chain writes yet — trigger an incident and approve.
          </div>
        ) : (
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {rows.map((r, i) => (
                <motion.li
                  key={`${r.txHash}-${i}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-foreground/5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-foreground/90">{r.label}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{r.sub}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-[10px] text-muted-foreground">{clock(r.at)}</span>
                    <a
                      href={r.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 font-mono text-[10px] text-primary hover:underline"
                    >
                      {shortHash(r.txHash, 6, 4)}
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

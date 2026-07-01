'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowUpRight, Radio } from 'lucide-react';
import type { TraceStep } from '@sentinelos/agents';
import { AGENT_META } from './agent-meta';
import { cn, shortHash } from '@/lib/utils';

function clock(at: string) {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function EventTimeline({ steps, running }: { steps: TraceStep[]; running: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Radio className="h-3.5 w-3.5 text-success" />
        Live event timeline
      </div>
      <div className="mc-scroll flex-1 overflow-y-auto px-4 py-4">
        {steps.length === 0 && !running && (
          <div className="flex h-full min-h-[120px] items-center justify-center text-center text-xs text-muted-foreground">
            Idle — trigger an incident to watch the agents respond.
          </div>
        )}
        <ol className="relative flex flex-col gap-3 border-l border-border/70 pl-5">
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
                    className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                    <span className="text-sm font-semibold" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">{clock(step.at)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/85">{step.summary}</p>
                  {txHash && explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                    >
                      {shortHash(txHash)}
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
          {running && (
            <li className="relative flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className={cn('absolute -left-[26px] top-0.5 flex h-3 w-3 items-center justify-center')}>
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              </span>
              agents working…
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import type { TraceStep, PipelineResult, AgentRole } from '@sentinelos/agents';
import { AGENT_META } from './agent-meta';
import { MeterBar } from './primitives';

const STANDBY_CHECKS = [
  'Agents online',
  'Casper Testnet connected',
  'TreasuryGuard contract live',
  'Market feed streaming',
];

export function ThinkingPanel({
  steps,
  result,
  running,
  activeAgent,
}: {
  steps: TraceStep[];
  result: PipelineResult | null;
  running: boolean;
  activeAgent: AgentRole | null;
}) {
  const activeMeta = activeAgent ? AGENT_META[activeAgent] : null;
  const confidence = result?.decision?.confidence ?? null;
  const idle = steps.length === 0 && !running;

  return (
    <div className="flex h-full flex-col">
      {/* active-agent banner */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai/15 text-ai">
          <motion.span
            animate={running ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            {activeMeta ? <activeMeta.icon className="h-4 w-4" style={{ color: activeMeta.color }} /> : null}
            {!activeMeta && <Check className="h-4 w-4" />}
          </motion.span>
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold" style={activeMeta ? { color: activeMeta.color } : undefined}>
            {activeMeta ? activeMeta.label : 'Commander'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {running ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
              </>
            ) : idle ? (
              'Standby'
            ) : (
              'Reasoning complete'
            )}
          </div>
        </div>
      </div>

      <div className="mc-scroll flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {idle
          ? STANDBY_CHECKS.map((c, i) => (
              <motion.div
                key={c}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 text-xs"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                <span className="text-foreground/70">{c}</span>
                <span className="ml-auto font-mono text-[11px] text-success">OK</span>
              </motion.div>
            ))
          : steps.map((s, i) => {
              const meta = AGENT_META[s.agent];
              const last = i === steps.length - 1;
              return (
                <motion.div
                  key={`${s.agent}-${i}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 text-xs"
                >
                  {running && last ? (
                    <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: meta.color }} />
                  ) : (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: meta.color }} />
                  )}
                  <span className="text-foreground/80">{s.summary}</span>
                </motion.div>
              );
            })}
      </div>

      {/* overall confidence */}
      <AnimatePresence>
        {confidence !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden border-t border-border px-4 py-3"
          >
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overall Confidence</span>
              <span className="font-mono font-semibold text-ai">{confidence}%</span>
            </div>
            <MeterBar value={confidence} tone="167, 139, 250" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

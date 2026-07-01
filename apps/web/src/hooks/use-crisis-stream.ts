'use client';

import { useCallback, useRef, useState } from 'react';
import type { MarketEvent, TraceStep, PipelineResult, AgentRole } from '@sentinelos/agents';

export type StreamPhase = 'idle' | 'running' | 'done' | 'error';

export const DEFAULT_EVENT: MarketEvent = { type: 'DEPEG', asset: 'USDC', deviation: 0.07 };

export interface CrisisStream {
  phase: StreamPhase;
  steps: TraceStep[];
  result: PipelineResult | null;
  error: string | null;
  /** The agent whose step is currently landing (drives the live graph glow). */
  activeAgent: AgentRole | null;
  /** Distinct agents that have produced at least one step this run. */
  seenAgents: Set<AgentRole>;
  running: boolean;
  trigger: (opts?: { dry?: boolean; event?: MarketEvent }) => Promise<void>;
}

/**
 * Streams the real sentinel pipeline from /api/crisis as newline-delimited JSON,
 * exposing the live phase, trace steps, final result, and the currently active
 * agent — the single source of truth for every Mission Control panel. No mock
 * data: every step and tx here is produced by the real agents on Casper.
 */
export function useCrisisStream(): CrisisStream {
  const [phase, setPhase] = useState<StreamPhase>('idle');
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trigger = useCallback<CrisisStream['trigger']>(async (opts = {}) => {
    const { dry = false, event = DEFAULT_EVENT } = opts;
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
        body: JSON.stringify({ event, live: !dry }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error('No response stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
  }, []);

  const running = phase === 'running';
  const activeAgent: AgentRole | null = running && steps.length ? steps[steps.length - 1].agent : null;
  const seenAgents = new Set<AgentRole>(steps.map((s) => s.agent));

  return { phase, steps, result, error, activeAgent, seenAgents, running, trigger };
}

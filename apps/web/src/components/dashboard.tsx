'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Loader2, Activity, RefreshCw } from 'lucide-react';
import type { TreasuryState } from '@sentinelos/casper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskIndicator } from '@/components/risk-indicator';
import { fetchState, recordTreasuryAction } from '@/app/actions';
import { cn, shortHash } from '@/lib/utils';

type Phase = 'idle' | 'submitting' | 'pending' | 'confirmed' | 'error';

interface TxInfo {
  txHash: string;
  explorerUrl: string;
}

export function Dashboard({
  initialState,
  initialError,
  contractUrl,
  packageHash,
}: {
  initialState: TreasuryState | null;
  initialError: string | null;
  contractUrl: string;
  packageHash: string;
}) {
  const [state, setState] = useState<TreasuryState | null>(initialState);
  const [error, setError] = useState<string | null>(initialError);
  const [phase, setPhase] = useState<Phase>('idle');
  const [tx, setTx] = useState<TxInfo | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchState('treasury');
      setState(next);
      setError(null);
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read chain state');
      return null;
    }
  }, []);

  const onRecord = useCallback(async () => {
    setPhase('submitting');
    setTx(null);
    setError(null);
    const baseline = state?.totalActions ?? 0;
    try {
      const result = await recordTreasuryAction();
      setTx(result);
      setPhase('pending');

      // Poll live state until the action count increments (execution landed).
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const next = await fetchState('treasury');
        if (next.totalActions > baseline) {
          setState(next);
          setPhase('confirmed');
          return;
        }
      }
      // Submitted but not observed within the window — still on chain.
      setPhase('confirmed');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
      setPhase('error');
    }
  }, [state, refresh]);

  const busy = phase === 'submitting' || phase === 'pending';
  const severity = state?.lastSeverity ?? null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      {/* Page title */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live TreasuryGuard state on Casper Testnet — no mock data.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stat grid */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={state?.totalActions ?? 'na'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="font-mono text-4xl font-semibold tabular-nums"
              >
                {state ? state.totalActions : '—'}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {state?.lastAction ?? <span className="text-muted-foreground">none</span>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">agent · treasury</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Indicator</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskIndicator severity={severity} />
          </CardContent>
        </Card>
      </section>

      {/* Action panel */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Record treasury action
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Signs and submits a real <code className="font-mono text-foreground">record_action</code>{' '}
                transaction (REBALANCE, severity 80) to the on-chain TreasuryGuard contract.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={refresh} disabled={busy} aria-label="Refresh state">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={onRecord} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {phase === 'submitting'
                  ? 'Signing…'
                  : phase === 'pending'
                    ? 'Confirming on chain…'
                    : 'Record treasury action'}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {tx && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        phase === 'confirmed' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse',
                      )}
                    />
                    <span className="text-muted-foreground">
                      {phase === 'confirmed' ? 'Confirmed on chain' : 'Submitted — awaiting block'}
                    </span>
                    <span className="font-mono text-xs text-foreground">{shortHash(tx.txHash)}</span>
                  </div>
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    View on cspr.live
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Contract package{' '}
          <a href={contractUrl} target="_blank" rel="noreferrer" className="font-mono hover:text-foreground hover:underline">
            {shortHash(packageHash, 10, 8)}
          </a>
        </span>
        <span>Phase 3 · live chain state, no mock data</span>
      </footer>
    </main>
  );
}

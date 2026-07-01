'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Coins, Landmark, ArrowUpRight, Radar, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface AgentState {
  agent: string;
  lastAction: string | null;
  lastSeverity: number | null;
}

const AGENT_META: Record<string, { label: string; icon: LucideIcon; color: string; ring: string }> = {
  treasury: { label: 'Treasury Agent', icon: Coins, color: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  governance: { label: 'Governance Agent', icon: Landmark, color: 'text-violet-400', ring: 'ring-violet-500/30' },
};

function threatLevel(severity: number | null): { label: string; tone: string; ring: string; dot: string } {
  if (severity === null) return { label: 'No signal', tone: 'text-muted-foreground', ring: 'ring-border', dot: 'bg-muted-foreground' };
  if (severity >= 60) return { label: 'Elevated', tone: 'text-red-400', ring: 'ring-red-500/30', dot: 'bg-red-500' };
  if (severity >= 30) return { label: 'Guarded', tone: 'text-amber-400', ring: 'ring-amber-500/30', dot: 'bg-amber-400' };
  return { label: 'Nominal', tone: 'text-emerald-400', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' };
}

export function SecurityCenter({
  agents,
  totalActions,
  contractUrl,
}: {
  agents: AgentState[];
  totalActions: number | null;
  contractUrl: string;
}) {
  const peak = agents.reduce<number | null>(
    (max, a) => (a.lastSeverity !== null ? Math.max(max ?? 0, a.lastSeverity) : max),
    null,
  );
  const threat = threatLevel(peak);

  return (
    <div className="flex flex-col gap-6">
      {/* Threat radar */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <div className={cn('relative flex h-16 w-16 items-center justify-center rounded-full ring-1', threat.ring)}>
              {peak !== null && peak >= 60 && (
                <motion.span
                  className={cn('absolute inline-flex h-full w-full rounded-full opacity-40', threat.dot)}
                  animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <Radar className={cn('h-7 w-7', threat.tone)} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Threat level</div>
              <div className={cn('text-2xl font-semibold', threat.tone)}>{threat.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                peak severity {peak ?? '—'}/100 · {totalActions ?? '—'} responses on-chain
              </div>
            </div>
          </div>
          <a
            href={contractUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Full event log on cspr.live
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>

      {/* Per-agent latest recorded action */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5" />
          Latest recorded response · per agent
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {agents.map((a) => {
            const meta = AGENT_META[a.agent] ?? {
              label: a.agent,
              icon: ShieldAlert,
              color: 'text-muted-foreground',
              ring: 'ring-border',
            };
            const Icon = meta.icon;
            const t = threatLevel(a.lastSeverity);
            return (
              <Card key={a.agent}>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-card ring-1', meta.ring)}>
                        <Icon className={cn('h-4.5 w-4.5', meta.color)} />
                      </div>
                      <span className="text-sm font-semibold">{meta.label}</span>
                    </div>
                    <span className={cn('inline-flex items-center gap-1.5 text-xs', t.tone)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} />
                      {t.label}
                    </span>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Last action</div>
                    <div className="mt-0.5 font-mono text-sm">
                      {a.lastAction ?? <span className="text-muted-foreground">none recorded</span>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      severity {a.lastSeverity ?? '—'}/100
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Threat state is derived from the on-chain TreasuryGuard contract (last recorded action + severity per
        agent). Full per-event history — including every <code className="font-mono">ActionRecorded</code> event —
        is verifiable on cspr.live. No mock data.
      </p>
    </div>
  );
}

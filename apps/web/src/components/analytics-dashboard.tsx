'use client';

import { Activity, BarChart3, Coins, Users, CheckCircle2, ArrowUpRight, Wallet } from 'lucide-react';
import type { OnChainAction } from '@sentinelos/casper';
import { Panel, PanelCard } from '@/components/mc/panel';
import { AGENT_META } from '@/components/mc/agent-meta';
import { cn } from '@/lib/utils';

/* Aggregates computed over the REAL indexed record_action history from
 * CSPR.cloud — the same feed the Security Center lists row-by-row. */

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  index,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Activity;
  tone: string;
  index: number;
}) {
  return (
    <PanelCard index={index} hover={false}>
      <div className="flex flex-col gap-1.5 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4" style={{ color: `rgb(${tone})` }} />
        </div>
        <div className="text-3xl font-semibold tracking-tight" style={{ color: `rgb(${tone})` }}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </PanelCard>
  );
}

/** Roll the indexed feed up per agent (capitalized keys match AGENT_META). */
function byAgent(recent: OnChainAction[]): { agent: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of recent) {
    const key = a.agent.charAt(0).toUpperCase() + a.agent.slice(1).toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([agent, count]) => ({ agent, count })).sort((a, b) => b.count - a.count);
}

function byAction(recent: OnChainAction[]): { action: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of recent) counts.set(a.action, (counts.get(a.action) ?? 0) + 1);
  return [...counts.entries()].map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count);
}

export function AnalyticsDashboard({
  totalActions,
  recent,
}: {
  totalActions: number | null;
  recent: OnChainAction[];
}) {
  const agents = byAgent(recent);
  const actions = byAction(recent);
  const succeeded = recent.filter((a) => a.success).length;
  const successRate = recent.length ? Math.round((succeeded / recent.length) * 100) : null;
  const severities = recent.map((a) => a.severity).filter((s): s is number => s !== null);
  const avgSeverity = severities.length
    ? Math.round(severities.reduce((acc, s) => acc + s, 0) / severities.length)
    : null;
  const maxAgent = agents[0]?.count ?? 1;
  const maxAction = actions[0]?.count ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Headline numbers — live chain state + real economy config */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          index={0}
          label="On-chain actions"
          value={totalActions !== null ? String(totalActions) : '—'}
          sub="TreasuryGuard total_actions · live"
          icon={Activity}
          tone="96, 165, 250"
        />
        <StatTile
          index={1}
          label="Success rate"
          value={successRate !== null ? `${successRate}%` : '—'}
          sub={`across the last ${recent.length} indexed txs`}
          icon={CheckCircle2}
          tone="52, 211, 153"
        />
        <StatTile
          index={2}
          label="Avg severity"
          value={avgSeverity !== null ? `${avgSeverity}/100` : '—'}
          sub="of recorded incident responses"
          icon={BarChart3}
          tone="251, 191, 36"
        />
        <StatTile
          index={3}
          label="Payroll / incident"
          value="~8 SOSC"
          sub="11 agent wallets paid via x402"
          icon={Coins}
          tone="167, 139, 250"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Real per-agent activity from the indexed feed */}
        <Panel title="Actions by agent · indexed on-chain" icon={Users} tone="96, 165, 250">
          {agents.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No recorded actions indexed yet (or CSPR.cloud key not configured).
            </div>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {agents.map(({ agent, count }) => {
                const meta = AGENT_META[agent as keyof typeof AGENT_META];
                return (
                  <li key={agent} className="flex items-center gap-3 text-sm">
                    <span className={cn('w-24 shrink-0 font-medium', meta?.text ?? 'text-foreground')}>{agent}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / maxAgent) * 100}%`,
                          background: meta?.color ?? 'rgb(148, 163, 184)',
                          boxShadow: `0 0 10px -2px ${meta?.color ?? 'transparent'}`,
                        }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">{count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Real action-type breakdown */}
        <Panel title="Action types · indexed on-chain" icon={BarChart3} tone="251, 191, 36">
          {actions.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No recorded actions indexed yet (or CSPR.cloud key not configured).
            </div>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {actions.map(({ action, count }) => (
                <li key={action} className="flex items-center gap-3 text-sm">
                  <span className="w-40 shrink-0 truncate font-mono text-xs text-foreground/90">{action}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-amber-400/80"
                      style={{ width: `${(count / maxAction) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* The economics of one incident — the real price sheet */}
      <Panel title="Incident economics · live price sheet" icon={Wallet} tone="167, 139, 250">
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <div className="text-2xl font-semibold text-foreground">24 txs</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              per full incident — 12 agent records + 11 payroll payments + 1 x402 data settlement
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-foreground">1 / 0.5 SOSC</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              specialist / advisory fee, paid by the Commander to each agent&apos;s own wallet
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-foreground">0 CSPR</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              gas paid by agent wallets — the official Casper facilitator sponsors settlement gas
            </div>
          </div>
        </div>
      </Panel>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Aggregates are computed from the real <code className="font-mono">record_action</code> history indexed by
        CSPR.cloud and live TreasuryGuard state — the same rows listed in the
        <a href="/security" className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline">
          Security Center <ArrowUpRight className="h-3 w-3" />
        </a>
        . No mock data.
      </p>
    </div>
  );
}

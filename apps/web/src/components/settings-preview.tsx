'use client';

import { useState } from 'react';
import {
  SlidersHorizontal,
  UserCheck,
  Anchor,
  Coins,
  Network,
  Bell,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Panel, PanelCard } from '@/components/mc/panel';
import { cn } from '@/lib/utils';

/* Settings is a v1 preview: the values shown as LIVE are the real, current
 * runtime configuration (read-only here); the autonomy dial and preferences
 * are the controls that ship in v1. Nothing pretends to be enforceable yet. */

function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Live
    </span>
  );
}

function V1Pill() {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
      Coming in v1
    </span>
  );
}

function Row({
  label,
  desc,
  right,
}: {
  label: string;
  desc: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

export function SettingsPreview({ contractUrl }: { contractUrl: string }) {
  const [threshold, setThreshold] = useState(40);

  return (
    <div className="flex flex-col gap-6">
      {/* The autonomy dial — the headline v1 control */}
      <Panel
        title="Autonomy policy"
        icon={SlidersHorizontal}
        tone="96, 165, 250"
        right={<V1Pill />}
      >
        <div className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">Auto-execution threshold</div>
              <div className="text-xs text-muted-foreground">
                In v1, incidents scoring <span className="font-mono text-foreground">below {threshold}</span> auto-execute;
                anything at or above waits for a human — the dial between advisor and operator.
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold text-primary">{threshold}</div>
          </div>
          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-[hsl(var(--primary))]"
              aria-label="Auto-execution severity threshold"
            />
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground/70">
              <span>0 · fully autonomous</span>
              <span>100 · every action human-gated</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Today, live:</span> every protocol action is
              human-approved — the Approve gate you see in Crisis Response. The dial is the v1 policy
              engine on top of that same gate.
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current, real runtime config — shown read-only */}
        <Panel title="On-chain anchoring" icon={Anchor} tone="52, 211, 153" right={<LivePill />}>
          <div className="divide-y divide-border">
            <Row
              label="Anchoring mode"
              desc="Which agents write their own record_action to TreasuryGuard"
              right={
                <span className="font-mono text-xs text-emerald-400">all — 12 of 12 agents</span>
              }
            />
            <Row
              label="Contract"
              desc="TreasuryGuard on Casper Testnet"
              right={
                <a
                  href={contractUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                >
                  view on cspr.live <ExternalLink className="h-3 w-3" />
                </a>
              }
            />
          </div>
        </Panel>

        <Panel title="Agent economy" icon={Coins} tone="167, 139, 250" right={<LivePill />}>
          <div className="divide-y divide-border">
            <Row
              label="a2a payroll"
              desc="Commander pays all 11 specialists per incident, via the official x402 facilitator"
              right={<span className="font-mono text-xs text-emerald-400">on · ~8 SOSC/incident</span>}
            />
            <Row
              label="Fee schedule"
              desc="Specialist / advisory service fee, settled in SOSC (CEP-18)"
              right={<span className="font-mono text-xs text-foreground/90">1 / 0.5 SOSC</span>}
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Network" icon={Network} tone="56, 189, 248" right={<LivePill />}>
          <div className="divide-y divide-border">
            <Row
              label="Chain"
              desc="All agent activity settles here"
              right={<span className="font-mono text-xs text-foreground/90">Casper Testnet</span>}
            />
            <Row
              label="x402 facilitator"
              desc="Verifies + settles agent payments, sponsors gas"
              right={<span className="font-mono text-xs text-foreground/90">x402-facilitator.cspr.cloud</span>}
            />
          </div>
        </Panel>

        <Panel title="Notifications" icon={Bell} tone="251, 191, 36" right={<V1Pill />}>
          <div className="divide-y divide-border">
            {[
              { label: 'Incident alerts', desc: 'Push a notification the moment Risk flags an incident' },
              { label: 'Approval requests', desc: 'Approve or reject treasury actions from your phone' },
            ].map((n) => (
              <Row
                key={n.label}
                label={n.label}
                desc={n.desc}
                right={
                  <span
                    className={cn(
                      'relative inline-flex h-5 w-9 cursor-not-allowed items-center rounded-full border border-border bg-muted/40',
                    )}
                    title="Coming in v1"
                  >
                    <span className="ml-0.5 h-4 w-4 rounded-full bg-muted-foreground/40" />
                  </span>
                }
              />
            ))}
          </div>
        </Panel>
      </div>

      <PanelCard hover={false} className="opacity-80">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Lock className="h-4 w-4" />
            Values marked <span className="font-medium text-emerald-400">Live</span> are the real, current
            runtime configuration. Controls marked <span className="font-medium text-foreground">Coming in v1</span>{' '}
            are previews — they don&apos;t change live behavior yet.
          </div>
          <div className="cursor-not-allowed rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground/60">
            Save changes — Coming in v1
          </div>
        </div>
      </PanelCard>
    </div>
  );
}

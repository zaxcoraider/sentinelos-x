'use client';

import { motion } from 'framer-motion';
import {
  Compass,
  ShieldAlert,
  Coins,
  Landmark,
  Radio,
  Scale,
  BarChart3,
  Umbrella,
  Sprout,
  Users,
  Gavel,
  Droplets,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AgentCard {
  name: string;
  role: string;
  blurb: string;
  icon: LucideIcon;
  color: string;
  ring: string;
  status: 'live' | 'roadmap';
}

const LIVE: AgentCard[] = [
  {
    name: 'Commander',
    role: 'Orchestrator · CEO',
    blurb: 'Routes work across the team and decides who acts. Deterministic threshold gate for auditable control flow.',
    icon: Compass,
    color: 'text-sky-400',
    ring: 'ring-sky-500/30',
    status: 'live',
  },
  {
    name: 'Risk',
    role: 'Threat scoring',
    blurb: 'Scores the severity (0–100) of each market event with a grounded rationale. Powered by Claude.',
    icon: ShieldAlert,
    color: 'text-amber-400',
    ring: 'ring-amber-500/30',
    status: 'live',
  },
  {
    name: 'Treasury',
    role: 'Protective action',
    blurb: 'Buys premium data over x402, decides the protective action, and writes it on-chain to TreasuryGuard.',
    icon: Coins,
    color: 'text-emerald-400',
    ring: 'ring-emerald-500/30',
    status: 'live',
  },
  {
    name: 'Governance',
    role: 'Emergency proposals',
    blurb: 'Drafts an emergency proposal ratifying the response and anchors it on-chain for the DAO to vote.',
    icon: Landmark,
    color: 'text-violet-400',
    ring: 'ring-violet-500/30',
    status: 'live',
  },
];

const ROADMAP: AgentCard[] = [
  { name: 'Oracle', role: 'Price / feed state', blurb: 'Maintains live price and feed state on-chain.', icon: Radio, color: 'text-muted-foreground', ring: 'ring-border', status: 'roadmap' },
  { name: 'Compliance', role: 'Policy & regulation', blurb: 'Runs policy and regulatory checks before actions execute.', icon: Scale, color: 'text-muted-foreground', ring: 'ring-border', status: 'roadmap' },
  { name: 'Analytics', role: 'Anomaly detection', blurb: 'Surfaces anomalies and protocol metrics from on-chain activity.', icon: BarChart3, color: 'text-muted-foreground', ring: 'ring-border', status: 'roadmap' },
  { name: 'Insurance', role: 'Coverage & payouts', blurb: 'Manages coverage and automates payout logic on incidents.', icon: Umbrella, color: 'text-muted-foreground', ring: 'ring-border', status: 'roadmap' },
  { name: 'Growth', role: 'Incentives', blurb: 'Optimizes ecosystem incentives and liquidity programs.', icon: Sprout, color: 'text-muted-foreground', ring: 'ring-border', status: 'roadmap' },
  { name: 'Community', role: 'Comms & sentiment', blurb: 'Tracks sentiment and coordinates protocol communications.', icon: Users, color: 'text-muted-foreground', ring: 'ring-border', status: 'roadmap' },
  { name: 'Legal', role: 'Contracts & entities', blurb: 'Handles legal structure and on-chain agreement logic.', icon: Gavel, color: 'text-muted-foreground', ring: 'ring-border', status: 'roadmap' },
  { name: 'Liquidity', role: 'Market depth', blurb: 'Manages liquidity provisioning and market depth across venues.', icon: Droplets, color: 'text-muted-foreground', ring: 'ring-border', status: 'roadmap' },
];

function AgentTile({ agent, index, actions }: { agent: AgentCard; index: number; actions?: number | null }) {
  const Icon = agent.icon;
  const live = agent.status === 'live';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className={cn('h-full', !live && 'opacity-60')}>
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-card ring-1', agent.ring)}>
              <Icon className={cn('h-5 w-5', agent.color)} />
            </div>
            {live ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            ) : (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Coming in v1
              </span>
            )}
          </div>
          <div>
            <div className="text-base font-semibold">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.role}</div>
          </div>
          <p className="text-sm text-muted-foreground/90">{agent.blurb}</p>
          <div className="mt-auto pt-2">
            {live ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Installed · acting on-chain
              </div>
            ) : (
              <div className="cursor-not-allowed rounded-md border border-border px-3 py-1.5 text-center text-xs text-muted-foreground/60">
                Install — Coming in v1
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AgentRoster({ totalActions }: { totalActions: number | null }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Live agents · acting on-chain
          </h2>
          <span className="text-xs text-muted-foreground">
            {totalActions !== null ? `${totalActions} on-chain actions` : '—'}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LIVE.map((a, i) => (
            <AgentTile key={a.name} agent={a} index={i} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Marketplace · installable in v1
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((a, i) => (
            <AgentTile key={a.name} agent={a} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

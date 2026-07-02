'use client';

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
  Bot,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { IconTile, PanelCard } from '@/components/mc/panel';
import { cn } from '@/lib/utils';

interface AgentCard {
  name: string;
  role: string;
  blurb: string;
  icon: LucideIcon;
  tone?: string; // rgb triple for live agents
  color: string; // text color for the name accent
  status: 'live' | 'roadmap';
}

const LIVE: AgentCard[] = [
  {
    name: 'Commander',
    role: 'Orchestrator · CEO',
    blurb: 'Routes work across the team and decides who acts. Deterministic threshold gate for auditable control flow.',
    icon: Compass,
    tone: '96, 165, 250',
    color: 'text-sky-400',
    status: 'live',
  },
  {
    name: 'Risk',
    role: 'Threat scoring',
    blurb: 'Scores the severity (0–100) of each market event with a grounded rationale. Powered by Claude.',
    icon: ShieldAlert,
    tone: '251, 191, 36',
    color: 'text-amber-400',
    status: 'live',
  },
  {
    name: 'Treasury',
    role: 'Protective action',
    blurb: 'Buys premium data over x402, decides the protective action, and writes it on-chain to TreasuryGuard.',
    icon: Coins,
    tone: '52, 211, 153',
    color: 'text-emerald-400',
    status: 'live',
  },
  {
    name: 'Governance',
    role: 'Emergency proposals',
    blurb: 'Drafts an emergency proposal ratifying the response and anchors it on-chain for the DAO to vote.',
    icon: Landmark,
    tone: '167, 139, 250',
    color: 'text-violet-400',
    status: 'live',
  },
];

const ROADMAP: AgentCard[] = [
  { name: 'Oracle', role: 'Price / feed state', blurb: 'Maintains live price and feed state on-chain.', icon: Radio, color: 'text-muted-foreground', status: 'roadmap' },
  { name: 'Compliance', role: 'Policy & regulation', blurb: 'Runs policy and regulatory checks before actions execute.', icon: Scale, color: 'text-muted-foreground', status: 'roadmap' },
  { name: 'Analytics', role: 'Anomaly detection', blurb: 'Surfaces anomalies and protocol metrics from on-chain activity.', icon: BarChart3, color: 'text-muted-foreground', status: 'roadmap' },
  { name: 'Insurance', role: 'Coverage & payouts', blurb: 'Manages coverage and automates payout logic on incidents.', icon: Umbrella, color: 'text-muted-foreground', status: 'roadmap' },
  { name: 'Growth', role: 'Incentives', blurb: 'Optimizes ecosystem incentives and liquidity programs.', icon: Sprout, color: 'text-muted-foreground', status: 'roadmap' },
  { name: 'Community', role: 'Comms & sentiment', blurb: 'Tracks sentiment and coordinates protocol communications.', icon: Users, color: 'text-muted-foreground', status: 'roadmap' },
  { name: 'Legal', role: 'Contracts & entities', blurb: 'Handles legal structure and on-chain agreement logic.', icon: Gavel, color: 'text-muted-foreground', status: 'roadmap' },
  { name: 'Liquidity', role: 'Market depth', blurb: 'Manages liquidity provisioning and market depth across venues.', icon: Droplets, color: 'text-muted-foreground', status: 'roadmap' },
];

function SectionHeader({ icon: Icon, title, right }: { icon: LucideIcon; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h2>
      {right}
    </div>
  );
}

function AgentTile({ agent, index }: { agent: AgentCard; index: number }) {
  const live = agent.status === 'live';
  return (
    <PanelCard index={index} className={cn('h-full', !live && 'opacity-60')}>
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <IconTile icon={agent.icon} tone={agent.tone} size="lg" muted={!live} />
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]" />
              Live
            </span>
          ) : (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Coming in v1
            </span>
          )}
        </div>
        <div>
          <div className={cn('text-base font-semibold', live && agent.color)}>{agent.name}</div>
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
      </div>
    </PanelCard>
  );
}

export function AgentRoster({ totalActions }: { totalActions: number | null }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <SectionHeader
          icon={Bot}
          title="Live agents · acting on-chain"
          right={
            <span className="text-xs text-muted-foreground">
              {totalActions !== null ? `${totalActions} on-chain actions` : '—'}
            </span>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LIVE.map((a, i) => (
            <AgentTile key={a.name} agent={a} index={i} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader icon={Store} title="Marketplace · installable in v1" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((a, i) => (
            <AgentTile key={a.name} agent={a} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

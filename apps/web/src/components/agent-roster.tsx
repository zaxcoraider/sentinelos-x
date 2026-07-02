'use client';

import {
  Radio,
  ShieldAlert,
  LineChart,
  Compass,
  ScrollText,
  Droplets,
  Coins,
  Umbrella,
  Sprout,
  Users,
  Gavel,
  Landmark,
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
  tone: string; // rgb triple
  color: string; // name accent
  /** true = takes a protocol action; false = real analysis, still anchored on-chain. */
  executes?: boolean;
}

// All twelve agents are live and anchor a real record_action on Casper. Treasury
// and Governance take protocol actions; the rest contribute real data/analysis.
const AGENTS: AgentCard[] = [
  { name: 'Commander', role: 'Orchestrator · CEO', blurb: 'Routes work across the team and decides who acts — a deterministic threshold gate for auditable control flow.', icon: Compass, tone: '96, 165, 250', color: 'text-blue-400' },
  { name: 'Oracle', role: 'Live data feed', blurb: 'Acquires the premium market feed over x402 and confirms the live peg + reference price on-chain.', icon: Radio, tone: '56, 189, 248', color: 'text-sky-400' },
  { name: 'Risk', role: 'Threat scoring', blurb: 'Scores event severity 0–100 with a grounded rationale. Powered by Claude.', icon: ShieldAlert, tone: '251, 191, 36', color: 'text-amber-400' },
  { name: 'Analytics', role: 'Anomaly metrics', blurb: 'Quantifies the anomaly — real annualized volatility, regime, and modeled depeg probability from the live feed.', icon: LineChart, tone: '249, 115, 22', color: 'text-orange-400' },
  { name: 'Compliance', role: 'Policy & regulation', blurb: 'Reviews the protective action against protocol policy and regulatory expectations before it stands.', icon: ScrollText, tone: '45, 212, 191', color: 'text-teal-400' },
  { name: 'Liquidity', role: 'Market depth', blurb: 'Assesses whether the action executes without excessive slippage given current depth.', icon: Droplets, tone: '34, 211, 238', color: 'text-cyan-400' },
  { name: 'Treasury', role: 'Protective action', blurb: 'Decides the protective action and writes it on-chain to TreasuryGuard.', icon: Coins, tone: '52, 211, 153', color: 'text-emerald-400', executes: true },
  { name: 'Insurance', role: 'Coverage & payouts', blurb: 'Assesses reserve/coverage adequacy against the incident exposure.', icon: Umbrella, tone: '167, 139, 250', color: 'text-violet-300' },
  { name: 'Growth', role: 'Incentives', blurb: 'Weighs TVL/retention impact and the incentive or messaging response that protects growth.', icon: Sprout, tone: '132, 204, 22', color: 'text-lime-400' },
  { name: 'Community', role: 'Comms & sentiment', blurb: 'Predicts community sentiment and recommends the communications posture.', icon: Users, tone: '244, 114, 182', color: 'text-pink-400' },
  { name: 'Legal', role: 'Entity & exposure', blurb: 'Flags legal/entity exposure and disclosure obligations from the incident and response.', icon: Gavel, tone: '148, 163, 184', color: 'text-slate-300' },
  { name: 'Governance', role: 'Emergency proposals', blurb: 'Drafts an emergency proposal ratifying the response and anchors it on-chain for the DAO.', icon: Landmark, tone: '139, 92, 246', color: 'text-violet-400', executes: true },
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
  return (
    <PanelCard index={index} className="h-full">
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <IconTile icon={agent.icon} tone={agent.tone} size="lg" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]" />
            Live
          </span>
        </div>
        <div>
          <div className={cn('text-base font-semibold', agent.color)}>{agent.name}</div>
          <div className="text-xs text-muted-foreground">{agent.role}</div>
        </div>
        <p className="text-sm text-muted-foreground/90">{agent.blurb}</p>
        <div className="mt-auto pt-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {agent.executes ? 'Executes actions on-chain' : 'Live · anchors on Casper'}
          </div>
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
          title="The team · all 12 live, acting on-chain"
          right={
            <span className="text-xs text-muted-foreground">
              {totalActions !== null ? `${totalActions} on-chain actions` : '—'}
            </span>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((a, i) => (
            <AgentTile key={a.name} agent={a} index={i} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader icon={Store} title="Marketplace · publish your own in v1" />
        <PanelCard className="opacity-70">
          <div className="flex flex-col gap-2 p-6">
            <div className="text-sm font-semibold text-foreground">Agent Store &amp; Developer SDK</div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Today all twelve agents ship with SentinelOS and act on your protocol for real. In v1, any
              team can publish a new agent to the marketplace and any protocol can install the agents it
              needs — the OS layer that turns this from a product into a platform.
            </p>
            <div className="mt-1 w-fit cursor-not-allowed rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground/60">
              Publish an agent — Coming in v1
            </div>
          </div>
        </PanelCard>
      </section>
    </div>
  );
}

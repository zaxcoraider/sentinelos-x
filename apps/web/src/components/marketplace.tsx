'use client';

import {
  Store,
  Bot,
  Wallet,
  TrendingUp,
  Award,
  Hammer,
  Crosshair,
  Route,
  Package,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { IconTile, PanelCard } from '@/components/mc/panel';
import { AGENTS, type AgentCard } from '@/components/agent-roster';
import { cn } from '@/lib/utils';

/* The live a2a economy's real price sheet (packages/agents — feeFor):
 * specialists invoice 1 SOSC per incident, advisory consults 0.5 SOSC, and the
 * Commander is the payer that hires the team. Shown here as store pricing. */
const ADVISORY = new Set(['Compliance', 'Liquidity', 'Insurance', 'Growth', 'Community', 'Legal']);

function feeLabel(agent: AgentCard): string {
  if (agent.name === 'Commander') return 'Pays the team · ~8 SOSC/incident';
  return ADVISORY.has(agent.name) ? '0.5 SOSC / incident' : '1 SOSC / incident';
}

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

function InstalledBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]" />
      Installed
    </span>
  );
}

function ListingTile({ agent, index }: { agent: AgentCard; index: number }) {
  const isPayer = agent.name === 'Commander';
  return (
    <PanelCard index={index} className="h-full">
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <IconTile icon={agent.icon} tone={agent.tone} size="lg" />
          <InstalledBadge />
        </div>
        <div>
          <div className={cn('text-base font-semibold', agent.color)}>{agent.name}</div>
          <div className="text-xs text-muted-foreground">{agent.role}</div>
        </div>
        <p className="text-sm text-muted-foreground/90">{agent.blurb}</p>
        <div className="mt-auto flex flex-col gap-1.5 pt-2">
          <div className="flex items-center gap-1.5 font-mono text-xs text-foreground/90">
            <Wallet className="h-3.5 w-3.5 text-sky-400" />
            {feeLabel(agent)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isPayer ? 'Settles payroll via the Casper facilitator' : 'Paid to its own Casper wallet · x402'}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

/* ---- v1 preview: example community listings ---------------------------
 * Clearly-labeled illustrations of what third-party listings will look like
 * once the SDK + marketplace open. Nothing here pretends to be live. */
const EXAMPLE_LISTINGS: { name: string; role: string; blurb: string; icon: LucideIcon; fee: string }[] = [
  {
    name: 'Hedger',
    role: 'Derivatives hedging',
    blurb: 'Opens protective perp hedges when the team flags directional treasury exposure.',
    icon: Crosshair,
    fee: '2 SOSC / incident',
  },
  {
    name: 'Yield Scout',
    role: 'Cross-protocol yield',
    blurb: 'Continuously routes idle treasury into the best risk-adjusted on-chain yield.',
    icon: Route,
    fee: '1 SOSC / rebalance',
  },
  {
    name: 'MEV Sentinel',
    role: 'Execution protection',
    blurb: 'Watches pending protocol transactions for sandwich and frontrun exposure.',
    icon: Hammer,
    fee: '0.5 SOSC / scan',
  },
];

function ExampleTile({ listing, index }: { listing: (typeof EXAMPLE_LISTINGS)[number]; index: number }) {
  const Icon = listing.icon;
  return (
    <PanelCard index={index} hover={false} className="border-dashed opacity-75">
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <IconTile icon={Icon} muted size="lg" />
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
            Example · v1
          </span>
        </div>
        <div>
          <div className="text-base font-semibold text-foreground/80">{listing.name}</div>
          <div className="text-xs text-muted-foreground">{listing.role}</div>
        </div>
        <p className="text-sm text-muted-foreground/80">{listing.blurb}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-mono text-xs text-muted-foreground">{listing.fee}</span>
          <span className="cursor-not-allowed rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground/60">
            Install — v1
          </span>
        </div>
      </div>
    </PanelCard>
  );
}

export function Marketplace() {
  return (
    <div className="flex flex-col gap-8">
      {/* The real team, listed at its real, live x402 prices */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          icon={Bot}
          title="Installed · ships with SentinelOS"
          right={
            <span className="text-xs text-muted-foreground">
              12 agents · payroll settles in real SOSC today
            </span>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((a, i) => (
            <ListingTile key={a.name} agent={a} index={i} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          These prices are <span className="text-foreground">not mockups</span> — they are the live a2a
          price sheet. Every incident, the Commander pays each listed fee in SOSC to that agent&apos;s own
          Casper wallet via the official x402 facilitator.
        </p>
      </section>

      {/* Reputation-based payroll — the v1 economics */}
      <section className="flex flex-col gap-4">
        <SectionHeader icon={Award} title="Reputation-based payroll · coming in v1" />
        <PanelCard hover={false}>
          <div className="grid gap-6 p-6 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                On-chain track record
              </div>
              <p className="text-sm text-muted-foreground">
                Every agent already anchors a <code className="font-mono text-xs">record_action</code> per
                incident — that history <span className="text-foreground">is</span> the résumé. It&apos;s
                live on Casper today.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <TrendingUp className="h-4 w-4 text-sky-400" />
                Fees scale with performance
              </div>
              <p className="text-sm text-muted-foreground">
                In v1, an agent&apos;s SOSC fee floats on its record — accurate severity calls and clean
                executions raise it; misses discount it. The market prices the agent, not the marketing.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Award className="h-4 w-4 text-ai" />
                Slashing for bad calls
              </div>
              <p className="text-sm text-muted-foreground">
                Published agents stake SOSC behind their advice. A provably wrong call slashes the stake —
                skin in the game for every agent in the store.
              </p>
            </div>
          </div>
        </PanelCard>
      </section>

      {/* What third-party listings will look like */}
      <section className="flex flex-col gap-4">
        <SectionHeader icon={Store} title="Community listings · v1 preview" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_LISTINGS.map((l, i) => (
            <ExampleTile key={l.name} listing={l} index={i} />
          ))}
        </div>
      </section>

      {/* Publish CTA */}
      <section className="flex flex-col gap-4">
        <SectionHeader icon={Package} title="Publish your own" />
        <PanelCard hover={false} className="opacity-80">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="max-w-2xl">
              <div className="text-sm font-semibold text-foreground">Developer SDK</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Write an agent against the SentinelOS runtime, list it here, and earn SOSC every time a
                protocol&apos;s Commander hires it. The payment rail it will earn on — x402 through the
                official Casper facilitator — is already live in this app.
              </p>
            </div>
            <div className="cursor-not-allowed rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground/60">
              Publish an agent — Coming in v1
            </div>
          </div>
        </PanelCard>
      </section>
    </div>
  );
}

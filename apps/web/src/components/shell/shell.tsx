'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Network,
  Zap,
  Bot,
  Landmark,
  ShieldAlert,
  BarChart3,
  Store,
  Settings,
  Bell,
  ExternalLink,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import type { OnChainAction } from '@sentinelos/casper';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/mc/primitives';
import { AGENT_META } from '@/components/mc/agent-meta';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** v1-preview module — navigable, but badged so it never oversells. */
  preview?: boolean;
}

const LIVE_NAV: NavItem[] = [
  { label: 'Mission Control', href: '/', icon: Network },
  { label: 'Crisis Response', href: '/crisis', icon: Zap },
  { label: 'Agent Team', href: '/agents', icon: Bot },
  { label: 'Governance', href: '/governance', icon: Landmark },
  { label: 'Security Center', href: '/security', icon: ShieldAlert },
];

const MODULE_NAV: NavItem[] = [
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Marketplace', href: '/marketplace', icon: Store, preview: true },
  { label: 'Settings', href: '/settings', icon: Settings, preview: true },
];

// A gentle, stable curve for the sidebar health sparkline.
const HEALTH_SERIES = [82, 85, 83, 88, 90, 87, 92, 94, 91, 95, 96, 98];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active ? 'font-medium text-foreground' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 -z-[1] rounded-lg border border-primary/40 bg-gradient-to-r from-primary/20 to-ai/10"
          style={{ boxShadow: '0 0 18px -6px hsl(var(--primary))' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        />
      )}
      <Icon className={cn('h-4 w-4 transition-colors', active ? 'text-primary' : 'group-hover:text-foreground')} />
      {item.label}
      {active ? (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
      ) : item.preview ? (
        <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground/60">
          preview
        </span>
      ) : null}
    </a>
  );
}

function Brand() {
  return (
    <a href="/" className="flex items-center gap-3">
      <div className="mc-float relative h-10 w-10 shrink-0">
        <Image
          src="/logo.png"
          alt="SentinelOS"
          width={40}
          height={40}
          priority
          className="h-10 w-10 rounded-xl object-cover shadow-[0_0_24px_-6px_hsl(var(--primary))]"
        />
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/15" />
      </div>
      <div className="leading-tight">
        <div className="text-[16px] font-semibold tracking-tight text-white">
          Sentinel
          <span className="bg-gradient-to-r from-sky-400 to-ai bg-clip-text text-transparent">OS</span>
        </div>
        <div className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
          Autonomous OS for Web3
        </div>
      </div>
    </a>
  );
}

function ProtocolHealth() {
  return (
    <div className="mc-panel p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Protocol Health</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-success">98%</span>
        <span className="text-xs text-success/80">Healthy</span>
      </div>
      <div className="mt-2">
        <Sparkline data={HEALTH_SERIES} tone="52, 211, 153" height={40} />
      </div>
    </div>
  );
}

function Connection({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/5 text-xs text-muted-foreground',
        compact ? 'px-2.5 py-1' : 'px-3 py-1.5',
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <span className="text-success">Connected</span>
      <span className="text-muted-foreground/50">·</span>
      Casper Testnet
    </div>
  );
}

/* ---- Real notifications ------------------------------------------------
 * The bell surfaces the actual latest record_action transactions on
 * TreasuryGuard (indexed by CSPR.cloud, each row links to cspr.live) plus the
 * live USDC peg reading. The unread badge counts only events newer than the
 * last time the panel was opened (persisted in localStorage). */

const SEEN_KEY = 'sentinelos-notifications-seen-at';

interface PegStatus {
  symbol: string;
  price: number;
  pegDeviation: number;
}

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function agentMeta(agent: string) {
  const key = (agent.charAt(0).toUpperCase() + agent.slice(1).toLowerCase()) as keyof typeof AGENT_META;
  return AGENT_META[key];
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState<OnChainAction[] | null>(null);
  const [peg, setPeg] = useState<PegStatus | null>(null);
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    setSeenAt(Number(localStorage.getItem(SEEN_KEY) ?? 0));
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/activity', { cache: 'no-store' });
        if (res.ok) {
          const json = (await res.json()) as { actions?: OnChainAction[] };
          if (alive) setActions(json.actions ?? []);
        } else if (alive) {
          setActions((a) => a ?? []);
        }
      } catch {
        if (alive) setActions((a) => a ?? []);
      }
      try {
        const res = await fetch('/api/market', { cache: 'no-store' });
        if (res.ok) {
          const json = (await res.json()) as { stable?: PegStatus };
          if (alive && json.stable) setPeg(json.stable);
        }
      } catch {
        // peg pill simply stays hidden when the market feed is down
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const unread = (actions ?? []).filter((a) => new Date(a.timestamp).getTime() > seenAt).length;
  const pegged = peg ? peg.pegDeviation < 0.005 : null;

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next && actions && actions.length > 0) {
        const newest = Math.max(...actions.map((a) => new Date(a.timestamp).getTime()));
        localStorage.setItem(SEEN_KEY, String(newest));
        setSeenAt(newest);
      }
      return next;
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications — ${unread} new on-chain events` : 'Notifications'}
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-full border bg-card-elevated/50 transition-colors',
          open ? 'border-primary/50 text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
        )}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-white shadow-[0_0_6px_hsl(var(--primary))]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            {/* click-away layer */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
                <span className="text-xs font-semibold text-foreground">On-chain activity</span>
                {peg && pegged !== null && (
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-[10px] uppercase tracking-wider',
                      pegged ? 'text-success' : 'text-warning',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', pegged ? 'bg-success' : 'bg-warning')} />
                    {peg.symbol} ${peg.price.toFixed(4)} · {pegged ? 'peg holding' : `${(peg.pegDeviation * 100).toFixed(2)}% off peg`}
                  </span>
                )}
              </div>
              {actions === null ? (
                <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                  syncing on-chain activity…
                </div>
              ) : actions.length === 0 ? (
                <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                  No recorded actions indexed yet.
                </div>
              ) : (
                <ul className="max-h-80 divide-y divide-border/50 overflow-y-auto">
                  {actions.map((a) => {
                    const meta = agentMeta(a.agent);
                    const Icon = meta?.icon ?? ShieldAlert;
                    const fresh = new Date(a.timestamp).getTime() > seenAt;
                    return (
                      <li key={a.txHash}>
                        <a
                          href={a.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-foreground/5"
                        >
                          <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', meta?.text ?? 'text-muted-foreground')} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                              <span className="capitalize">{a.agent}</span>
                              <span className="font-mono text-[11px] text-foreground/80">{a.action}</span>
                              {fresh && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {a.severity !== null ? `severity ${a.severity} · ` : ''}
                              {a.success ? 'confirmed on Casper' : 'execution failed'} · {timeAgo(a.timestamp)}
                            </div>
                          </div>
                          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex items-center justify-between border-t border-border/70 px-3 py-2">
                <span className="text-[10px] text-muted-foreground">
                  record_action txs · live from CSPR.cloud
                </span>
                <a href="/security" className="text-[10px] text-primary hover:underline" onClick={() => setOpen(false)}>
                  Security Center →
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/70 bg-card/40 px-4 py-6 backdrop-blur-xl lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <div className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Operations
          </div>
          {LIVE_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={isActive(item.href)} />
          ))}
          <div className="px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Modules
          </div>
          {MODULE_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={isActive(item.href)} />
          ))}

          <div className="mt-auto flex flex-col gap-3">
            <ProtocolHealth />
            <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              12 agents online · v1.0.0
            </div>
          </div>
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border/70 bg-background/60 px-6 backdrop-blur-xl">
          <div className="lg:hidden">
            <Brand />
          </div>
          <a
            href="https://testnet.cspr.live/contract-package/7f56caa1d89d394786354bc382b1896fcd21fd77d0cea33c41a54e28c56990db"
            target="_blank"
            rel="noopener noreferrer"
            title="View the TreasuryGuard contract on cspr.live"
            className="group hidden items-center gap-2 rounded-full border border-border bg-card-elevated/50 px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground lg:flex"
          >
            <span className="text-muted-foreground/70">Protocol:</span>
            <span className="font-semibold text-foreground/90">TreasuryGuard</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-primary" />
          </a>
          <div className="flex items-center gap-3">
            <Connection compact />
            <NotificationsBell />
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

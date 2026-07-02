'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/mc/primitives';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roadmap?: boolean;
}

const LIVE_NAV: NavItem[] = [
  { label: 'Mission Control', href: '/', icon: Network },
  { label: 'Crisis Response', href: '/crisis', icon: Zap },
  { label: 'Agent Team', href: '/agents', icon: Bot },
  { label: 'Governance', href: '/governance', icon: Landmark },
  { label: 'Security Center', href: '/security', icon: ShieldAlert },
];

const ROADMAP_NAV: NavItem[] = [
  { label: 'Analytics', href: '#', icon: BarChart3, roadmap: true },
  { label: 'Marketplace', href: '#', icon: Store, roadmap: true },
  { label: 'Settings', href: '#', icon: Settings, roadmap: true },
];

// A gentle, stable curve for the sidebar health sparkline.
const HEALTH_SERIES = [82, 85, 83, 88, 90, 87, 92, 94, 91, 95, 96, 98];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  if (item.roadmap) {
    return (
      <div
        className="flex cursor-not-allowed items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/40"
        title="Coming in v1"
      >
        <span className="flex items-center gap-3">
          <Icon className="h-4 w-4" />
          {item.label}
        </span>
        <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wide">v1</span>
      </div>
    );
  }
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
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
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
        <div className="text-[15px] font-semibold tracking-tight">SentinelOS</div>
        <div className="text-[11px] text-muted-foreground">Autonomous OS · Web3</div>
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
          {ROADMAP_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={false} />
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
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card-elevated/50 px-3 py-1.5 font-mono text-xs text-muted-foreground lg:flex">
            <span className="text-muted-foreground/70">Protocol:</span>
            <span className="font-semibold text-foreground/90">TreasuryGuard</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
          </div>
          <div className="flex items-center gap-3">
            <Connection compact />
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card-elevated/50 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger shadow-[0_0_6px_hsl(var(--danger))]" />
            </button>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

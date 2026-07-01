'use client';

import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Network,
  Zap,
  Bot,
  Landmark,
  ShieldAlert,
  BarChart3,
  Store,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  if (item.roadmap) {
    return (
      <div
        className="flex cursor-not-allowed items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/45"
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
        'group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors',
        active
          ? 'border-primary bg-primary/10 font-medium text-foreground'
          : 'border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
      )}
    >
      <Icon className={cn('h-4 w-4', active ? 'text-primary' : '')} />
      {item.label}
    </a>
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

function Brand() {
  return (
    <a href="/" className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">SentinelOS</div>
        <div className="text-[11px] text-muted-foreground">Autonomous OS · Web3</div>
      </div>
    </a>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card/50 px-4 py-6 backdrop-blur lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1">
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
        </nav>
        <div className="mt-auto flex items-center gap-2 rounded-lg border border-border bg-card-elevated/40 px-3 py-2 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="text-muted-foreground">4 agents online</span>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/70 px-6 backdrop-blur">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden items-center gap-2 font-mono text-xs text-muted-foreground lg:flex">
            <span className="text-foreground/70">TreasuryGuard</span>
            <span className="text-muted-foreground/40">::</span>
            <span>casper-test</span>
          </div>
          <Connection compact />
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

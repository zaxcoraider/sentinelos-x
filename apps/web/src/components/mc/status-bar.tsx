'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="font-medium text-foreground/80">{children}</span>
    </div>
  );
}

export function StatusBar({ running }: { running: boolean }) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="mc-panel flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-[11px]">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
        <span className="font-medium text-success">All Systems Operational</span>
      </div>

      <Item label="Network">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Casper Testnet
        </span>
      </Item>
      <Item label="Agents">12 / 12 online</Item>
      <Item label="Pipeline">
        <span className={running ? 'text-warning' : 'text-foreground/80'}>{running ? 'responding' : 'monitoring'}</span>
      </Item>
      <Item label="Uptime">99.9%</Item>

      <button
        type="button"
        onClick={() => setAutoRefresh((v) => !v)}
        className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-card-elevated/50 px-2.5 py-1 transition-colors hover:border-primary/40"
      >
        <span className="text-muted-foreground/70">Auto-refresh</span>
        <span
          className={cn(
            'relative h-4 w-7 rounded-full transition-colors',
            autoRefresh ? 'bg-success/70' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all',
              autoRefresh ? 'left-3.5' : 'left-0.5',
            )}
          />
        </span>
        <span className={cn('font-medium', autoRefresh ? 'text-success' : 'text-muted-foreground')}>
          {autoRefresh ? 'On' : 'Off'}
        </span>
      </button>
    </div>
  );
}

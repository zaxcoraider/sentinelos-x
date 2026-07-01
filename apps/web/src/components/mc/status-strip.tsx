'use client';

import { Bot, Zap, Layers, ShieldCheck, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCard, AnimatedNumber } from './primitives';

function threat(severity: number | null) {
  if (severity === null) return { label: 'LOW', tone: '34, 197, 94', note: 'no active threats' };
  if (severity >= 60) return { label: 'ELEVATED', tone: '239, 68, 68', note: `severity ${severity}/100` };
  if (severity >= 30) return { label: 'GUARDED', tone: '245, 158, 11', note: `severity ${severity}/100` };
  return { label: 'LOW', tone: '34, 197, 94', note: `severity ${severity}/100` };
}

export function StatusStrip({
  totalActions,
  severity,
  running,
  protectedUsd,
}: {
  totalActions: number | null;
  severity: number | null;
  running: boolean;
  protectedUsd: number;
}) {
  const t = threat(severity);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard icon={Bot} label="Agents Online" tone="96, 165, 250" index={0} footer="Commander · Risk · Treasury · Gov">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-3xl font-semibold text-foreground">4</span>
          <span className="text-sm text-muted-foreground">/ 12</span>
        </div>
      </StatCard>

      <StatCard
        icon={Zap}
        label="Tasks Running"
        tone="245, 158, 11"
        index={1}
        footer={running ? 'incident in progress' : 'monitoring'}
      >
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-3xl font-semibold', running ? 'text-warning' : 'text-foreground')}>
            {running ? 1 : 0}
          </span>
          {running && <span className="h-2 w-2 animate-pulse rounded-full bg-warning shadow-[0_0_8px_hsl(var(--warning))]" />}
        </div>
      </StatCard>

      <StatCard icon={Layers} label="On-chain Txs" tone="56, 189, 248" index={2} footer="recorded on Casper">
        <span className="font-mono text-3xl font-semibold text-foreground">
          {totalActions === null ? '—' : <AnimatedNumber value={totalActions} />}
        </span>
      </StatCard>

      <StatCard icon={DollarSign} label="Value Protected" tone="34, 197, 94" index={3} footer="this session">
        <span className="font-mono text-3xl font-semibold text-success">
          {protectedUsd > 0 ? <AnimatedNumber value={protectedUsd} prefix="$" /> : '—'}
        </span>
      </StatCard>

      <StatCard icon={ShieldCheck} label="Threat Level" tone={t.tone} index={4} footer={t.note}>
        <span className="text-3xl font-semibold" style={{ color: `rgb(${t.tone})` }}>
          {t.label}
        </span>
      </StatCard>
    </div>
  );
}

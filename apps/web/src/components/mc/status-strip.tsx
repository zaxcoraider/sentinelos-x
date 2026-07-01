'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Bot, Zap, Layers, Radar } from 'lucide-react';
import { cn } from '@/lib/utils';

function threat(severity: number | null) {
  if (severity === null) return { label: 'NONE', tone: 'text-muted-foreground', bar: 'bg-muted-foreground' };
  if (severity >= 60) return { label: 'ELEVATED', tone: 'text-danger', bar: 'bg-danger' };
  if (severity >= 30) return { label: 'GUARDED', tone: 'text-warning', bar: 'bg-warning' };
  return { label: 'LOW', tone: 'text-success', bar: 'bg-success' };
}

function Tile({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Activity;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card-elevated/60 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      {children}
    </div>
  );
}

export function StatusStrip({
  totalActions,
  severity,
  running,
}: {
  totalActions: number | null;
  severity: number | null;
  running: boolean;
}) {
  const health = severity === null ? 100 : Math.max(0, 100 - severity);
  const healthLabel = health >= 80 ? 'Healthy' : health >= 50 ? 'Guarded' : 'Critical';
  const healthTone = health >= 80 ? 'text-success' : health >= 50 ? 'text-warning' : 'text-danger';
  const healthBar = health >= 80 ? 'bg-success' : health >= 50 ? 'bg-warning' : 'bg-danger';
  const t = threat(severity);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Tile icon={Activity} label="Protocol Health">
        <div className={cn('font-mono text-2xl font-semibold', healthTone)}>{health}%</div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn('h-full rounded-full', healthBar)}
            animate={{ width: `${health}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <div className="text-[11px] text-muted-foreground">{healthLabel}</div>
      </Tile>

      <Tile icon={Bot} label="Agents Online">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-semibold text-primary">4</span>
          <span className="text-xs text-muted-foreground">/ 12</span>
        </div>
        <div className="text-[11px] text-muted-foreground">Commander · Risk · Treasury · Governance</div>
      </Tile>

      <Tile icon={Zap} label="Tasks Running">
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-2xl font-semibold', running ? 'text-warning' : 'text-foreground')}>
            {running ? 1 : 0}
          </span>
          {running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />}
        </div>
        <div className="text-[11px] text-muted-foreground">{running ? 'incident in progress' : 'monitoring'}</div>
      </Tile>

      <Tile icon={Layers} label="On-chain Txs">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={totalActions ?? 'na'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="font-mono text-2xl font-semibold"
          >
            {totalActions ?? '—'}
          </motion.div>
        </AnimatePresence>
        <div className="text-[11px] text-muted-foreground">recorded on Casper</div>
      </Tile>

      <Tile icon={Radar} label="Threat Level">
        <div className={cn('text-2xl font-semibold', t.tone)}>{t.label}</div>
        <div className="text-[11px] text-muted-foreground">
          {severity !== null ? `severity ${severity}/100` : 'no active signal'}
        </div>
      </Tile>
    </div>
  );
}

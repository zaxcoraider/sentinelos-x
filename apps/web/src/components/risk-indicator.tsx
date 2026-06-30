'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Level = 'none' | 'safe' | 'high';

function levelFor(severity: number | null): Level {
  if (severity === null) return 'none';
  return severity >= 60 ? 'high' : 'safe';
}

const META: Record<Level, { label: string; dot: string; text: string; ring: string }> = {
  none: { label: 'No actions yet', dot: 'bg-muted-foreground', text: 'text-muted-foreground', ring: 'ring-border' },
  safe: { label: 'Nominal', dot: 'bg-emerald-400', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  high: { label: 'High risk', dot: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/30' },
};

export function RiskIndicator({ severity }: { severity: number | null }) {
  const level = levelFor(severity);
  const meta = META[level];
  return (
    <div className={cn('flex items-center gap-3 rounded-md px-3 py-2 ring-1', meta.ring)}>
      <span className="relative flex h-3 w-3">
        {level !== 'none' && (
          <motion.span
            className={cn('absolute inline-flex h-full w-full rounded-full opacity-60', meta.dot)}
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className={cn('relative inline-flex h-3 w-3 rounded-full', meta.dot)} />
      </span>
      <div className="leading-tight">
        <div className={cn('text-sm font-semibold', meta.text)}>{meta.label}</div>
        <div className="text-xs text-muted-foreground">
          severity {severity ?? '—'}
        </div>
      </div>
    </div>
  );
}

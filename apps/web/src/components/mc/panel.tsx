'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Re-export the pure primitives so client components can import them from here too.
export { IconTile, PageHeader } from './page-header';

/* ---- Titled glass panel (header row + body) --------------------------- */

export function Panel({
  title,
  icon: Icon,
  tone,
  right,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  tone?: string; // rgb triple for the icon tile
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('mc-panel flex flex-col overflow-hidden', className)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {Icon && (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={tone ? { background: `rgb(${tone} / 0.14)`, color: `rgb(${tone})` } : undefined}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      <div className={cn('flex-1', bodyClassName)}>{children}</div>
    </section>
  );
}

/* ---- Bare glass card with entrance + hover lift ----------------------- */

export function PanelCard({
  index = 0,
  hover = true,
  className,
  children,
}: {
  index?: number;
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn('mc-panel', hover && 'mc-card-hover', className)}
    >
      {children}
    </motion.div>
  );
}

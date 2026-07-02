import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---- Tinted, glowing icon tile — the Mission Control signature --------
 * Pure (no hooks / no motion) so it can render in Server Components too. */

export function IconTile({
  icon: Icon,
  tone,
  size = 'md',
  muted = false,
  className,
}: {
  icon: LucideIcon;
  /** rgb triple, e.g. "96, 165, 250" */
  tone?: string;
  size?: 'sm' | 'md' | 'lg';
  /** render a neutral, glow-less tile (roadmap / inactive) */
  muted?: boolean;
  className?: string;
}) {
  const box = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const ic = size === 'lg' ? 'h-5 w-5' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const rounded = size === 'sm' ? 'rounded-md' : 'rounded-xl';

  if (muted || !tone) {
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center border border-border bg-card text-muted-foreground',
          box,
          rounded,
          className,
        )}
      >
        <Icon className={ic} />
      </span>
    );
  }

  return (
    <span
      className={cn('flex shrink-0 items-center justify-center border', box, rounded, className)}
      style={{
        background: `rgb(${tone} / 0.12)`,
        borderColor: `rgb(${tone} / 0.3)`,
        boxShadow: `0 0 20px -6px rgb(${tone} / 0.6)`,
        color: `rgb(${tone})`,
      }}
    >
      <Icon className={ic} />
    </span>
  );
}

/* ---- Consistent page header (eyebrow + title + subtitle) --------------
 * Server-compatible so pages can pass a Lucide icon component directly. */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  tone,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
  tone?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {icon && <IconTile icon={icon} tone={tone} size="lg" />}
        <div>
          {eyebrow && (
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

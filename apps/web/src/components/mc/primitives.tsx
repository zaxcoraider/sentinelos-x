'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---- Animated counter -------------------------------------------------- */

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [text, setText] = useState(() => value.toFixed(decimals));

  useEffect(() => {
    const controls = animate(Number(text.replace(/,/g, '')) || 0, value, {
      duration: 0.9,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate(v) {
        setText(
          v.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }),
        );
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/* ---- Gradient stat card ------------------------------------------------ */

export interface StatTone {
  /** rgb triple, e.g. "34, 197, 94" */
  rgb: string;
}

export function StatCard({
  icon: Icon,
  label,
  tone,
  index = 0,
  children,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  tone: string; // rgb triple
  index?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="mc-panel mc-card-hover group relative overflow-hidden p-4"
    >
      {/* corner tint that matches the tone */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70"
        style={{ background: `rgb(${tone})` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2">{children}</div>
          {footer && <div className="mt-1.5 text-[11px] text-muted-foreground">{footer}</div>}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{
            background: `rgb(${tone} / 0.12)`,
            borderColor: `rgb(${tone} / 0.3)`,
            boxShadow: `0 0 20px -6px rgb(${tone} / 0.6)`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: `rgb(${tone})` }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ---- Donut gauge ------------------------------------------------------- */

export function Donut({
  value,
  size = 132,
  stroke = 12,
  tone = '34, 197, 94',
  label,
  sub,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  tone?: string;
  label?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(c);
  const dash = useSpring(mv, { stiffness: 90, damping: 20 });
  const [offset, setOffset] = useState(c);

  useEffect(() => {
    mv.set(inView ? c - (Math.max(0, Math.min(100, value)) / 100) * c : c);
    const unsub = dash.on('change', setOffset);
    return () => unsub();
  }, [inView, value, c, mv, dash]);

  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`rgb(${tone})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px rgb(${tone} / 0.7))` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-2xl font-semibold tabular-nums">{label}</span>}
        {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

/* ---- Confidence / meter bar ------------------------------------------- */

export function MeterBar({ value, tone = '34, 197, 94' }: { value: number; tone?: string }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        className="relative h-full rounded-full"
        style={{ background: `rgb(${tone})`, boxShadow: `0 0 10px rgb(${tone} / 0.7)` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 20 }}
      >
        <span className="mc-shimmer absolute inset-0" />
      </motion.div>
    </div>
  );
}

/* ---- Mini sparkline ---------------------------------------------------- */

export function Sparkline({
  data,
  width = 200,
  height = 48,
  tone = '34, 197, 94',
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((d, i) => [i * step, height - ((d - min) / span) * (height - 6) - 3]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const id = `spark-${tone.replace(/\D/g, '')}`;

  return (
    <svg width={width} height={height} className="w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(${tone})`} stopOpacity="0.35" />
          <stop offset="100%" stopColor={`rgb(${tone})`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <motion.path
        d={line}
        fill="none"
        stroke={`rgb(${tone})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
        style={{ filter: `drop-shadow(0 0 4px rgb(${tone} / 0.6))` }}
      />
    </svg>
  );
}

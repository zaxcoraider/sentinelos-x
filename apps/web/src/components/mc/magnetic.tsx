'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Wraps an element so it feels magnetic: while the cursor is within `radius` of
 * the element it drifts toward the pointer (capped at `maxShift`px), then springs
 * back to rest on exit. Mouse-only — bows out for touch and reduced-motion.
 */
export function Magnetic({
  children,
  strength = 0.3,
  radius = 70,
  maxShift = 12,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  radius?: number;
  maxShift?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.35 });

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    const clamp = (v: number) => Math.max(-maxShift, Math.min(maxShift, v));
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const trigger = Math.max(r.width, r.height) / 2 + radius;
      if (Math.hypot(dx, dy) < trigger) {
        x.set(clamp(dx * strength));
        y.set(clamp(dy * strength));
      } else {
        x.set(0);
        y.set(0);
      }
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [strength, radius, maxShift, x, y]);

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy }} className={className}>
      {children}
    </motion.div>
  );
}

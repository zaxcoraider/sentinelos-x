'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * A futuristic targeting-reticle cursor: a springy outer ring (with a slowly
 * rotating dashed reticle) trailing a tight inner dot. Grows and shifts to the
 * AI-violet accent over interactive elements, contracts on click. Only engages
 * on fine pointers (mouse) and bows out for prefers-reduced-motion / touch.
 */
export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.5 });

  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [down, setDown] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    setEnabled(true);
    document.documentElement.classList.add('cursor-custom');

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = e.target as HTMLElement | null;
      const interactive = el?.closest('a, button, [role="button"], input, select, textarea, label, .cursor-target');
      setHovering(Boolean(interactive));
    };
    const leave = (e: MouseEvent) => {
      if (!e.relatedTarget) setVisible(false);
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseout', leave);
    window.addEventListener('mousedown', dn);
    window.addEventListener('mouseup', up);
    return () => {
      document.documentElement.classList.remove('cursor-custom');
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseout', leave);
      window.removeEventListener('mousedown', dn);
      window.removeEventListener('mouseup', up);
    };
  }, [x, y]);

  if (!enabled) return null;

  const accent = hovering ? '167, 139, 250' : '96, 165, 250'; // violet on hover, blue at rest

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block">
      {/* Outer reticle ring — springy trail */}
      <motion.div
        className="absolute left-0 top-0"
        style={{ x: ringX, y: ringY }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ opacity: { duration: 0.2 } }}
      >
        <motion.div
          className="relative -ml-5 -mt-5 h-10 w-10 rounded-full border"
          style={{ borderColor: `rgb(${accent} / 0.9)`, boxShadow: `0 0 16px rgb(${accent} / 0.55)` }}
          animate={{ scale: down ? 0.75 : hovering ? 1.6 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* rotating dashed reticle */}
          <span
            className="mc-spin-slow absolute inset-1 rounded-full border border-dashed"
            style={{ borderColor: `rgb(${accent} / 0.5)` }}
          />
          {/* corner ticks */}
          {[
            'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-1 w-px',
            'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 h-1 w-px',
            'top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-1 h-px',
            'top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-1 h-px',
          ].map((c) => (
            <span key={c} className={`absolute ${c}`} style={{ background: `rgb(${accent})` }} />
          ))}
        </motion.div>
      </motion.div>

      {/* Inner dot — tight follow */}
      <motion.div
        className="absolute left-0 top-0"
        style={{ x, y }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ opacity: { duration: 0.15 } }}
      >
        <motion.span
          className="block -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full"
          style={{ background: `rgb(${accent})`, boxShadow: `0 0 8px rgb(${accent})` }}
          animate={{ scale: down ? 1.8 : hovering ? 0 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        />
      </motion.div>
    </div>
  );
}

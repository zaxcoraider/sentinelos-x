'use client';

import { useEffect, useRef, useState } from 'react';

const SRC = '/neon-tunnel.mp4';
const FADE_MS = 1100; // crossfade window near the loop point

/**
 * Ambient neon-tunnel backdrop. Two stacked <video> layers cross-fade into one
 * another near the end of each play-through, so the loop never hard-cuts — it
 * reads as one continuous, endless motion. Dimmed + blurred behind a dark scrim
 * to keep dashboard text legible. Disabled for prefers-reduced-motion.
 */
export function VideoBackground() {
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const swapping = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (enabled) a.current?.play().catch(() => {});
  }, [enabled]);

  if (!enabled) return null;

  const refs = [a, b];
  const onTime = (idx: number) => () => {
    if (idx !== active || swapping.current) return;
    const cur = refs[idx].current;
    if (!cur || !cur.duration || Number.isNaN(cur.duration)) return;
    // Hand off before the source actually ends so the fade hides the seam.
    if (cur.currentTime >= cur.duration - FADE_MS / 1000) {
      swapping.current = true;
      const next = idx === 0 ? 1 : 0;
      const nv = refs[next].current;
      if (nv) {
        nv.currentTime = 0;
        nv.play().catch(() => {});
      }
      setActive(next);
      window.setTimeout(() => {
        cur.pause();
        cur.currentTime = 0;
        swapping.current = false;
      }, FADE_MS);
    }
  };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
      {[0, 1].map((i) => (
        <video
          key={i}
          ref={refs[i]}
          src={SRC}
          muted
          playsInline
          preload="auto"
          onTimeUpdate={onTime(i)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: active === i ? 0.22 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
            filter: 'blur(2px) saturate(1.15)',
            transform: 'scale(1.06)', // cover blur bleed at the edges
          }}
        />
      ))}
      {/* dark scrim so panels + text stay crisp over the moving light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, hsl(240 10% 3.5% / 0.5), hsl(240 10% 3.5% / 0.82))',
        }}
      />
    </div>
  );
}

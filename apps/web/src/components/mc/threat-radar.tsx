'use client';

import { motion } from 'framer-motion';

/**
 * A sweeping radar keyed to the live operational severity. At standby it reads
 * LOW with the beam quietly rotating; during a high-severity incident a hot blip
 * appears near the centre and the badge escalates. No fabricated counts — the
 * single blip reflects the one signal the pipeline is actually tracking.
 */
export function ThreatRadar({ severity, running }: { severity: number | null; running: boolean }) {
  const level =
    severity === null || severity < 30
      ? { label: 'LOW', tone: '34, 197, 94' }
      : severity < 60
        ? { label: 'GUARDED', tone: '245, 158, 11' }
        : { label: 'ELEVATED', tone: '239, 68, 68' };

  // Blip sits closer to the centre as severity climbs (closer = more urgent).
  const hasBlip = severity !== null && severity > 0;
  const blipR = severity !== null ? 12 + (1 - Math.min(severity, 100) / 100) * 60 : 0;
  const blipAngle = -35;
  const bx = 90 + blipR * Math.cos((blipAngle * Math.PI) / 180);
  const by = 90 + blipR * Math.sin((blipAngle * Math.PI) / 180);

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="relative h-[168px] w-[168px] shrink-0">
        <svg viewBox="0 0 180 180" className="h-full w-full">
          <defs>
            <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={`rgb(${level.tone})`} stopOpacity="0.14" />
              <stop offset="100%" stopColor={`rgb(${level.tone})`} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="radar-beam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={`rgb(${level.tone})`} stopOpacity="0.5" />
              <stop offset="100%" stopColor={`rgb(${level.tone})`} stopOpacity="0" />
            </linearGradient>
          </defs>

          <circle cx="90" cy="90" r="78" fill="url(#radar-bg)" />
          {[26, 50, 74].map((r) => (
            <circle key={r} cx="90" cy="90" r={r} fill="none" stroke={`rgb(${level.tone})`} strokeOpacity={0.22} />
          ))}
          <line x1="90" y1="12" x2="90" y2="168" stroke={`rgb(${level.tone})`} strokeOpacity={0.15} />
          <line x1="12" y1="90" x2="168" y2="90" stroke={`rgb(${level.tone})`} strokeOpacity={0.15} />

          {/* sweeping beam */}
          <g className="mc-radar-sweep" style={{ transformOrigin: '90px 90px' }}>
            <path d="M90 90 L90 12 A78 78 0 0 1 158 52 Z" fill="url(#radar-beam)" />
            <line x1="90" y1="90" x2="90" y2="12" stroke={`rgb(${level.tone})`} strokeOpacity={0.7} strokeWidth={1.5} />
          </g>

          {/* live blip */}
          {hasBlip && (
            <motion.circle
              cx={bx}
              cy={by}
              r={4}
              fill={`rgb(${level.tone})`}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.5, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ transformOrigin: `${bx}px ${by}px`, filter: `drop-shadow(0 0 6px rgb(${level.tone}))` }}
            />
          )}
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <span
          className="inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-semibold"
          style={{ background: `rgb(${level.tone} / 0.15)`, color: `rgb(${level.tone})` }}
        >
          {level.label}
        </span>
        <div className="text-[11px] text-muted-foreground">
          {running ? 'active incident sweep' : 'no critical threats'}
        </div>
        <div className="mt-1 space-y-1 text-[11px]">
          <Row color="239, 68, 68" label="High" on={severity !== null && severity >= 60} />
          <Row color="245, 158, 11" label="Medium" on={severity !== null && severity >= 30 && severity < 60} />
          <Row color="34, 197, 94" label="Low" on={severity === null || severity < 30} />
        </div>
      </div>
    </div>
  );
}

function Row({ color, label, on }: { color: string; label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: `rgb(${color})`, boxShadow: on ? `0 0 6px rgb(${color})` : undefined, opacity: on ? 1 : 0.3 }}
      />
      <span className={on ? 'text-foreground/80' : ''}>{label}</span>
      {on && <span className="ml-auto text-foreground/60">active</span>}
    </div>
  );
}

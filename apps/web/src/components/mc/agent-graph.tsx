'use client';

import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Coins,
  Landmark,
  Radio,
  ScrollText,
  LineChart,
  Umbrella,
  Lock,
  BrainCircuit,
  type LucideIcon,
} from 'lucide-react';
import type { AgentRole } from '@sentinelos/agents';

interface GNode {
  id: string;
  live: boolean; // wired to the real pipeline
  role: string;
  label: string;
  color: string;
  icon: LucideIcon;
  angle: number; // degrees around the hub
}

const CX = 360;
const CY = 210;
const RX = 262;
const RY = 150;

// 8 agents around the Commander hub. The four "live" ones (Risk, Treasury,
// Governance + the Commander hub) are wired to the real pipeline; the rest are
// roadmap agents rendered dimmer — the same set shown as "Coming in v1".
const NODES: GNode[] = [
  { id: 'Risk', live: true, role: 'Threat scoring', label: 'Risk Agent', color: '#F59E0B', icon: ShieldAlert, angle: 270 },
  { id: 'Governance', live: true, role: 'Proposal', label: 'Governance', color: '#8B5CF6', icon: Landmark, angle: 318 },
  { id: 'Oracle', live: false, role: 'Data feeds', label: 'Oracle', color: '#38BDF8', icon: Radio, angle: 12 },
  { id: 'Compliance', live: false, role: 'Checks', label: 'Compliance', color: '#2DD4BF', icon: ScrollText, angle: 55 },
  { id: 'Analytics', live: false, role: 'Insights', label: 'Analytics', color: '#F97316', icon: LineChart, angle: 90 },
  { id: 'Insurance', live: false, role: 'Coverage', label: 'Insurance', color: '#A78BFA', icon: Umbrella, angle: 125 },
  { id: 'Security', live: false, role: 'Defense', label: 'Security', color: '#EF4444', icon: Lock, angle: 168 },
  { id: 'Treasury', live: true, role: 'Action', label: 'Treasury', color: '#22C55E', icon: Coins, angle: 222 },
];

function pos(angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + RX * Math.cos(rad), y: CY + RY * Math.sin(rad) };
}

export function AgentGraph({
  activeAgent,
  seenAgents,
  running,
}: {
  activeAgent: AgentRole | null;
  seenAgents: Set<AgentRole>;
  running: boolean;
}) {
  return (
    <svg viewBox="0 0 720 440" className="h-full w-full" role="img" aria-label="Live agent network">
      <defs>
        <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#2563EB" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* hub ambient glow */}
      <circle cx={CX} cy={CY} r={150} fill="url(#hub-glow)" opacity={running ? 0.9 : 0.55} />

      {/* rotating orbit rings for depth */}
      <g className="mc-spin-slow" style={{ transformOrigin: `${CX}px ${CY}px` }}>
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#6B7280" strokeOpacity={0.12} strokeDasharray="3 9" />
      </g>
      <g className="mc-spin-slow-rev" style={{ transformOrigin: `${CX}px ${CY}px` }}>
        <ellipse cx={CX} cy={CY} rx={RX * 0.62} ry={RY * 0.62} fill="none" stroke="#6B7280" strokeOpacity={0.1} strokeDasharray="2 10" />
      </g>

      {/* edges + flowing packets */}
      {NODES.map((n, i) => {
        const p = pos(n.angle);
        const isActive = running && n.live && activeAgent === n.id;
        const seen = n.live && seenAgents.has(n.id as AgentRole);
        const baseColor = n.live ? n.color : '#6B7280';
        const edgeOpacity = isActive ? 0.9 : seen ? 0.45 : n.live ? 0.22 : 0.1;

        return (
          <g key={`edge-${n.id}`}>
            <line
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke={baseColor}
              strokeOpacity={edgeOpacity}
              strokeWidth={isActive ? 2.2 : 1.2}
              className={isActive ? 'mc-edge-active' : undefined}
            />
            {/* continuous ambient packet — every edge stays gently alive */}
            <motion.circle
              r={isActive ? 3.4 : 2}
              fill={baseColor}
              fillOpacity={n.live ? 1 : 0.5}
              initial={false}
              animate={{ cx: [CX, p.x], cy: [CY, p.y] }}
              transition={{
                duration: isActive ? 0.9 : n.live ? 2.4 : 3.4,
                repeat: Infinity,
                ease: 'linear',
                delay: (i % 4) * 0.5,
              }}
              style={{ filter: isActive ? `drop-shadow(0 0 5px ${baseColor})` : undefined }}
            />
          </g>
        );
      })}

      {/* agent nodes */}
      {NODES.map((n) => {
        const p = pos(n.angle);
        const Icon = n.icon;
        const isActive = running && n.live && activeAgent === n.id;
        const seen = n.live && seenAgents.has(n.id as AgentRole);
        const bright = isActive || seen || (!running && n.live);
        const ringColor = n.live ? n.color : '#6B7280';
        const ringOpacity = isActive ? 1 : bright ? 0.85 : n.live ? 0.5 : 0.35;

        return (
          <g key={n.id}>
            {/* pulsing halo — strong when active, gentle breathing when live-idle */}
            {(isActive || (!running && n.live)) && (
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={26}
                fill="none"
                stroke={n.color}
                strokeWidth={isActive ? 2 : 1}
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: [0.5, 0], scale: [1, isActive ? 2 : 1.5] }}
                transition={{ duration: isActive ? 1.1 : 2.6, repeat: Infinity, ease: 'easeOut' }}
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={26}
              fill="#0b111d"
              stroke={ringColor}
              strokeOpacity={ringOpacity}
              strokeWidth={isActive ? 2.5 : 1.5}
              style={{ filter: bright ? `drop-shadow(0 0 8px ${n.color}80)` : undefined }}
            />
            <foreignObject x={p.x - 12} y={p.y - 12} width={24} height={24}>
              <div className="flex h-6 w-6 items-center justify-center">
                <Icon width={16} height={16} color={n.color} opacity={n.live ? 1 : 0.55} />
              </div>
            </foreignObject>
            <text x={p.x} y={p.y + 42} textAnchor="middle" fontSize={12} fontWeight={600} fill={n.live ? '#E5E7EB' : '#9CA3AF'}>
              {n.label}
            </text>
            <text x={p.x} y={p.y + 56} textAnchor="middle" fontSize={9} fill="#6B7280">
              {n.live ? n.role : 'v1'}
            </text>
          </g>
        );
      })}

      {/* Commander hub */}
      <motion.circle
        cx={CX}
        cy={CY}
        r={44}
        fill="none"
        stroke="#2563EB"
        strokeWidth={1.5}
        strokeOpacity={0.6}
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      />
      <circle
        cx={CX}
        cy={CY}
        r={40}
        fill="#0b111d"
        stroke="#2563EB"
        strokeWidth={2.5}
        style={{ filter: 'drop-shadow(0 0 14px #2563EBaa)' }}
      />
      <foreignObject x={CX - 16} y={CY - 20} width={32} height={32}>
        <div className="flex h-8 w-8 items-center justify-center">
          <BrainCircuit width={26} height={26} color="#60A8FF" className={running ? 'mc-breathe' : undefined} />
        </div>
      </foreignObject>
      <text x={CX} y={CY + 30} textAnchor="middle" fontSize={12} fontWeight={700} fill="#E5E7EB">
        Commander
      </text>
      <text x={CX} y={CY + 44} textAnchor="middle" fontSize={9} fill="#8AB4F8">
        AI Orchestrator
      </text>
    </svg>
  );
}

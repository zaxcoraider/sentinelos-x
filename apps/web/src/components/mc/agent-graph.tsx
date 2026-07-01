'use client';

import { motion } from 'framer-motion';
import type { AgentRole } from '@sentinelos/agents';

const COLORS: Record<AgentRole, string> = {
  Commander: '#2563EB',
  Risk: '#F59E0B',
  Treasury: '#22C55E',
  Governance: '#8B5CF6',
};
const MUTED = '#6B7280';

interface Node {
  id: AgentRole;
  x: number;
  y: number;
  label: string;
  role: string;
}

const NODES: Node[] = [
  { id: 'Commander', x: 320, y: 74, label: 'Commander', role: 'Orchestrator' },
  { id: 'Risk', x: 150, y: 182, label: 'Risk', role: 'Threat scoring' },
  { id: 'Treasury', x: 320, y: 212, label: 'Treasury', role: 'Action' },
  { id: 'Governance', x: 490, y: 182, label: 'Governance', role: 'Proposal' },
];
const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<AgentRole, Node>;

const ROADMAP: { id: string; x: number; y: number }[] = [
  { id: 'Oracle', x: 108, y: 322 },
  { id: 'Compliance', x: 245, y: 350 },
  { id: 'Analytics', x: 395, y: 350 },
  { id: 'Insurance', x: 532, y: 322 },
];

const EDGES: { from: AgentRole; to: AgentRole }[] = [
  { from: 'Risk', to: 'Commander' },
  { from: 'Commander', to: 'Treasury' },
  { from: 'Treasury', to: 'Governance' },
];

const HUB_LINKS: AgentRole[] = ['Risk', 'Treasury', 'Governance'];

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
    <svg viewBox="0 0 640 400" className="h-full w-full" role="img" aria-label="Live agent network">
      {/* faint orchestration links from the Commander hub */}
      {HUB_LINKS.map((id) => {
        const a = NODE_BY_ID.Commander;
        const b = NODE_BY_ID[id];
        return (
          <line
            key={`hub-${id}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={MUTED}
            strokeOpacity={0.12}
            strokeWidth={1}
          />
        );
      })}

      {/* dim links out to the roadmap ring */}
      {ROADMAP.map((r) => (
        <line
          key={`rl-${r.id}`}
          x1={NODE_BY_ID.Commander.x}
          y1={NODE_BY_ID.Commander.y}
          x2={r.x}
          y2={r.y}
          stroke={MUTED}
          strokeOpacity={0.08}
          strokeWidth={1}
          strokeDasharray="2 5"
        />
      ))}

      {/* main flow edges */}
      {EDGES.map((e) => {
        const a = NODE_BY_ID[e.from];
        const b = NODE_BY_ID[e.to];
        const bothSeen = seenAgents.has(e.from) && seenAgents.has(e.to);
        const isActive = running && activeAgent === e.to && seenAgents.has(e.from);
        const color = COLORS[e.to];
        return (
          <g key={`${e.from}-${e.to}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={bothSeen || isActive ? color : MUTED}
              strokeOpacity={isActive ? 0.9 : bothSeen ? 0.5 : 0.18}
              strokeWidth={isActive ? 2 : 1.5}
              className={isActive ? 'mc-edge-active' : undefined}
            />
            {isActive && (
              <motion.circle
                r={4}
                fill={color}
                initial={{ cx: a.x, cy: a.y }}
                animate={{ cx: [a.x, b.x], cy: [a.y, b.y] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </g>
        );
      })}

      {/* roadmap nodes (greyed — Coming in v1) */}
      {ROADMAP.map((r) => (
        <g key={r.id}>
          <circle cx={r.x} cy={r.y} r={13} fill="#0e1420" stroke={MUTED} strokeOpacity={0.4} strokeWidth={1} />
          <circle cx={r.x} cy={r.y} r={3} fill={MUTED} fillOpacity={0.5} />
          <text x={r.x} y={r.y + 28} textAnchor="middle" fontSize={10} fill={MUTED} fillOpacity={0.7}>
            {r.id}
          </text>
        </g>
      ))}

      {/* live agent nodes */}
      {NODES.map((n) => {
        const color = COLORS[n.id];
        const isActive = activeAgent === n.id;
        const isDone = seenAgents.has(n.id) && !isActive;
        const glow = isActive || (!running && !isDone);
        return (
          <g key={n.id}>
            {/* pulsing halo when active (or gentle breathing at rest) */}
            {glow && (
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={24}
                fill="none"
                stroke={color}
                strokeWidth={isActive ? 2 : 1}
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: [0.5, 0], scale: [1, isActive ? 1.9 : 1.4] }}
                transition={{ duration: isActive ? 1.2 : 2.4, repeat: Infinity, ease: 'easeOut' }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={24}
              fill="#0e1420"
              stroke={color}
              strokeOpacity={isActive ? 1 : isDone ? 0.9 : 0.45}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
            <circle cx={n.x} cy={n.y} r={7} fill={color} fillOpacity={isActive ? 1 : isDone ? 0.9 : 0.35} />
            <text x={n.x} y={n.y + 40} textAnchor="middle" fontSize={12} fontWeight={600} fill="#E5E7EB">
              {n.label}
            </text>
            <text x={n.x} y={n.y + 54} textAnchor="middle" fontSize={9} fill={MUTED}>
              {n.role}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

import {
  Radio,
  ShieldAlert,
  LineChart,
  Compass,
  ScrollText,
  Droplets,
  Coins,
  Umbrella,
  Sprout,
  Users,
  Gavel,
  Landmark,
  type LucideIcon,
} from 'lucide-react';
import type { AgentRole } from '@sentinelos/agents';

export const AGENT_META: Record<AgentRole, { icon: LucideIcon; color: string; text: string; label: string }> = {
  Oracle: { icon: Radio, color: '#38BDF8', text: 'text-sky-400', label: 'Oracle Agent' },
  Risk: { icon: ShieldAlert, color: '#F59E0B', text: 'text-warning', label: 'Risk Agent' },
  Analytics: { icon: LineChart, color: '#F97316', text: 'text-orange-400', label: 'Analytics Agent' },
  Commander: { icon: Compass, color: '#2563EB', text: 'text-primary', label: 'Commander' },
  Compliance: { icon: ScrollText, color: '#2DD4BF', text: 'text-teal-400', label: 'Compliance Agent' },
  Liquidity: { icon: Droplets, color: '#06B6D4', text: 'text-cyan-400', label: 'Liquidity Agent' },
  Treasury: { icon: Coins, color: '#22C55E', text: 'text-success', label: 'Treasury Agent' },
  Insurance: { icon: Umbrella, color: '#A78BFA', text: 'text-violet-300', label: 'Insurance Agent' },
  Growth: { icon: Sprout, color: '#84CC16', text: 'text-lime-400', label: 'Growth Agent' },
  Community: { icon: Users, color: '#EC4899', text: 'text-pink-400', label: 'Community Agent' },
  Legal: { icon: Gavel, color: '#94A3B8', text: 'text-slate-300', label: 'Legal Agent' },
  Governance: { icon: Landmark, color: '#8B5CF6', text: 'text-ai', label: 'Governance Agent' },
};

/** Agents that write their own record_action to Casper (vs. real-analysis-only). */
export const ON_CHAIN_AGENTS: Set<AgentRole> = new Set([
  'Oracle',
  'Risk',
  'Analytics',
  'Commander',
  'Compliance',
  'Liquidity',
  'Treasury',
  'Insurance',
  'Growth',
  'Community',
  'Legal',
  'Governance',
]);

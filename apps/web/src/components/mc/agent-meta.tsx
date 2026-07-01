import { ShieldAlert, Compass, Coins, Landmark, type LucideIcon } from 'lucide-react';
import type { AgentRole } from '@sentinelos/agents';

export const AGENT_META: Record<AgentRole, { icon: LucideIcon; color: string; text: string; label: string }> = {
  Risk: { icon: ShieldAlert, color: '#F59E0B', text: 'text-warning', label: 'Risk Agent' },
  Commander: { icon: Compass, color: '#2563EB', text: 'text-primary', label: 'Commander' },
  Treasury: { icon: Coins, color: '#22C55E', text: 'text-success', label: 'Treasury Agent' },
  Governance: { icon: Landmark, color: '#8B5CF6', text: 'text-ai', label: 'Governance Agent' },
};

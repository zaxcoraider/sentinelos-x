/** A market event the sentinel reacts to (e.g. a stablecoin depeg). */
export interface MarketEvent {
  type: string;
  asset: string;
  /** Fractional deviation from peg, e.g. 0.07 = 7%. */
  deviation?: number;
  [key: string]: unknown;
}

export type AgentRole = 'Risk' | 'Commander' | 'Treasury';

/** One step of the agent pipeline, captured for the UI / demo trace. */
export interface TraceStep {
  agent: AgentRole;
  /** One-line, human-readable summary of what this agent concluded. */
  summary: string;
  /** Structured payload (severity, decision, etc.) for richer rendering. */
  detail: Record<string, unknown>;
  at: string; // ISO timestamp
}

export interface RiskAssessment {
  severity: number; // 0–100
  rationale: string;
}

export interface RouteDecision {
  route: boolean;
  rationale: string;
}

export interface TreasuryDecision {
  action: string; // e.g. "REBALANCE"
  confidence: number; // 0–100
  expectedSavingsUsd: number;
  reasoning: string;
}

export interface OnChainResult {
  txHash: string;
  explorerUrl: string;
}

/** The full structured result of running the sentinel on one event. */
export interface PipelineResult {
  event: MarketEvent;
  severity: number;
  routed: boolean;
  decision: TreasuryDecision | null;
  /** x402 premium-data payment, if one was made before the Treasury decision. */
  x402: import('./x402/client.js').X402Payment | null;
  tx: OnChainResult | null;
  trace: TraceStep[];
}

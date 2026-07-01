/** A market event the sentinel reacts to (e.g. a stablecoin depeg). */
export interface MarketEvent {
  type: string;
  asset: string;
  /** Fractional deviation from peg, e.g. 0.07 = 7%. */
  deviation?: number;
  [key: string]: unknown;
}

export type AgentRole = 'Risk' | 'Commander' | 'Treasury' | 'Governance';

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

/** An emergency governance proposal drafted by the Governance Agent. */
export interface GovernanceProposal {
  /** Short proposal title, e.g. "Emergency: Rebalance USDx reserves". */
  title: string;
  /** One-paragraph summary of the situation and response, for voters. */
  summary: string;
  /** The concrete protocol action to ratify, e.g. "REBALANCE_RESERVES". */
  action: string;
  /** Specific parameter/allocation changes, each a short human-readable line. */
  parameterChanges: string[];
  /** Why the council should approve, grounded in the event + Treasury action. */
  rationale: string;
  /** Emergency voting window, in hours. */
  votingWindowHours: number;
  /** Quorum required to pass, as a percent. */
  quorumPercent: number;
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
  /** Emergency proposal drafted by the Governance Agent for a routed event. */
  governance: GovernanceProposal | null;
  /** On-chain record anchoring the governance proposal, if written. */
  governanceTx: OnChainResult | null;
  trace: TraceStep[];
}

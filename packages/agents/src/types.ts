/** A market event the sentinel reacts to (e.g. a stablecoin depeg). */
export interface MarketEvent {
  type: string;
  asset: string;
  /** Fractional deviation from peg, e.g. 0.07 = 7%. */
  deviation?: number;
  [key: string]: unknown;
}

export type AgentRole =
  | 'Oracle'
  | 'Risk'
  | 'Analytics'
  | 'Commander'
  | 'Compliance'
  | 'Liquidity'
  | 'Treasury'
  | 'Insurance'
  | 'Growth'
  | 'Community'
  | 'Legal'
  | 'Governance';

/** The six domain-advisory agents (real Claude reasoning, no execution). */
export type AdvisoryRole = 'Compliance' | 'Liquidity' | 'Insurance' | 'Growth' | 'Community' | 'Legal';

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
  /** Short proposal title, e.g. "Emergency: Rebalance USDC reserves". */
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

/** Oracle Agent: a deterministic snapshot of the live monitored feed. */
export interface OracleReport {
  stablePriceUsd: number;
  pegDeviation: number; // |1 - price|
  refAsset: string; // e.g. ETH
  refPriceUsd: number;
  ref24hChange: number;
  headline: string;
}

/** Analytics Agent: deterministic anomaly metrics derived from the live feed. */
export interface AnalyticsReport {
  annualizedVol: number;
  regime: string;
  depegProbability24h: number;
  headline: string;
}

/** One domain-advisory agent's assessment of the incident + response. */
export interface AdvisoryAssessment {
  role: AdvisoryRole;
  headline: string;
  assessment: string;
  /** clear = no concern · caution = watch · flag = needs attention. */
  status: 'clear' | 'caution' | 'flag';
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
  /** Oracle Agent's live-feed snapshot (deterministic, from real market data). */
  oracle: OracleReport | null;
  /** Analytics Agent's anomaly metrics (deterministic, from real market data). */
  analytics: AnalyticsReport | null;
  /** Domain-advisory agents' assessments (Compliance, Liquidity, Insurance, Growth, Community, Legal). */
  advisories: AdvisoryAssessment[];
  /** How many agents anchored a real record_action on Casper this run. */
  onChainAgentCount: number;
  trace: TraceStep[];
}

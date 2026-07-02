import { recordAction } from '@sentinelos/casper';
import type {
  AdvisoryAssessment,
  AgentRole,
  AnalyticsReport,
  MarketEvent,
  OnChainResult,
  OracleReport,
  PipelineResult,
  TraceStep,
} from './types.js';
import { assessRisk } from './agents/risk.js';
import { route } from './agents/commander.js';
import { decideTreasury } from './agents/treasury.js';
import { draftProposal } from './agents/governance.js';
import { reportOracle } from './agents/oracle.js';
import { reportAnalytics } from './agents/analytics.js';
import { runAdvisories } from './agents/advisory.js';
import { fetchPremiumData, type VolatilityData, type X402Payment } from './x402/client.js';
import { X402_ENABLED, ADVISORY_ENABLED, AGENTS_ONCHAIN } from './config.js';

const now = () => new Date().toISOString();

export interface RunOptions {
  /** Fire real Casper `record_action` txs for the agents. Default true. */
  live?: boolean;
  /** Called as each agent finishes — lets a UI stream the trace live. */
  onStep?: (step: TraceStep) => void;
}

/** Agents that always anchor on-chain; the rest anchor only when AGENTS_ONCHAIN=all. */
const CORE_ONCHAIN = new Set<string>(['treasury', 'governance']);

/**
 * Runs the SentinelOS incident-response pipeline on one market event. All twelve
 * agents participate: Oracle + Analytics report the real live feed, Risk scores,
 * Commander routes, Treasury acts, six domain-advisory agents weigh in, and
 * Governance ratifies. Every agent that runs anchors its own `record_action` on
 * the TreasuryGuard contract (best-effort, gated by AGENTS_ONCHAIN), so a single
 * incident leaves ~12 verifiable Casper transactions.
 */
export async function runPipeline(
  event: MarketEvent,
  { live = true, onStep }: RunOptions = {},
): Promise<PipelineResult> {
  const trace: TraceStep[] = [];
  const push = (step: TraceStep) => {
    trace.push(step);
    onStep?.(step);
  };

  let onChainAgentCount = 0;
  const shouldAnchor = (agentLower: string) =>
    live && (AGENTS_ONCHAIN === 'all' || CORE_ONCHAIN.has(agentLower));

  /** Best-effort on-chain anchor for an agent. Never throws; returns tx or null. */
  const anchor = async (
    agentLower: string,
    action: string,
    severity: number,
    value: number,
  ): Promise<OnChainResult | null> => {
    if (!shouldAnchor(agentLower)) return null;
    try {
      const res = await recordAction(agentLower, action, Math.round(severity), Math.max(0, Math.round(value)));
      onChainAgentCount++;
      return res;
    } catch {
      return null; // node hiccup → this agent is "analysis only" this run (honest)
    }
  };

  const anchorDetail = (tx: OnChainResult | null, extra: Record<string, unknown> = {}) =>
    tx ? { ...extra, txHash: tx.txHash, explorerUrl: tx.explorerUrl } : extra;
  const anchored = (tx: OnChainResult | null) => (tx ? ' · recorded on Casper' : '');

  // 1. Risk Agent — score the raw event.
  const risk = await assessRisk(event);
  const sev = Math.round(risk.severity);
  {
    const tx = await anchor('risk', 'ASSESS', sev, 0);
    push({
      agent: 'Risk',
      summary: `Severity ${risk.severity}/100 — ${risk.rationale}${anchored(tx)}`,
      detail: anchorDetail(tx, { severity: risk.severity, rationale: risk.rationale }),
      at: now(),
    });
  }

  // 2. Oracle Agent — acquire the live premium feed over x402 and confirm state.
  let volatility: VolatilityData | null = null;
  let x402: X402Payment | null = null;
  let oracle: OracleReport | null = null;
  if (X402_ENABLED) {
    try {
      const premium = await fetchPremiumData();
      volatility = premium.data;
      x402 = premium.payment;
      oracle = reportOracle(event, volatility);
      const paidVia = x402.mode === 'live' ? `live · ${x402.txHash}` : 'stub';
      const viaFac = x402.facilitator ? `, via Casper x402 facilitator (${x402.facilitator.network})` : '';
      const tx = await anchor('oracle', 'FEED_CONFIRMED', sev, Math.round(oracle.pegDeviation * 10000));
      push({
        agent: 'Oracle',
        summary: `${oracle.headline} Premium feed paid over x402 (${paidVia})${viaFac}.${anchored(tx)}`,
        detail: anchorDetail(tx, { oracle, x402, volatility, logs: premium.logs }),
        at: now(),
      });
    } catch (err) {
      push({
        agent: 'Oracle',
        summary: `Premium feed unavailable (${err instanceof Error ? err.message : 'error'}) — proceeding on baseline signals`,
        detail: { skipped: true },
        at: now(),
      });
    }
  }

  // 3. Analytics Agent — quantify the anomaly from the live feed (deterministic).
  let analytics: AnalyticsReport | null = null;
  if (volatility) {
    analytics = reportAnalytics(volatility);
    const tx = await anchor('analytics', 'ANOMALY', sev, Math.round(analytics.depegProbability24h * 100));
    push({
      agent: 'Analytics',
      summary: `${analytics.headline}${anchored(tx)}`,
      detail: anchorDetail(tx, { analytics }),
      at: now(),
    });
  }

  // 4. Commander — route on the severity threshold.
  const routing = route(risk);
  {
    const tx = await anchor('commander', routing.route ? 'ROUTE' : 'MONITOR', sev, 0);
    push({
      agent: 'Commander',
      summary: `${routing.rationale}${anchored(tx)}`,
      detail: anchorDetail(tx, { route: routing.route }),
      at: now(),
    });
  }

  if (!routing.route) {
    return {
      event,
      severity: risk.severity,
      routed: false,
      decision: null,
      x402,
      tx: null,
      governance: null,
      governanceTx: null,
      oracle,
      analytics,
      advisories: [],
      onChainAgentCount,
      trace,
    };
  }

  // 5. Treasury Agent — decide the protective action (informed by the paid data).
  const decision = await decideTreasury(event, risk, volatility);
  const protectedUsd = Math.max(0, Math.round(decision.expectedSavingsUsd));
  let tx: OnChainResult | null = null;
  {
    tx = await anchor('treasury', decision.action, sev, protectedUsd);
    push({
      agent: 'Treasury',
      summary: `${decision.action} (confidence ${decision.confidence}%, ~$${protectedUsd.toLocaleString('en-US')} protected) — ${decision.reasoning}${anchored(tx)}`,
      detail: anchorDetail(tx, { ...decision }),
      at: now(),
    });
  }

  // 6. Domain-advisory agents — the rest of the team weighs in (parallel, fast
  //    model). Each anchors its own assessment on Casper.
  let advisories: AdvisoryAssessment[] = [];
  if (ADVISORY_ENABLED) {
    advisories = await runAdvisories({
      event,
      severity: risk.severity,
      rationale: risk.rationale,
      action: decision.action,
      actionReasoning: decision.reasoning,
      protectedUsd,
      regime: analytics?.regime ?? volatility?.regime ?? 'UNKNOWN',
      annualizedVol: analytics?.annualizedVol ?? volatility?.annualizedVol ?? 0,
    });
    // Anchor sequentially (one account → avoid parallel-submit races), then emit.
    for (const a of advisories) {
      const agentLower = a.role.toLowerCase();
      const action = a.status === 'flag' ? 'FLAGGED' : a.status === 'caution' ? 'CAUTION' : 'CLEARED';
      const atx = await anchor(agentLower, action, sev, 0);
      push({
        agent: a.role as AgentRole,
        summary: `${a.headline} — ${a.assessment}${anchored(atx)}`,
        detail: anchorDetail(atx, { advisory: a }),
        at: now(),
      });
    }
  }

  // 7. Governance Agent — draft an emergency proposal ratifying the response and
  //    anchor it on-chain.
  const governance = await draftProposal(event, risk, decision);
  const governanceTx = await anchor('governance', 'PROPOSAL', sev, protectedUsd);
  push({
    agent: 'Governance',
    summary: `Drafted "${governance.title}" — ${governance.action}, ${governance.quorumPercent}% quorum, ${governance.votingWindowHours}h window${anchored(governanceTx)}`,
    detail: anchorDetail(governanceTx, { ...governance }),
    at: now(),
  });

  return {
    event,
    severity: risk.severity,
    routed: true,
    decision,
    x402,
    tx,
    governance,
    governanceTx,
    oracle,
    analytics,
    advisories,
    onChainAgentCount,
    trace,
  };
}

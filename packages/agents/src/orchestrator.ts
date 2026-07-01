import { recordAction } from '@sentinelos/casper';
import type { MarketEvent, PipelineResult, TraceStep } from './types.js';
import { assessRisk } from './agents/risk.js';
import { route } from './agents/commander.js';
import { decideTreasury } from './agents/treasury.js';
import { draftProposal } from './agents/governance.js';
import { fetchPremiumData, type VolatilityData, type X402Payment } from './x402/client.js';
import { X402_ENABLED } from './config.js';

const now = () => new Date().toISOString();

export interface RunOptions {
  /** Fire a real Casper `record_action` tx when Treasury decides to act. Default true. */
  live?: boolean;
  /** Called as each agent finishes — lets a UI stream the trace live. */
  onStep?: (step: TraceStep) => void;
}

/**
 * Runs the sentinel pipeline on one market event:
 *   Risk scores severity → Commander routes if severity > threshold →
 *   Treasury decides an action and records it on-chain (TreasuryGuard).
 * Returns a structured trace of every agent's reasoning plus the tx (if any).
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

  // 1. Risk Agent — score the event.
  const risk = await assessRisk(event);
  push({
    agent: 'Risk',
    summary: `Severity ${risk.severity}/100 — ${risk.rationale}`,
    detail: { severity: risk.severity, rationale: risk.rationale },
    at: now(),
  });

  // 2. Commander — route on the severity threshold.
  const routing = route(risk);
  push({
    agent: 'Commander',
    summary: routing.rationale,
    detail: { route: routing.route },
    at: now(),
  });

  if (!routing.route) {
    return {
      event,
      severity: risk.severity,
      routed: false,
      decision: null,
      x402: null,
      tx: null,
      governance: null,
      governanceTx: null,
      trace,
    };
  }

  // 3. Treasury buys premium data via x402 (best-effort — the loop proceeds
  //    without it if the feed is down, so qualification never depends on x402).
  let volatility: VolatilityData | null = null;
  let x402: X402Payment | null = null;
  if (X402_ENABLED) {
    try {
      const premium = await fetchPremiumData();
      volatility = premium.data;
      x402 = premium.payment;
      const paidVia = x402.mode === 'live' ? `live · ${x402.txHash}` : 'stub';
      push({
        agent: 'Treasury',
        summary: `Bought premium volatility data via x402 (${paidVia}) — annualized vol ${(volatility.annualizedVol * 100).toFixed(0)}%, regime ${volatility.regime}`,
        detail: { x402, volatility, logs: premium.logs },
        at: now(),
      });
    } catch (err) {
      push({
        agent: 'Treasury',
        summary: `Premium data unavailable (${err instanceof Error ? err.message : 'error'}) — proceeding without it`,
        detail: { skipped: true },
        at: now(),
      });
    }
  }

  // 4. Treasury Agent — decide the protective action (informed by the paid data).
  const decision = await decideTreasury(event, risk, volatility);
  push({
    agent: 'Treasury',
    summary: `${decision.action} (confidence ${decision.confidence}%, ~$${Math.round(decision.expectedSavingsUsd).toLocaleString()} protected) — ${decision.reasoning}`,
    detail: { ...decision },
    at: now(),
  });

  // 5. Record the decision on-chain.
  let tx = null;
  const protectedUsd = Math.max(0, Math.round(decision.expectedSavingsUsd));
  if (live) {
    const result = await recordAction('treasury', decision.action, Math.round(risk.severity), protectedUsd);
    tx = result;
    push({
      agent: 'Treasury',
      summary: `Recorded on Casper — ${result.txHash}`,
      detail: { txHash: result.txHash, explorerUrl: result.explorerUrl },
      at: now(),
    });
  }

  // 6. Governance Agent — draft an emergency proposal ratifying the response,
  //    then anchor it on-chain so it's a verifiable artifact (not just a doc).
  const governance = await draftProposal(event, risk, decision);
  push({
    agent: 'Governance',
    summary: `Drafted "${governance.title}" — ${governance.action}, ${governance.quorumPercent}% quorum, ${governance.votingWindowHours}h window`,
    detail: { ...governance },
    at: now(),
  });

  let governanceTx = null;
  if (live) {
    const result = await recordAction('governance', 'PROPOSAL', Math.round(risk.severity), protectedUsd);
    governanceTx = result;
    push({
      agent: 'Governance',
      summary: `Proposal anchored on Casper — ${result.txHash}`,
      detail: { txHash: result.txHash, explorerUrl: result.explorerUrl },
      at: now(),
    });
  }

  return { event, severity: risk.severity, routed: true, decision, x402, tx, governance, governanceTx, trace };
}

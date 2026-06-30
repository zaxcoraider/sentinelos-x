import * as z from 'zod/v4';
import { reason } from '../llm.js';
import type { MarketEvent, RiskAssessment, TreasuryDecision } from '../types.js';
import type { VolatilityData } from '../x402/client.js';

const TreasurySchema = z.object({
  action: z
    .string()
    .describe('The treasury action to take, e.g. "REBALANCE", "HEDGE", "HOLD".'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Confidence in this action, 0–100.'),
  expectedSavingsUsd: z
    .number()
    .describe('Estimated USD value protected or saved by acting now.'),
  reasoning: z
    .string()
    .describe('One or two sentences justifying the action.'),
});

const SYSTEM = `You are the Treasury Agent in SentinelOS, an autonomous operating system for on-chain treasuries.
The Risk Agent has flagged a high-severity event and the Commander has routed it to you.
Decide the single best treasury action to protect the protocol. For a stablecoin depeg or liquidity shock, REBALANCE is usually correct.
Give a confidence score and a realistic estimate of USD protected. Be concrete and decisive.`;

/** Treasury Agent: decides the protective action for a routed, high-severity event. */
export async function decideTreasury(
  event: MarketEvent,
  risk: RiskAssessment,
  volatility?: VolatilityData | null,
): Promise<TreasuryDecision> {
  const premium = volatility
    ? `\n\nPremium volatility feed (paid for via x402): annualized vol ${(volatility.annualizedVol * 100).toFixed(0)}%, regime ${volatility.regime}` +
      (volatility.depegProbability24h != null
        ? `, 24h depeg probability ${(volatility.depegProbability24h * 100).toFixed(0)}%`
        : '') +
      (volatility.recommendation ? `. Feed recommendation: ${volatility.recommendation}` : '')
    : '';
  const user = `Event:\n${JSON.stringify(event, null, 2)}\n\nRisk Agent assessment: severity ${risk.severity}/100 — ${risk.rationale}${premium}\n\nDecide the treasury action.`;
  return reason('TreasuryDecision', TreasurySchema, SYSTEM, user);
}

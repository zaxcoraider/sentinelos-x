import * as z from 'zod/v4';
import { reason } from '../llm.js';
import type { MarketEvent, RiskAssessment } from '../types.js';

const RiskSchema = z.object({
  severity: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall risk severity for the treasury, 0 (benign) to 100 (critical).'),
  rationale: z
    .string()
    .describe('One or two sentences explaining the score, grounded in the event.'),
});

const SYSTEM = `You are the Risk Agent in SentinelOS, an autonomous operating system that protects on-chain treasuries.
You assess a single market event and score the risk it poses to a protocol treasury.
Be decisive and calibrated: a small, transient deviation is low severity; a large stablecoin depeg or a major liquidity/whale shock is high severity (>60) and warrants action.
Score only the risk — do not decide what to do about it.`;

/** Risk Agent: scores a market event's severity (0–100) with a short rationale. */
export async function assessRisk(event: MarketEvent): Promise<RiskAssessment> {
  const user = `Assess this market event:\n${JSON.stringify(event, null, 2)}`;
  return reason('RiskAssessment', RiskSchema, SYSTEM, user);
}

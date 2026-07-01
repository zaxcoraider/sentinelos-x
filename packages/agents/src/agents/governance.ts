import * as z from 'zod/v4';
import { reason } from '../llm.js';
import type { MarketEvent, RiskAssessment, TreasuryDecision, GovernanceProposal } from '../types.js';

const GovernanceSchema = z.object({
  title: z
    .string()
    .describe('Short emergency-proposal title, e.g. "Emergency: Rebalance USDx reserves".'),
  summary: z
    .string()
    .describe('One-paragraph summary of the situation and proposed response, written for voters.'),
  action: z
    .string()
    .describe('The concrete protocol action to ratify, e.g. "REBALANCE_RESERVES", "RAISE_COLLATERAL_RATIO".'),
  parameterChanges: z
    .array(z.string())
    .describe('Specific parameter or allocation changes to enact, each a short human-readable line.'),
  rationale: z
    .string()
    .describe('One or two sentences on why the council should approve, grounded in the event and Treasury action.'),
  votingWindowHours: z
    .number()
    .min(1)
    .max(168)
    .describe('Emergency voting window in hours — short for a critical event.'),
  quorumPercent: z
    .number()
    .min(1)
    .max(100)
    .describe('Quorum required to pass, as a percent of voting power.'),
});

const SYSTEM = `You are the Governance Agent in SentinelOS, an autonomous operating system for on-chain treasuries.
An event has been scored high-severity by Risk and the Treasury Agent has already taken a protective action.
Your job is to draft a concise EMERGENCY GOVERNANCE PROPOSAL that formally ratifies and extends that response so the DAO can vote.
Be decisive: a critical depeg warrants a short voting window (e.g. 6–24h) and a realistic quorum. Ground every field in the actual event and the Treasury decision.`;

/**
 * Governance Agent: drafts an emergency proposal that ratifies the Treasury
 * response, so the council can vote. Runs only for routed, high-severity events.
 */
export async function draftProposal(
  event: MarketEvent,
  risk: RiskAssessment,
  decision: TreasuryDecision,
): Promise<GovernanceProposal> {
  const user =
    `Event:\n${JSON.stringify(event, null, 2)}\n\n` +
    `Risk assessment: severity ${risk.severity}/100 — ${risk.rationale}\n\n` +
    `Treasury action already taken: ${decision.action} (confidence ${decision.confidence}%, ` +
    `~$${Math.round(decision.expectedSavingsUsd).toLocaleString()} protected) — ${decision.reasoning}\n\n` +
    `Draft the emergency governance proposal.`;
  return reason('GovernanceProposal', GovernanceSchema, SYSTEM, user);
}

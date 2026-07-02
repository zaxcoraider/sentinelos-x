import * as z from 'zod/v4';
import { reason } from '../llm.js';
import { AGENT_FAST_MODEL } from '../config.js';
import type { AdvisoryAssessment, AdvisoryRole, MarketEvent } from '../types.js';

/** Everything an advisory agent needs to reason about the live incident. */
export interface AdvisoryContext {
  event: MarketEvent;
  severity: number;
  rationale: string;
  action: string;
  actionReasoning: string;
  protectedUsd: number;
  regime: string;
  annualizedVol: number;
}

const AdvisorySchema = z.object({
  headline: z.string().describe('A punchy one-line finding (max ~12 words).'),
  assessment: z.string().describe('One or two sentences of concrete, domain-specific analysis.'),
  status: z
    .enum(['clear', 'caution', 'flag'])
    .describe('clear = no concern; caution = watch closely; flag = needs attention before/after acting.'),
});

/** Each advisory agent's persona — its domain lens on the same incident. */
const PERSONAS: Record<AdvisoryRole, string> = {
  Compliance: `You are the Compliance Agent in SentinelOS. Review the Treasury's protective action against protocol policy and regulatory expectations (sanctioned-asset exposure, disclosure obligations, risk limits). Decide if the action is policy-clear or needs a flag. Be specific and terse.`,
  Liquidity: `You are the Liquidity Agent in SentinelOS. Assess whether the protective action can be executed without excessive slippage given current market depth, and whether liquidity conditions worsen the incident. Be specific and terse.`,
  Insurance: `You are the Insurance Agent in SentinelOS. Assess reserve/coverage adequacy against the exposure implied by this incident, and whether any coverage or payout logic should be readied. Be specific and terse.`,
  Growth: `You are the Growth Agent in SentinelOS. Assess the incident's impact on TVL/user retention and what incentive or messaging response protects growth without adding risk. Be specific and terse.`,
  Community: `You are the Community Agent in SentinelOS. Predict community sentiment to this incident + response and recommend the communications posture (what to say, how fast). Be specific and terse.`,
  Legal: `You are the Legal Agent in SentinelOS. Assess legal/entity exposure from the incident and the response (disclosures, member liability, jurisdictional flags). Be specific and terse.`,
};

const ROLES: AdvisoryRole[] = ['Compliance', 'Liquidity', 'Insurance', 'Growth', 'Community', 'Legal'];

function contextPrompt(role: AdvisoryRole, c: AdvisoryContext): string {
  return (
    `Incident: ${JSON.stringify(c.event)}\n` +
    `Risk severity: ${c.severity}/100 — ${c.rationale}\n` +
    `Market regime: ${c.regime} (annualized vol ${(c.annualizedVol * 100).toFixed(0)}%)\n` +
    `Treasury's chosen action: ${c.action} — ${c.actionReasoning} (~$${Math.round(c.protectedUsd).toLocaleString()} protected)\n\n` +
    `Give your ${role} assessment of this incident and the response.`
  );
}

/** Run one advisory agent (fast model). Throws on model/parse failure. */
async function runOne(role: AdvisoryRole, c: AdvisoryContext): Promise<AdvisoryAssessment> {
  const out = await reason(`Advisory${role}`, AdvisorySchema, PERSONAS[role], contextPrompt(role, c), {
    model: AGENT_FAST_MODEL,
    maxTokens: 700,
  });
  return { role, ...out };
}

/**
 * Runs all six domain-advisory agents in PARALLEL on the fast model. Best-effort
 * per agent — one failing never blocks the others. `onResult` fires as each
 * finishes (in completion order) so the UI can stream them live. Resolves to the
 * successful assessments in role order.
 */
export async function runAdvisories(
  c: AdvisoryContext,
  onResult?: (a: AdvisoryAssessment) => void,
): Promise<AdvisoryAssessment[]> {
  const settled = await Promise.all(
    ROLES.map((role) =>
      runOne(role, c)
        .then((a) => {
          onResult?.(a);
          return a;
        })
        .catch(() => null),
    ),
  );
  return settled.filter((a): a is AdvisoryAssessment => a !== null);
}

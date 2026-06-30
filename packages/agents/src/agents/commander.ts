import { ROUTE_THRESHOLD } from '../config.js';
import type { RiskAssessment, RouteDecision } from '../types.js';

/**
 * Commander Agent: the orchestrator. It does not re-judge the risk — it routes.
 * Deterministic by design (a threshold gate) so the control flow is reliable and
 * auditable; the LLM agents do the reasoning around it.
 */
export function route(risk: RiskAssessment): RouteDecision {
  if (risk.severity > ROUTE_THRESHOLD) {
    return {
      route: true,
      rationale: `Severity ${risk.severity} exceeds the ${ROUTE_THRESHOLD} action threshold — waking the Treasury Agent to respond.`,
    };
  }
  return {
    route: false,
    rationale: `Severity ${risk.severity} is at or below the ${ROUTE_THRESHOLD} threshold — monitoring, no treasury action needed.`,
  };
}

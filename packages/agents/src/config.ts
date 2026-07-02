import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// repo root is three levels up from packages/agents/src
export const REPO_ROOT = resolve(__dirname, '../../..');

loadEnv({ path: resolve(REPO_ROOT, '.env') });

/**
 * Default to the latest, most capable Claude model. Overridable via AGENT_MODEL.
 * Through a gateway the id is namespaced, e.g. `anthropic/claude-opus-4.8` on DGrid.
 */
export const AGENT_MODEL = process.env.AGENT_MODEL ?? 'claude-opus-4-8';

/**
 * Optional base URL for an Anthropic-compatible gateway (e.g. DGrid:
 * https://api.dgrid.ai). When set, the agents call Claude through it instead of
 * api.anthropic.com. Also honours the SDK-standard ANTHROPIC_BASE_URL.
 */
export const AGENT_BASE_URL = process.env.AGENT_BASE_URL ?? process.env.ANTHROPIC_BASE_URL ?? '';

/**
 * How to present the key: `x-api-key` (native Anthropic) or `bearer`
 * (Authorization: Bearer — what OpenAI-style gateways like DGrid expect).
 * Defaults to bearer whenever a gateway base URL is set.
 */
export const AGENT_AUTH_STYLE = (process.env.AGENT_AUTH_STYLE ?? (AGENT_BASE_URL ? 'bearer' : 'x-api-key')) as
  | 'bearer'
  | 'x-api-key';

/**
 * Adaptive thinking sharpens the agents' judgement but adds latency. On by
 * default for believable reasoning; set AGENT_THINKING=off for a snappier demo.
 */
export const AGENT_THINKING = (process.env.AGENT_THINKING ?? 'adaptive') !== 'off';

/** Effort governs depth vs token spend (low|medium|high|max). */
export const AGENT_EFFORT = (process.env.AGENT_EFFORT ?? 'medium') as
  | 'low'
  | 'medium'
  | 'high'
  | 'max';

/**
 * Faster/cheaper model for the 6 domain-advisory agents (Compliance, Liquidity,
 * Insurance, Growth, Community, Legal) — they run in parallel, so a lighter
 * model keeps latency + spend down. Defaults to AGENT_MODEL if unset; on DGrid
 * set e.g. AGENT_FAST_MODEL=anthropic/claude-haiku-4.5.
 */
export const AGENT_FAST_MODEL = process.env.AGENT_FAST_MODEL ?? AGENT_MODEL;

/** Run the 6 domain-advisory agents. Off → just the 6 core/data agents. */
export const ADVISORY_ENABLED = (process.env.ADVISORY_ENABLED ?? 'true') !== 'false';

/**
 * Which agents anchor a real record_action on Casper:
 *   'all'  → every agent that runs writes its own on-chain proof (the demo).
 *   'core' → only Treasury + Governance write (cheap/fast; e.g. Vercel's 60s).
 */
export const AGENTS_ONCHAIN = (process.env.AGENTS_ONCHAIN ?? 'all') === 'core' ? 'core' : 'all';

/** Commander routes the event to Treasury only when Risk severity exceeds this. */
export const ROUTE_THRESHOLD = Number(process.env.AGENT_ROUTE_THRESHOLD ?? 60);

// --- x402 premium-data leg ---
/**
 * URL of the x402-gated premium feed. Local dev → the standalone
 * services/premium-data server; on Vercel → the deployment's own /api/premium
 * route (no standalone server on serverless). Overridable via PREMIUM_DATA_URL.
 */
export const PREMIUM_DATA_URL =
  process.env.PREMIUM_DATA_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/premium`
    : 'http://localhost:4021/volatility');
/** stub = no on-chain settlement (demo-safe); live = real CSPR transfer. */
export const X402_MODE = (process.env.X402_MODE ?? 'stub') === 'live' ? 'live' : 'stub';
/** Whether Treasury fetches premium data before deciding. Off → pure Phase-4 path. */
export const X402_ENABLED = (process.env.X402_ENABLED ?? 'true') !== 'false';

// --- Official Casper x402 facilitator (make-software / CSPR.cloud) ---
/** Base URL of the hosted x402 facilitator that verifies + settles payments. */
export const FACILITATOR_URL = (
  process.env.X402_FACILITATOR_URL ?? 'https://x402-facilitator.cspr.cloud'
).replace(/\/$/, '');
/** CSPR.cloud access token — authenticates every facilitator call. */
export const FACILITATOR_API_KEY = process.env.CSPR_CLOUD_API_KEY ?? '';
/**
 * Confirm payment support against the real hosted facilitator during the x402
 * handshake. On by default; set X402_FACILITATOR=off to skip the network call.
 */
export const X402_FACILITATOR_ENABLED = (process.env.X402_FACILITATOR ?? 'on') !== 'off';

export function requireApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      'Missing ANTHROPIC_API_KEY — add it to .env (the agents call Claude). ' +
        'Get a key at https://console.anthropic.com/ → API Keys.',
    );
  }
  return key;
}

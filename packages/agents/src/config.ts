import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// repo root is three levels up from packages/agents/src
export const REPO_ROOT = resolve(__dirname, '../../..');

loadEnv({ path: resolve(REPO_ROOT, '.env') });

/** Default to the latest, most capable Claude model. Overridable via AGENT_MODEL. */
export const AGENT_MODEL = process.env.AGENT_MODEL ?? 'claude-opus-4-8';

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

/** Commander routes the event to Treasury only when Risk severity exceeds this. */
export const ROUTE_THRESHOLD = Number(process.env.AGENT_ROUTE_THRESHOLD ?? 60);

// --- x402 premium-data leg ---
/** URL of the x402-gated premium volatility feed (services/premium-data). */
export const PREMIUM_DATA_URL = process.env.PREMIUM_DATA_URL ?? 'http://localhost:4021/volatility';
/** stub = no on-chain settlement (demo-safe); live = real CSPR transfer. */
export const X402_MODE = (process.env.X402_MODE ?? 'stub') === 'live' ? 'live' : 'stub';
/** Whether Treasury fetches premium data before deciding. Off → pure Phase-4 path. */
export const X402_ENABLED = (process.env.X402_ENABLED ?? 'true') !== 'false';

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

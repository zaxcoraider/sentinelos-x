// Client for the OFFICIAL Casper x402 facilitator (make-software / CSPR.cloud).
//
// The facilitator is the piece the buildathon judges shipped: it verifies an
// EIP-712 payment authorization and settles it on-chain by calling the CEP-18
// `transfer_with_authorization` entry point — and pays the gas itself (each
// supported network advertises its own `feePayer`). We talk to the HOSTED
// instance at x402-facilitator.cspr.cloud, authenticated with our CSPR.cloud
// key, so we don't have to run a facilitator ourselves.
//
// Docs: https://docs.cspr.cloud/x402-facilitator-api/reference
// Ref impl: https://github.com/make-software/casper-x402
import { FACILITATOR_URL, FACILITATOR_API_KEY } from '../config.js';

/** One supported (scheme, network) pair as returned by GET /supported. */
export interface FacilitatorKind {
  x402Version: number;
  scheme: string;
  network: string; // CAIP-2, e.g. "casper:casper-test"
  extra?: { feePayer?: string; [k: string]: unknown };
}

export interface SupportedResponse {
  kinds: FacilitatorKind[];
  extensions: unknown[];
  signers: Record<string, string[]>;
}

/** The facilitator support we resolved for our payment's network + scheme. */
export interface FacilitatorSupport {
  url: string;
  network: string; // CAIP-2 network the facilitator confirmed
  scheme: string;
  x402Version: number;
  feePayer?: string; // account that pays settlement gas on-chain
}

/** Map our wire network id ("casper-test") to the facilitator's CAIP-2 id. */
export function toCaip2(network: string): string {
  return network.startsWith('casper:') ? network : `casper:${network}`;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { accept: 'application/json' };
  if (FACILITATOR_API_KEY) h.authorization = FACILITATOR_API_KEY;
  return h;
}

/**
 * GET /supported — the payment schemes/networks the facilitator settles, each
 * with the `feePayer` that funds settlement gas. Authenticated. Throws on a
 * non-200 so callers can treat the facilitator as best-effort.
 */
export async function getSupported(): Promise<SupportedResponse> {
  const res = await fetch(`${FACILITATOR_URL}/supported`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`facilitator /supported returned HTTP ${res.status}`);
  return (await res.json()) as SupportedResponse;
}

/**
 * Confirms the OFFICIAL facilitator settles our payment's scheme + network and
 * returns the on-chain feePayer it would use. Best-effort: returns null (never
 * throws) so the payment path degrades gracefully if the facilitator is down.
 */
export async function resolveFacilitatorSupport(
  network: string,
  scheme = 'exact',
): Promise<FacilitatorSupport | null> {
  const caip2 = toCaip2(network);
  try {
    const supported = await getSupported();
    const kind = supported.kinds.find((k) => k.network === caip2 && k.scheme === scheme);
    if (!kind) return null;
    return {
      url: FACILITATOR_URL,
      network: kind.network,
      scheme: kind.scheme,
      x402Version: kind.x402Version,
      feePayer: kind.extra?.feePayer,
    };
  } catch {
    return null;
  }
}

// ---- /verify + /settle -------------------------------------------------------
// The production settlement path: the client signs an EIP-712 PaymentPayload
// over our CEP-18 asset (SentinelOS Credit, deployed from the official
// Cep18X402.wasm) and the facilitator verifies it, then settles by submitting
// `transfer_with_authorization` on-chain — paying the gas itself (feePayer).

export interface VerifyResponse {
  isValid: boolean;
  payer?: string;
  invalidReason?: string;
  invalidMessage?: string;
  [k: string]: unknown;
}

export interface SettleResponse {
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  errorReason?: string;
  [k: string]: unknown;
}

async function facilitatorPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${FACILITATOR_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // Surface the facilitator's error body — it names the invalid field, which
    // is the only way to debug a rejected payload.
    const detail = await res.text().catch(() => '');
    throw new Error(`facilitator ${path} returned HTTP ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
  }
  return (await res.json()) as T;
}

/** POST /verify — validate an EIP-712 PaymentPayload without settling. */
export function verifyPayment(
  paymentPayload: unknown,
  paymentRequirements: unknown,
): Promise<VerifyResponse> {
  return facilitatorPost<VerifyResponse>('/verify', { paymentPayload, paymentRequirements });
}

/** POST /settle — verify and settle the payment on Casper (moves CEP-18 WCSPR). */
export function settlePayment(
  paymentPayload: unknown,
  paymentRequirements: unknown,
): Promise<SettleResponse> {
  return facilitatorPost<SettleResponse>('/settle', { paymentPayload, paymentRequirements });
}

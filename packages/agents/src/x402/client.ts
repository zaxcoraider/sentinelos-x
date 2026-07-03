import { transferCspr, PUBLIC_KEY_HEX } from '@sentinelos/casper';
import { PREMIUM_DATA_URL, X402_MODE, X402_FACILITATOR_ENABLED } from '../config.js';
import { resolveFacilitatorSupport, type FacilitatorSupport } from './facilitator.js';

export interface VolatilityData {
  asset: string;
  annualizedVol: number;
  regime: string;
  depegProbability24h?: number;
  recommendation?: string;
  source: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface X402Payment {
  mode: 'stub' | 'live';
  amountMotes: string;
  payTo: string;
  txHash: string;
  explorerUrl?: string;
  /** Present when the official hosted facilitator confirmed it settles this scheme+network. */
  facilitator?: FacilitatorSupport | null;
}

export interface PremiumDataResult {
  data: VolatilityData;
  payment: X402Payment;
  logs: string[];
}

const encodePayment = (p: unknown): string => Buffer.from(JSON.stringify(p)).toString('base64');

/**
 * Performs the x402 handshake against the premium-data feed:
 *   GET → 402 paymentRequirements → settle (stub or real CSPR transfer) →
 *   retry with the X-PAYMENT proof → receive the data.
 * Throws if the feed is unreachable or rejects payment (callers should treat
 * x402 as best-effort and proceed without premium data on failure).
 */
export async function fetchPremiumData(): Promise<PremiumDataResult> {
  const logs: string[] = [];

  const first = await fetch(PREMIUM_DATA_URL);
  if (first.status === 200) {
    logs.push('Feed returned data without requiring payment.');
    return {
      data: (await first.json()) as VolatilityData,
      payment: { mode: X402_MODE, amountMotes: '0', payTo: '', txHash: 'none' },
      logs,
    };
  }
  if (first.status !== 402) throw new Error(`premium feed returned HTTP ${first.status}`);

  const challenge = (await first.json()) as { accepts?: Array<Record<string, string>> };
  const req = challenge.accepts?.[0];
  if (!req) throw new Error('402 response missing paymentRequirements');
  logs.push(`402 Payment Required — ${req.maxAmountRequired} motes to ${req.payTo.slice(0, 12)}…`);

  // Confirm the OFFICIAL hosted Casper x402 facilitator settles this scheme +
  // network (authenticated /supported). Best-effort — the payment still settles
  // if the facilitator is unreachable, so the loop never depends on it.
  let facilitator: FacilitatorSupport | null = null;
  if (X402_FACILITATOR_ENABLED) {
    facilitator = await resolveFacilitatorSupport(req.network, req.scheme);
    if (facilitator) {
      logs.push(
        `Casper x402 facilitator confirmed: ${facilitator.scheme} scheme on ${facilitator.network}` +
          (facilitator.feePayer ? ` (settlement feePayer ${facilitator.feePayer.slice(0, 10)}…)` : ''),
      );
    } else {
      logs.push('Casper x402 facilitator unavailable — settling directly.');
    }
  }

  let txHash: string;
  let explorerUrl: string | undefined;
  const stubSettle = (reason: string): string => {
    const h = `stub-${Date.now().toString(16)}`;
    logs.push(`${reason} — ${h}`);
    return h;
  };
  // The feed's default payTo is our OWN key (self-settlement demo). Casper's mint
  // rejects a transfer to the same purse ("Invalid purse") and still burns gas, so
  // never attempt a real self-transfer — settle it as a stub. Set X402_PAY_TO to a
  // distinct account to get a real on-chain settlement.
  const isSelfPay = !!PUBLIC_KEY_HEX && req.payTo.toLowerCase() === PUBLIC_KEY_HEX.toLowerCase();
  if (X402_MODE === 'live' && !isSelfPay) {
    logs.push('Settling on Casper (native CSPR transfer)…');
    try {
      const settle = await transferCspr(req.maxAmountRequired, { targetPublicKeyHex: req.payTo });
      txHash = settle.txHash;
      explorerUrl = settle.explorerUrl;
      logs.push(`Settled on-chain — ${txHash}`);
    } catch (err) {
      // Fail-soft: a settlement failure must not abort the whole x402 fetch — keep
      // the real premium data and fall back to a stub hash.
      txHash = stubSettle(`Settlement failed (${err instanceof Error ? err.message : 'error'}) — stub settlement`);
    }
  } else if (X402_MODE === 'live') {
    txHash = stubSettle('Self-payee — skipping self-transfer, stub settlement (set X402_PAY_TO for a real one)');
  } else {
    txHash = stubSettle('Stub settlement (no chain spend)');
  }

  const proof = {
    x402Version: 1,
    scheme: req.scheme,
    network: req.network,
    payload: { txHash, amountMotes: req.maxAmountRequired },
  };
  const retry = await fetch(PREMIUM_DATA_URL, { headers: { 'x-payment': encodePayment(proof) } });
  if (retry.status !== 200) throw new Error(`feed rejected payment (HTTP ${retry.status})`);

  logs.push('Premium data unlocked.');
  return {
    data: (await retry.json()) as VolatilityData,
    payment: { mode: X402_MODE, amountMotes: req.maxAmountRequired, payTo: req.payTo, txHash, explorerUrl, facilitator },
    logs,
  };
}

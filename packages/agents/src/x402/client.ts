import { transferCspr } from '@sentinelos/casper';
import { PREMIUM_DATA_URL, X402_MODE } from '../config.js';

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

  let txHash: string;
  let explorerUrl: string | undefined;
  if (X402_MODE === 'live') {
    logs.push('Settling on Casper (native CSPR transfer)…');
    const settle = await transferCspr(req.maxAmountRequired, { targetPublicKeyHex: req.payTo });
    txHash = settle.txHash;
    explorerUrl = settle.explorerUrl;
    logs.push(`Settled on-chain — ${txHash}`);
  } else {
    txHash = `stub-${Date.now().toString(16)}`;
    logs.push(`Stub settlement (no chain spend) — ${txHash}`);
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
    payment: { mode: X402_MODE, amountMotes: req.maxAmountRequired, payTo: req.payTo, txHash, explorerUrl },
    logs,
  };
}

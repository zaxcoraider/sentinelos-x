// x402-gated premium market feed as a serverless route (so the x402 leg works
// on Vercel where the standalone services/premium-data server can't run).
// Protocol: GET → 402 + paymentRequirements; GET w/ X-PAYMENT → 200 + real
// CoinGecko-backed analytics.
//
// Two payment rails, advertised in preference order:
//  1. CEP-18 via the OFFICIAL hosted Casper x402 facilitator — the client sends
//     an EIP-712-signed transfer_with_authorization payload; we POST it to the
//     facilitator's /verify then /settle, which submits the token transfer
//     on-chain and pays the gas. Fees settle into the TreasuryGuard package.
//  2. Legacy trusted settlement (stub or a native-transfer hash) — kept so the
//     stub/demo mode and older clients still work.
import { getVolatilityPayload, fallbackPayload } from '@/lib/market-analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // facilitator settlement waits for on-chain finality

const CHAIN = process.env.CASPER_CHAIN_NAME ?? 'casper-test';
const PRICE_MOTES = process.env.X402_PRICE_MOTES ?? '2500000000';
const LEGACY_PAY_TO = process.env.X402_PAY_TO ?? process.env.CASPER_PUBLIC_KEY_HEX ?? 'REPLACE_MERCHANT_PUBLIC_KEY';

// CEP-18 facilitator rail (active when the asset is configured)
const ASSET_PACKAGE = (process.env.X402_ASSET_PACKAGE ?? '').replace(/^hash-/, '');
const ASSET_NAME = process.env.X402_ASSET_NAME ?? 'SentinelOS Credit';
const PAY_TO_ADDRESS = process.env.X402_PAY_TO_ADDRESS ?? ''; // "00"+account-hash or "01"+package-hash
const FACILITATOR_URL = (process.env.X402_FACILITATOR_URL ?? 'https://x402-facilitator.cspr.cloud').replace(/\/$/, '');
const FACILITATOR_API_KEY = process.env.CSPR_CLOUD_API_KEY ?? '';

const cep18Enabled = () => !!ASSET_PACKAGE && !!PAY_TO_ADDRESS && !!FACILITATOR_API_KEY;

/** The facilitator-settled CEP-18 requirement. One canonical object — the same
 *  shape is advertised in the 402 and passed to /verify + /settle, so the
 *  client's `accepted` echo always matches what we ask the facilitator to check. */
function cep18Requirements() {
  return {
    scheme: 'exact',
    network: `casper:${CHAIN}`,
    amount: PRICE_MOTES,
    asset: ASSET_PACKAGE,
    payTo: PAY_TO_ADDRESS,
    maxTimeoutSeconds: 300,
    resource: '/api/premium',
    description: 'SentinelOS premium market feed (real-time volatility + peg)',
    mimeType: 'application/json',
    extra: { name: ASSET_NAME, version: '1', symbol: 'SOSC', decimals: '9' },
  };
}

/** Legacy trusted-settlement requirement (v1 wire shape). */
function legacyRequirements() {
  return {
    scheme: 'exact',
    network: CHAIN,
    maxAmountRequired: PRICE_MOTES,
    resource: '/api/premium',
    description: 'SentinelOS premium market feed (real-time volatility + peg)',
    mimeType: 'application/json',
    payTo: LEGACY_PAY_TO,
    maxTimeoutSeconds: 120,
    asset: 'CSPR',
    extra: { decimals: 9 },
  };
}

function accepts() {
  return cep18Enabled() ? [cep18Requirements(), legacyRequirements()] : [legacyRequirements()];
}

function paymentRequired(error: string, status = 402) {
  return Response.json({ x402Version: 2, error, accepts: accepts() }, { status });
}

interface DecodedPayment {
  x402Version?: number;
  payload?: {
    txHash?: string;
    amountMotes?: string;
    signature?: string;
    publicKey?: string;
    authorization?: Record<string, string>;
  };
  [k: string]: unknown;
}

async function facilitatorPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${FACILITATOR_URL}${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: FACILITATOR_API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`facilitator ${path} HTTP ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
  }
  return (await res.json()) as T;
}

async function premiumData() {
  try {
    return await getVolatilityPayload();
  } catch {
    return fallbackPayload();
  }
}

export async function GET(req: Request) {
  const header = req.headers.get('x-payment');

  if (!header) {
    return paymentRequired('Payment required to access the premium feed.');
  }

  let payment: DecodedPayment;
  try {
    payment = JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as DecodedPayment;
  } catch {
    return Response.json({ error: 'Malformed X-PAYMENT header' }, { status: 400 });
  }

  // ---- Rail 1: EIP-712-signed CEP-18 payment → facilitator /verify + /settle ----
  if (payment.payload?.signature && payment.payload?.authorization) {
    if (!cep18Enabled()) {
      return paymentRequired('Facilitator rail not configured on this deployment.');
    }
    const requirements = cep18Requirements();
    try {
      const verdict = await facilitatorPost<{ isValid: boolean; payer?: string; invalidReason?: string }>(
        '/verify',
        { paymentPayload: payment, paymentRequirements: requirements },
      );
      if (!verdict.isValid) {
        return paymentRequired(`Payment invalid: ${verdict.invalidReason ?? 'rejected by facilitator'}`);
      }
      const settle = await facilitatorPost<{ success: boolean; transaction?: string; errorReason?: string }>(
        '/settle',
        { paymentPayload: payment, paymentRequirements: requirements },
      );
      if (!settle.success) {
        return paymentRequired(`Settlement failed: ${settle.errorReason ?? 'facilitator error'}`);
      }
      const receipt = Buffer.from(JSON.stringify(settle)).toString('base64');
      return Response.json(await premiumData(), {
        status: 200,
        headers: { 'x-payment-response': receipt },
      });
    } catch (err) {
      return paymentRequired(err instanceof Error ? err.message : 'facilitator unreachable', 502);
    }
  }

  // ---- Rail 2: legacy trusted settlement (stub or native-transfer hash) ----
  const paid = BigInt(payment.payload?.amountMotes ?? '0');
  if (!payment.payload?.txHash || paid < BigInt(PRICE_MOTES)) {
    return paymentRequired('Insufficient payment.');
  }
  const settlement = Buffer.from(JSON.stringify(payment)).toString('base64');
  return Response.json(await premiumData(), { status: 200, headers: { 'x-payment-response': settlement } });
}

// x402-gated premium market feed as a serverless route (so the x402 leg works
// on Vercel where the standalone services/premium-data server can't run).
// Same protocol: GET → 402 + paymentRequirements; GET w/ X-PAYMENT → 200 + real
// CoinGecko-backed analytics. Settlement is trusted here (stub or a real hash).
import { getVolatilityPayload, fallbackPayload } from '@/lib/market-analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NETWORK = process.env.CASPER_CHAIN_NAME ?? 'casper-test';
const PRICE_MOTES = process.env.X402_PRICE_MOTES ?? '2500000000';
const PAY_TO = process.env.X402_PAY_TO ?? process.env.CASPER_PUBLIC_KEY_HEX ?? 'REPLACE_MERCHANT_PUBLIC_KEY';

function paymentRequirements() {
  return {
    scheme: 'exact',
    network: NETWORK,
    maxAmountRequired: PRICE_MOTES,
    resource: '/api/premium',
    description: 'SentinelOS premium market feed (real-time volatility + peg)',
    mimeType: 'application/json',
    payTo: PAY_TO,
    maxTimeoutSeconds: 120,
    asset: 'CSPR',
    extra: { decimals: 9 },
  };
}

function decode(header: string): { payload?: { txHash?: string; amountMotes?: string } } {
  return JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
}

export async function GET(req: Request) {
  const header = req.headers.get('x-payment');

  if (!header) {
    return Response.json(
      { x402Version: 1, error: 'Payment required to access the premium feed.', accepts: [paymentRequirements()] },
      { status: 402 },
    );
  }

  let payment;
  try {
    payment = decode(header);
  } catch {
    return Response.json({ error: 'Malformed X-PAYMENT header' }, { status: 400 });
  }

  const paid = BigInt(payment.payload?.amountMotes ?? '0');
  if (!payment.payload?.txHash || paid < BigInt(PRICE_MOTES)) {
    return Response.json(
      { x402Version: 1, error: 'Insufficient payment.', accepts: [paymentRequirements()] },
      { status: 402 },
    );
  }

  let data;
  try {
    data = await getVolatilityPayload();
  } catch {
    data = fallbackPayload();
  }
  const settlement = Buffer.from(JSON.stringify(payment)).toString('base64');
  return Response.json(data, { status: 200, headers: { 'x-payment-response': settlement } });
}

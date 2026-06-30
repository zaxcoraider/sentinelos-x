import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  decodePayment,
  encodePayment,
  type PaymentRequirements,
  type PaymentRequiredResponse,
} from './protocol.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// repo root is three levels up from services/premium-data/src
loadEnv({ path: resolve(__dirname, '../../..', '.env') });

const PORT = Number(process.env.X402_PORT ?? 4021);
const NETWORK = process.env.CASPER_CHAIN_NAME ?? 'casper-test';
const PRICE_MOTES = process.env.X402_PRICE_MOTES ?? '2500000000'; // 2.5 CSPR (network minimum)
const PAY_TO =
  process.env.X402_PAY_TO ?? process.env.CASPER_PUBLIC_KEY_HEX ?? 'REPLACE_MERCHANT_PUBLIC_KEY';

function paymentRequirements(): PaymentRequirements {
  return {
    scheme: 'exact',
    network: NETWORK,
    maxAmountRequired: PRICE_MOTES,
    resource: '/volatility',
    description: 'SentinelOS premium volatility feed (real-time depeg analytics)',
    mimeType: 'application/json',
    payTo: PAY_TO,
    maxTimeoutSeconds: 120,
    asset: 'CSPR',
    extra: { decimals: 9 },
  };
}

/** Mock premium analytics — elevated vol consistent with a stablecoin depeg. */
function volatilityPayload() {
  return {
    asset: 'USDx',
    annualizedVol: 0.42,
    realizedVol24h: 0.18,
    regime: 'STRESSED',
    depegProbability24h: 0.61,
    recommendation: 'Reduce exposure; rebalance toward hard collateral.',
    source: 'SentinelOS Premium Feed (x402)',
    updatedAt: new Date().toISOString(),
  };
}

function json(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(data);
}

function handleVolatility(req: IncomingMessage, res: ServerResponse) {
  const header = req.headers['x-payment'];

  if (!header || typeof header !== 'string') {
    const body: PaymentRequiredResponse = {
      x402Version: 1,
      error: 'Payment required to access the premium volatility feed.',
      accepts: [paymentRequirements()],
    };
    console.log('[402] unpaid request → returning paymentRequirements');
    return json(res, 402, body);
  }

  let payment;
  try {
    payment = decodePayment(header);
  } catch {
    return json(res, 400, { error: 'Malformed X-PAYMENT header' });
  }

  const paid = BigInt(payment.payload?.amountMotes ?? '0');
  const required = BigInt(PRICE_MOTES);
  if (!payment.payload?.txHash || paid < required) {
    console.log('[402] insufficient/invalid payment proof → re-challenging');
    return json(res, 402, {
      x402Version: 1,
      error: 'Insufficient payment.',
      accepts: [paymentRequirements()],
    });
  }

  // Production facilitators verify the settlement on-chain here; we trust the
  // presented hash and log it. The hash is a real Casper tx in live mode.
  console.log(`[200] payment accepted (tx ${payment.payload.txHash}) → serving premium data`);
  const settlement = encodePayment(payment);
  return json(res, 200, volatilityPayload(), { 'x-payment-response': settlement });
}

const server = createServer((req, res) => {
  const url = (req.url ?? '').split('?')[0];
  if (req.method === 'GET' && url === '/volatility') return handleVolatility(req, res);
  if (req.method === 'GET' && url === '/health') return json(res, 200, { ok: true });
  return json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`SentinelOS premium-data (x402) listening on http://localhost:${PORT}`);
  console.log(`  GET /volatility — price ${PRICE_MOTES} motes, payTo ${PAY_TO.slice(0, 12)}…`);
});

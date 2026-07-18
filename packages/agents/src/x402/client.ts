import { transferCspr, loadKey, PUBLIC_KEY_HEX, explorerTxUrl } from '@sentinelos/casper';
import { toClientCasperSigner } from '@make-software/casper-x402';
import { ExactCasperScheme } from '@make-software/casper-x402/exact/client';
import { PREMIUM_DATA_URL, X402_MODE, X402_FACILITATOR_ENABLED } from '../config.js';
import { resolveFacilitatorSupport, verifyPayment, type FacilitatorSupport, type SettleResponse } from './facilitator.js';

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
  /** Which settlement rail actually ran. */
  rail?: 'facilitator-cep18' | 'native-cspr' | 'stub';
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

/** One entry of the 402 challenge's `accepts` array (v1 legacy or v2 CEP-18). */
interface AcceptsEntry {
  scheme: string;
  network: string;
  asset?: string;
  amount?: string;
  maxAmountRequired?: string; // legacy v1 field
  payTo: string;
  maxTimeoutSeconds?: number;
  extra?: { name?: string; version?: string; [k: string]: unknown };
  [k: string]: unknown;
}

const encodePayment = (p: unknown): string => Buffer.from(JSON.stringify(p)).toString('base64');

/** A v2 CEP-18 option: bare 64-hex asset (contract package) + EIP-712 domain in extra. */
function isCep18Option(a: AcceptsEntry): boolean {
  return (
    !!a.asset && /^[0-9a-fA-F]{64}$/.test(a.asset) &&
    typeof a.extra?.name === 'string' && typeof a.extra?.version === 'string' &&
    !!a.amount
  );
}

/**
 * The full facilitator settlement leg: sign an EIP-712 `transfer_with_authorization`
 * over our CEP-18 asset with the agent's key (official @make-software/casper-x402
 * scheme), preflight it against the hosted facilitator's /verify, then hand the
 * signed payload to the resource server, which settles it via /settle — the
 * facilitator submits the on-chain transfer and pays the gas.
 * Returns null if any step fails, so the caller can fall back.
 */
async function payViaCep18(
  req: AcceptsEntry,
  facilitator: FacilitatorSupport | null,
  logs: string[],
): Promise<{ data: VolatilityData; payment: X402Payment } | null> {
  try {
    const signer = toClientCasperSigner(loadKey());
    const scheme = new ExactCasperScheme(signer);
    const result = await scheme.createPaymentPayload(2, {
      scheme: req.scheme,
      network: req.network,
      asset: req.asset!,
      amount: req.amount!,
      payTo: req.payTo,
      maxTimeoutSeconds: req.maxTimeoutSeconds ?? 300,
      extra: req.extra,
      // The scheme only reads the fields above; satisfy its type loosely.
    } as Parameters<ExactCasperScheme['createPaymentPayload']>[1]);
    logs.push(`Signed EIP-712 transfer_with_authorization (payer ${signer.accountAddress().slice(0, 12)}…)`);

    const paymentPayload = {
      x402Version: 2,
      resource: { url: PREMIUM_DATA_URL, mimeType: 'application/json' },
      accepted: req,
      payload: result.payload,
    };

    // Preflight /verify so a bad payload fails fast with the facilitator's
    // reason instead of a mid-settlement error. Best-effort: only an explicit
    // isValid=false aborts this rail.
    try {
      const verdict = await verifyPayment(paymentPayload, req);
      if (verdict.isValid === false) {
        logs.push(`Facilitator /verify rejected the payload (${verdict.invalidReason ?? 'unknown'}) — falling back.`);
        return null;
      }
      logs.push(`Facilitator /verify confirmed the payment (payer ${String(verdict.payer ?? '').slice(0, 12)}…)`);
    } catch (err) {
      logs.push(`Facilitator /verify unreachable (${err instanceof Error ? err.message : 'error'}) — proceeding to settle.`);
    }

    const retry = await fetch(PREMIUM_DATA_URL, { headers: { 'x-payment': encodePayment(paymentPayload) } });
    if (retry.status !== 200) {
      const body = await retry.text().catch(() => '');
      logs.push(`Feed rejected facilitator payment (HTTP ${retry.status}${body ? `: ${body.slice(0, 160)}` : ''}) — falling back.`);
      return null;
    }

    // The server settles via the facilitator and echoes the settle receipt.
    let txHash = 'settled';
    let explorerUrl: string | undefined;
    const receiptHeader = retry.headers.get('x-payment-response');
    if (receiptHeader) {
      try {
        const receipt = JSON.parse(Buffer.from(receiptHeader, 'base64').toString('utf8')) as SettleResponse;
        if (receipt.transaction) {
          txHash = receipt.transaction;
          explorerUrl = explorerTxUrl(txHash);
        }
      } catch {
        // receipt is informational — ignore a malformed one
      }
    }
    logs.push(`Facilitator settled on-chain (gas paid by facilitator) — ${txHash}`);
    logs.push('Premium data unlocked.');

    return {
      data: (await retry.json()) as VolatilityData,
      payment: {
        mode: 'live',
        rail: 'facilitator-cep18',
        amountMotes: req.amount!,
        payTo: req.payTo,
        txHash,
        explorerUrl,
        facilitator,
      },
    };
  } catch (err) {
    logs.push(`CEP-18 facilitator leg failed (${err instanceof Error ? err.message : 'error'}) — falling back.`);
    return null;
  }
}

/**
 * Performs the x402 handshake against the premium-data feed:
 *   GET → 402 paymentRequirements → settle → retry with the X-PAYMENT proof →
 *   receive the data.
 * Settlement prefers the official facilitator rail (EIP-712-signed CEP-18
 * transfer, verified + settled + gas-paid by the hosted Casper x402
 * facilitator), then degrades to a native CSPR transfer, then to a stub.
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
      payment: { mode: X402_MODE, rail: 'stub', amountMotes: '0', payTo: '', txHash: 'none' },
      logs,
    };
  }
  if (first.status !== 402) throw new Error(`premium feed returned HTTP ${first.status}`);

  const challenge = (await first.json()) as { accepts?: AcceptsEntry[] };
  const accepts = challenge.accepts ?? [];
  const cep18 = accepts.find(isCep18Option);
  const legacy = accepts.find((a) => !isCep18Option(a)) ?? accepts[0];
  const req = cep18 ?? legacy;
  if (!req) throw new Error('402 response missing paymentRequirements');
  const price = req.amount ?? req.maxAmountRequired ?? '0';
  logs.push(`402 Payment Required — ${price} motes to ${req.payTo.slice(0, 12)}…`);

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

  // ---- Rail 1: EIP-712-signed CEP-18 payment settled by the facilitator ----
  if (cep18 && X402_MODE === 'live' && X402_FACILITATOR_ENABLED) {
    const settled = await payViaCep18(cep18, facilitator, logs);
    if (settled) return { ...settled, logs };
  }

  // ---- Rail 2/3: native CSPR transfer, or stub -----------------------------
  const fallbackReq = legacy ?? req;
  const fallbackPrice = fallbackReq.amount ?? fallbackReq.maxAmountRequired ?? price;
  let txHash: string;
  let explorerUrl: string | undefined;
  let rail: X402Payment['rail'] = 'stub';
  const stubSettle = (reason: string): string => {
    const h = `stub-${Date.now().toString(16)}`;
    logs.push(`${reason} — ${h}`);
    return h;
  };
  // The feed's default payTo is our OWN key (self-settlement demo). Casper's mint
  // rejects a transfer to the same purse ("Invalid purse") and still burns gas, so
  // never attempt a real self-transfer — settle it as a stub. Set X402_PAY_TO to a
  // distinct account to get a real on-chain settlement.
  const isSelfPay = !!PUBLIC_KEY_HEX && fallbackReq.payTo.toLowerCase() === PUBLIC_KEY_HEX.toLowerCase();
  if (X402_MODE === 'live' && !isSelfPay) {
    logs.push('Settling on Casper (native CSPR transfer)…');
    try {
      const settle = await transferCspr(fallbackPrice, { targetPublicKeyHex: fallbackReq.payTo });
      txHash = settle.txHash;
      explorerUrl = settle.explorerUrl;
      rail = 'native-cspr';
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
    scheme: fallbackReq.scheme,
    network: fallbackReq.network,
    payload: { txHash, amountMotes: fallbackPrice },
  };
  const retry = await fetch(PREMIUM_DATA_URL, { headers: { 'x-payment': encodePayment(proof) } });
  if (retry.status !== 200) throw new Error(`feed rejected payment (HTTP ${retry.status})`);

  logs.push('Premium data unlocked.');
  return {
    data: (await retry.json()) as VolatilityData,
    payment: {
      mode: X402_MODE,
      rail,
      amountMotes: fallbackPrice,
      payTo: fallbackReq.payTo,
      txHash,
      explorerUrl,
      facilitator,
    },
    logs,
  };
}

// The agent-to-agent x402 economy: SentinelOS specialists don't work for free.
//
// Each payee agent owns its own Casper account (see wallets.ts — keys generated
// once, secrets gitignored) and publishes a fixed x402 price quote for its
// service. When the Commander routes an incident, it hires the team: for every
// contributing agent it signs an EIP-712 `transfer_with_authorization` over the
// SOSC CEP-18 token and has the OFFICIAL hosted Casper x402 facilitator
// /verify + /settle the payment on-chain — the facilitator's feePayer covers
// the gas, so the specialist wallets need zero CSPR to get paid.
//
// Every payment is a real, independently verifiable SOSC transfer on Casper
// testnet from the Commander's treasury to that agent's account.
import { loadKey, explorerTxUrl, CHAIN_NAME } from '@sentinelos/casper';
import { toClientCasperSigner } from '@make-software/casper-x402';
import { ExactCasperScheme } from '@make-software/casper-x402/exact/client';
import {
  A2A_ASSET_PACKAGE,
  A2A_ASSET_NAME,
  A2A_ECONOMY_ENABLED,
  A2A_FEE_MOTES,
  A2A_ADVISORY_FEE_MOTES,
  A2A_CONCURRENCY,
  X402_MODE,
  X402_FACILITATOR_ENABLED,
  FACILITATOR_API_KEY,
} from '../config.js';
import { verifyPayment, settlePayment } from './facilitator.js';
import { AGENT_WALLETS } from './wallets.js';

/** Advisory roles earn the lighter consult fee; everyone else is a specialist. */
export const ADVISORY_PAYEES = ['compliance', 'liquidity', 'insurance', 'growth', 'community', 'legal'] as const;
const ADVISORY_ROLES = new Set<string>(ADVISORY_PAYEES);

export type A2aPaymentStatus = 'settled' | 'failed';

/** One Commander → agent x402 payment (a real on-chain SOSC transfer). */
export interface A2aPayment {
  /** Payee agent role, lowercase (e.g. 'risk'). */
  role: string;
  amountMotes: string;
  /** Payee account hash (bare hex) — the agent's own Casper wallet. */
  accountHash: string;
  status: A2aPaymentStatus;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

/** The payroll outcome attached to a pipeline result. */
export interface A2aEconomyReport {
  payments: A2aPayment[];
  totalMotes: string;
  settledCount: number;
}

/** The payroll runs only when the full live facilitator rail is configured. */
export function a2aEnabled(): boolean {
  return (
    A2A_ECONOMY_ENABLED &&
    X402_MODE === 'live' &&
    X402_FACILITATOR_ENABLED &&
    !!A2A_ASSET_PACKAGE &&
    !!FACILITATOR_API_KEY
  );
}

export function feeFor(role: string): string {
  return ADVISORY_ROLES.has(role) ? A2A_ADVISORY_FEE_MOTES : A2A_FEE_MOTES;
}

/** Sum of the fees the Commander will pay for a given roster. */
export function payrollTotalMotes(roles: string[]): string {
  return roles
    .filter((r) => AGENT_WALLETS[r])
    .reduce((acc, r) => acc + BigInt(feeFor(r)), 0n)
    .toString();
}

/**
 * The agent's published x402 price quote — the same canonical shape the premium
 * feed advertises in its 402, so the exact object we sign over is the one the
 * facilitator checks in /verify and settles in /settle.
 */
function priceQuote(role: string) {
  return {
    scheme: 'exact',
    network: `casper:${CHAIN_NAME}`,
    amount: feeFor(role),
    asset: A2A_ASSET_PACKAGE,
    payTo: `00${AGENT_WALLETS[role].accountHash}`,
    maxTimeoutSeconds: 300,
    resource: `https://sentinelos-x-web.vercel.app/agents/${role}`,
    description: `SentinelOS ${role} agent — incident-response service fee`,
    mimeType: 'application/json',
    extra: { name: A2A_ASSET_NAME, version: '1', symbol: 'SOSC', decimals: '9' },
  };
}

/** Sign + verify + settle one agent's fee via the hosted facilitator. */
async function payOne(role: string, scheme: InstanceType<typeof ExactCasperScheme>): Promise<A2aPayment> {
  const quote = priceQuote(role);
  const base: A2aPayment = {
    role,
    amountMotes: quote.amount,
    accountHash: AGENT_WALLETS[role].accountHash,
    status: 'failed',
  };
  try {
    const signed = await scheme.createPaymentPayload(
      2,
      quote as Parameters<ExactCasperScheme['createPaymentPayload']>[1],
    );
    const paymentPayload = {
      x402Version: 2,
      resource: { url: quote.resource, mimeType: quote.mimeType },
      accepted: quote,
      payload: signed.payload,
    };

    // Best-effort preflight — only an explicit rejection aborts this payment.
    try {
      const verdict = await verifyPayment(paymentPayload, quote);
      if (verdict.isValid === false) {
        return { ...base, error: verdict.invalidReason ?? 'rejected by facilitator /verify' };
      }
    } catch {
      // /verify unreachable → let /settle be the arbiter
    }

    const settle = await settlePayment(paymentPayload, quote);
    if (!settle.success) {
      return { ...base, error: settle.errorReason ?? 'facilitator /settle failed' };
    }
    return {
      ...base,
      status: 'settled',
      txHash: settle.transaction,
      explorerUrl: settle.transaction ? explorerTxUrl(settle.transaction) : undefined,
    };
  } catch (err) {
    return { ...base, error: err instanceof Error ? err.message : 'payment failed' };
  }
}

/**
 * Pays the incident roster: one real facilitator-settled SOSC transfer per
 * agent, A2A_CONCURRENCY settlements in flight at a time. Never throws — a
 * failed payment is reported per-agent so the pipeline stays resilient.
 */
export async function runPayroll(
  roles: string[],
  onPayment?: (payment: A2aPayment) => void,
): Promise<A2aEconomyReport> {
  const roster = roles.filter((r) => AGENT_WALLETS[r]);
  const signer = toClientCasperSigner(loadKey());
  const scheme = new ExactCasperScheme(signer);

  const payments: A2aPayment[] = [];
  let next = 0;
  const worker = async () => {
    while (next < roster.length) {
      const role = roster[next++];
      const payment = await payOne(role, scheme);
      payments.push(payment);
      onPayment?.(payment);
    }
  };
  await Promise.all(Array.from({ length: Math.min(A2A_CONCURRENCY, roster.length) }, worker));
  return buildReport(payments);
}

/** Rolls payment records up into a report (also used for partial/timeout cuts). */
export function buildReport(payments: A2aPayment[]): A2aEconomyReport {
  const settled = payments.filter((p) => p.status === 'settled');
  return {
    payments: [...payments],
    totalMotes: settled.reduce((acc, p) => acc + BigInt(p.amountMotes), 0n).toString(),
    settledCount: settled.length,
  };
}

// Minimal x402 wire shapes (HTTP 402 "Payment Required" protocol).
// A server answers an unpaid request with 402 + `accepts: PaymentRequirements[]`;
// the client settles, then retries with a base64 `X-PAYMENT` header carrying a
// PaymentPayload. The server replies 200 + the resource (+ `X-PAYMENT-RESPONSE`).

export interface PaymentRequirements {
  scheme: string; // "exact"
  network: string; // "casper-test"
  maxAmountRequired: string; // price in motes
  resource: string; // path being paid for
  description: string;
  mimeType: string;
  payTo: string; // merchant public key (hex)
  maxTimeoutSeconds: number;
  asset: string; // "CSPR"
  extra?: Record<string, unknown>;
}

export interface PaymentRequiredResponse {
  x402Version: number;
  error: string;
  accepts: PaymentRequirements[];
}

export interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    txHash: string; // settlement transaction hash (or a stub id)
    from?: string;
    amountMotes: string;
  };
}

export function encodePayment(p: PaymentPayload): string {
  return Buffer.from(JSON.stringify(p)).toString('base64');
}

export function decodePayment(header: string): PaymentPayload {
  return JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as PaymentPayload;
}

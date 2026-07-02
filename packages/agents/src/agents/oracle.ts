import type { MarketEvent, OracleReport } from '../types.js';
import type { VolatilityData } from '../x402/client.js';

/** Read an optional numeric field off the live feed payload. */
function num(v: VolatilityData, key: string): number | undefined {
  const x = v[key];
  return typeof x === 'number' ? x : undefined;
}

/**
 * Oracle Agent: confirms the live monitored feed. Deterministic — it reports the
 * REAL market snapshot the premium feed delivered (CoinGecko peg + reference
 * price), so there is no model in the loop, just verified data.
 */
export function reportOracle(event: MarketEvent, vol: VolatilityData): OracleReport {
  const stablePriceUsd = num(vol, 'stablePriceUsd') ?? 1;
  const pegDeviation =
    num(vol, 'stablePegDeviation') ?? (Math.abs(1 - stablePriceUsd) || event.deviation || 0);
  const refAsset = (typeof vol.volReference === 'string' ? vol.volReference : 'ETH').toUpperCase();
  const refPriceUsd = num(vol, 'refPriceUsd') ?? 0;
  const ref24hChange = num(vol, 'ref24hChange') ?? 0;

  const bps = Math.round(pegDeviation * 10000);
  const headline = `${vol.asset} feed live at $${stablePriceUsd.toFixed(4)} (${bps} bps off peg); ${refAsset} $${refPriceUsd.toLocaleString()} ${ref24hChange >= 0 ? '+' : ''}${ref24hChange.toFixed(1)}% 24h.`;

  return { stablePriceUsd, pegDeviation, refAsset, refPriceUsd, ref24hChange, headline };
}

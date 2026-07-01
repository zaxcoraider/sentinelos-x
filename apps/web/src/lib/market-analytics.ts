// Server-only: real market analytics from CoinGecko (free, no key), used by the
// x402 premium-data route (/api/premium). Mirrors services/premium-data so the
// x402 leg works on Vercel where the standalone feed can't run. 60s cache.

const CG = process.env.COINGECKO_BASE ?? 'https://api.coingecko.com/api/v3';
const VOL_REFERENCE = process.env.MARKET_VOL_ASSET ?? 'ethereum';
const STABLE = process.env.MARKET_STABLE_ASSET ?? 'usd-coin';
const STABLE_LABEL: Record<string, string> = { 'usd-coin': 'USDC', dai: 'DAI', tether: 'USDT' };
const REF_LABEL: Record<string, string> = { ethereum: 'ETH', bitcoin: 'BTC' };

export interface VolatilityPayload {
  asset: string;
  annualizedVol: number;
  regime: 'CALM' | 'ELEVATED' | 'STRESSED';
  depegProbability24h: number;
  recommendation: string;
  volReference: string;
  refPriceUsd: number;
  ref24hChange: number;
  stablePriceUsd: number;
  stablePegDeviation: number;
  source: string;
  updatedAt: string;
}

let cache: { at: number; data: VolatilityPayload } | null = null;

function annualizedVol(prices: number[]): number {
  if (prices.length < 2) return 0;
  const rets: number[] = [];
  for (let i = 1; i < prices.length; i++) rets.push(Math.log(prices[i] / prices[i - 1]));
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * Math.sqrt(365);
}

/** Real CoinGecko-backed analytics (60s cache). Throws on fetch failure. */
export async function getVolatilityPayload(): Promise<VolatilityPayload> {
  if (cache && Date.now() - cache.at < 60_000) return cache.data;

  const [priceRes, chartRes] = await Promise.all([
    fetch(`${CG}/simple/price?ids=${VOL_REFERENCE},${STABLE}&vs_currencies=usd&include_24hr_change=true`),
    fetch(`${CG}/coins/${VOL_REFERENCE}/market_chart?vs_currency=usd&days=14&interval=daily`),
  ]);
  if (!priceRes.ok || !chartRes.ok) throw new Error(`CoinGecko HTTP ${priceRes.status}/${chartRes.status}`);
  const price = (await priceRes.json()) as Record<string, { usd: number; usd_24h_change?: number }>;
  const chart = (await chartRes.json()) as { prices?: [number, number][] };

  const series = (chart.prices ?? []).map((p) => p[1]);
  const vol = annualizedVol(series);
  const ref = price[VOL_REFERENCE];
  const stable = price[STABLE];
  const refLabel = REF_LABEL[VOL_REFERENCE] ?? VOL_REFERENCE;
  const stableLabel = STABLE_LABEL[STABLE] ?? STABLE;
  const regime: VolatilityPayload['regime'] = vol > 0.6 ? 'STRESSED' : vol > 0.4 ? 'ELEVATED' : 'CALM';

  const data: VolatilityPayload = {
    asset: stableLabel,
    annualizedVol: Number(vol.toFixed(4)),
    regime,
    depegProbability24h: Math.min(0.95, Math.max(0.02, Number((vol * 0.4).toFixed(2)))),
    recommendation:
      regime === 'STRESSED'
        ? 'Elevated systemic volatility — reduce exposure and rebalance toward hard collateral.'
        : 'Volatility within normal range — maintain positions and monitor.',
    volReference: refLabel,
    refPriceUsd: ref.usd,
    ref24hChange: Number((ref.usd_24h_change ?? 0).toFixed(2)),
    stablePriceUsd: stable.usd,
    stablePegDeviation: Number(Math.abs(1 - stable.usd).toFixed(5)),
    source: `${refLabel} vol + ${stableLabel} peg · CoinGecko (live) · x402`,
    updatedAt: new Date().toISOString(),
  };
  cache = { at: Date.now(), data };
  return data;
}

/** Fallback if CoinGecko is unreachable (x402 stays best-effort). */
export function fallbackPayload(): VolatilityPayload {
  return {
    asset: 'USDC',
    annualizedVol: 0.42,
    regime: 'STRESSED',
    depegProbability24h: 0.61,
    recommendation: 'Reduce exposure; rebalance toward hard collateral.',
    volReference: 'ETH',
    refPriceUsd: 0,
    ref24hChange: 0,
    stablePriceUsd: 1,
    stablePegDeviation: 0,
    source: 'SentinelOS analytics (live feed unavailable)',
    updatedAt: new Date().toISOString(),
  };
}

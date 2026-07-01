// Real market analytics from CoinGecko (free, no API key). The x402 premium
// feed serves genuinely live data: ETH annualized volatility as the systemic
// risk regime, plus the monitored stablecoin's real peg. Cached to respect
// CoinGecko's free-tier rate limits.

const CG = process.env.COINGECKO_BASE ?? 'https://api.coingecko.com/api/v3';
const VOL_REFERENCE = process.env.MARKET_VOL_ASSET ?? 'ethereum';
const STABLE = process.env.MARKET_STABLE_ASSET ?? 'usd-coin';

export interface MarketAnalytics {
  /** Monitored stablecoin id (e.g. usd-coin). */
  stable: string;
  stablePriceUsd: number;
  stablePegDeviation: number; // |1 - price|
  /** Systemic volatility reference (e.g. ethereum). */
  volReference: string;
  refPriceUsd: number;
  ref24hChange: number;
  annualizedVol: number; // real, from daily log returns
  regime: 'CALM' | 'ELEVATED' | 'STRESSED';
  depegProbability24h: number; // modeled from real vol
  source: string;
  updatedAt: string;
}

let cache: { at: number; data: MarketAnalytics } | null = null;

function annualizedVol(prices: number[]): number {
  if (prices.length < 2) return 0;
  const rets: number[] = [];
  for (let i = 1; i < prices.length; i++) rets.push(Math.log(prices[i] / prices[i - 1]));
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * Math.sqrt(365);
}

/** Fetches live market analytics from CoinGecko (60s cache). Throws on failure. */
export async function getMarketAnalytics(): Promise<MarketAnalytics> {
  if (cache && Date.now() - cache.at < 60_000) return cache.data;

  const [priceRes, chartRes] = await Promise.all([
    fetch(`${CG}/simple/price?ids=${VOL_REFERENCE},${STABLE}&vs_currencies=usd&include_24hr_change=true`),
    fetch(`${CG}/coins/${VOL_REFERENCE}/market_chart?vs_currency=usd&days=14&interval=daily`),
  ]);
  if (!priceRes.ok || !chartRes.ok) {
    throw new Error(`CoinGecko HTTP ${priceRes.status}/${chartRes.status}`);
  }
  const price = (await priceRes.json()) as Record<string, { usd: number; usd_24h_change?: number }>;
  const chart = (await chartRes.json()) as { prices?: [number, number][] };

  const series = (chart.prices ?? []).map((p) => p[1]);
  const vol = annualizedVol(series);
  const ref = price[VOL_REFERENCE];
  const stable = price[STABLE];

  const data: MarketAnalytics = {
    stable: STABLE,
    stablePriceUsd: stable.usd,
    stablePegDeviation: Math.abs(1 - stable.usd),
    volReference: VOL_REFERENCE,
    refPriceUsd: ref.usd,
    ref24hChange: ref.usd_24h_change ?? 0,
    annualizedVol: vol,
    regime: vol > 0.6 ? 'STRESSED' : vol > 0.4 ? 'ELEVATED' : 'CALM',
    depegProbability24h: Math.min(0.95, Math.max(0.02, Number((vol * 0.4).toFixed(2)))),
    source: 'CoinGecko (live)',
    updatedAt: new Date().toISOString(),
  };
  cache = { at: Date.now(), data };
  return data;
}

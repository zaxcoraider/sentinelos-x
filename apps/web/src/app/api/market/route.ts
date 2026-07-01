// Live market snapshot from CoinGecko (free, no key) for the Mission Control
// "Live Market" tile — the monitored stablecoin's real peg + a systemic
// reference asset. Cached 30s to respect CoinGecko's free-tier limits.
export const runtime = 'nodejs';
export const revalidate = 30;

const CG = process.env.COINGECKO_BASE ?? 'https://api.coingecko.com/api/v3';
const STABLE = process.env.MARKET_STABLE_ASSET ?? 'usd-coin';
const REF = process.env.MARKET_VOL_ASSET ?? 'ethereum';
const STABLE_LABEL: Record<string, string> = { 'usd-coin': 'USDC', dai: 'DAI', tether: 'USDT' };
const REF_LABEL: Record<string, string> = { ethereum: 'ETH', bitcoin: 'BTC' };

export async function GET() {
  try {
    const res = await fetch(
      `${CG}/simple/price?ids=${STABLE},${REF}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const p = (await res.json()) as Record<string, { usd: number; usd_24h_change?: number }>;
    const stable = p[STABLE];
    const ref = p[REF];
    return Response.json({
      stable: {
        symbol: STABLE_LABEL[STABLE] ?? STABLE,
        price: stable.usd,
        change24h: stable.usd_24h_change ?? 0,
        pegDeviation: Math.abs(1 - stable.usd),
      },
      reference: {
        symbol: REF_LABEL[REF] ?? REF,
        price: ref.usd,
        change24h: ref.usd_24h_change ?? 0,
      },
      source: 'CoinGecko',
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'market fetch failed' },
      { status: 502 },
    );
  }
}

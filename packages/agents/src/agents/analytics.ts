import type { AnalyticsReport } from '../types.js';
import type { VolatilityData } from '../x402/client.js';

/**
 * Analytics Agent: quantifies the anomaly. Deterministic — it surfaces the REAL
 * derived metrics from the live feed (annualized volatility from daily log
 * returns, systemic regime, modeled 24h depeg probability). No model, just math.
 */
export function reportAnalytics(vol: VolatilityData): AnalyticsReport {
  const annualizedVol = vol.annualizedVol ?? 0;
  const regime = vol.regime ?? 'UNKNOWN';
  const depegProbability24h = vol.depegProbability24h ?? 0;

  const headline =
    `Annualized volatility ${(annualizedVol * 100).toFixed(0)}% → ${regime} regime` +
    `; modeled 24h depeg probability ${(depegProbability24h * 100).toFixed(0)}%.`;

  return { annualizedVol, regime, depegProbability24h, headline };
}

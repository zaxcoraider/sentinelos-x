// End-to-end test of the x402 facilitator rail against a running premium route.
// Run: PREMIUM_DATA_URL=http://localhost:3100/api/premium X402_MODE=live \
//        npx tsx packages/agents/scripts/test-x402.ts
import { fetchPremiumData } from '../src/x402/client.js';

const res = await fetchPremiumData();
console.log('── logs ──');
for (const l of res.logs) console.log(' •', l);
console.log('── payment ──');
console.log(JSON.stringify(res.payment, null, 2));
console.log('── data ──');
console.log(res.data.source, '| vol', res.data.annualizedVol, '| regime', res.data.regime);

import { runPipeline } from '../src/orchestrator.js';
import { AGENT_MODEL, X402_ENABLED, X402_MODE } from '../src/config.js';
import type { MarketEvent, TraceStep } from '../src/types.js';

// The canonical demo scenario: a 7% stablecoin depeg.
const event: MarketEvent = { type: 'DEPEG', asset: 'USDx', deviation: 0.07 };

// `--dry` skips the on-chain write (no CSPR spent); default fires a real tx.
const live = !process.argv.includes('--dry');

const icon: Record<TraceStep['agent'], string> = {
  Risk: '🛡',
  Commander: '🧭',
  Treasury: '💰',
};

async function main() {
  console.log('\n=== SentinelOS — agent loop (Commander / Risk / Treasury) ===');
  console.log(`model: ${AGENT_MODEL} | mode: ${live ? 'LIVE (real Casper tx)' : 'DRY (no tx)'}`);
  console.log(`x402 : ${X402_ENABLED ? `enabled (${X402_MODE})` : 'disabled'}`);
  console.log(`\nEVENT: ${JSON.stringify(event)}\n`);

  const result = await runPipeline(event, {
    live,
    onStep: (s) => console.log(`  ${icon[s.agent]} [${s.agent}] ${s.summary}\n`),
  });

  console.log('--- result ---');
  console.log(`severity : ${result.severity}/100`);
  console.log(`routed   : ${result.routed}`);
  if (result.x402) {
    console.log(`x402     : paid ${result.x402.amountMotes} motes (${result.x402.mode})`);
    if (result.x402.explorerUrl) console.log(`           settlement: ${result.x402.explorerUrl}`);
  }
  if (result.decision) console.log(`action   : ${result.decision.action} (${result.decision.confidence}%)`);
  if (result.tx) {
    console.log(`\n✅ On-chain: ${result.tx.explorerUrl}`);
  } else if (live && result.routed) {
    console.log('\n(no tx returned)');
  }
}

main().catch((err) => {
  console.error('\nagent run failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});

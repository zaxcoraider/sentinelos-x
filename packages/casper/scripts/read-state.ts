import { readState, explorerContractUrl } from '../src/index.js';

async function main() {
  console.log('Reading live TreasuryGuard state from chain...\n');
  const state = await readState('treasury');
  console.log('  total_actions          :', state.totalActions);
  console.log('  last_action("treasury") :', state.lastAction ?? '(none)');
  console.log('  last_severity("treasury):', state.lastSeverity ?? '(none)');
  console.log('\nContract:', explorerContractUrl());
}

main().catch((e) => {
  console.error('readState failed:', e);
  process.exit(1);
});

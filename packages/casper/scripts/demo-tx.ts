import { recordAction, readState, waitForExecution } from '../src/index.js';

async function main() {
  console.log('=== SentinelOS — record_action demo (Node + casper-js-sdk) ===\n');

  const before = await readState('treasury');
  console.log('State BEFORE: total_actions =', before.totalActions, '| last_action =', before.lastAction ?? '(none)');

  console.log('\nSending record_action("treasury", "REBALANCE", 80, 1000) ...');
  const { txHash, explorerUrl } = await recordAction('treasury', 'REBALANCE', 80, 1000);
  console.log('  tx hash :', txHash);
  console.log('  explorer:', explorerUrl);

  console.log('\nWaiting for on-chain execution...');
  const outcome = await waitForExecution(txHash);
  if (!outcome.success) {
    console.error('  ❌ execution FAILED:', outcome.errorMessage);
    process.exit(1);
  }
  console.log('  ✅ executed in block', outcome.blockHeight, '| cost', outcome.cost, 'motes');

  const after = await readState('treasury');
  console.log('\nState AFTER : total_actions =', after.totalActions, '| last_action =', after.lastAction);
  console.log('\nDone. View the tx:', explorerUrl);
}

main().catch((e) => {
  console.error('demo failed:', e);
  process.exit(1);
});

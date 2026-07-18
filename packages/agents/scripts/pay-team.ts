// Standalone demo of the agent-to-agent x402 economy: the Commander pays the
// given agents (default: the whole team) their SOSC service fee via the official
// hosted Casper x402 facilitator — real EIP-712 CEP-18 transfers, gas sponsored.
//
//   X402_MODE=live npx tsx scripts/pay-team.ts [role ...]
import { a2aEnabled, runPayroll } from '../src/x402/economy.js';
import { AGENT_WALLETS } from '../src/x402/wallets.js';

const roles = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(AGENT_WALLETS);

if (!a2aEnabled()) {
  console.error(
    'a2a economy disabled — needs X402_MODE=live, X402_ASSET_PACKAGE, CSPR_CLOUD_API_KEY (and A2A_ECONOMY not off).',
  );
  process.exit(1);
}

console.log(`Paying ${roles.join(', ')} …`);
const report = await runPayroll(roles, (p) =>
  console.log(
    `  ${p.role.padEnd(11)} ${p.status.toUpperCase().padEnd(8)} ${p.amountMotes} motes` +
      (p.txHash ? `  ${p.explorerUrl}` : p.error ? `  (${p.error})` : ''),
  ),
);
console.log(`\n${report.settledCount}/${report.payments.length} settled — ${report.totalMotes} motes total.`);
process.exit(report.settledCount === report.payments.length ? 0 : 1);

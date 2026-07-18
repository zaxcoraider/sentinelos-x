// One-time deploy of the x402-capable CEP-18 token (Cep18X402.wasm, from the
// official make-software/casper-x402 repo) to Casper testnet. This token adds
// `transfer_with_authorization` — the EIP-712 gasless-transfer entry point the
// hosted x402 facilitator settles against. The full initial supply mints to our
// agent account, which then pays premium-feed fees in this token.
//
// Run: npx tsx packages/casper/scripts/deploy-x402-token.ts
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import casperDefault from 'casper-js-sdk';
import * as casperNamespace from 'casper-js-sdk';
const casperSdk: typeof casperNamespace =
  (casperDefault as unknown as { RpcClient?: unknown })?.RpcClient
    ? (casperDefault as unknown as typeof casperNamespace)
    : casperNamespace;
const { RpcClient, HttpHandler, SessionBuilder, Args, CLValue, Timestamp } = casperSdk;
import { NODE_URL, CHAIN_NAME, loadKey } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WASM_PATH = join(__dirname, '../../../contracts/x402_token/Cep18X402.wasm');

const TOKEN_NAME = 'SentinelOS Credit'; // becomes the EIP-712 domain name — servers must advertise it verbatim
const TOKEN_SYMBOL = 'SOSC';
const DECIMALS = 9;
const INITIAL_SUPPLY = 1_000_000_000_000_000n; // 1M tokens at 9 decimals, minted to deployer
const CAIP2_CHAIN_ID = `casper:${CHAIN_NAME}`; // EIP-712 domain chain id — isolates testnet sigs from mainnet
const PAYMENT = 800_000_000_000n; // 800 CSPR gas limit (mirrors the reference deployer; unspent is refunded)

async function main() {
  const key = loadKey();
  const rpc = new RpcClient(new HttpHandler(NODE_URL));
  const wasm = new Uint8Array(readFileSync(WASM_PATH));

  const args = Args.fromMap({
    name: CLValue.newCLString(TOKEN_NAME),
    symbol: CLValue.newCLString(TOKEN_SYMBOL),
    decimals: CLValue.newCLUint8(DECIMALS),
    initial_supply: CLValue.newCLUInt256(INITIAL_SUPPLY),
    chain_id: CLValue.newCLString(CAIP2_CHAIN_ID),
    odra_cfg_is_upgradable: CLValue.newCLValueBool(true),
    odra_cfg_is_upgrade: CLValue.newCLValueBool(false),
    odra_cfg_allow_key_override: CLValue.newCLValueBool(true),
    odra_cfg_package_hash_key_name: CLValue.newCLString('X402_package_hash'),
  });

  // Local clock runs ahead of the network; backdate inside the TTL (see src/index.ts).
  const offsetSec = Number(process.env.CASPER_TS_OFFSET_SEC ?? 60);
  const tx = new SessionBuilder()
    .from(key.publicKey)
    .chainName(CHAIN_NAME)
    .timestamp(new Timestamp(new Date(Date.now() - offsetSec * 1000)))
    .wasm(wasm)
    .installOrUpgrade()
    .runtimeArgs(args)
    .payment(Number(PAYMENT))
    .build();
  tx.sign(key);

  const res = await rpc.putTransaction(tx);
  const txHash = res.transactionHash.toHex();
  console.log(`install tx submitted: ${txHash}`);
  console.log(`https://testnet.cspr.live/deploy/${txHash}`);

  // Poll until executed, then read the package hash from the account's named keys.
  const started = Date.now();
  for (;;) {
    if (Date.now() - started > 180_000) throw new Error('timed out waiting for execution');
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const info = await rpc.getTransactionByTransactionHash(txHash);
      const exec = info.executionInfo;
      if (exec?.executionResult && exec.blockHeight !== 0) {
        const err = exec.executionResult.errorMessage;
        if (err) throw new Error(`execution failed: ${err}`);
        console.log(`executed in block ${exec.blockHeight}, gas: ${exec.executionResult.consumed}`);
        break;
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('execution failed')) throw e;
      // not found yet — keep polling
    }
  }

  const entity = await rpc.getLatestEntity(casperSdk.EntityIdentifier.fromPublicKey(key.publicKey));
  const raw = entity.rawJSON as {
    entity?: { Account?: { named_keys?: Array<{ name: string; key: string }> } };
  };
  const named = raw.entity?.Account?.named_keys?.find((k) => k.name === 'X402_package_hash');
  if (!named) throw new Error('X402_package_hash named key not found after install');
  console.log(`\nX402 token package hash: ${named.key}`);
  console.log(`EIP-712 domain: name="${TOKEN_NAME}" version="1" chainId="${CAIP2_CHAIN_ID}"`);
  console.log('\nAdd to .env:');
  console.log(`X402_ASSET_PACKAGE=${named.key.replace(/^hash-/, '')}`);
  console.log(`X402_ASSET_NAME=${TOKEN_NAME}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

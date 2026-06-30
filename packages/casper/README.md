# @sentinelos/casper

TypeScript interaction layer for the deployed **TreasuryGuard** contract on
Casper 2.0 testnet, built on [`casper-js-sdk`](https://www.npmjs.com/package/casper-js-sdk) v5.

## API

```ts
import { recordAction, readState, waitForExecution } from '@sentinelos/casper';

// Write: build + sign + send a record_action transaction
const { txHash, explorerUrl } = await recordAction('treasury', 'REBALANCE', 80, 1000);
await waitForExecution(txHash);

// Read: live on-chain state for an agent
const { totalActions, lastAction, lastSeverity } = await readState('treasury');
```

## Scripts

```bash
npm run read    # read-only: prints live total_actions / last_action / last_severity
npm run demo    # fires a real record_action tx from Node, prints the explorer URL
```

Config is read from the repo-root `.env` (`TREASURY_GUARD_PACKAGE_HASH`,
`CASPER_NODE_URL`, `CASPER_SECRET_KEY_PATH`, ...).

## Notes / gotchas captured here

- **Contract calls** use `ContractCallBuilder.byPackageHash(...)` with the default
  `vm-casper-v1` runtime (Odra contracts run on the v1 VM).
- **Reading Odra state** (`src/storage.ts`): Odra keeps every module field in a
  dictionary at the contract's `state` URef. The item key is
  `hex(blake2b256(index_bytes ++ mapping_data))`. Odra reserves index 0, so the
  declared fields are 1-based: `total_actions`=1, `last_action`=2, `last_severity`=3.
  Values are stored as CL `List<U8>`; we decode the inner bytes per Rust type.
- **Clock skew**: this machine's clock runs ahead of the network, which rejects
  future-dated transactions. `recordAction` backdates the timestamp by
  `CASPER_TS_OFFSET_SEC` (default 60s), well within the 30-min TTL.
- `casper-js-sdk` ships as CommonJS; import the module object and destructure
  rather than using named ESM imports (the lexer misses some exports).

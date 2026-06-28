# sentinelos-x

Casper Network 2.0 smart contract project.

- **Runtime:** Rust → WebAssembly (no EVM, no Solana)
- **Framework:** [Odra](https://odra.dev) (`cargo-odra`)
- **Client:** `casper-client` v5.0.0
- **Network:** Casper Testnet (`integration-test.cspr.live` / CSPR.cloud)

## Structure

```
sentinelos-x/
├── contracts/        # Odra smart contracts (Rust)
├── keys/             # Testnet keypair — NEVER commit
├── .env              # API keys & node URL — NEVER commit
└── README.md
```

## Quick start

```bash
# Build a contract
cargo odra build -c MyContract

# Run tests
cargo odra test

# Deploy
casper-client put-deploy \
  --node-address https://rpc.testnet.casperlabs.io \
  --chain-name casper-test \
  --secret-key ./keys/secret_key.pem \
  --session-path target/wasm32-unknown-unknown/release/my_contract.wasm \
  --payment-amount 50000000000
```

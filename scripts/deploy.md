# Deploying TreasuryGuard to Casper testnet

This machine's WSL2 can run `casper-client` but has **no outbound network**
(NAT/firewall broken). Windows has network but `casper-client` won't build there.
Solution: **build + sign the transaction offline in WSL, transmit from Windows.**

## 1. Build the MVP wasm (WSL)
```bash
bash scripts/build_contract.sh
```

## 2. Build + sign the install transaction OFFLINE (WSL)
Casper 2.0 install = a `TransactionV1` session with `is_install=true`, runtime
`vm-casper-v1`, and the four Odra config args (mirrors odra-core's
`try_deploy_with_cfg`):

```bash
casper-client make-transaction --force session \
  --wasm-path contracts/treasury_guard/wasm/TreasuryGuard.wasm \
  --chain-name casper-test \
  --secret-key keys/secret_key.pem \
  --gas-price-tolerance 1 \
  --pricing-mode classic --standard-payment true \
  --payment-amount 300000000000 \
  --install-upgrade --transaction-runtime vm-casper-v1 \
  --session-arg "odra_cfg_is_upgradable:bool='false'" \
  --session-arg "odra_cfg_is_upgrade:bool='false'" \
  --session-arg "odra_cfg_allow_key_override:bool='true'" \
  --session-arg "odra_cfg_package_hash_key_name:string='TreasuryGuard_package_hash'" \
  --output install_tx.json
```

## 3. Transmit from Windows (PowerShell — has network)
```powershell
$raw  = Get-Content install_tx.json -Raw
$body = '{"jsonrpc":"2.0","id":1,"method":"account_put_transaction","params":{"transaction":' + $raw + '}}'
Invoke-RestMethod -Uri https://node.testnet.casper.network/rpc -Method Post -Body $body -ContentType application/json
```

## 4. Poll execution
`info_get_transaction` with `{transaction_hash:{Version1:"<hash>"}}`.
Empty `error_message` = success. The install effects write three `hash-` keys:
`ContractPackage` (package), `Contract` (contract), `ContractWasm` (byte code).

## Live deployment (2026-06-30, block 8349115)
- Install tx : `d6fcf8b48abe6917945a2b375c63fcb2c6126147d2b4cdaf5a19becdc2ebf5f7`
- Contract   : `ec9b7dd9f53cad08c63b54f03e50b27c5637a285c6977e5dc5ec5d7f07e2d9cd`
- Package    : `7f56caa1d89d394786354bc382b1896fcd21fd77d0cea33c41a54e28c56990db`
- Gas consumed: ~177 CSPR (limit 300)

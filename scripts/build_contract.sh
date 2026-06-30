#!/usr/bin/env bash
# Reproducible Casper-MVP build for TreasuryGuard.
#
# Why not `cargo odra build`? Two reasons discovered the hard way:
#   1. Odra's post-build wasm-opt RE-INTRODUCES bulk-memory ops, which Casper's
#      vm-casper-v1 rejects. Building with plain `cargo` (rustc honours
#      `target-feature=-bulk-memory`) avoids most of them; wasm-opt then LOWERS
#      any remainder to MVP loops.
#   2. The Casper `call` entry point is generated only under
#      `--cfg odra_module="TreasuryGuard"` (already in .cargo/config.toml).
#
# Requires: rustup wasm32 target, and binaryen >= 123 (for the
# --llvm-memory-copy-fill-lowering pass). version_119 does NOT have it.
set -euo pipefail
cd "$(dirname "$0")/../contracts/treasury_guard"

echo ">> building wasm (offline, plain cargo)"
cargo build --release --target wasm32-unknown-unknown --bin treasury_guard_build_contract

RAW="../../target/wasm32-unknown-unknown/release/treasury_guard_build_contract.wasm"
OUT="wasm/TreasuryGuard.wasm"

echo ">> lowering bulk-memory + sign-ext to strict MVP"
wasm-opt --llvm-memory-copy-fill-lowering --signext-lowering \
         --disable-bulk-memory --disable-sign-ext \
         --strip-debug -O1 "$RAW" -o "$OUT"

echo ">> verifying (expect 0 bulk-mem, 0 sign-ext, defined+exported memory, 'call' export)"
WAT=$(mktemp)
wasm-dis "$OUT" -o "$WAT"
echo "   bulk-mem  : $(grep -cE 'memory\.(copy|fill|init)|data\.drop|table\.(copy|init)' "$WAT" || true)"
echo "   sign-ext  : $(grep -cE 'extend(8|16|32)_s' "$WAT" || true)"
echo "   call expt : $(grep -c '(export "call"' "$WAT" || true)"
echo "   mem import: $(grep -c '(import .*memory' "$WAT" || true)  (want 0)"
rm -f "$WAT"
echo ">> done: $OUT"

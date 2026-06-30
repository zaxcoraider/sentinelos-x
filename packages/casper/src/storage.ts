import { blake2b } from '@noble/hashes/blake2b';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * Replicates Odra 2.x's storage-key derivation so we can read contract state
 * from outside the VM.
 *
 * Odra stores every module field in a single dictionary at the contract's
 * `state` URef. The dictionary item key is:
 *   hex( blake2b256( index_bytes ++ mapping_data ) )
 *
 * For a top-level field at path `[index]` (≤15 fields), `index_bytes` is the
 * field index encoded as a big-endian u32. A `Var` has empty `mapping_data`;
 * a `Mapping` appends the CL-serialized key bytes.
 *
 * Source: odra-core contract_env.rs (index_bytes / current_key).
 */

function u32be(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, false); // big-endian
  return b;
}

/** CL serialization of a Rust `String`: u32 LE length prefix ++ utf8 bytes. */
export function clString(s: string): Uint8Array {
  const utf8 = new TextEncoder().encode(s);
  const out = new Uint8Array(4 + utf8.length);
  new DataView(out.buffer).setUint32(0, utf8.length, true); // little-endian
  out.set(utf8, 4);
  return out;
}

function dictKey(input: Uint8Array): string {
  return bytesToHex(blake2b(input, { dkLen: 32 }));
}

/** Dictionary item key for a top-level `Var` at the given field index. */
export function varKey(index: number): string {
  return dictKey(u32be(index));
}

/** Dictionary item key for a `Mapping` entry at field index with a String key. */
export function mappingKeyString(index: number, key: string): string {
  const idx = u32be(index);
  const data = clString(key);
  const input = new Uint8Array(idx.length + data.length);
  input.set(idx, 0);
  input.set(data, idx.length);
  return dictKey(input);
}

// Field layout of TreasuryGuard. Odra reserves storage index 0, so the module's
// declared fields are numbered from 1 in declaration order (verified on-chain).
//   1: total_actions  Var<u64>
//   2: last_action    Mapping<String,String>
//   3: last_severity  Mapping<String,u8>
export const FIELD = {
  totalActions: 1,
  lastAction: 2,
  lastSeverity: 3,
} as const;

// Odra stores each value as a CL `List<U8>`; the dictionary read's `parsed` is
// that inner byte array. Decode it back into the original Rust type.

export function decodeU64(bytes: number[]): number {
  const buf = new Uint8Array(bytes.slice(0, 8));
  return Number(new DataView(buf.buffer).getBigUint64(0, true)); // little-endian
}

export function decodeU8(bytes: number[]): number {
  return bytes[0] ?? 0;
}

export function decodeString(bytes: number[]): string {
  const len = new DataView(new Uint8Array(bytes.slice(0, 4)).buffer).getUint32(0, true);
  return new TextDecoder().decode(new Uint8Array(bytes.slice(4, 4 + len)));
}

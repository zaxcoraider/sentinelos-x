// casper-js-sdk ships as CommonJS; some named exports aren't detected by the
// ESM named-import lexer, so import the module object and destructure.
import casperSdk from 'casper-js-sdk';
const {
  RpcClient,
  HttpHandler,
  PrivateKey,
  KeyAlgorithm,
  ContractCallBuilder,
  Args,
  CLValue,
  Timestamp,
} = casperSdk;
type RpcClient = InstanceType<typeof RpcClient>;
type PrivateKey = InstanceType<typeof PrivateKey>;
import {
  NODE_URL,
  CHAIN_NAME,
  PACKAGE_HASH,
  CONTRACT_HASH,
  readSecretKeyPem,
  PAYMENT_RECORD_ACTION,
  explorerTxUrl,
} from './config.js';
import { varKey, mappingKeyString, FIELD, decodeU64, decodeU8, decodeString } from './storage.js';

export * from './config.js';

export function getRpc(): RpcClient {
  return new RpcClient(new HttpHandler(NODE_URL));
}

/** Loads the funded secp256k1 signing key from the PEM at CASPER_SECRET_KEY_PATH. */
export function loadKey(): PrivateKey {
  return PrivateKey.fromPem(readSecretKeyPem(), KeyAlgorithm.SECP256K1);
}

export interface RecordActionResult {
  txHash: string;
  explorerUrl: string;
}

/**
 * Builds, signs and sends a `record_action` transaction to the deployed
 * TreasuryGuard contract. Returns the transaction hash + explorer URL.
 */
export async function recordAction(
  agent: string,
  action: string,
  severity: number,
  value: number | bigint,
): Promise<RecordActionResult> {
  const key = loadKey();

  const args = Args.fromMap({
    agent: CLValue.newCLString(agent),
    action: CLValue.newCLString(action),
    severity: CLValue.newCLUint8(severity),
    value: CLValue.newCLUint64(value),
  });

  // This machine's clock runs ahead of the network; Casper rejects transactions
  // whose timestamp is in the node's future. Backdate by a safe offset (well
  // within the 30-min TTL) to absorb the skew.
  const offsetSec = Number(process.env.CASPER_TS_OFFSET_SEC ?? 60);
  const timestamp = new Timestamp(new Date(Date.now() - offsetSec * 1000));

  const tx = new ContractCallBuilder()
    .from(key.publicKey)
    .byPackageHash(PACKAGE_HASH) // latest version, vm-casper-v1 stored call
    .entryPoint('record_action')
    .runtimeArgs(args)
    .chainName(CHAIN_NAME)
    .payment(PAYMENT_RECORD_ACTION)
    .timestamp(timestamp)
    .build();

  tx.sign(key);

  const res = await getRpc().putTransaction(tx);
  const txHash = res.transactionHash.toHex();
  return { txHash, explorerUrl: explorerTxUrl(txHash) };
}

export interface ExecutionOutcome {
  success: boolean;
  blockHeight?: number;
  cost?: string;
  errorMessage?: string | null;
}

/** Polls until the transaction is executed in a block, then reports the result. */
export async function waitForExecution(
  txHash: string,
  { timeoutMs = 180_000, intervalMs = 4_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<ExecutionOutcome> {
  const rpc = getRpc();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r: any = await rpc.getTransactionByTransactionHash(txHash);
      const info = r?.rawJSON?.execution_info ?? r?.rawJSON?.result?.execution_info;
      const exec = info?.execution_result?.Version2;
      if (exec) {
        const err = exec.error_message ?? null;
        return {
          success: !err,
          blockHeight: info.block_height,
          cost: exec.cost,
          errorMessage: err,
        };
      }
    } catch {
      // not yet in a block / not found — keep polling
    }
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  throw new Error(`Timed out waiting for execution of ${txHash}`);
}

async function getStateUref(rpc: RpcClient): Promise<string> {
  const r: any = await rpc.queryLatestGlobalState(`hash-${CONTRACT_HASH}`, []);
  const namedKeys: Array<{ name: string; key: string }> =
    r?.rawJSON?.stored_value?.Contract?.named_keys ?? [];
  const state = namedKeys.find((k) => k.name === 'state');
  if (!state) throw new Error('Could not locate contract `state` uref');
  return state.key;
}

/** Returns the inner Odra byte array (List<U8>) for a dictionary item, or null. */
async function readDictBytes(
  rpc: RpcClient,
  stateRootHash: string,
  stateUref: string,
  itemKey: string,
): Promise<number[] | null> {
  try {
    const r: any = await rpc.getDictionaryItem(stateRootHash, stateUref, itemKey);
    const parsed = r?.rawJSON?.stored_value?.CLValue?.parsed;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null; // key not written yet
  }
}

export interface TreasuryState {
  totalActions: number;
  lastAction: string | null;
  lastSeverity: number | null;
}

/** Reads live on-chain state for a given agent (default "treasury"). */
export async function readState(agent = 'treasury'): Promise<TreasuryState> {
  const rpc = getRpc();
  const stateUref = await getStateUref(rpc);
  const srh: any = await rpc.getStateRootHashLatest();
  const stateRootHash: string = srh?.rawJSON?.state_root_hash ?? srh?.stateRootHash;

  const total = await readDictBytes(rpc, stateRootHash, stateUref, varKey(FIELD.totalActions));
  const lastAction = await readDictBytes(rpc, stateRootHash, stateUref, mappingKeyString(FIELD.lastAction, agent));
  const lastSeverity = await readDictBytes(rpc, stateRootHash, stateUref, mappingKeyString(FIELD.lastSeverity, agent));

  return {
    totalActions: total ? decodeU64(total) : 0,
    lastAction: lastAction ? decodeString(lastAction) : null,
    lastSeverity: lastSeverity ? decodeU8(lastSeverity) : null,
  };
}

/**
 * Casper ed25519 keypair generator (Windows-compatible, no casper-client needed)
 * Outputs: ./keys/secret_key.pem, public_key.pem, public_key_hex
 * Prints: public key hex + account hash
 */
import { Keys } from 'casper-js-sdk';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keysDir = join(__dirname, '..', 'keys');
mkdirSync(keysDir, { recursive: true });

const keyPair = Keys.Ed25519.new();

writeFileSync(join(keysDir, 'secret_key.pem'), keyPair.exportPrivateKeyInPem());
writeFileSync(join(keysDir, 'public_key.pem'),  keyPair.exportPublicKeyInPem());
writeFileSync(join(keysDir, 'public_key_hex'),   keyPair.publicKey.toHex());

const pubHex     = keyPair.publicKey.toHex();
const acctHash   = keyPair.publicKey.toAccountHashStr();

console.log('\n=== Casper Testnet Keypair ===');
console.log('Public Key Hex : ' + pubHex);
console.log('Account Hash   : ' + acctHash);
console.log('\nFiles saved to ./keys/');
console.log('WARNING: secret_key.pem is gitignored — back it up somewhere safe!\n');

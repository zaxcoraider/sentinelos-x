import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A stray lockfile in the home dir confuses workspace-root inference; pin it.
  outputFileTracingRoot: repoRoot,
  // @sentinelos/casper is a workspace TS package (NodeNext, .js-extension
  // imports) — let Next compile it instead of expecting prebuilt JS.
  transpilePackages: ['@sentinelos/casper'],
  // casper-js-sdk is CommonJS and node-only; keep it external so it is
  // required at runtime on the server rather than bundled.
  serverExternalPackages: ['casper-js-sdk'],
  webpack: (config) => {
    // @sentinelos/casper is NodeNext TS: its source imports siblings with a
    // `.js` extension (e.g. './config.js') that actually resolve to `.ts`.
    // Teach webpack to try `.ts`/`.tsx` before `.js`.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;

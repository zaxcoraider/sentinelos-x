import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A stray lockfile in the home dir confuses workspace-root inference; pin it.
  outputFileTracingRoot: repoRoot,
  // @sentinelos/casper and @sentinelos/agents are workspace TS packages
  // (NodeNext, .js-extension imports) — let Next compile them instead of
  // expecting prebuilt JS.
  transpilePackages: ['@sentinelos/casper', '@sentinelos/agents'],
  // casper-js-sdk (CommonJS, node-only) and the Anthropic SDK are node runtime
  // deps; keep them external so they are required at runtime on the server
  // rather than bundled.
  serverExternalPackages: ['casper-js-sdk', '@anthropic-ai/sdk'],
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

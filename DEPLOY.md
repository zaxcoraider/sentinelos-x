# Deploying SentinelOS to Vercel

The `apps/web` Next.js app deploys to Vercel. The Rust contract is already on
Casper Testnet; the standalone x402 feed is **not** deployed — on Vercel the app
serves it from its own `/api/premium` route automatically.

## 1. Import the repo

1. Vercel → **Add New… → Project** → import `zaxcoraider/sentinelos-x`.
2. **Root Directory:** `apps/web` (Vercel auto-detects the npm workspace and installs
   `@sentinelos/casper` / `@sentinelos/agents` from the monorepo root).
3. **Framework Preset:** Next.js (auto). Leave Build/Install/Output as detected.

## 2. Environment variables

Add these in **Project → Settings → Environment Variables** (values come from your
local `.env` / keys — **never commit them**). Contract + public key are public.

| Variable | Value / source | Needed for |
|---|---|---|
| `TREASURY_GUARD_PACKAGE_HASH` | `7f56caa1d89d394786354bc382b1896fcd21fd77d0cea33c41a54e28c56990db` | reads + writes |
| `TREASURY_GUARD_CONTRACT_HASH` | `ec9b7dd9f53cad08c63b54f03e50b27c5637a285c6977e5dc5ec5d7f07e2d9cd` | reads |
| `CASPER_PUBLIC_KEY_HEX` | `02028581cc33021aa4f334f7f47d9aebfd457f59166583909e650e1523eea0c69a81` | event feed, x402 |
| `CASPER_SECRET_KEY_B64` | base64 of `keys/secret_key.pem` (see below) | **on-chain writes** (Approve / Submit / live x402) |
| `ANTHROPIC_API_KEY` | your DGrid key (from `.env`) | agent reasoning |
| `AGENT_BASE_URL` | `https://api.dgrid.ai` | agent reasoning |
| `AGENT_MODEL` | `anthropic/claude-opus-4.8` (or a faster model — see timeout note) | agent reasoning |
| `AGENT_AUTH_STYLE` | `bearer` | agent reasoning |
| `CSPR_CLOUD_API_KEY` | your CSPR.cloud key (from `.env`) | on-chain activity feed |
| `X402_MODE` | `stub` (recommended) — `live` spends CSPR per run + needs the key | x402 leg |
| `AGENTS_ONCHAIN` | **`core`** on Vercel (Treasury + Governance only) | caps on-chain spend |

> **`AGENTS_ONCHAIN` — important on Vercel.** All 12 agents can anchor their own
> `record_action` (~20 CSPR each → **~240 CSPR per incident** in `all` mode), which also
> won't finish inside Hobby's 60s. So set **`AGENTS_ONCHAIN=core`** on Vercel (only Treasury +
> Governance write; the other 10 still run + stream their real analysis). Run the full 12-tx
> money-shot **locally** for the video: `AGENTS_ONCHAIN=all` (the default) with no 60s limit.

Optional (have sensible defaults): `CASPER_NODE_URL`, `CASPER_CHAIN_NAME`,
`CSPR_CLOUD_REST_URL`, `PREMIUM_DATA_URL` (auto-derived from `VERCEL_URL`),
`AGENT_FAST_MODEL` (advisory agents; defaults to `AGENT_MODEL`).

### Base64 the signing key

```powershell
# PowerShell (Windows)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("keys/secret_key.pem"))
```
```bash
# bash / WSL
base64 -w0 keys/secret_key.pem
```
Paste the single-line output as `CASPER_SECRET_KEY_B64`.

> The app reads the key from `CASPER_SECRET_KEY_B64` (or `CASPER_SECRET_KEY_PEM`)
> when present, else the local file. It's a **testnet** key — low stakes — but treat
> it as a secret. Skip it for a read-only deploy (the write buttons then no-op).

## 3. Deploy

Click **Deploy**. Vercel builds and gives you a URL. Pushes to `main` auto-redeploy.

Or from this repo (needs `vercel login` first): `! vercel --cwd apps/web`.

## ⏱ Hobby-tier timeout note

Vercel **Hobby caps serverless functions at 60s**. A live crisis run makes ~4
sequential model calls; on Opus that can exceed 60s and the stream may cut off.

- **Fix (free):** set `AGENT_MODEL` to a faster DGrid model (e.g.
  `anthropic/claude-sonnet-4.6` or `anthropic/claude-haiku-4.5`) for the hosted demo.
- **Fix (paid):** Vercel **Pro** raises the cap to 300s — the full Opus crisis runs comfortably.
- The Mission Control **Trigger** is a dry run (reasoning only, no CSPR); **Approve**
  fires one real on-chain tx. `X402_MODE=stub` keeps the x402 handshake spend-free.

## What works on the hosted URL

- ✅ Mission Control, Live Market (CoinGecko), chain-state reads, CSPR.cloud event feed
- ✅ Live agent reasoning (crisis / council), x402 handshake via `/api/premium`
- ✅ On-chain writes (Approve / Submit motion) — with `CASPER_SECRET_KEY_B64` set

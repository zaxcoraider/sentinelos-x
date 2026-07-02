# SentinelOS X — an Autonomous OS for Web3 protocols

> Most Web3 AI projects *answer questions*. SentinelOS **runs the protocol**.
> When a stablecoin depegs, a team of AI agents — Risk, Commander, Treasury, Governance —
> detect it, pay for premium data over **x402**, decide a fix, and **execute it on Casper**,
> in seconds, with a human only approving. It isn't another agent. It's the operating
> system those agents run on — and a marketplace where anyone can publish new ones.

Built for the **Casper Agentic Buildathon 2026** (Agentic AI track) on **Casper Network 2.0**
(Rust → WASM via [Odra](https://odra.dev)). Not EVM, not Solana.

**Live today:** Commander · Risk · Treasury · Governance agents · x402 payments · an on-chain
`TreasuryGuard` contract · a multi-page dashboard.
**Verifiable:** every "real" action links to a transaction on [cspr.live](https://testnet.cspr.live).

---

## The autonomous crisis loop (real, end-to-end)

A **stress drill** — a simulated 7% USDC depeg on the **real, live-monitored** asset — handled
with zero human keystrokes, captured from a live run:

```
🛡  Risk        → severity 82/100 (Claude): "severe deviation, collateral stress"
🧭  Commander   → 82 > 60 threshold → wake Treasury
💰  Treasury    → pays for REAL market data over x402 (live CoinGecko vol + peg,
                  real CSPR settlement) → decides REBALANCE (88%, ~$4.2M protected)
                → records the action on-chain (TreasuryGuard)
🏛  Governance  → drafts an emergency proposal, anchors it on-chain for the DAO
```

> **Honesty:** the USDC price/volatility the agents read is **real and live** (CoinGecko);
> the depeg shock is a labeled drill; the reasoning, x402 settlement, and on-chain records are
> all real. We never present a simulated event as a real-world one.

**On-chain proof (Casper Testnet):**

| Leg | Transaction |
|-----|-------------|
| x402 settlement (native CSPR transfer) | [`3ed1ab89…`](https://testnet.cspr.live/transaction/3ed1ab89485c1f72476ada58d77352faea292fd07ad0dcf43f00c9e23a4d37e3) |
| Treasury `record_action` | [`6dbd5cf3…`](https://testnet.cspr.live/transaction/6dbd5cf3ce7f45b7b3fa646e3d015982f6df364a95b2a889fc7eb1a3ba043f15) |
| Governance `PROPOSAL` | [`7578c580…`](https://testnet.cspr.live/transaction/7578c580f17e5e3580d346411c785cc8dae7a011ad426ef363753f6918043e8d) |

The dashboard replays this loop live at **/crisis** — each agent's reasoning streams in as it
actually happens, with the tx hashes linking out to cspr.live.

---

## See it live

▶ **Live demo:** _deployed on Vercel — see the link in the repo's **About** panel (top-right)._

The running app is the best way to experience it: open **Mission Control**, hit **Trigger
incident**, and watch the live agent network light up, the reasoning stream in, and the
on-chain records land — each linking to cspr.live. Runs on **live Casper Testnet state**, no
mock data. (Or run it locally — see [Run it yourself](#run-it-yourself).)

---

## What's live vs. roadmap (we never label mock data as real)

### Agents

| Agent | Role | Status |
|-------|------|--------|
| **Commander** | Orchestrator — routes work, decides who acts (deterministic threshold gate) | 🟢 Live |
| **Risk** | Scores event severity 0–100 with a grounded rationale (Claude) | 🟢 Live |
| **Treasury** | Buys data over x402, decides the protective action, writes it on-chain | 🟢 Live |
| **Governance** | Drafts emergency proposals and anchors them on-chain for a vote | 🟢 Live |
| Oracle · Compliance · Analytics · Insurance · Growth · Community · Legal · Liquidity | The rest of the team | 🔵 Coming in v1 |

### Product

| Module | Status |
|--------|--------|
| **Mission Control** — live agent network, streaming reasoning, threat + on-chain status | 🟢 Live |
| **Crisis Response** — streamed depeg → trace → x402 → tx → recover | 🟢 Live |
| **Agent Team** — installable agent cards (4 live, 8 marketplace) | 🟢 Live |
| **Governance Council** — AI council debates the response and submits a motion on-chain | 🟢 Live |
| **Security Center** — threat radar over on-chain state + event log | 🟢 Live |
| Analytics · Marketplace checkout · Smart Contract Center · Settings | 🔵 Coming in v1 |

---

## Architecture

```
              Next.js 15 dashboard  (apps/web)
                        │
        streaming crisis route  ·  server actions
                        │
              Orchestrator (agent bus)          packages/agents
        Risk ─→ Commander ─→ Treasury ─→ Governance
                        │            │
              Claude (via DGrid)   x402 premium-data feed   services/premium-data
                        │            │
                @sentinelos/casper  (recordAction · readState · transferCspr)
                        │
                 Casper 2.0 Testnet  →  TreasuryGuard (Odra contract)
```

- **Contract** — `contracts/treasury_guard`, Odra 2.8.2 → WASM, deployed on Casper Testnet.
  Entry point `record_action(agent, action, severity, value)` updates on-chain storage and
  emits an `ActionRecorded` event; views `total_actions()` / `last_action_of(agent)`.
- **Agents** — `packages/agents`: Commander/Risk/Treasury/Governance on **Claude**
  (`@anthropic-ai/sdk`, tool-based structured output) reached through the **DGrid** gateway.
  The orchestrator is a deterministic graph (Risk → Commander gate → Treasury → Governance).
- **x402** — `services/premium-data`: an HTTP **402 Payment Required** feed. On the challenge,
  the client calls the **official hosted Casper x402 facilitator** (`x402-facilitator.cspr.cloud`,
  authenticated with our CSPR.cloud key) to confirm the `exact` scheme is live on
  `casper:casper-test` and read its settlement `feePayer`, then settles and unlocks **real live
  market data** (CoinGecko ETH volatility + USDC peg, computed server-side). The x402 fetch is
  best-effort — the loop still proceeds if the feed or facilitator is down, so **qualification
  never depends on x402**.
- **Chain I/O** — `packages/casper`: `casper-js-sdk` 5.0.12 for `recordAction`, `readState`,
  and `transferCspr`.

---

## Tech stack

- **Contract:** Rust + Odra 2.8.2 → WASM, Casper Testnet (`casper-test`)
- **Chain I/O:** `casper-js-sdk` 5.0.12
- **Agents:** Claude via `@anthropic-ai/sdk` (model `claude-opus-4.8`), tool-based structured
  output, through the **DGrid** Anthropic-compatible gateway
- **Payments:** HTTP 402 (x402) with a live handshake to the official **Casper x402 facilitator** + native CSPR settlement
- **Market data:** CoinGecko (free, live) — real ETH volatility + USDC peg, delivered over x402
- **Frontend:** Next.js 15.5 (App Router) · Tailwind v3 · shadcn-style UI · Framer Motion

---

## Casper AI Toolkit — the sponsor stack we build on

SentinelOS runs on the official [Casper AI Toolkit](https://www.casper.network/ai):

- **Odra** — the `TreasuryGuard` contract (Rust → WASM), deployed to testnet.
- **CSPR.cloud** — real-time chain data: the Security Center's on-chain activity feed reads
  live `record_action` events via the CSPR.cloud REST API.
- **MCP (Model Context Protocol)** — this repo wires the official **Casper MCP server**
  (`mcp.testnet.cspr.cloud`) in [`.mcp.json`](.mcp.json), so any MCP agent (Claude Code, etc.)
  can query and operate the TreasuryGuard contract through Casper's standardized tooling —
  `get_account_deploys`, `get_contract`, `get_account_info`, `get_account_ft_balances`, and 40+ more.
  Verified handshake: `CasperMcp v3.1.0`.
- **x402** — HTTP-native micropayments. On every paid fetch the agent makes a **live,
  authenticated call to the official Casper x402 facilitator** (`x402-facilitator.cspr.cloud`
  `GET /supported`) to confirm the `exact` scheme + `casper:casper-test` network and read its
  on-chain settlement `feePayer` — surfaced in the Crisis timeline. The value leg settles via a
  real native-CSPR transfer today; `verifyPayment`/`settlePayment` (`packages/agents/src/x402/facilitator.ts`)
  wire the facilitator's `/verify` + `/settle` for the full CEP-18 (WCSPR) + EIP-712 production path.
- **AI Skills** — the signing/execution layer (`@sentinelos/casper`) mirrors the CSPR.build
  Agent Skills model.

```jsonc
// .mcp.json — the official Casper MCP server, keyed by CSPR_CLOUD_API_KEY
{ "mcpServers": { "casper": { "type": "http",
  "url": "https://mcp.testnet.cspr.cloud/mcp",
  "headers": { "X-CSPR-Cloud-Api-Key": "${CSPR_CLOUD_API_KEY}" } } } }
```

---

## Repository layout

```
sentinelos-x/
├── contracts/treasury_guard/   Odra contract (Rust) — DEPLOYED to testnet
├── packages/casper/            TS chain layer (recordAction · readState · transferCspr)
├── packages/agents/            Commander/Risk/Treasury/Governance + x402 client + orchestrator
├── services/premium-data/      x402-gated live market feed (HTTP 402 · CoinGecko)
└── apps/web/                   Next.js dashboard (Dashboard · Crisis · Agent Team · Security)
```

Deployed contract package:
[`7f56caa1…56990db`](https://testnet.cspr.live/contract-package/7f56caa1d89d394786354bc382b1896fcd21fd77d0cea33c41a54e28c56990db)

---

## Run it yourself

Requires Node 20+ and a funded Casper Testnet key in `keys/secret_key.pem`, plus a `.env`
(see the addresses in this README). LLM access is configured via `AGENT_BASE_URL` /
`AGENT_MODEL` / `AGENT_AUTH_STYLE` + a key in `ANTHROPIC_API_KEY` (works with native Anthropic
or an Anthropic-compatible gateway such as DGrid).

```bash
npm install

# 1. The dashboard (Dashboard · Crisis · Agent Team · Security)
npm run dev --workspace @sentinelos/web        # http://localhost:3000

# 2. The x402 premium-data feed (needed for the paid data leg)
npm run start --workspace @sentinelos/premium-data   # :4021

# 3. The live agent crisis loop — real Claude + x402 + on-chain records
X402_MODE=live npm run agent --workspace @sentinelos/agents
#   add --dry (and drop X402_MODE=live) for a no-spend wiring check
```

Rebuild / redeploy the contract: `bash scripts/build_contract.sh` then see `scripts/deploy.md`.

---

## The honesty rules (non-negotiable)

1. **Never label mock data as real.** Live agents and on-chain txs are real; everything else
   is a clearly-marked "Coming in v1" card.
2. **Qualification never depends on x402.** The paid data fetch is best-effort; the loop
   proceeds if the feed is down.
3. **Every "real" artifact links to cspr.live** — the agent trace, the x402 settlement, and
   each `record_action` show a verifiable transaction hash.

---

Repo: https://github.com/zaxcoraider/sentinelos-x

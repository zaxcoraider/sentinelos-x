# SentinelOS X — an Autonomous OS for Web3 protocols

> Most Web3 AI projects *answer questions*. SentinelOS **runs the protocol**.
> When a stablecoin depegs, a team of AI agents — Risk, Commander, Treasury, Governance —
> detect it, pay for premium data over **x402**, decide a fix, and **execute it on Casper**,
> in seconds, with a human only approving. It isn't another agent. It's the operating
> system those agents run on — and a marketplace where anyone can publish new ones.

Built for the **Casper Agentic Buildathon 2026** (Agentic AI track) on **Casper Network 2.0**
(Rust → WASM via [Odra](https://odra.dev)). Not EVM, not Solana.

**Live today:** a **full 12-agent team** — each one anchors its own action to the on-chain
`TreasuryGuard` contract during an incident · x402 payments over the official Casper facilitator
· a multi-page dashboard.
**Verifiable:** every agent's action is a real transaction on [cspr.live](https://testnet.cspr.live) — one incident, ~12 on-chain proofs.

---

## The autonomous crisis loop (real, end-to-end)

A **stress drill** — a simulated 7% USDC depeg on the **real, live-monitored** asset — handled
with zero human keystrokes, captured from a live run:

```
🛡  Risk        → severity 82/100 (Claude): "severe deviation, collateral stress"
📡  Oracle      → pulls the premium feed over x402 (real Casper facilitator + CSPR
                  settlement), confirms USDC peg + ETH reference — anchored on-chain
📊  Analytics   → real annualized vol → STRESSED regime, 24h depeg probability — anchored
🧭  Commander   → 82 > 60 threshold → wake the full team
💰  Treasury    → decides REBALANCE (88%, ~$4.2M protected) → executes on-chain
⚖️🌊🛟🌱📣📜  Compliance · Liquidity · Insurance · Growth · Community · Legal
                → six domain agents weigh in (Claude), each anchored on-chain
🏛  Governance  → drafts an emergency proposal, anchors it for the DAO
                → 12 agents · ~12 verifiable Casper transactions · one incident
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

### Agents — all 12 live, each anchors its own `record_action` on Casper

| Agent | Role | On-chain |
|-------|------|----------|
| **Commander** | Orchestrator — routes work on a deterministic threshold gate | 🟢 `ROUTE` |
| **Oracle** | Acquires the premium feed over x402, confirms the live peg + reference price | 🟢 `FEED_CONFIRMED` |
| **Risk** | Scores event severity 0–100 with a grounded rationale (Claude) | 🟢 `ASSESS` |
| **Analytics** | Real annualized volatility, regime, modeled depeg probability (deterministic) | 🟢 `ANOMALY` |
| **Compliance** | Reviews the action against policy + regulatory expectations (Claude) | 🟢 `CLEARED`/`FLAGGED` |
| **Liquidity** | Slippage / market-depth check on the action (Claude) | 🟢 `CLEARED`/`CAUTION` |
| **Treasury** | Decides the protective action and executes it on-chain (Claude) | 🟢 action, e.g. `REBALANCE` |
| **Insurance** | Reserve / coverage-adequacy assessment (Claude) | 🟢 `CLEARED`/`CAUTION` |
| **Growth** | TVL/retention impact + incentive response (Claude) | 🟢 `CLEARED`/`CAUTION` |
| **Community** | Sentiment + communications posture (Claude) | 🟢 `CLEARED`/`CAUTION` |
| **Legal** | Legal/entity exposure + disclosure flags (Claude) | 🟢 `CLEARED`/`FLAGGED` |
| **Governance** | Drafts the emergency proposal and anchors it for the DAO (Claude) | 🟢 `PROPOSAL` |

> **Honest split:** Treasury + Governance take protocol **actions**; the other ten contribute
> real **data/analysis** (Oracle + Analytics are deterministic over live market data, the six
> advisory agents are real Claude reasoning). Every one anchors a verifiable `record_action`
> to TreasuryGuard, so a single incident produces ~12 transactions on cspr.live.

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

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

A single 7% USDx depeg, handled with zero human keystrokes — captured from a live run:

```
🛡  Risk        → severity 82/100 (Claude): "severe deviation, collateral stress"
🧭  Commander   → 82 > 60 threshold → wake Treasury
💰  Treasury    → buys premium volatility over x402 (real CSPR settlement)
                → decides REBALANCE (88% confidence, ~$4.2M protected)
                → records the action on-chain (TreasuryGuard)
🏛  Governance  → drafts an emergency proposal, anchors it on-chain for the DAO
```

**On-chain proof (Casper Testnet):**

| Leg | Transaction |
|-----|-------------|
| x402 settlement (native CSPR transfer) | [`3ed1ab89…`](https://testnet.cspr.live/transaction/3ed1ab89485c1f72476ada58d77352faea292fd07ad0dcf43f00c9e23a4d37e3) |
| Treasury `record_action` | [`6dbd5cf3…`](https://testnet.cspr.live/transaction/6dbd5cf3ce7f45b7b3fa646e3d015982f6df364a95b2a889fc7eb1a3ba043f15) |
| Governance `PROPOSAL` | [`7578c580…`](https://testnet.cspr.live/transaction/7578c580f17e5e3580d346411c785cc8dae7a011ad426ef363753f6918043e8d) |

The dashboard replays this loop live at **/crisis** — each agent's reasoning streams in as it
actually happens, with the tx hashes linking out to cspr.live.

---

## Screenshots

| | |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Agent Team](docs/screenshots/agent-team.png) |
| ![Crisis Response — live agent trace](docs/screenshots/crisis-trace.png) | ![Security Center](docs/screenshots/security-center.png) |

*Dashboard · Agent Team · Crisis Response (live agent trace) · Security Center — all on live Casper Testnet state.*

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
| **Dashboard** — protocol status, agents online, threat level, on-chain actions | 🟢 Live |
| **Crisis Response** — streamed depeg → trace → x402 → tx → recover | 🟢 Live |
| **Agent Team** — installable agent cards (4 live, 8 marketplace) | 🟢 Live |
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
- **x402** — `services/premium-data`: an HTTP **402 Payment Required** feed; the client pays
  with a real native CSPR transfer, then unlocks the volatility data. The x402 fetch is
  best-effort — the loop still proceeds if the feed is down, so **qualification never depends
  on x402**.
- **Chain I/O** — `packages/casper`: `casper-js-sdk` 5.0.12 for `recordAction`, `readState`,
  and `transferCspr`.

---

## Tech stack

- **Contract:** Rust + Odra 2.8.2 → WASM, Casper Testnet (`casper-test`)
- **Chain I/O:** `casper-js-sdk` 5.0.12
- **Agents:** Claude via `@anthropic-ai/sdk` (model `claude-opus-4.8`), tool-based structured
  output, through the **DGrid** Anthropic-compatible gateway
- **Payments:** custom HTTP 402 (x402) + native CSPR settlement
- **Frontend:** Next.js 15.5 (App Router) · Tailwind v3 · shadcn-style UI · Framer Motion

---

## Repository layout

```
sentinelos-x/
├── contracts/treasury_guard/   Odra contract (Rust) — DEPLOYED to testnet
├── packages/casper/            TS chain layer (recordAction · readState · transferCspr)
├── packages/agents/            Commander/Risk/Treasury/Governance + x402 client + orchestrator
├── services/premium-data/      x402-gated volatility feed (HTTP 402)
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

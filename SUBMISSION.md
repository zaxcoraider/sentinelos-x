# SentinelOS X — Submission Kit

Everything needed to submit to the **Casper Agentic Buildathon 2026** (Agentic AI track):
DoraHacks form answers, a 3-minute video script, and a demo checklist.

---

## 1. DoraHacks form answers

**Project name:** SentinelOS X

**Tagline (one line):** An autonomous operating system for Web3 — a team of AI agents that
detect a stablecoin depeg, pay for data over x402, and execute the fix on Casper in seconds.

**Track:** Agentic AI

**Elevator pitch (2–3 sentences):**
Most Web3 AI projects answer questions; SentinelOS runs the protocol. When a stablecoin
depegs, our agents — Risk, Commander, Treasury, Governance — detect it, pay for premium data
over x402, decide a fix, and execute it on Casper, with a human only approving. It's not
another agent — it's the OS those agents run on, and a marketplace where anyone can publish
new ones.

**What it does:**
- Four live AI agents run an autonomous crisis loop over an on-chain treasury.
- Risk scores a market event (0–100); Commander routes on a threshold; Treasury pays for
  **real live market data** (CoinGecko ETH vol + USDC peg) over **x402** (a real native CSPR
  settlement), decides a protective action, and records it on-chain; Governance drafts an
  emergency proposal and anchors it on-chain.
- A Next.js "Mission Control" dashboard streams the whole trace live — an animated agent
  network, reasoning panel, and event timeline — and links every action to cspr.live.
- The monitored asset is real USDC (live peg); the depeg is a clearly-labeled stress drill.

**How Casper 2.0 is used:**
- An Odra (Rust → WASM) `TreasuryGuard` contract deployed to Casper Testnet, with a
  `record_action` entry point that updates storage and emits an `ActionRecorded` event.
- Agents sign and submit real transactions via `casper-js-sdk` (record_action + native CSPR
  transfer for x402 settlement). All state on the dashboard is read live from the chain.

**Tech:** Rust · Odra 2.8.2 · casper-js-sdk 5.0.12 · Claude (`claude-opus-4.8`, tool-based
structured output, via the DGrid gateway) · x402 HTTP-402 payments · CoinGecko live market data
· **Casper AI Toolkit**: official **Casper MCP server** (`.mcp.json`), **CSPR.cloud** (real
on-chain event feed), Odra, x402 facilitator (production path) · Next.js 15 + Tailwind + Framer Motion.

**Links:**
- Repo: https://github.com/zaxcoraider/sentinelos-x
- Contract package: https://testnet.cspr.live/contract-package/7f56caa1d89d394786354bc382b1896fcd21fd77d0cea33c41a54e28c56990db
- Demo video: `<add link>`

**Verifiable on-chain (from a live run):**
- x402 settlement — https://testnet.cspr.live/transaction/3ed1ab89485c1f72476ada58d77352faea292fd07ad0dcf43f00c9e23a4d37e3
- Treasury record_action — https://testnet.cspr.live/transaction/6dbd5cf3ce7f45b7b3fa646e3d015982f6df364a95b2a889fc7eb1a3ba043f15
- Governance PROPOSAL — https://testnet.cspr.live/transaction/7578c580f17e5e3580d346411c785cc8dae7a011ad426ef363753f6918043e8d

**What's next (v1):** the other 8 agents (Oracle, Compliance, Analytics, Insurance, Growth,
Community, Legal, Liquidity), a full Governance council vote, an agent marketplace/SDK, and
multi-protocol coverage.

---

## 2. Three-minute video script

> Screen-record the dashboard at `npm run dev`. Have the premium-data feed running so the
> live x402 leg fires. Keep a cspr.live tab ready.

**0:00–0:25 — The hook (Mission Control)**
> "Most Web3 AI answers questions. SentinelOS *runs the protocol*."
Show Mission Control: the live agent network, Protocol Health 100%, Agents 4/12, real on-chain
tx count, and the **Live Market bar monitoring real USDC ($0.9996, peg holding · CoinGecko)**.
"Four AI agents, live, watching a real treasury on Casper — with real market data."

**0:25–0:50 — The team (Agent Team)**
Click **Agent Team**. "Commander, Risk, Treasury, Governance — live, acting on-chain today.
Eight more ship in v1. We never fake it: green means real, grey means roadmap."

**0:50–2:05 — The crisis — the wow moment**
On Mission Control, click **Trigger incident** (a USDC depeg stress drill). Narrate as the
agent graph lights up and the trace streams:
> "A 7% USDC depeg drill hits. **Risk** scores it 82 out of 100. **Commander** routes it and
> wakes Treasury. **Treasury** pays for **real market data over x402** — a real CSPR settlement,
> here's the hash — then recommends REBALANCE, ~$4.2M protected. I **approve** — that fires the
> real on-chain record. **Governance** reaches consensus on an emergency proposal."
Health recovers, threat returns to LOW. "All of that, in seconds — a human only approves."

**2:05–2:35 — Proof (cspr.live)**
Click a tx hash. Show the transaction on cspr.live. "Every action is a verifiable Casper
transaction — the settlement, the treasury action, the governance proposal."

**2:35–3:00 — The vision**
Back to Agent Team / Security Center. "Today: four agents, x402, an on-chain contract, a live
dashboard. Tomorrow: the full agent OS and a marketplace where any protocol installs the
agents it needs. SentinelOS — the autonomous OS for Web3."

---

## 3. Demo capture checklist

- [ ] `npm run start --workspace @sentinelos/premium-data` (x402 feed on :4021)
- [ ] `npm run dev --workspace @sentinelos/web` (dashboard on :3000)
- [ ] Funded testnet key present at `keys/secret_key.pem`; `.env` has DGrid/LLM config + balance
- [ ] Walk Dashboard → Agent Team → Crisis (trigger the depeg, let it stream) → Security Center
- [ ] Click through at least one tx hash to cspr.live on camera
- [ ] Record ≤ 3 min; upload; paste the link into the DoraHacks form and the README
```

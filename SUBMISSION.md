# SentinelOS X — Submission Kit

The judge-facing answers for the **Casper Agentic Buildathon 2026** (Agentic AI track) —
copy these into the DoraHacks form. (The video script + recording checklist live in the
local, gitignored `SUBMISSION_NOTES.md`.)

---

## DoraHacks form answers

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
- A **12-agent team** runs an autonomous crisis loop over an on-chain treasury, and **every
  agent anchors its own `record_action` on Casper** — one incident, ~12 verifiable transactions.
- Oracle pulls **real live market data** (CoinGecko ETH vol + USDC peg) over **x402** (paid via
  the official Casper facilitator); Analytics quantifies the anomaly; Risk scores it; Commander
  routes; Treasury decides + executes the protective action on-chain; six domain agents
  (Compliance, Liquidity, Insurance, Growth, Community, Legal) weigh in with real Claude
  reasoning; Governance drafts + anchors an emergency proposal.
- Honest split: Treasury + Governance take protocol **actions**; the other ten contribute real
  **data/analysis** (Oracle + Analytics deterministic over live data; six advisory agents are
  real Claude). All twelve anchor a verifiable record on-chain.
- A Next.js "Mission Control" dashboard streams the whole trace live — an animated 12-node agent
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
on-chain event feed), Odra, live handshake to the official **Casper x402 facilitator**
(`x402-facilitator.cspr.cloud`) · Next.js 15 + Tailwind + Framer Motion.

**Links:**
- Repo: https://github.com/zaxcoraider/sentinelos-x
- Contract package: https://testnet.cspr.live/contract-package/7f56caa1d89d394786354bc382b1896fcd21fd77d0cea33c41a54e28c56990db
- Demo video: https://youtu.be/kM4nOijX2M4

**Verifiable on-chain (one live incident — 12 agents, 12 transactions, `total_actions` 8→20):**
- Treasury `REBALANCE` — https://testnet.cspr.live/transaction/558753bf1aa084563dad75bbd978db914be112a505fc21b70d116c67b4875161
- Governance `PROPOSAL` — https://testnet.cspr.live/transaction/996dff137cfda9869a2c0eadfe7fa8f9c84971bf1fecd675f95a28069c2416e2
- Oracle `FEED_CONFIRMED` — https://testnet.cspr.live/transaction/1c6132d49f804de4191e831a0d77985bd4e7c713bfa967e53e596239bbeaa00b
- x402 settlement (via Casper facilitator) — https://testnet.cspr.live/transaction/f82bbf7f76caff29b613ed21dca3ac76ab9ed63e928da9f66f73f9f196374c6d
- **All 12 agent records** (Risk, Analytics, Commander, Compliance, Liquidity, Insurance, Growth, Community, Legal + the above) are listed in the README's on-chain-proof table.

**What's next (every step extends something already live). Next (v1):** an agent **marketplace +
Developer SDK** (publish/install agents like extensions), **multi-protocol coverage** (any protocol
installs the team), full **token-weighted governance** (voting + timelocks + auto-execution), and a
**configurable autonomy dial** (auto-execute under a risk threshold, human-gate above). **The
vision:** **provable AI operations** — a tamper-proof on-chain record of *why* every action was
taken, which only a Casper-native OS can promise — an **x402 data/compute economy** where agents buy
their own data (full WCSPR + EIP-712 settle), and agents that *act* (hedge, provide liquidity, pay
insurance), all driveable over a public **MCP** surface.

---

*Video script + recording checklist: see the local, gitignored `SUBMISSION_NOTES.md`.*

# MNA Agent

An autonomous AI agent for the [My Neighbor Alice](https://www.myneighboralice.com/) dApp on the Chromia blockchain. Give it a natural-language goal and it will reason step by step, query your on-chain inventory, and execute purchases — all without manual confirmation.

## How it works

The agent runs an agentic loop powered by Claude. On each iteration it decides whether to call a tool or produce a final answer:

- **`get_ft4_inventory`** — queries the player's live asset balances from the Chromia node via `postchain-client`
- **`buy_items`** — executes a purchase from a named shop (currently stubbed; requires a signed MetaMask/ft4 session — see [Roadmap](#roadmap))

The Anthropic API key never reaches the browser. Vite's dev-server proxy intercepts all `/api/anthropic/*` requests and injects the key server-side before forwarding to `api.anthropic.com`.

```
Browser → /api/anthropic/v1/messages
            ↓ Vite proxy (injects ANTHROPIC_API_KEY)
          https://api.anthropic.com/v1/messages
```

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- A Chromia node URL and the MNA blockchain RID

## Setup

```bash
git clone https://github.com/your-username/agentic-ai-mna
cd agentic-ai-mna
npm install
cp .env.example .env
```

Open `.env` and fill in the three values:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (`sk-ant-...`). Server-side only — never bundled. |
| `VITE_CHROMIA_NODE_URL` | Full URL of a Chromia node, e.g. `https://node1.chromia.com:7740` |
| `VITE_CHROMIA_BRID` | 32-byte hex RID of the MNA dApp blockchain |

## Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Enter your account ID in the **config** panel (hex `byte_array`), then type a goal:

- *Check my current inventory*
- *Buy 5 carrot seeds from the general store*
- *Buy 10 water buckets and 20 carrot seeds from general_store*

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 18 + Vite |
| LLM | Claude (`claude-opus-4-6`) via `@anthropic-ai/sdk` |
| Blockchain | Chromia via `postchain-client` |
| API key security | Vite dev-server proxy (key never leaves the server) |

## Project structure

```
mna-agent.jsx   — agent loop, tool definitions, and all UI
main.jsx        — React entry point
index.html      — HTML shell
vite.config.js  — Vite config: Anthropic proxy + Node.js polyfills for browser
.env.example    — environment variable template
```

## Roadmap

- **`buy_items` live transactions** — connect MetaMask, derive an ft4 session, and call `session.call(op("buy_items", ...))` instead of the current stub
- **Wallet login** — replace the manual account ID input with MetaMask sign-in; ft4 derives the `account_id` from the EVM address automatically
- **More tools** — crafting, staking, marketplace listings

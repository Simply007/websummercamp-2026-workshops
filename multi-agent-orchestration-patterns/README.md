# Multi-Agent Orchestration Patterns — my workshop playground

> **[Web Summer Camp 2026](https://websummercamp.com/2026) — AI Engineering track**
> Session: [Multi-Agent Orchestration Patterns](https://websummercamp.com/2026/session/multi-agent-orchestration-patterns)
> Speaker: **Nikola Poljanec**, Senior Developer at Atomic Intelligence
> Original workshop repo: [bitbucket.org/nikola_poljanec/wsc26](https://bitbucket.org/nikola_poljanec/wsc26)

## My playground

Ran 3-agent pipelines over customer support tickets (see `fixtures/`) through
the main orchestration topologies in `src/topologies/`: sequential pipeline,
parallel fan-out, supervisor-worker routing, and council-style consensus —
comparing freeform-prose vs structured-JSON handoffs between agents. Also
worked through the broken-pipeline debugging exercise (`pnpm broken` and
friends), hunting the hidden bugs with traces and logs. Everything runs
offline in mock mode by default; add an Anthropic or OpenAI key in `.env`
to run against a real LLM.

The original workshop README follows below.

---

# Multi-Agent Orchestration Patterns – Demo Repo

Hands-on workshop repo for exploring multi-agent orchestration topologies using TypeScript.  
Runs fully offline in mock mode — no API keys required.

### Required

| Tool    | Min version | Install                                                 |
| ------- | ----------- | ------------------------------------------------------- |
| Node.js | 22+         | [nodejs.org](https://nodejs.org) or `nvm install --lts` |
| pnpm    | any         | `npm install -g pnpm`                                   |
| Git     | any         | [git-scm.com](https://git-scm.com)                      |

```bash
# verify
node --version   # v22+
pnpm --version
git --version
```

## Quick start

```bash
git clone <your-repo-url>
cd wsc26-orchestration

cp .env.example .env   # optional — mock is the default

pnpm install
pnpm sequential
```

## API keys & CLI setup

The repo runs in mock mode by default — no keys needed. To run against a real LLM:

**1. Get an API key**

- Anthropic: [console.anthropic.com](https://console.anthropic.com) → API Keys → Create key
- OpenAI: [platform.openai.com](https://platform.openai.com) → API keys → Create new secret key

**2. Add it to your `.env`**

```bash
cp .env.example .env
```

Then edit `.env`:

```env
# pick one
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

LLM_PROVIDER=anthropic   # or openai
```

**3. Connect the Claude CLI** (optional — for live coding with Claude Code)

```bash
npm install -g @anthropic-ai/claude-code
claude login          # opens browser auth
claude               # start a session in this repo
```

> The CLI uses your Anthropic account credentials separately from `ANTHROPIC_API_KEY` in `.env`. You can have one without the other.

---

## What `pnpm sequential` does

Runs a 3-agent pipeline against a sample angry-customer support ticket:

```
[classifierAgent]  →  categorizes the ticket (billing/shipping/returns/other)
                        priority (low/medium/high), sentiment (negative/neutral/positive)

[responseAgent]    →  drafts a reply based on the classification

[escalationAgent]  →  decides whether to escalate to a human agent
```

Each step logs its input and output so you can watch state flow through the pipeline.

## Sequential pipeline: freeform vs structured handoff

The `HANDOFF_MODE` env var controls how state flows between agents.

**Freeform** — classifier returns a raw text summary; downstream agents parse prose:

```bash
HANDOFF_MODE=freeform pnpm sequential
```

**Structured** — classifier returns typed JSON; downstream agents read explicit fields:

```bash
HANDOFF_MODE=structured pnpm sequential
```

`freeform` is the default (omitting the flag runs freeform).

## Mock mode (default)

`LLM_PROVIDER=mock` is the default. The mock client uses simple keyword matching
to return canned JSON from `fixtures/llm-mock-sequential.json` — no network or
API keys needed.

To switch to a real provider:

```bash
# Anthropic
LLM_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-... pnpm sequential

# OpenAI
LLM_PROVIDER=openai OPENAI_API_KEY=sk-... pnpm sequential
```

See `src/shared/llmClient.ts` for the TODO stubs to wire up each provider.

## Scripts

| Command           | Topology                           |
| ----------------- | ---------------------------------- |
| `pnpm sequential` | 3-agent linear pipeline            |
| `pnpm fanout`     | Parallel fan-out classifiers       |
| `pnpm supervisor` | Supervisor with routing            |
| `pnpm council`    | Peer agents + consensus vote       |
| `pnpm broken`     | Broken pipeline — find the 4 bugs! |
| `pnpm broken:checked`   | Same 4 bugs with a PASS/FAIL self-check harness |
| `pnpm broken:injection` | Prompt-injection exercise (run with a real LLM) |

### Running your own tickets

By default each topology runs its own scripted fixtures. Override with a ticket of
your own — a file may hold a single ticket or an array of them:

```bash
pnpm sequential --ticket fixtures/ticket-happy.json
pnpm fanout     --ticket fixtures/ticket-happy.json
pnpm council    --ticket generated/pack.json      # array → one run per ticket
pnpm supervisor --ticket-dir generated/            # every *.json in a folder
```

See `prompts/generate-tickets.md` for a prompt that generates a fresh, varied batch
of tickets to pipe through the topologies live.

## Structure

```
src/
  shared/
    types.ts            — domain types (SupportTicket, TicketAnalysis, …)
    agent.ts            — defineAgent() factory: buildPrompt + parse over callLlm()
    llmClient.ts        — callLlm() with mock/anthropic/openai providers
    logging.ts          — logStep() and logBoundary() helpers
  agents/
    classifier.ts       — classifierFreeformAgent / classifierStructuredAgent
    responder.ts        — responderFromSummaryAgent / responderFromAnalysisAgent
    urgency.ts, sentiment.ts, category.ts   — fan-out specialist agents
    riskAnalyst.ts, customerAdvocate.ts, policyGuardian.ts   — council members
    billingWorker.ts, shippingWorker.ts, returnsWorker.ts, faqWorker.ts   — supervisor workers
  topologies/
    sequential.ts       — 01: classifier → responder → escalator
    fanout.ts           — 02: parallel specialists
    supervisor.ts       — 03: supervisor with routing
    council.ts          — 04: peer agents + majority-vote consensus
    broken-to-debug.ts  — 05: find and fix the 4 bugs

fixtures/
  ticket-angry.json           — high-priority negative ticket (used by default)
  ticket-happy.json           — low-priority neutral ticket
  ticket-council-split.json   — split-vote ticket that triggers the tie-breaker
  llm-mock-sequential.json    — reference: what the mock LLM returns and why
```

## Council (peer agents + consensus)

Run the council demo:

```bash
pnpm council
```

Three council members — **Risk Analyst**, **Customer Advocate**, and **Policy Guardian** — all see the same ticket and cast independent votes (`approve` / `escalate` / `block`). An aggregator applies majority rule; ties are broken conservatively (`block > escalate > approve`).

The `ticket-council-split.json` fixture is designed so each member votes differently, triggering the tie-breaker:

| Member           | Vote       | Reasoning                                          |
| ---------------- | ---------- | -------------------------------------------------- |
| riskAnalyst      | `escalate` | "violation" implies potential legal/financial risk |
| customerAdvocate | `approve`  | customer wants a quick fix; no fraud signal        |
| policyGuardian   | `block`    | "violation of our agreement" is a policy red flag  |

Result: 1-1-1 tie → tie-breaker picks **block** (most conservative).

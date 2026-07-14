# Multi-Agent Orchestration Patterns — my workshop playground

> **[Web Summer Camp 2026](https://websummercamp.com/2026) — AI Engineering track**
> Session: [Multi-Agent Orchestration Patterns](https://websummercamp.com/2026/session/multi-agent-orchestration-patterns)
> Speaker: **Nikola Poljanec**, Senior Developer at Atomic Intelligence
> Original workshop repo: [bitbucket.org/nikola_poljanec/wsc26](https://bitbucket.org/nikola_poljanec/wsc26)

## What this is

A hands-on TypeScript repo for exploring multi-agent orchestration topologies:
sequential pipelines, parallel fan-out, supervisor-worker routing, and
council-style consensus — plus a broken pipeline to debug. It runs 3-agent
pipelines over customer support tickets (`fixtures/`) and runs **fully offline
in mock mode** — no API keys required. During the workshop I compared
freeform-prose vs structured-JSON handoffs between agents and worked through
the debugging exercise, hunting the hidden bugs with traces and logs.

## Quick start

Requires Node.js 22+ and pnpm (`npm install -g pnpm`).

```bash
cd multi-agent-orchestration-patterns

cp .env.example .env   # optional — mock is the default

pnpm install
pnpm sequential
```

## Scripts

| Command | Topology |
| ----------------- | ---------------------------------- |
| `pnpm sequential` | 3-agent linear pipeline |
| `pnpm fanout` | Parallel fan-out classifiers |
| `pnpm supervisor` | Supervisor with routing |
| `pnpm council` | Peer agents + consensus vote |
| `pnpm broken` | Broken pipeline — find the 4 bugs! |
| `pnpm broken:checked` | Same 4 bugs with a PASS/FAIL self-check harness |
| `pnpm broken:injection` | Prompt-injection exercise (run with a real LLM) |

## What `pnpm sequential` does

Runs a 3-agent pipeline against a sample angry-customer support ticket:

```
[classifierAgent]  →  categorizes the ticket (billing/shipping/returns/other)
                        priority (low/medium/high), sentiment (negative/neutral/positive)

[responseAgent]    →  drafts a reply based on the classification

[escalationAgent]  →  decides whether to escalate to a human agent
```

Each step logs its input and output so you can watch state flow through the pipeline.

### Freeform vs structured handoff

The `HANDOFF_MODE` env var controls how state flows between agents:

```bash
HANDOFF_MODE=freeform pnpm sequential     # classifier returns raw prose (default)
HANDOFF_MODE=structured pnpm sequential   # classifier returns typed JSON
```

## Mock mode and real LLMs

`LLM_PROVIDER=mock` is the default. The mock client uses simple keyword
matching to return canned JSON from `fixtures/llm-mock-sequential.json` — no
network or API keys needed.

To run against a real provider, add a key to `.env` (or inline):

```bash
# Anthropic
LLM_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-... pnpm sequential

# OpenAI
LLM_PROVIDER=openai OPENAI_API_KEY=sk-... pnpm sequential
```

See `src/shared/llmClient.ts` for how each provider is wired.

## Running your own tickets

By default each topology runs its own scripted fixtures. Override with a
ticket of your own — a file may hold a single ticket or an array of them:

```bash
pnpm sequential --ticket fixtures/ticket-happy.json
pnpm fanout     --ticket fixtures/ticket-happy.json
pnpm council    --ticket generated/pack.json      # array → one run per ticket
pnpm supervisor --ticket-dir generated/            # every *.json in a folder
```

See `prompts/generate-tickets.md` for a prompt that generates a fresh, varied
batch of tickets to pipe through the topologies.

## Council (peer agents + consensus)

```bash
pnpm council
```

Three council members — **Risk Analyst**, **Customer Advocate**, and **Policy
Guardian** — all see the same ticket and cast independent votes
(`approve` / `escalate` / `block`). An aggregator applies majority rule; ties
are broken conservatively (`block > escalate > approve`). The
`ticket-council-split.json` fixture triggers a 1-1-1 tie → the tie-breaker
picks **block**.

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

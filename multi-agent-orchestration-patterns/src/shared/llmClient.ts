// ─────────────────────────────────────────────────────────────────────────────
// LLM client with pluggable providers.
//
// Set LLM_PROVIDER env var to switch between
// "mock" | "anthropic" | "openai" | "claude-cli" | "openai-cli".
// Default is "mock" — no API keys required, works fully offline.
// ─────────────────────────────────────────────────────────────────────────────

type LlmProvider = "mock" | "anthropic" | "openai" | "claude-cli" | "openai-cli";

const provider: LlmProvider = (process.env.LLM_PROVIDER ?? "mock") as LlmProvider;

// ── Mock provider ─────────────────────────────────────────────────────────────
// Keyword-based dispatch that returns canned JSON matching the fixture shapes
// in fixtures/llm-mock-sequential.json. Enough for the sequential topology to
// run end-to-end without any network calls.

function mockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("describe this support ticket")) {
    // Freeform classifier: return a natural-language summary.
    // Deliberately uses "upset" instead of "angry/furious" — mimics how an LLM can
    // soften strong emotion, causing downstream heuristics to under-escalate.
    return "The customer is quite upset about a missing package and is requesting a prompt resolution.";
  }

  if (lower.includes("classify")) {
    // Structured classifier: detect negative-sentiment keywords and return explicit fields.
    const isNegative = /furious|terrible|outrage|awful|horrible|angry|unacceptable/.test(lower);
    return JSON.stringify({
      category: "shipping",
      priority: isNegative ? "high" : "medium",
      sentiment: isNegative ? "negative" : "neutral",
    });
  }

  if (lower.includes("draft a reply")) {
    const isHighPriority = lower.includes("high");
    return JSON.stringify({
      text: isHighPriority
        ? "We sincerely apologize for the delay. A senior agent will contact you within the hour to resolve this immediately."
        : "Thank you for reaching out. We are looking into this and will get back to you shortly.",
      confidence: isHighPriority ? 0.72 : 0.91,
    });
  }

  // Council topology: persona prompts are identified by "cast your vote".
  // Keyword checks run only on the ticket message portion (after "ticket from")
  // so persona text containing terms like "fraud signals" or "violation" doesn't
  // contaminate the heuristic.
  if (lower.includes("cast your vote")) {
    const msgIdx = lower.indexOf("ticket from");
    const msg = msgIdx >= 0 ? lower.slice(msgIdx) : lower;

    if (lower.includes("risk analyst")) {
      // Escalate on financial/legal risk indicators or strong negative emotion
      const decision =
        /legal|fraud|chargeback|violation|refund/.test(msg) ||
          /furious|terrible|unacceptable/.test(msg)
          ? "escalate"
          : "approve";
      return JSON.stringify({
        decision,
        rationale:
          decision === "escalate"
            ? "Potential financial or legal risk detected."
            : "No critical risk indicators found in ticket.",
      });
    }
    if (lower.includes("customer advocate")) {
      // Approve unless explicit fraud in message; upset customer → quick resolution
      const decision = /fraud|chargeback/.test(msg) ? "escalate" : "approve";
      return JSON.stringify({
        decision,
        rationale:
          decision === "approve"
            ? "Customer is upset; quick resolution protects the relationship."
            : "Fraud signal detected; escalation required.",
      });
    }
    if (lower.includes("policy guardian")) {
      // Block on policy/contract violations; escalate on strong negative tone otherwise
      const decision = /violation|terms|contract|agreement/.test(msg)
        ? "block"
        : /furious|terrible|unacceptable/.test(msg)
          ? "escalate"
          : "approve";
      return JSON.stringify({
        decision,
        rationale:
          decision === "block"
            ? "Potential policy or contract violation detected; blocking pending review."
            : decision === "escalate"
              ? "Strong negative sentiment warrants escalation."
              : "No policy concerns detected.",
      });
    }
  }

  if (lower.includes("escalate")) {
    const shouldEscalate = lower.includes("high") && lower.includes("negative");
    return JSON.stringify({
      escalate: shouldEscalate,
      reason: shouldEscalate
        ? "High-priority ticket with negative sentiment — requires immediate human attention."
        : "Issue can be resolved with an automated response.",
    });
  }

  if (lower.includes("what is the urgency level")) {
    // Deliberate bug for the disagree fixture: "charged twice" makes this naive
    // agent focus on the billing nature of the issue and return "low", ignoring
    // the strong emotional language ("furious", "unacceptable") in the same message.
    if (lower.includes("charged twice")) return "low";
    const isHigh = /furious|terrible|outrage|awful|horrible|angry|unacceptable/.test(lower);
    return isHigh ? "high" : "medium";
  }

  if (lower.includes("what is the sentiment")) {
    const isNeg = /furious|terrible|outrage|awful|horrible|angry|unacceptable|charged twice/.test(lower);
    const isPos = /happy|great|wonderful|perfect|thank you/.test(lower);
    return isNeg ? "negative" : isPos ? "positive" : "neutral";
  }

  if (lower.includes("what is the category")) {
    // Slice from "ticket from" onwards so we don't match the enum values
    // listed in the instruction text ("billing, shipping, returns, or other").
    const msgIdx = lower.indexOf("ticket from");
    const msg = msgIdx >= 0 ? lower.slice(msgIdx) : lower;
    if (/billing|charged|charge|invoice|payment|card/.test(msg)) return "billing";
    if (/ship|package|deliver|parcel|arrive/.test(msg)) return "shipping";
    if (/return|send back/.test(msg)) return "returns";
    return "other";
  }

  if (lower.includes("resolve the billing issue")) {
    return "Billing worker: Reviewed the account, confirmed the duplicate charge, and initiated a full refund. The customer will receive the credit within 3–5 business days.";
  }

  if (lower.includes("resolve the shipping issue")) {
    return "Shipping worker: Located the package in transit, filed a delay report with the courier, and sent the customer an updated tracking link with an ETA.";
  }

  if (lower.includes("resolve the return request")) {
    return "Returns worker: Approved the return request, generated a prepaid return label, and emailed it to the customer.";
  }

  if (lower.includes("answer this faq")) {
    return "FAQ worker: Provided the customer with the relevant policy documentation and self-service links to resolve their query.";
  }

  return JSON.stringify({ message: "Mock response: request acknowledged." });
}

// ── Claude CLI provider ───────────────────────────────────────────────────────
// Uses the `claude -p` (print) flag to call Claude via the logged-in CLI session.
// No API key needed — just `claude login` once.

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

async function callClaudeCliApi(prompt: string, preference?: LlmPreference): Promise<string> {
  const args = ["-p", prompt, "--output-format", "json"];
  if (preference?.model) args.push("--model", preference.model);
  const { stdout } = await execFileAsync("claude", args, { maxBuffer: 10 * 1024 * 1024 });
  const json = JSON.parse(stdout);
  const u = json.usage;
  recordUsage({
    inputTokens: u.input_tokens ?? 0,
    outputTokens: u.output_tokens ?? 0,
    cacheReadTokens: u.cache_read_input_tokens ?? 0,
    costUsd: json.total_cost_usd ?? 0,
    durationMs: json.duration_ms ?? 0,
  });
  return stripCodeFences(json.result ?? "");
}

// ── OpenAI CLI provider ───────────────────────────────────────────────────────
// Uses `codex exec --json` (the Codex CLI's non-interactive mode) to call OpenAI
// via the logged-in CLI session. No API key needed — just `codex login` once.
// `--json` streams newline-delimited events; we pull the final assistant text
// from the `item.completed` / `agent_message` event and token usage from the
// `turn.completed` event.

async function callOpenAiCliApi(prompt: string): Promise<string> {
  const t0 = performance.now();
  const { stdout } = await execFileAsync(
    "codex",
    ["exec", "--json", prompt],
    { maxBuffer: 10 * 1024 * 1024 }
  );

  let text = "";
  let usage = { input_tokens: 0, cached_input_tokens: 0, output_tokens: 0 };
  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;
    const event = JSON.parse(line);
    if (event.type === "item.completed" && event.item?.type === "agent_message") {
      text = event.item.text ?? text;
    }
    if (event.type === "turn.completed" && event.usage) {
      usage = event.usage;
    }
  }

  recordUsage({
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheReadTokens: usage.cached_input_tokens ?? 0,
    costUsd: 0,
    durationMs: Math.round(performance.now() - t0),
  });
  return stripCodeFences(text);
}

// ── Anthropic provider ────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callAnthropicApi(prompt: string, preference?: LlmPreference): Promise<string> {
  const t0 = performance.now();
  const msg = await anthropicClient.messages.create({
    model: preference?.model ?? "claude-opus-4-8",
    max_tokens: preference?.maxTokens ?? 1024,
    ...(preference?.temperature !== undefined && { temperature: preference.temperature }),
    messages: [{ role: "user", content: prompt }],
  });
  recordUsage({
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
    cacheReadTokens: (msg.usage as any).cache_read_input_tokens ?? 0,
    costUsd: 0,
    durationMs: Math.round(performance.now() - t0),
  });
  const block = msg.content[0];
  return block.type === "text" ? stripCodeFences(block.text) : "";
}

// ── OpenAI provider ───────────────────────────────────────────────────────────
// TODO: Install `openai` and replace the stub below:
//
//   import OpenAI from "openai";
//   const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//
//   async function callOpenAiApi(prompt: string): Promise<string> {
//     const res = await client.chat.completions.create({
//       model: "gpt-4o",
//       messages: [{ role: "user", content: prompt }],
//     });
//     return res.choices[0]?.message?.content ?? "";
//   }

async function callOpenAiApi(_prompt: string): Promise<string> {
  throw new Error(
    "OpenAI provider not yet implemented.\n" +
    "See the TODO comment in src/shared/llmClient.ts to wire up the openai package."
  );
}

// ── Usage tracking ────────────────────────────────────────────────────────────

interface CallUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  costUsd: number;
  durationMs: number;
}

const usageLog: CallUsage[] = [];
let runStartMs: number | null = null;

export function markRunStart(): void {
  runStartMs = performance.now();
}

function recordUsage(u: CallUsage): void {
  usageLog.push(u);
  const cacheHit = u.cacheReadTokens ? `  cache_read=${u.cacheReadTokens}` : "";
  const cost = u.costUsd > 0 ? `  cost=$${u.costUsd.toFixed(5)}` : "";
  console.log(`  [usage] in=${u.inputTokens}  out=${u.outputTokens}${cacheHit}${cost}  time=${formatDuration(u.durationMs)}`);
}

export function printUsageSummary(): void {
  if (usageLog.length === 0) return;
  const total = usageLog.reduce(
    (acc, u) => ({
      inputTokens: acc.inputTokens + u.inputTokens,
      outputTokens: acc.outputTokens + u.outputTokens,
      cacheReadTokens: acc.cacheReadTokens + u.cacheReadTokens,
      costUsd: acc.costUsd + u.costUsd,
      durationMs: acc.durationMs + u.durationMs,
    }),
    { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, costUsd: 0, durationMs: 0 }
  );
  const wallMs = runStartMs !== null ? Math.round(performance.now() - runStartMs) : null;
  const bar = "─".repeat(42);
  console.log(`\n${bar}`);
  console.log(`  Usage summary  (${usageLog.length} LLM calls)`);
  console.log(bar);
  console.log(`  Input tokens    ${total.inputTokens}`);
  console.log(`  Output tokens   ${total.outputTokens}`);
  if (total.cacheReadTokens) console.log(`  Cache read      ${total.cacheReadTokens}`);
  if (total.costUsd > 0) console.log(`  Total cost      $${total.costUsd.toFixed(5)}`);
  console.log(`  LLM time        ${formatDuration(total.durationMs)}`);
  if (wallMs !== null) console.log(`  Wall time       ${formatDuration(wallMs)}`);
  console.log();
}

import { formatDuration, stripCodeFences } from "./utils.js";
import type { LlmPreference } from "./types.js";

// ── Public API ────────────────────────────────────────────────────────────────

export async function callLlm(prompt: string, preference?: LlmPreference): Promise<string> {
  if (provider === "mock") {
    return mockResponse(prompt);
  }
  if (provider === "anthropic") {
    return callAnthropicApi(prompt, preference);
  }
  if (provider === "openai") {
    return callOpenAiApi(prompt);
  }
  if (provider === "claude-cli") {
    return callClaudeCliApi(prompt, preference);
  }
  if (provider === "openai-cli") {
    return callOpenAiCliApi(prompt);
  }
  throw new Error(`Unknown LLM_PROVIDER: "${provider}". Valid values: mock | anthropic | openai | claude-cli | openai-cli`);
}

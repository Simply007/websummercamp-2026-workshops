// ─────────────────────────────────────────────────────────────────────────────
// 04 – Broken pipeline (find the bugs!)
//
// This is a deliberately broken version of the sequential pipeline.
// There are FOUR bugs hidden in the code below.
//
// Your task: run `pnpm broken`, observe the failure, find and fix each bug.
// Hint: bugs involve state mutation, missing await, wrong field names, and
//       a prompt that never matches the mock LLM's keyword routing.
// ─────────────────────────────────────────────────────────────────────────────

import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { OrchestrationState, TicketAnalysis, DraftReply, EscalationDecision } from "../shared/types.js";
import { callLlm } from "../shared/llmClient.js";
import { logStep } from "../shared/logging.js";

const __dir = dirname(fileURLToPath(import.meta.url));

// BUG 1: the prompt says "categorize" not "classify" — mock LLM won't match
async function classifierAgent(state: OrchestrationState): Promise<OrchestrationState> {
  const prompt =
    `Categorize this support ticket. ` +
    `Return JSON with fields: category, priority, sentiment.\n\n` +
    `Ticket: "${state.ticket.message}"\n\nRespond with only valid JSON.`;

  const raw = await callLlm(prompt);
  const analysis: TicketAnalysis = JSON.parse(raw);
  return { ...state, analysis };
}

// BUG 2: missing `await` — callLlm returns a Promise, JSON.parse will fail
async function responseAgent(state: OrchestrationState): Promise<OrchestrationState> {
  const prompt =
    `Draft a reply for this support ticket.\n` +
    `Priority: ${state.analysis?.priority}, Sentiment: ${state.analysis?.sentiment}.\n` +
    `Ticket: "${state.ticket.message}"\n\nReturn JSON: text, confidence.`;

  const raw = callLlm(prompt);  // <- missing await
  const draft: DraftReply = JSON.parse(raw as unknown as string);
  return { ...state, draft };
}

// BUG 3: direct mutation of state instead of spreading — corrupts upstream reference
async function escalationAgent(state: OrchestrationState): Promise<OrchestrationState> {
  const prompt =
    `Decide whether to escalate this ticket.\n` +
    `Priority: ${state.analysis?.priority}, Sentiment: ${state.analysis?.sentiment}.\n` +
    `Return JSON: escalate (boolean), reason (string).`;

  const raw = await callLlm(prompt);
  const decision: EscalationDecision = JSON.parse(raw);

  state.decision = decision;  // <- mutates state directly instead of spreading
  return state;
}

async function runBrokenPipeline(): Promise<void> {
  const ticketPath = join(__dir, "../../fixtures/ticket-angry.json");
  const ticket = JSON.parse(await readFile(ticketPath, "utf-8"));

  let state: OrchestrationState = { ticket };

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║     Broken Pipeline – Find the Bugs!     ║");
  console.log("╚══════════════════════════════════════════╝");

  logStep("Input", state);
  state = await classifierAgent(state);
  logStep("After classifierAgent", state);

  // BUG 4: reads state.analysis.type — should be state.analysis.category
  console.log(`\n  Detected type: ${(state.analysis as any).type}`);

  state = await responseAgent(state);
  logStep("After responseAgent", state);
  state = await escalationAgent(state);
  logStep("After escalationAgent", state);
}

runBrokenPipeline().catch(console.error);

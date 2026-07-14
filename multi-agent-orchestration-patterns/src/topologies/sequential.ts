// ─────────────────────────────────────────────────────────────────────────────
// 01 – Sequential Pipeline
//
// Three agents run one after another, each reading the previous agent's output
// from the shared state object and writing its own result back into it.
//
//   classifier  →  responder  →  escalator
//
// HANDOFF_MODE controls how state flows between agents:
//
//   freeform   — classifier returns raw text; downstream agents parse prose
//   structured — classifier returns typed JSON; downstream agents read fields
//
// Run:
//   HANDOFF_MODE=freeform   pnpm sequential
//   HANDOFF_MODE=structured pnpm sequential
// ─────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { OrchestrationState, EscalationDecision, SupportTicket } from "../shared/types.js";
import { markRunStart, printUsageSummary } from "../shared/llmClient.js";
import { loadTicketsFromArgs, readFixtureTicket } from "../shared/tickets.js";
import { logStep, logBoundary } from "../shared/logging.js";
import { classifierFreeformAgent, classifierStructuredAgent } from "../agents/classifier.js";
import { responderFromAnalysisAgent, responderFromSummaryAgent } from "../agents/responder.js";

const __dir = dirname(fileURLToPath(import.meta.url));

const HANDOFF_MODE: "freeform" | "structured" =
  process.env.HANDOFF_MODE === "structured" ? "structured" : "freeform";

function logHandoffMode() {
  console.log(`\n[sequential] HANDOFF_MODE = ${HANDOFF_MODE}\n`);
}

// ── Agent 1: Classifier ───────────────────────────────────────────────────────

async function classifierAgent(
  state: OrchestrationState,
): Promise<OrchestrationState> {
  const { ticket } = state;

  if (HANDOFF_MODE === "freeform") {
    const classifierSummary = await classifierFreeformAgent.run(ticket);
    return { ...state, classifierSummary };
  }

  const analysis = await classifierStructuredAgent.run(ticket);
  return { ...state, analysis };
}

// ── Agent 2: Responder ────────────────────────────────────────────────────────

async function responseAgent(
  state: OrchestrationState,
): Promise<OrchestrationState> {
  const { ticket } = state;

  if (HANDOFF_MODE === "freeform") {
    if (!state.classifierSummary) {
      throw new Error("classifierSummary missing in freeform mode");
    }
    const draft = await responderFromSummaryAgent.run(ticket, state.classifierSummary);
    return { ...state, draft };
  }

  if (!state.analysis) {
    throw new Error("analysis missing in structured mode");
  }
  const draft = await responderFromAnalysisAgent.run(ticket, state.analysis);
  return { ...state, draft };
}

// ── Agent 3: Escalator ────────────────────────────────────────────────────────
// Pure heuristics — no LLM call. Structured mode reads explicit fields.
// Freeform mode does keyword matching on the raw summary (fragile by design).

async function escalationAgent(
  state: OrchestrationState,
): Promise<OrchestrationState> {
  const { analysis, draft, classifierSummary } = state;
  if (!draft) throw new Error("draft missing before escalation");

  let priority: "low" | "medium" | "high" = "medium";
  let sentiment: "negative" | "neutral" | "positive" = "neutral";

  if (analysis) {
    priority = analysis.priority;
    sentiment = analysis.sentiment;
  } else if (classifierSummary) {
    // Crude keyword heuristic — the workshop's "aha" moment: this breaks
    // when the LLM paraphrases strong emotion into softer language.
    const lower = classifierSummary.toLowerCase();
    if (/angry|furious|outrage|awful|terrible/.test(lower)) {
      priority = "high";
      sentiment = "negative";
    }
  }

  const escalate =
    priority === "high" || sentiment === "negative" || draft.confidence < 0.8;

  const decision: EscalationDecision = {
    escalate,
    reason: escalate
      ? "high risk or low confidence — needs human review"
      : "low risk and high confidence — automated reply is sufficient",
  };

  return { ...state, decision };
}

// ── Pipeline runner ───────────────────────────────────────────────────────────

async function runSupportPipeline(ticket: SupportTicket): Promise<void> {
  let state: OrchestrationState = { ticket };

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║  Sequential Pipeline – Support Ticket    ║");
  console.log("╚══════════════════════════════════════════╝");
  logHandoffMode();

  logStep("Input ticket", state);

  logBoundary("input", "classifierAgent", state.ticket);
  state = await classifierAgent(state);
  logStep("After classifierAgent", state);

  const classifierOutput =
    HANDOFF_MODE === "freeform" ? state.classifierSummary : state.analysis;
  logBoundary("classifierAgent", "responseAgent", classifierOutput);
  state = await responseAgent(state);
  logStep("After responseAgent", state);

  logBoundary("responseAgent", "escalationAgent", state.draft);
  state = await escalationAgent(state);
  logStep("After escalationAgent", state);

  const escalateLabel = state.decision?.escalate ? "YES ⚠️ " : "NO  ✓ ";

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║              Final Result                ║");
  console.log("╚══════════════════════════════════════════╝\n");
  console.log(`  Ticket    #${state.ticket.id} — ${state.ticket.from}`);

  if (state.analysis) {
    console.log(
      `  Category  ${state.analysis.category}  (${state.analysis.priority} priority)`,
    );
    console.log(`  Sentiment ${state.analysis.sentiment}`);
  } else {
    console.log(`  Summary   "${state.classifierSummary}"`);
  }

  console.log(
    `  Draft     "${state.draft?.text}"  [confidence: ${state.draft?.confidence}]`,
  );
  console.log(`  Escalate  ${escalateLabel}— ${state.decision?.reason}`);
  console.log();
}

async function main(): Promise<void> {
  const fixturesDir = join(__dir, "../../fixtures");

  // CLI override: run arbitrary tickets instead of the default angry fixture.
  const custom = await loadTicketsFromArgs(fixturesDir);
  const tickets = custom.length
    ? custom.map((c) => c.ticket)
    : [await readFixtureTicket(fixturesDir, "ticket-angry.json")];

  markRunStart();
  for (const ticket of tickets) {
    await runSupportPipeline(ticket);
  }
  printUsageSummary();
}

main().catch(console.error);

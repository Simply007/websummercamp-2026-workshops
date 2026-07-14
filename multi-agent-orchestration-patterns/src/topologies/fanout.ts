// ─────────────────────────────────────────────────────────────────────────────
// 02 – Fan-out (parallel classifiers)
//
// One support ticket is dispatched to three specialist agents simultaneously:
//   urgencyAgent · sentimentAgent · categoryAgent
//
// An aggregator naively merges their outputs. For the "disagree" fixture the
// urgency agent returns the wrong value, demonstrating a silent escalation
// failure when the aggregator blindly trusts a misbehaving classifier.
//
//                    ┌─ urgencyAgent  ─┐
//   dispatcher  ─────┤─ sentimentAgent ─├─── aggregator
//                    └─ categoryAgent  ─┘
//
// Run:  pnpm fanout
// ─────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { SupportTicket, TicketAnalysis } from "../shared/types.js";
import { markRunStart, printUsageSummary } from "../shared/llmClient.js";
import { loadTicketsFromArgs, readFixtureTicket } from "../shared/tickets.js";
import { urgencyAgent } from "../agents/urgency.js";
import { sentimentAgent } from "../agents/sentiment.js";
import { categoryAgent } from "../agents/category.js";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── State ─────────────────────────────────────────────────────────────────────

type FanOutState = {
  ticket: SupportTicket;
  urgency?: "low" | "medium" | "high";
  sentiment?: "negative" | "neutral" | "positive";
  category?: "billing" | "shipping" | "returns" | "other";
  mergedAnalysis?: TicketAnalysis;
};

// ── Fan-out runner ────────────────────────────────────────────────────────────

async function runFanOutClassifiers(ticket: SupportTicket): Promise<FanOutState> {
  const [urgency, sentiment, category] = await Promise.all([
    urgencyAgent.run(ticket),
    sentimentAgent.run(ticket),
    categoryAgent.run(ticket),
  ]);
  return { ticket, urgency, sentiment, category };
}

// ── Aggregator ────────────────────────────────────────────────────────────────

function aggregateAnalysis(state: FanOutState): FanOutState {
  if (!state.urgency || !state.sentiment || !state.category) {
    throw new Error("Missing classifier outputs");
  }
  const merged: TicketAnalysis = {
    category: state.category,
    priority: state.urgency,   // maps urgency directly — no cross-check
    sentiment: state.sentiment,
  };
  return { ...state, mergedAnalysis: merged };
}

// ── Demo helpers ──────────────────────────────────────────────────────────────

const SEP = "─".repeat(50);

async function runDemo(
  label: string,
  ticket: SupportTicket,
): Promise<{ silentFailure: boolean }> {
  console.log(`\n${SEP}`);
  console.log(`  [${label}]`);
  console.log(`  Ticket #${ticket.id} — ${ticket.from}`);
  console.log(`  "${ticket.message}"`);
  console.log(SEP);

  const state0 = await runFanOutClassifiers(ticket);

  console.log("\n  [fan-out] Classifier outputs (ran in parallel):");
  console.log(`    urgency:   ${state0.urgency}`);
  console.log(`    sentiment: ${state0.sentiment}`);
  console.log(`    category:  ${state0.category}`);

  const state1 = aggregateAnalysis(state0);
  const merged = state1.mergedAnalysis!;

  console.log("\n  [aggregator] Merged analysis:", merged);

  // Two policies side-by-side to surface the failure:
  // Naive: trusts only urgency/priority (common in simple routing rules).
  // Safe:  also checks sentiment (catches what urgency missed).
  const escalateNaive = merged.priority === "high";
  const escalateSafe = merged.priority === "high" || merged.sentiment === "negative";

  console.log(
    "\n  [decision] Naive policy  (priority only):        " +
      (escalateNaive ? "ESCALATE ⚠️ " : "skip     ✓ "),
  );
  console.log(
    "  [decision] Safe policy   (priority | sentiment):  " +
      (escalateSafe ? "ESCALATE ⚠️ " : "skip     ✓ "),
  );

  const silentFailure = !escalateNaive && escalateSafe;
  if (silentFailure) {
    console.log("\n  *** SILENT FAILURE ***");
    console.log("  urgency=low (wrong) hid this ticket from the naive escalation policy.");
    console.log("  A furious billing dispute would sit unescalated in Tier-1.");
  }
  return { silentFailure };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function runFanOutDemo(): Promise<void> {
  const llmProvider = process.env.LLM_PROVIDER ?? "mock";

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║  Fan-out: Parallel Classifiers Demo      ║");
  console.log(`║  LLM_PROVIDER = ${llmProvider.padEnd(24)}║`);
  console.log("╚══════════════════════════════════════════╝");

  markRunStart();

  const fixturesDir = join(__dir, "../../fixtures");

  // CLI override: run arbitrary tickets instead of the scripted pair.
  const custom = await loadTicketsFromArgs(fixturesDir);
  if (custom.length) {
    for (const { ticket, source } of custom) {
      await runDemo(`custom — ${source}`, ticket);
    }
    printUsageSummary();
    return;
  }

  const [angryTicket, disagreeTicket] = await Promise.all([
    readFixtureTicket(fixturesDir, "ticket-angry.json"),
    readFixtureTicket(fixturesDir, "ticket-disagree.json"),
  ]);

  await runDemo("normal — angry shipping ticket", angryTicket);
  await runDemo("disagree — silent failure case", disagreeTicket);

  printUsageSummary();
}

runFanOutDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});

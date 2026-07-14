// ─────────────────────────────────────────────────────────────────────────────
// 03 – Supervisor–Worker (Router + Specialists)
//
// A supervisor reads a support ticket and routes it to one of four specialist
// workers: billing, shipping, returns, or faq. The supervisor trusts the
// worker's `handled: true` and considers the ticket resolved.
//
//   supervisor  →  billingWorker
//              →  shippingWorker
//              →  returnsWorker
//              →  faqWorker
//
// "Supervisor blindness" failure case: for a mixed billing+shipping ticket,
// the supervisor picks billing (correct for one dimension) and considers the
// issue fully resolved — never noticing the unaddressed missing package.
//
// Run:  pnpm supervisor
// ─────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { SupportTicket, WorkerResult } from "../shared/types.js";
import { markRunStart, printUsageSummary } from "../shared/llmClient.js";
import { loadTicketsFromArgs, readFixtureTicket } from "../shared/tickets.js";
import { billingWorkerAgent } from "../agents/billingWorker.js";
import { shippingWorkerAgent } from "../agents/shippingWorker.js";
import { returnsWorkerAgent } from "../agents/returnsWorker.js";
import { faqWorkerAgent } from "../agents/faqWorker.js";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Types ─────────────────────────────────────────────────────────────────────

type SupervisorState = {
  ticket: SupportTicket;
  chosenWorker?: WorkerResult["worker"];
  workerResult?: WorkerResult;
};

// ── Supervisor routing logic ──────────────────────────────────────────────────

async function supervisorAgent(ticket: SupportTicket): Promise<SupervisorState> {
  const message = ticket.message.toLowerCase();

  let chosen: WorkerResult["worker"];

  // "charged twice" takes priority over all other keywords — this is the
  // deliberate routing choice that causes blindness on the mixed ticket.
  // A ticket with both "charged twice" AND "never arrived" routes to billing
  // only; the shipping problem is silently dropped.
  if (message.includes("charged twice") || message.includes("invoice") || message.includes("payment issue")) {
    chosen = "billing";
  } else if (
    message.includes("delayed") ||
    message.includes("tracking") ||
    message.includes("shipped") ||
    message.includes("never arrived") ||
    message.includes("package") ||
    message.includes("not here")
  ) {
    chosen = "shipping";
  } else if (message.includes("return") || message.includes("send back")) {
    chosen = "returns";
  } else {
    chosen = "faq";
  }

  let workerResult: WorkerResult;
  switch (chosen) {
    case "billing":
      workerResult = await billingWorkerAgent.run(ticket);
      break;
    case "shipping":
      workerResult = await shippingWorkerAgent.run(ticket);
      break;
    case "returns":
      workerResult = await returnsWorkerAgent.run(ticket);
      break;
    default:
      workerResult = await faqWorkerAgent.run(ticket);
  }

  return { ticket, chosenWorker: chosen, workerResult };
}

// ── Demo ──────────────────────────────────────────────────────────────────────

const SEP = "─".repeat(50);

async function runDemo(label: string, ticket: SupportTicket): Promise<void> {
  console.log(`\n${SEP}`);
  console.log(`  [${label}]`);
  console.log(`  Ticket #${ticket.id} — ${ticket.from}`);
  console.log(`  "${ticket.message}"`);
  console.log(SEP);

  console.log("\n[supervisor] Incoming ticket:", ticket);

  const state = await supervisorAgent(ticket);

  console.log("\n[supervisor] Chosen worker:", state.chosenWorker);
  console.log("\n[supervisor] Worker result:", state.workerResult);

  const handled = state.workerResult?.handled ?? false;
  console.log("\n[supervisor] Final decision:", {
    handled,
    comment: handled
      ? "Supervisor believes the issue is resolved."
      : "Supervisor failed to resolve the issue.",
  });
}

async function runSupervisorDemo(): Promise<void> {
  const llmProvider = process.env.LLM_PROVIDER ?? "mock";

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║  Supervisor–Worker Demo                  ║");
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

  // Clean case: pure shipping ticket routes correctly to shippingWorker
  const angryTicket = await readFixtureTicket(fixturesDir, "ticket-angry.json");
  await runDemo("normal — pure shipping ticket", angryTicket);

  // Blindness case: mixed ticket has both billing AND shipping keywords.
  // "charged twice" wins the routing race → billing only is called → handled: true.
  // The missing package is never touched.
  const blindnessTicket = await readFixtureTicket(fixturesDir, "ticket-supervisor-blindness.json");
  await runDemo("supervisor blindness — mixed billing+shipping ticket", blindnessTicket);

  printUsageSummary();
}

runSupervisorDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});

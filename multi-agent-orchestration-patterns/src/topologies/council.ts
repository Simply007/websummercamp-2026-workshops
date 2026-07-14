// ─────────────────────────────────────────────────────────────────────────────
// 04 – Council (peer agents + consensus)
//
// Three council members all see the same ticket and each cast a vote on a
// single decision (approve / escalate / block). An aggregator applies a
// majority vote with a conservative tie-breaker so the council can never
// deadlock.
//
//   ticket ──┬─ riskAnalyst      ─┐
//             ├─ customerAdvocate ─┼── aggregator ── finalDecision
//             └─ policyGuardian   ─┘
//
// Run:  pnpm council
// ─────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { SupportTicket, CouncilDecision, CouncilVote } from "../shared/types.js";
import { markRunStart, printUsageSummary } from "../shared/llmClient.js";
import { loadTicketsFromArgs, readFixtureTicket } from "../shared/tickets.js";
import { riskAnalystAgent } from "../agents/riskAnalyst.js";
import { customerAdvocateAgent } from "../agents/customerAdvocate.js";
import { policyGuardianAgent } from "../agents/policyGuardian.js";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Types ─────────────────────────────────────────────────────────────────────

type CouncilState = {
  ticket: SupportTicket;
  votes: CouncilVote[];
  finalDecision?: {
    decision: CouncilDecision;
    reason: string;
  };
};

// ── Council runner (parallel fan-out) ─────────────────────────────────────────

async function runCouncil(ticket: SupportTicket): Promise<CouncilState> {
  const votes = await Promise.all([
    riskAnalystAgent.run(ticket),
    customerAdvocateAgent.run(ticket),
    policyGuardianAgent.run(ticket),
  ]);
  return { ticket, votes };
}

// ── Aggregator: majority + conservative tie-breaker ───────────────────────────

function aggregateCouncil(state: CouncilState): CouncilState {
  const counts: Record<CouncilDecision, number> = { approve: 0, escalate: 0, block: 0 };

  for (const vote of state.votes) {
    counts[vote.decision]++;
  }

  let winning: CouncilDecision = "approve";
  let maxCount = -1;
  (["approve", "escalate", "block"] as CouncilDecision[]).forEach((d) => {
    if (counts[d] > maxCount) {
      winning = d;
      maxCount = counts[d];
    }
  });

  const isTie = Object.values(counts).filter((c) => c === maxCount).length > 1;

  if (isTie) {
    // Conservative tie-breaker: block > escalate > approve
    if (counts["block"] === maxCount) {
      winning = "block";
    } else if (counts["escalate"] === maxCount) {
      winning = "escalate";
    } else {
      winning = "approve";
    }
  }

  return {
    ...state,
    finalDecision: {
      decision: winning,
      reason: isTie
        ? `Tie between council members (${JSON.stringify(counts)}); applied conservative tie-breaker.`
        : `Simple majority (${JSON.stringify(counts)}) among council members.`,
    },
  };
}

// ── Demo helpers ──────────────────────────────────────────────────────────────

const SEP = "─".repeat(50);

async function runDemo(label: string, ticket: SupportTicket): Promise<void> {
  console.log(`\n${SEP}`);
  console.log(`  [${label}]`);
  console.log(`  Ticket #${ticket.id} — ${ticket.from}`);
  console.log(`  "${ticket.message}"`);
  console.log(SEP);

  const state0 = await runCouncil(ticket);

  console.log("\n  [council] Individual votes (ran in parallel):");
  for (const v of state0.votes) {
    console.log(`    ${v.member.padEnd(18)} → ${v.decision.padEnd(8)}  "${v.rationale}"`);
  }

  const state1 = aggregateCouncil(state0);
  const fd = state1.finalDecision!;

  console.log(`\n  [aggregator] Final decision: ${fd.decision.toUpperCase()}`);
  console.log(`               Reason: ${fd.reason}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function runCouncilDemo(): Promise<void> {
  const llmProvider = process.env.LLM_PROVIDER ?? "mock";

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║  Council: Peer Agents + Consensus Demo   ║");
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

  const [angryTicket, splitTicket] = await Promise.all([
    readFixtureTicket(fixturesDir, "ticket-angry.json"),
    readFixtureTicket(fixturesDir, "ticket-council-split.json"),
  ]);

  await runDemo("majority — angry ticket (expect escalate)", angryTicket);
  await runDemo("split — tie-breaker case (expect block)", splitTicket);

  printUsageSummary();
}

runCouncilDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});

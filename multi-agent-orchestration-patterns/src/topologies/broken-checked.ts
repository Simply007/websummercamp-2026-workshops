// ─────────────────────────────────────────────────────────────────────────────
// 05b – Broken pipeline, self-checking variant.
//
// Same FOUR bugs as broken-to-debug.ts, but with a PASS/FAIL harness bolted on
// so you get a tight red→green loop instead of eyeballing console output. Fix a
// bug, re-run, watch a check flip to ✓.
//
//   pnpm broken:checked
//
// Each bug lives in its own small function so the harness can probe it in
// isolation — fixing them in any order works.
// ─────────────────────────────────────────────────────────────────────────────

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type {
  OrchestrationState,
  TicketAnalysis,
  DraftReply,
  EscalationDecision,
} from "../shared/types.js";
import { callLlm, markRunStart, printUsageSummary } from "../shared/llmClient.js";
import { readFixtureTicket } from "../shared/tickets.js";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── The four bugs ───────────────────────────────────────────────────────────────

// BUG 1: prompt says "Categorize", not "Classify" — the mock keys on "classify",
// so it falls through to a default response with no category.
async function classifierAgent(state: OrchestrationState): Promise<OrchestrationState> {
  const prompt =
    `Categorize this support ticket. ` +
    `Return JSON with fields: category, priority, sentiment.\n\n` +
    `Ticket: "${state.ticket.message}"\n\nRespond with only valid JSON.`;

  const raw = await callLlm(prompt);
  const analysis: TicketAnalysis = JSON.parse(raw);
  return { ...state, analysis };
}

// BUG 2: missing `await` — callLlm returns a Promise, JSON.parse blows up on it.
async function responseAgent(state: OrchestrationState): Promise<OrchestrationState> {
  const prompt =
    `Draft a reply for this support ticket.\n` +
    `Priority: ${state.analysis?.priority}, Sentiment: ${state.analysis?.sentiment}.\n` +
    `Ticket: "${state.ticket.message}"\n\nReturn JSON: text, confidence.`;

  const raw = callLlm(prompt); // <- missing await
  const draft: DraftReply = JSON.parse(raw as unknown as string);
  return { ...state, draft };
}

// BUG 3: mutates the incoming state instead of returning a fresh object.
async function escalationAgent(state: OrchestrationState): Promise<OrchestrationState> {
  const prompt =
    `Decide whether to escalate this ticket.\n` +
    `Priority: ${state.analysis?.priority}, Sentiment: ${state.analysis?.sentiment}.\n` +
    `Return JSON: escalate (boolean), reason (string).`;

  const raw = await callLlm(prompt);
  const decision: EscalationDecision = JSON.parse(raw);

  state.decision = decision; // <- mutates in place instead of spreading
  return state;
}

// BUG 4: reads `.type` — the field is `.category`, so this is always undefined.
function detectCategory(analysis: TicketAnalysis): string | undefined {
  return (analysis as any).type;
}

// ── Self-check harness ──────────────────────────────────────────────────────────

interface Check {
  label: string;
  pass: boolean;
  note: string;
}

const CATEGORIES = ["billing", "shipping", "returns", "other"];

async function runChecks(ticket: OrchestrationState["ticket"]): Promise<Check[]> {
  const checks: Check[] = [];

  // A known-good analysis so bugs 2/3/4 can be probed independently of bug 1.
  const goodAnalysis: TicketAnalysis = {
    category: "shipping",
    priority: "high",
    sentiment: "negative",
  };

  // Bug 1 — classifier prompt matches the mock and yields a real category.
  try {
    const s = await classifierAgent({ ticket });
    const cat = (s.analysis as { category?: string })?.category;
    checks.push({
      label: "Bug 1 — classifier prompt matches the mock ('classify')",
      pass: typeof cat === "string" && CATEGORIES.includes(cat),
      note: `analysis.category = ${JSON.stringify(cat)}`,
    });
  } catch (e) {
    checks.push({
      label: "Bug 1 — classifier prompt matches the mock ('classify')",
      pass: false,
      note: `threw: ${(e as Error).message}`,
    });
  }

  // Bug 4 — detectCategory reads the correct field.
  const detected = detectCategory(goodAnalysis);
  checks.push({
    label: "Bug 4 — detectCategory reads the right field (category, not type)",
    pass: detected !== undefined,
    note: `detectCategory(...) = ${JSON.stringify(detected)}`,
  });

  // Bug 2 — responder awaits the LLM call before parsing.
  try {
    const s = await responseAgent({ ticket, analysis: goodAnalysis });
    checks.push({
      label: "Bug 2 — responder awaits callLlm before JSON.parse",
      pass: typeof (s.draft as DraftReply | undefined)?.text === "string",
      note: `draft = ${JSON.stringify(s.draft)}`,
    });
  } catch (e) {
    checks.push({
      label: "Bug 2 — responder awaits callLlm before JSON.parse",
      pass: false,
      note: `threw: ${(e as Error).message}`,
    });
  }

  // Bug 3 — escalation returns a NEW state object (no in-place mutation).
  try {
    const input: OrchestrationState = {
      ticket,
      analysis: goodAnalysis,
      draft: { text: "placeholder", confidence: 0.9 },
    };
    const output = await escalationAgent(input);
    checks.push({
      label: "Bug 3 — escalation returns a new state (no mutation)",
      pass: output !== input && !!output.decision,
      note:
        output === input
          ? "returned the same object (mutated in place)"
          : "returned a fresh object",
    });
  } catch (e) {
    checks.push({
      label: "Bug 3 — escalation returns a new state (no mutation)",
      pass: false,
      note: `threw: ${(e as Error).message}`,
    });
  }

  return checks;
}

async function main(): Promise<void> {
  const fixturesDir = join(__dir, "../../fixtures");
  const ticket = await readFixtureTicket(fixturesDir, "ticket-angry.json");

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Broken Pipeline – Self-Checking Hunt   ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\n  Ticket #${ticket.id} — "${ticket.message.slice(0, 60)}…"`);

  markRunStart();
  const checks = await runChecks(ticket);

  console.log("\n  ── checks ─────────────────────────────────");
  for (const c of checks) {
    console.log(`  ${c.pass ? "✓" : "✗"} ${c.label}`);
    console.log(`      ${c.note}`);
  }

  const fixed = checks.filter((c) => c.pass).length;
  console.log(`\n  ${fixed}/${checks.length} bugs fixed.`);
  console.log(
    fixed === checks.length
      ? "  🎉 All clear — pipeline contracts hold.\n"
      : "  Keep going — fix a bug, re-run, watch a ✗ flip to ✓.\n",
  );

  printUsageSummary();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

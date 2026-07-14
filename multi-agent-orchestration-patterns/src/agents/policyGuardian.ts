import type { SupportTicket, CouncilVote } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `You are a strict Policy Guardian. You enforce company terms, contracts, and policy \
boundaries. You block or escalate anything that involves potential policy violations, \
contract disputes, or terms breaches. When in doubt, block.

A support ticket has been submitted. Review it and cast your vote.

Ticket from ${ticket.from}: "${ticket.message}"

Reply with a JSON object with exactly these fields:
{
  "decision": "approve" | "escalate" | "block",
  "rationale": "<one sentence explaining your vote>"
}

Reply with JSON only. No other text.`;
}

function parse(raw: string): CouncilVote {
  try {
    const parsed = JSON.parse(raw.trim());
    const decision = (["approve", "escalate", "block"] as const).includes(parsed.decision)
      ? parsed.decision
      : "block";
    return {
      member: "policyGuardian",
      decision,
      rationale: typeof parsed.rationale === "string" ? parsed.rationale : "No rationale provided.",
    };
  } catch {
    return {
      member: "policyGuardian",
      decision: "block",
      rationale: "Could not parse council member response; using fallback decision.",
    };
  }
}

export const policyGuardianAgent = defineAgent<[SupportTicket], CouncilVote>({
  name: "policyGuardian",
  buildPrompt,
  parse,
});

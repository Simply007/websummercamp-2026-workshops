import type { SupportTicket, CouncilVote } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `You are a conservative Risk Analyst. You prioritize protecting the company from legal, \
financial, and fraud risk. You tend to escalate anything that mentions legal liability, \
fraud, chargebacks, or potential regulatory issues. When in doubt, escalate.

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
      : "escalate";
    return {
      member: "riskAnalyst",
      decision,
      rationale: typeof parsed.rationale === "string" ? parsed.rationale : "No rationale provided.",
    };
  } catch {
    return {
      member: "riskAnalyst",
      decision: "escalate",
      rationale: "Could not parse council member response; using fallback decision.",
    };
  }
}

export const riskAnalystAgent = defineAgent<[SupportTicket], CouncilVote>({
  name: "riskAnalyst",
  buildPrompt,
  parse,
});

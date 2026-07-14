import type { SupportTicket, CouncilVote } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `You are a Customer Advocate. You prioritize customer satisfaction and resolving disputes \
quickly to protect the customer relationship. You lean toward approving requests when the \
customer is clearly upset, unless there are clear fraud signals. When in doubt, approve.

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
      : "approve";
    return {
      member: "customerAdvocate",
      decision,
      rationale: typeof parsed.rationale === "string" ? parsed.rationale : "No rationale provided.",
    };
  } catch {
    return {
      member: "customerAdvocate",
      decision: "approve",
      rationale: "Could not parse council member response; using fallback decision.",
    };
  }
}

export const customerAdvocateAgent = defineAgent<[SupportTicket], CouncilVote>({
  name: "customerAdvocate",
  buildPrompt,
  parse,
});

import type { SupportTicket, TicketAnalysis } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildStructuredPrompt(ticket: SupportTicket): string {
  return `\
Classify this support ticket.
Return JSON with fields: category ("billing"|"shipping"|"returns"|"other"), priority ("low"|"medium"|"high"), sentiment ("negative"|"neutral"|"positive").

Ticket from ${ticket.from}: "${ticket.message}"

Respond with only valid JSON.`;
}

function buildFreeformPrompt(ticket: SupportTicket): string {
  return `\
Describe this support ticket in one sentence. What is the customer's issue and how do they seem to feel?

Ticket from ${ticket.from}: "${ticket.message}"`;
}

function parseTicketAnalysis(raw: string): TicketAnalysis {
  const parsed = JSON.parse(raw);
  return {
    category: parsed.category ?? "other",
    priority: parsed.priority ?? "medium",
    sentiment: parsed.sentiment ?? "neutral",
  };
}

// Structured handoff: returns typed fields downstream agents read directly.
export const classifierStructuredAgent = defineAgent<[SupportTicket], TicketAnalysis>({
  name: "classifierStructured",
  buildPrompt: buildStructuredPrompt,
  parse: parseTicketAnalysis,
});

// Freeform handoff: returns raw prose downstream agents must parse themselves.
export const classifierFreeformAgent = defineAgent<[SupportTicket], string>({
  name: "classifierFreeform",
  buildPrompt: buildFreeformPrompt,
  parse: (raw) => raw,
});

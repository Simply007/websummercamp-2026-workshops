import type { SupportTicket } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `What is the urgency level of this support ticket? Reply with exactly one word: low, medium, or high.

Ticket from ${ticket.from}: "${ticket.message}"`;
}

function parse(raw: string): "low" | "medium" | "high" {
  const val = raw.trim().toLowerCase();
  if (val.includes("high")) return "high";
  if (val.includes("medium")) return "medium";
  if (val.includes("low")) return "low";
  return "medium";
}

export const urgencyAgent = defineAgent<[SupportTicket], "low" | "medium" | "high">({
  name: "urgency",
  buildPrompt,
  parse,
});

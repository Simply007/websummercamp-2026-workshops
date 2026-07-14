import type { SupportTicket } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `What is the category of this support ticket? Reply with exactly one word: billing, shipping, returns, or other.

Ticket from ${ticket.from}: "${ticket.message}"`;
}

function parse(raw: string): "billing" | "shipping" | "returns" | "other" {
  const val = raw.trim().toLowerCase();
  if (val.includes("billing")) return "billing";
  if (val.includes("shipping")) return "shipping";
  if (val.includes("returns") || val.includes("return")) return "returns";
  return "other";
}

export const categoryAgent = defineAgent<[SupportTicket], "billing" | "shipping" | "returns" | "other">({
  name: "category",
  buildPrompt,
  parse,
});

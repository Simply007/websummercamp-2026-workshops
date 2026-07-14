import type { SupportTicket } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `What is the sentiment of this support ticket? Reply with exactly one word: negative, neutral, or positive.

Ticket from ${ticket.from}: "${ticket.message}"`;
}

function parse(raw: string): "negative" | "neutral" | "positive" {
  const val = raw.trim().toLowerCase();
  if (val.includes("negative")) return "negative";
  if (val.includes("positive")) return "positive";
  return "neutral";
}

export const sentimentAgent = defineAgent<[SupportTicket], "negative" | "neutral" | "positive">({
  name: "sentiment",
  buildPrompt,
  parse,
});

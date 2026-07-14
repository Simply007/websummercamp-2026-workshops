import type { SupportTicket, TicketAnalysis, DraftReply } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPromptFromAnalysis(ticket: SupportTicket, analysis: TicketAnalysis): string {
  return `\
Draft a reply for this support ticket.
Category: ${analysis.category}, Priority: ${analysis.priority}, Sentiment: ${analysis.sentiment}.

Ticket: "${ticket.message}"

Return JSON with fields: text (the reply text), confidence (0.0–1.0).
Respond with only valid JSON.`;
}

function buildPromptFromSummary(ticket: SupportTicket, summary: string): string {
  return `\
Draft a reply for this support ticket.
Context from previous analysis: ${summary}

Ticket: "${ticket.message}"

Return JSON with fields: text (the reply text), confidence (0.0–1.0).
Respond with only valid JSON.`;
}

function parseDraftReply(raw: string): DraftReply {
  const parsed = JSON.parse(raw);
  return {
    text: parsed.text ?? "",
    confidence: parsed.confidence ?? 0.5,
  };
}

export const responderFromAnalysisAgent = defineAgent<[SupportTicket, TicketAnalysis], DraftReply>({
  name: "responderFromAnalysis",
  buildPrompt: buildPromptFromAnalysis,
  parse: parseDraftReply,
});

export const responderFromSummaryAgent = defineAgent<[SupportTicket, string], DraftReply>({
  name: "responderFromSummary",
  buildPrompt: buildPromptFromSummary,
  parse: parseDraftReply,
});

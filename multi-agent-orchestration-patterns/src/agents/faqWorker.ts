import type { SupportTicket, WorkerResult } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `Answer this FAQ or general query for this ticket. Summarize what action was taken (1-2 sentences).\n\nTicket from ${ticket.from}: "${ticket.message}"`;
}

export const faqWorkerAgent = defineAgent<[SupportTicket], WorkerResult>({
  name: "faqWorker",
  buildPrompt,
  parse: (notes) => ({ worker: "faq", handled: true, notes }),
});

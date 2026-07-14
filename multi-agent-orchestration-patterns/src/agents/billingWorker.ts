import type { SupportTicket, WorkerResult } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `Resolve the billing issue for this ticket. Summarize what action was taken (1-2 sentences).\n\nTicket from ${ticket.from}: "${ticket.message}"`;
}

export const billingWorkerAgent = defineAgent<[SupportTicket], WorkerResult>({
  name: "billingWorker",
  buildPrompt,
  parse: (notes) => ({ worker: "billing", handled: true, notes }),
});

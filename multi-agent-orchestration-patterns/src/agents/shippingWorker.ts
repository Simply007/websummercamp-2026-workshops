import type { SupportTicket, WorkerResult } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `Resolve the shipping issue for this ticket. Summarize what action was taken (1-2 sentences).\n\nTicket from ${ticket.from}: "${ticket.message}"`;
}

export const shippingWorkerAgent = defineAgent<[SupportTicket], WorkerResult>({
  name: "shippingWorker",
  buildPrompt,
  parse: (notes) => ({ worker: "shipping", handled: true, notes }),
});

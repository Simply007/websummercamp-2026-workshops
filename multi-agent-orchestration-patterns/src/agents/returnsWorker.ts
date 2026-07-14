import type { SupportTicket, WorkerResult } from "../shared/types.js";
import { defineAgent } from "../shared/agent.js";

function buildPrompt(ticket: SupportTicket): string {
  return `Resolve the return request for this ticket. Summarize what action was taken (1-2 sentences).\n\nTicket from ${ticket.from}: "${ticket.message}"`;
}

export const returnsWorkerAgent = defineAgent<[SupportTicket], WorkerResult>({
  name: "returnsWorker",
  buildPrompt,
  parse: (notes) => ({ worker: "returns", handled: true, notes }),
});

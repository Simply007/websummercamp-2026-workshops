export interface SupportTicket {
  id: string;
  from: string;
  message: string;
}

export interface TicketAnalysis {
  category: "billing" | "shipping" | "returns" | "other";
  priority: "low" | "medium" | "high";
  sentiment: "negative" | "neutral" | "positive";
}

export interface DraftReply {
  text: string;
  confidence: number;
}

export interface EscalationDecision {
  escalate: boolean;
  reason: string;
}

export interface OrchestrationState {
  ticket: SupportTicket;
  analysis?: TicketAnalysis;
  // freeform handoff: raw text summary from the classifier
  classifierSummary?: string;
  draft?: DraftReply;
  decision?: EscalationDecision;
}

export type CouncilDecision = "approve" | "escalate" | "block";

export type CouncilMemberName = "riskAnalyst" | "customerAdvocate" | "policyGuardian";

export interface CouncilVote {
  member: CouncilMemberName;
  decision: CouncilDecision;
  rationale: string;
}

export interface WorkerResult {
  worker: "billing" | "shipping" | "returns" | "faq";
  handled: boolean;
  notes: string;
}

export interface LlmPreference {
  /** Override the model used for this agent (e.g. "claude-haiku-4-5" for cheap tasks). */
  model?: string;
  /** Override max output tokens. */
  maxTokens?: number;
  /** Override sampling temperature (0.0–1.0). */
  temperature?: number;
}

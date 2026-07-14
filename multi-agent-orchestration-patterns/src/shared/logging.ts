import type { OrchestrationState } from "./types.js";

export function logStep(stepName: string, state: OrchestrationState): void {
  const bar = "─".repeat(42);
  console.log(`\n${bar}`);
  console.log(`  STEP: ${stepName}`);
  console.log(bar);
  console.log(JSON.stringify(state, null, 2));
}

export function logBoundary(from: string, to: string, payload: unknown): void {
  const indented = JSON.stringify(payload, null, 2).replace(/\n/g, "\n    ");
  console.log(`\n  → ${from}  ──►  ${to}`);
  console.log(`    ${indented}`);
}

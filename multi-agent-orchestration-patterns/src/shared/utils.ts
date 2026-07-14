export function formatDuration(totalMs: number): string {
  const mins = Math.floor(totalMs / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1_000);
  const rem  = totalMs % 1_000;
  if (mins > 0) return `${mins}m ${secs}s ${rem}ms`;
  if (secs > 0) return `${secs}s ${rem}ms`;
  return `${rem}ms`;
}

export function stripCodeFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

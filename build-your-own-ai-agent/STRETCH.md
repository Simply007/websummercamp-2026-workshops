# Stretch, if you finish early

Pick any. Each is the same pattern, one level up, and a good "now make it real
for me" task.

- **A 4th reviewer.** Add another lens to the panel (source diversity, depth,
  practitioner-vs-academic). Re-run the same topic and watch the verdict shift, 
  proof that behaviour lives in the roles, not the plumbing.
- **Judge as a subagent.** Move the judging out of `/build-stack` into its own
  `.claude/agents/judge.md`, and have the command delegate to it. Compare: cleaner
  separation vs an extra hop.
- **Loop to consensus.** If the judge flags a sharp unresolved tension, have it send
  that tension back to the panel for one more round, then judge again. The agent
  loop, one level up.
- **Code-review panel (the most useful take-home).** Point the same shape at *your
  own repo*: reviewers for security / performance / readability over the current
  diff, a judge that writes one prioritized review. A `/review` you'd actually keep.
- **Give a panelist a real tool.** Let a reviewer fetch and read a candidate in full
  before scoring, or add a tool it can call mid-review.
- **Agent teams.** Let the panelists debate each other before the judge decides
  (experimental in Claude Code, check the docs for the flag).
- **Tier + measure.** Try the judge on a stronger model for a hard topic; note the
  quality vs cost difference. Spend tokens where they matter.

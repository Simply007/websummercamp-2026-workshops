# Phase 3, Build the orchestrator + judge

**Build:** `.claude/commands/build-stack.md` · ~25 min, the centerpiece.

A slash command is a plan the lead agent follows. You'll write the plan that turns
a topic into a curated stack: research → panel (in parallel) → you judge.

## Build it
Create `.claude/commands/build-stack.md`:

- **Frontmatter:** a `description:` and `argument-hint: "<topic>"`. The topic arrives
  in the body as `$ARGUMENTS`.
- **Body**, write these as instructions to the lead agent:
  1. Launch `link-researcher` on `$ARGUMENTS` → candidate list.
  2. Launch the three reviewers **in parallel** (all in one step) with the topic +
     the list.
  3. **Judge**, this is *you*, the lead agent, not a subagent: sum the scores,
     honour `DROP` votes, kill duplicates, pick the best **8–12**, and *state* where
     the reviewers disagreed instead of hiding it.
  4. Propose a **name + one-paragraph summary + 3–6 tags + the ranked list**, and ask
     the user for an OK.
  5. Save to `output/<slug>.md`.

> Why the judge is the lead agent, not another subagent: it already holds all three
> score sets, so it's the natural place to synthesize. (Making the judge its own
> subagent is a good stretch, see `STRETCH.md`.)

## Make it yours
Decide your judging rule and put it in step 3, do you weight credibility over
freshness? Cap one link per domain? Require at least one beginner on-ramp?

## Run it
```
> /build-stack "<your topic>"
```
✅ **The checkpoint that matters:** research → three reviewers at once → your judge's
ranked pick → a saved stack. One line in; a reasoned artifact out. You never
hard-coded which links win, the orchestration produced it.

## Stuck or behind?
```bash
git checkout phase-3 -- .claude
```

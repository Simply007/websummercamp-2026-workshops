# Phase 0, How this works + setup

**You're on the `start` branch: nothing is built yet. You build it.**

This workshop is build-along. Each phase you create the real files; the finished
version of every phase is saved as a git tag, so you can never get stranded.

## Get set up
- Claude Code (`claude --version`), git, and your Anthropic key.
- `cp .env.example .env`, add `ANTHROPIC_API_KEY` (provided here), then
  `set -a && source .env && set +a`.
- Start from the clean slate: `git checkout start`, then open `claude`.

## How you'll build
- Each phase has a guide in `phases/PHASE-N.md`: what to build + how.
- Write the files yourself, or ask Claude Code to draft them and then refine.
  Either way, understand what you ship.
- **Make it yours:** from Phase 2 on you pick your own angle (your panel lenses,
  your topic), so you leave with *your* agent, not a copy of mine.

## If you fall behind
Grab the finished version of a phase without losing your place or your guides:
```bash
git checkout phase-2 -- .claude          # pulls the completed Phase 2 agents in
# or just one file:
git checkout phase-2 -- .claude/agents/reviewer-fit.md
```
You stay on `start`; only `.claude/` is replaced. `main` is the complete reference
if you want to see the whole finished thing.

## The mental model
- An **agent** = an LLM calling tools in a loop. Claude Code *is* that loop, you
  configure it, you don't write it.
- A **subagent** = a file in `.claude/agents/`. A **command** = a file in
  `.claude/commands/`. **Sharing** = commit `.claude/`.
- What we build: research → a panel vets the links → a judge picks → publish a
  stack. Why this and not a calculator: it's open-ended, verifiable, and worth the
  tokens. Arithmetic is a function call, not an agent.

Next: Phase 1.

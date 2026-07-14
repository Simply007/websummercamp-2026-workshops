# Phase 1, Build your first subagent

**Build:** `.claude/agents/link-researcher.md` · ~15 min

A subagent is one markdown file: frontmatter (who it is, what it may touch, which
model) + a system prompt (how it behaves). You'll write one from scratch, it's the
whole format in miniature.

## Build it
Create `.claude/agents/link-researcher.md` with two parts.

**1. Frontmatter** (between `---` fences), you decide each field:
- `name:` → `link-researcher`
- `description:` → **this is how the lead agent decides to delegate.** Write it like
  a job posting: *when* to use it and *what it hands back*. Vague here and it never
  gets called.
- `tools:` → its blast radius. A researcher needs `WebSearch, WebFetch`, and
  nothing else (no Write, no Bash). Least privilege by default.
- `model:` → `sonnet`.

**2. System prompt** (after the fences). Tell it to: take a TOPIC, run a few focused
web searches, return **12–18** strong candidates (more than the final stack needs,
so the panel has something to cut), prefer primary / recent / reputable sources,
**never invent a URL**, and return ONLY a markdown list, 
`- [Title](url), one-line reason`.

> Fast path: ask Claude Code *"draft a link-researcher subagent that…"*, then tighten
> the `description` and lock the `tools` down yourself. The judgment is in the edit.

## Run it
```
> Use the link-researcher subagent to find candidates for "<a topic you know well>".
```
✅ **Checkpoint:** it returns a clean candidate list, and your main chat stayed
clean, because the subagent ran in its own context. That isolation is the point.

## Stuck or behind?
```bash
git checkout phase-1 -- .claude
```

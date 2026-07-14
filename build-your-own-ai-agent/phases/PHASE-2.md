# Phase 2, Build the review panel (and make it yours)

**Build:** three reviewer subagents · ~20 min

One agent judging links carries one bias and blends every concern into one context.
Three narrow agents, each with a single lens, give you real disagreement for a
judge to resolve. That independence is the whole reason a panel beats one opinion.

## The worked example, copy this shape
`.claude/agents/reviewer-credibility.md`:
```
---
name: reviewer-credibility
description: Scores candidate links for source credibility. Returns a score per link + a drop list. Used by /build-stack.
tools: WebFetch
model: haiku
---
You are the credibility reviewer. Judge each candidate ONLY on trustworthiness, 
source authority, primary vs rehashed, red flags (SEO farms, unsourced claims).
Do not consider freshness or fit, other reviewers own those.
Output one line per candidate: `- <1-5> | <URL> | <=8 word reason>`,
then a final line: `DROP: <urls you'd cut, or none>`.
```
Note the three things that make a panel work: **one lens only**, a **cheap model**
(`haiku`, because we run three in parallel), and an **identical output shape** so
the judge can combine them mechanically.

## Build the other two
Write `reviewer-freshness.md` (recency / not-superseded; allow a "(timeless)"
exception for canonical refs) and `reviewer-fit.md` (on-topic + set balance + no
redundancy). Same `tools`, same `model`, same output shape.

## Make it yours
Swap in lenses that fit what *you'd* curate. A "design inspiration" stack might use
**originality / usability / on-trend**; a "papers to read" stack might use **rigor
/ influence / readability**. Rename or replace at least one reviewer, and pick a
topic you actually care about, your panel, your stack.

## Run it
Hand a candidate list to all three and read their score sets.
✅ **Checkpoint:** three independent scorings of the same links.

## Stuck or behind?
```bash
git checkout phase-2 -- .claude
```

## Stretch
Add a 4th lens (source diversity, depth…). More in `STRETCH.md`.

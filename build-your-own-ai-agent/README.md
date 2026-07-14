# Build Your Own AI Agent — my workshop playground

> **[Web Summer Camp 2026](https://websummercamp.com/2026) — AI Engineering track**
> Session: [Build Your Own AI Agent](https://websummercamp.com/2026/session/build-your-own-ai-agent)
> Speaker: **Martina Zrnec**, Co-founder & CTO at Stacklist
> Original workshop repo: [marti06/summer-camp-agent-build](https://github.com/marti06/summer-camp-agent-build) (my fork: [Simply007/ondrej-trial](https://github.com/Simply007/ondrej-trial))

## My playground

Built the `/build-stack` orchestration inside Claude Code: a finder agent gathers
link candidates, three reviewer subagents score them in parallel (credibility,
freshness, fit), a judge picks the final set, and a publisher agent ships the
curated stack. The agents live as markdown files in `.claude/agents/` — deploy
is just a git commit.

My own change on top of the workshop material: extended
`.claude/agents/stack-publisher.md` with the Stacklist MCP tools
(`create_stack`, `add_cards`, `auto_tag_cards`, `generate_summary`,
`check_ai_discoverability`) so the publisher can push to Stacklist for real
instead of only writing a local markdown file. Generated stacks are in
`output/`.

The original workshop README follows below.

---

# Build a team agent in Claude Code, *Stack Builder*

A 2.5-hour, hands-on workshop. You **build** a real agent **inside Claude Code**, 
not a script on your laptop, and **ship it to your whole team by committing it**.
By the end you type `/build-stack "<topic>"` and a panel of agents you wrote
researches, vets, and publishes a curated [Stacklist](https://stacklist.com) stack.

You don't read along, **you build it**. The point is the pattern you'll reuse forever:

- An **agent** in Claude Code is a markdown file (`.claude/agents/*.md`) you author.
- An **orchestration** is one agent fanning out to several + a judge.
- An agent's **tools can be your own product's MCP server.**
- **Deploy = `git commit`.** Whoever clones the repo gets the agent. CI runs it headless.

---

## Prerequisites (have these before we start)

- **Claude Code** installed and working (`claude --version`). You already use it.
- **git**, you have it.
- **One key.** Copy the template and fill in your Anthropic key:
  ```bash
  cp .env.example .env          # add ANTHROPIC_API_KEY (provided at the summit)
  set -a && source .env && set +a
  ```
  The agent's web search & fetch are **built into Claude Code, no extra key.**
  Stacklist credentials are **optional** (only to publish for real; `phases/PHASE-4.md`).
  No Python, no framework.

---

## How the workshop works (build-along)

Start from a clean slate and build each phase yourself. The finished state of every
phase is a git tag, so you can never get stuck.

```bash
git checkout start     # nothing built yet, your starting point
claude                 # open Claude Code here, then follow phases/PHASE-1.md
```

| Phase | What **you build** | Catch-up |
|---|---|---|
| 1 | Your first subagent, `link-researcher` | `git checkout phase-1 -- .claude` |
| 2 | The review panel, three perspectives (incl. one of your own) | `git checkout phase-2 -- .claude` |
| 3 | The orchestrator + judge, `/build-stack` | `git checkout phase-3 -- .claude` |
| 4 | The publisher (+ optionally wire Stacklist) | `git checkout phase-4 -- .claude` |
| 5 | The deploy, commit, teammate pulls, CI | `git checkout phase-5 -- .claude` |

Each phase has a guide in `phases/PHASE-N.md`. Catch-up pulls just the finished
`.claude/` of that phase into your repo, you keep your place and your guides.
**`main`** is the complete reference if you want to see the whole finished thing.

**Make it yours:** from Phase 2 you pick your own panel lenses and topic, so you
leave with *your* agent, not a copy. Finished early? See `STRETCH.md`.

---

## What "done" looks like

```bash
> /build-stack "best resources for shipping AI agents in 2026"
```
Your researcher gathers links, your three reviewers score them in parallel, your
judge picks the final set, and your publisher produces a tagged, summarized stack, 
in Stacklist if connected, otherwise as `output/<slug>.md`.

See `examples.md` for good topics, `FACILITATOR.md` for the run-of-show, and
`slides/` for the deck.

---

## Where to go next

- Building Effective Agents, https://www.anthropic.com/research/building-effective-agents
- Writing tools for agents, https://www.anthropic.com/engineering/writing-tools-for-agents
- Effective context engineering, https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Claude Agent SDK docs, https://code.claude.com/docs/en/agent-sdk/overview
- Subagents, https://code.claude.com/docs/en/sub-agents

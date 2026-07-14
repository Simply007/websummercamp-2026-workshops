# Build Your Own AI Agent — my workshop playground

> **[Web Summer Camp 2026](https://websummercamp.com/2026) — AI Engineering track**
> Session: [Build Your Own AI Agent](https://websummercamp.com/2026/session/build-your-own-ai-agent)
> Speaker: **Martina Zrnec**, Co-founder & CTO at Stacklist
> Original workshop repo: [marti06/summer-camp-agent-build](https://github.com/marti06/summer-camp-agent-build) (my fork: [Simply007/ondrej-trial](https://github.com/Simply007/ondrej-trial))

## What this is

The finished state of the *Stack Builder* workshop: a team-shared agent built
entirely inside Claude Code. You type `/build-stack "<topic>"` and a panel of
agents researches, vets, and publishes a curated
[Stacklist](https://stacklist.com) stack. The pattern the workshop teaches:

- An **agent** in Claude Code is a markdown file (`.claude/agents/*.md`) you author.
- An **orchestration** is one agent fanning out to several + a judge.
- An agent's **tools can be your own product's MCP server.**
- **Deploy = `git commit`.** Whoever clones the repo gets the agent.

```
/build-stack <topic>
   └─ link-researcher          (find candidates)
   └─ reviewer-credibility  ┐
   └─ reviewer-freshness    ├─ run in parallel, score every candidate
   └─ reviewer-fit          ┘
   └─ (judge = the orchestrator picks the final set)
   └─ stack-publisher          (publish to Stacklist, or write output/<slug>.md)
```

My own change on top of the workshop material: extended
`.claude/agents/stack-publisher.md` with the Stacklist MCP tools
(`create_stack`, `add_cards`, `auto_tag_cards`, `generate_summary`,
`check_ai_discoverability`) so the publisher can push to Stacklist for real
instead of only writing a local markdown file.

## Run it

Requires [Claude Code](https://code.claude.com) and an Anthropic key (or
`claude login` with a subscription):

```bash
cp .env.example .env          # add ANTHROPIC_API_KEY
set -a && source .env && set +a
claude
```

Then inside Claude Code:

```
> /build-stack "best resources for shipping AI agents in 2026"
```

The researcher gathers links, the three reviewers score them in parallel, the
judge picks the final set, and the publisher produces a tagged, summarized
stack — in Stacklist if its MCP server is connected, otherwise as
`output/<slug>.md`. Generated stacks from the workshop are in `output/`.

## What's in the folder

| Path | What it is |
| --- | --- |
| `.claude/agents/` | The agent definitions — the actual deliverable |
| `CLAUDE.md` | Project context inherited by the orchestrator and all subagents |
| `phases/PHASE-1..5.md` | The five build-along phase guides |
| `output/` | Stacks generated during the workshop |
| `examples.md` | Good topics to try |
| `STRETCH.md` | Extra exercises if you finish early |
| `FACILITATOR.md`, `slides/` | Run-of-show and deck (speaker material) |

## A note on the phase catch-up tags

The phase guides reference catch-up commands like
`git checkout phase-1 -- .claude`. Those rely on git tags (`start`,
`phase-1`…`phase-5`) that exist only in the
[original workshop repo](https://github.com/marti06/summer-camp-agent-build) —
this consolidated repo starts from a fresh history, so clone the original if
you want to replay the workshop phase by phase. This folder holds the complete
finished state.

## Where to go next

- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude Agent SDK docs](https://code.claude.com/docs/en/agent-sdk/overview)
- [Subagents](https://code.claude.com/docs/en/sub-agents)

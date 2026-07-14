# Stack Builder, project context for Claude Code

This repo is a workshop. By the end it contains a **reusable, team-shared agent**
that turns a topic into a curated, published, AI-discoverable **Stacklist** stack.

You (Claude Code) and the subagents in `.claude/agents/` inherit this file.

## What we are building

A topic goes in → the agent researches candidate links → a panel of reviewer
subagents vets them → a judge picks the best set → the result is published as a
Stacklist stack (or written locally if Stacklist isn't connected).

```
/build-stack <topic>
   └─ link-researcher          (find candidates)
   └─ reviewer-credibility  ┐
   └─ reviewer-freshness    ├─ run in parallel, score every candidate
   └─ reviewer-fit          ┘
   └─ (judge = the orchestrator picks the final set)
   └─ stack-publisher          (publish to Stacklist, or write output/<slug>.md)
```

## House rules for agents

- Prefer primary, reputable, recent sources. Quality over quantity, a tight set
  of 8–12 great links beats 30 mediocre ones.
- Every link must earn its place with a one-line reason.
- Never fabricate a URL. If you are unsure a link is real, drop it or verify it
  with a fetch.
- Keep tool use lean: don't fetch a page you don't need.
- When publishing, write a clear stack name (front-loaded, specific) and a
  one-paragraph summary a stranger could understand.

## Stacklist

Publishing uses the Stacklist MCP server when it is connected (tools like
`create_stack`, `add_cards`, `auto_tag_cards`, `generate_summary`,
`check_ai_discoverability`). If it is not connected, write the stack as markdown
to `output/<slug>.md` so the workshop still runs end-to-end with no account.

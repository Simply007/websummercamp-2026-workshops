# Phase 4, Build the publisher (+ optionally wire your product)

**Build:** `.claude/agents/stack-publisher.md`, then point `/build-stack` at it · ~15 min

The publisher turns the approved stack into output. By default it writes a local
file, so it works for everyone, no account needed.

## Build it
Create `.claude/agents/stack-publisher.md`:
- `tools: Write, WebFetch` · `model: sonnet`.
- Body: given an approved name, summary, tags, and ranked links, write a clean
  markdown stack to `output/<slug>.md` (slug = name, lowercased and hyphenated).
  Never invent a URL or a result.

Then change `/build-stack` **step 5** to launch `stack-publisher` instead of saving
inline.

✅ **Checkpoint:** `/build-stack "<topic>"` now ends with a saved `output/<slug>.md`.

## Publish for real (optional, the product moment)
Connect the **Stacklist MCP** (via `.mcp.json`), then add its tools to the
publisher's allowlist:
```
tools: Write, WebFetch, mcp__stacklist__create_stack, mcp__stacklist__add_cards,
       mcp__stacklist__auto_tag_cards, mcp__stacklist__generate_summary,
       mcp__stacklist__check_ai_discoverability
```
Now the same run publishes a live, AI-discoverable stack and reports a URL. The
agent didn't change, you widened its allowlist to include your product. That
allowlist line *is* the security model.

> **No Stacklist account? Skip this entirely**, the local-file path is the whole
> exercise. (Match the tool names to whatever your registered MCP exposes.)

## Make it yours
Publish to a tool *you* have, a Notion MCP, your CMS, a GitHub gist. Same pattern,
different tools.

## Stuck or behind?
```bash
git checkout phase-4 -- .claude
```

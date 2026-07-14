# Phase 5, Ship it to your team

**Build:** the deploy · ~15 min, the reason we did this in Claude Code, not a script.

Everything the agent needs is in `.claude/`. So shipping it is a commit.

## Do it
```bash
git add .claude CLAUDE.md
git commit -m "Add my /build-stack agent"
git push            # to your own repo or fork
```
Now a teammate, **pair up with your neighbour**, pulls it:
```bash
git pull && claude
> /build-stack "<their topic>"      # zero setup: they have your whole agent
```
✅ **Checkpoint:** someone else ran *your* agent with no setup. The repo is the
distribution mechanism, update an agent, commit, and the team gets it on next pull.

## Run it headless (CI)
`.github/workflows/weekly-stack.yml` runs the same command with `claude -p` on a
schedule (e.g. a fresh "trending" stack every Monday). Add `ANTHROPIC_API_KEY` as a
repo secret and trigger it from the Actions tab. Same agent, interactive, headless,
scheduled. You wrote it once.

## Where next
- `STRETCH.md`, extend the panel, add a judge subagent, build a code-review variant.
- The Anthropic links in `README.md`.
- The **Agent SDK** if you want to embed this in a product instead of running it in
  Claude Code.

You built a real, reusable, team-shared agent, and shipped it. That's the rung.

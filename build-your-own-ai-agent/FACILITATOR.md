# Facilitator runbook, Build a team agent in Claude Code (2.5h)

**Audience:** developers who already use Claude Code and Git.
**Outcome:** everyone leaves having **built** `/build-stack` themselves, a real,
reusable, team-shared agent, and knowing the pattern to build their own.

**It's build-along, not watch-along.** You build live; attendees build on their own
laptops. You circulate during the hands-on blocks. The phase tags are the safety
net: anyone behind runs `git checkout phase-N -- .claude` and rejoins instantly,
keeping their place.

**The load-bearing message, repeated:** an agent is config you commit, not a script.
Multi-agent is composition. Deploy = `git commit`.

---

## Before the room
- Push the repo + tags + the `start` branch. Tell attendees to clone and
  `git checkout start`.
- Fill the deck's `[bracketed]` placeholders (`slides/index.html`).
- Full dry run on the venue laptop: `git checkout start` → build a phase → confirm
  `git checkout phase-N -- .claude` catch-up works → run `/build-stack` end to end →
  test the live Stacklist publish on your account → open the deck.
- Have spare keys and a PDF of the deck on a USB stick.

---

## Timing at a glance

| Time | Block | Deck | Phase |
|---|---|---|---|
| 0:00–0:10 | Welcome + show the end state + setup check | [1–4] |, |
| 0:10–0:25 | Concept: what/why an agent + the evolution | [5–10] | 0 |
| 0:25–0:50 | **Build** the first subagent | [15] | 1 |
| 0:50–1:20 | **Build** the panel (+ make it yours) | [16] | 2 |
| 1:20–1:30 | Break |, |, |
| 1:30–1:55 | **Build** the orchestrator + first full run | [17] | 3 |
| 1:55–2:20 | **Build** the publisher + the deploy/CI payoff | [18–19] | 4→5 |
| 2:20–2:30 | Best practices + Q&A | [20–22] |, |

---

## 0:00–0:10, Welcome + the end state
- One line: *you'll leave having **built** an agent your whole team can use.*
- **Show the finish (45s):** run `/build-stack` on your machine, wired to Stacklist.
- Setup check: everyone on `git checkout start`, key loaded, `claude` open. The phase
  tags rescue anyone stuck, say so now so nobody panics.

## 0:10–0:25, Concept (deck [5–10])
- What an agent is (the loop) · why · when not (head off "why not a calculator").
- The evolution timeline + your thesis: build at the current rung. One war story
  from your own multi-agent work (e.g. Stacky), why a panel beats one model.

## 0:25–0:50, Build the first subagent (Phase 1)
- Deck [15], then everyone opens `phases/PHASE-1.md` and **writes**
  `.claude/agents/link-researcher.md`, frontmatter + system prompt. Walk the two
  load-bearing fields live: `description` = the delegation prompt, `tools` = blast
  radius. Mention the "ask Claude Code to draft, then tighten" path.
- **Circulate.** ✅ Checkpoint: everyone's subagent returns a candidate list.

## 0:50–1:20, Build the panel (Phase 2)
- Deck [16]. Give them the credibility reviewer as the worked shape; they **write**
  freshness + fit, then **make it yours**, at least one lens of their own + a topic
  they care about. This is where ownership starts; encourage divergence.
- ✅ Checkpoint: three independent scorings of one candidate list.

## 1:20–1:30, Break

## 1:30–1:55, Build the orchestrator + first full run (Phase 3)
- Deck [17]. They **write** `.claude/commands/build-stack.md`, research → 3
  reviewers in parallel → the lead **as judge**. They put their own judging rule in.
- **THE checkpoint that matters:** crowd-source a topic, everyone runs `/build-stack`,
  watches research → parallel review → ranked verdict → saved stack. *You wrote one
  command; a panel produced the answer.*

## 1:55–2:20, Build the publisher + deploy (Phase 4 → 5)
- **Phase 4:** they **write** `stack-publisher` (local file by default) and point
  `/build-stack` at it. **Product moment:** you run the Stacklist-connected version
  live → a real, discoverable stack. Attendees without access stay on the local file.
- **Phase 5, the payoff:** they `git commit` their `.claude/` and **pair up**, a
  neighbour `git pull`s and runs *their* agent with zero setup. Show
  `weekly-stack.yml` (same agent, headless in CI).

## 2:20–2:30, Best practices + Q&A (deck [20–22])
- Four that bite: tool sprawl; context rot; vague `description`s; cost (tier your
  models). Map each to something they just built.
- Where next: `STRETCH.md`, the Agent SDK, agent teams.

---

## Fallbacks
- **Behind?** `git checkout phase-N -- .claude`, the whole reason for the tags. Use
  shamelessly; nobody falls off. (One file: add the path.)
- **No Stacklist access:** local-file path is fully hands-on; you run the live publish.
- **Running behind:** protect the two checkpoints (a subagent returns a list; a full
  `/build-stack` returns a stack). Trim Phase 2's "make it yours" and the CI bit first.
- **Stuck writing a file:** tell them to ask Claude Code to draft it, then review, 
  that's the real workflow anyway.
- **API/network flaky:** teach the file walkthroughs offline; demo live once it's back.

## Cost
- One `/build-stack` run ≈ researcher + 3 Haiku reviewers + judge + publisher, cents
  on the tiered models. Fine on the summit key; don't leave a room looping the judge
  on Opus.

## Accuracy note
- Claude Code's exact frontmatter fields and `claude -p` flags shift between versions.
  Dry-run on the venue laptop and adjust `weekly-stack.yml` / the publisher allowlist
  to match the installed version.

---
description: Curate a topic into a ranked, reasoned stack, research, panel review, judge, publish.
argument-hint: "<topic or event name>"
---

The user wants to build a curated stack on this topic:

**$ARGUMENTS**

Run this orchestration. You are the lead agent and, at the end, the judge.

1. **Research.** Launch the `link-researcher` subagent on the topic. It returns
   a candidate list (`- [Title](url), reason`). If the topic is an event or
   event series, the researcher switches to event mode and the candidates are
   the edition's sessions. Parse only the lines starting with `- [`, ignore any
   preamble or trailing "Sources" section the tools may have forced in.

2. **Review, in parallel.** Launch all THREE reviewers in a single step so they
   run concurrently, each given the topic and the full candidate list:
   `reviewer-credibility`, `reviewer-freshness`, `reviewer-fit`.
   Each returns a `score | URL | reason` line per candidate plus a `DROP:` line.

3. **Judge.** This is your job, not a subagent's. Combine the three score sets:
   - Sum each link's three scores. Honour `DROP` votes, a link dropped by two
     or more reviewers is out.
   - **A dead-link claim only counts if uncontradicted.** Reviewer fetches can
     fail; if another agent in this run successfully fetched the same URL, the
     claim is noise, ignore it and say so. If nobody verified it, trust the
     claim and cut the link.
   - Remove near-duplicates, keep the stronger one.
   - Select the best **8–12** links (for events: the standout sessions,
     keynotes and main-theme coverage first). Quality over quantity.
   - Where reviewers sharply disagreed, make the call and state it in one line,
     don't hide the tension.

4. **Propose the stack.** Present a **name** (specific, front-loaded), a
   **one-paragraph summary** a stranger could understand, **3–6 tags**, and the
   **final ranked list** with one-line reasons plus a note on contested picks.
   Ask the user for a quick OK or edits before publishing, unless they already
   approved the run up front.

5. **Publish.** On approval, launch the `stack-publisher` subagent with the
   approved name, summary, tags, and ranked links. It publishes to Stacklist
   via its MCP tools when connected (reporting the stack URL and
   AI-discoverability check), otherwise it writes `output/<slug>.md`. Relay
   exactly what it reports; never claim a publish that didn't happen.

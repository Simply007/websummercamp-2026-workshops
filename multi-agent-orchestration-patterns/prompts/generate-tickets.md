# Ticket generator prompt

Paste the block below into Claude (or any LLM) during the workshop to generate a
fresh batch of support tickets. Save the model's output as a `.json` file and pipe
it through any topology:

```bash
pnpm fanout     --ticket generated/pack.json     # file may hold an array
pnpm council    --ticket generated/pack.json
pnpm supervisor --ticket-dir generated/           # or a whole folder
pnpm sequential --ticket generated/pack.json
```

---

## Variant A — real-LLM runs (diverse + adversarial)

```
You are generating synthetic customer-support tickets to stress-test a multi-agent
orchestration demo. Produce exactly N tickets as a single JSON array. Each element:

  { "id": "GEN-<n>", "from": "<plausible email>", "message": "<the ticket body>" }

Return ONLY the JSON array — no prose, no markdown fence.

Spread the batch deliberately across tone, sentiment, priority, and purpose. Do NOT
make them all angry. Include a realistic mix:
  - tone:      furious · frustrated-but-polite · calm · cheerful · confused
  - purpose:   billing · shipping · returns · account/login · general FAQ
  - severity:  trivial annoyance … business-critical

Crucially, include at least one of EACH of these adversarial shapes — they exist to
break specific orchestration patterns, so write them convincingly, not as caricatures:

  1. POLITE-BUT-SEVERE  — calm, courteous wording describing a serious problem
     (e.g. a large incorrect charge). No angry words at all.
     → breaks keyword-based sentiment/urgency heuristics.
  2. MULTI-ISSUE        — two genuinely distinct problems in one ticket
     (e.g. a billing error AND a missing package).
     → breaks single-route supervisors that resolve one issue and stop.
  3. MIXED-SIGNAL       — high urgency but positive/excited tone, or vice versa
     (e.g. thrilled customer who urgently needs something before an event).
     → makes independent classifiers disagree with each other.
  4. AMBIGUOUS/VAGUE    — a real issue described without the obvious keywords
     ("it's not working", "this isn't what I expected").
     → routes to the catch-all / falls through defaults.
  5. POLICY-EDGE        — mentions a contract, agreement, or terms violation, or a
     chargeback/fraud angle.
     → swings council votes toward block/escalate.

Set N = 8.
```

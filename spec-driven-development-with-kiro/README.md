# The Renaissance Developer: Spec-Driven Development — my workshop playground

> **[Web Summer Camp 2026](https://websummercamp.com/2026) — AI Engineering track**
> Session: [The Renaissance Developer: Spec-Driven Development in the age of AI](https://websummercamp.com/2026/session/the-renaissance-developer-spec-driven-development-in-the-age-of-ai)
> Speaker: **Luka Riester**, Senior Solution Architect at AWS
> Tooling: [Kiro](https://kiro.dev) — AWS's spec-driven agentic IDE/CLI

## My playground

The workshop ran in a cloud environment with Kiro CLI pre-installed;
[`expense-tiger-agentic/`](./expense-tiger-agentic/) is the project I brought
home from it — the **Expense Tiger** serverless expense-submission app
(CDK + Lambda + TypeScript frontend, Cognito auth), built and deployed to AWS
through the spec-driven loop: requirements → design → tasks → review →
implement.

The interesting part is `.kiro/` inside the project:

- **`specs/`** — the three specs the app was built from (`expense-backend`,
  `expense-frontend`, `expense-submission-app`)
- **`steering/`** — global behavior shaping (API contract enforcement,
  MCP-first approach)
- **`skills/` and `hooks/`** — reusable knowledge artifacts and guardrails
  (e.g. the `human-agent-team` skill: *humans own decisions, agents own
  throughput*)

I also ran the full bug-fix cycle and the DevX measurement exercise — the
generated
[`agentic-devx-productivity-report.md`](./expense-tiger-agentic/agentic-devx-productivity-report.md)
compares the agentic build against a traditional estimate (directional
numbers, single-developer sample).

The workshop guide lives in
[`expense-tiger-agentic/README.md`](./expense-tiger-agentic/README.md);
the app itself is documented in
[`README_EXPENSE_APP.md`](./expense-tiger-agentic/README_EXPENSE_APP.md).

> Note: `cdk-outputs.json` (live AWS endpoints from the workshop deployment)
> and the original workshop zips are kept out of the repository.

# Building MCP Apps: Branded Experiences Inside ChatGPT — my workshop playground

> **[Web Summer Camp 2026](https://websummercamp.com/2026) — AI Engineering track**
> Session: [Building MCP Apps: Branded Experiences Inside ChatGPT](https://websummercamp.com/2026/session/building-mcp-apps-branded-experiences-inside-chatgpt)
> Speaker: **Tejas Kumar**, Developer Advocate at IBM

## My playground

An MCP app built during the workshop: an MCP server that serves its own UI as
an embedded resource, so an MCP-compatible host (ChatGPT, Claude, VS Code,
Goose, …) can render a branded experience inside the conversation.

- **`mcp-server/`** — Express + `@modelcontextprotocol/sdk` server exposed over
  Streamable HTTP at `/mcp`, using `@modelcontextprotocol/ext-apps` to register:
  - a `greet` demo tool,
  - a **CKEditor-branded UI resource** (`resource.html`, served as
    `ui://my-mcp-server/ckeditor-trial.html`) — my own twist on the workshop
    material: a CKEditor trial welcome card rendered inside the host,
  - a `show_ckeditor_trial` app tool that opens it.
- **`index.html`** — a standalone form UI ("The New Way") experiment from the
  UI-layer part of the workshop.

## Run it

```bash
cd mcp-server
pnpm install
pnpm dev        # tsx watch index.ts — MCP endpoint at http://localhost:7777/mcp
```

Point an MCP Apps–capable client at the endpoint and call
`show_ckeditor_trial` to see the embedded UI.

// ─────────────────────────────────────────────────────────────────────────────
// Ticket loading + CLI override.
//
// By default each topology runs its own scripted fixtures. Pass tickets on the
// command line to run arbitrary ones instead — handy for the live "sandbox"
// segment where you generate fresh tickets and pipe them through a topology:
//
//   pnpm fanout --ticket fixtures/ticket-happy.json
//   pnpm council --ticket generated/pack.json          # file may hold an array
//   pnpm supervisor --ticket-dir generated/            # every *.json in a dir
//
// A ticket file may contain a single SupportTicket object OR an array of them,
// so the generator can emit one file that expands into N runs. `id`/`from` are
// filled in if the generated JSON omits them.
// ─────────────────────────────────────────────────────────────────────────────

import { readFile, readdir, access } from "fs/promises";
import { isAbsolute, join, resolve } from "path";
import type { SupportTicket } from "./types.js";

export interface LoadedTicket {
  ticket: SupportTicket;
  source: string; // short label for display (filename, optionally [index])
}

/**
 * Parse `--ticket <path>` (repeatable) and `--ticket-dir <dir>` from argv.
 * Returns [] when no CLI tickets were requested, so callers fall back to their
 * scripted fixtures. Relative `--ticket` paths are tried against the current
 * working directory first, then the repo's fixtures/ directory.
 */
export async function loadTicketsFromArgs(fixturesDir: string): Promise<LoadedTicket[]> {
  const argv = process.argv.slice(2);
  const files: string[] = [];
  let dir: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--ticket" && argv[i + 1]) files.push(argv[++i]);
    else if (argv[i] === "--ticket-dir" && argv[i + 1]) dir = argv[++i];
  }

  const loaded: LoadedTicket[] = [];

  for (const f of files) {
    const path = await resolvePath(f, fixturesDir);
    loaded.push(...(await readTickets(path, f)));
  }

  if (dir) {
    const base = isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
    const names = (await readdir(base)).filter((n) => n.endsWith(".json")).sort();
    for (const n of names) {
      loaded.push(...(await readTickets(join(base, n), n)));
    }
  }

  return loaded;
}

/** Read a fixture from the repo's fixtures/ directory by filename. */
export async function readFixtureTicket(fixturesDir: string, name: string): Promise<SupportTicket> {
  const [loaded] = await readTickets(join(fixturesDir, name), name);
  return loaded.ticket;
}

async function resolvePath(f: string, fixturesDir: string): Promise<string> {
  const candidates = isAbsolute(f)
    ? [f]
    : [resolve(process.cwd(), f), join(fixturesDir, f)];
  for (const c of candidates) {
    try {
      await access(c);
      return c;
    } catch {
      // try next candidate
    }
  }
  throw new Error(`Ticket file not found: "${f}" (looked in cwd and fixtures/)`);
}

async function readTickets(path: string, source: string): Promise<LoadedTicket[]> {
  const data = JSON.parse(await readFile(path, "utf-8")) as unknown;
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) throw new Error(`Ticket file "${source}" contained an empty array.`);

  return arr.map((raw, i) => {
    const t = raw as Partial<SupportTicket>;
    if (typeof t.message !== "string" || t.message.trim() === "") {
      throw new Error(`Ticket ${i} in "${source}" is missing a non-empty "message" field.`);
    }
    const ticket: SupportTicket = {
      id: typeof t.id === "string" ? t.id : `${source}-${i + 1}`,
      from: typeof t.from === "string" ? t.from : "generated@example.com",
      message: t.message,
    };
    return { ticket, source: arr.length > 1 ? `${source}[${i}]` : source };
  });
}

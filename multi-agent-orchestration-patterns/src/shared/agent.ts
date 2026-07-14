// ─────────────────────────────────────────────────────────────────────────────
// Agent factory.
//
// Every agent in this repo has the same shape as an HTTP call: build a
// request (prompt), send it (callLlm), parse the response. `defineAgent`
// makes that shape explicit so individual agents can live in their own file
// as a declarative { buildPrompt, parse } pair instead of a hand-rolled
// async function.
// ─────────────────────────────────────────────────────────────────────────────

import { callLlm } from "./llmClient.js";
import type { LlmPreference } from "./types.js";

export interface Agent<TArgs extends unknown[], TOut> {
  name: string;
  run: (...args: TArgs) => Promise<TOut>;
}

export function defineAgent<TArgs extends unknown[], TOut>(opts: {
  name: string;
  preference?: LlmPreference;
  buildPrompt: (...args: TArgs) => string;
  parse: (raw: string) => TOut;
}): Agent<TArgs, TOut> {
  return {
    name: opts.name,
    async run(...args: TArgs): Promise<TOut> {
      const prompt = opts.buildPrompt(...args);
      const raw = await callLlm(prompt, opts.preference);
      return opts.parse(raw);
    },
  };
}

import type { CensusKey } from "@/modules/census";

/**
 * Presentation-only prompts shown beneath the fixed census labels. The
 * labels and keys themselves are versioned in src/modules/census and never
 * change; these are just hints to help the writer start.
 */
export const CENSUS_PROMPTS: Record<CensusKey, string> = {
  fear: "What are you afraid of right now — the real thing, not the polite version?",
  love: "Who and what do you love? How does it show up in an ordinary week?",
  work: "What are you working on, and what is it costing or giving you?",
  home: "Where is home right now? Does it feel like one?",
  regret: "What do you regret this year, or wish you had done differently?",
};

export const LETTER_PROMPT =
  "Say anything. What do you hope is true by then? What should they remember about now?";

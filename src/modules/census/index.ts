export const CENSUS_VERSION = 1;

export const CENSUS_KEYS = ["fear", "love", "work", "home", "regret"] as const;

export type CensusKey = (typeof CENSUS_KEYS)[number];

export const CENSUS_LABELS: Record<CensusKey, string> = {
  fear: "Fear",
  love: "Love",
  work: "Work",
  home: "Home",
  regret: "Regret",
};

export type CensusAnswers = Record<CensusKey, string>;

export function emptyCensusAnswers(): CensusAnswers {
  return {
    fear: "",
    love: "",
    work: "",
    home: "",
    regret: "",
  };
}

export function parseCensusAnswers(
  input: Record<string, string>,
): CensusAnswers {
  const answers = emptyCensusAnswers();
  for (const key of CENSUS_KEYS) {
    answers[key] = (input[key] ?? "").trim();
  }
  return answers;
}

export function missingCensusKeys(answers: CensusAnswers): CensusKey[] {
  return CENSUS_KEYS.filter((key) => answers[key].length === 0);
}

export function assertCompleteCensus(answers: CensusAnswers): void {
  const missing = missingCensusKeys(answers);
  if (missing.length > 0) {
    throw new Error(`Census answers required: ${missing.join(", ")}`);
  }
}

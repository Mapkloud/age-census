import { describe, expect, it } from "vitest";
import { zonedInstant } from "../time";
import { getUnlockInstant, isLetterUnlocked } from "../age";
import {
  assertCanSealDraft,
  assertCanSealToAge,
  assertCanWriteToAge,
} from "./index";
import { emptyCensusAnswers } from "../census";

const NY = "America/New_York";
const birthDate = new Date("1990-06-15T12:00:00.000Z");

function fullAnswers() {
  const answers = emptyCensusAnswers();
  for (const key of Object.keys(answers) as Array<keyof typeof answers>) {
    answers[key] = "yes";
  }
  return answers;
}

describe("one sealed letter per age", () => {
  it("allows sealing multiple future ages in the same calendar year", () => {
    const now = zonedInstant(2026, 7, 1, 12, 0, 0, NY);
    const currentAge = 35;
    for (const targetAge of [40, 50, 60, 70]) {
      expect(() =>
        assertCanSealDraft({
          status: "DRAFT",
          body: "Dear future me",
          answers: fullAnswers(),
          currentAge,
          targetAge,
        }),
      ).not.toThrow();
    }
    expect(now.getFullYear()).toBe(2026);
  });

  it("blocks a second seal to the same age", () => {
    expect(() => assertCanSealToAge("SEALED", 70)).toThrow(/already has a sealed letter/);
    expect(() =>
      assertCanSealDraft({
        status: "SEALED",
        body: "Dear future me",
        answers: fullAnswers(),
        currentAge: 35,
        targetAge: 70,
      }),
    ).toThrow(/already has a sealed letter/);
  });

  it("allows one draft per age until sealed", () => {
    expect(() => assertCanSealToAge("DRAFT", 70)).not.toThrow();
  });

  it("forbids addressing a sealed age via write rules (past/current ages)", () => {
    expect(() => assertCanWriteToAge(35, 35)).toThrow(/past age/);
    expect(() => assertCanWriteToAge(35, 30)).toThrow(/past age/);
  });

  it("still unlocks on the birthday they turn the target age", () => {
    const unlock = getUnlockInstant(birthDate, NY, 40);
    const dayBefore = new Date(unlock.getTime() - 60_000);
    const onDay = unlock;
    expect(isLetterUnlocked(birthDate, NY, 40, dayBefore)).toBe(false);
    expect(isLetterUnlocked(birthDate, NY, 40, onDay)).toBe(true);
  });
});

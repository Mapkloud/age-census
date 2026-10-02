import { canAddressAge, getUnlockInstant, isLetterUnlocked } from "../age";
import { CENSUS_KEYS, type CensusAnswers } from "../census";

export const MILESTONE_AGES = [30, 35, 40, 50, 60, 70, 80] as const;

export type LetterStatus = "DRAFT" | "SEALED" | "UNLOCKED" | "OPENED";

export type ChairState = "empty" | "draft" | "sealed" | "unlocked" | "opened";

export type LetterRecord = {
  id: string;
  targetAge: number;
  status: LetterStatus;
};

export type Chair = {
  age: number;
  state: ChairState;
  letterId: string | null;
  milestone: boolean;
};

export function canEditLetter(status: LetterStatus): boolean {
  return status === "DRAFT";
}

export function resolveLetterStatus(
  letter: LetterRecord,
  birthDate: Date,
  timeZone: string,
  now: Date,
): LetterStatus {
  if (letter.status === "DRAFT" || letter.status === "OPENED") {
    return letter.status;
  }
  if (isLetterUnlocked(birthDate, timeZone, letter.targetAge, now)) {
    return "UNLOCKED";
  }
  return "SEALED";
}

export function chairStateFromStatus(status: LetterStatus | null): ChairState {
  if (!status) return "empty";
  if (status === "DRAFT") return "draft";
  if (status === "OPENED") return "opened";
  if (status === "UNLOCKED") return "unlocked";
  return "sealed";
}

export function buildChairs(args: {
  currentAge: number;
  letters: LetterRecord[];
  birthDate: Date;
  timeZone: string;
  now: Date;
}): Chair[] {
  const byAge = new Map(args.letters.map((letter) => [letter.targetAge, letter]));
  const ages = new Set<number>([
    ...MILESTONE_AGES.filter((age) => age > args.currentAge),
    ...args.letters.map((letter) => letter.targetAge),
  ]);

  return [...ages]
    .sort((a, b) => a - b)
    .map((age) => {
      const letter = byAge.get(age);
      const status = letter
        ? resolveLetterStatus(letter, args.birthDate, args.timeZone, args.now)
        : null;
      return {
        age,
        state: chairStateFromStatus(status),
        letterId: letter?.id ?? null,
        milestone: (MILESTONE_AGES as readonly number[]).includes(age),
      };
    });
}

export function assertCanWriteToAge(currentAge: number, targetAge: number): void {
  if (!canAddressAge(currentAge, targetAge)) {
    throw new Error("Cannot address current age or any past age");
  }
}

export function assertCanSealToAge(status: LetterStatus, targetAge: number): void {
  if (!canEditLetter(status)) {
    throw new Error(`Age ${targetAge} already has a sealed letter`);
  }
}

export function assertCanSealDraft(args: {
  status: LetterStatus;
  body: string;
  answers: CensusAnswers;
  currentAge: number;
  targetAge: number;
}): void {
  assertCanSealToAge(args.status, args.targetAge);
  assertCanWriteToAge(args.currentAge, args.targetAge);
  if (!args.body.trim()) {
    throw new Error("Letter body is required to seal");
  }
  const missing = CENSUS_KEYS.filter((key) => !args.answers[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Census answers required: ${missing.join(", ")}`);
  }
}

export function unlockCaption(
  birthDate: Date,
  timeZone: string,
  targetAge: number,
): Date {
  return getUnlockInstant(birthDate, timeZone, targetAge);
}

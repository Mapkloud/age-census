import { getCurrentAge, getUnlockInstant } from "../age";
import { CENSUS_KEYS, type CensusKey } from "../census";
import { resolveLetterStatus, type LetterStatus } from "../letters";

export type LetterExportInput = {
  targetAge: number;
  status: LetterStatus;
  body: string;
  sealedAt: Date | null;
  openedAt: Date | null;
  createdAt: Date;
  answers: Array<{ key: string; value: string }>;
};

export type LetterExportRow = {
  targetAge: number;
  status: LetterStatus;
  body: string;
  census: Record<CensusKey, string>;
  writtenAt: string;
  sealedAt: string | null;
  openedAt: string | null;
  ageAtWriting: number;
  unlockAt: string | null;
};

export type LetterDataExport = {
  exportedAt: string;
  /** Minimal context so ages and unlock dates remain interpretable. */
  context: {
    birthDate: string;
    timeZone: string;
  };
  letters: LetterExportRow[];
};

function isoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function censusFromAnswers(
  answers: Array<{ key: string; value: string }>,
): Record<CensusKey, string> {
  const byKey = new Map(answers.map((row) => [row.key, row.value]));
  return Object.fromEntries(
    CENSUS_KEYS.map((key) => [key, byKey.get(key) ?? ""]),
  ) as Record<CensusKey, string>;
}

/** Prefer seal time for “when written”; drafts use createdAt. */
export function writtenAtForLetter(letter: LetterExportInput): Date {
  return letter.sealedAt ?? letter.createdAt;
}

export function buildLetterDataExport(args: {
  exportedAt?: Date;
  birthDate: Date;
  timeZone: string;
  letters: LetterExportInput[];
}): LetterDataExport {
  const exportedAt = args.exportedAt ?? new Date();
  const sorted = [...args.letters].sort((a, b) => a.targetAge - b.targetAge);

  return {
    exportedAt: exportedAt.toISOString(),
    context: {
      birthDate: isoDateOnly(args.birthDate),
      timeZone: args.timeZone,
    },
    letters: sorted.map((letter) => {
      const writtenAt = writtenAtForLetter(letter);
      const status = resolveLetterStatus(
        {
          id: "export",
          targetAge: letter.targetAge,
          status: letter.status,
        },
        args.birthDate,
        args.timeZone,
        exportedAt,
      );
      const unlockAt =
        status === "DRAFT"
          ? null
          : getUnlockInstant(args.birthDate, args.timeZone, letter.targetAge);

      return {
        targetAge: letter.targetAge,
        status,
        body: letter.body,
        census: censusFromAnswers(letter.answers),
        writtenAt: writtenAt.toISOString(),
        sealedAt: letter.sealedAt?.toISOString() ?? null,
        openedAt: letter.openedAt?.toISOString() ?? null,
        ageAtWriting: getCurrentAge(args.birthDate, args.timeZone, writtenAt),
        unlockAt: unlockAt?.toISOString() ?? null,
      };
    }),
  };
}

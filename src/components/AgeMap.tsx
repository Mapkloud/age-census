import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, LockIcon, PenIcon, UnlockIcon } from "@/components/ui/Icons";
import { CHAIR_STATE_CAPTION, StateBadge, StateMark } from "@/components/ui/StateBadge";
import { cx } from "@/lib/cx";
import { formatDate, yearsAway } from "@/lib/format";
import { getUnlockInstant } from "@/modules/age";
import type { Chair } from "@/modules/letters";

type AgeMapProps = {
  chairs: Chair[];
  currentAge: number;
  birthDate: Date;
  timeZone: string;
  pastMilestones: number[];
};

type Row =
  | { kind: "chair"; chair: Chair }
  | { kind: "now"; age: number }
  | { kind: "past"; age: number };

/**
 * The home screen: a vertical map of ages. Rows are ordered by age; the
 * user's current age is a fixed marker; past ages are shown but disabled.
 */
export function AgeMap({ chairs, currentAge, birthDate, timeZone, pastMilestones }: AgeMapProps) {
  const nowRow: Row = { kind: "now", age: currentAge };
  const rows: Row[] = [
    ...pastMilestones
      .filter((age) => !chairs.some((chair) => chair.age === age))
      .map((age): Row => ({ kind: "past", age })),
    ...chairs.map((chair): Row => ({ kind: "chair", chair })),
    nowRow,
  ].sort((a, b) => {
    const ageA = a.kind === "chair" ? a.chair.age : a.age;
    const ageB = b.kind === "chair" ? b.chair.age : b.age;
    if (ageA !== ageB) return ageA - ageB;
    // A letter addressed to the current age sorts before the "now" marker.
    return a.kind === "now" ? 1 : -1;
  });

  return (
    <ol className="relative flex flex-col" aria-label="Ages">
      <span
        aria-hidden
        className="absolute bottom-6 left-[15px] top-6 w-px bg-line sm:left-[19px]"
      />
      {rows.map((row) => {
        if (row.kind === "now") {
          return (
            <li key="now" className="relative grid grid-cols-[2rem_1fr] items-center gap-4 py-4 sm:grid-cols-[2.5rem_1fr]">
              <span className="relative z-10 flex justify-center">
                <span className="size-3 rounded-full border-2 border-ink bg-paper ring-4 ring-paper" />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-serif text-2xl text-ink">{row.age}</span>
                <span className="eyebrow">You, now</span>
                <span className="text-sm text-muted">
                  This age can’t be addressed — only the ones ahead.
                </span>
              </div>
            </li>
          );
        }

        if (row.kind === "past") {
          return (
            <li
              key={`past-${row.age}`}
              className="relative grid grid-cols-[2rem_1fr] items-center gap-4 py-2 opacity-60 sm:grid-cols-[2.5rem_1fr]"
            >
              <span className="relative z-10 flex justify-center">
                <span className="size-1.5 rounded-full bg-faint ring-4 ring-paper" />
              </span>
              <p className="flex items-baseline gap-3 text-sm text-muted">
                <span className="font-serif text-lg tabular text-muted">{row.age}</span>
                Passed without a letter
              </p>
            </li>
          );
        }

        const { chair } = row;
        const unlockAt = getUnlockInstant(birthDate, timeZone, chair.age);
        const isPast = chair.age <= currentAge;
        return (
          <li key={chair.age} className="relative grid grid-cols-[2rem_1fr] gap-4 py-2.5 sm:grid-cols-[2.5rem_1fr]">
            <span className="relative z-10 flex justify-center pt-7">
              <StateMark state={chair.state} className="size-3 ring-4 ring-paper" />
            </span>
            <ChairCard chair={chair} unlockAt={unlockAt} currentAge={currentAge} timeZone={timeZone} isPast={isPast} />
          </li>
        );
      })}
    </ol>
  );
}

function ChairCard({
  chair,
  unlockAt,
  currentAge,
  timeZone,
  isPast,
}: {
  chair: Chair;
  unlockAt: Date;
  currentAge: number;
  timeZone: string;
  isPast: boolean;
}) {
  const unlockLabel = formatDate(unlockAt, timeZone);
  const isActionable = chair.state === "unlocked";

  const caption = (() => {
    switch (chair.state) {
      case "empty":
        return `Unlocks ${yearsAway(currentAge, chair.age)}, on ${unlockLabel}.`;
      case "draft":
        return `Unsealed draft. Unlocks ${yearsAway(currentAge, chair.age)}, on ${unlockLabel}.`;
      case "sealed":
        return `Sealed. Opens on ${unlockLabel} — ${yearsAway(currentAge, chair.age)}.`;
      case "unlocked":
        return `Unlocked on ${unlockLabel}. Your letter is ready.`;
      case "opened":
        return `Opened. Written for your birthday on ${unlockLabel}.`;
    }
  })();

  return (
    <article
      aria-labelledby={`chair-${chair.age}`}
      className={cx(
        "flex flex-col gap-4 rounded-lg border px-5 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
        isActionable
          ? "border-accent/40 bg-accent-soft/40"
          : chair.state === "empty"
            ? "border-dashed border-line-strong bg-transparent hover:border-ink-soft/60"
            : "border-line bg-surface",
        isPast && chair.state !== "unlocked" && chair.state !== "opened" && "opacity-70",
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <h2
          id={`chair-${chair.age}`}
          className={cx(
            "font-serif text-4xl leading-none tabular",
            isActionable ? "text-accent" : "text-ink",
          )}
        >
          {chair.age}
        </h2>
        <div className="min-w-0 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <StateBadge state={chair.state} />
            {chair.milestone ? <span className="eyebrow">Milestone</span> : null}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            <span className="sr-only">{CHAIR_STATE_CAPTION[chair.state]}. </span>
            {caption}
          </p>
        </div>
      </div>

      <div className="shrink-0 sm:pl-4">
        {chair.state === "empty" ? (
          <ButtonLink href={`/write/${chair.age}`} variant="secondary" size="sm" aria-label={`Write to age ${chair.age}`}>
            <PenIcon size={14} />
            Write
          </ButtonLink>
        ) : null}
        {chair.state === "draft" ? (
          <ButtonLink href={`/write/${chair.age}`} variant="secondary" size="sm" aria-label={`Continue draft to age ${chair.age}`}>
            <PenIcon size={14} />
            Continue draft
          </ButtonLink>
        ) : null}
        {chair.state === "sealed" ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <LockIcon size={14} />
            Waiting
          </span>
        ) : null}
        {chair.state === "unlocked" && chair.letterId ? (
          <ButtonLink href={`/open/${chair.letterId}`} size="sm" aria-label={`Open letter to age ${chair.age}`}>
            <UnlockIcon size={14} />
            Open
          </ButtonLink>
        ) : null}
        {chair.state === "opened" && chair.letterId ? (
          <Link
            href={`/open/${chair.letterId}`}
            className="inline-flex items-center gap-1 text-sm text-ink-soft underline-offset-4 hover:text-accent hover:underline"
            aria-label={`Read letter to age ${chair.age}`}
          >
            Read
            <ArrowRightIcon size={14} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

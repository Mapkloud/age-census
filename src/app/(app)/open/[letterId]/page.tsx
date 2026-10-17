import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { openLetter } from "@/app/actions/letters";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, LockIcon, SealIcon, UnlockIcon } from "@/components/ui/Icons";
import { Notice } from "@/components/ui/Notice";
import { PageShell } from "@/components/ui/PageShell";
import {
  decryptAnswers,
  decryptLetterBody,
} from "@/lib/crypto/content";
import { cx } from "@/lib/cx";
import { formatDate, formatDateTime, yearsAway } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/session";
import { getCurrentAge, getUnlockInstant, isLetterUnlocked } from "@/modules/age";
import { CENSUS_KEYS, CENSUS_LABELS, type CensusKey } from "@/modules/census";

export const dynamic = "force-dynamic";

export const metadata = { title: "Open a letter" };

export default async function OpenPage({
  params,
}: {
  params: Promise<{ letterId: string }>;
}) {
  const { letterId } = await params;
  const user = await requireOnboardedUser(`/open/${letterId}`);
  const now = new Date();
  // Metadata only until the letter is opened — never load body/answers for sealed chairs.
  const letter = await prisma.letter.findFirst({
    where: { id: letterId, userId: user.id },
    select: {
      id: true,
      targetAge: true,
      status: true,
      sealedAt: true,
      openedAt: true,
    },
  });
  if (!letter || letter.status === "DRAFT") {
    notFound();
  }

  const currentAge = getCurrentAge(user.birthDate, user.timezone, now);
  const unlocked = isLetterUnlocked(user.birthDate, user.timezone, letter.targetAge, now);
  const unlockAt = getUnlockInstant(user.birthDate, user.timezone, letter.targetAge);
  const writtenAt = letter.sealedAt
    ? getCurrentAge(user.birthDate, user.timezone, letter.sealedAt)
    : null;
  const sealedLabel = letter.sealedAt ? formatDate(letter.sealedAt, user.timezone) : null;

  // 1. Still sealed — the birthday hasn't arrived.
  if (!unlocked) {
    return (
      <PageShell
        width="narrow"
        eyebrow={`Age ${letter.targetAge}`}
        title="Still waiting."
        description={`This letter unseals on your birthday, ${formatDate(unlockAt, user.timezone)} — ${yearsAway(currentAge, letter.targetAge)}. Opening happens here, not in your inbox.`}
      >
        <Notice icon={<LockIcon size={16} />} title="Sealed">
          {sealedLabel && writtenAt !== null
            ? `Written when you were ${writtenAt}, sealed on ${sealedLabel}. `
            : null}
          Nothing inside can be read or changed until then.
        </Notice>
        <ButtonLink href="/map" variant="secondary" className="mt-8">
          <ArrowLeftIcon size={16} />
          Back to the map
        </ButtonLink>
      </PageShell>
    );
  }

  // 2. Unlocked but not yet opened — the unseal moment (still no plaintext content).
  if (letter.status !== "OPENED") {
    return (
      <PageShell
        width="narrow"
        eyebrow={`Age ${letter.targetAge} · unlocked`}
        title="A letter has arrived."
        description={`You are ${letter.targetAge} today. Someone who was ${writtenAt ?? "younger"} wrote this for you.`}
      >
        <Card tone="raised" padding="lg" className="animate-reveal flex flex-col items-center text-center">
          <span className="flex size-20 items-center justify-center rounded-full border border-accent/40 bg-accent-soft text-accent">
            <SealIcon size={40} />
          </span>
          <p className="mt-6 font-serif text-3xl text-ink">To age {letter.targetAge}</p>
          <dl className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted">
            {sealedLabel ? (
              <div className="flex gap-1.5">
                <dt>Sealed</dt>
                <dd className="text-ink-soft">{sealedLabel}</dd>
              </div>
            ) : null}
            {writtenAt !== null ? (
              <div className="flex gap-1.5">
                <dt>Written at</dt>
                <dd className="text-ink-soft">{writtenAt}</dd>
              </div>
            ) : null}
            <div className="flex gap-1.5">
              <dt>Unlocked</dt>
              <dd className="text-ink-soft">{formatDate(unlockAt, user.timezone)}</dd>
            </div>
          </dl>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            Take a breath. Once opened, the letter and its census are laid beside every
            earlier census you have unsealed.
          </p>
          <form action={openLetter} className="mt-8">
            <input type="hidden" name="letterId" value={letter.id} />
            <Button type="submit" size="lg">
              <UnlockIcon size={18} />
              Unseal the letter
            </Button>
          </form>
        </Card>
      </PageShell>
    );
  }

  // 3. Opened — load and decrypt content only after birthday + intentional unseal.
  const opened = await prisma.letter.findFirst({
    where: { id: letter.id, userId: user.id, status: "OPENED" },
    include: { answers: true },
  });
  if (!opened) {
    notFound();
  }

  const earlier = await prisma.letter.findMany({
    where: {
      userId: user.id,
      status: "OPENED",
      sealedAt: { not: null, lt: opened.sealedAt ?? now },
    },
    include: { answers: true },
    orderBy: { sealedAt: "desc" },
  });

  const plainBody = decryptLetterBody(opened.id, opened.body);

  const columns = [opened, ...earlier].map((entry) => {
    const plainAnswers = decryptAnswers(entry.id, entry.answers);
    return {
      id: entry.id,
      isCurrent: entry.id === opened.id,
      targetAge: entry.targetAge,
      writtenAt: entry.sealedAt
        ? getCurrentAge(user.birthDate, user.timezone, entry.sealedAt)
        : null,
      year: entry.sealedAt
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: user.timezone,
            year: "numeric",
          }).format(entry.sealedAt)
        : null,
      answers: Object.fromEntries(
        plainAnswers.map((answer) => [answer.key, answer.value]),
      ) as Partial<Record<CensusKey, string>>,
    };
  });

  const gridStyle = {
    "--cols": `repeat(${Math.min(columns.length, 3)}, minmax(0, 1fr))`,
  } as CSSProperties;

  return (
    <PageShell
      width="default"
      eyebrow={`Opened · age ${letter.targetAge}`}
      title={
        writtenAt !== null ? (
          <>
            From {writtenAt}, to {letter.targetAge}.
          </>
        ) : (
          <>To age {letter.targetAge}.</>
        )
      }
      description={
        <>
          {sealedLabel ? `Sealed ${sealedLabel}. ` : null}
          {letter.openedAt ? `Opened ${formatDateTime(letter.openedAt, user.timezone)}.` : null}
        </>
      }
    >
      <article aria-labelledby="letter-heading" className="animate-reveal">
        <h2 id="letter-heading" className="sr-only">
          The letter
        </h2>
        <Card tone="raised" padding="lg">
          <p className="eyebrow">The letter</p>
          <div className="mt-5 whitespace-pre-wrap font-serif text-lg leading-8 text-ink sm:text-xl sm:leading-9">
            {plainBody}
          </div>
        </Card>
      </article>

      <section aria-labelledby="comparison-heading" className="mt-16 flex flex-col gap-10">
        <div>
          <p className="eyebrow">Census comparison</p>
          <h2 id="comparison-heading" className="mt-1 font-serif text-2xl text-ink sm:text-3xl">
            The same five questions, across the years.
          </h2>
          {earlier.length === 0 ? (
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              This is the first census you have opened. The next one you unseal will sit
              beside it.
            </p>
          ) : (
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
              This letter first, then {earlier.length === 1 ? "the one" : `the ${earlier.length}`}{" "}
              you opened before it, most recent first.
            </p>
          )}
        </div>

        <ol className="flex flex-col gap-10">
          {CENSUS_KEYS.map((key, index) => (
            <li key={key} className="flex flex-col gap-4">
              <h3 className="flex items-baseline gap-3">
                <span aria-hidden className="font-mono text-xs text-faint">
                  0{index + 1}
                </span>
                <span className="font-serif text-2xl text-ink">{CENSUS_LABELS[key]}</span>
              </h3>
              <div
                className={cx(
                  "grid gap-3",
                  columns.length > 1 && "sm:[grid-template-columns:var(--cols)]",
                )}
                style={gridStyle}
              >
                {columns.map((column) => (
                  <Card
                    key={column.id}
                    tone={column.isCurrent ? "accent" : "default"}
                    padding="sm"
                    className="flex flex-col gap-2"
                  >
                    <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted">
                      <span className={cx("font-medium", column.isCurrent && "text-accent")}>
                        {column.isCurrent ? "This letter" : `To age ${column.targetAge}`}
                      </span>
                      <span>
                        {column.writtenAt !== null ? `Written at ${column.writtenAt}` : null}
                        {column.year ? ` · ${column.year}` : null}
                      </span>
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                      {column.answers[key]?.trim() ? (
                        column.answers[key]
                      ) : (
                        <span className="text-faint">No answer</span>
                      )}
                    </p>
                  </Card>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-16">
        <ButtonLink href="/map" variant="secondary">
          <ArrowLeftIcon size={16} />
          Back to the map
        </ButtonLink>
      </div>
    </PageShell>
  );
}

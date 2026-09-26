import { notFound } from "next/navigation";
import { currentStampStatus, saveDraft, sealLetter } from "@/app/actions/letters";
import { SealConfirm } from "@/components/SealConfirm";
import { StampStatus } from "@/components/StampStatus";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { ArrowLeftIcon, LockIcon } from "@/components/ui/Icons";
import { Notice } from "@/components/ui/Notice";
import { PageShell } from "@/components/ui/PageShell";
import { CENSUS_PROMPTS, LETTER_PROMPT } from "@/lib/censusCopy";
import { formatDate, timeAgo, yearsAway } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/session";
import { canAddressAge, getCurrentAge, getUnlockInstant } from "@/modules/age";
import { CENSUS_KEYS, CENSUS_LABELS, emptyCensusAnswers } from "@/modules/census";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ age: string }> }) {
  const { age } = await params;
  return { title: `Letter to age ${age}` };
}

export default async function WritePage({
  params,
}: {
  params: Promise<{ age: string }>;
}) {
  const { age } = await params;
  const targetAge = Number(age);
  if (!Number.isInteger(targetAge)) {
    notFound();
  }

  const user = await requireOnboardedUser();
  const now = new Date();
  const currentAge = getCurrentAge(user.birthDate, user.timezone, now);
  const stamp = await currentStampStatus(user.id, user.timezone, now);
  const existing = await prisma.letter.findUnique({
    where: { userId_targetAge: { userId: user.id, targetAge } },
    include: { answers: true },
  });

  if (existing && existing.status !== "DRAFT") {
    return (
      <PageShell
        width="narrow"
        eyebrow={`Age ${targetAge}`}
        title="This letter is sealed."
        description="Seal is irreversible: no peeking, no edits, no deleting. It will open on the birthday it was written for."
      >
        <Notice icon={<LockIcon size={16} />}>
          Sealed{existing.sealedAt ? ` on ${formatDate(existing.sealedAt, user.timezone)}` : ""}.
          Opens on {formatDate(getUnlockInstant(user.birthDate, user.timezone, targetAge), user.timezone)}.
        </Notice>
        <ButtonLink href="/map" variant="secondary" className="mt-8">
          <ArrowLeftIcon size={16} />
          Back to the map
        </ButtonLink>
      </PageShell>
    );
  }

  if (!existing && !canAddressAge(currentAge, targetAge)) {
    return (
      <PageShell
        width="narrow"
        eyebrow={`Age ${targetAge}`}
        title="That age is behind you."
        description={`You are ${currentAge}. Letters can only be addressed to ages ahead of you — the map shows which chairs are open.`}
      >
        <ButtonLink href="/map" variant="secondary">
          <ArrowLeftIcon size={16} />
          Back to the map
        </ButtonLink>
      </PageShell>
    );
  }

  const answers = emptyCensusAnswers();
  for (const answer of existing?.answers ?? []) {
    if (answer.key in answers) {
      answers[answer.key as keyof typeof answers] = answer.value;
    }
  }

  const unlockAt = getUnlockInstant(user.birthDate, user.timezone, targetAge);
  const unlockLabel = formatDate(unlockAt, user.timezone);
  const hasDraft = Boolean(existing);

  return (
    <PageShell
      width="narrow"
      eyebrow={`Letter · age ${targetAge}`}
      title={<>To yourself at {targetAge}.</>}
      description={`You are ${currentAge}. This opens ${yearsAway(currentAge, targetAge)}, on your birthday, ${unlockLabel}.`}
    >
      <div className="flex flex-col gap-3 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between">
        <StampStatus year={stamp.year} spent={stamp.spent} variant="inline" />
        <p className="text-sm text-muted" aria-live="polite">
          {hasDraft && existing
            ? `Draft saved ${timeAgo(existing.updatedAt, now)}`
            : "Nothing saved yet"}
        </p>
      </div>

      <form id="letter-form" className="mt-12 flex flex-col gap-16">
        <input type="hidden" name="targetAge" value={targetAge} />

        <section aria-labelledby="census-heading" className="flex flex-col gap-10">
          <div>
            <p className="eyebrow">Part one</p>
            <h2 id="census-heading" className="mt-1 font-serif text-2xl text-ink">
              The census
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Five fixed questions, the same every year. Short and honest beats long and
              careful — you’ll compare these answers side by side later.
            </p>
          </div>

          {CENSUS_KEYS.map((key, index) => (
            <Field
              key={key}
              id={`census-${key}`}
              label={
                <span className="flex items-baseline gap-3">
                  <span aria-hidden className="font-mono text-xs text-faint">
                    0{index + 1}
                  </span>
                  <span className="font-serif text-xl font-normal">{CENSUS_LABELS[key]}</span>
                </span>
              }
              hint={CENSUS_PROMPTS[key]}
            >
              <Textarea
                id={`census-${key}`}
                name={key}
                defaultValue={answers[key]}
                rows={3}
                aria-describedby={`census-${key}-hint`}
                className="order-last"
              />
            </Field>
          ))}
        </section>

        <section aria-labelledby="letter-heading" className="flex flex-col gap-6">
          <div>
            <p className="eyebrow">Part two</p>
            <h2 id="letter-heading" className="mt-1 font-serif text-2xl text-ink">
              The letter
            </h2>
          </div>
          <Field id="body" label={<span className="sr-only">Letter</span>} hint={LETTER_PROMPT}>
            <Textarea
              id="body"
              name="body"
              defaultValue={existing?.body ?? ""}
              rows={12}
              placeholder={`Dear ${targetAge},`}
              aria-describedby="body-hint"
              className="order-last min-h-64 text-base leading-7"
            />
          </Field>
        </section>

        <div className="flex flex-col gap-6 border-t border-line pt-8">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
            <Button
              type="submit"
              formAction={saveDraft}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Save draft
            </Button>
            <SealConfirm
              targetAge={targetAge}
              unlockDate={unlockLabel}
              stampYear={stamp.year}
              stampSpent={stamp.spent}
              requiredFields={[
                ...CENSUS_KEYS.map((key) => ({ name: key, label: CENSUS_LABELS[key] })),
                { name: "body", label: "the letter" },
              ]}
              sealAction={sealLetter}
            />
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Drafts are private and can be edited any time. Sealing is final and spends
            your {stamp.year} stamp.
          </p>
        </div>
      </form>
    </PageShell>
  );
}

import { notFound } from "next/navigation";
import { saveDraft, sealLetter, sealedTargetAges } from "@/app/actions/letters";
import { SealBalance } from "@/components/SealBalance";
import { SealConfirm } from "@/components/SealConfirm";
import { SealedAgesSummary } from "@/components/SealedAgesSummary";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { ArrowLeftIcon, LockIcon } from "@/components/ui/Icons";
import { Notice } from "@/components/ui/Notice";
import { PageShell } from "@/components/ui/PageShell";
import { CENSUS_PROMPTS, LETTER_PROMPT } from "@/lib/censusCopy";
import {
  decryptCensusValue,
  decryptLetterBody,
} from "@/lib/crypto/content";
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
  const sealedAges = await sealedTargetAges(user.id);
  const existingMeta = await prisma.letter.findUnique({
    where: { userId_targetAge: { userId: user.id, targetAge } },
    select: { id: true, status: true, sealedAt: true },
  });

  if (existingMeta && existingMeta.status !== "DRAFT") {
    return (
      <PageShell
        width="narrow"
        eyebrow={`Age ${targetAge}`}
        title="This letter is sealed."
        description="Seal is irreversible: no peeking, no edits, no deleting. It will open on the birthday it was written for."
      >
        <Notice icon={<LockIcon size={16} />}>
          Sealed{existingMeta.sealedAt ? ` on ${formatDate(existingMeta.sealedAt, user.timezone)}` : ""}.
          Opens on {formatDate(getUnlockInstant(user.birthDate, user.timezone, targetAge), user.timezone)}.
        </Notice>
        <ButtonLink href="/map" variant="secondary" className="mt-8">
          <ArrowLeftIcon size={16} />
          Back to the map
        </ButtonLink>
      </PageShell>
    );
  }

  // Drafts only — load body/answers after confirming status is DRAFT (or empty).
  const existing =
    existingMeta?.status === "DRAFT"
      ? await prisma.letter.findFirst({
          where: { id: existingMeta.id, status: "DRAFT" },
          include: { answers: true },
        })
      : null;

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
      answers[answer.key as keyof typeof answers] = decryptCensusValue(
        existing!.id,
        answer.key,
        answer.value,
      );
    }
  }
  const draftBody = existing ? decryptLetterBody(existing.id, existing.body) : "";

  if (!existing && user.sealBalance < 1) {
    return (
      <PageShell
        width="narrow"
        eyebrow={`Age ${targetAge}`}
        title="You need a seal first."
        description="A new age can only be addressed when you have at least one seal. Existing drafts stay editable."
      >
        <Notice tone="warning" title="No seals left">
          You need a seal to address age {targetAge}. Purchasing more seals
          isn’t available yet — check Seal balance for updates.
        </Notice>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/seals">Seal balance</ButtonLink>
          <ButtonLink href="/map" variant="secondary">
            <ArrowLeftIcon size={16} />
            Back to the map
          </ButtonLink>
        </div>
      </PageShell>
    );
  }

  const unlockAt = getUnlockInstant(user.birthDate, user.timezone, targetAge);
  const unlockLabel = formatDate(unlockAt, user.timezone);
  const hasDraft = Boolean(existing);
  const canSeal = user.sealBalance >= 1;

  return (
    <PageShell
      width="narrow"
      eyebrow={`Letter · age ${targetAge}`}
      title={<>To yourself at {targetAge}.</>}
      description={`You are ${currentAge}. This opens ${yearsAway(currentAge, targetAge)}, on your birthday, ${unlockLabel}.`}
    >
      <div className="flex flex-col gap-3 border-y border-line py-4">
        <SealBalance balance={user.sealBalance} variant="inline" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SealedAgesSummary sealedAges={sealedAges} variant="inline" />
          <p className="text-sm text-muted" aria-live="polite">
            {hasDraft && existing
              ? `Draft saved ${timeAgo(existing.updatedAt, now)}`
              : "Nothing saved yet"}
          </p>
        </div>
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
              defaultValue={draftBody}
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
            {canSeal ? (
              <SealConfirm
                targetAge={targetAge}
                unlockDate={unlockLabel}
                requiredFields={[
                  ...CENSUS_KEYS.map((key) => ({ name: key, label: CENSUS_LABELS[key] })),
                  { name: "body", label: "the letter" },
                ]}
                sealAction={sealLetter}
              />
            ) : (
              <ButtonLink href="/seals?reason=new-age" className="w-full sm:w-auto">
                Seal balance
              </ButtonLink>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Drafts are private and can be edited any time. Sealing spends one seal
            and is final — this age can only be sealed once.
          </p>
        </div>
      </form>
    </PageShell>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { currentStampStatus, saveDraft, sealLetter } from "@/app/actions/letters";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/session";
import { canAddressAge, getCurrentAge } from "@/modules/age";
import { CENSUS_KEYS, CENSUS_LABELS, emptyCensusAnswers } from "@/modules/census";

export const dynamic = "force-dynamic";

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
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Age {targetAge} is sealed</h1>
        <p className="text-sm text-neutral-700">
          Seal is irreversible. No peek, no edit, no delete.
        </p>
        <Link href="/map" className="text-sm underline">
          Back to map
        </Link>
      </main>
    );
  }

  if (!existing && !canAddressAge(currentAge, targetAge)) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">That age is closed</h1>
        <p className="text-sm text-neutral-700">
          You cannot address your current age ({currentAge}) or any past age.
        </p>
        <Link href="/map" className="text-sm underline">
          Back to map
        </Link>
      </main>
    );
  }

  const answers = emptyCensusAnswers();
  for (const answer of existing?.answers ?? []) {
    if (answer.key in answers) {
      answers[answer.key as keyof typeof answers] = answer.value;
    }
  }

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Write to age {targetAge}</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Five census questions plus one letter. Drafts are free. Sealing spends
          this year&apos;s stamp
          {stamp.spent ? " — already spent." : ` (${stamp.year}).`}
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <input type="hidden" name="targetAge" value={targetAge} />
        {CENSUS_KEYS.map((key) => (
          <label key={key} className="text-sm">
            {CENSUS_LABELS[key]}
            <textarea
              name={key}
              defaultValue={answers[key]}
              rows={3}
              className="mt-1 w-full border border-neutral-300 px-3 py-2"
            />
          </label>
        ))}
        <label className="text-sm">
          Letter
          <textarea
            name="body"
            defaultValue={existing?.body ?? ""}
            rows={8}
            className="mt-1 w-full border border-neutral-300 px-3 py-2"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            formAction={saveDraft}
            className="border border-neutral-400 px-4 py-2 text-sm"
          >
            Save draft
          </button>
          <button
            type="submit"
            formAction={sealLetter}
            disabled={stamp.spent}
            className="border border-neutral-800 px-4 py-2 text-sm disabled:opacity-40"
          >
            Seal (irreversible)
          </button>
        </div>
      </form>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { openLetter } from "@/app/actions/letters";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/session";
import { getUnlockInstant, isLetterUnlocked } from "@/modules/age";
import { CENSUS_KEYS, CENSUS_LABELS, type CensusKey } from "@/modules/census";

export const dynamic = "force-dynamic";

export default async function OpenPage({
  params,
}: {
  params: Promise<{ letterId: string }>;
}) {
  const { letterId } = await params;
  const user = await requireOnboardedUser();
  const now = new Date();
  const letter = await prisma.letter.findFirst({
    where: { id: letterId, userId: user.id },
    include: { answers: true },
  });
  if (!letter || letter.status === "DRAFT") {
    notFound();
  }

  const unlocked = isLetterUnlocked(
    user.birthDate,
    user.timezone,
    letter.targetAge,
    now,
  );
  const unlockAt = getUnlockInstant(user.birthDate, user.timezone, letter.targetAge);

  if (!unlocked) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Age {letter.targetAge} is waiting</h1>
        <p className="text-sm text-neutral-700">
          This letter unseals on{" "}
          {unlockAt.toLocaleString("en-US", { timeZone: user.timezone })}. Opening
          happens here, not in your inbox.
        </p>
        <Link href="/map" className="text-sm underline">
          Back to map
        </Link>
      </main>
    );
  }

  if (letter.status !== "OPENED") {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Age {letter.targetAge} is ready</h1>
        <p className="text-sm text-neutral-700">Unseal this letter in the app.</p>
        <form action={openLetter}>
          <input type="hidden" name="letterId" value={letter.id} />
          <button type="submit" className="border border-neutral-800 px-4 py-2 text-sm">
            Open
          </button>
        </form>
      </main>
    );
  }

  const earlier = await prisma.letter.findMany({
    where: {
      userId: user.id,
      status: "OPENED",
      sealedAt: { not: null, lt: letter.sealedAt ?? now },
    },
    include: { answers: true },
    orderBy: { sealedAt: "asc" },
  });

  const currentAnswers = Object.fromEntries(
    letter.answers.map((answer) => [answer.key, answer.value]),
  );

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Opened — age {letter.targetAge}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm">{letter.body}</p>
      </div>

      <section>
        <h2 className="text-lg font-medium">Census comparison</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border border-neutral-300 px-2 py-1">Question</th>
                <th className="border border-neutral-300 px-2 py-1">
                  Age {letter.targetAge}
                </th>
                {earlier.map((prior) => (
                  <th key={prior.id} className="border border-neutral-300 px-2 py-1">
                    Age {prior.targetAge}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CENSUS_KEYS.map((key) => (
                <tr key={key}>
                  <td className="border border-neutral-300 px-2 py-1">
                    {CENSUS_LABELS[key as CensusKey]}
                  </td>
                  <td className="border border-neutral-300 px-2 py-1">
                    {currentAnswers[key] ?? ""}
                  </td>
                  {earlier.map((prior) => (
                    <td key={prior.id} className="border border-neutral-300 px-2 py-1">
                      {prior.answers.find((answer) => answer.key === key)?.value ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

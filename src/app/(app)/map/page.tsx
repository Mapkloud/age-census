import Link from "next/link";
import { currentStampStatus, startCustomAge } from "@/app/actions/letters";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/session";
import { getCurrentAge } from "@/modules/age";
import { buildChairs } from "@/modules/letters";

export const dynamic = "force-dynamic";

const stateLabel = {
  empty: "Empty",
  draft: "Draft",
  sealed: "Sealed — waiting",
  unlocked: "Unlocked — ready to open",
  opened: "Opened",
};

export default async function MapPage() {
  const user = await requireOnboardedUser();
  const now = new Date();
  const currentAge = getCurrentAge(user.birthDate, user.timezone, now);
  const letters = await prisma.letter.findMany({
    where: { userId: user.id },
    select: { id: true, targetAge: true, status: true },
  });
  const chairs = buildChairs({
    currentAge,
    letters,
    birthDate: user.birthDate,
    timeZone: user.timezone,
    now,
  });
  const stamp = await currentStampStatus(user.id, user.timezone, now);

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Age map</h1>
        <p className="mt-2 text-sm text-neutral-700">
          You are {currentAge}. Chairs are future ages, not dates. This year&apos;s
          stamp ({stamp.year}) is {stamp.spent ? "spent" : "available"}.
        </p>
      </div>

      <ul className="divide-y divide-neutral-200 border border-neutral-300">
        {chairs.map((chair) => (
          <li key={chair.age} className="flex items-center justify-between gap-4 px-3 py-3">
            <div>
              <p className="font-medium">Age {chair.age}</p>
              <p className="text-sm text-neutral-600">
                {stateLabel[chair.state]}
                {chair.milestone ? " · milestone" : ""}
              </p>
            </div>
            {chair.state === "empty" || chair.state === "draft" ? (
              <Link href={`/write/${chair.age}`} className="text-sm underline">
                Write
              </Link>
            ) : null}
            {chair.state === "unlocked" && chair.letterId ? (
              <Link href={`/open/${chair.letterId}`} className="text-sm underline">
                Open
              </Link>
            ) : null}
            {chair.state === "opened" && chair.letterId ? (
              <Link href={`/open/${chair.letterId}`} className="text-sm underline">
                Read
              </Link>
            ) : null}
            {chair.state === "sealed" ? (
              <span className="text-sm text-neutral-500">Waiting</span>
            ) : null}
          </li>
        ))}
      </ul>

      <form action={startCustomAge} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Write to another age
          <input
            required
            type="number"
            name="targetAge"
            min={currentAge + 1}
            max={120}
            className="mt-1 block w-32 border border-neutral-300 px-3 py-2"
          />
        </label>
        <button type="submit" className="border border-neutral-800 px-3 py-2 text-sm">
          Address
        </button>
      </form>
    </main>
  );
}

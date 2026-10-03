import { sealedTargetAges, startCustomAge } from "@/app/actions/letters";
import { AgeMap } from "@/components/AgeMap";
import { SealBalance } from "@/components/SealBalance";
import { SealedAgesSummary } from "@/components/SealedAgesSummary";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, describedBy } from "@/components/ui/Field";
import { PageShell } from "@/components/ui/PageShell";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/session";
import { getCurrentAge, MAX_TARGET_AGE } from "@/modules/age";
import { buildChairs, MILESTONE_AGES } from "@/modules/letters";

export const dynamic = "force-dynamic";

export const metadata = { title: "Age map" };

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
  const sealedAges = await sealedTargetAges(user.id);
  const pastMilestones = MILESTONE_AGES.filter((age) => age <= currentAge);
  const readyCount = chairs.filter((chair) => chair.state === "unlocked").length;

  return (
    <PageShell
      width="default"
      eyebrow="Age map"
      title={
        <>
          You are {currentAge}.
          {readyCount > 0 ? (
            <>
              {" "}
              <span className="text-accent">
                {readyCount === 1 ? "A letter is ready." : `${readyCount} letters are ready.`}
              </span>
            </>
          ) : null}
        </>
      }
      description="Chairs are ages, not dates. Pick one ahead of you and write to it. Each age seals once; opening waits for that birthday."
      aside={
        <div className="flex flex-col gap-3 md:w-72">
          <SealBalance balance={user.sealBalance} />
          <SealedAgesSummary sealedAges={sealedAges} />
        </div>
      }
    >
      <section aria-labelledby="map-heading" className="flex flex-col gap-10">
        <h2 id="map-heading" className="sr-only">
          Ages
        </h2>
        <AgeMap
          chairs={chairs}
          currentAge={currentAge}
          birthDate={user.birthDate}
          timeZone={user.timezone}
          pastMilestones={pastMilestones}
          canStartNewAge={user.sealBalance >= 1}
        />

        <Card as="section" aria-labelledby="custom-age-heading" className="sm:ml-14">
          <h2 id="custom-age-heading" className="font-serif text-xl text-ink">
            Write to another age
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Milestones are suggestions. Any age between {currentAge + 1} and {MAX_TARGET_AGE}{" "}
            can hold a letter.
          </p>
          <form action={startCustomAge} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field id="targetAge" label="Target age" className="sm:w-40">
              <Input
                id="targetAge"
                name="targetAge"
                type="number"
                inputMode="numeric"
                required
                min={currentAge + 1}
                max={MAX_TARGET_AGE}
                placeholder={String(currentAge + 1)}
                aria-describedby={describedBy("targetAge", false, false)}
              />
            </Field>
            <Button type="submit" variant="secondary" className="h-11">
              Address it
            </Button>
          </form>
        </Card>
      </section>
    </PageShell>
  );
}

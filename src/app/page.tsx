import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon, LockIcon, PenIcon, StampIcon, UnlockIcon } from "@/components/ui/Icons";
import { StateMark } from "@/components/ui/StateBadge";
import { Wordmark } from "@/components/ui/Wordmark";
import { prisma } from "@/lib/prisma";
import { CENSUS_KEYS, CENSUS_LABELS } from "@/modules/census";
import { MILESTONE_AGES } from "@/modules/letters";

export const dynamic = "force-dynamic";

const steps = [
  {
    icon: PenIcon,
    title: "A map of ages",
    body: "Home isn’t a calendar. It’s the ages ahead of you — 30, 40, 50 — each an empty chair you can address a letter to.",
  },
  {
    icon: StampIcon,
    title: "One stamp a year",
    body: "You get exactly one stamp per calendar year. Spend it to seal a letter, or let it expire on December 31. Missing a year is part of the ritual.",
  },
  {
    icon: LockIcon,
    title: "The census",
    body: "Five questions that never change — fear, love, work, home, regret — and one free letter. Sealed means sealed: no peeking, no edits.",
  },
  {
    icon: UnlockIcon,
    title: "Unlock on the birthday",
    body: "A letter to age 40 opens the day you turn 40. Read it beside every earlier census and see what shifted.",
  },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    redirect(user?.birthDate && user.timezone ? "/map" : "/onboarding");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Wordmark />
        <Link
          href="/login"
          className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6">
        {/* Hero */}
        <section className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-rise">
            <p className="eyebrow">A yearly ritual</p>
            <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.02] text-ink sm:text-6xl">
              Write to the age you’ll become. Open it when you get there.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              Age Census is a slow correspondence with yourself. One sealed letter a
              year, addressed to a future age, unlocked on that birthday.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <ButtonLink href="/login" size="lg">
                Begin your census
                <ArrowRightIcon size={18} />
              </ButtonLink>
              <span className="text-sm text-muted">Free · Email sign-in · No feed</span>
            </div>
          </div>

          {/* Age map illustration (decorative, but real content) */}
          <div className="animate-reveal rounded-lg border border-line bg-surface p-6 sm:p-8" aria-hidden>
            <p className="eyebrow">Your map</p>
            <ol className="mt-5 flex flex-col">
              {[
                { age: 27, state: "opened" as const, note: "Opened · read last spring" },
                { age: 30, state: "unlocked" as const, note: "Unlocked · opens today" },
                { age: 35, state: "sealed" as const, note: "Sealed · waiting" },
                { age: 40, state: "empty" as const, note: "Empty" },
                { age: 50, state: "empty" as const, note: "Empty" },
              ].map((chair, index, all) => (
                <li key={chair.age} className="relative flex items-center gap-5 py-3">
                  {index < all.length - 1 ? (
                    <span className="absolute left-[5px] top-9 h-full w-px bg-line" />
                  ) : null}
                  <StateMark state={chair.state} className="relative z-10 size-3 bg-surface" />
                  <span className="font-serif text-3xl tabular text-ink">{chair.age}</span>
                  <span className="text-sm text-muted">{chair.note}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex items-center gap-3 rounded-md border border-dashed border-accent/50 bg-accent-soft/50 px-3 py-2 text-sm">
              <StampIcon size={16} className="text-accent" />
              <span className="font-medium">1 stamp left for {new Date().getFullYear()}</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-title" className="border-t border-line py-16 sm:py-24">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title" className="mt-3 max-w-lg font-serif text-3xl leading-tight sm:text-4xl">
            Four ideas, kept deliberately small.
          </h2>
          <ol className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-accent">
                  <step.icon size={18} />
                </span>
                <div>
                  <p className="eyebrow">Part {index + 1}</p>
                  <h3 className="mt-1 font-serif text-xl text-ink">{step.title}</h3>
                  <p className="mt-2 max-w-prose leading-relaxed text-ink-soft">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Census questions */}
        <section aria-labelledby="census-title" className="border-t border-line py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">The five questions</p>
              <h2 id="census-title" className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">
                The same five, every year.
              </h2>
              <p className="mt-4 max-w-prose leading-relaxed text-ink-soft">
                Comparison only works if the questions hold still. They are versioned
                and never silently change, so the answer you give at 29 lines up with
                the one you give at 39.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {CENSUS_KEYS.map((key, index) => (
                <li
                  key={key}
                  className="flex items-baseline gap-4 rounded-lg border border-line bg-surface px-5 py-4"
                >
                  <span aria-hidden className="font-mono text-xs text-faint">
                    0{index + 1}
                  </span>
                  <span className="font-serif text-2xl text-ink">{CENSUS_LABELS[key]}</span>
                </li>
              ))}
              <li className="flex items-baseline gap-4 rounded-lg border border-dashed border-line-strong px-5 py-4">
                <span aria-hidden className="font-mono text-xs text-faint">
                  +
                </span>
                <span className="font-serif text-2xl text-ink-soft">One free letter</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-line py-16 sm:py-24">
          <div className="flex flex-col items-start gap-8 rounded-lg border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="font-serif text-3xl leading-tight">Milestones are waiting.</h2>
              <p className="mt-2 text-ink-soft">
                {MILESTONE_AGES.join(" · ")} — and any age you choose.
              </p>
            </div>
            <ButtonLink href="/login" size="lg">
              Begin your census
              <ArrowRightIcon size={18} />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-muted sm:px-6">
        Age Census · A yearly rite. Email is a backup, not the product.
      </footer>
    </div>
  );
}

import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.birthDate && user.timezone) {
    redirect("/map");
  }

  const timeZones = Intl.supportedValuesOf("timeZone");

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Who you are in time</h1>
      <p className="text-sm text-neutral-700">
        Birth date sets your age and unlocks. Timezone sets the calendar year for
        the stamp. Birth date locks after the first sealed letter.
      </p>
      <form action={completeOnboarding} className="flex flex-col gap-4">
        <label className="text-sm">
          Birth date
          <input
            required
            type="date"
            name="birthDate"
            className="mt-1 w-full border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Timezone
          <select
            required
            name="timezone"
            defaultValue="UTC"
            className="mt-1 w-full border border-neutral-300 px-3 py-2"
          >
            {timeZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="border border-neutral-800 px-4 py-2 text-sm">
          Enter the map
        </button>
      </form>
    </main>
  );
}

import { updateSettings } from "@/app/actions/onboarding";
import { requireOnboardedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  const timeZones = Intl.supportedValuesOf("timeZone");

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Email is load-bearing. Birth date locks after the first sealed letter.
        </p>
      </div>

      <section className="flex flex-col gap-2 text-sm">
        <h2 className="font-medium">Account</h2>
        <p>Email: {user.email}</p>
        <p className="text-neutral-600">
          Change-email with verification is planned; not in this shell.
        </p>
      </section>

      <form action={updateSettings} className="flex max-w-md flex-col gap-4">
        <label className="text-sm">
          Birth date
          <input
            type="date"
            name="birthDate"
            defaultValue={isoDate(user.birthDate)}
            disabled={user.birthDateLocked}
            className="mt-1 w-full border border-neutral-300 px-3 py-2 disabled:bg-neutral-100"
          />
        </label>
        {user.birthDateLocked ? (
          <p className="text-sm text-neutral-600">
            Locked after the first sealed letter so age cannot be gamed.
          </p>
        ) : null}
        <label className="text-sm">
          Timezone
          <select
            name="timezone"
            defaultValue={user.timezone}
            className="mt-1 w-full border border-neutral-300 px-3 py-2"
          >
            {timeZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="w-fit border border-neutral-800 px-4 py-2 text-sm">
          Save
        </button>
      </form>

      <section className="flex flex-col gap-2 text-sm">
        <h2 className="font-medium">Later</h2>
        <p>Export my data — not wired in this shell.</p>
        <p>Delete account — not wired in this shell.</p>
      </section>
    </main>
  );
}

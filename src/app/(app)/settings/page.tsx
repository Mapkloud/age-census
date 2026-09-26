import { updateSettings } from "@/app/actions/onboarding";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, describedBy } from "@/components/ui/Field";
import { LockIcon } from "@/components/ui/Icons";
import { PageShell } from "@/components/ui/PageShell";
import { requireOnboardedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  const timeZones = Intl.supportedValuesOf("timeZone");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <PageShell
      width="narrow"
      eyebrow="Settings"
      title="Who you are in time."
      description="Very little lives here on purpose. Your email is how we find you; your birth date and timezone are how the map counts."
    >
      <div className="flex flex-col gap-10">
        <section aria-labelledby="account-heading" className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <h2 id="account-heading" className="font-serif text-xl text-ink">
              Account
            </h2>
          </div>
          <Card padding="sm" className="flex flex-col gap-2">
            <dl className="flex flex-col gap-1 text-sm">
              <dt className="text-muted">Email</dt>
              <dd className="font-medium text-ink">{user.email}</dd>
            </dl>
            <p className="text-sm leading-relaxed text-muted">
              Changing email with verification is planned. Until then, this address is
              the one we will use to reach you when a letter unlocks.
            </p>
          </Card>
        </section>

        <section aria-labelledby="time-heading" className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <h2 id="time-heading" className="font-serif text-xl text-ink">
              Time
            </h2>
          </div>
          <Card padding="md">
            <form action={updateSettings} className="flex flex-col gap-6">
              <Field
                id="birthDate"
                label={
                  <span className="inline-flex items-center gap-2">
                    Birth date
                    {user.birthDateLocked ? <LockIcon size={14} className="text-muted" /> : null}
                  </span>
                }
                hint={
                  user.birthDateLocked
                    ? "Locked. Once a letter is sealed the birth date can’t change, so ages and unlock days stay honest."
                    : "Sets your current age and the birthday each letter unlocks on. It locks after your first sealed letter."
                }
              >
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  defaultValue={isoDate(user.birthDate)}
                  disabled={user.birthDateLocked}
                  max={today}
                  aria-describedby={describedBy("birthDate", true, false)}
                />
              </Field>

              <Field
                id="timezone"
                label="Timezone"
                hint="Defines the calendar year for your stamp and the moment your birthday begins."
              >
                <TimezoneSelect
                  id="timezone"
                  name="timezone"
                  timeZones={timeZones}
                  defaultValue={user.timezone}
                  required
                  aria-describedby={describedBy("timezone", true, false)}
                />
              </Field>

              <div>
                <Button type="submit" variant="secondary">
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        </section>

        <section aria-labelledby="later-heading" className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <h2 id="later-heading" className="font-serif text-xl text-ink">
              Later
            </h2>
          </div>
          <Card padding="sm" tone="default" className="border-dashed">
            <ul className="flex flex-col gap-2 text-sm text-muted">
              <li className="flex items-center justify-between gap-4">
                <span>Export my data</span>
                <span className="eyebrow">Planned</span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Delete account</span>
                <span className="eyebrow">Planned</span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Yearly reminder that a stamp is waiting</span>
                <span className="eyebrow">Planned</span>
              </li>
            </ul>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}

import {
  cancelEmailChange,
  requestEmailChange,
} from "@/app/actions/email-change";
import { updateSettings } from "@/app/actions/onboarding";
import { DeleteAccountPanel } from "@/components/DeleteAccountPanel";
import { SealBalance } from "@/components/SealBalance";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, describedBy } from "@/components/ui/Field";
import { LockIcon } from "@/components/ui/Icons";
import { Notice } from "@/components/ui/Notice";
import { PageShell } from "@/components/ui/PageShell";
import { requireOnboardedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  emailChangeFeedbackMessage,
  isEmailChangeExpired,
} from "@/modules/email-change";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; reason?: string; delete?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { email: emailStatus, reason, delete: deleteStatus } = await searchParams;
  const feedback = emailChangeFeedbackMessage(emailStatus, reason);

  const pending = await prisma.emailChangeRequest.findUnique({
    where: { userId: user.id },
  });
  const pendingActive =
    pending && !isEmailChangeExpired(pending.expires) ? pending : null;

  if (pending && !pendingActive) {
    await prisma.emailChangeRequest.delete({ where: { id: pending.id } }).catch(() => {});
  }

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
        {feedback ? (
          <Notice tone={feedback.tone} title={feedback.title}>
            {feedback.body}
          </Notice>
        ) : null}

        <section aria-labelledby="account-heading" className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <h2 id="account-heading" className="font-serif text-xl text-ink">
              Account
            </h2>
          </div>
          <Card padding="md" className="flex flex-col gap-6">
            <dl className="flex flex-col gap-1 text-sm">
              <dt className="text-muted">Current email</dt>
              <dd className="font-medium text-ink">{user.email}</dd>
            </dl>

            {pendingActive ? (
              <div className="flex flex-col gap-4">
                <Notice tone="warning" title="Verification pending">
                  We sent a link to{" "}
                  <span className="font-medium text-ink">{pendingActive.newEmail}</span>.
                  Your current address stays primary until you confirm. In
                  development, the link is printed in the server console.
                </Notice>
                <form action={cancelEmailChange}>
                  <Button type="submit" variant="secondary" size="sm">
                    Cancel change
                  </Button>
                </form>
              </div>
            ) : (
              <form action={requestEmailChange} className="flex flex-col gap-5">
                <Field
                  id="newEmail"
                  label="Change email"
                  hint="We verify the new address before it becomes primary. The old one keeps working until then — important for letters that unlock years from now."
                >
                  <Input
                    id="newEmail"
                    name="newEmail"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    placeholder="new@example.com"
                    aria-describedby={describedBy("newEmail", true, false)}
                  />
                </Field>
                <div>
                  <Button type="submit" variant="secondary">
                    Send verification
                  </Button>
                </div>
              </form>
            )}
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
                hint="Defines the moment your birthday begins and when each letter unlocks."
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

        <section aria-labelledby="seals-heading" className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <h2 id="seals-heading" className="font-serif text-xl text-ink">
              Seals
            </h2>
          </div>
          <SealBalance balance={user.sealBalance} />
        </section>

        <section aria-labelledby="danger-heading" className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <h2 id="danger-heading" className="font-serif text-xl text-ink">
              Leave
            </h2>
          </div>
          <DeleteAccountPanel
            email={user.email}
            needsConfirmHint={deleteStatus === "confirm"}
          />
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
                <span>Reminder about unsealed drafts</span>
                <span className="eyebrow">Planned</span>
              </li>
            </ul>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}

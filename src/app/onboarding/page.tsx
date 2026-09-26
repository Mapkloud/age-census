import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { AuthShell } from "@/components/ui/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input, describedBy } from "@/components/ui/Field";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = { title: "Who you are in time" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.birthDate && user.timezone) {
    redirect("/map");
  }

  const timeZones = Intl.supportedValuesOf("timeZone");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AuthShell
      eyebrow="Before the map"
      title="Who you are in time."
      description="Two facts make the whole ritual work. We ask for them once."
    >
      <form action={completeOnboarding} className="flex flex-col gap-6">
        <Field
          id="birthDate"
          label="Birth date"
          hint="Sets your current age and the exact birthday each letter unlocks on. It locks after your first sealed letter so age can’t be gamed."
        >
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            required
            max={today}
            autoComplete="bday"
            aria-describedby={describedBy("birthDate", true, false)}
          />
        </Field>

        <Field
          id="timezone"
          label="Timezone"
          hint="Defines your calendar year for the stamp and the moment your birthday begins. You can change this later."
        >
          <TimezoneSelect
            id="timezone"
            name="timezone"
            timeZones={timeZones}
            detect
            required
            aria-describedby={describedBy("timezone", true, false)}
          />
        </Field>

        <Button type="submit" size="lg" className="mt-2 w-full sm:w-auto">
          Enter the map
          <ArrowRightIcon size={18} />
        </Button>
      </form>
    </AuthShell>
  );
}

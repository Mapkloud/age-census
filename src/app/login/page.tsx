import { redirect } from "next/navigation";
import { requestMagicLink } from "@/app/actions/auth";
import { auth } from "@/auth";
import { AuthShell } from "@/components/ui/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input, describedBy } from "@/components/ui/Field";
import { MailIcon } from "@/components/ui/Icons";
import { Notice } from "@/components/ui/Notice";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

/** Auth.js redirects back here with ?error=… when a link fails. */
const errorCopy: Record<string, string> = {
  Verification:
    "That link has expired or was already used. Request a new one below.",
  AccessDenied: "You don’t have access with that address.",
  Configuration: "Sign-in isn’t configured correctly. Please try again later.",
  Default: "Something went wrong while signing in. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    redirect(user?.birthDate && user.timezone ? "/map" : "/onboarding");
  }

  const { error } = await searchParams;
  const errorMessage = error ? errorCopy[error] ?? errorCopy.Default : null;

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Where should we find you?"
      description="No password. We send a one-time link to your email, and that address is how we reach you in ten or twenty years."
      footer={
        <p>
          In development, the link is printed in the server console instead of being
          emailed.
        </p>
      }
    >
      {errorMessage ? (
        <Notice tone="error" className="mb-6">
          {errorMessage}
        </Notice>
      ) : null}
      <form action={requestMagicLink} className="flex flex-col gap-5">
        <Field
          id="email"
          label="Email"
          hint="Use an address you expect to keep for a long time."
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
            aria-describedby={describedBy("email", true, false)}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <MailIcon size={18} />
          Send me a link
        </Button>
      </form>
    </AuthShell>
  );
}

import { confirmEmailChangeAction } from "@/app/actions/email-change";
import { AuthShell } from "@/components/ui/AuthShell";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MailIcon } from "@/components/ui/Icons";
import { Notice } from "@/components/ui/Notice";
import { prisma } from "@/lib/prisma";
import {
  hashEmailChangeToken,
  isEmailChangeExpired,
} from "@/modules/email-change";

export const dynamic = "force-dynamic";

export const metadata = { title: "Verify email change" };

const errorCopy: Record<string, { title: string; body: string }> = {
  missing: {
    title: "Missing link",
    body: "Open the verification link from the email we sent to your new address.",
  },
  invalid: {
    title: "Link not recognized",
    body: "This verification link is invalid or was already used. Request a new change from Settings.",
  },
  expired: {
    title: "Link expired",
    body: "Verification links expire after an hour. Start again from Settings.",
  },
  taken: {
    title: "Address taken",
    body: "That email is already registered to another account. Choose a different address.",
  },
  wrong_user: {
    title: "Wrong account",
    body: "You’re signed in as someone else. Sign out, then open the link again — or sign in as the account that requested the change.",
  },
};

export default async function VerifyEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (error) {
    const copy = errorCopy[error] ?? {
      title: "Couldn’t verify",
      body: "Something went wrong confirming the new address. Try again from Settings.",
    };
    return (
      <AuthShell eyebrow="Email change" title={copy.title} description={copy.body}>
        <ButtonLink href="/settings" variant="secondary">
          Back to settings
        </ButtonLink>
      </AuthShell>
    );
  }

  if (!token) {
    const copy = errorCopy.missing;
    return (
      <AuthShell eyebrow="Email change" title={copy.title} description={copy.body}>
        <ButtonLink href="/settings" variant="secondary">
          Back to settings
        </ButtonLink>
      </AuthShell>
    );
  }

  const request = await prisma.emailChangeRequest.findUnique({
    where: { token: hashEmailChangeToken(token) },
  });

  if (!request || isEmailChangeExpired(request.expires)) {
    const copy = !request ? errorCopy.invalid : errorCopy.expired;
    return (
      <AuthShell eyebrow="Email change" title={copy.title} description={copy.body}>
        <ButtonLink href="/settings" variant="secondary">
          Back to settings
        </ButtonLink>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Email change"
      title="Confirm this address?"
      description="We’ll make this your primary email only after you confirm. Until then, sign-in and unlock mail still go to your current address."
      footer={
        <p>
          In development, this page is reached from the verification URL printed in
          the server console.
        </p>
      }
    >
      <Card className="flex flex-col gap-5" padding="sm">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-accent">
            <MailIcon size={18} />
          </span>
          <div className="min-w-0 text-sm leading-relaxed">
            <p className="text-muted">New email</p>
            <p className="mt-0.5 break-all font-medium text-ink">{request.newEmail}</p>
          </div>
        </div>
        <Notice tone="warning">
          Confirming replaces your current registered email. Use an address you
          expect to keep for years.
        </Notice>
        <form action={confirmEmailChangeAction}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            <MailIcon size={18} />
            Confirm new email
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}

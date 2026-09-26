import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Card } from "@/components/ui/Card";
import { MailIcon } from "@/components/ui/Icons";

export const metadata = { title: "Check your email" };

export default function VerifyRequestPage() {
  return (
    <AuthShell
      eyebrow="One more step"
      title="Your link is on its way."
      description="Open the sign-in link we just sent. It works once and expires after a short while."
      footer={
        <p>
          Wrong address?{" "}
          <Link href="/login" className="text-ink underline underline-offset-4 hover:text-accent">
            Start over
          </Link>
          .
        </p>
      }
    >
      <Card className="flex items-start gap-4" padding="sm">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-accent">
          <MailIcon size={18} />
        </span>
        <div className="text-sm leading-relaxed text-ink-soft">
          <p className="font-medium text-ink">Running locally?</p>
          <p className="mt-1">
            In development no email is sent. The magic link is printed in the terminal
            running <code className="font-mono text-xs">next dev</code>. Paste it into
            this browser to finish signing in.
          </p>
        </div>
      </Card>
    </AuthShell>
  );
}

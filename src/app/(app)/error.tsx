"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageShell } from "@/components/ui/PageShell";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageShell
      width="narrow"
      eyebrow="Something went wrong"
      title="That didn’t go through."
      description="Nothing was sealed or spent. The rules of the map are strict on purpose — check the message and try again."
    >
      <Notice tone="error">
        {error.message || "An unexpected error occurred."}
        {error.digest ? (
          <span className="mt-1 block font-mono text-xs text-muted">Ref {error.digest}</span>
        ) : null}
      </Notice>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/map" variant="secondary">
          Back to the map
        </ButtonLink>
      </div>
    </PageShell>
  );
}

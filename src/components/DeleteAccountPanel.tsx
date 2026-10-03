"use client";

import { useState } from "react";
import { deleteAccount } from "@/app/actions/account";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, describedBy } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";

type DeleteAccountPanelProps = {
  email: string;
  needsConfirmHint?: boolean;
};

export function DeleteAccountPanel({
  email,
  needsConfirmHint = false,
}: DeleteAccountPanelProps) {
  const [confirmation, setConfirmation] = useState("");
  const matches = confirmation.trim().toLowerCase() === email.toLowerCase();

  return (
    <Card padding="md" className="flex flex-col gap-6 border-accent/30">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-xl text-ink">Delete account</h2>
        <p className="text-sm text-muted">
          This permanently removes your account, letters, and census answers.
          There is no undo. For now, export is only offered here — download your
          letters first if you want to keep them.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-line bg-surface/60 p-4">
        <p className="text-sm font-medium text-ink">1. Export your letters</p>
        <p className="text-sm text-muted">
          JSON of each letter’s body, census answers, target age, status, when
          you wrote it, your age then, and when it unlocks.
        </p>
        <div>
          <a
            href="/api/account/export"
            className={buttonClasses("secondary", "sm")}
            download
          >
            Download letters JSON
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-ink">2. Confirm deletion</p>
        {needsConfirmHint ? (
          <Notice tone="warning" title="Confirmation didn’t match">
            Type your current email exactly to delete the account.
          </Notice>
        ) : null}
        <form action={deleteAccount} className="flex flex-col gap-5">
          <Field
            id="confirmation"
            label="Type your email to confirm"
            hint={`Enter ${email}`}
          >
            <Input
              id="confirmation"
              name="confirmation"
              type="email"
              autoComplete="off"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              aria-describedby={describedBy("confirmation", true, false)}
            />
          </Field>
          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={!matches}
              className="bg-ink hover:bg-ink-soft disabled:hover:bg-ink"
            >
              Delete my account forever
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { SealIcon } from "@/components/ui/Icons";

type SealConfirmProps = {
  targetAge: number;
  unlockDate: string;
  requiredFields: Array<{ name: string; label: string }>;
  sealAction: (formData: FormData) => void | Promise<void>;
};

/**
 * Two-step seal. The trigger validates the surrounding form locally, then a
 * native <dialog> restates the consequences before the real submit button
 * (which carries the server action via formAction) is offered.
 */
export function SealConfirm({
  targetAge,
  unlockDate,
  requiredFields,
  sealAction,
}: SealConfirmProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const { pending } = useFormStatus();

  function openDialog() {
    const form = triggerRef.current?.form;
    if (!form) return;
    const data = new FormData(form);
    const empty = requiredFields
      .filter(({ name }) => !String(data.get(name) ?? "").trim())
      .map(({ label }) => label);
    setMissing(empty);
    if (empty.length > 0) {
      const first = requiredFields.find((field) => !String(data.get(field.name) ?? "").trim());
      const control = first ? form.elements.namedItem(first.name) : null;
      if (control instanceof HTMLElement) control.focus();
      return;
    }
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button
        ref={triggerRef}
        type="button"
        variant="primary"
        className="w-full sm:w-auto"
        onClick={openDialog}
      >
        <SealIcon size={16} />
        Seal this letter
      </Button>
      {missing.length > 0 ? (
        <p role="alert" className="text-sm text-accent sm:max-w-sm sm:text-right">
          Before sealing, answer: {missing.join(", ")}.
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby="seal-dialog-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line bg-raised p-0 text-ink shadow-none backdrop:bg-black/55 backdrop:backdrop-blur-[2px] open:animate-rise"
      >
        <div className="p-6 sm:p-7">
          <p className="eyebrow">Irreversible</p>
          <h2 id="seal-dialog-title" className="mt-2 font-serif text-2xl leading-tight">
            Seal your letter to age {targetAge}?
          </h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm leading-relaxed text-ink-soft">
            {[
              "It cannot be edited, read, or deleted once sealed.",
              `It stays closed until your birthday on ${unlockDate}.`,
              `Age ${targetAge} can only be sealed once — you can still seal other ages this year.`,
              "This spends 1 seal from your balance.",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
          <Button type="button" variant="ghost" onClick={closeDialog}>
            Not yet
          </Button>
          {/* Lives inside the letter form, so submit carries all fields. */}
          <Button
            type="submit"
            formAction={sealAction}
            variant="primary"
            disabled={pending}
            aria-busy={pending}
          >
            <SealIcon size={16} />
            {pending ? "Sealing…" : "Seal it"}
          </Button>
        </div>
      </dialog>
    </div>
  );
}

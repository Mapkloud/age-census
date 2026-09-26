import type { ReactNode } from "react";
import { Wordmark } from "@/components/ui/Wordmark";

type AuthShellProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Centered, single-column frame for login / verify / onboarding.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center px-4 py-5 sm:px-6">
        <Wordmark />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="animate-rise">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          <h1 className="font-serif text-4xl leading-[1.05] text-ink">{title}</h1>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-ink-soft">{description}</p>
          ) : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-8 text-sm text-muted">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

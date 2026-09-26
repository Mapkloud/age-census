import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type PageShellProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  width?: "narrow" | "default" | "wide";
  className?: string;
};

const widths = {
  narrow: "max-w-2xl",
  default: "max-w-3xl",
  wide: "max-w-5xl",
};

/**
 * Standard page frame for signed-in screens: eyebrow, serif title, optional
 * description and an aside slot (e.g. stamp status) that sits beside the title
 * on wide screens.
 */
export function PageShell({
  eyebrow,
  title,
  description,
  aside,
  children,
  width = "default",
  className,
}: PageShellProps) {
  return (
    <main className={cx("mx-auto w-full px-4 pb-24 pt-10 sm:px-6 sm:pt-14", widths[width], className)}>
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          <h1 className="font-serif text-4xl font-normal leading-[1.05] text-ink sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-soft">
              {description}
            </p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </header>
      <div className="mt-10 sm:mt-14">{children}</div>
    </main>
  );
}

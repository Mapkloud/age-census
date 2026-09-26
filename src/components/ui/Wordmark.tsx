import Link from "next/link";
import { cx } from "@/lib/cx";

export function Wordmark({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center gap-2 font-serif text-lg text-ink hover:text-accent",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block size-2.5 rounded-full bg-accent ring-4 ring-accent/15"
      />
      Age Census
    </Link>
  );
}

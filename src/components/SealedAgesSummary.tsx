import { SealIcon } from "@/components/ui/Icons";
import { cx } from "@/lib/cx";

type SealedAgesSummaryProps = {
  sealedAges: number[];
  variant?: "card" | "inline";
  className?: string;
};

/**
 * Summary of which future ages already have a sealed letter (one per age, unlimited per year).
 */
export function SealedAgesSummary({
  sealedAges,
  variant = "card",
  className,
}: SealedAgesSummaryProps) {
  const headline =
    sealedAges.length === 0
      ? "No sealed letters yet"
      : sealedAges.length === 1
        ? `1 age sealed · ${sealedAges[0]}`
        : `${sealedAges.length} ages sealed · ${sealedAges.join(", ")}`;
  const detail =
    "Each future age can only be sealed once. You can seal many ages in the same year.";

  if (variant === "inline") {
    return (
      <p
        className={cx("inline-flex items-center gap-2 text-sm", className)}
        aria-live="polite"
      >
        <SealIcon size={16} className="text-accent" />
        <span className="font-medium text-ink">{headline}</span>
        <span className="text-muted">· {detail}</span>
      </p>
    );
  }

  return (
    <div
      aria-live="polite"
      className={cx(
        "flex items-center gap-4 rounded-lg border border-dashed border-accent/50 bg-accent-soft/50 px-4 py-3",
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-raised text-accent">
        <SealIcon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{headline}</p>
        <p className="text-xs leading-relaxed text-muted">{detail}</p>
      </div>
    </div>
  );
}

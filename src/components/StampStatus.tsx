import { StampIcon } from "@/components/ui/Icons";
import { cx } from "@/lib/cx";
import { formatYearEnd } from "@/lib/format";

type StampStatusProps = {
  year: number;
  spent: boolean;
  variant?: "card" | "inline";
  className?: string;
};

/**
 * The single most important status in the product: is this year's stamp still
 * available? Rendered as a small "postage" card on the map and inline in the
 * composer.
 */
export function StampStatus({ year, spent, variant = "card", className }: StampStatusProps) {
  const headline = spent ? `Stamp used for ${year}` : `1 stamp left for ${year}`;
  const detail = spent
    ? `Your next stamp arrives Jan 1, ${year + 1}.`
    : `Expires ${formatYearEnd(year)}. Sealing spends it.`;

  if (variant === "inline") {
    return (
      <p
        className={cx("inline-flex items-center gap-2 text-sm", className)}
        aria-live="polite"
      >
        <StampIcon size={16} className={spent ? "text-muted" : "text-accent"} />
        <span className={cx("font-medium", spent ? "text-muted" : "text-ink")}>{headline}</span>
        <span className="text-muted">· {detail}</span>
      </p>
    );
  }

  return (
    <div
      aria-live="polite"
      className={cx(
        "flex items-center gap-4 rounded-lg border border-dashed px-4 py-3",
        spent ? "border-line-strong bg-surface" : "border-accent/50 bg-accent-soft/50",
        className,
      )}
    >
      <span
        className={cx(
          "flex size-11 shrink-0 items-center justify-center rounded-md border",
          spent
            ? "border-line-strong bg-raised text-muted"
            : "border-accent/40 bg-raised text-accent",
        )}
      >
        <StampIcon size={22} />
      </span>
      <div className="min-w-0">
        <p className={cx("text-sm font-semibold", spent ? "text-ink-soft" : "text-ink")}>
          {headline}
        </p>
        <p className="text-xs leading-relaxed text-muted">{detail}</p>
      </div>
    </div>
  );
}

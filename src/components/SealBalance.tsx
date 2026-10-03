import { ButtonLink } from "@/components/ui/Button";
import { SealIcon } from "@/components/ui/Icons";
import { cx } from "@/lib/cx";
import { formatSealBalance, normalizeSealBalance } from "@/modules/seals";

type SealBalanceProps = {
  balance?: number;
  variant?: "card" | "inline";
  className?: string;
};

export function SealBalance({
  balance,
  variant = "card",
  className,
}: SealBalanceProps) {
  const count = normalizeSealBalance(balance);
  const empty = count < 1;
  const headline = formatSealBalance(count);
  const detail = empty
    ? "Buy a pack to address a new age or seal a letter."
    : "A seal is spent when you seal a letter — not when you save a draft.";

  if (variant === "inline") {
    return (
      <p className={cx("inline-flex flex-wrap items-center gap-2 text-sm", className)}>
        <SealIcon size={16} className="text-accent" />
        <span className="font-medium text-ink">{headline}</span>
        <span className="text-muted">· {detail}</span>
      </p>
    );
  }

  return (
    <div
      className={cx(
        "flex items-center gap-4 rounded-lg border px-4 py-3",
        empty
          ? "border-accent/50 bg-accent-soft/50"
          : "border-dashed border-accent/50 bg-accent-soft/50",
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-raised text-accent">
        <SealIcon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{headline}</p>
        <p className="text-xs leading-relaxed text-muted">{detail}</p>
      </div>
      <ButtonLink href="/seals" variant={empty ? "primary" : "secondary"} size="sm">
        {empty ? "Buy seals" : "Buy more"}
      </ButtonLink>
    </div>
  );
}

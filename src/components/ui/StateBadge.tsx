import type { ChairState } from "@/modules/letters";
import { cx } from "@/lib/cx";

export const CHAIR_STATE_LABEL: Record<ChairState, string> = {
  empty: "Empty",
  draft: "Draft",
  sealed: "Sealed",
  unlocked: "Unlocked",
  opened: "Opened",
};

export const CHAIR_STATE_CAPTION: Record<ChairState, string> = {
  empty: "No letter yet",
  draft: "Unsealed draft",
  sealed: "Waiting for the birthday",
  unlocked: "Ready to open",
  opened: "Read",
};

/** Small mark that encodes chair state by shape and fill, not just colour. */
export function StateMark({
  state,
  className,
}: {
  state: ChairState;
  className?: string;
}) {
  const box = cx("inline-block size-2.5 shrink-0 rounded-full", className);
  switch (state) {
    case "empty":
      return <span aria-hidden className={cx(box, "border border-dashed border-faint")} />;
    case "draft":
      return <span aria-hidden className={cx(box, "border-2 border-ink-soft")} />;
    case "sealed":
      return <span aria-hidden className={cx(box, "bg-ink-soft")} />;
    case "unlocked":
      return (
        <span aria-hidden className={cx(box, "bg-accent ring-4 ring-accent/20")} />
      );
    case "opened":
      return <span aria-hidden className={cx(box, "border-2 border-accent bg-accent-soft")} />;
  }
}

export function StateBadge({
  state,
  className,
}: {
  state: ChairState;
  className?: string;
}) {
  const tone =
    state === "unlocked"
      ? "border-accent/40 bg-accent-soft text-accent"
      : state === "opened"
        ? "border-line-strong bg-surface text-ink-soft"
        : state === "sealed"
          ? "border-line-strong bg-surface text-ink-soft"
          : "border-line bg-transparent text-muted";
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-medium",
        tone,
        className,
      )}
    >
      <StateMark state={state} className="size-2" />
      {CHAIR_STATE_LABEL[state]}
    </span>
  );
}

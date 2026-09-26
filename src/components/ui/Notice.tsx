import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type NoticeProps = {
  tone?: "info" | "warning" | "error";
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
};

const tones = {
  info: "border-line bg-surface text-ink-soft",
  warning: "border-line-strong bg-surface text-ink",
  error: "border-accent/40 bg-accent-soft/60 text-ink",
};

export function Notice({ tone = "info", title, children, className, icon }: NoticeProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex gap-3 rounded-md border px-4 py-3 text-sm leading-relaxed",
        tones[tone],
        className,
      )}
    >
      {icon ? <span className="mt-0.5 shrink-0 text-muted">{icon}</span> : null}
      <div>
        {title ? <p className="font-medium text-ink">{title}</p> : null}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}

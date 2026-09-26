import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  tone?: "default" | "raised" | "accent";
};

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

const tones = {
  default: "border-line bg-surface",
  raised: "border-line bg-raised",
  accent: "border-accent/30 bg-accent-soft/60",
};

export function Card({
  as: Tag = "div",
  children,
  className,
  padding = "md",
  tone = "default",
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cx("rounded-lg border", tones[tone], paddings[padding], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cx } from "@/lib/cx";

export const controlClasses =
  "w-full rounded-md border border-line-strong bg-raised px-3 text-ink placeholder:text-faint transition-colors hover:border-ink-soft/60 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  optional?: boolean;
};

/**
 * Label + control + helper/error text. Pass the control as a child and give it
 * the same `id`; hint and error ids are wired for `aria-describedby`.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
  optional,
}: FieldProps) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal text-muted">Optional</span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, hasHint: boolean, hasError: boolean) {
  const ids = [hasHint && `${id}-hint`, hasError && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlClasses, "h-11 text-base sm:text-sm", className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(controlClasses, "h-11 text-base sm:text-sm", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(controlClasses, "min-h-24 resize-y py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

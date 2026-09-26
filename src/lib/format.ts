/** Presentation-only date helpers. Domain math lives in src/modules. */

export function formatDate(
  date: Date,
  timeZone: string,
  style: "long" | "medium" = "long",
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: style === "long" ? "long" : "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** "Dec 31, 2026" for the last day of a calendar year (no timezone shift). */
export function formatYearEnd(year: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(year, 11, 31)));
}

export function pluralize(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function yearsAway(currentAge: number, targetAge: number): string {
  const diff = targetAge - currentAge;
  if (diff <= 0) return "now";
  return `in ${pluralize(diff, "year")}`;
}

export function timeAgo(date: Date, now = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${pluralize(minutes, "minute")} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${pluralize(hours, "hour")} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${pluralize(days, "day")} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${pluralize(months, "month")} ago`;
  return `${pluralize(Math.round(months / 12), "year")} ago`;
}

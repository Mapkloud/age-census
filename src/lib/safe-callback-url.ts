/** Only allow same-origin relative paths (no protocol-relative or absolute URLs). */
export function safeCallbackUrl(
  raw: FormDataEntryValue | string | null | undefined,
  fallback = "/map",
): string {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  return value;
}

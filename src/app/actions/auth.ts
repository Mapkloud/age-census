"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

/** Max magic-link sends per email (and per IP when available) per window. */
const MAGIC_LINK_MAX = 5;
const MAGIC_LINK_WINDOW_MS = 15 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || null;
}

/**
 * In-memory rate limit for magic-link requests.
 * Multi-instance / serverless: replace with Redis (or similar) — see src/lib/rate-limit.ts.
 */
export async function requestMagicLink(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) {
    throw new Error("Email is required");
  }

  const redirectTo = safeCallbackUrl(formData.get("callbackUrl"), "/map");
  const limitOpts = { max: MAGIC_LINK_MAX, windowMs: MAGIC_LINK_WINDOW_MS };

  const emailLimit = consumeRateLimit(`magic-link:email:${email}`, limitOpts);
  if (!emailLimit.allowed) {
    redirect("/login?error=RateLimited");
  }

  const ip = await clientIp();
  if (ip) {
    const ipLimit = consumeRateLimit(`magic-link:ip:${ip}`, limitOpts);
    if (!ipLimit.allowed) {
      redirect("/login?error=RateLimited");
    }
  }

  await signIn("resend", { email, redirectTo });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

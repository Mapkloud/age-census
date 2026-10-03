"use server";

import { signIn, signOut } from "@/auth";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    throw new Error("Email is required");
  }
  const redirectTo = safeCallbackUrl(formData.get("callbackUrl"), "/map");
  await signIn("resend", { email, redirectTo });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

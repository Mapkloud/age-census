"use server";

import { signIn, signOut } from "@/auth";

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    throw new Error("Email is required");
  }
  await signIn("resend", { email, redirectTo: "/map" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

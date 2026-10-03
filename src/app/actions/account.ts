"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/session";
import { normalizeEmail } from "@/modules/email-change";

export async function deleteAccount(formData: FormData) {
  const user = await requireOnboardedUser();
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  const expected = normalizeEmail(user.email);

  if (normalizeEmail(confirmation) !== expected) {
    redirect("/settings?delete=confirm");
  }

  const email = user.email;

  await prisma.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({ where: { identifier: email } });
    await tx.user.delete({ where: { id: user.id } });
  });

  await signOut({ redirectTo: "/?deleted=1" });
}

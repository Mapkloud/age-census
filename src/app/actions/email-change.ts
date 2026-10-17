"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sendEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  EMAIL_AUTH_PROVIDERS,
  emailChangeExpiresAt,
  generateEmailChangeToken,
  hashEmailChangeToken,
  isEmailChangeExpired,
  validateNewEmail,
} from "@/modules/email-change";
import { composeEmailChangeVerification } from "@/modules/email-change/email-change-email";

function appOrigin(): string {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function settingsRedirect(query: string): never {
  redirect(`/settings?${query}`);
}

export async function requestEmailChange(formData: FormData) {
  const user = await requireUser();
  const rawNew = String(formData.get("newEmail") ?? "");

  const existing = await prisma.user.findFirst({
    where: {
      email: { equals: rawNew.trim().toLowerCase(), mode: "insensitive" },
      NOT: { id: user.id },
    },
    select: { id: true },
  });

  const validated = validateNewEmail({
    currentEmail: user.email,
    newEmail: rawNew,
    takenByOtherUser: Boolean(existing),
  });

  if (!validated.ok) {
    settingsRedirect(`email=error&reason=${validated.error}`);
  }

  const { raw, hash } = generateEmailChangeToken();
  const expires = emailChangeExpiresAt();

  await prisma.emailChangeRequest.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      newEmail: validated.email,
      token: hash,
      expires,
    },
    update: {
      newEmail: validated.email,
      token: hash,
      expires,
      createdAt: new Date(),
    },
  });

  const url = `${appOrigin()}/verify-email?token=${encodeURIComponent(raw)}`;
  const content = composeEmailChangeVerification({
    newEmail: validated.email,
    url,
  });
  const delivery = await sendEmail({
    to: content.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
  if (!delivery.ok) {
    throw new Error(delivery.error);
  }

  revalidatePath("/settings");
  settingsRedirect("email=sent");
}

export async function cancelEmailChange() {
  const user = await requireUser();
  await prisma.emailChangeRequest.deleteMany({ where: { userId: user.id } });
  revalidatePath("/settings");
  settingsRedirect("email=cancelled");
}

export type ConfirmEmailChangeResult =
  | { ok: true; email: string }
  | {
      ok: false;
      error: "missing" | "invalid" | "expired" | "taken" | "wrong_user";
    };

/**
 * Applies a pending email change after the user confirms from the
 * verification page. Token alone proves inbox ownership; if a session
 * exists it must belong to the requesting user.
 */
export async function confirmEmailChange(
  rawToken: string,
): Promise<ConfirmEmailChangeResult> {
  const token = String(rawToken ?? "").trim();
  if (!token) {
    return { ok: false, error: "missing" };
  }

  const hash = hashEmailChangeToken(token);
  const request = await prisma.emailChangeRequest.findUnique({
    where: { token: hash },
  });

  if (!request) {
    return { ok: false, error: "invalid" };
  }
  if (isEmailChangeExpired(request.expires)) {
    await prisma.emailChangeRequest.delete({ where: { id: request.id } }).catch(() => {});
    return { ok: false, error: "expired" };
  }

  const session = await auth();
  if (session?.user?.id && session.user.id !== request.userId) {
    return { ok: false, error: "wrong_user" };
  }

  const conflict = await prisma.user.findFirst({
    where: {
      email: { equals: request.newEmail, mode: "insensitive" },
      NOT: { id: request.userId },
    },
    select: { id: true },
  });
  if (conflict) {
    await prisma.emailChangeRequest.delete({ where: { id: request.id } });
    return { ok: false, error: "taken" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: request.userId },
      data: {
        email: request.newEmail,
        emailVerified: new Date(),
      },
    });

    await tx.account.updateMany({
      where: {
        userId: request.userId,
        provider: { in: [...EMAIL_AUTH_PROVIDERS] },
      },
      data: { providerAccountId: request.newEmail },
    });

    await tx.emailChangeRequest.delete({ where: { id: request.id } });
  });

  revalidatePath("/settings");
  return { ok: true, email: request.newEmail };
}

export async function confirmEmailChangeAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const result = await confirmEmailChange(token);

  if (result.ok) {
    redirect("/settings?email=verified");
  }

  const q = new URLSearchParams({ error: result.error });
  if (token) q.set("token", token);
  redirect(`/verify-email?${q.toString()}`);
}

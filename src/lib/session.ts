import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

function redirectToLogin(callbackUrl?: string): never {
  const callback = safeCallbackUrl(callbackUrl, "/map");
  if (callback === "/map") {
    redirect("/login");
  }
  redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
}

export async function requireUser(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirectToLogin(callbackUrl);
  }
  const user = await prisma.user.findUnique({ where: { id: session!.user!.id! } });
  if (!user) {
    redirectToLogin(callbackUrl);
  }
  return user!;
}

export async function requireOnboardedUser(callbackUrl?: string) {
  const user = await requireUser(callbackUrl);
  if (!user.birthDate || !user.timezone) {
    redirect("/onboarding");
  }
  return user as typeof user & { birthDate: Date; timezone: string };
}

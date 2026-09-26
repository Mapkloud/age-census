"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getCurrentAge } from "@/modules/age";
import { isValidTimeZone } from "@/modules/time";

function parseBirthDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Birth date is required");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Birth date is invalid");
  }
  return date;
}

export async function completeOnboarding(formData: FormData) {
  const user = await requireUser();
  const birthDate = parseBirthDate(String(formData.get("birthDate") ?? ""));
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (!isValidTimeZone(timezone)) {
    throw new Error("Timezone is required");
  }

  const age = getCurrentAge(birthDate, timezone, new Date());
  if (age < 0 || age > 120) {
    throw new Error("Birth date is out of range");
  }

  if (user.birthDateLocked && user.birthDate) {
    await prisma.user.update({
      where: { id: user.id },
      data: { timezone },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { birthDate, timezone },
    });
  }

  revalidatePath("/map");
  redirect("/map");
}

export async function updateSettings(formData: FormData) {
  const user = await requireUser();
  const timezone = String(formData.get("timezone") ?? "").trim();
  if (!isValidTimeZone(timezone)) {
    throw new Error("Timezone is required");
  }

  const data: { timezone: string; birthDate?: Date } = { timezone };
  if (!user.birthDateLocked) {
    data.birthDate = parseBirthDate(String(formData.get("birthDate") ?? ""));
  }

  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/settings");
  revalidatePath("/map");
}

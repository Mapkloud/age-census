"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOnboardedUser } from "@/lib/session";
import { getCurrentAge, isLetterUnlocked } from "@/modules/age";
import {
  assertCompleteCensus,
  CENSUS_KEYS,
  CENSUS_VERSION,
  parseCensusAnswers,
} from "@/modules/census";
import { assertCanSealDraft, assertCanWriteToAge } from "@/modules/letters";
import { assertCanSealWithStamp, canSpendStamp } from "@/modules/stamps";
import { calendarYear } from "@/modules/time";

async function ensureQuestionSet() {
  return prisma.questionSet.upsert({
    where: { version: CENSUS_VERSION },
    update: { keys: [...CENSUS_KEYS] },
    create: { version: CENSUS_VERSION, keys: [...CENSUS_KEYS] },
  });
}

async function ensureYearStamp(userId: string, year: number) {
  return prisma.stamp.upsert({
    where: { userId_year: { userId, year } },
    update: {},
    create: { userId, year },
  });
}

function formAnswers(formData: FormData) {
  return parseCensusAnswers({
    fear: String(formData.get("fear") ?? ""),
    love: String(formData.get("love") ?? ""),
    work: String(formData.get("work") ?? ""),
    home: String(formData.get("home") ?? ""),
    regret: String(formData.get("regret") ?? ""),
  });
}

export async function saveDraft(formData: FormData) {
  const user = await requireOnboardedUser();
  const now = new Date();
  const targetAge = Number(formData.get("targetAge"));
  const body = String(formData.get("body") ?? "");
  const answers = formAnswers(formData);
  const currentAge = getCurrentAge(user.birthDate, user.timezone, now);
  assertCanWriteToAge(currentAge, targetAge);

  const existing = await prisma.letter.findUnique({
    where: { userId_targetAge: { userId: user.id, targetAge } },
  });
  if (existing && existing.status !== "DRAFT") {
    throw new Error("Seal is irreversible");
  }

  const questionSet = await ensureQuestionSet();
  const letter = await prisma.letter.upsert({
    where: { userId_targetAge: { userId: user.id, targetAge } },
    update: { body, questionSetId: questionSet.id },
    create: {
      userId: user.id,
      targetAge,
      body,
      questionSetId: questionSet.id,
    },
  });

  await Promise.all(
    CENSUS_KEYS.map((key) =>
      prisma.censusAnswer.upsert({
        where: { letterId_key: { letterId: letter.id, key } },
        update: { value: answers[key], questionSetId: questionSet.id },
        create: {
          letterId: letter.id,
          questionSetId: questionSet.id,
          key,
          value: answers[key],
        },
      }),
    ),
  );

  revalidatePath("/map");
  revalidatePath(`/write/${targetAge}`);
}

export async function sealLetter(formData: FormData) {
  const user = await requireOnboardedUser();
  const now = new Date();
  const targetAge = Number(formData.get("targetAge"));
  const body = String(formData.get("body") ?? "");
  const answers = formAnswers(formData);
  const currentAge = getCurrentAge(user.birthDate, user.timezone, now);
  const year = calendarYear(user.timezone, now);

  await saveDraft(formData);

  await prisma.$transaction(async (tx) => {
    const letter = await tx.letter.findUniqueOrThrow({
      where: { userId_targetAge: { userId: user.id, targetAge } },
      include: { answers: true },
    });

    const census = parseCensusAnswers(
      Object.fromEntries(letter.answers.map((answer) => [answer.key, answer.value])),
    );
    assertCanSealDraft({
      status: letter.status,
      body: letter.body || body,
      answers: census,
      currentAge,
      targetAge,
    });
    assertCompleteCensus(census);

    const stamp = await tx.stamp.upsert({
      where: { userId_year: { userId: user.id, year } },
      update: {},
      create: { userId: user.id, year },
    });
    assertCanSealWithStamp(stamp, user.timezone, now);

    await tx.stamp.update({
      where: { id: stamp.id },
      data: { spentAt: now },
    });
    await tx.letter.update({
      where: { id: letter.id },
      data: {
        status: "SEALED",
        sealedAt: now,
        stampId: stamp.id,
        body: letter.body || body,
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { birthDateLocked: true },
    });
  });

  revalidatePath("/map");
  revalidatePath("/settings");
  redirect("/map");
}

export async function openLetter(formData: FormData) {
  const user = await requireOnboardedUser();
  const letterId = String(formData.get("letterId") ?? "");
  const now = new Date();

  const letter = await prisma.letter.findFirst({
    where: { id: letterId, userId: user.id },
  });
  if (!letter || letter.status === "DRAFT") {
    throw new Error("Letter is not ready to open");
  }
  if (!isLetterUnlocked(user.birthDate, user.timezone, letter.targetAge, now)) {
    throw new Error("This chair is still waiting");
  }

  if (letter.status !== "OPENED") {
    await prisma.letter.update({
      where: { id: letter.id },
      data: { status: "OPENED", openedAt: now },
    });
  }

  revalidatePath(`/open/${letter.id}`);
  revalidatePath("/map");
}

export async function startCustomAge(formData: FormData) {
  const user = await requireOnboardedUser();
  const targetAge = Number(formData.get("targetAge"));
  const currentAge = getCurrentAge(user.birthDate, user.timezone, new Date());
  assertCanWriteToAge(currentAge, targetAge);
  redirect(`/write/${targetAge}`);
}

export async function currentStampStatus(userId: string, timezone: string, now = new Date()) {
  const year = calendarYear(timezone, now);
  const stamp = await ensureYearStamp(userId, year);
  return {
    year,
    spent: !canSpendStamp(stamp, timezone, now),
    expired: false,
  };
}

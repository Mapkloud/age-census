"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  decryptAnswers,
  decryptLetterBody,
  encryptCensusValue,
  encryptLetterBody,
} from "@/lib/crypto/content";
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
import { assertCanConsumeSeal, assertCanStartNewAgeDraft } from "@/modules/seals";

async function ensureQuestionSet() {
  return prisma.questionSet.upsert({
    where: { version: CENSUS_VERSION },
    update: { keys: [...CENSUS_KEYS] },
    create: { version: CENSUS_VERSION, keys: [...CENSUS_KEYS] },
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
  if (!existing) {
    if (user.sealBalance < 1) {
      redirect("/seals?reason=new-age");
    }
    assertCanStartNewAgeDraft(user.sealBalance);
  }

  const questionSet = await ensureQuestionSet();
  const letter = await prisma.letter.upsert({
    where: { userId_targetAge: { userId: user.id, targetAge } },
    update: { questionSetId: questionSet.id },
    create: {
      userId: user.id,
      targetAge,
      body: "",
      questionSetId: questionSet.id,
    },
  });

  await prisma.letter.update({
    where: { id: letter.id },
    data: { body: encryptLetterBody(letter.id, body) },
  });

  await Promise.all(
    CENSUS_KEYS.map((key) =>
      prisma.censusAnswer.upsert({
        where: { letterId_key: { letterId: letter.id, key } },
        update: {
          value: encryptCensusValue(letter.id, key, answers[key]),
          questionSetId: questionSet.id,
        },
        create: {
          letterId: letter.id,
          questionSetId: questionSet.id,
          key,
          value: encryptCensusValue(letter.id, key, answers[key]),
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
  const currentAge = getCurrentAge(user.birthDate, user.timezone, now);

  await saveDraft(formData);

  await prisma.$transaction(async (tx) => {
    const letter = await tx.letter.findUniqueOrThrow({
      where: { userId_targetAge: { userId: user.id, targetAge } },
      include: { answers: true },
    });

    const plainBody = decryptLetterBody(letter.id, letter.body) || body;
    const plainAnswers = decryptAnswers(letter.id, letter.answers);
    const census = parseCensusAnswers(
      Object.fromEntries(plainAnswers.map((answer) => [answer.key, answer.value])),
    );
    assertCanSealDraft({
      status: letter.status,
      body: plainBody,
      answers: census,
      currentAge,
      targetAge,
    });
    assertCompleteCensus(census);

    if (letter.status === "DRAFT") {
      const fresh = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { sealBalance: true },
      });
      assertCanConsumeSeal(fresh.sealBalance);
      const spent = await tx.user.updateMany({
        where: { id: user.id, sealBalance: { gte: 1 } },
        data: { sealBalance: { decrement: 1 }, birthDateLocked: true },
      });
      if (spent.count !== 1) {
        throw new Error("A seal is required to seal this letter");
      }
    }

    await tx.letter.update({
      where: { id: letter.id },
      data: {
        status: "SEALED",
        sealedAt: now,
      },
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
  const existing = await prisma.letter.findUnique({
    where: { userId_targetAge: { userId: user.id, targetAge } },
    select: { id: true },
  });
  if (!existing && user.sealBalance < 1) {
    redirect("/seals?reason=new-age");
  }
  redirect(`/write/${targetAge}`);
}

export async function sealedTargetAges(userId: string): Promise<number[]> {
  const letters = await prisma.letter.findMany({
    where: { userId, status: { not: "DRAFT" } },
    select: { targetAge: true },
    orderBy: { targetAge: "asc" },
  });
  return letters.map((letter) => letter.targetAge);
}

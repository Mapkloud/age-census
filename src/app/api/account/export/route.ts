import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildLetterDataExport } from "@/modules/account-export";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      letters: {
        include: { answers: true },
        orderBy: { targetAge: "asc" },
      },
    },
  });

  if (!user?.birthDate || !user.timezone) {
    return new Response("Onboarding incomplete", { status: 400 });
  }

  const payload = buildLetterDataExport({
    birthDate: user.birthDate,
    timeZone: user.timezone,
    letters: user.letters.map((letter) => ({
      targetAge: letter.targetAge,
      status: letter.status,
      body: letter.body,
      sealedAt: letter.sealedAt,
      openedAt: letter.openedAt,
      createdAt: letter.createdAt,
      answers: letter.answers.map((answer) => ({
        key: answer.key,
        value: answer.value,
      })),
    })),
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="age-census-letters-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

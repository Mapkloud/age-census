import type { PrismaClient } from "@prisma/client";
import { getSealPack, type SealPack } from "./index";

type Tx = Pick<PrismaClient, "sealPurchase" | "user">;

export async function creditPaidPack(
  tx: Tx,
  args: {
    userId: string;
    pack: SealPack;
    stripeSessionId: string;
  },
): Promise<{ credited: boolean; balance: number }> {
  const existing = await tx.sealPurchase.findUnique({
    where: { stripeSessionId: args.stripeSessionId },
  });
  if (existing?.status === "PAID") {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: args.userId },
      select: { sealBalance: true },
    });
    return { credited: false, balance: user.sealBalance };
  }

  if (existing) {
    await tx.sealPurchase.update({
      where: { id: existing.id },
      data: { status: "PAID", paidAt: new Date() },
    });
  } else {
    await tx.sealPurchase.create({
      data: {
        userId: args.userId,
        packId: args.pack.id,
        seals: args.pack.seals,
        amountCents: args.pack.amountCents,
        stripeSessionId: args.stripeSessionId,
        status: "PAID",
        paidAt: new Date(),
      },
    });
  }

  const user = await tx.user.update({
    where: { id: args.userId },
    data: { sealBalance: { increment: args.pack.seals } },
    select: { sealBalance: true },
  });
  return { credited: true, balance: user.sealBalance };
}

export function packFromMetadata(packId: string | undefined, sealsRaw: string | undefined): SealPack | null {
  const byId = packId ? getSealPack(packId) : null;
  if (byId) return byId;
  if (sealsRaw) return getSealPack(sealsRaw);
  return null;
}

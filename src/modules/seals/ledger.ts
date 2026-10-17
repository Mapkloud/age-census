import type { PrismaClient } from "@prisma/client";
import { getSealPack, type SealPack } from "./index";

type Tx = {
  sealPurchase: Pick<
    PrismaClient["sealPurchase"],
    "findUnique" | "create" | "update"
  >;
  user: Pick<PrismaClient["user"], "findUniqueOrThrow" | "update">;
};

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

/**
 * Resolve a pack solely from catalog `packId` via `getSealPack`.
 * Never trust a raw seals count for credit size. If `seals` metadata is
 * present it must match the catalog entry (fail closed on mismatch).
 */
export function packFromMetadata(
  packId: string | undefined,
  sealsRaw?: string | undefined,
): SealPack | null {
  if (!packId) return null;
  const pack = getSealPack(packId);
  if (!pack) return null;

  if (sealsRaw !== undefined && sealsRaw !== "") {
    const parsed = Number(sealsRaw);
    if (!Number.isInteger(parsed) || parsed !== pack.seals) {
      return null;
    }
  }

  return pack;
}

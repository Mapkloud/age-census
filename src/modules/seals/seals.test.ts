import { describe, expect, it, vi } from "vitest";
import {
  SEAL_PACKS,
  SIGNUP_SEAL_GRANT,
  assertCanConsumeSeal,
  assertCanStartNewAgeDraft,
  canConsumeSeal,
  canStartNewAgeDraft,
  formatSealBalance,
  getSealPack,
  normalizeSealBalance,
} from "./index";
import { creditPaidPack, packFromMetadata } from "./ledger";

describe("seal packs", () => {
  it("matches published USD prices", () => {
    expect(SIGNUP_SEAL_GRANT).toBe(1);
    expect(SEAL_PACKS.map((pack) => [pack.id, pack.seals, pack.amountCents])).toEqual([
      ["1", 1, 100],
      ["5", 5, 350],
      ["10", 10, 600],
      ["20", 20, 1200],
    ]);
    expect(SEAL_PACKS.map((pack) => pack.priceLabel)).toEqual([
      "$1.00",
      "$3.50",
      "$6.00",
      "$12.00",
    ]);
  });

  it("looks up packs by id and rejects unknown ids", () => {
    expect(getSealPack("10")?.seals).toBe(10);
    expect(getSealPack("3")).toBeNull();
  });

  it("resolves pack from catalog packId only (never trust seals alone)", () => {
    expect(packFromMetadata("5", undefined)?.amountCents).toBe(350);
    expect(packFromMetadata("5", "5")?.seals).toBe(5);
    expect(packFromMetadata("20")?.seals).toBe(20);
    expect(packFromMetadata("20", "")?.seals).toBe(20);
    expect(packFromMetadata(undefined, "20")).toBeNull();
    expect(packFromMetadata("bogus", "1")).toBeNull();
    expect(packFromMetadata("5", "99")).toBeNull();
    expect(packFromMetadata("1", "20")).toBeNull();
    expect(packFromMetadata("5", "not-a-number")).toBeNull();
    expect(packFromMetadata(undefined, undefined)).toBeNull();
  });
});

describe("spend rules", () => {
  it("requires balance ≥ 1 to start a new age or seal", () => {
    expect(canStartNewAgeDraft(1)).toBe(true);
    expect(canConsumeSeal(2)).toBe(true);
    expect(canStartNewAgeDraft(0)).toBe(false);
    expect(canConsumeSeal(0)).toBe(false);
    expect(canStartNewAgeDraft(1.5)).toBe(false);
    expect(canConsumeSeal(-1)).toBe(false);
    expect(() => assertCanStartNewAgeDraft(0)).toThrow(/new age/);
    expect(() => assertCanConsumeSeal(0)).toThrow(/seal this letter/);
    expect(() => assertCanConsumeSeal(1)).not.toThrow();
  });

  it("formats and normalizes balance copy", () => {
    expect(normalizeSealBalance(0)).toBe(0);
    expect(normalizeSealBalance(undefined)).toBe(0);
    expect(normalizeSealBalance(3.2)).toBe(0);
    expect(normalizeSealBalance(4)).toBe(4);
    expect(formatSealBalance(0)).toBe("No seals");
    expect(formatSealBalance(undefined)).toBe("No seals");
    expect(formatSealBalance(1)).toBe("1 seal");
    expect(formatSealBalance(5)).toBe("5 seals");
  });
});

describe("creditPaidPack idempotency", () => {
  const pack = getSealPack("5")!;
  const userId = "user-1";
  const stripeSessionId = "cs_test_abc";

  function mockTx(overrides: {
    existing?: { id: string; status: string } | null;
    balance?: number;
  }) {
    const sealPurchase = {
      findUnique: vi.fn().mockResolvedValue(overrides.existing ?? null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    };
    const user = {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        sealBalance: overrides.balance ?? 1,
      }),
      update: vi.fn().mockResolvedValue({
        sealBalance: (overrides.balance ?? 1) + pack.seals,
      }),
    };
    return { sealPurchase, user };
  }

  it("credits once for a new stripeSessionId", async () => {
    const tx = mockTx({ balance: 1 });
    const first = await creditPaidPack(tx, { userId, pack, stripeSessionId });
    expect(first).toEqual({ credited: true, balance: 6 });
    expect(tx.sealPurchase.create).toHaveBeenCalledOnce();
    expect(tx.sealPurchase.update).not.toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { sealBalance: { increment: 5 } },
      select: { sealBalance: true },
    });
  });

  it("does not double-credit when stripeSessionId already PAID", async () => {
    const tx = mockTx({
      existing: { id: "purchase-1", status: "PAID" },
      balance: 6,
    });
    const again = await creditPaidPack(tx, { userId, pack, stripeSessionId });
    expect(again).toEqual({ credited: false, balance: 6 });
    expect(tx.sealPurchase.create).not.toHaveBeenCalled();
    expect(tx.sealPurchase.update).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.user.findUniqueOrThrow).toHaveBeenCalledOnce();
  });

  it("marks an existing unpaid purchase PAID and increments once", async () => {
    const tx = mockTx({
      existing: { id: "purchase-pending", status: "PENDING" },
      balance: 2,
    });
    const result = await creditPaidPack(tx, { userId, pack, stripeSessionId });
    expect(result).toEqual({ credited: true, balance: 7 });
    expect(tx.sealPurchase.update).toHaveBeenCalledWith({
      where: { id: "purchase-pending" },
      data: { status: "PAID", paidAt: expect.any(Date) },
    });
    expect(tx.sealPurchase.create).not.toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalledOnce();
  });
});

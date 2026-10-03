import { describe, expect, it } from "vitest";
import {
  SEAL_PACKS,
  SIGNUP_SEAL_GRANT,
  assertCanConsumeSeal,
  assertCanStartNewAgeDraft,
  canConsumeSeal,
  canStartNewAgeDraft,
  formatSealBalance,
  getSealPack,
} from "./index";

describe("seal packs", () => {
  it("matches published USD prices", () => {
    expect(SIGNUP_SEAL_GRANT).toBe(1);
    expect(SEAL_PACKS.map((pack) => [pack.id, pack.seals, pack.amountCents])).toEqual([
      ["1", 1, 100],
      ["5", 5, 350],
      ["10", 10, 600],
      ["20", 20, 1200],
    ]);
  });

  it("looks up packs by id and rejects unknown ids", () => {
    expect(getSealPack("10")?.seals).toBe(10);
    expect(getSealPack("3")).toBeNull();
  });
});

describe("spend rules", () => {
  it("requires balance ≥ 1 to start a new age or seal", () => {
    expect(canStartNewAgeDraft(1)).toBe(true);
    expect(canConsumeSeal(2)).toBe(true);
    expect(canStartNewAgeDraft(0)).toBe(false);
    expect(canConsumeSeal(0)).toBe(false);
    expect(() => assertCanStartNewAgeDraft(0)).toThrow(/new age/);
    expect(() => assertCanConsumeSeal(0)).toThrow(/seal this letter/);
    expect(() => assertCanConsumeSeal(1)).not.toThrow();
  });

  it("formats balance copy", () => {
    expect(formatSealBalance(0)).toBe("No seals");
    expect(formatSealBalance(undefined)).toBe("No seals");
    expect(formatSealBalance(1)).toBe("1 seal");
    expect(formatSealBalance(5)).toBe("5 seals");
  });
});

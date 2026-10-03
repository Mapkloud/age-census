export const SIGNUP_SEAL_GRANT = 1;

export type SealPackId = "1" | "5" | "10" | "20";

export type SealPack = {
  id: SealPackId;
  seals: number;
  amountCents: number;
  label: string;
  priceLabel: string;
};

export const SEAL_PACKS: readonly SealPack[] = [
  { id: "1", seals: 1, amountCents: 100, label: "1 seal", priceLabel: "$1.00" },
  { id: "5", seals: 5, amountCents: 350, label: "5 seals", priceLabel: "$3.50" },
  { id: "10", seals: 10, amountCents: 600, label: "10 seals", priceLabel: "$6.00" },
  { id: "20", seals: 20, amountCents: 1200, label: "20 seals", priceLabel: "$12.00" },
] as const;

export function getSealPack(id: string): SealPack | null {
  return SEAL_PACKS.find((pack) => pack.id === id) ?? null;
}

export function canStartNewAgeDraft(balance: number): boolean {
  return Number.isInteger(balance) && balance >= 1;
}

export function canConsumeSeal(balance: number): boolean {
  return Number.isInteger(balance) && balance >= 1;
}

export function assertCanStartNewAgeDraft(balance: number): void {
  if (!canStartNewAgeDraft(balance)) {
    throw new Error("A seal is required to address a new age");
  }
}

export function assertCanConsumeSeal(balance: number): void {
  if (!canConsumeSeal(balance)) {
    throw new Error("A seal is required to seal this letter");
  }
}

export function normalizeSealBalance(balance: unknown): number {
  return typeof balance === "number" && Number.isInteger(balance) && balance > 0
    ? balance
    : 0;
}

export function formatSealBalance(balance: unknown): string {
  const count = normalizeSealBalance(balance);
  if (count === 0) return "No seals";
  if (count === 1) return "1 seal";
  return `${count} seals`;
}

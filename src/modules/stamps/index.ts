import { calendarYear } from "../time";

export type StampRecord = {
  year: number;
  spentAt: Date | null;
};

export function isStampSpent(stamp: StampRecord): boolean {
  return stamp.spentAt !== null;
}

export function isStampExpired(
  stamp: StampRecord,
  timeZone: string,
  now: Date,
): boolean {
  return calendarYear(timeZone, now) > stamp.year;
}

export function canSpendStamp(
  stamp: StampRecord,
  timeZone: string,
  now: Date,
): boolean {
  return (
    calendarYear(timeZone, now) === stamp.year &&
    !isStampSpent(stamp) &&
    !isStampExpired(stamp, timeZone, now)
  );
}

export function assertCanSealWithStamp(
  stamp: StampRecord | null,
  timeZone: string,
  now: Date,
): StampRecord {
  if (!stamp) {
    throw new Error("No seal without a stamp");
  }
  if (isStampSpent(stamp)) {
    throw new Error("This year's stamp is already spent");
  }
  if (isStampExpired(stamp, timeZone, now)) {
    throw new Error("Unused stamp expired at year end");
  }
  if (!canSpendStamp(stamp, timeZone, now)) {
    throw new Error("No usable stamp this year");
  }
  return stamp;
}

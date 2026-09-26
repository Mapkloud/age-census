import {
  observedMonthDay,
  partsInTimeZone,
  utcDateParts,
  zonedMidnight,
} from "../time";

export const MAX_TARGET_AGE = 120;

export function getCurrentAge(
  birthDate: Date,
  timeZone: string,
  now: Date = new Date(),
): number {
  const birth = utcDateParts(birthDate);
  const nowParts = partsInTimeZone(now, timeZone);
  const observed = observedMonthDay(birth.month, birth.day, nowParts.year);
  let age = nowParts.year - birth.year;
  if (
    nowParts.month < observed.month ||
    (nowParts.month === observed.month && nowParts.day < observed.day)
  ) {
    age -= 1;
  }
  return age;
}

export function getUnlockInstant(
  birthDate: Date,
  timeZone: string,
  targetAge: number,
): Date {
  const birth = utcDateParts(birthDate);
  const year = birth.year + targetAge;
  const observed = observedMonthDay(birth.month, birth.day, year);
  return zonedMidnight(year, observed.month, observed.day, timeZone);
}

export function canAddressAge(currentAge: number, targetAge: number): boolean {
  return (
    Number.isInteger(targetAge) &&
    targetAge > currentAge &&
    targetAge <= MAX_TARGET_AGE
  );
}

export function isLetterUnlocked(
  birthDate: Date,
  timeZone: string,
  targetAge: number,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= getUnlockInstant(birthDate, timeZone, targetAge).getTime();
}

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

export type DateTimeParts = DateParts & {
  hour: number;
  minute: number;
  second: number;
};

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function assertValidTimeZone(timeZone: string): void {
  if (!isValidTimeZone(timeZone)) {
    throw new Error(`Invalid timezone: ${timeZone}`);
  }
}

export function utcDateParts(date: Date): DateParts {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function partsInTimeZone(date: Date, timeZone: string): DateTimeParts {
  assertValidTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const bag = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

export function calendarYear(timeZone: string, now: Date): number {
  return partsInTimeZone(now, timeZone).year;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function observedMonthDay(
  month: number,
  day: number,
  year: number,
): { month: number; day: number } {
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return { month: 3, day: 1 };
  }
  return { month, day };
}

export function zonedInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const guess = new Date(utcGuess);
  const parts = partsInTimeZone(guess, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const wanted = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(utcGuess - (asUtc - wanted));
}

export function zonedMidnight(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Date {
  return zonedInstant(year, month, day, 0, 0, 0, timeZone);
}

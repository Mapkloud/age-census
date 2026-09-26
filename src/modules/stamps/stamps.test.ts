import { describe, expect, it } from "vitest";
import { calendarYear, zonedInstant } from "../time";
import {
  assertCanSealWithStamp,
  canSpendStamp,
  isStampExpired,
  isStampSpent,
} from "./index";

const NY = "America/New_York";

describe("yearly stamp", () => {
  it("uses the calendar year in the user timezone", () => {
    const nyeInNy = zonedInstant(2025, 12, 31, 23, 0, 0, NY);
    expect(calendarYear(NY, nyeInNy)).toBe(2025);
    expect(calendarYear(NY, new Date("2026-01-01T04:00:00.000Z"))).toBe(2025);
  });

  it("can be spent once in its year", () => {
    const now = zonedInstant(2026, 7, 1, 12, 0, 0, NY);
    const stamp = { year: 2026, spentAt: null };
    expect(canSpendStamp(stamp, NY, now)).toBe(true);
    expect(isStampSpent({ year: 2026, spentAt: now })).toBe(true);
    expect(canSpendStamp({ year: 2026, spentAt: now }, NY, now)).toBe(false);
  });

  it("expires unused at year end", () => {
    const nextYear = zonedInstant(2027, 1, 1, 0, 0, 0, NY);
    const stamp = { year: 2026, spentAt: null };
    expect(isStampExpired(stamp, NY, nextYear)).toBe(true);
    expect(canSpendStamp(stamp, NY, nextYear)).toBe(false);
  });

  it("forbids a seal without a usable stamp", () => {
    const now = zonedInstant(2026, 7, 1, 12, 0, 0, NY);
    expect(() => assertCanSealWithStamp(null, NY, now)).toThrow(
      /No seal without a stamp/,
    );
    expect(() =>
      assertCanSealWithStamp({ year: 2026, spentAt: now }, NY, now),
    ).toThrow(/already spent/);
    expect(() =>
      assertCanSealWithStamp(
        { year: 2025, spentAt: null },
        NY,
        zonedInstant(2026, 1, 1, 0, 0, 0, NY),
      ),
    ).toThrow(/expired/);
  });
});

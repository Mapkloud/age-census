import { describe, expect, it } from "vitest";
import { zonedInstant } from "../time";
import {
  canAddressAge,
  getCurrentAge,
  getUnlockInstant,
  isLetterUnlocked,
} from "./index";

const NY = "America/New_York";
const birth = new Date("1990-06-15T00:00:00.000Z");

describe("getCurrentAge", () => {
  it("is still the previous age the day before the birthday in the user timezone", () => {
    const now = zonedInstant(2026, 6, 14, 23, 0, 0, NY);
    expect(getCurrentAge(birth, NY, now)).toBe(35);
  });

  it("increments on the birthday in the user timezone", () => {
    const now = zonedInstant(2026, 6, 15, 0, 0, 0, NY);
    expect(getCurrentAge(birth, NY, now)).toBe(36);
  });

  it("uses timezone, not UTC, for the birthday cutoff", () => {
    const utcJune15Early = new Date("2026-06-15T03:00:00.000Z");
    expect(getCurrentAge(birth, NY, utcJune15Early)).toBe(35);
  });
});

describe("leap-day birthdays", () => {
  const leapBirth = new Date("2000-02-29T00:00:00.000Z");

  it("observes March 1 in a non-leap year", () => {
    const before = zonedInstant(2025, 2, 28, 12, 0, 0, NY);
    const onObserved = zonedInstant(2025, 3, 1, 0, 0, 0, NY);
    expect(getCurrentAge(leapBirth, NY, before)).toBe(24);
    expect(getCurrentAge(leapBirth, NY, onObserved)).toBe(25);
  });

  it("unlocks on the real Feb 29 in a leap year", () => {
    const unlock = getUnlockInstant(leapBirth, NY, 24);
    expect(unlock.getTime()).toBe(zonedInstant(2024, 2, 29, 0, 0, 0, NY).getTime());
  });
});

describe("unlock instant", () => {
  it("unlocks a letter to age N on the birthday the user turns N", () => {
    const unlock = getUnlockInstant(birth, NY, 40);
    expect(unlock.getTime()).toBe(zonedInstant(2030, 6, 15, 0, 0, 0, NY).getTime());
    expect(isLetterUnlocked(birth, NY, 40, new Date(unlock.getTime() - 1))).toBe(
      false,
    );
    expect(isLetterUnlocked(birth, NY, 40, unlock)).toBe(true);
  });
});

describe("canAddressAge", () => {
  it("rejects the current age and any past age", () => {
    expect(canAddressAge(36, 36)).toBe(false);
    expect(canAddressAge(36, 30)).toBe(false);
    expect(canAddressAge(36, 40)).toBe(true);
  });
});

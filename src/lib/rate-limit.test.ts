import { afterEach, describe, expect, it } from "vitest";
import { consumeRateLimit, resetRateLimitStore } from "./rate-limit";

afterEach(() => {
  resetRateLimitStore();
});

describe("consumeRateLimit", () => {
  const opts = { max: 5, windowMs: 15 * 60 * 1000 };

  it("allows up to max requests in the window", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      const result = consumeRateLimit("email:a@example.com", { ...opts, now: t0 + i });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it("blocks the next request and reports retryAfterMs", () => {
    const t0 = 2_000_000;
    for (let i = 0; i < 5; i++) {
      consumeRateLimit("email:b@example.com", { ...opts, now: t0 });
    }
    const blocked = consumeRateLimit("email:b@example.com", {
      ...opts,
      now: t0 + 60_000,
    });
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterMs).toBe(opts.windowMs - 60_000);
    }
  });

  it("resets after the window elapses", () => {
    const t0 = 3_000_000;
    for (let i = 0; i < 5; i++) {
      consumeRateLimit("email:c@example.com", { ...opts, now: t0 });
    }
    expect(
      consumeRateLimit("email:c@example.com", { ...opts, now: t0 + opts.windowMs }).allowed,
    ).toBe(true);
  });

  it("tracks keys independently", () => {
    const t0 = 4_000_000;
    for (let i = 0; i < 5; i++) {
      consumeRateLimit("email:one@example.com", { ...opts, now: t0 });
    }
    expect(
      consumeRateLimit("email:two@example.com", { ...opts, now: t0 }).allowed,
    ).toBe(true);
  });
});

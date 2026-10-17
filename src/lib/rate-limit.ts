/**
 * Simple in-memory fixed-window rate limiter.
 *
 * Suitable for local/dev and single-instance deploys. On serverless or
 * multi-instance hosts the counters do not share state — use Redis (or
 * similar) before relying on this in production scale-out.
 */

export type RateLimitOptions = {
  /** Maximum allowed events in the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Override clock (tests). */
  now?: number;
};

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; retryAfterMs: number };

type Bucket = {
  /** Window start (ms). */
  startedAt: number;
  count: number;
};

const buckets = new Map<string, Bucket>();

/** Test / ops helper — clears all buckets. */
export function resetRateLimitStore(): void {
  buckets.clear();
}

/**
 * Consume one attempt for `key`. Fail closed when the limit is exceeded
 * (does not increment further once blocked).
 */
export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.startedAt >= options.windowMs) {
    buckets.set(key, { startedAt: now, count: 1 });
    return { allowed: true, remaining: Math.max(0, options.max - 1) };
  }

  if (existing.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(1, existing.startedAt + options.windowMs - now),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, options.max - existing.count) };
}

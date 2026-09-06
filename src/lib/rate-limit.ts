/**
 * Simple in-process flood guard for post/comment/DM.
 * Single-node only — fine for MVP / one app instance.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Last identical body per key (duplicate-body flood). */
const lastBodies = new Map<string, { body: string; at: number }>();

export function assertNotFlooding(
  key: string,
  { limit = 8, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || now >= cur.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (cur.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)) };
  }
  cur.count += 1;
  return { ok: true };
}

/**
 * Reject if the same user posts/comments the identical body within windowMs (default 30s).
 */
export function assertNotDuplicateBody(
  key: string,
  body: string,
  windowMs = 30_000,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const normalized = body.trim();
  const prev = lastBodies.get(key);
  if (prev && prev.body === normalized && now - prev.at < windowMs) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - prev.at)) / 1000)),
    };
  }
  lastBodies.set(key, { body: normalized, at: now });
  return { ok: true };
}

/** Periodic prune so the Maps cannot grow forever in long-lived processes. */
export function pruneRateBuckets() {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (now >= v.resetAt) buckets.delete(k);
  }
  for (const [k, v] of lastBodies) {
    if (now - v.at > 120_000) lastBodies.delete(k);
  }
}

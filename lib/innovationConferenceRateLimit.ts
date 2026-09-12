/**
 * Rate limit in-memory لمسارات مؤتمر الابتكار.
 * buckets منفصلة: register و track لا يؤثر أحدهما على الآخر.
 */

type Bucket = { timestamps: number[] };
type Scope = "register" | "track";

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_BY_SCOPE: Record<Scope, number> = {
  register: 5,
  track: 10,
};

function pruneBucket(bucket: Bucket, now: number): void {
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);
}

export function checkInnovationConferenceRateLimit(
  ip: string,
  scope: Scope = "register"
): {
  allowed: boolean;
  retryAfterSec?: number;
} {
  const key = `${scope}:${ip || "unknown"}`;
  const maxHits = MAX_BY_SCOPE[scope];
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  pruneBucket(bucket, now);

  if (bucket.timestamps.length >= maxHits) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      pruneBucket(b, now);
      if (b.timestamps.length === 0) buckets.delete(k);
    }
  }

  return { allowed: true };
}

/** للاختبارات المحلية فقط */
export function resetInnovationConferenceRateLimitForTests(scope?: Scope): void {
  if (!scope) {
    buckets.clear();
    return;
  }
  for (const k of [...buckets.keys()]) {
    if (k.startsWith(`${scope}:`)) buckets.delete(k);
  }
}

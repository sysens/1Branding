import { createError } from "h3";

// In-memory sliding-window limits (one server instance): login attempts,
// form submissions and tracker batches per client.
const buckets = new Map<string, number[]>();
const MAX_KEYS = 20_000;

/** True when the call is allowed; false once `max` calls happened within `windowMs`. */
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((at) => at > now - windowMs);
  if (recent.length >= max) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.delete(key);
  buckets.set(key, recent);
  if (buckets.size > MAX_KEYS) {
    for (const oldest of buckets.keys()) {
      buckets.delete(oldest);
      if (buckets.size <= MAX_KEYS * 0.9) break;
    }
  }
  return true;
}

export function enforce(key: string, max: number, windowMs: number) {
  if (!allow(key, max, windowMs)) throw createError({ statusCode: 429, message: "Слишком много попыток, попробуйте позже" });
}

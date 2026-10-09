interface RateLimitEntry {
  timestamps: number[]
}

/**
 * Upper bound on tracked keys. The store is in-memory and per-instance, so an
 * attacker with a wide key space (or simply a long uptime) could otherwise
 * grow it without limit and OOM the process. When the cap is reached the
 * least-recently-used entries are evicted: Map preserves insertion order, and
 * every touch re-inserts the key at the end.
 *
 * Trade-off: an evicted key returns with a fresh window. This bounds memory
 * at the cost of occasionally giving one burst to a long-idle key.
 */
const MAX_TRACKED_KEYS = 10_000

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry) {
    if (store.size >= MAX_TRACKED_KEYS) {
      const toEvict = store.size - MAX_TRACKED_KEYS + 1
      let evicted = 0
      for (const oldestKey of store.keys()) {
        if (evicted >= toEvict) break
        store.delete(oldestKey)
        evicted++
      }
    }
    store.set(key, { timestamps: [now] })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

  // Refresh recency: re-insert at the end so the eviction order stays LRU-ish.
  store.delete(key)
  store.set(key, entry)

  if (entry.timestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.timestamps.push(now)
  return { allowed: true, remaining: maxRequests - entry.timestamps.length }
}

export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 60_000)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 60_000)
}

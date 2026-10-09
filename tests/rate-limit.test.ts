import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

// Keep this in sync with MAX_TRACKED_KEYS in src/lib/rate-limit.ts.
const MAX_TRACKED_KEYS = 10_000

describe('checkRateLimit', () => {
  it('allows up to maxRequests within the window and blocks beyond it', () => {
    const key = `burst:${Math.random()}`
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true)
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true)
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true)
    const blocked = checkRateLimit(key, 3, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('recovers after the window elapses', async () => {
    const key = `window:${Math.random()}`
    expect(checkRateLimit(key, 1, 30).allowed).toBe(true)
    expect(checkRateLimit(key, 1, 30).allowed).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(checkRateLimit(key, 1, 30).allowed).toBe(true)
  })

  it('caps the number of tracked keys (bounded memory)', () => {
    // Without the cap, the very first key would still be remembered as
    // exhausted. With eviction it returns with a fresh window, proving the
    // store stays bounded.
    for (let i = 0; i < MAX_TRACKED_KEYS + 50; i++) {
      checkRateLimit(`cap:${i}`, 1, 60_000)
    }
    expect(checkRateLimit('cap:0', 1, 60_000).allowed).toBe(true)
  })
})

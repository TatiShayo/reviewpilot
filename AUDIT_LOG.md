# AUDIT LOG — reviewpilot

**Sweep:** July 14, 2026 (Round 1, Rounds 2-3 applied)

## FIXES APPLIED

### HIGH — Hardcoded placeholder Supabase URL and key
**Finding:** `src/lib/supabase/client.ts` fell back to `createBrowserClient('https://placeholder.supabase.co', 'placeholder-key')` on missing env vars — silently broken in production.
**Fix:** Now throws explicit error: `throw new Error('Supabase URL and anon key are required.')`
**File:** `src/lib/supabase/client.ts`

### HIGH — Missing security headers
**Finding:** `next.config.ts` was empty.
**Fix:** Added full security header set.
**File:** `next.config.ts`

## DEFERRED

- 6 instances of `error.message` leaked to clients (templates/route.ts, competitors/route.ts)
- RLS on profiles has proper subscription_tier guard — confirmed safe from billflow-style bypass

---

## ROUND 2 — Adversarial, Reduction & Cross-Angle Sweep (July 14, 2026)

### HIGH — Dead auth middleware wired
**Fix:** Created `src/middleware.ts` re-exporting existing `proxy.ts` + `config`.
**File:** `src/middleware.ts` (NEW)

### MEDIUM — Missing Supabase dependencies + next version pinned
**Fix:** Added `@supabase/ssr` + `@supabase/supabase-js`. Pinned next from `^16.2.6` to `16.2.6`.
**File:** `package.json`

---

## ROUND 4 — Multi-Discipline Review (July 14, 2026)

### Pass D — SEO: "Create Next App" default metadata, missing robots/sitemap
**Fixed:** Replaced default metadata with "ReviewPilot — AI-Powered Review Management" + OG tags. Created `robots.ts` + `sitemap.ts`.
**Files:** `src/app/layout.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`

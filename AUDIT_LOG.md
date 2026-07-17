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

---

## ROUND 5 — Full audit + hardening pass, gate restoration (July 18, 2026)

Protocol: upgrade.txt Phases 2–3, 7 + PLAYBOOK Part 2. Full deliverables produced;
gate restored to green (was broken at checkpoint 0c21cc4: 4 failing tests, tsc
errors, eslint could not run, build failed).

### CRITICAL
- **C1 — Public unauthenticated `/api/ai/respond` (spoofing + LLM denial-of-wallet).**
  Rewrote to require auth + zod + per-user rate limit + monthly quota (`lib/gate`),
  RLS-scoped `business_id` lookup, correct `{ responses }` contract. Removed stale
  contradicting `test/aiRespond.test.ts`. Proven by regression test.
- **C2 — Forgeable `e2e_bypass=1` auth-skip cookie in `proxy.ts`.** Now gated behind
  `NODE_ENV !== 'production'` + `E2E_BYPASS_SECRET`.

### HIGH
- **H1 — profiles privilege-escalation RLS (billing bypass).** Verified/finished the
  migration 006 `BEFORE UPDATE` trigger freezing `subscription_tier` /
  `responses_used_this_month` for end-user sessions.
- **H2 — Cron digest: dead auth + RLS-broken.** Enforced `CRON_SECRET` bearer auth +
  service-role client.
- **H3 — `@supabase/supabase-js` dep.** Verified present (`^2.106.2`) and installed.

### MEDIUM
- **M1** — Stopped `error.message` leakage in templates/competitors/checkout/webhook.
- **M2** — `subscriptions` `UNIQUE(user_id)` (migration 007) + idempotent upserts
  (`onConflict: user_id`); checkout stub written via service-role client.
- **M3** — Rate limit added to `/api/ai/sentiment`.
- **M4** — Stripe apiVersion → `2026-06-24.dahlia` (fixed tsc/build).
- **M5** — RLS default-deny audited across all tables + documented (migration 007).

### LOW / infra
- Reinstalled corrupted `es-abstract` (eslint was unrunnable).
- Removed redundant `src/middleware.ts` that broke the Next 16 build.
- Resolved all 28 eslint errors (catch-any → unknown, typed casts, escaped
  entities, prefer-const, scoped hook-rule disables).
- `npm audit`: 2 moderate (dev-only postcss), **0 high/critical** — accepted.

### Deliverables
- `ARCHITECTURE.md`, `REVIEW_FINDINGS.md`, portfolio `README.md` (this log finalized).
- Regression test: `tests/api/ai-respond-security.test.ts`.
- Migration 007: `supabase/migrations/007_subscriptions_unique_and_rls.sql`.

### Gate (final)
`tsc --noEmit` clean · `eslint` 0 errors · `next build` success ·
`vitest` 32/32 passing. **GREEN.**

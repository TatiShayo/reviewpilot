# ReviewPilot — Security & Quality Review Findings

Audit protocol: `.agents/upgrade.txt` phases 2–3, 7 + PLAYBOOK Part 2.
Focus: authorization/IDOR, RLS, input validation, secrets, abuse/cost, perf.
Gate at close: `tsc --noEmit`, `eslint`, `next build`, `vitest` — all green.

Severity: **CRITICAL** / **HIGH** / **MEDIUM** / **LOW**. Status: FIXED / VERIFIED / ACCEPTED.

---

## CRITICAL

### C1 — Public unauthenticated AI endpoint → response spoofing + LLM cost abuse — FIXED
`POST /api/ai/respond` had **no `auth.getUser()` check** and returned generated
replies to any anonymous caller, with no quota. This is (a) review-response
spoofing and (b) a denial-of-wallet vector against the operator's OpenAI key.
The endpoint the dashboard actually calls also disagreed on contract (it expected
`{ responses }`, the handler returned `{ variations }`), so the "real" reviews UI
was broken.
**Fix:** rewrote the route to require auth (401), zod-validate input, enforce the
monthly plan quota via `lib/gate.checkUsage` (429), add a per-user burst rate
limit, resolve `business_id` through an RLS-scoped query (IDOR-safe), and return
the `{ responses: {professional, friendly, brief} }` shape both frontends expect.
Dashboard auto-responder updated to the same contract.
**Proof:** `tests/api/ai-respond-security.test.ts` — 401 anon, 429 quota, no
cross-tenant business leak. (`src/app/api/ai/respond/route.ts`)

### C2 — Forgeable auth bypass cookie in production — FIXED
`src/proxy.ts` returned early (skipping all auth) whenever the request carried
`e2e_bypass=1`. Any visitor could set that cookie and reach `/dashboard`.
**Fix:** the bypass now requires `NODE_ENV !== 'production'` **and** a match
against `E2E_BYPASS_SECRET`. In production it can never trigger.

---

## HIGH

### H1 — Privilege escalation via profiles RLS (billing bypass) — FIXED (verified)
Migration 001 allowed a user to `UPDATE` their own `profiles` row; migration 003
later added `subscription_tier` and `responses_used_this_month` to that table.
Net effect: a browser session could
`update({ subscription_tier: 'business' })` to grant itself a paid plan, or zero
its usage counter to dodge the free-tier cap.
**Fix:** migration 006 adds a `BEFORE UPDATE` trigger that forces the billing/
usage columns back to their previous values for any end-user session
(`auth.uid() IS NOT NULL`); the service-role webhook (`auth.uid()` NULL) still
writes them. (`supabase/migrations/006_harden_profiles_rls.sql`)

### H2 — Unauthenticated, non-functional cron digest endpoint — FIXED
`GET /api/cron/digest` had a dead auth check (an `if` with an empty body) and used
the anon cookie client — so it was both publicly triggerable (email/DB abuse) and
functionally broken (RLS returned no other users' rows).
**Fix:** enforce `Authorization: Bearer ${CRON_SECRET}` (503 if unconfigured, 401
on mismatch) and switch to the service-role client, which is what a cross-tenant
digest legitimately requires. (`src/app/api/cron/digest/route.ts`)

### H3 — `@supabase/supabase-js` dependency — VERIFIED PRESENT
Flagged as possibly missing. Confirmed present in `package.json`
(`@supabase/supabase-js ^2.106.2`) and installed; the shared admin client
(`src/lib/supabase/admin.ts`) imports it cleanly.

---

## MEDIUM

### M1 — Internal error messages leaked to clients — FIXED
Multiple routes returned `error.message` / `err.message` in the JSON body,
exposing DB and Stripe internals. Replaced with generic messages plus
`console.error` server logs in `templates`, `competitors`, `stripe/checkout`,
`stripe/webhook`. (5 handlers, 8 sites)

### M2 — `subscriptions` write blocked by RLS / duplicate-row risk — FIXED
`subscriptions` has no user-level INSERT/UPDATE policy (correct default-deny), so
the checkout route's stub `upsert` via the cookie client silently failed —
losing the Stripe customer id and risking duplicate customers on retry. The
webhook's `checkout.session.completed` upsert also had no conflict target, so
webhook double-delivery could insert duplicate rows.
**Fix:** migration 007 adds `UNIQUE(user_id)`; checkout writes the stub via the
service-role client; both upserts use `onConflict: 'user_id'` → idempotent.

### M3 — Unthrottled paid sentiment endpoint — FIXED
`POST /api/ai/sentiment` was authed but had no rate limit on its OpenAI call.
Added a per-user burst limit (`30/min`).

### M4 — Stripe API version type mismatch — FIXED
Both Stripe clients pinned `2026-05-27.dahlia`, which the installed `stripe`
types reject (build/tsc error). Bumped to `2026-06-24.dahlia`.

### M5 — RLS default-deny not documented / audited — FIXED
Reviewed every table: all have RLS enabled and ownership-scoped policies; no table
is left readable/writable by default. Migration 007 records the explicit
default-deny matrix per table for future maintainers.

---

## LOW / ACCEPTED

### L1 — `npm audit`: 2 moderate, 0 high/critical — ACCEPTED
Both moderate advisories are transitive dev-only `postcss` issues pulled through
the Tailwind toolchain; they do not ship to the client runtime. `npm audit fix
--force` would force a breaking major bump for no runtime benefit. Requirement
(high/critical) satisfied: none exist.

### L2 — In-memory rate limiter is per-instance — ACCEPTED (documented)
`lib/rate-limit.ts` is a single-process sliding window; on serverless it limits
per-instance, not globally. Adequate as a first line against bursts; a shared
store (Upstash/Redis) is the recommended upgrade for strict global limits.

### L3 — Redundant `src/middleware.ts` broke the build — FIXED
Next 16 treats `src/proxy.ts` as the proxy/middleware. A leftover
`src/middleware.ts` re-export caused a hard build error ("both middleware and
proxy detected"). Removed; `proxy.ts` already exports its own `config` matcher.

### L4 — Stale/contradictory test + orphan route contract — FIXED
`test/aiRespond.test.ts` asserted the old public `variations` rule-based
generator, contradicting the secure `tests/api/ai-respond.test.ts`. Removed the
stale file when the route was hardened to the single authenticated contract.

---

## Performance

- **N+1 avoided:** `competitors` GET batches snapshots with a single `.in()`
  query; the cron digest batches reviews/responses per user with `.in()`.
- **Indexes:** present on all FK/filter columns (migrations 001/004/005) —
  `businesses(user_id)`, `reviews(business_id, rating, sentiment)`,
  `responses(review_id, business_id)`, `competitors(user_id, business_id)`,
  `competitor_snapshots(competitor_id)`, `usage(user_id, month)`.
- **Error/loading boundaries:** `error.tsx`, `loading.tsx`, `not-found.tsx`
  present at the app root and dashboard pages.
- **Quota short-circuit:** respond route checks rate limit + quota *before* any
  paid OpenAI call, so abuse is rejected at zero LLM cost.
- Pagination on review/competitor lists remains a recommended follow-up (current
  data volumes are small / mock-backed).

## Still open / recommended (non-blocking)

1. Move rate limiting to a shared store for true global limits (L2).
2. Replace `mockDb`/`mock-data` dashboard rendering with live RLS-scoped queries.
3. Add pagination + server-side filtering to reviews/competitors as data grows.
4. Consider a signed idempotency key on the Stripe webhook in addition to the
   unique constraint, for defense in depth against replay.

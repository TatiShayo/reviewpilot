# ReviewPilot — Architecture

AI-powered Google review management SaaS. Business owners connect their locations,
pull in reviews, generate on-brand AI replies in three tones, track sentiment and
competitors, and receive email digests.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router, Turbopack, React 19) |
| Language | TypeScript (strict) |
| Auth + DB | Supabase (Postgres + Auth) via `@supabase/ssr` |
| Billing | Stripe (Checkout, Billing Portal, Webhooks) |
| AI | OpenAI `gpt-4o-mini` (response generation + sentiment) |
| Email | Resend (weekly digest) |
| UI | Tailwind CSS v4, base-ui/react, lucide, recharts, sonner |
| Tests | Vitest (unit/route), Cypress (e2e, out of the type/lint gate) |
| Hosting | Vercel (cron via `vercel.json`) |

## Request / auth flow

1. **`src/proxy.ts`** is the Next 16 proxy (formerly "middleware"). It runs on
   `/dashboard/*`, `/login`, `/signup`. Unauthenticated hits to `/dashboard` are
   redirected to `/login`; authenticated hits to `/login`/`/signup` bounce to
   `/dashboard`. A dev-only, secret-gated `e2e_bypass` cookie can skip auth in
   non-production for Cypress.
2. Server components / route handlers build a request-scoped Supabase client via
   **`src/lib/supabase/server.ts`** (anon key + cookies) and call
   `supabase.auth.getUser()` for authorization.
3. Browser components use **`src/lib/supabase/client.ts`** (anon key only).
4. Trusted server contexts (Stripe webhook, cron digest, checkout stub write) use
   the service-role **`src/lib/supabase/admin.ts`** which bypasses RLS. It is
   never imported into client code.

## Supabase clients (the three-client model)

| Client | Key | RLS | Used by |
|--------|-----|-----|---------|
| `client.ts` | anon | enforced | browser components |
| `server.ts` | anon (+ user cookies) | enforced | route handlers, server components |
| `admin.ts` | service-role | **bypassed** | webhook, cron, checkout stub only |

## Data model (Postgres, `supabase/migrations/`)

- `profiles` — 1:1 with `auth.users`; settings + `subscription_tier` + `responses_used_this_month`. Auto-created by a signup trigger.
- `subscriptions` — Stripe billing state, one row per user (`UNIQUE(user_id)`, migration 007).
- `businesses` — GMB locations owned by a user.
- `reviews` — pulled reviews, FK to a business.
- `responses` — AI replies, FK to review + business.
- `response_templates` — user style references.
- `competitors` + `competitor_snapshots` — competitive rating tracking.
- `usage` — monthly response counters.

**RLS posture:** every table has RLS enabled. Ownership is scoped to
`auth.uid() = user_id` (directly, or through the owning business for
reviews/responses/snapshots). `subscriptions`/`usage` are read-only to end users
and written only by the service role. `profiles` billing/usage columns are frozen
for end-user sessions by a `BEFORE UPDATE` trigger (migration 006) so a user
cannot self-upgrade their tier. Migration 007 documents the full default-deny
matrix. See `REVIEW_FINDINGS.md`.

## API surface (`src/app/api/`)

| Route | Auth | Notes |
|-------|------|-------|
| `POST /ai/respond` | user | zod-validated, per-user rate limit + monthly quota, RLS-scoped business lookup, returns `{ responses: {professional, friendly, brief} }` |
| `POST /ai/sentiment` | user | zod, per-user rate limit |
| `GET /businesses/list` | user | falls back to mock data when empty |
| `GET/POST/DELETE /competitors` | user | zod, ownership-scoped |
| `POST /competitors/snapshot` | user | verifies competitor ownership before write |
| `GET/POST/DELETE /templates` | user | zod, ownership-scoped |
| `POST /stripe/checkout` | user | zod; service-role stub write; returns Checkout or Billing Portal URL |
| `POST /stripe/webhook` | Stripe signature | service-role; idempotent upserts |
| `GET /cron/digest` | `CRON_SECRET` bearer | service-role; per-user weekly digest email |

## External services

- **Supabase** — auth + Postgres (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; API version `2026-06-24.dahlia`.
- **OpenAI** — `OPENAI_API_KEY`.
- **Resend** — digest email (see `src/lib/digest-email.ts`).
- **Vercel Cron** — `CRON_SECRET`; schedule in `vercel.json`.

## Notable app modules

- `src/lib/gate.ts` — `checkUsage`/`incrementUsage` shared quota gate.
- `src/lib/rate-limit.ts` — in-memory sliding-window limiter (per-instance; see findings for the distributed-store recommendation).
- `src/lib/mockDb.ts` / `mock-data.ts` — client-side demo data used by dashboard pages before real data is wired.
- `src/lib/reputation.ts`, `digest-email.ts` — reputation analytics + email templating.
- `next.config.ts` — security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).

## Known simplifications / tech debt

- Several dashboard pages render from `mockDb`/`mock-data` rather than live queries (demo scaffolding).
- Rate limiting is in-memory, so it is per-serverless-instance rather than global.
- Google My Business posting is a deep link, not a live API integration.

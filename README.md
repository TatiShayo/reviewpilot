# ReviewPilot

**AI-powered Google review management for local businesses.** Pull in your
reviews, generate on-brand replies in three tones, track sentiment and
competitors, and get a weekly performance digest — all from one dashboard.

Built with Next.js 16 (App Router), Supabase, Stripe, and OpenAI.

---

## Features

- **AI response generation** — three tones (professional / friendly / brief) per
  review, quota-metered and rate-limited.
- **Sentiment analysis** — automatic positive / neutral / negative classification.
- **Multi-location management** — businesses, reviews, and responses per account.
- **Response templates** — reusable style references that steer the AI.
- **Competitor tracking** — rating snapshots and velocity charts.
- **Reputation dashboard** — keyword monitoring and analytics.
- **Billing** — Stripe Checkout + Billing Portal with free / pro / business tiers.
- **Weekly email digest** — Resend-powered, scheduled via Vercel Cron.

## Tech stack

Next.js 16 · React 19 · TypeScript (strict) · Supabase (Postgres + Auth + RLS) ·
Stripe · OpenAI `gpt-4o-mini` · Resend · Tailwind CSS v4 · Vitest · Cypress.

## Security posture

This codebase has been through a full security audit (`REVIEW_FINDINGS.md`).
Highlights:

- Every API route checks **authorization**, not just authentication; writes are
  ownership-scoped and IDOR-safe.
- **Row-Level Security** is enabled on every table with default-deny; billing and
  usage columns are protected by a trigger against client-side privilege
  escalation.
- Paid-LLM endpoints require auth and are **quota- + rate-limited** to prevent
  denial-of-wallet abuse.
- Stripe webhooks are signature-verified and idempotent.
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy) are set globally; internal errors are never leaked to clients.

See `ARCHITECTURE.md` for the full system map and `REVIEW_FINDINGS.md` for the
findings log.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

### Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only: webhook, cron, checkout stub
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CRON_SECRET=                    # required to run the digest cron
# E2E_BYPASS_SECRET=            # optional, non-production Cypress auth bypass
```

Apply the SQL in `supabase/migrations/` (001 → 007, in order) to a Supabase
project.

## Scripts & gate

```bash
npx tsc --noEmit                                  # types
npx eslint                                        # lint
NODE_OPTIONS=--max-old-space-size=4096 npx next build   # build
npx vitest run                                    # unit / route tests
```

All four are green on `main`.

## Project layout

```
src/
  app/            App Router pages + /api route handlers
  components/     UI components
  lib/            supabase clients, gate (quota), rate-limit, mock data, email
  proxy.ts        Next 16 proxy (auth middleware)
supabase/migrations/   Postgres schema + RLS (001–007)
tests/ , test/         Vitest suites
```

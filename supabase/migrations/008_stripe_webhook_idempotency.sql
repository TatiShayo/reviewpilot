-- ReviewPilot Database Schema
-- Migration 008: Stripe webhook idempotency ledger
--
-- Stripe delivers events at-least-once (automatic retries) and a captured
-- signed payload can be replayed. Every processed event id is recorded here;
-- a duplicate insert (unique violation 23505) short-circuits re-processing
-- before the subscription is re-provisioned. Mirrors postpilot's pattern.

create table if not exists public.stripe_events (
  id text primary key,
  type text,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- No policies: only the service-role admin client (which bypasses RLS) writes here.

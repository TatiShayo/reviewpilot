-- Migration 007: subscriptions idempotency + RLS default-deny audit
--
-- (1) One subscription row per user. Without this, both the checkout route and
--     the Stripe webhook `checkout.session.completed` handler could INSERT
--     duplicate rows (webhook double-delivery / repeated checkout attempts).
--     The unique constraint lets those writes use ON CONFLICT (user_id) as a
--     true upsert, making them idempotent.
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- (2) Default-deny verification.
--     Every application table has RLS ENABLED (migrations 001/004/005). With RLS
--     enabled and no permissive policy for a command, that command is denied by
--     default. Intentional posture per table:
--       profiles            SELECT/UPDATE own row; INSERT via SECURITY DEFINER
--                           trigger only; billing/usage columns frozen for
--                           end-user sessions (migration 006).
--       subscriptions       SELECT own row only. INSERT/UPDATE/DELETE denied to
--                           end users — written exclusively by the service-role
--                           client (Stripe webhook + checkout stub).
--       businesses          full CRUD scoped to auth.uid() = user_id.
--       reviews / responses CRUD scoped through owning business.
--       response_templates  full CRUD scoped to auth.uid() = user_id.
--       competitors /       full CRUD scoped to owner (directly or via parent
--       competitor_snapshots competitor).
--       usage               SELECT own row only; writes are service-role only.
--
-- No table is left with RLS disabled. This migration is the explicit record of
-- that default-deny posture; no policy changes are required.

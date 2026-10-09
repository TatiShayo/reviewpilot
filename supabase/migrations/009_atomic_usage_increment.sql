-- ReviewPilot Database Schema
-- Migration 009: Atomic usage increment RPC
--
-- BACKGROUND (two defects, one fix):
--   src/lib/gate.ts incrementUsage() was a read-modify-write through the
--   user-scoped client: SELECT responses_used_this_month, then UPDATE with
--   N+1.
--   1. Race: two concurrent requests both read N and both write N+1, losing
--      an increment -- free-tier quota bypass under concurrency.
--   2. Migration 006's BEFORE UPDATE trigger pins
--      responses_used_this_month to its old value for every end-user session
--      (auth.uid() IS NOT NULL), so the UPDATE was silently reverted: the
--      counter never moved at all via the app client.
--
-- FIX: a dedicated SECURITY DEFINER RPC performs the increment under the
--   database's row lock. The RPC sets a transaction-local flag that the
--   migration-006 trigger honours for exactly that one +1 statement;
--   arbitrary client updates to the column remain reverted. The RPC also
--   refuses to touch any profile other than the caller's own.

CREATE OR REPLACE FUNCTION public.increment_responses_used(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- auth.uid() reads the request JWT even under SECURITY DEFINER, so this
  -- guard holds: callers may only increment their own counter.
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'increment_responses_used: may only increment your own usage';
  END IF;

  PERFORM set_config('rp.allow_usage_increment', 'on', true);

  UPDATE public.profiles
     SET responses_used_this_month = responses_used_this_month + 1
   WHERE id = p_user_id
  RETURNING responses_used_this_month INTO v_count;

  -- Reset immediately: the flag authorises exactly one increment.
  PERFORM set_config('rp.allow_usage_increment', '', true);

  RETURN v_count;
END;
$$;

-- Extend the migration-006 trigger: the flag set by increment_responses_used
-- permits exactly one +1 change to the usage column through an end-user
-- session; everything else still reverts.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.subscription_tier := OLD.subscription_tier;
    IF coalesce(current_setting('rp.allow_usage_increment', true), '') <> 'on'
       OR NEW.responses_used_this_month <> OLD.responses_used_this_month + 1 THEN
      NEW.responses_used_this_month := OLD.responses_used_this_month;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.increment_responses_used(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_responses_used(uuid) TO authenticated;

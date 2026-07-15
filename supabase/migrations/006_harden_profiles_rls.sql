-- Migration 006: Harden profiles RLS against privilege escalation
--
-- BACKGROUND (security fix):
--   Migration 001 created a profiles UPDATE policy with only
--   `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`. Migration 003
--   later added `subscription_tier` and `responses_used_this_month` columns
--   to profiles. The result: any authenticated user could call
--   `supabase.from('profiles').update({ subscription_tier: 'business' })`
--   directly from the browser (anon key) and grant themselves a paid plan,
--   or zero out `responses_used_this_month` to bypass free-tier usage limits.
--   This is a billing-bypass / privilege-escalation chain.
--
-- FIX:
--   A BEFORE UPDATE trigger forces the billing/usage columns back to their
--   previous values for any update that arrives through an end-user
--   (PostgREST) session. `auth.uid()` is non-null only for end-user requests;
--   it is NULL for the service-role key used by the Stripe webhook, so
--   server-side billing updates still work.

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only constrain end-user (authenticated/anon) sessions. The Stripe
  -- webhook uses the service-role key, for which auth.uid() is NULL.
  IF auth.uid() IS NOT NULL THEN
    NEW.subscription_tier := OLD.subscription_tier;
    NEW.responses_used_this_month := OLD.responses_used_this_month;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;

CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

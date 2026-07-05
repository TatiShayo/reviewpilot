-- Migration 002: Add user settings columns to profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS default_tone TEXT NOT NULL DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS global_signature TEXT,
  ADD COLUMN IF NOT EXISTS max_response_length TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS email_digest TEXT NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS alert_one_star BOOLEAN NOT NULL DEFAULT false;

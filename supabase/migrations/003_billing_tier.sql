-- ReviewPilot Database Schema
-- Migration 003: Billing tier on profiles + usage tracking for plans

-- Add subscription_tier to profiles (free, pro, business)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'pro', 'business'));

-- Add responses_used_this_month to profiles for cache-friendly access
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS responses_used_this_month INTEGER NOT NULL DEFAULT 0;

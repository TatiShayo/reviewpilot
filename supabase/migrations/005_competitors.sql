-- Migration 005: Competitor tracking
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gmb_handle TEXT,
  platform TEXT DEFAULT 'google',
  rating REAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  rating REAL NOT NULL,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitors_user ON public.competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_business ON public.competitors(business_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_competitor ON public.competitor_snapshots(competitor_id);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their competitors"
  ON public.competitors FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage competitor snapshots"
  ON public.competitor_snapshots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.competitors c
    WHERE c.id = competitor_snapshots.competitor_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.competitors c
    WHERE c.id = competitor_snapshots.competitor_id AND c.user_id = auth.uid()
  ));

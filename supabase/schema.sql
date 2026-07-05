-- Database Schema for ReviewPilot

-- Profiles: Holds user information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    company_name TEXT,
    subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'business'
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses: Multiple business locations managed by a user
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gmb_id TEXT,
    category TEXT,
    address TEXT,
    is_connected BOOLEAN DEFAULT TRUE,
    avg_rating NUMERIC(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews: Google/Yelp reviews imported for a business
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    gmb_review_id TEXT UNIQUE,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    is_responded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responses: AI generated or custom replies to reviews
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    tone_used TEXT CHECK (tone_used IN ('professional', 'friendly', 'concise')),
    ai_generated BOOLEAN DEFAULT TRUE,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions: Stripe payment information for premium accounts
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT,
    plan TEXT DEFAULT 'free',
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) and basic indexes
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable public read/write access policies or user specific access policies
-- For the sake of this DB schema definition, we configure standard policies:
CREATE POLICY "Users can view their own profiles" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile details" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        -- Prevent users from modifying their own subscription tier or customer id
        subscription_tier = (SELECT subscription_tier FROM public.profiles WHERE id = auth.uid()) AND
        stripe_customer_id = (SELECT stripe_customer_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage their own businesses" ON public.businesses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view reviews for their businesses" ON public.reviews
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage responses to reviews of their businesses" ON public.responses
    FOR ALL USING (
        review_id IN (
            SELECT r.id FROM public.reviews r
            JOIN public.businesses b ON r.business_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Check constraints for data integrity
ALTER TABLE public.profiles ADD CONSTRAINT check_subscription_tier CHECK (subscription_tier IN ('free', 'pro', 'business'));
ALTER TABLE public.businesses ADD CONSTRAINT check_avg_rating CHECK (avg_rating >= 0.0 AND avg_rating <= 5.0);
ALTER TABLE public.businesses ADD CONSTRAINT check_total_reviews CHECK (total_reviews >= 0);
ALTER TABLE public.subscriptions ADD CONSTRAINT check_plan CHECK (plan IN ('free', 'pro', 'business'));
ALTER TABLE public.subscriptions ADD CONSTRAINT check_status CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete'));

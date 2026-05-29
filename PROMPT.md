You are a senior fullstack engineer. Build ReviewPilot — an AI Google Review Response SaaS — in this Next.js project. YOLO MODE: build everything, make all decisions, no questions asked.

PRODUCT: ReviewPilot helps small businesses respond to Google reviews using AI. Tagline: "Respond to every review in one click."
KILLS: Birdeye ($299/mo), Podium ($249/mo). Our price: Free / $15/mo Pro.

READ PLAN.md FIRST. Start with Phase 1. Complete every unchecked task [ ] in order.
After each task: git commit "✅ [phase]: [task]", mark [x] in PLAN.md, continue immediately.

DESIGN: Dark theme. Orange accent #f97316 (reviews/warmth). Background #0a0906. Surface #141210. Border #2a2520.

KEY IMPLEMENTATION:
AI Response API (src/app/api/ai/respond/route.ts):
  Input: {reviewText, rating, businessName, businessCategory, tone}
  System: "You are a professional business owner. Write a {tone} response to this {rating}-star Google review for {businessName} ({businessCategory}). Be authentic, address specific points in their review, and never sound AI-generated. Return JSON: {variations: [{tone, response}]} — 3 variations: professional, friendly, concise. No preamble. JSON only."
  Model: gpt-4o-mini

DB SCHEMA (create supabase/schema.sql):
  profiles: id, full_name, company_name, subscription_tier, stripe_customer_id
  businesses: id, user_id, name, gmb_id, category, address, is_connected, avg_rating, total_reviews
  reviews: id, business_id, gmb_review_id, author_name, rating, text, posted_at, sentiment, is_responded
  responses: id, review_id, response_text, tone_used, ai_generated, posted_at, approved_by
  subscriptions: id, user_id, stripe_subscription_id, plan, status

Seed 20 realistic fake reviews across 2 fake businesses for demo purposes.

NEVER STOP. Read PLAN.md, find first [ ] task, build it, verify, commit, repeat.

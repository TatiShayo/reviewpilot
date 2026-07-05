## ReviewPilot Build Plan

## PHASE 1: STABILIZE & AUTH
- [x] Build passes clean
- [x] Auth flow works (signup → login → dashboard)
- [x] Supabase schema: profiles, subscriptions, businesses, reviews, responses tables

## PHASE 2: CORE PRODUCT
- [x] Landing page: hero, features, pricing, comparison vs Birdeye, FAQ
- [x] Dashboard: stat cards (reviews today, response rate, avg rating, locations connected)
- [x] Business management: add/edit business (name, GMB ID, category, address)
- [x] Reviews list: shows reviews pulled from GMB (mock data for MVP, real OAuth later)
- [x] Review card: star rating, author, date, review text, "Generate Response" button
- [x] AI response generation: POST /api/ai/respond → OpenAI → returns 3 tone variations (professional, friendly, brief)
- [x] One-click approve: marks response as approved, shows green checkmark
- [x] Post to Google: "Post Response" button (deep-links to GMB for now, full API post after OAuth)
- [x] Response history: list of all posted responses with dates
- [x] Auto-responder toggle: "Auto-reply to all new reviews" (stores preference, triggers on webhook)

## PHASE 3: SETTINGS & BILLING
- [x] Business settings: custom response tone, signature, blacklisted words
- [x] Stripe subscription integration
- [x] Usage tracking (responses used this month)

## PHASE 4: TESTING & PERFORMANCE
- [x] Unit tests for AI response route
- [ ] E2e: review card → generate → approve flow
- [ ] Lighthouse ≥85

## PHASE 5: ADVANCED
- [x] Sentiment analysis: tag reviews as positive/negative/neutral, filter by sentiment
- [x] Response templates library: user-defined templates AI can use as style reference
- [ ] Competitor monitoring: track competitor's review ratings over time
- [ ] Weekly digest email: "You received X reviews this week, response rate: Y%"
- [ ] Multi-language: detect review language, respond in same language

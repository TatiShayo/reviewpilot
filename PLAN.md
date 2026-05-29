## ReviewPilot Build Plan

## PHASE 1: STABILIZE & AUTH
- [x] Build passes clean
- [x] Auth flow works (signup → login → dashboard)
- [x] Supabase schema: profiles, subscriptions, businesses, reviews, responses tables

## PHASE 2: CORE PRODUCT
- [x] Landing page: hero, features, pricing, comparison vs Birdeye, FAQ
- [ ] Dashboard: stat cards (reviews today, response rate, avg rating, locations connected)
- [ ] Business management: add/edit business (name, GMB ID, category, address)
- [ ] Reviews list: shows reviews pulled from GMB (mock data for MVP, real OAuth later)
- [ ] Review card: star rating, author, date, review text, "Generate Response" button
- [ ] AI response generation: POST /api/ai/respond → OpenAI → returns 3 tone variations (professional, friendly, brief)
- [ ] One-click approve: marks response as approved, shows green checkmark
- [ ] Post to Google: "Post Response" button (deep-links to GMB for now, full API post after OAuth)
- [ ] Response history: list of all posted responses with dates
- [ ] Auto-responder toggle: "Auto-reply to all new reviews" (stores preference, triggers on webhook)

## PHASE 3: SETTINGS & BILLING
- [ ] Business settings: custom response tone, signature, blacklisted words
- [ ] Stripe subscription integration
- [ ] Usage tracking (responses used this month)

## PHASE 4: TESTING & PERFORMANCE
- [ ] Unit tests for AI response route
- [ ] E2e: review card → generate → approve flow
- [ ] Lighthouse ≥85

## PHASE 5: ADVANCED
- [ ] Sentiment analysis: tag reviews as positive/negative/neutral, filter by sentiment
- [ ] Response templates library: user-defined templates AI can use as style reference
- [ ] Competitor monitoring: track competitor's review ratings over time
- [ ] Weekly digest email: "You received X reviews this week, response rate: Y%"
- [ ] Multi-language: detect review language, respond in same language

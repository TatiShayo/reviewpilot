     1|## ReviewPilot Build Plan
     2|
     3|## PHASE 1: STABILIZE & AUTH
     4|- [x] Build passes clean
     5|- [x] Auth flow works (signup → login → dashboard)
     6|- [x] Supabase schema: profiles, subscriptions, businesses, reviews, responses tables
     7|
     8|## PHASE 2: CORE PRODUCT
     9|- [x] Landing page: hero, features, pricing, comparison vs Birdeye, FAQ
    10|- [x] Dashboard: stat cards (reviews today, response rate, avg rating, locations connected)
    11|- [x] Business management: add/edit business (name, GMB ID, category, address)
    12|- [x] Reviews list: shows reviews pulled from GMB (mock data for MVP, real OAuth later)
    13|- [x] Review card: star rating, author, date, review text, "Generate Response" button
    14|- [x] AI response generation: POST /api/ai/respond → OpenAI → returns 3 tone variations (professional, friendly, brief)
    15|- [x] One-click approve: marks response as approved, shows green checkmark, persists to Supabase responses table
    16|- [x] Post to Google: "Post Response" button (deep-links to GMB, marks posted_to_google in Supabase)
    17|- [x] Response history: /dashboard/responses page listing all approved/posted responses with dates
    18|- [x] Auto-responder toggle: "Auto-reply to all new reviews" switch on business cards, stores preference in Supabase
    19|
    20|## PHASE 3: SETTINGS & BILLING
    21|- [x] Business settings: custom response tone, signature, blacklisted words
    22|- [x] Stripe subscription integration
    23|- [x] Usage tracking (responses used this month)
    24|
    25|## PHASE 4: TESTING & PERFORMANCE
    26|- [x] Unit tests for AI response route
    27|- [x] E2e: review card → generate → approve flow
    28|- [x] Lighthouse ≥85
    29|
    30|## PHASE 5: ADVANCED
    31|- [x] Sentiment analysis: tag reviews as positive/negative/neutral, filter by sentiment
    32|- [x] Response templates library: user-defined templates AI can use as style reference
    33|- [x] Competitor monitoring: track competitor's review ratings over time
    34|- [ ] Weekly digest email: "You received X reviews this week, response rate: Y%"
    35|- [ ] Multi-language: detect review language, respond in same language
    36|

## PHASE 7: PRODUCTION HARDENING
- [ ] Add Zod validation to ALL API routes (ai/respond, ai/sentiment, businesses, reviews)
- [ ] Add rate limiting to AI respond route: max 10 calls/minute per user (use in-memory Map with timestamp window)
- [ ] Add proper error boundaries to every dashboard page (error.tsx files)
- [ ] Add loading.tsx skeleton screens to every dashboard route
- [ ] Fix any remaining TypeScript errors: npx tsc --noEmit must return 0 errors
- [ ] npm run build must complete with zero errors and zero warnings
- [ ] Add robots.txt and sitemap.xml (use next-sitemap package)
- [ ] Add proper Open Graph meta tags to landing page (title, description, image)
- [ ] All forms: disable submit button while loading, show spinner, re-enable on error
- [ ] All toasts: success=green, error=red, info=blue — consistent throughout

## PHASE 8: REAL GOOGLE MY BUSINESS INTEGRATION (STUB)
- [ ] Create src/lib/gmb.ts — stub class GoogleMyBusinessClient with methods: getReviews(locationId), postReply(reviewId, comment), getLocations(accountId)
- [ ] Each method: if GMB_ACCESS_TOKEN in env — call real API. If not — return realistic mock data
- [ ] Add GMB OAuth flow: /api/auth/gmb/route.ts — redirect to Google OAuth, callback saves token to businesses table
- [ ] "Connect Google Account" button on businesses page triggers OAuth flow
- [ ] Add GMB_CLIENT_ID and GMB_CLIENT_SECRET to .env.local.example
- [ ] Auto-sync reviews: when business connected, fetch latest 50 reviews and upsert into reviews table
- [ ] Sync button on businesses page: "Sync Reviews from Google" → calls getReviews → upserts

## PHASE 9: AUTOMATED RESPONSE WORKFLOWS
- [ ] Auto-responder cron job: create src/app/api/cron/auto-respond/route.ts
  Logic: SELECT reviews WHERE is_responded=false AND business.auto_respond=true
  For each: call AI generate with business tone settings → insert response → mark review responded
  Trigger: via Vercel cron (add vercel.json with cron config) or manual button
- [ ] "Bulk respond" button on reviews page: selects all unresponded reviews → generates AI responses for all → shows approval modal with all responses → one-click post all
- [ ] Response approval queue: new tab on reviews page showing AI-drafted responses awaiting approval
- [ ] Draft responses auto-save: if user edits AI response but doesn't post, save as draft (status='draft')

## PHASE 10: ANALYTICS UPGRADE
- [ ] Response time tracker: when review comes in vs when response posted → calculate avg response hours
- [ ] "Response score" per business: composite of response rate + avg rating + response speed
- [ ] Competitor tracker: user adds competitor GMB handles → weekly scrape of their avg rating → show in analytics
- [ ] Export analytics as PDF: button generates a clean one-page PDF summary (html2canvas + jsPDF or react-pdf)
- [ ] Weekly email digest: Supabase Edge Function or Vercel cron → every Monday → send summary email via Resend
  Template: "Last week: X new reviews, Y responded, avg rating Z"

## PHASE 11: MONETIZATION AND GROWTH
- [ ] Referral system: each user gets referral link /ref/[userId] → referred signups tracked → after 3 referrals, grant 1 month Pro free
- [ ] Public review showcase page: /reviews/[businessSlug] — shows business's best reviews as a public testimonial wall
- [ ] Embed widget: generates script tag for embedding review carousel on any website
- [ ] White-label (Business plan): allow business plan users to remove "Powered by ReviewPilot" branding
- [ ] Upgrade prompt triggers: whenever free user hits limit, show contextual upgrade modal with specific benefit

## PHASE 12: TESTING AND LAUNCH PREP
- [ ] Write Vitest unit tests: AI respond route (mock OpenAI), sentiment analysis, rate limiting logic
- [ ] Write Playwright e2e: landing → signup → add business → generate review response → approve
- [ ] All tests pass: npx vitest run && npx playwright test
- [ ] Lighthouse audit: npx lighthouse http://localhost:3000 — fix until Performance >= 85
- [ ] Mobile audit at 375px: every page usable on phone (owners check reviews on phone)
- [ ] Create README.md: setup instructions, env vars guide, how to connect GMB, deployment to Vercel
- [ ] Create DEPLOY.md: step-by-step Vercel deployment, Supabase setup, Stripe product creation

## PHASE 7: PRODUCTION HARDENING
- [ ] Add Zod validation to ALL API routes (ai/respond, ai/sentiment, businesses, reviews)
- [ ] Add rate limiting to AI respond route: max 10 calls/minute per user (use in-memory Map with timestamp window)
- [ ] Add proper error boundaries to every dashboard page (error.tsx files)
- [ ] Add loading.tsx skeleton screens to every dashboard route
- [ ] Fix any remaining TypeScript errors: npx tsc --noEmit must return 0 errors
- [ ] npm run build must complete with zero errors and zero warnings
- [ ] Add robots.txt and sitemap.xml (use next-sitemap package)
- [ ] Add proper Open Graph meta tags to landing page (title, description, image)
- [ ] All forms: disable submit button while loading, show spinner, re-enable on error
- [ ] All toasts: success=green, error=red, info=blue — consistent throughout

## PHASE 8: REAL GOOGLE MY BUSINESS INTEGRATION (STUB)
- [ ] Create src/lib/gmb.ts — stub class GoogleMyBusinessClient with methods: getReviews(locationId), postReply(reviewId, comment), getLocations(accountId)
- [ ] Each method: if GMB_ACCESS_TOKEN in env — call real API. If not — return realistic mock data
- [ ] Add GMB OAuth flow: /api/auth/gmb/route.ts — redirect to Google OAuth, callback saves token to businesses table
- [ ] "Connect Google Account" button on businesses page triggers OAuth flow
- [ ] Add GMB_CLIENT_ID and GMB_CLIENT_SECRET to .env.local.example
- [ ] Auto-sync reviews: when business connected, fetch latest 50 reviews and upsert into reviews table
- [ ] Sync button on businesses page: "Sync Reviews from Google" → calls getReviews → upserts

## PHASE 9: AUTOMATED RESPONSE WORKFLOWS
- [ ] Auto-responder cron job: create src/app/api/cron/auto-respond/route.ts
  Logic: SELECT reviews WHERE is_responded=false AND business.auto_respond=true
  For each: call AI generate with business tone settings → insert response → mark review responded
  Trigger: via Vercel cron (add vercel.json with cron config) or manual button
- [ ] "Bulk respond" button on reviews page: selects all unresponded reviews → generates AI responses for all → shows approval modal with all responses → one-click post all
- [ ] Response approval queue: new tab on reviews page showing AI-drafted responses awaiting approval
- [ ] Draft responses auto-save: if user edits AI response but doesn't post, save as draft (status='draft')

## PHASE 10: ANALYTICS UPGRADE
- [ ] Response time tracker: when review comes in vs when response posted → calculate avg response hours
- [ ] "Response score" per business: composite of response rate + avg rating + response speed
- [ ] Competitor tracker: user adds competitor GMB handles → weekly scrape of their avg rating → show in analytics
- [ ] Export analytics as PDF: button generates a clean one-page PDF summary (html2canvas + jsPDF or react-pdf)
- [ ] Weekly email digest: Supabase Edge Function or Vercel cron → every Monday → send summary email via Resend
  Template: "Last week: X new reviews, Y responded, avg rating Z"

## PHASE 11: MONETIZATION & GROWTH
- [ ] Referral system: each user gets referral link /ref/[userId] → referred signups tracked → after 3 referrals, grant 1 month Pro free
- [ ] Public review showcase page: /reviews/[businessSlug] — shows business's best reviews as a public testimonial wall
- [ ] Embed widget: generates <script> tag for embedding review carousel on any website
- [ ] White-label (Business plan): allow business plan users to remove "Powered by ReviewPilot" branding
- [ ] Upgrade prompt triggers: whenever free user hits limit, show contextual upgrade modal with specific benefit

## PHASE 12: TESTING & LAUNCH PREP
- [ ] Write Vitest unit tests: AI respond route (mock OpenAI), sentiment analysis, rate limiting logic
- [ ] Write Playwright e2e: landing → signup → add business → generate review response → approve
- [ ] All tests pass: npx vitest run && npx playwright test
- [ ] Lighthouse audit: npx lighthouse http://localhost:3000 — fix until Performance ≥ 85
- [ ] Mobile audit at 375px: every page usable on phone (owners check reviews on phone)
- [ ] Create README.md: setup instructions, env vars guide, how to connect GMB, deployment to Vercel
- [ ] Create DEPLOY.md: step-by-step Vercel deployment, Supabase setup, Stripe product creation

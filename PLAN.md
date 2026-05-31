     1|     1|## ReviewPilot Build Plan
     2|     2|
     3|     3|## PHASE 1: STABILIZE & AUTH
     4|     4|- [x] Build passes clean
     5|     5|- [x] Auth flow works (signup → login → dashboard)
     6|     6|- [x] Supabase schema: profiles, subscriptions, businesses, reviews, responses tables
     7|     7|
     8|     8|## PHASE 2: CORE PRODUCT
     9|     9|- [x] Landing page: hero, features, pricing, comparison vs Birdeye, FAQ
    10|    10|- [x] Dashboard: stat cards (reviews today, response rate, avg rating, locations connected)
    11|    11|- [x] Business management: add/edit business (name, GMB ID, category, address)
    12|    12|- [x] Reviews list: shows reviews pulled from GMB (mock data for MVP, real OAuth later)
    13|    13|- [x] Review card: star rating, author, date, review text, "Generate Response" button
    14|    14|- [x] AI response generation: POST /api/ai/respond → OpenAI → returns 3 tone variations (professional, friendly, brief)
    15|    15|- [x] One-click approve: marks response as approved, shows green checkmark, persists to Supabase responses table
    16|    16|- [x] Post to Google: "Post Response" button (deep-links to GMB, marks posted_to_google in Supabase)
    17|    17|- [x] Response history: /dashboard/responses page listing all approved/posted responses with dates
    18|    18|- [x] Auto-responder toggle: "Auto-reply to all new reviews" switch on business cards, stores preference in Supabase
    19|    19|
    20|    20|## PHASE 3: SETTINGS & BILLING
    21|    21|- [x] Business settings: custom response tone, signature, blacklisted words
    22|    22|- [x] Stripe subscription integration
    23|    23|- [x] Usage tracking (responses used this month)
    24|    24|
    25|    25|## PHASE 4: TESTING & PERFORMANCE
    26|    26|- [x] Unit tests for AI response route
    27|    27|- [x] E2e: review card → generate → approve flow
    28|    28|- [x] Lighthouse ≥85
    29|    29|
    30|    30|## PHASE 5: ADVANCED
    31|    31|- [x] Sentiment analysis: tag reviews as positive/negative/neutral, filter by sentiment
    32|    32|- [x] Response templates library: user-defined templates AI can use as style reference
    33|    33|- [x] Competitor monitoring: track competitor's review ratings over time
    34|    34|- [x] Weekly digest email: "You received X reviews this week, response rate: Y%"
    35|    35|- [x] Multi-language: detect review language, respond in same language
    36|    36|
    37|
    38|## PHASE 7: PRODUCTION HARDENING
    39|- [x] Add Zod validation to ALL API routes (ai/respond, ai/sentiment, businesses, reviews)
    40|- [x] Add rate limiting to AI respond route: max 10 calls/minute per user (use in-memory Map with timestamp window)
    41|- [x] Add proper error boundaries to every dashboard page (error.tsx files)
    42|- [x] Add loading.tsx skeleton screens to every dashboard route
    43|- [x] Fix any remaining TypeScript errors: npx tsc --noEmit must return 0 errors
    44|- [x] npm run build must complete with zero errors and zero warnings
    45|- [x] Add robots.txt and sitemap.xml (use next-sitemap package)
    46|- [x] Add proper Open Graph meta tags to landing page (title, description, image)
    47|- [ ] All forms: disable submit button while loading, show spinner, re-enable on error
    48|- [ ] All toasts: success=green, error=red, info=blue — consistent throughout
    49|
    50|## PHASE 8: REAL GOOGLE MY BUSINESS INTEGRATION (STUB)
    51|- [ ] Create src/lib/gmb.ts — stub class GoogleMyBusinessClient with methods: getReviews(locationId), postReply(reviewId, comment), getLocations(accountId)
    52|- [ ] Each method: if GMB_ACCESS_TOKEN in env — call real API. If not — return realistic mock data
    53|- [ ] Add GMB OAuth flow: /api/auth/gmb/route.ts — redirect to Google OAuth, callback saves token to businesses table
    54|- [ ] "Connect Google Account" button on businesses page triggers OAuth flow
    55|- [ ] Add GMB_CLIENT_ID and GMB_CLIENT_SECRET to .env.local.example
    56|- [ ] Auto-sync reviews: when business connected, fetch latest 50 reviews and upsert into reviews table
    57|- [ ] Sync button on businesses page: "Sync Reviews from Google" → calls getReviews → upserts
    58|
    59|## PHASE 9: AUTOMATED RESPONSE WORKFLOWS
    60|- [ ] Auto-responder cron job: create src/app/api/cron/auto-respond/route.ts
    61|  Logic: SELECT reviews WHERE is_responded=false AND business.auto_respond=true
    62|  For each: call AI generate with business tone settings → insert response → mark review responded
    63|  Trigger: via Vercel cron (add vercel.json with cron config) or manual button
    64|- [ ] "Bulk respond" button on reviews page: selects all unresponded reviews → generates AI responses for all → shows approval modal with all responses → one-click post all
    65|- [ ] Response approval queue: new tab on reviews page showing AI-drafted responses awaiting approval
    66|- [ ] Draft responses auto-save: if user edits AI response but doesn't post, save as draft (status='draft')
    67|
    68|## PHASE 10: ANALYTICS UPGRADE
    69|- [ ] Response time tracker: when review comes in vs when response posted → calculate avg response hours
    70|- [ ] "Response score" per business: composite of response rate + avg rating + response speed
    71|- [ ] Competitor tracker: user adds competitor GMB handles → weekly scrape of their avg rating → show in analytics
    72|- [ ] Export analytics as PDF: button generates a clean one-page PDF summary (html2canvas + jsPDF or react-pdf)
    73|- [ ] Weekly email digest: Supabase Edge Function or Vercel cron → every Monday → send summary email via Resend
    74|  Template: "Last week: X new reviews, Y responded, avg rating Z"
    75|
    76|## PHASE 11: MONETIZATION AND GROWTH
    77|- [ ] Referral system: each user gets referral link /ref/[userId] → referred signups tracked → after 3 referrals, grant 1 month Pro free
    78|- [ ] Public review showcase page: /reviews/[businessSlug] — shows business's best reviews as a public testimonial wall
    79|- [ ] Embed widget: generates script tag for embedding review carousel on any website
    80|- [ ] White-label (Business plan): allow business plan users to remove "Powered by ReviewPilot" branding
    81|- [ ] Upgrade prompt triggers: whenever free user hits limit, show contextual upgrade modal with specific benefit
    82|
    83|## PHASE 12: TESTING AND LAUNCH PREP
    84|- [ ] Write Vitest unit tests: AI respond route (mock OpenAI), sentiment analysis, rate limiting logic
    85|- [ ] Write Playwright e2e: landing → signup → add business → generate review response → approve
    86|- [ ] All tests pass: npx vitest run && npx playwright test
    87|- [ ] Lighthouse audit: npx lighthouse http://localhost:3000 — fix until Performance >= 85
    88|- [ ] Mobile audit at 375px: every page usable on phone (owners check reviews on phone)
    89|- [ ] Create README.md: setup instructions, env vars guide, how to connect GMB, deployment to Vercel
    90|- [ ] Create DEPLOY.md: step-by-step Vercel deployment, Supabase setup, Stripe product creation
    91|
    92|## PHASE 7: PRODUCTION HARDENING
    93|- [ ] Add Zod validation to ALL API routes (ai/respond, ai/sentiment, businesses, reviews)
    94|- [ ] Add rate limiting to AI respond route: max 10 calls/minute per user (use in-memory Map with timestamp window)
    95|- [ ] Add proper error boundaries to every dashboard page (error.tsx files)
    96|- [ ] Add loading.tsx skeleton screens to every dashboard route
    97|- [ ] Fix any remaining TypeScript errors: npx tsc --noEmit must return 0 errors
    98|- [ ] npm run build must complete with zero errors and zero warnings
    99|- [ ] Add robots.txt and sitemap.xml (use next-sitemap package)
   100|- [ ] Add proper Open Graph meta tags to landing page (title, description, image)
   101|- [ ] All forms: disable submit button while loading, show spinner, re-enable on error
   102|- [ ] All toasts: success=green, error=red, info=blue — consistent throughout
   103|
   104|## PHASE 8: REAL GOOGLE MY BUSINESS INTEGRATION (STUB)
   105|- [ ] Create src/lib/gmb.ts — stub class GoogleMyBusinessClient with methods: getReviews(locationId), postReply(reviewId, comment), getLocations(accountId)
   106|- [ ] Each method: if GMB_ACCESS_TOKEN in env — call real API. If not — return realistic mock data
   107|- [ ] Add GMB OAuth flow: /api/auth/gmb/route.ts — redirect to Google OAuth, callback saves token to businesses table
   108|- [ ] "Connect Google Account" button on businesses page triggers OAuth flow
   109|- [ ] Add GMB_CLIENT_ID and GMB_CLIENT_SECRET to .env.local.example
   110|- [ ] Auto-sync reviews: when business connected, fetch latest 50 reviews and upsert into reviews table
   111|- [ ] Sync button on businesses page: "Sync Reviews from Google" → calls getReviews → upserts
   112|
   113|## PHASE 9: AUTOMATED RESPONSE WORKFLOWS
   114|- [ ] Auto-responder cron job: create src/app/api/cron/auto-respond/route.ts
   115|  Logic: SELECT reviews WHERE is_responded=false AND business.auto_respond=true
   116|  For each: call AI generate with business tone settings → insert response → mark review responded
   117|  Trigger: via Vercel cron (add vercel.json with cron config) or manual button
   118|- [ ] "Bulk respond" button on reviews page: selects all unresponded reviews → generates AI responses for all → shows approval modal with all responses → one-click post all
   119|- [ ] Response approval queue: new tab on reviews page showing AI-drafted responses awaiting approval
   120|- [ ] Draft responses auto-save: if user edits AI response but doesn't post, save as draft (status='draft')
   121|
   122|## PHASE 10: ANALYTICS UPGRADE
   123|- [ ] Response time tracker: when review comes in vs when response posted → calculate avg response hours
   124|- [ ] "Response score" per business: composite of response rate + avg rating + response speed
   125|- [ ] Competitor tracker: user adds competitor GMB handles → weekly scrape of their avg rating → show in analytics
   126|- [ ] Export analytics as PDF: button generates a clean one-page PDF summary (html2canvas + jsPDF or react-pdf)
   127|- [ ] Weekly email digest: Supabase Edge Function or Vercel cron → every Monday → send summary email via Resend
   128|  Template: "Last week: X new reviews, Y responded, avg rating Z"
   129|
   130|## PHASE 11: MONETIZATION & GROWTH
   131|- [ ] Referral system: each user gets referral link /ref/[userId] → referred signups tracked → after 3 referrals, grant 1 month Pro free
   132|- [ ] Public review showcase page: /reviews/[businessSlug] — shows business's best reviews as a public testimonial wall
   133|- [ ] Embed widget: generates <script> tag for embedding review carousel on any website
   134|- [ ] White-label (Business plan): allow business plan users to remove "Powered by ReviewPilot" branding
   135|- [ ] Upgrade prompt triggers: whenever free user hits limit, show contextual upgrade modal with specific benefit
   136|
   137|## PHASE 12: TESTING & LAUNCH PREP
   138|- [ ] Write Vitest unit tests: AI respond route (mock OpenAI), sentiment analysis, rate limiting logic
   139|- [ ] Write Playwright e2e: landing → signup → add business → generate review response → approve
   140|- [ ] All tests pass: npx vitest run && npx playwright test
   141|- [ ] Lighthouse audit: npx lighthouse http://localhost:3000 — fix until Performance ≥ 85
   142|- [ ] Mobile audit at 375px: every page usable on phone (owners check reviews on phone)
   143|- [ ] Create README.md: setup instructions, env vars guide, how to connect GMB, deployment to Vercel
   144|- [ ] Create DEPLOY.md: step-by-step Vercel deployment, Supabase setup, Stripe product creation
   145|
   146|
   147|## PHASE 13: REPUTATION MONITORING DASHBOARD
   148|- [ ] Competitor tracking: user adds up to 3 competitor business names → weekly scrape of their Google rating → store in competitor_ratings table with date
   149|- [ ] Competitor rating chart: line chart comparing "My business" vs competitor ratings over time
   150|- [ ] Keyword monitoring: track specific words appearing in reviews (e.g. "slow", "rude", "excellent") → alert when negative keywords spike
   151|- [ ] Review velocity chart: reviews per week over time — detect if review count dropping (bad sign) or spiking (review bomb alert)
   152|- [ ] Sentiment trend: rolling 30-day sentiment score — is it improving or declining?
   153|- [ ] Alert system: email alert when: new 1-star review received, competitor rating changes ±0.2, review bomb detected (5+ negative reviews in 1 day)
   154|
   155|## PHASE 14: WHITE-LABEL & AGENCY FEATURES
   156|- [ ] Business plan white-label: remove "Powered by ReviewPilot" from response emails and portal
   157|- [ ] Custom email domain: Business plan users can send response emails from their own domain via Resend custom domain
   158|- [ ] Agency mode: one account manages multiple client businesses → toggle between clients in sidebar
   159|- [ ] Client reporting: agency can generate PDF report per client showing response rate, rating trend, reviews this month
   160|- [ ] Team permissions: Business plan → invite team member → roles: Admin (full), Manager (add businesses, respond), Viewer (read only)
   161|- [ ] Client dashboard share: agency generates read-only dashboard link to share with client — no login needed
   162|
   163|## PHASE 15: REVIEW GENERATION TOOLS
   164|- [ ] Review request campaigns: upload CSV of customer emails → generate personalized "Please leave us a review" email → send via Resend → track opens and clicks
   165|- [ ] Review request templates: 3 templates (post-purchase, post-service, follow-up) with merge tags {{customerName}}, {{businessName}}, {{reviewUrl}}
   166|- [ ] QR code generator: /dashboard/tools/qr-code — generates QR code linking to Google review page — downloadable as PNG
   167|- [ ] Review link generator: input GMB URL → generate short review link → copy button
   168|- [ ] NPS survey: simple 1-question email survey ("How likely are you to recommend us? 1-10") → responses tracked → NPS score calculated
   169|- [ ] Smart send timing: AI suggests best time to send review requests based on customer behavior patterns (hardcoded heuristics for MVP)
   170|
   171|## PHASE 16: PLATFORM EXPANSION
   172|- [ ] Yelp integration: stub Yelp Fusion API client in src/lib/yelp.ts → fetch reviews → same review card UI
   173|- [ ] TripAdvisor integration: stub API client in src/lib/tripadvisor.ts → document in README how to get API access
   174|- [ ] Facebook Reviews: stub Meta Graph API client in src/lib/facebook-reviews.ts
   175|- [ ] Unified inbox: all reviews from all platforms in one feed — platform filter chips at top
   176|- [ ] Platform priority settings: user sets which platforms matter most → affects notification priorities
   177|
   178|## PHASE 17: LAUNCH
   179|- [ ] Trial: 14-day free trial on Pro (no card required) → email sequence: day 3 "How's it going?", day 10 "Trial ending in 4 days", day 14 "Upgrade to keep responding"
   180|- [ ] Onboarding checklist: when user first signs up, show 5-step checklist (Add business → Import reviews → Generate first response → Set up auto-reply → Invite team)
   181|- [ ] Success metric: dashboard shows "You've responded to X% of reviews this month — industry average is 45%"
   182|- [ ] In-app NPS survey: after 14 days → "How likely are you to recommend ReviewPilot? 1-10" → captures feedback
   183|- [ ] Lighthouse ≥ 85 on all pages
   184|- [ ] Full README.md + DEPLOY.md
   185|- [ ] Product Hunt assets in assets/product-hunt/
   186|

## PHASE 13: REPUTATION MONITORING DASHBOARD
- [ ] Competitor tracking: user adds up to 3 competitor business names → weekly scrape of their Google rating → store in competitor_ratings table with date
- [ ] Competitor rating chart: line chart comparing "My business" vs competitor ratings over time
- [ ] Keyword monitoring: track specific words appearing in reviews (e.g. "slow", "rude", "excellent") → alert when negative keywords spike
- [ ] Review velocity chart: reviews per week over time — detect if review count dropping (bad sign) or spiking (review bomb alert)
- [ ] Sentiment trend: rolling 30-day sentiment score — is it improving or declining?
- [ ] Alert system: email alert when: new 1-star review received, competitor rating changes ±0.2, review bomb detected (5+ negative reviews in 1 day)

## PHASE 14: WHITE-LABEL & AGENCY FEATURES
- [ ] Business plan white-label: remove "Powered by ReviewPilot" from response emails and portal
- [ ] Custom email domain: Business plan users can send response emails from their own domain via Resend custom domain
- [ ] Agency mode: one account manages multiple client businesses → toggle between clients in sidebar
- [ ] Client reporting: agency can generate PDF report per client showing response rate, rating trend, reviews this month
- [ ] Team permissions: Business plan → invite team member → roles: Admin (full), Manager (add businesses, respond), Viewer (read only)
- [ ] Client dashboard share: agency generates read-only dashboard link to share with client — no login needed

## PHASE 15: REVIEW GENERATION TOOLS
- [ ] Review request campaigns: upload CSV of customer emails → generate personalized "Please leave us a review" email → send via Resend → track opens and clicks
- [ ] Review request templates: 3 templates (post-purchase, post-service, follow-up) with merge tags {{customerName}}, {{businessName}}, {{reviewUrl}}
- [ ] QR code generator: /dashboard/tools/qr-code — generates QR code linking to Google review page — downloadable as PNG
- [ ] Review link generator: input GMB URL → generate short review link → copy button
- [ ] NPS survey: simple 1-question email survey ("How likely are you to recommend us? 1-10") → responses tracked → NPS score calculated
- [ ] Smart send timing: AI suggests best time to send review requests based on customer behavior patterns (hardcoded heuristics for MVP)

## PHASE 16: PLATFORM EXPANSION
- [ ] Yelp integration: stub Yelp Fusion API client in src/lib/yelp.ts → fetch reviews → same review card UI
- [ ] TripAdvisor integration: stub API client in src/lib/tripadvisor.ts → document in README how to get API access
- [ ] Facebook Reviews: stub Meta Graph API client in src/lib/facebook-reviews.ts
- [ ] Unified inbox: all reviews from all platforms in one feed — platform filter chips at top
- [ ] Platform priority settings: user sets which platforms matter most → affects notification priorities

## PHASE 17: LAUNCH
- [ ] Trial: 14-day free trial on Pro (no card required) → email sequence: day 3 "How's it going?", day 10 "Trial ending in 4 days", day 14 "Upgrade to keep responding"
- [ ] Onboarding checklist: when user first signs up, show 5-step checklist (Add business → Import reviews → Generate first response → Set up auto-reply → Invite team)
- [ ] Success metric: dashboard shows "You've responded to X% of reviews this month — industry average is 45%"
- [ ] In-app NPS survey: after 14 days → "How likely are you to recommend ReviewPilot? 1-10" → captures feedback
- [ ] Lighthouse ≥ 85 on all pages
- [ ] Full README.md + DEPLOY.md
- [ ] Product Hunt assets in assets/product-hunt/

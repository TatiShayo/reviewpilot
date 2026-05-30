You are a senior fullstack engineer finishing ReviewPilot — an AI Google Review Response SaaS.

═══ CURRENT STATE ═══
13 of 24 tasks done. In PHASE 3: SETTINGS & BILLING.
11 tasks remaining. The app has auth, dashboard, reviews page with AI response generation, businesses page, analytics page. Need settings, billing, sentiment analysis, and remaining polish.

═══ REMAINING TASKS (build in this exact order) ═══

Task 1: Settings page at /dashboard/settings
- Tabs: Profile | Response Defaults | Notifications
- Profile tab: name, email, company name form fields
- Response Defaults tab: default tone dropdown (Professional/Friendly/Concise), global signature text input (e.g. "— The [Name] Team"), max response length slider (short/medium/long)
- Notifications tab: email digest selector (Daily/Weekly/Never), checkbox for "Alert me when a 1-star review comes in"
- Save button per tab, toast confirmation on save (sonner)
- Read current profile data from Supabase profiles table, update on save

Task 2: Stripe billing integration
- Create /api/stripe/checkout route: takes priceId, creates Stripe Checkout Session, returns URL
- Create /api/webhooks/stripe route: handles checkout.session.completed (update profiles.subscription_tier), handles invoice.paid, customer.subscription.updated/deleted
- Create subscriptions table migration: id, user_id, stripe_subscription_id, plan, status, current_period_end
- Billing page at /dashboard/billing: current plan badge, usage stat (X responses used this month), upgrade CTA buttons for Pro ($15) and Business ($29), if subscribed show "Manage Subscription" link to Stripe Customer Portal
- Usage gating helper: check responses_used_this_month vs plan limit before allowing new responses

Task 3: Sentiment analysis
- Create /api/ai/sentiment route: takes review text, returns {sentiment: "positive"|"neutral"|"negative", score: 0-100}
- Add sentiment column to reviews table
- When reviews are fetched or imported, call sentiment API and store result
- Add filter tabs on /dashboard/reviews: All | Positive | Neutral | Negative
- Sentiment badge on review cards: green=positive, gray=neutral, red=negative

Task 4: Response templates library
- Add templates table: id, user_id, name, body_text, tone, created_at
- Settings page gets new "Templates" tab
- Template CRUD: create/edit/delete named templates (textarea with suggested tone)
- When AI generates responses, optionally use a template as style reference in the prompt

Task 5: Weekly digest email
- /api/cron/digest route: for each user with digest enabled, query reviews from past 7 days, calculate response rate
- Send email via Resend: "You received X reviews this week. You responded to Y (Z%). Best response: [quote]"
- Style the email with HTML (orange accent, clean layout)

Task 6: Multi-language detection
- When rendering review, detect language (use AI or Accept-Language header fallback)
- Flag on review card showing detected language (e.g. 🇪🇸 Spanish)
- AI response generator receives source_language param, responds in same language
- Add language filter to reviews page

═══ DESIGN ═══
Dark theme: bg #0a0906, surface #141210, border #2a2520, orange accent #f97316.
Stars: #eab308 filled, #374151 empty.
Sentiment badges: positive=#10b981 bg-emerald-950, neutral=#6b7280 bg-zinc-900, negative=#ef4444 bg-red-950.

═══ RULES ═══
npm run build after every task — must pass. Fix all tsc errors.
git add -A && git commit -m "done: [task name]" per task.
Mark [x] in PLAN.md + append to PROGRESS.md.
Skip any task that fails twice. Keep going. No questions.

Start with Task 1: Settings page at /dashboard/settings.

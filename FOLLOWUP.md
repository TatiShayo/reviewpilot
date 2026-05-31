You are a senior fullstack engineer finishing ReviewPilot — an AI Google Review Response SaaS.

═══ CURRENT STATE ═══
Tasks done: 13/24. Currently in PHASE 3: SETTINGS & BILLING.
11 tasks remaining — Settings page, Stripe billing, usage tracking, sentiment analysis, response templates, competitor monitoring, weekly digest, multi-language, testing.

═══ REMAINING TASKS (build these in order) ═══
1. Business settings page at /dashboard/settings — tabs: Profile (name, email, company), Response Defaults (tone: Professional/Friendly/Concise, signature, max length), Blacklisted words, Notifications (email digest daily/weekly/never, alert on 1-star review)
2. Stripe subscription integration — checkout API route at /api/stripe/checkout, webhook at /api/webhooks/stripe handling checkout.session.completed and subscription events, billing page at /dashboard/billing showing current plan, usage stats, upgrade/downgrade, Stripe Customer Portal link
3. Usage tracking — middleware/helper function: check reviews.responded this month vs plan limit (Free: 50, Pro: unlimited, Business: unlimited), return error if exceeded
4. Sentiment analysis — when reviews are imported, run AI sentiment scoring (positive/neutral/negative + 0-100 score), store in reviews.sentiment, add filter tabs on reviews page
5. Response templates library — CRUD UI in settings for user-defined templates, AI uses them as style reference when generating responses
6. Weekly digest email — cron endpoint at /api/cron/digest that queries last 7 days of reviews per user, aggregates response rate, sends formatted email via Resend
7. Multi-language — detect review language (accept-language or content detection), AI responds in same language, flag on review card showing detected language

═══ DESIGN SYSTEM ═══
Dark theme: bg #0a0906, surface #141210, border #2a2520, accent #f97316 orange.
Star ratings: #eab308 filled, #374151 empty.
Sentiment badges: positive=#10b981, neutral=#6b7280, negative=#ef4444.

═══ RULES ═══
- Run npm run build after every task — it must pass before committing
- Run npx tsc --noEmit and fix all errors
- git add -A && git commit -m "done: [task]" after each completed task
- Mark [x] in PLAN.md and append to PROGRESS.md
- If stuck on task after 2 attempts: write to LEARNINGS.md as BLOCKED, skip to next
- No questions. No confirmation. Keep building until all 11 tasks are done.

Start with task 1: Business settings page at /dashboard/settings.

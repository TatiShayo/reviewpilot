You are a senior fullstack engineer. Continue building reviewpilot autonomously.

SESSION STATE:
Tasks remaining: 76
Tasks completed: 24
Current phase: PHASE 7: PRODUCTION HARDENING
Recent commits:
e8b6899 done: Weekly digest email — cron route at /api/cron/digest, Resend template, Vercel cron config
c5108e7 done: Competitor monitoring — competitors table, API CRUD, snapshots, analytics dashboard page
c48214a done: Response templates library — AI respond route now fetches user templates and uses them as style references
122e73e done: Lighthouse >=85 — next.config optimization, removed unused deps, loading/error/not-found boundaries, OG metadata, Nav CLS fix
7a0404d done: Sentiment analysis API route

KNOWN ISSUES FROM PREVIOUS SESSIONS:
# ReviewPilot Learnings & Known Issues

## Network Issue (2026-05-30)
- Stuck at 18/100 — PHASE 4: TESTING & PERFORMANCE
- CommandCode keeps failing with "Network connection lost" -> exit code 1
- Session #3 (20:44) and #4 (20:57) both failed with same error
- Session #4 ran 19 min at 0% CPU before hanging
- Root cause: transient network error in CommandCode, not project bug
- STATUS: Not blocking — network is intermittent per studiopilot recovery
- 26 consecutive "no progress" entries as of 21:15


═══ PRODUCT SPECIFICATION (from batch2-build-prompts) ═══
## PROMPT 1 — BUILD REVIEWPILOT
*(Open reviewpilot/ in a new CMD → paste this)*

---

```
You are a senior fullstack engineer. Build ReviewPilot — a complete AI Google Review Response SaaS — in this Next.js project. YOLO MODE: build every page, every feature, every API route. No questions. No pausing. Make all decisions.

═══════════════════════════════════════
PRODUCT OVERVIEW
═══════════════════════════════════════
ReviewPilot helps small businesses respond to Google/Yelp reviews using AI. One click turns any review into a polished, human-sounding reply.

Tagline: "Respond to every review in one click. Sound human every time."
Target: Restaurants, salons, clinics, gyms, hotels, any local business with online reviews.

Pricing:
- Free: 50 AI responses/month, 1 location
- Pro ($15/mo): Unlimited responses, 3 locations, sentiment analytics
- Business ($29/mo): Unlimited + 10 locations + white-label + team access + auto-reply toggle

═══════════════════════════════════════
TECH STACK
═══════════════════════════════════════
- Next.js 14 App Router + TypeScript
- Supabase (auth + DB)
- Stripe (subscriptions)
- OpenAI GPT-4o-mini
- Resend (emails)
- shadcn/ui + Tailwind (dark, orange accent #f97316)
- Recharts (analytics)
- Framer Motion + Sonner

═══════════════════════════════════════
ALL PAGES TO BUILD
═══════════════════════════════════════

1. LANDING PAGE (src/app/page.tsx)
   - Navbar: logo, features, pricing, login, "Start Free"
   - Hero: "Respond to Every Review in One Click" — big headline, before/after demo widget showing a real-looking 1-star review being turned into a professional response. Orange CTA button.
   - Social proof: "Trusted by 2,400+ local businesses" + 5 industry type badges (Restaurant, Clinic, Salon, Hotel, Retail)
   - Features section: 6 cards — AI Response Generation, Sentiment Analysis, Multi-Platform (Google/Yelp/TripAdvisor), Auto-Reply Mode, Tone Customization, Weekly Digest Report
   - Problem/Solution: "53% of customers expect a reply within 7 days. Most businesses respond to less than 10% of reviews. ReviewPilot fixes that."
   - Comparison table: ReviewPilot vs Birdeye ($299/mo) vs Podium ($249/mo) vs Grade.us ($110/mo) — you win on price and simplicity
   - Pricing: 3 cards (Free / Pro $15 / Business $29) with Stripe checkout buttons
   - Testimonials: 3 realistic placeholders from restaurant owner, clinic manager, hotel GM
   - FAQ: 6 questions (how does AI response work, which platforms, can I edit before posting, etc.)
   - Footer

2. AUTH (same pattern as PostPilot):
   - src/app/auth/login/page.tsx
   - src/app/auth/signup/page.tsx
   - src/app/auth/reset/page.tsx
   - src/app/auth/callback/route.ts

3. DASHBOARD (src/app/dashboard/page.tsx)
   - Protected layout with sidebar
   - Sidebar: logo, nav links (Dashboard, Reviews, Businesses, Analytics, Settings, Billing), user avatar, plan badge
   - Stats row: Reviews Today (real from DB), Response Rate (responded/total %), Average Rating, Locations Connected
   - Review feed: latest 10 unresponded reviews across all locations, sorted by date, each with star rating, author, snippet, "Generate Response" button
   - Activity feed: recent responses posted
   - Quick action: "Auto-respond to all pending" button (generates + queues responses for all unresponded reviews)

4. REVIEWS PAGE (src/app/dashboard/reviews/page.tsx)
   - Filter tabs: All | Unresponded | Responded | By Rating (1★ 2★ 3★ 4★ 5★) | By Sentiment
   - Review cards: author avatar (initial), star rating (colored stars), review text, date, business tag, sentiment badge (Positive/Neutral/Negative)
   - "Generate Response" button on each unresponded review → opens response panel
   - Response panel (slide-out sheet): shows 3 AI-generated variations with tone labels (Professional / Friendly / Concise), each with copy + "Approve & Post" button
   - Approved response shows below review with green "Responded" badge
   - Search reviews by keyword

5. BUSINESSES (src/app/dashboard/busine
═══ END SPEC ═══

STARTUP SEQUENCE (do this first, every session):
1. Run: git log --oneline -10
2. Run: npm run build 2>&1 | tail -20
3. Run: npx tsc --noEmit 2>&1 | head -15
4. Read PLAN.md — find the first unchecked [ ] task in the lowest-numbered phase
5. Read LEARNINGS.md — avoid known blocked approaches

LOOP PROTOCOL:
Read PLAN.md → first [ ] task → implement it → run npm run build (must pass) →
git add -A && git commit -m "done: [task name]" → mark [x] in PLAN.md →
append to PROGRESS.md → move to next task IMMEDIATELY.

Never stop between tasks.
Never ask for confirmation.
Never wait for input.
If a task fails twice: write to LEARNINGS.md as BLOCKED, skip it, continue to next.
Install any npm package you need: npm install [package].
Search the web if stuck on an error.

Build exactly to the PRODUCT SPECIFICATION above. Every page, feature, and design detail must match.

You have 76 tasks remaining. Complete as many as possible before context runs out.
Start now. First task. Go.

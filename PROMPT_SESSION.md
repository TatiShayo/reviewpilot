You are continuing ReviewPilot. PLAN.md needs auditing — some built features aren't marked done.

═══ CURRENT STATE ═══
PLAN.md says 14 done. Likely more is built — audit needed.

═══ STEP 1: AUDIT WHAT'S ACTUALLY BUILT ═══
For each unchecked task, check if it's already built:

1. Stripe subscription integration:
   - Check: does /api/stripe/checkout exist? /api/webhooks/stripe? /dashboard/billing page?
   - If files exist, mark [x] in PLAN.md

2. Usage tracking:
   - Check: src/lib/gate.ts or similar? Is responses_used_this_month column used?
   - If exists, mark [x] in PLAN.md

3. Sentiment analysis:
   - Check: /api/ai/sentiment route? Sentiment column in reviews? Filter on reviews page?
   - If partially done but missing API route, just build the missing piece

After audit, RECOUNT: grep -c '\[x\]' PLAN.md to get true count.

═══ THEN BUILD REMAINING (in order) ═══

Task A: Unit tests for AI response route
- npm install -D vitest if not installed
- Create tests/api/ai-respond.test.ts
- Test: POST /api/ai/respond returns 3 variations, handles errors

Task B: E2E test — review card → generate → approve flow
- npm install -D cypress if not installed
- cypress/e2e/review-flow.cy.ts

Task C: Lighthouse ≥85
- npm install -D @lhci/cli, npx lhci autorun, fix

Task D: Sentiment analysis (if API route missing)
- /api/ai/sentiment: {reviewText} → {sentiment, score}
- Filter tabs on reviews page
- Badge per card

Task E: Response templates library
- Templates table + CRUD in settings
- AI references template as style

Task F: Weekly digest email
- /api/cron/digest: query week's reviews, response rate
- Send via Resend

Task G: Multi-language
- Detect language, respond in same language, flag on card

═══ RULES ═══
npm run build after every task. Must pass.
git add -A && git commit -m "done: [task]" per task.
Mark [x] in PLAN.md + PROGRESS.md. Skip after 2 failures.

Start: Audit what's built. Then build remaining.

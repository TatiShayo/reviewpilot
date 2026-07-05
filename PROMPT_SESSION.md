Build the Reputation Monitoring Dashboard for ReviewPilot.

You are a senior fullstack engineer. Read existing code patterns and build exactly what follows.

═══ CURRENT STATE ═══
Build passes. Core product works: reviews from GMB, AI response generation, auto-responder, billing.

═══ TASKS ═══

Task 1: Competitor tracking
File: src/lib/reputation.ts (new)
Functions: addCompetitor(businessId, name, platform), getCompetitorRatings(businessId), storeCompetitorSnapshot(businessId, competitorId, rating, date).
Competitor data stored in competitor_ratings table: id, business_id, competitor_name, rating, date, created_at.

Task 2: Competitor rating chart
File: src/app/dashboard/reputation/_components/competitor-chart.tsx (new)
"use client" component. Recharts LineChart. X-axis: date (weekly). Lines: "My Business" rating (blue #3b82f6) vs each competitor rating (different colors). Legend at bottom. height={300}.

Task 3: Keyword monitoring
File: src/app/dashboard/reputation/_components/keyword-monitor.tsx (new)
"use client" component. Input: reviews array. Shows tracked keywords with count and trend arrow. Default tracked words: "slow", "rude", "excellent", "amazing", "expensive". Highlight with red (negative) or green (positive). Recent mentions shown below.

Task 4: Review velocity chart
File: src/app/dashboard/reputation/_components/velocity-chart.tsx (new)  
"use client" component. Recharts BarChart. X-axis: weeks (last 12 weeks). Y-axis: review count. Color: amber (#f59e0b). Alert badge if count drops >50% from previous week.

═══ DESIGN ═══
Blue primary, gray borders, Card wrapper per chart. 2-col grid on desktop, single on mobile.
Recharts already installed. Use existing shadcn components.

═══ RULES ═══
Output COMPLETE file contents. Create all 4 files. Import types from @/lib/types.

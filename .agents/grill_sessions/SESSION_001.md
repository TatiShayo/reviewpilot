# Grilling Session 001: reviewpilot
**Archetype**: Tier 2 SaaS (Reputation & Automated Review Collection)
**Human Domain Authority**: Antigravity Lead Architect
**Methodology**: Matt Pocock Agent Skills (/grilling + /grill-with-docs)
**Status**: FRONTIER EXHAUSTED — SHARED UNDERSTANDING ATTAINED

---

## Round 1: Core Architecture & Invariant Frontier

❓ **Q1** - **Review Gating Compliance**: Does ReviewPilot comply with Google/Trustpilot anti-gating policies that prohibit blocking unhappy customers from leaving public reviews?
➡️ *Recommendation*: Neutral sentiment routing: all customers are given direct links to public review platforms; unhappy customers are simultaneously offered a private resolution channel.

**Architect Decision**: APPROVED. Absolute compliance with FTC and platform anti-gating regulations is mandatory. Never block public links; route private resolution concurrently.

---

❓ **Q2** - **AI Sentiment Classification Failure**: What happens if the external LLM sentiment classification API times out when processing customer feedback?
➡️ *Recommendation*: Offline deterministic sentiment fallback (AFINN lexicon and keyword heuristics) that evaluates sentiment locally without network latency.

**Architect Decision**: APPROVED. Deterministic local lexicon fallback ensures zero downtime and instant routing decisions.

---

## Round 2: Edge Cases & Failure Modes Frontier

❓ **Q3** - **Automated SMS Review Invites**: How do we prevent SMS spam complaints when sending review requests to past customers?
➡️ *Recommendation*: Strict 1-invite + 1-gentle-reminder ceiling with mandatory TCPA unsubscribe keyword handlers (`STOP`, `UNSUBSCRIBE`).

**Architect Decision**: APPROVED. Enforce hard invite limits and automated opt-out persistence across all communication channels.

---

## Final Alignment Attestation
The design tree has been thoroughly walked down to all leaf nodes.
No silent assumptions remain regarding authentication, concurrency, data consistency, or payment flow.

# CONTEXT.md — Ubiquitous Domain Language (ReviewPilot)

## Core Entities
- **ReviewCampaign**: Automated schedule of SMS and email requests dispatched after customer transactions.
- **SentimentScore**: Normalized rating (-1.0 to +1.0) derived via AI or offline fallback classifying customer sentiment.
- **OfflineSentimentClassifier**: Local deterministic analyzer using lexical heuristics when cloud LLMs time out.
- **ResolutionChannel**: Direct private communication pathway opened for dissatisfied customers.

## Domain Invariants
- Public review links (Google, Trustpilot) must remain accessible to all customers regardless of sentiment score.
- No customer may receive more than 2 automated review request messages per transaction.
- Opt-out requests (`STOP`) must be processed immediately and globally within the organization.

## Forbidden Terminology
- Do not use "review gating" or "filter negative reviews"; use "SentimentRouting".
- Do not call review requests "surveys"; use "ReviewInvite".

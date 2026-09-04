# SPEC 001: Reputation Management & Sentiment Routing Engine

## Problem Statement
Local businesses struggle to collect consistent Google reviews and fear negative public ratings from resolvable misunderstandings.

## Solution
An automated review collection engine that requests feedback after purchases, routes unhappy customers to private managers for resolution, and keeps public review links FTC-compliant.

## User Stories
1. As a business owner, I want automated SMS review invites sent after sales, so that happy customers leave Google reviews.
2. As a dissatisfied customer, I want to voice my complaint directly to management, so that my issue is solved privately.
3. As a business owner, I want review requests to function even if external AI is down, so that our customer flow is never lost.

## Implementation Decisions
- Implement offline sentiment parser in `src/lib/sentiment.ts`.
- TCPA unsubscribe handler in `src/lib/messaging.ts`.
- Public platform link generator in `src/lib/platforms.ts`.

## Testing Decisions
- Seam: `tests/offline-sentiment-fallback.test.ts`.
- Verify classification accuracy on positive, negative, and neutral customer feedback without network calls.

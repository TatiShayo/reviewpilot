# ADR 0001: FTC-Compliant Sentiment Routing and Offline Lexicon Fallback

## Context
Businesses need more positive reviews, but violating Google or FTC anti-gating rules leads to severe penalties and account suspension.

## Decision
1. **Compliant Sentiment Routing**: Offer private resolution to unhappy customers while keeping public review links open to all.
2. **Offline Sentiment Fallback**: Utilize local rule-based lexical analysis when cloud AI APIs fail or experience high latency.
3. **Strict TCPA Safeguards**: Hard limits on review request frequency with automated opt-out processing.

## Consequences
- **Positive**: 100% regulatory compliance and uninterrupted service during external AI outages.
- **Negative**: Rule-based sentiment fallback has slightly lower nuance on complex sarcasm.

# TICKETS — ReviewPilot Reputation Pipeline

## [TICKET-001] Offline Lexicon Sentiment Fallback Engine
- **Blocked by**: None
- **Delivers**: Fast, deterministic local sentiment scorer operational during cloud AI outages.
- **Verification**: `tests/offline-sentiment-fallback.test.ts`

## [TICKET-002] FTC-Compliant Dual-Path Review Router
- **Blocked by**: TICKET-001
- **Delivers**: Feedback screen presenting private manager resolution alongside open public review platform links.
- **Verification**: UI routing tests ensuring public links are never hidden or disabled.

## [TICKET-003] TCPA Auto-Unsubscribe Keyword Handler
- **Blocked by**: TICKET-002
- **Delivers**: Inbound SMS parser processing STOP/UNSUBSCRIBE keywords with instant global opt-out.
- **Verification**: Message inbound webhook unit tests asserting phone suppression.

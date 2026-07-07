# Marketplace Phase 5E-C — Proposal Polish + Exchange-to-Proposal Flow

**Status:** Implemented  
**Depends on:** 4A Value Exchange, 4D Exchange Matching, 4F Exchange Suggestions, 5B-A Taxonomy, 5B-D Barter Openness, 5E-B Commerce Alignment, 5G-B Deal Commitment, 5G-C Community Courier, 5G-D Operations Parity

## Goal

Complete the proposal experience for the HomeCheff economy: money, barter, hybrid settlements, and a direct path from exchange suggestions to proposals — without new payment rails, notifications, or ranking changes.

## Delivered

### 5E-C.1 — Counter proposal expansion

- `CounterProposalForm` replaces money-only counter UI.
- Reuses `ProposalFieldsSection` and `ProposalSummaryPreview`.
- Counter can edit: amount, settlement type, accepted/requested taxonomy values, title, description, date/window, fulfillment, payment path (when product-bound).

### 5E-C.2 — Exchange suggestion → proposal

- New CTA `start_proposal` on `ExchangeSuggestionCard` (detail, profile, sidebar, feed, mobile via shared card).
- `StartChatButton` accepts `proposalPrefill` + `openProposalAfterStart`; stores prefill in sessionStorage before chat deep-link.
- `CreateProposalSheet` consumes prefill on open.

### 5E-C.3 — Proposal prefill engine

- `lib/proposals/proposal-prefill.ts` — `resolveProposalPrefill`, `proposalPrefillFromSuggestionCard`.
- `lib/proposals/proposal-prefill-storage.ts` — session bridge for cross-route prefill.
- Sources: `listing`, `exchange_suggestion`, `counter`, `conversation`.
- Uses only existing listing/suggestion/proposal data; taxonomy overlap from exchange match.

### 5E-C.4 — Proposal summary

- `ProposalSummaryPreview` shows offer, counter-offer (requested values), payment method, conditions before send.
- Used in `CreateProposalSheet` and `CounterProposalForm`.

### 5E-C.5 — Deal readiness validation

- `lib/proposals/proposal-readiness.ts` — `validateProposalReadiness`, `formValuesToApiPayload`.
- Checks: auth, title, settlement consistency, barter openness, stock, checkout availability, taxonomy id validity, listing active.

### 5E-C.6 — Analytics

- `lib/proposals/proposal-analytics.ts` — GA4 events: `proposal_opened`, `proposal_prefilled`, `proposal_countered`, `proposal_sent`, `proposal_accepted`, `proposal_rejected`.
- Properties: `source`, `listing_id`, `settlement_type`, `exchange_suggestion_used`, `taxonomy_overlap_count`.

### 5E-C.7 — E2E validator

- `scripts/validate-marketplace-proposal-flow.ts` — eight scenario checks (logic + wiring).

### 5E-C.8 — i18n

- Namespaces: `marketplace.proposals.summary`, `marketplace.proposals.counter`, `marketplace.proposals.prefill`.
- `marketplace.exchangeSuggestions.ctas.startProposal`.
- New `proposal.errors.*` readiness keys (nl/en parity).

## Key files

| Area | Path |
|------|------|
| Prefill | `lib/proposals/proposal-prefill.ts` |
| Readiness | `lib/proposals/proposal-readiness.ts` |
| Analytics | `lib/proposals/proposal-analytics.ts` |
| Create sheet | `components/chat/proposals/CreateProposalSheet.tsx` |
| Counter | `components/chat/proposals/CounterProposalForm.tsx` |
| Summary | `components/chat/proposals/ProposalSummaryPreview.tsx` |
| Exchange CTA | `components/marketplace/exchange-suggestions/ExchangeSuggestionCard.tsx` |
| Validator | `scripts/validate-marketplace-proposal-flow.ts` |

## Validation

```bash
npx tsx scripts/validate-marketplace-proposal-flow.ts
npx tsx scripts/validate-marketplace-exchange-proposal-conversion.ts
npm run lint
npm run build
```

## Out of scope (unchanged)

Tikkie, escrow, push notifications, multi-step exchange chains, ranking, tile redesign.

# UX Finalization — Phase 8C Reverse Discovery (Pilot Complete)

Date: 2026-07-08

## Goal

Make value-based discovery as natural as money-based search: **“What can I get with what I have?”**

## Shipped

### Bidirectional discovery

- `DiscoveryDirectionToggle` — Ik zoek / Ik bied
- Offer mode elevates `AcceptedValuesDiscoveryFilter` to primary filter tier
- Shopping-with chips: “Ik shop met: 🍅 …”

### Reverse discovery session → proposal

- `reverse-discovery-session.ts` persists selected offer ids
- `StartChatButton` merges into `proposal-prefill`
- `resolveProposalPrefill` prefills `requestedValueTaxonomyIds`

### Empty states

- Similar taxonomy values (siblings)
- Nearby category suggestions

### Listing detail

- Heading: “Deze aanbieder accepteert” / “This seller accepts”

### Community taxonomy expansion

- `PendingAcceptedValueProposal` model + API
- `PendingAcceptedValueProposalForm` in picker & discovery filter
- Pending ids (`pending:*`) flow through normalize, discovery, tiles, detail, proposals
- Audit endpoint: `?audit=1`

## Files (core)

| Area | Path |
|------|------|
| Discovery | `lib/marketplace/discovery/reverse-discovery-session.ts`, `suggest-accepted-value-alternatives.ts` |
| Pending | `lib/marketplace/pending-accepted-values/*` |
| API | `app/api/marketplace/pending-accepted-values/route.ts` |
| UI | `DiscoveryDirectionToggle`, `AcceptedValueChip`, `PendingAcceptedValueProposalForm` |
| Feed | `GeoFeed`, `FeedSidebarFilters`, `FeedMobileFilterSheet` |
| Proposal | `proposal-prefill.ts`, `StartChatButton`, `CreateProposalSheet` |

## Validation

```bash
npx tsx scripts/validate-reverse-discovery-phase8c.ts
npx tsx scripts/validate-discovery-intelligence-phase8b.ts
npm run build
```

## Deferred

- Persist `discoveryDirection` + `appliedAcceptedValues` in feed session restore (8B note)
- Admin UI for pending proposal review
- Automatic migration on taxonomy approval (architecture only)

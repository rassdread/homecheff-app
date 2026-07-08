# Reverse Discovery & Value Economy — Phase 8C Audit

Date: 2026-07-08  
Scope: Bidirectional discovery, first-class “Ik bied…”, pending taxonomy proposals, proposal continuity

## 1. Discovery philosophy audit

| Mode | Before 8C | After 8C |
|------|-----------|----------|
| Buying (want) | Category, search, location, price | Unchanged — primary via “Ik zoek” |
| Selling | Listing creation only | Unchanged |
| Wanted (Gezocht) | Feed chip + filters | Accepted-values filter applies (8B) |
| Services | Taxonomy category | Same discovery pipeline |
| Barter / alt values | `acceptedSpecializations` on listings | Reverse discovery + tiles + detail |
| Mixed settlements | Settlement router (7C) | Unchanged; proposals prefill value ids |
| Neighbour help / knowledge | Taxonomy + REQUEST intent | Same OR-filter on accepted values |

### Remaining money-centric surfaces (documented, not redesigned)

| Surface | Finding | Severity |
|---------|---------|----------|
| Feed sort default | `price` sort available alongside value discovery | Low — intentional for hybrid listings |
| Empty sale states | Copy still mentions “aanbod” first | Low — acceptable for want-mode default |
| Checkout CTA priority | HomeCheff Checkout remains recommended path (7C) | By design |
| Legacy `priceCents` on old dishes | Feed API still exposes price for legacy rows | 7G legacy fallback |

No separate barter-only discovery engine was introduced — one client filter pipeline.

## 2. Reverse discovery first-class

| Surface | Change |
|---------|--------|
| `DiscoveryDirectionToggle` | “Ik zoek” / “Ik bied” at filter top (desktop sidebar, mobile sheet, GeoFeed panel) |
| Offer mode | `AcceptedValuesDiscoveryFilter` promoted out of “Verfijnen” collapse |
| Want mode | Accepted values remain under “Verfijnen” (advanced) |

## 3. “I can offer…” experience

Examples (fruit, photography, nail styling, baking, guitar lessons) map to **existing taxonomy ids** via `getAcceptedValueTaxonomyItems()` — no hardcoded lists.

Pending proposals (`pending:{cuid}`) extend the same picker/filter when taxonomy lacks a label.

## 4. Bidirectional flow

```
Ik zoek → filters → listing → proposal (listing prefill)
Ik bied → accepted values → listing → proposal (reverse-discovery prefill on requestedValueTaxonomyIds)
```

Session: `reverse-discovery-session.ts` → `StartChatButton` → `proposal-prefill` — no duplicate state.

## 5. Accepted Values UX

- Grouping via `groupAcceptedTaxonomyIds` (8B)
- Offer-mode education copy + examples (i18n)
- Empty state: sibling taxonomy suggestions + nearby categories (no AI)
- Chips: “Ik shop met:” prefix (GeoFeed + filter)

## 6. Discovery intelligence

Multiple selected values: **OR** within filter, **AND** with category/location/radius/price/search/view (8B memos, unchanged).

## 7. Empty-state suggestions

` suggestAcceptedValueAlternatives()` — parent/sibling taxonomy only.  
`suggestNearbyDiscoveryCategories()` — canonical category slugs.

## 8–9. Chips & listing detail

- `AcceptedValueChip` — official + pending labels
- Detail: `marketplace.detail.acceptedValues.sellerAcceptsHeading` — “Deze aanbieder accepteert”

## 10. Proposal flow

`ProposalPrefillInput.reverseDiscoveryOfferIds` → `requestedValueTaxonomyIds` + settlement bump (`MONEY_AND_VALUE` / `VALUE_ONLY`).  
`CreateProposalSheet` consumes stored prefill; analytics `reverseDiscoveryUsed`.

## 11. Future readiness (report only)

| Expansion | Architecture readiness |
|-----------|------------------------|
| Local currency | `SettlementMode` + proposal amount — needs new mode, not blocked |
| Community credits | Pending proposal + counter-value ids pattern reusable |
| Gift / volunteer / time banking | Taxonomy + `VALUE_ONLY` proposals — no schema conflict |
| Skill exchanges | `specializations` + accepted values already parallel |

## 12. Marketplace philosophy

HomeCheff positioning reinforced on discovery copy (value exchange, not webshop).  
Remaining meal-delivery wording: legacy feed category labels (`cheff`) — Phase 8A backlog.

Stripe Connect remains recommended settlement when available (7C).

## 13. Performance

- No extra feed API for reverse discovery
- Pending registry: one GET `/api/marketplace/pending-accepted-values`, client cache
- No GeoFeed remount; memos preserved
- Proposal POST only on user-initiated custom value

## 14. Pending taxonomy proposals (§15)

| Piece | Location |
|-------|----------|
| Prisma | `PendingAcceptedValueProposal`, `PendingAcceptedValueProposalUser` |
| Stable ids | `pending:{cuid}` in `acceptedSpecializations` |
| Merge | `canonicalKey` = category + language + normalized label |
| Discovery | `normalizeAcceptedTaxonomyIds` passes pending ids through |
| Admin audit | `GET /api/marketplace/pending-accepted-values?audit=1` |

### Future approve → migrate

`approvedTaxonomyId` on proposal row; official ids remain canonical — migration job can rewrite `acceptedSpecializations` arrays without listing data loss (not implemented in 8C).

## 15. Data integrity

```
AcceptedValuesPicker / PendingProposalForm
        ↓
acceptedSpecializations (official + pending: ids)
        ↓
extractItemAcceptedValueIds → filter / tiles / detail / proposals
```

Official taxonomy ids unchanged. Pending ids are stable until promotion.

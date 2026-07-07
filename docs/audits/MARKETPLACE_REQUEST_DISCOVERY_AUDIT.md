# Marketplace REQUEST Discovery Audit

**Date:** 2026-07-07  
**Phase:** ADR Phase 2 — REQUEST Route + Gezocht Discovery  
**Validator:** `scripts/validate-marketplace-request-discovery.ts`

---

## 1. REQUEST routes

| Route | Purpose | Implementation |
|-------|---------|----------------|
| `/request/[slug]` | Canonical REQUEST detail | `app/request/[slug]/page.tsx` → `ListingDetailPage` |
| `/product/[slug]` | OFFER kinds (PRODUCT, SERVICE, WORKSHOP, …) | Shared page; layout redirects REQUEST → `/request/` |

**Href builder:** `lib/seo/listing-routes.ts` — `buildListingDetailHref`, `listingDetailRoutePrefix`

**Slug format:** unchanged (`title-place-hcid-{uuid}` via `buildProductSlugPath`)

---

## 2. Discovery surfaces showing REQUEST

| Surface | Mechanism |
|---------|-----------|
| Home feed — **Gezocht** chip | `GeoFeed` filters `isMarketplaceRequestItem` |
| Home feed — **Alles** | `prependGezochtDiscoverySection` (up to 8 open requests) |
| Feed tiles / grid | `resolveFeedItemHref` → `/request/…` |
| Search | `inferSearchQueryIntent` + `listingIntent=REQUEST` filter |
| Exchange suggestions | Counterparty REQUEST hrefs + `start_proposal` |
| Opportunities — Buurthulp variants | `/?chip=gezocht#homecheff-feed` |

**Data source:** existing Product rows with `listingIntent: REQUEST` / `listingKind: REQUEST` — no new DB entity.

---

## 3. Buurthulp integration

**File:** `lib/discovery/opportunities/community-helper-variants.ts`

All 8 `COMMUNITY_HELPER_VARIANTS` use:

```
actionHref: '/?chip=gezocht#homecheff-feed'
```

**Flow:** Buurthulp card → Gezocht feed → REQUEST detail → Proposal → Deal → Delivery (if needed)

Previously (pre-Phase 2): CTAs pointed to `/?chip=sale` — dead-end for help seekers.

---

## 4. CTAs available

| Context | Primary | Secondary |
|---------|---------|-----------|
| REQUEST detail | Voorstel doen (`request_proposal`) | Bericht, contact (matrix) |
| Tile preview | Bekijk verzoek | Voorstel doen (`openProposalAfterStart`) |
| Exchange suggestion | Voorstel doen / Bekijk verzoek | Start gesprek, profiel |
| Feed empty Gezocht | Verzoek plaatsen | Te koop chip |

**Not shown for REQUEST:** Bestellen, winkelwagen, checkout primary.

---

## 5. Active proposal paths

| Entry point | Mechanism |
|-------------|-----------|
| `/request/[slug]` sticky + primary actions | `ProductSaleProposalAction` via `resolveDetailPageActions` |
| Long-press / info preview | `MarketplacePreviewActions` → `StartChatButton` + `openProposalAfterStart` |
| Exchange suggestion card | `start_proposal` CTA + `proposalPrefillFromSuggestionCard` |
| Chat from tile | `StartChatButton` with `productId` on REQUEST listing |

All use existing **ProposalSheet** — no separate aanvraag flow.

---

## 6. i18n coverage

| Namespace | Keys |
|-----------|------|
| `marketplace.request.actions.*` | view, help, proposal, create |
| `marketplace.request.detail.*` | badge, helpBadge, soughtHeading, intro |
| `marketplace.discovery.requests.*` | chip, sectionTitle, empty*, searchHints |

Parity: `public/i18n/nl.json`, `public/i18n/en.json`

---

## 7. Gaps / future (out of scope)

- Dedicated discovery registry section id `gezocht` in server ranking (uses client prepend today)
- Push notifications for new nearby requests
- Sponsored REQUEST placements
- Exchange chain UI

---

## 8. Verification checklist

- [x] REQUEST route active
- [x] 4C detail contracts on shared page
- [x] Gezocht chip + section
- [x] Community-helper → gezocht
- [x] Search intent + listingIntent filter
- [x] Proposal entry on detail, preview, suggestions
- [x] i18n nl/en
- [x] Automated validator script

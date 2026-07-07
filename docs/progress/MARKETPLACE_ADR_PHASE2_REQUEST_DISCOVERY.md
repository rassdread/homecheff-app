# ADR Phase 2 — REQUEST Route + Gezocht Discovery

**Status:** Implemented  
**Scope:** REQUEST discovery only (no notifications, ranking, tile redesign, or new payment flows)

## Summary

REQUEST listings are first-class marketplace citizens with a dedicated route, discovery surfaces, and proposal entry points aligned with PRODUCT/SERVICE.

## Deliverables

### 2.1 REQUEST route (`/request/[slug]`)

- `lib/seo/listing-routes.ts` — canonical `buildListingDetailHref`, prefix resolution
- `app/request/[slug]/page.tsx` — shared `ListingDetailPage`
- `app/request/[slug]/layout.tsx` — metadata + canonical redirect; non-REQUEST → `/product/`
- `app/product/[id]/layout.tsx` — REQUEST → `/request/` redirect before render
- `lib/feed/feed-item-href.ts` — feed/tile hrefs use listing routes

### 2.2 REQUEST detail (4C contracts)

- Reuses `ListingDetailPage` + `ProductDetailMainSections`, trust, accepted values, conditions
- `resolveDetailPageActions` — primary CTA `request_proposal`, no checkout
- Request badge: `marketplace.request.detail.badge`

### 2.3 Gezocht discovery section

- Home feed chip `gezocht` (aliases: `request`, `help`, `hulp`, …) via `app/page.tsx` + `GeoFeed`
- **Alles** view: `prependGezochtDiscoverySection` shows open requests band
- Dedicated **Gezocht** chip filters `isMarketplaceRequestItem` pool
- Empty state + CTA to post a request

### 2.4 REQUEST tiles

- Existing tile system + 🙋 request badge (`build-tile-badges`)
- Preview/view CTA: `marketplace.request.actions.view`
- Price line: request-specific copy (existing)

### 2.5 Proposal loop

- Detail: `ProductSalePrimaryActions` / sticky CTA via `resolveDetailPageActions`
- Preview: `MarketplacePreviewActions` — `openProposalAfterStart` for REQUEST
- Exchange suggestions: `start_proposal` + canonical `/request/` href

### 2.6 Buurthulp

- All `community-helper-variants` → `/?chip=gezocht#homecheff-feed`

### 2.7 Search & filters

- `inferSearchQueryIntent` — gezocht / hulp / wie kan patterns
- `listingIntent=REQUEST` URL filter via `parseSearchFilterParams`
- REQUEST excluded from Te koop bucket (`isMarketplaceSaleItem`)

### 2.8 Exchange

- Suggestion cards include `counterpartyListingIntent` + `counterpartyListingKind`
- Hrefs via `buildListingDetailHref`
- Discovery mapper slug = full canonical path

### 2.9 Mobile

- `FeedMobileToolbar` gezocht chip
- Compact tiles + long-press preview unchanged

### 2.10 i18n

Namespaces: `marketplace.request.*`, `marketplace.discovery.requests.*` (nl + en)

## Validation

```bash
npx tsx scripts/validate-marketplace-request-discovery.ts
```

## Chain

```
REQUEST listing
  → Discovery (feed chip / Gezocht section / search)
  → Detail (/request/[slug])
  → Proposal (ProposalSheet)
  → Deal
  → Delivery / execution (existing)
```

## Related docs

- `docs/audits/MARKETPLACE_REQUEST_DISCOVERY_AUDIT.md`
- `docs/audits/REQUEST_DISCOVERY_READINESS.md` (Phase 1A search)

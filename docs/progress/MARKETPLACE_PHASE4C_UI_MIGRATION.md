# Marketplace Phase 4C-UI — Detail Contract Migration

**Status:** Implemented  
**Depends on:** Phase 4C contracts, 4A Value Exchange, 5B-A Taxonomy, 5E-B Commerce Alignment, 5E-C Proposal Polish

## Goal

Make the product detail page the single source of truth for listing value exchange, accepted values, conditions, trust, and proposal entry — aligned with tiles, previews, exchange suggestions, proposals, and deals.

## Delivered

### 4C-UI.1 — Detail contract audit

Documented in `docs/audits/MARKETPLACE_DETAIL_UI_MIGRATION_AUDIT.md`.

### 4C-UI.2 — Section order migration

- `lib/marketplace/detail/detail-ui-section-order.ts` — `DETAIL_UI_SECTION_IDS`, `buildDetailUiSectionPlan`
- `ProductDetailMainSections` renders main column in contract order
- Desktop grid: `DESKTOP_DETAIL_GRID` (`lg:grid-cols-[3fr_2fr]`)

### 4C-UI.3 — Value exchange consistency

- `ProductValueExchangeSection` — payment method + REQUEST seeks only (4A `buildDetailValueExchangeBlock`)
- Accepted values moved to dedicated section

### 4C-UI.4 — Accepted values presentation

- `buildDetailAcceptedValuesPresentation` — groups by main category + subcategories
- `ProductDetailAcceptedValuesSection` — emoji category headers, optional notes when data exists

### 4C-UI.5 — Conditions & logistics

- `buildDetailConditionsBlock` — pickup, delivery, radius, region, stock
- `ProductDetailConditionsSection` — separate from accepted values

### 4C-UI.6 — Unified trust block

- `ProductDetailTrustBlock` — `buildDetailTrustBlock(DiscoveryTrustContract)`
- Product API returns `discoveryTrust` via `buildDiscoveryTrust`
- Removed: `ProductSaleCommerceTrustLine`, `ProductMakerTrustStrip`, inline rating/views strip, `ProductDetailTrustNote`

### 4C-UI.7 — Proposal entry point

- `resolveDetailPageActions` merges `DETAIL_ACTION_MATRIX` + barter commerce alignment
- `ProductSalePrimaryActions` + `ProductSaleStickyCta` use ListingKind-aware CTAs
- Same `ProductSaleProposalAction` / ProposalSheet flow as 5E-C

### 4C-UI.8 — ListingKind consistency

- `deriveListingKind` at page load drives section plan + actions + trust channel

### 4C-UI.9 — Mobile

- Value exchange + trust in main stack on mobile; compact trust/value in desktop sidebar
- Sticky CTA uses `resolveDetailPageActions` for proposal-first kinds

### 4C-UI.10 — i18n

- `marketplace.detail.acceptedValues.*`, `marketplace.detail.conditions.*`
- Trust keys updated with `{{count}}` (nl/en)

## Validation

```bash
npx tsx scripts/validate-marketplace-detail-ui-migration.ts
npx tsx scripts/validate-marketplace-detail-system.ts
npm run lint
npm run build
```

## Out of scope

Notifications, exchange chains, sponsored placements, tile redesign, ranking/search changes.

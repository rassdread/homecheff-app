# UX Finalization — Phase 8D Value Economy Completion

Date: 2026-07-08

## Goal

One consistent value-economy language across every marketplace surface — money, products, services, skills, barter, and mixed settlements — with HomeCheff Checkout as the recommended safe path when available.

## Audit

See `docs/audits/MARKETPLACE_VALUE_ECONOMY_PHASE8D_AUDIT.md` for the full surface-by-surface report (homepage → checkout).

## Fixes shipped (minimal, no redesign)

| Area | Change |
|------|--------|
| Detail accepted values | `sellerAcceptsHeading` + description on `ProductDetailAcceptedValuesSection` |
| Detail data | `ListingDetailPage` passes settlement booleans to main sections |
| Commerce helpers | `isContactOnlyProduct` / `isHomecheffCheckoutProduct` respect booleans |
| Favorites tiles | `map-favorite-to-tile-model` uses `resolveSettlementOptions` |
| Create form | Removed duplicate `StripeConnectPaymentsBanner`; `SettlementConnectGuidance` only |
| Feed empty states | Canonical “Aangeboden” CTA; value-economy empty copy |
| i18n | NL + EN alignment for chip intro, sale empty, gezocht/accepted-values empty bodies |

## Unchanged architecture

- `canonical-model.ts` — intent / category / view  
- `settlement-options.ts` — settlement SSOT  
- `taxonomy-resolve.ts` — taxonomy SSOT  
- `accepted-values-discovery.ts` — reverse discovery  
- No new APIs or providers

## Validation

```bash
npx tsx scripts/validate-marketplace-value-economy-phase8d.ts
npx tsx scripts/validate-reverse-discovery-phase8c.ts
npx tsx scripts/validate-settlement-options-phase7c.ts
npm run build
```

## Deferred

- Full `settlement-router` wiring on all CTAs  
- Checkout API boolean gate  
- Terminology unification: “geaccepteerde” vs “alternatieve” tegenwaarden  
- Remove legacy `feed.chipSale` keys after full migration

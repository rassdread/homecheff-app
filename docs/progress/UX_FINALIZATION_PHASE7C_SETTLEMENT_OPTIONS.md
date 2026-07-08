# UX Finalization — Phase 7C — Settlement Options, Stripe Connect Guidance & Offer Classification

Date: 2026-07-08
Type: data wiring + guidance + explanation. No checkout-flow, payment-provider,
ranking, or discovery-logic change.

## Report (against the 13 requested items)

1. **Current settlement data model** — both `acceptHomeCheffPayment` /
   `acceptDirectContact` exist on Product + in the create form, but the feed
   collapsed to a single `orderMethod` and dropped the booleans + seller Connect
   completion. See audit §7C.1.
2. **Canonical settlement standard** — `resolveSettlementOptions` is the single
   source of truth (options + availability state incl. `canCheckoutNow`,
   `homeCheffCheckoutNeedsConnect`).
3. **Create/edit changes** — already multi-select; added Connect guidance.
4. **Stripe Connect guidance** — `SettlementConnectGuidance` (needs-connect +
   connect-ready states, CTA to existing `/api/stripe/connect/onboard`).
5. **Feed/tile data wiring** — feed selects both booleans + seller
   `stripeConnectOnboardingCompleted`; threaded to tile model as
   `acceptsHomeCheffCheckout` / `acceptsDirectContact` /
   `homeCheffCheckoutConfigured`. No extra fetch / N+1.
6. **Tile settlement row** — canonical, multi-icon, HomeCheff gated on Connect.
7. **Cash/direct icon** — `Banknote`, distinct.
8. **Barter icon** — `Handshake`, distinct.
9. **Accepted-value icon** — `ArrowLeftRight`, distinct.
10. **Create/edit accepted values** — taxonomy-based (unchanged, verified).
11. **Gezocht reverse-flow** — settlement router applies equally to Gezocht;
    deeper reverse-flow copy deferred (Phase 7B item).
12. **Preview/detail consistency** — preview `PreviewSettlement` + detail
    `ProductDetailSettlementSection` explain the tile icons; preview adapts
    direction for Gezocht; detail explains why checkout may be unavailable.
13. **Sidebar IA** — not in 7C scope (Phase 7B deferred).

Plus:
- **Settlement routing (7C.10)** — central `resolveSettlementFlow`: HomeCheff
  Checkout → CHECKOUT, else → PROPOSAL; not driven by intent/category/price.
- **Offer classification (7C.X)** — OFFER stays sale regardless of value form;
  REQUEST stays gezocht; guarded by live `isMarketplaceSaleItem` assertions.
- **Data integrity (validators)** — new 7C validator, 72 checks, all green.
- **Performance** — presentation + one added column pair in an existing query;
  no new query, no N+1, no remount; density/SWR/return-cache preserved.
- **Deferred items** — see audit "Deferred items".

## Files changed

New:
- `lib/marketplace/settlement/settlement-options.ts`
- `lib/marketplace/settlement/settlement-router.ts`
- `components/products/marketplace/SettlementConnectGuidance.tsx`
- `components/product/detail/ProductDetailSettlementSection.tsx`
- `scripts/validate-settlement-options-phase7c.ts`
- `docs/audits/SETTLEMENT_OPTIONS_PHASE7C_AUDIT.md`
- `docs/progress/UX_FINALIZATION_PHASE7C_SETTLEMENT_OPTIONS.md`

Modified:
- `app/api/feed/route.ts` — select both booleans + seller Connect completion; emit
  `sellerStripeConnectReady`.
- `components/feed/GeoFeed.tsx` — thread fields through FeedItem/normalize/card map.
- `components/feed/GeoFeedCards.tsx` — GeoFeedCardItem fields.
- `lib/marketplace/tiles/types.ts` — tile model settlement fields.
- `lib/marketplace/tiles/map-to-tile-model.ts`,
  `lib/marketplace/tiles/map-profile-listing-to-tile-model.ts`,
  `lib/marketplace/tiles/map-favorite-to-tile-model.ts` — set settlement fields.
- `lib/marketplace/tiles/build-tile-settlement-row.ts` — canonical, connect-gated.
- `components/marketplace/previews/MarketplacePreviewCard.tsx` — settlement block.
- `components/product/detail/ProductDetailMainSections.tsx` — wire detail section.
- `components/products/marketplace/MarketplaceOfferForm.tsx` — render guidance.
- `public/i18n/nl.json`, `public/i18n/en.json` — `marketplace.settlement.*`,
  `marketplace.preview.settlement.*`, `marketplace.detail.settlement.*`.
- `scripts/validate-marketplace-tile-payment-semantics-phase7b.ts` — updated one
  assertion for the 7C refactor.

## Validation

```
npx tsx scripts/validate-settlement-options-phase7c.ts                    → 72 passed, 0 failed
npx tsx scripts/validate-marketplace-tile-payment-semantics-phase7b.ts    → 48 passed, 0 failed
npx tsx scripts/validate-first-run-clarity-phase7a.ts                     → 64 passed, 0 failed
npx tsx scripts/validate-shared-ui-phase6b.ts                             → 39 passed, 0 failed
npx tsx scripts/validate-runtime-performance-phase4c.ts                   → 26 passed, 0 failed
npm run build                                                             → success (exit 0)
```

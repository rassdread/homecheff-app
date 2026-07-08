# UX Finalization — Phase 7B — Tile Category, Value & Settlement Semantics

Date: 2026-07-08
Type: codebase-first audit + presentation-only tile implementation. No ranking,
payment-flow, backend or performance change.

## Report (against the 16 requested items)

1. **Current category/intent architecture** — two-axis model already in code
   (Axis 1 pillars = Prisma `MarketplaceCategory` → 8 main categories; Axis 2
   intent OFFER/REQUEST; derived `ListingKind`). See audit §7B.1.
2. **New standard** — documented Axis 1 (pillar/category incl. Diensten,
   Buurthulp, Inspiratie) + Axis 2 (bied aan / zoek); Gezocht = reverse intent,
   still a discovery entry. Audit §7B.2.
3. **Tile category badge** — `build-tile-badges.ts` now shows ONE primary
   pillar/category badge; the redundant generic `listing_kind` ("Dienst"/Tag)
   badge is dropped when a category badge is present (fallback kept for legacy).
4. **Value row** — price/budget/value label + accepted-value **subcategory**
   icons on one line (taxonomy-driven, capped, `+N`). Removed the ambiguous
   inline 💶/🤝 from `TileValueRow`.
5. **Settlement row** — new dedicated row with **distinct** icons for HomeCheff
   Checkout / cash-direct / barter / alternative values.
6. **HomeCheff Checkout icon** — `ShieldCheck` badge, aria "Veilig betalen via
   HomeCheff" / "Secure checkout via HomeCheff". No Stripe logo, no money-bill.
7. **Cash / direct contact icon** — `Banknote`, distinct from HomeCheff Checkout.
8. **Barter icon** — `Handshake`, distinct row item.
9. **Accepted-values subcategory icons** — already taxonomy-sourced
   (`build-tile-accepted-value-icons.ts`), now shown to the right of the price.
10. **Create/edit accepted values** — already taxonomy-based
    (`AcceptedValuesPicker` → `acceptedSpecializations`). No change needed.
11. **Gezocht reverse-flow** — audited. Proposal sheet is PRODUCT-only; budget
    prefilled into a neutral price field; `acceptedValueTaxonomyIds` prefilled
    but hidden. Documented as deferred (needs flow work, not safe copy).
12. **Preview/detail consistency** — audited. Both render value-exchange from
    shared builders; gaps (explanatory headings, detail settlement block,
    REQUEST-specific copy) documented as deferred.
13. **Sidebar IA** — audited. Left = filters only; right = mixed actions/nav/
    community/context. Target distribution documented; move deferred (high layout
    risk).
14. **Data integrity** — new validator, 48 checks, all green.
15. **Performance** — presentation-only, derived from existing tile model; no
    extra fetch/remount; density/SWR/return-cache/single-mount untouched.
16. **Deferred items** — see audit "Deferred items".

## Files changed

New:
- `lib/marketplace/tiles/build-tile-settlement-row.ts`
- `components/marketplace/tiles/primitives/TileSettlementRow.tsx`
- `scripts/validate-marketplace-tile-payment-semantics-phase7b.ts`
- `docs/audits/MARKETPLACE_TILE_PAYMENT_SEMANTICS_PHASE7B_AUDIT.md`
- `docs/progress/UX_FINALIZATION_PHASE7B_TILE_PAYMENT_SEMANTICS.md`

Modified:
- `lib/marketplace/tiles/build-tile-badges.ts` — single primary badge dedupe.
- `lib/marketplace/tiles/index.ts` — export settlement builder.
- `components/marketplace/tiles/primitives/TileValueRow.tsx` — remove 💶/🤝.
- `components/marketplace/tiles/primitives/TileValueExchangeBlock.tsx` — price+icons
  on one row, add settlement row.
- `components/marketplace/tiles/primitives/index.ts` — export TileSettlementRow.
- `public/i18n/nl.json`, `public/i18n/en.json` — `marketplace.tile.settlement.*`.

## Validation

```
npx tsx scripts/validate-marketplace-tile-payment-semantics-phase7b.ts → 48 passed, 0 failed
npx tsx scripts/validate-first-run-clarity-phase7a.ts                   → 64 passed, 0 failed
npx tsx scripts/validate-shared-ui-phase6b.ts                           → 39 passed, 0 failed
npx tsx scripts/validate-design-system-phase6a.ts                       → 53 passed, 0 failed
npx tsx scripts/validate-discovery-pillars-phase5c.ts                   → 43 passed, 0 failed
npx tsx scripts/validate-runtime-performance-phase4c.ts                 → 26 passed, 0 failed
npm run build                                                           → success (exit 0)
```

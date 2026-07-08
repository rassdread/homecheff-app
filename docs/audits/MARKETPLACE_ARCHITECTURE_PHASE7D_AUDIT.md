# Marketplace Architecture Audit — Phase 7D

Date: 2026-07-08
Scope: Codebase-first. No redesign, no new backend/API/ranking/payment, no
performance regression. Locks in the canonical Information Architecture and
verifies every surface consumes one model in one order.

---

## 1. Canonical Marketplace Model

Three **independent** axes, codified in `lib/marketplace/canonical-model.ts`:

| Axis | Question | Values | Drives |
|------|----------|--------|--------|
| **Intent** | What does the user want? | `ALL`, `OFFERED`, `WANTED`, `INSPIRATION` | Discovery VIEW filter |
| **Category** | What is it? | `FOOD`, `GARDEN`, `CREATIONS`, `SERVICES` | Discovery CATEGORY filter + tile badge |
| **Settlement** | How is the deal closed? | `HOMECHEFF_CHECKOUT`, `DIRECT_CONTACT`, `BARTER`, `ALTERNATIVE_VALUES` | Follow-up flow ONLY |

Hard invariants (enforced by the validator):
- **Services is a category, never an intent.** `isValidViewIntent('SERVICES') === false`; `isValidCanonicalCategory('SERVICES') === true`.
- **"Offered" covers every value form** — fixed price, on-request, voluntary, barter-only, accepted-values-only, direct-contact-only, HomeCheff Checkout. There is no "For sale" intent.
- **Settlement never filters** and never decides whether something is Offered.

---

## 2. Intent architecture (AXIS 1 — VIEW)

- `MARKETPLACE_VIEW_INTENTS = ['ALL','OFFERED','WANTED','INSPIRATION']`.
- `resolveItemViewIntent(item)` derives the intent from the **existing** single-source
  classifiers (`isMarketplaceRequestItem` → WANTED, `isMarketplaceSaleItem` → OFFERED,
  else INSPIRATION). Price and settlement are irrelevant to this decision.
- `viewIntentToLegacyFilter()` maps canonical intents onto the current feed chip ids
  (`OFFERED → 'sale'`, `WANTED → 'gezocht'`, `INSPIRATION → 'inspiration'`) so no UI
  wiring changes and no second classifier is introduced.

**Finding:** the pre-7D chip enum (`FeedViewFilterId`) still contains a legacy
`'services'` chip. Under the canonical model this is a **category surfaced inside
Offered** (a service is always `isMarketplaceSaleItem === true`), not an intent. The
canonical model treats Services strictly as a category; the legacy chip stays for
backward compatibility but is documented as a category entry.

---

## 3. Category architecture (AXIS 2)

- `MARKETPLACE_CANONICAL_CATEGORIES = ['FOOD','GARDEN','CREATIONS','SERVICES']`.
- These 4 are a **collapse of the existing 6-vertical registry**
  (`lib/marketplace/value-exchange/main-categories.ts`) — no parallel table:
  - `HOME_CHEFF → FOOD`
  - `HOME_GARDEN → GARDEN`
  - `HOME_DESIGNER → CREATIONS`
  - `SERVICES / WORKSHOPS / COACHING → SERVICES`
- `prismaCategoryToCanonical()` delegates to the existing
  `marketplaceCategoryToMainCategory()` and then collapses to the 4 canonical values.
  This guarantees a single source of truth (data integrity 7D.9).
- Prisma `MarketplaceCategory` mapping: `CREATE→Food`, `GROW→Garden`,
  `DESIGN/ARTISTIC_SERVICE→Creations`, `PRACTICAL_SERVICE/KNOWLEDGE→Services`.
- Branding names (HomeCheff, HomeGarden, HomeDesigner, Chef, Garden, Designer) are
  **not** categories. Subcategories remain taxonomy-driven.

---

## 4. Settlement architecture (AXIS 3)

- `MARKETPLACE_SETTLEMENT_METHODS = ['HOMECHEFF_CHECKOUT','DIRECT_CONTACT','BARTER','ALTERNATIVE_VALUES']`.
- Resolved by the Phase 7C canonical helpers `resolveSettlementOptions` /
  `resolveSettlementFlow`. Settlement determines only the follow-up flow (checkout vs.
  proposal), never the category, intent, or filtering.

---

## 5. Discovery filters (7D.2 / 7D.3)

- **VIEW**: All / Offered / Wanted / Inspiration.
- **CATEGORY**: Food / Garden / Creations / Services.
- No mixing: Services lives only under Category.
- Offered shows **all** offers regardless of value form; Wanted shows only REQUEST;
  Inspiration shows only inspiration. Verified live against the classifiers.

---

## 6. Universal tile standard (7D.4)

Every marketplace tile composes the same primitives in the same order:

```
TileMedia (category badge · info · favorite)
TilePersonRow (maker · location)
<title>
TileValueExchangeBlock
  ├─ value row: price / budget / on-request  +  accepted-value icons (NEXT TO price)
  └─ settlement row (ALWAYS at the bottom)
TileTrustCue (rating · distance · reviews)
```

Confirmed in `MarketplaceTileStandard`, `MarketplaceTileCompact`, `MarketplaceTileMini`.
Mini/sidebar **reduce** (drop accepted icons + settlement) but never reorder.

---

## 7. Accepted Values (7D.5)

- Come exclusively from taxonomy via `build-tile-accepted-value-icons`.
- Rendered **next to the price** inside the value row.
- No hardcoded icons and no settlement icons next to price
  (`TileValueRow` no longer emits 💶/🤝, moved to the settlement row in 7B).

---

## 8. Settlement row (7D.6)

- Built by `build-tile-settlement-row`, rendered **at the bottom** of the value block.
- Distinct icons: 🛡️ HomeCheff Checkout, 💵 Direct contact, 🤝 Barter,
  🔄 Alternative values. Never next to the price. HomeCheff Checkout icon is gated on
  actual Stripe Connect readiness (7C).

---

## 9. Tile consistency (7D.8)

| Surface | Entry point | Result |
|---------|-------------|--------|
| Homepage / Discover / Search / Wanted / Services | `GeoFeed` → `FeedMarketplaceCard` → `MarketplaceTileRouter` | ✅ shared |
| Profile | `ProfilePublicAanbodTileGrid` → `mapProfileListingToTileModel` → `MarketplaceTileMini` | ✅ shared |
| Favorites | `FavoritesGrid` → `mapFavoriteToTileModel` → `MarketplaceTileMini` | ✅ shared |
| Preview | `MarketplacePreviewCard` (same value + settlement blocks) | ✅ shared |
| Router | `MarketplaceTileRouter` → standard / compact / mini / sidebar | ✅ |

---

## 10. Data integrity (7D.9)

- Category, Intent, Settlement, Accepted Values all resolve from the same canonical
  model / existing single-source helpers.
- Category bridges the existing `marketplaceCategoryToMainCategory` (no double mapping).
- Tile model carries settlement booleans (`acceptsHomeCheffCheckout`,
  `acceptsDirectContact`) instead of per-UI derivations.

---

## 11. Validators

`scripts/validate-marketplace-architecture-phase7d.ts` — asserts axes, Services-not-
intent, Offered-covers-all-value-forms (live), category bridge, universal tile order,
single category badge, cross-surface consistency, i18n parity, and no-fetch performance.

---

## 12. Performance (7D.10)

No new fetch, API, remount, N+1, or client guessing. The canonical model is pure
constants + mappers over existing tile data (no `fetch`, no `useEffect`, no
`prisma.*`).

---

## 13. Deferred items

- Migrating the legacy `'services'` VIEW chip out of `FeedViewFilterId` into a true
  CATEGORY-axis control is a UI rewire deferred to a discovery-filter refactor; the
  canonical model already treats Services as a category so no data change is required.
- A dedicated "Related items" tile grid does not exist as a separate surface today;
  related listings surface through the profile grid / feed, which already use the
  shared tile.

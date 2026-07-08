# Marketplace Category Model, Tile Payment Semantics & Sidebar IA — Phase 7B Audit

Date: 2026-07-08
Scope: codebase-first audit + safe, targeted tile-semantics implementation.
No ranking change, no payment-flow change, no performance regression, no
redesign for its own sake.

---

## 7B.1 Current category / intent architecture

HomeCheff already has a mature two-axis model in code — it is **not** "3 verticals
+ status badges" internally, though some legacy labels and one tile double-badge
still leak the old mental model.

### Axis 1 — Pillar / category (what it is)
- Canonical Prisma enum `MarketplaceCategory`: `CREATE | GROW | DESIGN |
  ARTISTIC_SERVICE | PRACTICAL_SERVICE | KNOWLEDGE`
  (`lib/marketplace/listing-taxonomy.ts:29`).
- User-facing "main categories" (8): `HOME_CHEFF, HOME_GARDEN, HOME_DESIGNER,
  SERVICES, WORKSHOPS, COACHING, DELIVERY, REQUESTS`
  (`lib/marketplace/value-exchange/value-exchange-contract.ts:11`), each with
  emoji + Lucide icon + Prisma-category mapping
  (`lib/marketplace/value-exchange/main-categories.ts:15`).
- Taxonomy registry (`lib/marketplace/taxonomy.ts`) = flat `category → group →
  item`, every entry carries a Lucide `icon`. Subcategory IDs like `create.meal`,
  `grow.tomato`, `practical.bike_repair`, `knowledge.coaching`.

### Axis 2 — Direction / intent (what the user wants)
- `listingIntent: 'OFFER' | 'REQUEST'` (Prisma + tile model).
- **Gezocht = REQUEST intent**, the reverse of OFFER — confirmed as an intent,
  not a separate world, though it stays visible as a discovery entry (chip +
  badge).

### Derived: `ListingKind`
- `PRODUCT | SERVICE | TASK | WORKSHOP | COACHING | REQUEST | INSPIRATION`,
  derived from intent + category + specializations
  (`lib/marketplace/listing-kind/derive-listing-kind.ts`). Not a form field.

### Answers to the audit questions
- **Real pillars:** the 6 Prisma categories, surfaced as 8 main categories
  (adding DELIVERY = fulfillment channel, REQUESTS = intent).
- **Categories:** Axis 1 (CREATE/GROW/DESIGN/services/knowledge).
- **Intents:** OFFER / REQUEST (Axis 2).
- **Derived listingKinds:** PRODUCT/SERVICE/TASK/WORKSHOP/COACHING/REQUEST/INSPIRATION.
- **"Gezocht" as category:** in discovery entry points (home chip
  `?chip=gezocht`, ecosystem strip, `marketplace.tile.badge.request`) — this is
  acceptable UX.
- **"Gezocht" as intent:** everywhere in data (`listingIntent==='REQUEST'`,
  `resolveTileOfferCategoryBadge`, request detail/preview branches).
- **"Diensten" as status badge (old model):** the tile could render BOTH a
  pillar badge (🔧 Diensten via `offer_category`) AND a generic
  `listing_kind` badge ("Dienst", Tag icon) → **double/confusing badge**
  (`build-tile-badges.ts` before this phase).
- **"Diensten" as pillar:** correctly modelled as SERVICES/PRACTICAL_SERVICE +
  KNOWLEDGE (workshops/coaching) in the taxonomy + main-category registry.
- **Old vertical assumptions still running:** (a) legacy `category`
  (`CHEFF/GARDEN/DESIGNER`) mirror still written on save; (b) legacy `Listing`
  and `Dish` feed items get **null** `barterOpenness / acceptedSpecializations /
  marketplaceCategory` (`lib/.../from-legacy-listing.ts`, `from-dish.ts`) — so
  exchange data is **Product-only** today; (c) the tile double-badge above.

---

## 7B.2 Conceptual standard (now documented)

- **Axis 1 — Pijler/categorie:** HomeCheff/eten, HomeGarden/tuin,
  HomeDesigner/creaties, Diensten, Workshops, Coaching, Buurthulp, Inspiratie.
  Buurthulp is a lens over PRACTICAL_SERVICE + REQUEST between neighbours (no
  separate backend).
- **Axis 2 — Richting/intent:** *Ik bied iets aan* (OFFER) / *Ik zoek iets*
  (REQUEST). Gezocht is primarily an intent; it remains a recognisable discovery
  entry.
- Every tile = **one pillar/category primary badge** + (for requests) the
  reverse-intent badge, then value + settlement rows.

---

## 7B.3–7B.5 Tile model — implemented this phase

The tile model (`lib/marketplace/tiles/types.ts`) already carries
`marketplaceCategory`, `listingIntent`, `listingKind`, `acceptedSpecializations`,
`acceptedValueSubcategories`, `barterOpenness`, `orderMethod`, `priceCents`,
`offerMainCategory`. So the following are **presentation-only** (no extra fetch):

- **7B.3 Single primary badge** — `build-tile-badges.ts` now drops the redundant
  generic `listing_kind` badge when a pillar `offer_category` badge is present
  (kept as fallback for legacy items without a resolved category). Requests keep
  the reverse-intent badge only.
- **7B.4 Value row** — `TileValueExchangeBlock` renders price/budget/value label
  (left) + accepted-value **subcategory** icons (right, taxonomy-driven,
  capped + `+N`) on one line, e.g. `€18,50   🍅 🛠️ 📸`. The ambiguous inline
  `💶/🤝` indicators were removed from `TileValueRow`.
- **7B.5 Settlement row** — new `build-tile-settlement-row.ts` +
  `TileSettlementRow.tsx` render a separate row with **distinct** icons:
  - HomeCheff Checkout → `ShieldCheck` (aria "Veilig betalen via HomeCheff" /
    "Secure checkout via HomeCheff") — **not** a money-bill, **not** a Stripe logo.
  - Cash / direct contact → `Banknote`.
  - Barter → `Handshake`.
  - Alternative values → `ArrowLeftRight`.
  Derived from `orderMethod` + `barterOpenness` + accepted values. Wired into
  standard + compact tiles (skipped for mini/sidebar). i18n:
  `marketplace.tile.settlement.*` (NL + EN).

### HomeCheff Checkout icon (7B.6/report#6)
Implemented as a reusable `ShieldCheck` badge inside `TileSettlementRow` (no
HomeCheff-logo asset existed for tiles; shield chosen per brief). Stripe is never
shown — HomeCheff Checkout is the user-facing proposition.

---

## 7B.6 Accepted values in create/edit — status: already correct

- `AcceptedValuesPicker` is **taxonomy-based** (`getAcceptedValueTaxonomyItems`),
  stores taxonomy subcategory IDs (`acceptedSpecializations: String[]`), renders
  `TaxonomyLucideIcon`, is prefilled in edit
  (`MarketplaceOfferForm` 177–269), visible on detail/preview, and feeds the tile
  icons + proposal flow. Optional free-text notes exist but are **not** the
  structural source. **No change needed.**

---

## 7B.7 Gezocht reverse-flow — audit (safe copy only; deeper fixes deferred)

- Product & request detail share `components/product/ListingDetailPage.tsx`
  (`app/request/[slug]` re-exports it). Request intent badge + reverse copy exist
  (`marketplace.request.detail.badge`).
- **Proposal sheet is PRODUCT-only** (`CreateProposalSheet.tsx:53` only handles
  `contextHeader.kind === 'PRODUCT'`). For a Gezocht post:
  - `amountEuros` is prefilled from the requester's **budget** into a neutral
    price field (`proposal-prefill.ts:93`) — direction not conveyed.
  - `acceptedValueTaxonomyIds` is prefilled from the request but **never shown
    or editable** in the sheet (only `requestedValueTaxonomyIds` / "Wat bied je
    terug?" is shown) → dead/hidden field.
  - Send label/title keyed on `marketplaceCategory`, no REQUEST-specific copy.
- **Deferred** (needs flow work, out of safe-copy scope): a REQUEST branch in the
  proposal sheet, direction-aware labels, and hiding the unused
  `acceptedValueTaxonomyIds` prefill for requests. Documented here for a later
  slice.

---

## 7B.8 Detail consistency — audit

Detail shows category/pillar, intent, price/budget, accepted values (grouped by
main category + notes), pickup/delivery, proposal/checkout, trust
(`ProductDetailMainSections.tsx`, `ProductDetailAcceptedValuesSection.tsx`,
`ProductValueExchangeSection.tsx`). Gaps (deferred):
- Payment/settlement is a single label/emoji on detail; the HomeCheff-vs-direct
  choice only appears in the proposal sheet. The new tile settlement semantics
  should later be mirrored as a settlement block on detail.
- Request reuses PRODUCT CTA copy ("Voorstel doen") and the "Geaccepteerde
  tegenwaarden" heading, which is ambiguous for a request.

## 7B.9 Preview consistency — audit

`MarketplacePreviewCard` renders payment + fulfillment + accepted-value pills +
trust from the same model (wider than tile, shallower than detail). Gaps
(deferred): accepted values are label-only pills with no explanatory heading;
REQUEST reuses the generic "Geaccepteerde waarden" heading. The preview is the
natural place to *explain* the new tile icons (settlement + accepted values) —
recommended next slice.

## 7B.10 Sidebar IA — audit (target documented; move deferred)

`HomePageClient.tsx:208–228` — 3-col grid `[280px | 1fr | 320px]`:
- **LEFT** `<aside>` → `FeedFiltersPanel` = **100% discovery filters** (location,
  scope/radius, search+category, sort, price, refine).
- **RIGHT** `HomeDesktopSidebar.tsx` = **mixed**: actions (`UserActionCenter`,
  quick-actions card), navigation (`RoleQuickLinksSection`, Gezocht link),
  community (`CommunityPulseBar`, community/FAQ card) and context
  (reputation, promotions, discovery surfaces, progress).

Target IA: **left = actions & navigation** (+ filters collapsible), **right =
community & context**. Current state is inverted/mixed. Moving actions/nav out of
`HomeDesktopSidebar` into the left `aside` is a **high-risk layout change**
(the left column is a `GeoFeed`-context-driven filters slot;
`data-sticky-prod` sticky rules + single-GeoFeed-mount constraints apply).
**Deferred**: no zero-regression safe move available this phase; desired
distribution documented above for a dedicated layout slice.

---

## 7B.11 Data integrity

`scripts/validate-marketplace-tile-payment-semantics-phase7b.ts` (48 checks)
asserts: tile model carries category/intent/kind/acceptedValues/barter/order/
price; single primary badge dedupe; value row has no ambiguous money/barter
emoji; accepted-value icons are taxonomy-sourced + capped; settlement builder +
primitive expose distinct HomeCheff/cash/barter/accepted icons; no Stripe logo;
settlement does no fetching; NL/EN parity; create/edit accepted values are
taxonomy-based; prior architecture frozen.

## 7B.12 Performance

All tile changes are presentation-only and derive from the existing
`MarketplaceTileModel` — **no extra network roundtrip, no new fetch, no
remount**. Density store, desktop-2 / mobile-1 defaults, homepage return cache,
unified SWR and single GeoFeed mount are untouched (re-validated).

---

## Deferred items (summary)
1. **Show HomeCheff + cash simultaneously** on a tile — needs
   `acceptHomeCheffPayment` / `acceptDirectContact` booleans in the feed/discovery
   payload; today `orderMethod` is a single derived value.
2. **Exchange data for legacy Listing/Dish feed items** — currently
   Product-only; `from-legacy-listing.ts` / `from-dish.ts` return null barter/
   accepted/category.
3. **Gezocht proposal reverse-flow** — REQUEST branch, direction-aware labels,
   drop unused `acceptedValueTaxonomyIds` prefill.
4. **Detail settlement block + REQUEST-specific copy/headings**; **preview
   explanatory headings** for accepted values + settlement.
5. **Sidebar IA re-distribution** (left = actions/nav, right = community/context).

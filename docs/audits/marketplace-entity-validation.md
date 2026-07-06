# Marketplace Entity Architecture Audit V1 — Codebase Validation

**Date:** 2026-07-06  
**Scope:** Validate audit claims against current implementation. Documentation only — no code changes.

**Sources inspected:** `prisma/schema.prisma`, feed/discovery libs, marketplace create flow, taxonomy, trust, profile, routes, APIs.

---

## Validation legend

| Symbol | Meaning |
|--------|---------|
| ✅ CONFIRMED | Claim matches codebase |
| ⚠️ PARTIALLY TRUE | Directionally correct but incomplete, overstated, or with exceptions |
| ❌ INCORRECT | Claim contradicted by code |

---

## 1. Entity model claims

### Product is the canonical marketplace listing entity (V2/V3)

**✅ CONFIRMED**

- `Product` has V2/V3 fields: `listingIntent`, `marketplaceCategory`, `priceModel`, `specializations[]`, `acceptedSpecializations[]`, `fulfillmentOptions`, `barterOpenness`, payment flags (`schema.prisma` ~397–461).
- User-facing create path: `app/api/products/create/route.ts` + `MarketplaceEntryFlow` / `MarketplaceOfferForm`.
- SEO detail route: `/product/[id]` with slug metadata in `app/product/[id]/layout.tsx`.

### Listing model is legacy and should be deprecated

**⚠️ PARTIALLY TRUE**

- No user-facing `prisma.listing.create` in app routes (only `prisma/seed.js`, admin read paths).
- **Still active:** `/api/feed` merges legacy listings; `/api/products/[id]` falls back to `Listing` for read/update/delete; `Favorite.listingId`, `Proposal.listingId`, `Reservation` remain wired.
- Deprecation is **architecturally correct** but **not safe to execute** without migration.

### Dish is separate inspiration entity

**✅ CONFIRMED**

- `Dish` model with `DishStatus`, rich content fields, `DishReview`, `Favorite.dishId` (~1242–1288).
- Routes: `/recipe/[id]`, `/garden/[id]`, `/design/[id]`, `/inspiratie/[id]`.
- Feed marks dishes as `feedSource: 'DISH'`.

### Proposal → Agreement → CommunityOrder is the community commerce path

**✅ CONFIRMED**

- Models and relations exist (`Proposal` ~741, `Agreement` ~791, `CommunityOrder` ~805).
- `CommunityOrder.checkoutOrderId` optional link to Stripe `Order`.
- Trust V1: `DealReview`, `completedAt`, delivery review extensions present.

### DeliveryRequest is separate from checkout DeliveryOrder

**✅ CONFIRMED**

- `DeliveryRequest` tied to `CommunityOrder` (~858).
- `DeliveryOrder` tied to Stripe `Order` (~1605).
- Documented in `lib/delivery/DELIVERY_MARKETPLACE_V1.md`.

### SellerProfile / DeliveryProfile are capability profiles on User

**✅ CONFIRMED**

- `SellerProfile.userId` unique; hosts products and `WorkspaceContent`.
- `DeliveryProfile` separate model with courier fields and `DeliveryReview`.

---

## 2. Offer type claims

### All offer types (product, food, service, workshop, request) creatable via Product + taxonomy

**⚠️ PARTIALLY TRUE**

- Taxonomy registry covers CREATE, GROW, DESIGN, ARTISTIC_SERVICE, PRACTICAL_SERVICE, KNOWLEDGE including workshop/coaching ids (`lib/marketplace/taxonomy.ts`).
- `MarketplaceEntryFlow` supports `listingIntent` OFFER and REQUEST.
- **Gaps:** no explicit `digital.*` taxonomy item; digital delivery only via `fulfillmentOptions.digital`; no dedicated request fields (`expiresAt`, `urgency`, `budgetCents`).

### REQUEST exists as `listingIntent=REQUEST` on Product

**✅ CONFIRMED**

- Enum `ListingIntent { OFFER, REQUEST }` in schema.
- Parsed in `lib/marketplace/parse-v2-payload.ts`.
- i18n label `marketplace.entry.request` = "Gezocht" in `public/i18n/nl.json`.

### INSPIRATION is not a Product listing type

**✅ CONFIRMED**

- Inspiration uses `Dish` and `WorkspaceContent`; feed taxonomy kind `INSPIRATION` derived for non-sale items.

### DELIVERY is not a listing type

**✅ CONFIRMED**

- `DeliveryRequest` is operational; not in product create flow or taxonomy as offer type.

---

## 3. Feed & discovery claims

### Feed merges Product + Listing + Dish

**✅ CONFIRMED**

- `app/api/feed/route.ts` ~160–501: parallel fetch and merge of all three.

### REQUEST listings excluded from sale chip

**✅ CONFIRMED**

- `isMarketplaceSaleItem()` returns false for `isRequestListing()` (`lib/feed/marketplace-sale.ts` ~76–77).
- `deriveFeedTaxonomy()` classifies REQUEST with `direction: 'REQUEST'` (`lib/feed/feed-taxonomy.ts` ~167–173).

### REQUEST listings still appear in feed "all" pool

**✅ CONFIRMED**

- Feed query has **no** `listingIntent` filter on products.
- REQUEST items are in merged pool; only sale chip excludes them.

### REQUEST has no canonical detail route

**✅ CONFIRMED**

- `resolveFeedItemHref()` returns `/inspiratie` placeholder for REQUEST (`lib/feed/feed-item-href.ts` ~69–71).

### Feed taxonomy does not derive SERVICE / WORKSHOP / TASK kinds

**✅ CONFIRMED**

- `deriveFeedTaxonomy()` resolves marketplace offers to `kind: 'PRODUCT'` (~180–186).
- `FeedKind` type includes SERVICE/TASK but they are **not assigned** by current derivation logic.
- Comment in `feed-taxonomy.ts` line 151 ("All current live items resolve to direction OFFER") is **stale** — REQUEST direction is handled.

### Priced Dish can leak into sale pool

**✅ CONFIRMED**

- `isMarketplaceSaleItem()`: if `priceCents > 0`, returns true regardless of `feedSource` (~87–88).
- Dishes with `priceCents > 0` can classify as sale without being `Product`.

### Discovery is engagement-heavy and trust-blind

**⚠️ PARTIALLY TRUE**

- `/api/recommendations/smart` ranks by analytics views, geo proximity, mock category — no trust signals.
- GeoFeed ranking uses local-first sort + engagement (`components/feed/GeoFeed.tsx`).
- **Correction:** `SmartRecommendations` component exists but is **not imported in any `app/` page** — API is orphaned from main UX.

### Smart recommendations API is orphaned/mock

**✅ CONFIRMED**

- Category personalization uses hardcoded `'FOOD'` mock (`app/api/recommendations/smart/route.ts` ~150–151).
- No app route consumes the component.

---

## 4. Inventory & fulfillment claims

### Workshops reuse stock as seats

**✅ CONFIRMED**

- `form-config.ts`: workshop taxonomies use `showStock: true`, label key `seatsAvailable` (~79–86).

### Services have no duration/calendar model

**✅ CONFIRMED**

- Service form config hides stock and availability date (~99–106).
- No `durationMinutes`, calendar, or slot fields on `Product`.

### fulfillmentOptions supports 6 modes; Proposal only PICKUP|DELIVERY

**✅ CONFIRMED**

- `FulfillmentOptionKey`: pickup, delivery, shipping, digital, onSiteClient, onSiteProvider (`listing-taxonomy.ts`).
- `ProposalFulfillmentType`: PICKUP, DELIVERY only (`schema.prisma` ~2156).
- `CommunityOrderFulfillmentMode`: PICKUP, DELIVERY, DIGITAL, ON_SITE_PROVIDER, ON_SITE_CLIENT (~2182).

---

## 5. Payment claims

### Checkout limited to HOMECHEFF_PAYMENT products

**✅ CONFIRMED**

- `ProductOrderMethod`: HOMECHEFF_PAYMENT | CONTACT.
- `canPurchaseViaHomecheff()` in `lib/product/order-method.ts` and `proposal-product-binding.ts`.

### Proposal settlement modes include alternative value

**✅ CONFIRMED**

- `SettlementMode`: MONEY, MONEY_AND_VALUE, VALUE_ONLY, FREE, VOLUNTARY.
- Taxonomy value ids on Proposal.

### Cash/PIN/at-door not explicit enums

**✅ CONFIRMED**

- Off-platform settlement flows through CONTACT + proposal/deal terms; no dedicated payment method enum.

---

## 6. Review & trust claims

### Five review types exist

**✅ CONFIRMED**

- ProductReview, DishReview, DealReview, DeliveryReview, ReviewResponse in schema.

### Trust summary blends product/deal/courier averages

**✅ CONFIRMED**

- `getProfileTrustSummary()` averages deal, product, and delivery channel averages into single `averageRating` (`lib/trust/profile-trust-summary.ts` ~112–133).
- File comment says "no composite score" but implementation **does** produce a blended headline number.

### Props and Favorites share Favorite table on products

**✅ CONFIRMED**

- `/api/props/toggle` reads/writes `prisma.favorite` (~36).
- `/api/favorites/toggle` same table for products.
- `ProductSaleCommerceZone.tsx` renders both `FavoriteButton` and `PropsButton`.

### Stats API double-counts favorites as props

**✅ CONFIRMED**

- `totalFavorites` and `totalProps` both count `Favorite` rows on products (`app/api/user/[userId]/stats/route.ts` ~82–129).
- **Additional bug:** `totalFavorites` uses `{ listingId: { in: dishIds } }` instead of `dishId` (~87) — dish favorites undercounted in favorites, props query uses correct `dishId`.

### DishReview affects stats API trust average

**✅ CONFIRMED**

- Stats merges `productReviews` and `dishReviews` into one `averageRating` (~133–137).

---

## 7. Profile claims

### Profile V2 tabs: overview, aanbod, inspiratie, community, vertrouwen

**✅ CONFIRMED**

- `lib/profile/profile-v2/tabs.ts`.

### Gezocht is not a profile tab yet

**✅ CONFIRMED**

- No `gezocht` tab id; only i18n key for marketplace entry intent.
- Audit recommendation for Gezocht section is **future**, not current.

### Aanbod filters services/trade/help/tasks defined but hidden

**✅ CONFIRMED**

- `ProfileV2AanbodFilter` includes services, trade, help, tasks (`types.ts`).
- `PROFILE_V2_LIVE_AANBOD_FILTERS` only: all, chef, garden, designer (`offering-vertical.ts` ~139–144).

### Canonical profile URL is /user/[username]

**⚠️ PARTIALLY TRUE**

- `/user/[username]` exists with SEO metadata (`app/user/[username]/page.tsx`).
- `/seller/[sellerId]` and `/bezorger/[username]` **still serve standalone pages** — no redirect implemented.

---

## 8. SEO claims

### Product pages are SEO-indexed with slug paths

**✅ CONFIRMED**

- `generateMetadata` + JSON-LD in `app/product/[id]/layout.tsx`.
- `buildProductSlugPath()` in `lib/seo/productSlug.ts`.

### Inspiration has separate SEO routes

**✅ CONFIRMED**

- `/recipe/[id]`, `/garden/[id]`, `/design/[id]`, `/inspiratie/[id]`.

### Request pages not implemented

**✅ CONFIRMED**

- No `/request/[slug]` route in `app/`.

---

## 9. Summary scorecard

| Audit section | Validation |
|---------------|------------|
| Product as canonical listing | ✅ |
| Listing legacy status | ⚠️ still in feed/API |
| Dish / inspiration separation | ✅ |
| Community commerce path | ✅ |
| Delivery boundary | ✅ |
| Offer type matrix | ⚠️ digital/request fields missing |
| Feed REQUEST handling | ✅ |
| Feed kind derivation gap | ✅ |
| Dish price sale leak | ✅ |
| Inventory models | ✅ |
| Fulfillment enum mismatch | ✅ |
| Payment/value model | ✅ |
| Review/trust blending | ✅ |
| Props/Favorites conflict | ✅ (+ stats bug) |
| Profile structure | ⚠️ Gezocht not built |
| Profile URL canon | ⚠️ legacy routes live |
| SEO matrix | ✅ |
| Recommendations orphan | ✅ |

---

## 10. New findings not in original audit

1. **Stats API dish favorites bug:** `listingId: { in: dishIds }` — wrong field for dish favorites count.
2. **SmartRecommendations unused in app routes** — stronger orphan claim than "mock API".
3. **Product API still mutates Listing** — legacy path active in `app/api/products/[id]/route.ts`.
4. **`deriveFeedTaxonomy` comment stale** — REQUEST direction is implemented despite comment.

---

## Related documents

- [MARKETPLACE_ENTITY_ARCHITECTURE.md](../architecture/MARKETPLACE_ENTITY_ARCHITECTURE.md)
- [LISTING_KIND_SPEC.md](../architecture/LISTING_KIND_SPEC.md)
- [MARKETPLACE_CONFLICTS.md](./MARKETPLACE_CONFLICTS.md)
- [ADR-MARKETPLACE-FOUNDATION-V1.md](../decision-records/ADR-MARKETPLACE-FOUNDATION-V1.md)

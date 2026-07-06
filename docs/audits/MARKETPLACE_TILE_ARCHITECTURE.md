# Marketplace Tile Architecture — Phase T1–T2

**Status:** Architecture specification (presentation layer only)  
**Last updated:** 2026-07-06  
**Scope:** Tile variants, data contract, display rules — **no** Discovery ranking, sections, or feed logic changes

**Related audits:** [MARKETPLACE_TILE_INVENTORY.md](./MARKETPLACE_TILE_INVENTORY.md), [MARKETPLACE_TILE_DENSITY_AUDIT.md](./MARKETPLACE_TILE_DENSITY_AUDIT.md), [MARKETPLACE_TILE_UX_RECOMMENDATIONS.md](./MARKETPLACE_TILE_UX_RECOMMENDATIONS.md)

**Discovery foundation (unchanged):** Phase 0–2E trust, ListingKind, read model, ranking, sections, feed integration.

---

## 1. Purpose

Replace legacy feed cards (`FeedSaleCard`, `DiscoverGridTile`, `FeedInspirationCard`) with a **canonical tile system** that:

- Reads primarily from `DiscoveryReadModel`
- Meets mobile density targets (media ≥ 60% card height)
- Removes `UserStatsTile` from all discovery surfaces
- Expresses ListingKind, per-channel trust, and compact price/value on one line
- Leaves Discovery ranking, section builders, and `/api/feed` ordering **untouched**

---

## 2. Module layout (target)

```
components/marketplace/tiles/
  index.ts                          # public exports
  types.ts                          # MarketplaceTileModel, variant props
  map-to-tile-model.ts              # GeoFeedCardItem / FeedItem → MarketplaceTileModel
  build-tile-badges.ts                # priority queue → max N badges
  build-tile-trust-cue.ts             # single trust line from DiscoveryTrustContract
  build-tile-price-line.ts            # compact price/value (extends price-display)
  MarketplaceTileMedia.tsx            # shared image/video shell
  MarketplaceTilePersonRow.tsx        # avatar + maker + location
  MarketplaceTileBadgeStrip.tsx       # overlay + inline badges
  MarketplaceTileFavorite.tsx         # favorite overlay control
  MarketplaceTileCompact.tsx          # mobile default
  MarketplaceTileStandard.tsx         # desktop default
  MarketplaceTileMini.tsx             # profile grids (T2 scope: stub)
  MarketplaceTileSidebar.tsx          # sidebar slot (T2 scope: stub)
  MarketplaceTileRouter.tsx           # variant + inspiration/sale mode

lib/marketplace/tiles/
  tile-trust-rules.ts                 # allowed/forbidden trust signals
  tile-badge-priority.ts              # ordered badge kinds
  tile-display-contract.ts            # documentation types
```

**Integration point (only consumer change):**

- `FeedMarketplaceCard` → delegates to `MarketplaceTileRouter`
- `GeoFeed` discover grid → same router with `variant="compact"`
- Search results (when wired) → `MarketplaceTileCompact`

---

## 3. Canonical data model

### `MarketplaceTileModel`

Single view-model mapped from API payload + `discovery` block. **Tiles never read legacy engagement fields when `discovery` is present.**

```typescript
/** Presentation-only — not used for ranking */
type MarketplaceTileModel = {
  // Identity & navigation
  id: string;
  href: string;
  entityType: 'product' | 'dish' | 'listing' | 'workspace';

  // Media
  coverImage: string | null;
  videoUrl: string | null;
  videoPoster: string | null;
  imageAlt: string;

  // Listing semantics (from DiscoveryReadModel)
  listingKind: ListingKind;
  listingIntent: 'OFFER' | 'REQUEST' | null;
  marketplaceCategory: string | null;
  specializations: string[];
  acceptedSpecializations: string[];
  barterOpenness: string | null;
  availabilityDate: string | null;

  // Commerce
  priceCents: number | null;
  priceModel: string | null;
  orderMethod: string | null;

  // Person-first
  seller: {
    userId: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  } | null;

  // Location
  place: string | null;
  distanceKm: number | null;

  // Trust (DiscoveryTrustContract — no blend)
  trust: {
    productReviewCount: number;
    dealReviewCount: number;
    courierReviewCount: number;
    completedDeals: number;
    completedDeliveries: number;
    trustBadges: DiscoveryTrustBadge[];
    sellerTier: number;
  };

  // Social (tile-safe subset)
  favoriteCount: number;

  // Fulfillment (compact label key)
  fulfillmentMode: 'pickup' | 'delivery' | 'both' | 'digital' | 'on_site' | null;

  // Mode flags
  mode: 'sale' | 'inspiration';
  inspirationCategoryLabel?: string;

  // Future slots (T3+) — disabled in T1–T2
  sponsored?: false;
};
```

### Mapping rules (`map-to-tile-model.ts`)

| Source field | Tile field | Rule |
|--------------|------------|------|
| `item.discovery` | all semantic fields | **Primary** when present |
| `item.discovery.trust.product.reviewCount` | `trust.productReviewCount` | Never `averageRating` |
| `item.discovery.social.favoriteCount` | `favoriteCount` | Never `propsCount` |
| `item.viewCount` | — | **Dropped** on tile |
| `item.sellerBadges` (gamification) | — | **Not** trust; use `discovery.trust.trustBadges` only |
| Legacy without `discovery` | fallbacks via `consumer-accessors` | Log dev warning once per session |

---

## 4. Tile variants

### 4.1 `MarketplaceTileCompact` (T1 — primary)

| Attribute | Spec |
|-----------|------|
| **Default surfaces** | GeoFeed mobile (cards + discover grid), discovery section rows mobile, search results mobile |
| **Media ratio** | **4:5** (`aspect-[4/5]`); discover 2-col grid may use **1:1** via `mediaRatio` prop |
| **Media min share** | ≥ **60%** of total card height (enforce via aspect + max body rows) |
| **Body rows** | Max **4**: person, title, price line, trust cue |
| **Badges** | Max **2** on media overlay |
| **Actions** | `FavoriteButton` overlay top-right only |
| **CTA** | **None** — entire card (except favorite) taps to `href` |
| **Share** | No |
| **UserStatsTile** | **Forbidden** |

#### Layout (ASCII)

```
┌─────────────────────────┐
│ [badge] [badge]    [♥]  │  overlay
│                         │
│      IMAGE 4:5          │
│                         │
├─────────────────────────┤
│ ○ Maker · Rotterdam 3km │  person row (24px avatar)
│ Title line one          │  line-clamp-2
│ Title line two          │
│ €12,00 · Workshop       │  price + kind cue
│ 🤝 8 afspraken          │  one trust cue
└─────────────────────────┘
```

### 4.2 `MarketplaceTileStandard` (T1 — desktop)

| Attribute | Spec |
|-----------|------|
| **Default surfaces** | Desktop feed grid (`hc-home-feed-grid`), desktop discovery sections |
| **Media ratio** | **4:3** |
| **Body rows** | Max **5**: person, title, price line, trust row (1–2 cues), optional fulfillment hint |
| **Badges** | Max **3** on media |
| **Actions** | Favorite overlay + optional share icon (top-right cluster) |
| **CTA** | **None** full-width |
| **UserStatsTile** | **Forbidden** |

Replaces `.hc-home-feed-grid` CSS-only compaction — behavior lives in component.

### 4.3 `MarketplaceTileMini` (T2 — stub + profile)

| Attribute | Spec |
|-----------|------|
| **Surfaces** | Profile public aanbod (`MyDishesManager`), favorites grid (future) |
| **Media** | 1:1 or 4:3 small |
| **Body** | Title + price line only (2 rows) |
| **Badges** | 1 |
| **Actions** | Tap only |
| **T1** | Export stub; **T2** wires profile grids |

### 4.4 `MarketplaceTileSidebar` (T2 — stub)

| Attribute | Spec |
|-----------|------|
| **Surfaces** | Desktop right column (future sponsored — **out of scope T1–T2**) |
| **Media** | 16:9 or 4:3 compact |
| **Body** | 3 rows + text link CTA |
| **T1–T2** | Component shell only; **not mounted** in feed |

---

## 5. `MarketplaceTileRouter`

```typescript
type MarketplaceTileRouterProps = {
  item: GeoFeedCardItem;           // existing feed shape — mapped internally
  baseUrl: string;
  t: TFn;
  variant: 'compact' | 'standard' | 'mini' | 'sidebar';
  mode: 'sale' | 'inspiration';
  inspirationApiItem?: InspirationItem;
  mediaRatio?: '4:5' | '1:1' | '4:3';
};
```

**GeoFeed wiring (presentation only):**

| Condition | Router call |
|-----------|-------------|
| `useDiscoverGridTiles` | `variant="compact"`, `mediaRatio="1:1"` |
| Mobile cards column | `variant="compact"`, `mediaRatio="4:5"` |
| Desktop grid | `variant="standard"`, `mediaRatio="4:3"` |
| `FeedMarketplaceCard` | Replace body with router; keep taxonomy routing for href/mode |

**Unchanged:** `buildDiscoveryFeed`, section order, `orderedListingIds`, `GeoFeed` filter state, ranking profiles.

---

## 6. Badge system

### 6.1 Priority queue (`build-tile-badges.ts`)

Evaluate in order; take first N (compact=2, standard=3):

| Priority | Kind | Condition | Label source |
|----------|------|-----------|--------------|
| 1 | `sponsored` | `sponsored === true` | `discovery.sponsored.badge` — **disabled T1–T2** |
| 2 | `request` | `listingIntent === 'REQUEST'` | `marketplace.tile.badge.request` |
| 3 | `workshop_date` | `listingKind === 'WORKSHOP'` && `availabilityDate` | formatted date |
| 4 | `listing_kind` | kind ≠ `PRODUCT` && kind ≠ `INSPIRATION` | `marketplace.tile.kind.*` |
| 5 | `specialization` | first `specializations[0]` | taxonomy badge |
| 6 | `accepted_value` | first accepted specialization | taxonomy badge (accepted tone) |
| 7 | `trust_badge` | first `trust.trustBadges[0]` | badge name |

**Overflow:** `+N` pill (reuse `marketplace.badges.overflow`).

**Removed from tile:** generic “Te koop” chip when `listingKind` badge present; contact-only moves to price line suffix.

### 6.2 Placement

- **Overlay (media):** status + kind badges (priorities 1–4)
- **Inline (body):** never duplicate overlay badges; accepted value only if not in overlay slot

---

## 7. Trust display (`build-tile-trust-cue.ts`)

### 7.1 Selection algorithm (one line compact; standard may show two segments)

Pick **highest priority non-zero** channel:

| Priority | Condition | Format (NL) |
|----------|-----------|-------------|
| 1 | `trust.trustBadges[0]` | `🏅 {name}` |
| 2 | `trust.product.reviewCount ≥ 1` | `⭐ {n} productreviews` |
| 3 | `trust.deal.reviewCount ≥ 1` OR `completedDeals ≥ 1` | `🤝 {n} afspraken` |
| 4 | `trust.courier.reviewCount ≥ 1` OR `completedDeliveries ≥ 1` | `🚚 {n} bezorgingen` |
| 5 | `trust.sellerTier ≥ 4` | `✓ Ervaren maker` (tier label only — no score) |

**Standard desktop:** join top **two** with ` · ` if both fit; compact **one** only.

### 7.2 Forbidden on tiles

| Signal | Reason |
|--------|--------|
| `averageRating` / blended stars | Anti-gaming contract |
| `viewCount` | Engagement ≠ trust |
| `fansCount` / followers | Not tile-safe |
| `workspaceProps` / props | Inspiration signal |
| HCP / achievement badges | Gamification ≠ trust |
| `UserStatsTile` | Replaced by person row + trust cue |

---

## 8. Price / value display (`build-tile-price-line.ts`)

Extends `getMarketplacePriceDisplay` with barter-aware compact rules. **Single line**, `text-sm font-semibold`, tabular nums.

| Case | Display (NL) | Notes |
|------|--------------|-------|
| FIXED + cents | `€12,00` | |
| FROM_PRICE | `Vanaf €12,00` | existing key |
| HOURLY / DAILY | `€25/uur`, `€120/dag` | |
| ON_REQUEST | `Prijs op aanvraag` | |
| VOLUNTARY | `Vrijwillige bijdrage` | |
| Alt value only (no cents) | `Andere waarde` | `acceptedSpecializations.length > 0` |
| BARTER_ONLY | `Ruil` | new key `marketplace.tile.price.barterOnly` |
| MONEY_AND_BARTER + cents | `€50 + ruil` | new key `marketplace.tile.price.moneyAndBarter` |
| CONTACT order method | suffix ` · Contact` | compact, not badge |
| Inspiration mode | category label small | not `text-2xl` |

**Kind cue on same line:** append ` · {kindLabel}` when kind ≠ PRODUCT (max 1 segment).

**Not on tile:** accepted values row with heading — moves to **preview** (hover/long-press).

---

## 9. Person-first row (`MarketplaceTilePersonRow`)

```
[UserCircleAvatar 24px] {displayName} · {place | distance}
```

- Link on avatar/name → `/user/{username}` (`stopPropagation` on favorite)
- Location from `formatItemPlaceDistanceLine` using `discovery.city` ?? `place` + `distanceKm`
- **No** stats grid, **no** duplicate chip on media (remove `FeedSellerMediaChip` when person row present)

---

## 10. Media shell (`MarketplaceTileMedia`)

Reuse patterns from `FeedCardPrimaryMedia`:

- Photo / video with poster
- Hover play desktop; intersection play touch
- Favorite + badge overlays in `absolute` layer
- Aspect ratio from variant prop
- `role="link"` on media tap area when card is clickable

**Native Capacitor:** T1 keeps 4:5 compact; evaluate 3:4 override in T3 if needed.

---

## 11. Inspiration mode

Same variants; differences:

| Field | Sale | Inspiration |
|-------|------|-------------|
| Price line | commerce | category label (small) |
| Badges | kind/specialization | category vertical |
| Trust cue | seller channels | optional single deal cue or omit |
| Favorite | `productId` | `dishId` |
| `listingKind` | PRODUCT/SERVICE/… | INSPIRATION |

---

## 12. UserStatsTile policy

| Surface | UserStatsTile |
|---------|---------------|
| GeoFeed / discovery tiles | **Never** |
| Search results | **Never** |
| Profile V2 overview / user page | **Yes** |
| Product detail seller block | **Yes** |
| Inspiratie standalone (legacy) | Remove when migrated |

---

## 13. i18n keys (new — T1)

```
marketplace.tile.kind.product
marketplace.tile.kind.service
marketplace.tile.kind.task
marketplace.tile.kind.workshop
marketplace.tile.kind.coaching
marketplace.tile.kind.request
marketplace.tile.kind.inspiration
marketplace.tile.badge.request
marketplace.tile.price.barterOnly
marketplace.tile.price.moneyAndBarter
marketplace.tile.trust.productReviews
marketplace.tile.trust.deals
marketplace.tile.trust.deliveries
marketplace.tile.trust.established
```

---

## 14. Testing strategy (T1–T2)

| Layer | Tests |
|-------|-------|
| `map-to-tile-model` | Unit: discovery present/absent, each ListingKind |
| `build-tile-badges` | Unit: priority order, max N, overflow |
| `build-tile-trust-cue` | Unit: channel priority, forbidden fields |
| `build-tile-price-line` | Unit: all priceModel + barter combos |
| Snapshot | Compact + Standard render (fixture models) |
| Manual | GeoFeed mobile/desktop, discovery sections, favorite tap |

**Script:** `scripts/validate-marketplace-tiles.ts` (T2) — pure function validation.

---

## 15. Explicit non-goals (T1–T2)

- Activity cards
- Sponsored placements (badge priority slot reserved only)
- Recommendations slot
- Discovery ranking / section eligibility changes
- `/api/feed` response shape changes
- Dorpsplein legacy page rewrite (deprecate later)
- Hover/preview UI implementation (specified in preview architecture doc)

---

## 16. Success metrics

| Metric | Target |
|--------|--------|
| Mobile card info:image height ratio | ≤ 0.65 |
| `UserStatsTile` in feed tree | 0 instances |
| Blended rating on tiles | 0 |
| ListingKind visible when ≠ PRODUCT | 100% sale tiles |
| Lighthouse CLS on feed | No regression |

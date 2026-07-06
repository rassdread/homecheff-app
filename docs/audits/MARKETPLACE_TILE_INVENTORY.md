# Marketplace Tile Inventory — Audit V1

**Status:** Audit only  
**Last updated:** 2026-07-06  
**Scope:** All listing/tile surfaces before ListingKind + Discovery architecture rollout

---

## Summary

| Category | Active components | Legacy / unused |
|----------|------------------|-----------------|
| Feed / homepage | 5 + media helper | — |
| Discover grid (mobile) | 1 | — |
| Dorpsplein | 0 (inline only) | `DorpspleinPageContent` orphaned |
| Inspiratie | 2 | Route redirects to `/` |
| Profile | 4 managers + summary grids | `FavoritesGrid` unused |
| Home sidebar | 4 card-like | — |
| Marketplace | 0 cards (badge atoms only) | — |
| Products | 0 listing cards | Forms only |
| Legacy | — | `ItemCard.tsx` (unused in feed) |

**Primary live surfaces today:** `/` → `GeoFeed` → `FeedSaleCard` / `FeedInspirationCard` / `DiscoverGridTile`.

Discovery section cards reuse the same `FeedMarketplaceCard` — no separate section card component.

---

## Feed (`components/feed/`)

### `FeedMarketplaceCard` — `FeedMarketplaceCard.tsx`

| Field | Value |
|-------|-------|
| **Surface** | Homepage `GeoFeed` — all discovery section rows |
| **Routes** | `/`, `/?chip=sale`, `/?chip=all`, nearby/national scopes |
| **Behavior** | Router: delegates to sale or inspiration variant |
| **Desktop** | `FeedSaleCard` / `FeedInspirationCard` in grid (`hc-home-feed-grid` on desktop split) |
| **Mobile** | Same cards in column **or** `DiscoverGridTile` when layout = discover |

---

### `FeedSaleCard` — `GeoFeedCards.tsx`

| Field | Value |
|-------|-------|
| **Surface** | Homepage feed — marketplace sale items |
| **Image ratio** | Default `aspect-[4/3]`; `hc-feed-media-tall` min-height 12.5–14rem; desktop grid forced 4/3; native Capacitor **3/4** |
| **Info shown** | Title (2 lines), price (`formatProductPriceLabel`), location, delivery mode, community save line, taxonomy badges, accepted values row |
| **Seller** | `FeedSellerMediaChip` on image; `UserStatsTile` (mobile) / `FeedCardCompactStats` (desktop) |
| **Badges** | Sale chip, contact-only, `MarketplaceBadgeList` (max 2), `MarketplaceAcceptedBadgesRow` (max 2), `UserBadgeChips` (max 2) |
| **Trust** | `UserStatsTile`: fans, favorites, props, reviews, **blended avg rating**, community feedback, views |
| **Social** | View count, `FavoriteButton`, community “saved by N” (favorites ≥ 2) |
| **Price** | Large `text-xl sm:text-2xl` |
| **Location** | `feedLocationLine` (place · distance) |
| **Actions** | Primary CTA “View offer”, `ShareButton`, `FavoriteButton` |

---

### `FeedInspirationCard` (+ Feed / Api wrappers) — `GeoFeedCards.tsx`

| Field | Value |
|-------|-------|
| **Surface** | Homepage feed — inspiration interleave |
| **Image ratio** | Same as `FeedSaleCard` |
| **Info shown** | Title, category label (duplicate on mobile), location |
| **Seller** | Media chip + `UserStatsTile` / compact stats |
| **Badges** | Category chip on media |
| **Trust / social** | Same `UserStatsTile` pattern |
| **Price** | None — CTA text instead |
| **Actions** | Inspiration CTA, share, views, favorite (dishId) |

---

### `DiscoverGridTile` — `DiscoverGridTile.tsx`

| Field | Value |
|-------|-------|
| **Surface** | Mobile/native feed when `effectiveFeedLayoutMode === "discover"` |
| **Image ratio** | **1:1** (CSS override on `.feed-discover-tile-media`) |
| **Info shown** | Title, specialization badges (sale), creator name (duplicate), location, accepted values, price, views/favorites |
| **Seller** | Chip on media + text line in body |
| **Badges** | Sale/inspiration chip, `MarketplaceBadgeList`, `MarketplaceAcceptedBadgesRow` |
| **Trust** | Views + favorite count only (no `UserStatsTile`) |
| **Actions** | Title link only — **no** share/favorite/CTA button on tile |

---

### `FeedCardPrimaryMedia` — `feedMedia.tsx`

| Field | Value |
|-------|-------|
| **Role** | Shared media shell (not a full card) |
| **Ratio** | `aspect-[4/3]` default; overridden per context |
| **Features** | Photo/video, hover play desktop, intersection play touch |

---

### `DiscoveryFeedSectionHeading` — (section headers, not listing tiles)

Section band headers between card groups — typography only, no listing data.

---

## Dorpsplein (`components/dorpsplein/`)

### Inline product card — `DorpspleinPageContent.tsx` (~L1409–1793)

| Field | Value |
|-------|-------|
| **Surface** | Legacy discover hub — **orphaned** (`/dorpsplein` redirects to `/`) |
| **Image** | Grid `h-64`; list `w-48 h-48` (fixed, not aspect-ratio) |
| **Info** | Title, price overlay + body, description snippet, delivery pills, location |
| **Seller** | `UserStatsTile` + `UserBadgeChips` |
| **Badges** | Vertical category, contact-only, `MarketplaceBadgeList`, `MarketplaceAcceptedBadgesRow` |
| **Actions** | Card click, favorite, options menu (share, details), guest login CTA |
| **Grid** | 1→4 cols responsive; list mode horizontal |

### Inline user search card — same file (~L1276–1374)

| Field | Value |
|-------|-------|
| **Surface** | User search results in legacy hub |
| **Image** | Avatar area `h-64` grid / `w-32 h-32` list |
| **Info** | Name, username, role pills, product/fan counts, location |
| **Actions** | Link to `/user/[username]` |

---

## Inspiratie (`components/inspiratie/`)

### `InspirationCard` — `InspirationCard.tsx`

| Field | Value |
|-------|-------|
| **Surface** | `InspiratieContent` — **no active route** (`/inspiratie` → `/`) |
| **Variants** | `grid` \| `list` |
| **Image** | Grid `aspect-[4/3]`; list square thumb 144–160px |
| **Info** | Title, subcategory, description snippet (list), **large emerald category as pseudo-price** (`text-2xl`) |
| **Seller** | `UserStatsTile` min-h 5.5rem + badge chips |
| **Actions** | CTA, share, views, favorite; guest card click → login |

### `InspirationCardMedia` — `InspirationCardMedia.tsx`

Media subcomponent — fills parent box.

---

## Profile (`components/profile/`)

### `ProductManagement` inline cards — `ProductManagement.tsx`

| Field | Value |
|-------|-------|
| **Surface** | Profile V2 → Aanbod → owner products (`MyDishesManager`) |
| **Image** | `h-48 object-cover` |
| **Info** | Title, category, price, description, stock, delivery, recipe meta |
| **Badges** | Active/inactive, low stock, out of stock |
| **Actions** | Click → `/product/[id]/edit` |
| **Grid** | `sm:2 lg:3` |

### `RecipeManager` / `GardenManager` — owner inspiratie grids

| Field | Value |
|-------|-------|
| **Image** | Grid `h-48`; list `w-48 h-32` |
| **Info** | Title, meta (prep/sunlight/tags), private badge |
| **Actions** | Navigate detail; owner edit/delete |

### `MyDishesManager` public summary cards — `/user/[username]`

| Field | Value |
|-------|-------|
| **Image** | `aspect-video` or `h-48` |
| **Info** | Title, description clamp, category/date |
| **Actions** | Click → recipe/garden/design/product route |

### Non-listing profile cards

| Component | Surface | Purpose |
|-----------|---------|---------|
| `ProfileV2PreviewCard` | Profile overview | Section shortcuts — no image |
| `SellerRoleCard` / `BuyerRoleCard` | Rollen tab | Role summary |
| `TrustSectionCard` | Trust blocks | Container for workspace photos |
| `SidepanelActionCard` | Owner sidepanel | Icon + link |

---

## Home (`components/home/`)

| Component | Surface | Listing tile? |
|-----------|---------|---------------|
| `HomeVerticalCards` | Hero | No — vertical filter chips |
| `HomeReputationCompactCard` | Sidebar / mobile insert | No — HCP card |
| `HomeProfileProgressCard` | Sidebar | No |
| `CreatorMomentumCard` | Sidebar | No |
| `HomeRecommendedPromotions` | Sidebar / feed insert | No — platform promos |
| `CommunityPulseBar` | Sidebar / insert | No — stats strip |

---

## Marketplace (`components/marketplace/`)

Badge atoms consumed by feed cards — **not** standalone tiles:

| Component | Role |
|-----------|------|
| `MarketplaceBadgeList` | Specialization / category chips |
| `MarketplaceAcceptedBadgesRow` | Accepted values + heading |
| `MarketplaceBadge` | Single taxonomy badge |

---

## Legacy / unused

| Component | Notes |
|-----------|-------|
| `ItemCard.tsx` | Full product card with slider, seller row, blended rating — **not used in GeoFeed** |
| `FavoritesGrid.tsx` | Simple image + title + price — **no imports** |
| `DorpspleinPageContent` | Rich cards but route redirected |
| `InspiratieContent` | Only via orphaned `DiscoverHubClient` |

---

## Search

No dedicated search result card component. Search classification attaches to API records; **feed cards render search-filtered GeoFeed items**.

---

## Cross-surface aspect ratio reference

| Context | Ratio / size |
|---------|----------------|
| `FeedCardPrimaryMedia` default | 4:3 |
| Discover grid tile | 1:1 |
| Desktop `.hc-home-feed-grid` | 4:3 + compact body CSS |
| Native Capacitor feed | 3:4 |
| `hc-feed-media-tall` | min-height 12.5–14rem |
| `InspirationCard` grid | 4:3 |
| Dorpsplein product grid | h-64 fixed |
| Profile management | h-48 / aspect-video |

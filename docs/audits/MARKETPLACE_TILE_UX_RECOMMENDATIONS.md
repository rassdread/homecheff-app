# Marketplace Tile UX Recommendations — V1

**Status:** Audit only — architecture & rules, no implementation  
**Last updated:** 2026-07-06  
**Related:** [MARKETPLACE_TILE_INVENTORY.md](./MARKETPLACE_TILE_INVENTORY.md), [MARKETPLACE_TILE_DENSITY_AUDIT.md](./MARKETPLACE_TILE_DENSITY_AUDIT.md)

---

## Part 3 — New data support audit (`DiscoveryReadModel`)

| Field | FeedSaleCard | DiscoverGridTile | InspirationCard | Profile public | Notes |
|-------|--------------|------------------|-----------------|----------------|-------|
| `listingKind` | Partial | Partial | Partial | No | On `item.discovery` but **not rendered** as badge |
| `listingIntent` | Partial | Partial | Partial | No | Data present; no REQUEST label on tile |
| `specializations` | **Yes** | **Yes** | No | No | Via `MarketplaceBadgeList` |
| `acceptedSpecializations` | **Yes** | **Yes** | No | No | Via `MarketplaceAcceptedBadgesRow` |
| `trust.product` | **Missing** | **Missing** | **Missing** | No | Uses legacy `UserStatsTile` instead |
| `trust.deal` | **Missing** | **Missing** | **Missing** | No | — |
| `trust.courier` | **Missing** | **Missing** | **Missing** | No | — |
| `trust.trustBadges` | Partial | No | Partial | No | `UserBadgeChips` — gamification mix |
| `trust.sellerTier` | **Missing** | **Missing** | **Missing** | No | Not on tiles |
| `social.favoriteCount` | **Yes** | **Yes** | Partial | No | Community save line threshold ≥ 2 |
| `social.fansCount` | Partial | No | Partial | No | Via `UserStatsTile` only |
| `distanceKm` | **Yes** | **Yes** | **Yes** | No | `feedLocationLine` |
| `city` / `region` | Partial | Partial | Partial | No | Falls back to `place` string |
| `fulfillment` | Partial | No | No | Partial | Delivery mode text on sale card only |
| `payment path` | Partial | Partial | No | No | Contact-only badge; no checkout icon |
| `priceModel` | **Yes** | **Yes** | N/A | Partial | `formatProductPriceLabel` |
| `barterOpenness` | **Missing** | **Missing** | **Missing** | No | On read model, not shown |
| `availabilityDate` | **Missing** | **Missing** | **Missing** | No | Needed for workshops/events |
| `community feedback` | Partial | No | Partial | No | In `UserStatsTile` — not listing-scoped |
| `sponsored label` | **Missing** | **Missing** | **Missing** | No | [Future — DISCOVERY_SPONSORED_PLACEMENTS.md](../architecture/DISCOVERY_SPONSORED_PLACEMENTS.md) |
| `activity context` | **Missing** | **Missing** | **Missing** | No | Activity cards separate slot |

### Should NOT show on tile

- Blended / average rating across channels
- HCP points, achievement badges as trust
- View count as primary signal (detail only)
- Workspace props on marketplace sale tiles
- Full trust tier grid
- Discovery section scores or ranking debug

---

## Part 4 — Person-first audit

| Question | FeedSaleCard | DiscoverGridTile | InspirationCard |
|----------|--------------|------------------|-----------------|
| Seller visible? | Yes (chip + stats) | Yes (duplicated) | Yes (stats) |
| Avatar visible? | Yes on media | Yes on media | In stats only (grid) |
| Name visible? | Yes | Yes ×2 | Yes |
| Trust visible? | Yes but wrong shape | Minimal | Yes but wrong shape |
| Location visible? | Yes | Yes | Yes |
| Fan/favorite relation? | Partial | Favorite count only | In stats |
| Card about maker or item? | **Mixed** — item title leads, maker block dominates mobile height |

### Minimum person-first row (recommended)

```
[avatar 24px] Maker Name · Place/Distance
```

Plus exactly **one** trust cue and **one** capability cue — not full stat grid.

---

## Part 5 — Mobile card UX audit

| Area | Current | Issue |
|------|---------|-------|
| Image ratio | 4/3 cards / 1:1 discover / 3/4 native | Inconsistent across modes |
| Tap area | Whole card + nested links | Competes with favorite/share |
| Favorite | Bottom-right in CTA row | OK but small |
| CTA | Full primary button | Heavy — should be tap-to-detail |
| Badge overflow | +N overflow on taxonomy | OK |
| Accepted values | Full row with heading | Too tall |
| Trust cue | 6-stat grid | Far too heavy |
| Seller row | Chip + stats | Redundant |
| Safe area | Standard padding | Bottom nav — feed scroll OK |
| Section bands | Discovery headings | Add vertical rhythm — OK |

### Recommended mobile pattern (`MarketplaceTileCompact`)

```
┌─────────────────────┐
│ [badge]      [♥]    │  ← max 2 badges; favorite top-right
│                     │
│      IMAGE 4:5      │
│                     │
│ [av] Maker · 2 km   │  ← person-first row
├─────────────────────┤
│ Title line-clamp-2  │
│ €12 · Workshop      │  ← price + one kind/spec cue
│ ⭐4.8 prod · 3 deals│  ← one trust line max
└─────────────────────┘
```

- **No** primary CTA button on tile — card tap opens detail
- **No** `UserStatsTile` on feed tiles
- Max **2** badges, **1** trust line

---

## Part 6 — Desktop card UX audit

| Variant | Current | Recommendation |
|---------|---------|----------------|
| Grid feed card | Compact CSS patch on same component | `MarketplaceTileStandard` — slightly more context than mobile |
| Feed column | 2–3 col grid | Keep 4/3 media; person row + 2 trust cues max |
| Sidebar | Promos only today | `MarketplaceTileSidebar` for sponsored spotlight |
| Profile grid | Lighter cards | `MarketplaceTileMini` for profile aanbod |

### Desktop variants

| Variant | Max text rows | Trust | Actions |
|---------|---------------|-------|---------|
| **Compact** | 3 | 1 cue | Favorite + tap |
| **Standard** | 4 | 1–2 cues | Favorite + share |
| **Sidebar** | 3 | 1 cue | CTA link |
| **Detail-preview** | 6 | 2 cues | Full CTA (profile owner preview only) |

---

## Part 7 — Card variant architecture

### `MarketplaceTileCompact`

| Attribute | Spec |
|-----------|------|
| **Where** | Mobile feed, discover grid, search results |
| **Image** | 4:5 or 1:1; min-height none |
| **Text rows** | 3 (person, title, price/trust) |
| **Badges** | 2 max on media |
| **Actions** | Favorite overlay; tap = open |
| **Trust** | 1 compact line from `discovery.trust` channels |
| **Price** | Single line `formatProductPriceLabel` |

### `MarketplaceTileStandard`

| Attribute | Spec |
|-----------|------|
| **Where** | Desktop feed grid, discovery sections |
| **Image** | 4:3 |
| **Text rows** | 4 |
| **Badges** | 2 taxonomy + 1 kind |
| **Actions** | Favorite, optional share |
| **Trust** | 1–2 channel cues + 1 trust badge max |
| **Price** | Standard weight (not text-2xl) |

### `MarketplaceTileWide`

| Attribute | Spec |
|-----------|------|
| **Where** | List layouts, dorpsplein list mode, messages proposals |
| **Image** | Square thumb 96–120px |
| **Text rows** | 4–5 horizontal |
| **Badges** | 2 inline |
| **Actions** | Overflow menu |

### `MarketplaceTileSidebar`

| Attribute | Spec |
|-----------|------|
| **Where** | Desktop sidebar, sponsored spotlight |
| **Image** | 16:9 or 4:3 small |
| **Text rows** | 3 |
| **Badges** | Sponsored + kind |
| **Actions** | Text CTA link |

### `MarketplaceTileMini`

| Attribute | Spec |
|-----------|------|
| **Where** | Profile aanbod grid, favorites, cross-sell |
| **Image** | 1:1 or 4:3 small |
| **Text rows** | 2 (title, price) |
| **Badges** | 1 |
| **Actions** | Tap only |

**Implementation note:** One shared data props type (`MarketplaceTileModel` mapped from `DiscoveryReadModel` + legacy fallbacks). Variants are presentation only.

---

## Part 8 — Badge / icon rules

### Priority order (max 3 visible, 2 on compact)

1. **Status:** Gesponsord · Gezocht (REQUEST) · Workshop/Event datum
2. **ListingKind:** Workshop · Coaching · Service · Taak · Product
3. **Primary specialization** (one taxonomy chip)
4. **Accepted value** (one chip + `+N`)
5. **Trust badge** (one: e.g. Betrouwbare verkoper)

### Overflow

- Show `+N` pill — already in `MarketplaceBadgeList`
- Never wrap to third row on compact
- Kind badge replaces generic “Te koop” chip when kind ≠ PRODUCT

### ListingKind display map

| Kind | Tile label key |
|------|----------------|
| PRODUCT | (no extra — sale chip enough) |
| SERVICE | `listingKind.service` |
| TASK | `listingKind.task` |
| WORKSHOP | `listingKind.workshop` |
| COACHING | `listingKind.coaching` |
| REQUEST | `listingKind.request` |
| INSPIRATION | Category vertical |

---

## Part 9 — Price / value display rules

Use existing `getMarketplacePriceDisplay` — **compact single line**:

| Model | Tile text (NL) |
|-------|----------------|
| FIXED + cents | `€12,00` |
| FROM_PRICE | `Vanaf €12,00` |
| HOURLY | `€25/uur` |
| DAILY | `€120/dag` |
| ON_REQUEST | `Prijs op aanvraag` |
| VOLUNTARY | `Vrijwillige bijdrage` |
| Alt value only | `Andere waarde` |
| CONTACT + no price | `Prijs op aanvraag` |
| Money + accepted | `€50` + accepted chip (not inline ruil text) |

**Rules:**
- Never `text-2xl` on tile — use `text-sm font-bold` (compact) or `text-base` (standard)
- Inspiration: no price row — category as small chip only, not pseudo-price

---

## Part 10 — Trust display rules

### Allowed on tiles (per-channel, no blend)

| Cue | Format | When |
|-----|--------|------|
| Product reviews | `⭐ Producten · {count}` or median display on detail only | `trust.product.reviewCount ≥ 1` |
| Deal evidence | `🤝 {n} afspraken` | `trust.deal.reviewCount` or `completedDeals` |
| Courier | `🚚 {n} bezorgingen` | Courier listings / delivery profile |
| Trust badge | `🏅 {name}` | `trust.trustBadges[0]` |
| Tier dot | Subtle dot + “Actief” / “Ervaren” | `sellerTier ≥ 2` — optional |

### Forbidden on tiles

- `UserStatsTile` blended `averageRating`
- Combined stars across product + deal
- HCP / achievement badges as trust substitute
- Workspace props
- View counts as trust proxy

### By card type

| Card type | Trust cue |
|-----------|-----------|
| Product | Product channel or deal count |
| Service / Task | Deal channel |
| Workshop / Coaching | Deal + availability |
| Request | Buyer tier or “Gezocht” only — no seller trust grid |
| Inspiration | Optional creator deal count — or none on tile |
| Sponsored | Gesponsord label **is not trust** |

---

## Part 11 — Actions audit

| Action | Tile? | Detail? |
|--------|-------|---------|
| Open / tap | **Yes** (primary) | — |
| Favorite | **Yes** (overlay) | — |
| Share | Desktop standard only | **Yes** preferred |
| Message | No | **Yes** |
| Proposal / checkout | No | **Yes** |
| Follow / fan | No | Profile |
| Props | No | Inspiration detail |
| Open profile | Via maker row tap | **Yes** |

### Recommended tile actions

**Mobile:** favorite + card tap  
**Desktop:** favorite + share (icon) + card tap  
**Remove:** full-width `hc-btn-primary` on feed tiles

---

## Part 12 — Instagram-like feed direction

### Mobile layout (target)

```
┌──────────────────────────┐
│ WORKSHOP          ♥      │
│                          │
│        [  IMAGE 4:5 ]    │
│                          │
│ ○ Lisa · Rotterdam 3 km  │
├──────────────────────────┤
│ Sourdough workshop       │
│ €45 · Za 12 jul          │
│ 🤝 8 afspraken           │
└──────────────────────────┘
```

### Desktop layout (target)

```
┌────────────────────────┐
│ GESPONSORD        ♥    │
│      [ IMAGE 4:3 ]     │
│ ○ Studio · 2 km        │
│ Keramiek workshop      │
│ €60 · Workshop         │
│ ⭐ 12 · 🤝 4 afspraken │
└────────────────────────┘
```

### Principles

1. **Image-first** — ≥55% of card height is media on mobile
2. **Person row** immediately under image (not buried in stats grid)
3. **Title** one weight level below today
4. **Price + kind** on one line
5. **One trust line** — channel-specific
6. **CTA on detail** — tap card to open
7. **Breathing room** — `gap-1.5` body, no `min-h` on stats wrappers

### Discovery sections

Section headings stay **outside** cards — never inflate card body. Section bands use `DiscoveryFeedSectionHeading` only.

---

## Part 13 — Decision

### Recommendation: **C — Full tile redesign** (phased)

**Not A.** Current mobile feed cards are **not acceptable** for the new architecture: info block exceeds image, `UserStatsTile` violates trust display rules, and ListingKind / per-channel trust / workshop dates cannot be expressed correctly.

**Not B alone.** CSS compaction on desktop already exists; mobile still uses the heavy component. Badge overflow fixes without structural change will not unlock Discovery data.

**C with phased delivery** — define canonical `MarketplaceTile*` variants, migrate surfaces incrementally.

### Why C

1. **Architecture mismatch** — `DiscoveryReadModel` and `DiscoveryTrustContract` exist; tiles still use pre-Phase-2 `UserStatsTile`
2. **Confirmed density bug** — mobile `FeedSaleCard` ratio 1.3–2.2× info:image
3. **DiscoverGridTile proves** lighter pattern works — formalize it
4. **Upcoming slots** — sponsored placements and activity cards need distinct tile shells
5. **Person-first goal** — requires restructuring, not trimming padding

### Suggested implementation phases

| Phase | Scope | Outcome |
|-------|-------|---------|
| **T1 — Compact feed** | Replace `UserStatsTile` on `FeedSaleCard` / inspiration with `MarketplaceTileCompact` person row + 1 trust line; remove primary CTA; adopt 4:5 media | Mobile scanability fixed |
| **T2 — Discovery data** | Wire `listingKind`, per-channel trust, workshop date, REQUEST label; badge priority rules | Architecture-aligned tiles |
| **T3 — Variant split** | Extract `MarketplaceTileStandard` (desktop), unify `DiscoverGridTile` | Remove CSS-only desktop patch |
| **T4 — Surface migration** | Profile aanbod mini, dorpsplein cleanup or delete legacy, inspiratie alignment | One taxonomy across app |
| **T5 — Commercial slots** | `MarketplaceTileSidebar` + sponsored overlay badge | Sponsored placements ready |
| **T6 — Polish** | Skeleton, loading, a11y, i18n audit | Production quality |

**T1 + T2** ≈ 1–2 sprints. Full **C** through T6 ≈ 3–4 sprints.

---

## Appendix — File change map (future, not now)

| Current | Target |
|---------|--------|
| `FeedSaleCard` | `MarketplaceTileStandard` / `Compact` |
| `DiscoverGridTile` | `MarketplaceTileCompact` (merge) |
| `FeedInspirationCard` | `MarketplaceTileCompact` (inspiration mode) |
| `UserStatsTile` on feed | Remove — profile/detail only |
| `MarketplaceBadgeList` | Keep — shared |
| `InspirationCard` | Align to compact or deprecate with redirect |
| `DorpspleinPageContent` cards | Deprecate or migrate |
| `ItemCard` | Delete or archive |

---

## Validation checklist (pre-implementation)

- [ ] Mobile card info height ≤ image height (p50)
- [ ] No blended rating on any marketplace tile
- [ ] `listingKind` visible when ≠ PRODUCT
- [ ] REQUEST listings show “Gezocht” not sale styling
- [ ] Max 2 badges on compact variant
- [ ] Sponsored label distinct from trust badges
- [ ] Discovery section cards use same variant as feed
- [ ] Person row visible without scrolling card body

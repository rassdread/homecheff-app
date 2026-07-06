# Marketplace Presentation Matrix — By ListingKind

**Status:** Audit only — architecture specification  
**Last updated:** 2026-07-06  
**Prerequisites:** [MARKETPLACE_TILE_ARCHITECTURE.md](./MARKETPLACE_TILE_ARCHITECTURE.md), [LISTING_KIND_SPEC.md](../architecture/LISTING_KIND_SPEC.md)

**Scope:** Defines exactly what each `ListingKind` shows on Discovery tiles **before** T1 implementation. No ranking, API, or UI code changes.

---

## Global rules (all kinds)

| Rule | Applies to |
|------|------------|
| Primary data source | `DiscoveryReadModel` when present |
| `UserStatsTile` | **Never** on discovery tiles |
| Blended rating / `averageRating` | **Never** |
| `viewCount`, `fansCount`, workspace props | **Never** on tile |
| Max badges | Compact **2**, Standard **3**, Mini **1** |
| Tile actions | Favorite + tap (Standard: + share) — **no** full-width CTA |
| Discovery sections | Same tile component regardless of section — heading only differs |
| INSPIRATION | `mode=inspiration` — excluded from marketplace section pool |

---

## Summary matrix

| Kind | Person on tile | Primary trust channel | Price emphasis | Key badge |
|------|----------------|----------------------|----------------|-----------|
| **PRODUCT** | Seller/maker | Product reviews | Fixed € | Specialization or category |
| **SERVICE** | Provider | Deal reviews | On request / hourly | Service + spec |
| **TASK** | Helper | Deal reviews | Hourly / on request | Taak + practical spec |
| **WORKSHOP** | Host | Deal reviews | Fixed / from price | **Date** + Workshop |
| **COACHING** | Coach | Deal reviews | Hourly / on request | Coaching + knowledge spec |
| **REQUEST** | **Requester** (buyer) | Deal (post-match) | Budget / on request | **Gezocht** |
| **INSPIRATION** | Creator | **None** on tile | None — category only | Vertical category |

---

## PRODUCT

### 1. Primary information

| Field | Compact | Standard |
|-------|---------|----------|
| Cover media | Required | Required |
| Title | 2 lines | 2 lines (1 line if grid dense) |
| Seller person row | Avatar + name + place/distance | Same |
| Price | `€X,XX` or price model label | Same + optional fulfillment hint |

### 2. Secondary information

| Field | Tile | Preview only |
|-------|------|--------------|
| Primary specialization | 1 badge max | + overflow list |
| Marketplace category (legacy vertical) | Via badge resolver | — |
| Delivery mode | — | Pickup / delivery / shipping / digital icons |
| `favoriteCount` | Only if ≥ 2: subtle “saved by N” **optional T2** — default **omit** on tile | — |
| Barter openness | Price line suffix | Full accepted values |

### 3. Trust information

**Tile (one cue):** priority order:

1. Trust badge (`betrouwbare-verkoper`)
2. `⭐ {n} productreviews` (`trust.product.reviewCount`)
3. `🤝 {n} afspraken` if product reviews = 0
4. Tier ≥ 4: `✓ Ervaren maker`

**Forbidden:** blended stars, views, fans, HCP.

**Standard:** may show product + deal cue joined ` · ` if both non-zero.

### 4. Payment / value information

| priceModel | Tile line |
|------------|-----------|
| FIXED | `€12,00` |
| FROM_PRICE | `Vanaf €12,00` |
| ON_REQUEST | `Prijs op aanvraag` |
| VOLUNTARY | `Vrijwillige bijdrage` |
| Alt value only | `Andere waarde` |
| BARTER_ONLY | `Ruil` |
| MONEY_AND_BARTER | `€50 + ruil` |
| CONTACT | `Prijs op aanvraag · Contact` |

Append kind cue: **omit** (PRODUCT is default — no `· Product` suffix).

### 5. Badge priority (PRODUCT-specific)

1. Sponsored *(future — off)*
2. Request *(N/A for PRODUCT)*
3. Workshop date *(N/A)*
4. ListingKind *(skip — default)*
5. **Primary specialization** (e.g. `Groente`, `Gebak`)
6. Accepted value chip *(only if barter — else defer to preview)*
7. Trust badge

### 6. Preview information

- Description (2 lines)
- Fulfillment row (pickup/delivery/shipping/digital)
- Accepted values (up to 5)
- Barter / payment detail if not on tile
- Extra trust channel if tile showed only one
- **Not:** checkout, full reviews

### 7. Desktop differences

- `MarketplaceTileStandard`, 4:3 media
- Share icon enabled
- 3 badges; 2-segment trust row allowed
- Fulfillment hint one icon inline below trust (optional)

### 8. Mobile differences

- `MarketplaceTileCompact`, 4:5 (discover grid 1:1)
- 2 badges; 1 trust cue
- No share on tile

### 9. Sidebar placement

- **Not default** in feed sidebar (T1–T2)
- Future sponsored PRODUCT: `MarketplaceTileSidebar` — image + title + € + maker
- Profile aanbod: `MarketplaceTileMini` — title + € only

### 10. Discovery section behavior

Eligible in all marketplace sections (`nearby`, `trusted_makers`, `top_rated`, `trending`, `new_creators`). **Tile identical** in every section — section title provides context (`nearby`, `Trending`, etc.). Ranking unchanged.

**Section emphasis (presentation hint only, not extra fields):**

| Section | User mental model |
|---------|-------------------|
| nearby | Emphasize distance in person row |
| trusted_makers | Trust cue likely populated |
| top_rated | Product review cue likely populated |
| trending | No extra tile fields |
| new_creators | No extra tile fields |

---

## SERVICE

### 1. Primary information

| Field | Notes |
|-------|-------|
| Title | Service outcome oriented |
| Person row | **Provider** (seller) |
| Price | Often `Prijs op aanvraag` or `€/uur` |

### 2. Secondary information

| Field | Tile | Preview |
|-------|------|---------|
| Service specialization | 1 badge (`design.website`, etc.) | Full spec list |
| Fulfillment | — | onSiteClient / onSiteProvider / digital |
| Duration / scope | — | Description snippet |

### 3. Trust information

**Primary channel: Deal**

1. Trust badge
2. `🤝 {n} afspraken` (`deal.reviewCount` or `completedDeals`)
3. Product reviews only if checkout-wired and > 0
4. Tier ≥ 4

**Never** product-only stars as sole cue when deal evidence exists.

### 4. Payment / value information

| Common | Tile line |
|--------|-----------|
| ON_REQUEST | `Prijs op aanvraag` |
| HOURLY | `€45/uur` |
| DAILY | `€120/dag` |
| FROM_PRICE | `Vanaf €80,00` |
| VOLUNTARY | `Vrijwillige bijdrage` |
| CONTACT | `Prijs op aanvraag · Contact` |

Append: ` · Dienst` (kind cue on compact price line).

### 5. Badge priority

1. Sponsored *(off)*
2. Request *(N/A)*
3. Workshop date *(N/A)*
4. **ListingKind: Service**
5. Primary specialization
6. Accepted value
7. Trust badge

### 6. Preview information

- Description (scope, deliverables)
- Fulfillment mode (on-site client/provider)
- Payment models detail
- Accepted values if barter-open
- Deal trust expansion

### 7. Desktop differences

Standard variant; share enabled; fulfillment hint valuable for services.

### 8. Mobile differences

Compact; kind badge `Dienst` on overlay; single deal trust cue.

### 9. Sidebar placement

Sidebar slot suitable for **local service providers** (future sponsored). Mini on profile services filter.

### 10. Discovery section behavior

All marketplace sections. `trusted_makers` and `top_rated` align well — tile does not add section-specific chrome.

---

## TASK

### 1. Primary information

| Field | Notes |
|-------|-------|
| Title | Task description (help moving, dog walk) |
| Person row | **Task offerer** |
| Price | Hourly or fixed common |
| Location | **High emphasis** — distance in person row |

### 2. Secondary information

| Field | Tile | Preview |
|-------|------|---------|
| Practical specialization | `practical.*` badge | List |
| Urgency / needed-by | — | Preview only (future `neededBy`) |
| Duration estimate | — | Description |

### 3. Trust information

**Primary channel: Deal** (same as SERVICE)

1. Trust badge
2. `🤝 {n} afspraken`
3. Tier ≥ 3 acceptable (tasks may be newer sellers)

### 4. Payment / value information

| Common | Tile line |
|--------|-----------|
| HOURLY | `€15/uur` |
| FIXED | `€40,00` |
| ON_REQUEST | `Prijs op aanvraag` |
| VOLUNTARY | `Vrijwillige bijdrage` |

Append: ` · Taak`

### 5. Badge priority

1–3. *(standard global)*
4. **ListingKind: Taak**
5. **Practical specialization** (e.g. `Klus`, `Hondenuitlaat`)
6. Accepted value
7. Trust badge

### 6. Preview information

- Where task happens (client location vs provider)
- Description with scope
- Accepted alternative payment
- Deal trust

### 7. Desktop differences

Standard; distance + fulfillment (on-site client) in preview.

### 8. Mobile differences

Compact; geo line critical; 1:1 discover grid acceptable for quick scan.

### 9. Sidebar placement

Rare in sidebar. Profile mini for task offers.

### 10. Discovery section behavior

Strong in `nearby`. Same tile in all sections.

---

## WORKSHOP

### 1. Primary information

| Field | Notes |
|-------|-------|
| Title | Event name |
| Person row | **Host / instructor** |
| **availabilityDate** | **Primary differentiator** — badge or price line suffix |
| Price | Fixed / from price typical |

### 2. Secondary information

| Field | Tile | Preview |
|-------|------|---------|
| Date/time | Short badge `Za 12 jul` | Full formatted date + time |
| Capacity | — | Preview / detail (future) |
| Topic specialization | `knowledge.cookingclass` etc. | List |
| Venue / fulfillment | — | onSiteProvider, digital |

### 3. Trust information

**Primary channel: Deal**

1. Trust badge
2. `🤝 {n} afspraken` (past workshops)
3. Tier ≥ 4 for established hosts

Product review channel secondary only.

### 4. Payment / value information

| Common | Tile line |
|--------|-----------|
| FIXED | `€45,00 · Za 12 jul` |
| FROM_PRICE | `Vanaf €35,00 · Za 12 jul` |
| ON_REQUEST | `Prijs op aanvraag · {date}` |
| CONTACT | `Prijs op aanvraag · Contact` |

Date may alternatively occupy **badge slot #3** (workshop date priority) — **not both** badge and price suffix if badge used.

Append kind: ` · Workshop` if not in overlay badge.

### 5. Badge priority

1. Sponsored *(off)*
2. Request *(N/A)*
3. **Workshop date** (`availabilityDate`) — **wins over kind badge**
4. **ListingKind: Workshop** *(if date shown on price line instead)*
5. Topic specialization (`Kookworkshop`)
6. Accepted value
7. Trust badge

### 6. Preview information

- Full date/time + timezone
- Description (what you'll learn)
- Location / digital link hint
- Capacity spots left (future)
- Fulfillment
- Deal trust expansion

### 7. Desktop differences

Standard; date in badge + preview expansion; share useful for events.

### 8. Mobile differences

Compact; **date badge required** when `availabilityDate` set; 4:5 media for event poster feel.

### 9. Sidebar placement

**Strong sidebar candidate** (future): `MarketplaceTileSidebar` for featured local workshop — date prominent.

### 10. Discovery section behavior

Eligible all sections; especially `nearby` + `trending`. Tile unchanged per section.

---

## COACHING

### 1. Primary information

| Field | Notes |
|-------|-------|
| Title | Coaching offer (1:1 mentoring) |
| Person row | **Coach** |
| Price | Hourly dominant |

### 2. Secondary information

| Field | Tile | Preview |
|-------|------|---------|
| Knowledge specialization | `knowledge.coaching` or domain | List |
| Session format | — | digital / on-site in preview |
| Availability | — | Preview (future calendar) |

### 3. Trust information

**Primary channel: Deal**

1. Trust badge
2. `🤝 {n} afspraken`
3. Tier ≥ 3

Coaching buyers weight deal evidence over product reviews.

### 4. Payment / value information

| Common | Tile line |
|--------|-----------|
| HOURLY | `€60/uur` |
| ON_REQUEST | `Prijs op aanvraag` |
| VOLUNTARY | `Vrijwillige bijdrage` |

Append: ` · Coaching`

### 5. Badge priority

1–3. *(standard)*
4. **ListingKind: Coaching**
5. Domain specialization (e.g. `Taal`, `Life coaching`)
6. Accepted value
7. Trust badge

### 6. Preview information

- Session description
- Format (online / in-person)
- Payment options
- Deal trust

### 7. Desktop differences

Standard; share optional; preview shows session format.

### 8. Mobile differences

Compact; coaching kind badge on overlay.

### 9. Sidebar placement

Profile mini; future sidebar for featured coach (low priority).

### 10. Discovery section behavior

`trusted_makers` section natural fit — presentation unchanged on tile.

---

## REQUEST

### 1. Primary information

| Field | Notes |
|-------|-------|
| Title | Ask text (“Wie kan me helpen met…”) |
| Person row | **Requester** (buyer) — **not seller** |
| Location | **Critical** — where help needed |
| Intent | `listingIntent === REQUEST` drives styling |

### 2. Secondary information

| Field | Tile | Preview |
|-------|------|---------|
| Needed skill / category | Specialization badge | Full |
| Urgency / needed-by | — | Preview (future fields) |
| Budget | — | Preview if `budgetCents` (future) |

### 3. Trust information

**Tile: minimal or requester deal history**

1. `🤝 {n} afspraken` on **requester** if completed deals as buyer/requester
2. Tier ≥ 2 — optional `✓ Actief` label
3. **No** seller-style product reviews on request card

**Forbidden:** presenting requester as “seller” with product review stars.

### 4. Payment / value information

| Case | Tile line |
|------|-----------|
| Budget set (future) | `Budget €50` |
| ON_REQUEST | `Voorstel welkom` |
| VOLUNTARY | `Tegen vrijwillige bijdrage` |
| No price | `Gezocht` |

**No** HOMECHEFF checkout line on tile.

### 5. Badge priority

1. Sponsored *(off)*
2. **Request / Gezocht** — **always slot 1**
3. Workshop date *(N/A)*
4. ListingKind *(redundant with #2 — skip)*
5. Required skill specialization
6. Accepted value *(what requester offers in return — rare)*
7. Trust badge

**Visual treatment:** distinct from OFFER — amber/neutral badge, not green “Te koop”.

### 6. Preview information

- Full request description
- Location detail
- Needed-by / urgency
- What requester offers in return (accepted values)
- Requester deal history (expanded)
- **Not:** proposal CTA (detail only)

### 7. Desktop differences

Standard; share less common; preview emphasizes scope + location.

### 8. Mobile differences

Compact; **Gezocht** badge mandatory; person row = requester avatar.

### 9. Sidebar placement

**Not** in commercial sidebar. Separate “Gezocht in de buurt” module (future) — not T1–T2.

### 10. Discovery section behavior

**In feed today:** rendered via `FeedMarketplaceCard` with REQUEST taxonomy — same sections if in pool.

**Presentation:** REQUEST may appear in overflow tail — **not** in `trusted_makers` / `top_rated` eligibility typically. Tile unchanged when shown in `nearby` / `new_creators`.

**Filter chip:** User `feedChip=sale` may hide REQUEST — presentation matrix applies when visible.

---

## INSPIRATION

### 1. Primary information

| Field | Notes |
|-------|-------|
| Cover media | Recipe photo, garden, design |
| Title | Content title |
| Person row | **Creator** (author) |
| Category | CHEFF / GROWN / DESIGNER vertical |

### 2. Secondary information

| Field | Tile | Preview |
|-------|------|---------|
| Subcategory | — | Preview |
| Description snippet | — | Preview 2 lines |
| Tags | — | Preview |

**Forbidden on tile:** price, order method, barter, fulfillment.

### 3. Trust information

**Tile: none by default**

- **No** deal/product/courier trust cues on inspiration tiles
- **No** trust badges (gamification badges optional T3 — default off)
- Creator person row satisfies person-first

**Rationale:** INSPIRATION is non-transactional; community feedback is not trust per [LISTING_KIND_SPEC.md](../architecture/LISTING_KIND_SPEC.md).

### 4. Payment / value information

| Tile line |
|-----------|
| Category label small: `Recept`, `Kweek`, `Design` — **not** `text-2xl` |

No €, no on-request.

### 5. Badge priority

1. Sponsored *(off)*
2. Request *(N/A)*
3. Workshop date *(N/A)*
4. **Vertical category** (Recept / Tuin / Studio)
5. Subcategory chip (if room)
6. — 
7. —

Max 2 badges; often 1.

### 6. Preview information

- Description
- Tags / subcategory
- Prep time / servings (recipe) — content meta, not trust
- **Not:** props count, views, fans

### 7. Desktop differences

Standard inspiration mode; share enabled; category chip not oversized.

### 8. Mobile differences

Compact; 4:5 or 1:1; interleaved in feed — no discovery section bands.

### 9. Sidebar placement

Not sidebar. Profile inspiratie tab uses Mini-like card (future).

### 10. Discovery section behavior

**Excluded** from `buildAllDiscoverySections` pool (`INSPIRATION` ∉ `MARKETPLACE_KINDS`).

Appears in feed via **inspiration interleave** only — not under `nearby` / `trending` headings.

`mode=inspiration` on `MarketplaceTileRouter`.

---

## Cross-kind forbidden (all)

| Signal | Reason |
|--------|--------|
| `UserStatsTile` | Profile/detail only |
| Blended `averageRating` | Anti-gaming |
| `viewCount` on tile | Engagement noise |
| `fansCount` / followers | Not person-first tile data |
| Workspace props | Wrong domain |
| HCP / achievement badges | Gamification ≠ trust |
| Full-width CTA | Tap card instead |
| Section-specific tile layouts | One tile, many sections |

---

## Related documents

- [MARKETPLACE_TILE_VARIANT_MATRIX.md](./MARKETPLACE_TILE_VARIANT_MATRIX.md)
- [MARKETPLACE_DISCOVERY_CARD_RULES.md](./MARKETPLACE_DISCOVERY_CARD_RULES.md)
- [MARKETPLACE_TILE_PREVIEW_ARCHITECTURE.md](./MARKETPLACE_TILE_PREVIEW_ARCHITECTURE.md)

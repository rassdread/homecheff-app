# Marketplace Tile Density Audit — V1

**Status:** Audit only  
**Last updated:** 2026-07-06  
**Related:** [MARKETPLACE_TILE_INVENTORY.md](./MARKETPLACE_TILE_INVENTORY.md)

---

## Method

Estimated vertical footprint on a **375px-wide mobile viewport** and **desktop feed grid column (~320–400px)**. Heights are approximate from Tailwind classes + `UserStatsTile` structure; not measured in browser.

**Density ratio** = estimated info block height ÷ media height.

---

## Feed sale card (`FeedSaleCard`) — **CRITICAL**

| Metric | Mobile (cards column) | Desktop (`hc-home-feed-grid`) |
|--------|----------------------|------------------------------|
| Media height | ~187px (4/3 @ full width) or **~250px** (3/4 native) | ~240px (4/3, min 11rem) |
| Info block (excl. media) | **~320–420px** | **~140–180px** (compact CSS) |
| Text rows | 8–12+ | 6–8 |
| Badge rows | 2–4 (taxonomy + accepted + chips) | 2–3 |
| Actions | CTA + share + favorite + views | Same, smaller padding |
| **Density ratio** | **1.3–2.2×** (info > image) | **0.6–0.75×** |

### Clutter sources (mobile)

1. **`UserStatsTile`** — `min-h-[4.5rem]` wrapper + loading skeleton `h-24` + avatar row + label + **3×2 stat grid** (~120–160px)
2. **Duplicate seller** — chip on image + full stats block
3. **Large price** — `text-xl sm:text-2xl` competes with title
4. **`MarketplaceAcceptedBadgesRow`** — heading line + 2 badges
5. **`MarketplaceBadgeList`** — up to 2 + overflow
6. **Meta cluster** — location + delivery + community save line
7. **CTA row** — primary button + views + favorite

### Verdict

**Info area > image area on mobile** — confirms known UX issue. Desktop compact CSS mitigates but mobile cards column does not.

---

## Feed inspiration card (`FeedInspirationCard`)

| Metric | Mobile | Desktop |
|--------|--------|---------|
| Media height | Same as sale | Same |
| Info block | **~280–380px** | ~120–160px |
| **Density ratio** | **1.2–1.8×** | ~0.55× |

Extra clutter: duplicate category label (`lg:hidden` row + media chip).

---

## Discover grid tile (`DiscoverGridTile`) — **BETTER**

| Metric | Mobile only |
|--------|-------------|
| Media height | ~175px (1:1 in 2-col grid) |
| Info block | **~110–140px** |
| Text rows | 4–6 |
| Badge rows | 1–2 |
| Actions | Link only (no CTA button) |
| **Density ratio** | **0.6–0.8×** |

### Issues

- Creator name shown **twice** (chip + body line)
- No favorite/share on tile (reduces actions but also engagement)
- Still shows accepted values row when present

### Verdict

Closest to Instagram-like scanability. **Recommended reference** for compact feed pattern.

---

## Inspiration card grid (`InspirationCard`)

| Metric | Grid | List |
|--------|------|------|
| Media | 4:3 | 144–160px square |
| Info block | **~300px+** | Variable horizontal |
| **Density ratio** | **~1.5×** | Thumb smaller than text column |

Clutter: `text-2xl` category as faux price, full `UserStatsTile`, description in list mode.

**Inactive route** but same patterns would apply if revived.

---

## Dorpsplein inline product card (legacy)

| Metric | Grid | List |
|--------|------|------|
| Media | h-64 (256px) | 192×192px |
| Info block | **~280–350px** | ~192px height row |
| **Density ratio** | **1.1–1.4×** | Similar width competition |

Full `UserStatsTile` + delivery pills + options menu.

---

## Profile `ProductManagement` cards

| Metric | Value |
|--------|-------|
| Media | h-48 (192px) |
| Info | ~150–220px (description, stock, meta) |
| **Density ratio** | ~0.8–1.1× |

Acceptable for **owner management** — not consumer feed.

---

## Profile public summary (`MyDishesManager`)

| Metric | Value |
|--------|-------|
| Media | aspect-video or h-48 |
| Info | Title + 2-line description |
| **Density ratio** | ~0.5–0.7× |

Lighter than feed cards — reasonable for profile grid.

---

## Legacy `ItemCard`

| Metric | Value |
|--------|-------|
| Media | Slider in card |
| Info | Seller avatar row, price, rating stars, distance, favorite |
| **Status** | Unused in live feed |

---

## Cards flagged: info > image

| Card | Mobile | Desktop |
|------|--------|---------|
| `FeedSaleCard` | **Yes** | Borderline OK (compact CSS) |
| `FeedInspirationCard` | **Yes** | OK |
| `InspirationCard` grid | **Yes** | N/A |
| `Dorpsplein` product grid | **Yes** | Moderate |
| `DiscoverGridTile` | No | N/A (mobile only) |
| Profile public summary | No | No |

---

## Cards flagged: too many badges

| Card | Max visible badge slots | Notes |
|------|------------------------|-------|
| `FeedSaleCard` | 6–8 types | Sale + contact + 2 taxonomy + 2 accepted + 2 gamification + stats labels |
| `DiscoverGridTile` | 4–5 | Lower count but duplicated seller |
| `Dorpsplein` | 7+ | Category + contact + taxonomy + accepted + delivery |

---

## Cards flagged: duplicate info

| Duplication | Where |
|-------------|-------|
| Seller name | Media chip + `UserStatsTile` header |
| Seller name | `DiscoverGridTile` chip + body line |
| Category | Inspiration media chip + mobile body label + `text-2xl` row |
| Rating/trust | `UserStatsTile` blended rating vs future per-channel trust |
| Location | Sometimes place repeated in stats context |

---

## Cards flagged: trust/social clutter

| Issue | Detail |
|-------|--------|
| `UserStatsTile` on every feed card | 6-stat grid + community feedback + **blended product rating** |
| Violates Discovery trust rules | Tiles should not show blended rating ([DISCOVERY_ANTI_GAMING.md](../architecture/DISCOVERY_ANTI_GAMING.md)) |
| Engagement ≠ trust | Views, props, fans shown alongside trust signals |
| Loading skeleton | `h-24` pulse on scroll — doubles perceived info block size |

---

## Cards flagged: actions compete with content

| Card | Competing actions |
|------|-------------------|
| `FeedSaleCard` | Full-width primary CTA + share icon + favorite + views |
| `FeedInspirationCard` | Same |
| `Dorpsplein` | Favorite + overflow menu + card-level click |
| `DiscoverGridTile` | Minimal (good) |

---

## Desktop vs mobile summary

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Feed sale card | Heavy info block | Compact via `.hc-home-feed-grid` CSS |
| Discover tile | Balanced | Not shown |
| Section headings | Add vertical bands | Leading bands |
| Sidebar | N/A | Promos/reputation — separate from listing tiles |

**Asymmetry risk:** Mobile users (primary audience) get the densest cards; desktop gets compressed CSS patch. No shared component variant — only CSS overrides.

---

## Density scorecard (1 = light, 5 = heavy)

| Card | Mobile | Desktop | Feed scanability |
|------|--------|---------|------------------|
| `FeedSaleCard` | 5 | 3 | Poor mobile |
| `FeedInspirationCard` | 4 | 3 | Poor mobile |
| `DiscoverGridTile` | 2 | — | Good |
| `InspirationCard` | 5 | — | Poor |
| Dorpsplein inline | 4 | 3 | Poor |
| Profile public | 2 | 2 | OK |
| Product management | 3 | 3 | OK (owner) |

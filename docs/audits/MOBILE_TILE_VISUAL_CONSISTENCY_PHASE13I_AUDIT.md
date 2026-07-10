# Phase 13I Audit — Mobile Visual Consistency & Tile Regression Fixes

**Date:** 2026-07-09  
**Scope:** Mobile tile parity, legacy settlement icons, collapsed filter positioning, native tap navigation, bottom nav safe area, UX intent review. No marketplace architecture changes.

---

## PART 1 — Mobile tile audit

| Tile type | Price / requested | Settlement icons | Trust | Seller | Category | CTA |
|-----------|-------------------|------------------|-------|--------|----------|-----|
| Product (compact feed) | ✅ `TileValueExchangeBlock` | ✅ `buildTileSettlementRow` | ✅ | ✅ `TilePersonRow` | ✅ badges | ✅ `TileMedia` + title Link |
| Legacy dish | ✅ (after fix) | ✅ via feed booleans | ✅ | ✅ | ✅ | ✅ |
| Legacy listing | ✅ (after fix) | ✅ via feed booleans | ✅ | ✅ | ✅ | ✅ |
| Request / Gezocht | ✅ price on request label | ✅ when options resolve | ✅ | ✅ | ✅ | ✅ `/request/` href |
| Service | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inspiration | N/A (no settlement row) | — | ✅ | ✅ | ✅ | ✅ legacy routes |
| Favorite mini | ✅ value row | ✅ **added** mini settlement | ✅ truncated | — | ✅ | ✅ |
| Profile listing mini | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Preview card | ✅ via shell | ✅ standard/compact | ✅ | ✅ | ✅ | ✅ hover preview |
| Feed tile (GeoFeed) | ✅ | ✅ compact path | ✅ | ✅ | ✅ | ✅ |
| Mini tile | ✅ | ✅ **added** | ✅ | — | ✅ | ✅ |

### Root causes (pre-fix)

1. **Legacy feed rows** sent `acceptHomeCheffPayment: null` / `acceptDirectContact: null` → `buildTileSettlementRow` returned `null`.
2. **Mini variant** skipped settlement in `TileValueExchangeBlock` and `MarketplaceTileMini`.
3. **Connect-not-ready** priced listings showed no icon → fixed by surfacing `homeCheffCheckoutNeedsConnect` as direct-contact affordance in settlement row.

### SSOT chain (unchanged)

`resolveSettlementOptions` → `legacyFeedSettlementBooleans` (feed API) → `mapGeoFeedCardToTileModel` → `buildTileSettlementRow` → `TileSettlementRow`

---

## PART 2 — Legacy tile parity

| Scenario | Visual |
|----------|--------|
| Priced legacy + Connect ready | HomeCheff checkout icon |
| Priced legacy + Connect pending | Direct/contact icon (needs Connect) |
| Contact-only product | Direct icon via `orderMethod` fallback |
| Barter openness | Barter icon when data present |
| Accepted values | Accepted-values icon + subcategory strip |
| Missing data | No fake methods — row omitted |

**Gap (documented):** Legacy dishes/listings without `barterOpenness` / accepted-value fields in feed select will not show those icons until discovery enrichment backfill. No fabrication.

---

## PART 3 — Mobile collapsed filter positioning

### Problem

Collapsed bar used `sticky top-[3.25rem]` (52px) while navbar is `h-16` (64px) + iOS safe-area → visible gap; semi-transparent `bg-white/95` showed tiles through.

### Fix

| Item | Value |
|------|-------|
| SSOT | `lib/feed/mobile-filter-sticky.ts` |
| Below nav | `top-[calc(var(--hc-navbar-height,4rem)+env(safe-area-inset-top,0px))]` |
| Nav scrolled away | `top-0` via `navPinned` from `useMobileFeedFilterScroll` |
| Background | Solid `bg-white`, `z-40`, full-width `border-b` |
| Desktop | Unchanged — collapsed branch only in mobile toolbar |

---

## PART 4 — App item tap error

### Root cause

`FeedCardPrimaryMedia` set `lightboxEligible = nativeMounted || coarsePointer`. On Capacitor, media tap opened lightbox instead of navigating; users perceived this as broken tap / error.

### Fix

- `lightboxEligible = coarsePointer && !nativeMounted` — native uses full-area `Link` to `href`.
- Dev-only `navDebug('feed-tile:media-link', { href })` on media link click.
- `safeRoute` extended: `/request/`, `/recipe/`, `/garden/`, `/design/`, `/inspiratie/`.

### Routes verified (SSOT)

`lib/feed/feed-item-href.ts` → `buildListingDetailHref` / legacy inspiration paths. No `/item/[id]` migration.

---

## PART 5 — Visual consistency pass

| Element | Mobile vs desktop |
|---------|-------------------|
| Settlement icons | Same `TileSettlementRow` component |
| Value row | Same `buildTileValueRow` |
| Icon sizes | Shared primitives |
| Compact feed | Settlement below trust (compact layout) |
| Mini grids | Settlement row added; tighter typography preserved |

**P2 remaining:** Mini tiles still omit accepted-value icon strip (space); settlement icons now present.

---

## PART 6 — Validation

Script: `scripts/validate-mobile-tile-consistency-phase13i.ts`  
Chains: Phase 13H validator  
Quality: `npm run lint`, `npm run build`

---

## PART 7 — Bottom navigation safe area

### Problem

~1cm white band below tab buttons on native: double `safe-area-inset-bottom` on wrapper + inner bar; inner native added `+10px` extra padding.

### Fix

| Layer | Native |
|-------|--------|
| Fixed wrapper | `bg-transparent`, `pb-0` — no second safe-area |
| Inner `data-hc-bottom-nav` | `pb-[env(safe-area-inset-bottom,0px)]` only |
| Flow spacer | `h-[5.75rem]` (was `6.5rem`) aligned with `AppPageChrome` |
| Web mobile | Unchanged pattern: wrapper safe-area + inner padding |

`AppPageChrome` content padding (`5.75rem + safe-area`) unchanged — prevents content underlap.

### Tablet

md+ floating bar keeps rounded shadow; safe-area on md breakpoint only.

---

## PART 8 — UX intent & consistency audit

| Surface | Intent | Match? | Severity |
|---------|--------|--------|----------|
| Homepage feed | Discover local offers/requests with trust + settlement clarity | ✅ after 13I | — |
| Tiles | Show price + how deal can close | ✅ icons restored | — |
| Detail pages | Full settlement + CTA | ✅ unchanged | — |
| Collapsed filter | Quick re-open filters without blocking feed | ✅ pinned correctly | was P1 |
| Native tile tap | Open listing detail | ✅ fixed | was P0 |
| Bottom nav | Persistent primary actions flush to screen | ✅ safe-area fix | was P1 |
| Seller/Business dashboards | Operate business | ✅ prior phases | — |
| Founder Control Center | 9-domain ops | ✅ 13F | — |
| Checkout | Safe pay path | ✅ 11B integrity | — |
| Chat | Conversations | ✅ | — |
| Settlement row | Distinct from price row | ✅ SSOT | — |
| Trust row | Social proof before tap | ✅ | — |

**P3:** Inspiration tiles intentionally omit settlement (non-transactional).

No redesign introduced — implementation aligned to existing SSOT.

---

## PART 9 — Pixel perfect review

| Check | Status |
|-------|--------|
| Collapsed filter spacing | Fixed — no float gap |
| Bottom nav whitespace | Fixed — single safe-area |
| Tile icon alignment | Shared row component |
| Long titles | `line-clamp-2` preserved |
| Image aspect | `4:5` compact, ratios SSOT |
| Sticky z-index | Filter `z-40`, bottom nav `z-65` |
| Loading / empty states | Unchanged this phase |

---

## Severity summary

| ID | Issue | Status |
|----|-------|--------|
| P0 | Native tile tap intercepted by lightbox | **Fixed** |
| P1 | Missing settlement icons on legacy feed rows | **Fixed** |
| P1 | Collapsed filter floating below header | **Fixed** |
| P1 | Bottom nav white gap on native | **Fixed** |
| P1 | Profile hero text beside/behind avatar on mobile | **Fixed** |
| P2 | Mini tiles missing settlement row | **Fixed** |
| P2 | Accepted-value icons omitted on mini | Open (space constraint) |
| P3 | Legacy barter/values without discovery fields | Documented gap |

---

## Verdict

**Complete** — Mobile tiles show settlement clarity consistent with desktop SSOT; legacy rows infer booleans safely; collapsed filter and bottom nav attach cleanly; native taps navigate to detail. Desktop unaffected. Ready for supervised pilot QA on device.

---

## PART 10 — Profile mobile hero

### Problem

On mobile/tablet, profile hero used a `lg` (1024px) side-by-side grid: name, badges and stats rendered beside the overlapping avatar — text appeared next to or behind the photo. Business badge sat above the name, breaking visual hierarchy.

### Fix

| Item | Change |
|------|--------|
| Layout SSOT | `.hc-profile-v2-hero-main` — flex column, centered, `< 1280px` |
| Desktop grid | Side-by-side only at `xl` (1280px+) |
| Avatar overlap | Half overlap on mobile (`50%` of avatar size), `z-index: 3` |
| Identity block | `.hc-profile-v2-hero-identity` — full width below avatar |
| Hierarchy | Name → username → roles → BusinessPlanBadge → BusinessBadge → location |
| Long names | `break-words`, `max-w-full` |
| Alignment | `text-center` mobile/tablet, `xl:text-left` desktop |

### Safe area

Profile shell uses `hc-profile-v2-bottom-inset` (bottom nav + safe-area). Top safe-area inherited from global NavBar (`--hc-navbar-height` + `safe-area-inset-top`).

### Legacy UI note

`/seller/[sellerId]` still uses `PublicSellerProfileNew` (pre-V2). `/profile` and `/user/[username]` use Profile V2. Seller route migration deferred — not in 13I scope.

---

## PART 11 — Pixel perfect & legacy UI (audit)

| Area | Status |
|------|--------|
| Tile settlement icons | ✅ 13I |
| Profile hero mobile | ✅ Part 10 |
| Bottom nav safe area | ✅ 13I |
| Collapsed filter sticky | ✅ 13I |
| Mini tile settlement | ✅ 13I |
| Seller legacy profile page | P2 — separate route, old component |
| Accepted-value icons on mini tiles | P2 — space constraint |

**Design unity principle:** All marketplace tiles use `buildTileSettlementRow` + `TileSettlementRow`. Profile uses `hc-profile-v2-*` tokens. No ad-hoc per-screen settlement or hero layout.

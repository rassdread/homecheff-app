# Phase 13I — Mobile Visual Consistency & Tile Regression Fixes

**Date:** 2026-07-09  
**Status:** Complete  
**Scope:** UX/regression only — no marketplace architecture or settlement logic rewrite.

---

## Delivered

| Area | Change |
|------|--------|
| Legacy feed settlement | `legacyFeedSettlementBooleans()` → dish/listing rows in `app/api/feed/route.ts` |
| Settlement row SSOT | `homeCheffCheckoutNeedsConnect` → direct-contact icon when Connect pending |
| Mini tiles | `MarketplaceTileMini` renders `TileSettlementRow` |
| Native item tap | `feedMedia`: lightbox disabled in Capacitor; media tap navigates to detail |
| Safe routes | `/request/`, `/recipe/`, `/garden/`, `/design/`, `/inspiratie/` allowlisted |
| Collapsed filter | Sticky offset via `--hc-navbar-height` + safe-area; `navPinned` when header scrolls away |
| Bottom nav | Single safe-area padding; no +10px; transparent outer wrapper on native |

## Files

- `lib/marketplace/tiles/legacy-feed-settlement.ts` (new)
- `lib/marketplace/tiles/build-tile-settlement-row.ts`
- `lib/feed/mobile-filter-sticky.ts` (new)
- `hooks/useMobileFeedFilterScroll.ts`
- `components/feed/FeedMobileToolbar.tsx`
- `components/feed/GeoFeed.tsx`
- `components/feed/feedMedia.tsx`
- `components/marketplace/tiles/MarketplaceTileMini.tsx`
- `app/api/feed/route.ts`
- `lib/native/safeRoute.ts`
- `components/navigation/BottomNavigation.tsx`
- `lib/layout/bottomNavVisibility.ts`
- `components/profile/v2/ProfileV2Header.tsx`
- `components/profile/v2/ProfileV2Ui.tsx`
- `components/profile/v2/ProfileV2HeroPhotoEdit.tsx`
- `app/globals.css` (profile hero mobile stack)
- `components/product/ListingDetailPage.tsx` (P0 hooks + error handling)
- `lib/marketplace/detail/listing-detail-route.ts`
- `components/product/ListingDetailUnavailable.tsx`
- `app/product/[id]/error.tsx`, `app/request/[slug]/error.tsx`

## Validation

```bash
npx tsx scripts/validate-mobile-tile-consistency-phase13i.ts
npx tsx scripts/validate-mobile-filter-scroll-phase13h.ts
npm run lint
npm run build
```

## Unchanged

- Settlement router / checkout flows
- Desktop filter sidebar and toolbar layout
- Feed fetch, cache, filter application logic
- GeoFeed mount lifecycle

## Manual QA (pilot)

- [ ] iPhone: bottom nav flush with home indicator
- [ ] Android gesture nav: no white band under tab bar
- [ ] Feed scroll: collapsed filter pins under header, not floating mid-screen
- [ ] Tap legacy dish/listing tile → detail opens (no lightbox intercept)
- [ ] Legacy priced row shows checkout or direct icon when data allows
- [ ] Profile mobile: avatar centered, name/badges/stats stack below (no overlap)
- [ ] Profile tablet portrait: same vertical stack (no text beside avatar)
- [ ] Profile desktop xl+: side-by-side hero acceptable

## Profile mobile hero (Part 10)

- `hc-profile-v2-hero-main` — stacked flex below 1280px
- Identity block below avatar with half-overlap anchor
- Name-first hierarchy with business badges after roles

# Trust Stabilization Phase 0 — Progress Report

**Date:** 2026-07-06  
**Status:** Implemented (foundation stabilization — no Discovery work)

---

## Completed

### Phase 0A — Favoriet vs Prop
- Removed `PropsButton` from product detail, GeoFeed sale/inspiration cards, and inspiratie detail/card.
- Extended `FavoriteButton` + `/api/favorites/toggle` + `/api/favorites/status` to support `dishId`.
- Products and inspiration use **Favoriet only** (same `Favorite` table — no data loss).
- `/api/props/toggle` marked deprecated; still functional for backward compatibility.
- `WorkspaceContentProp` unchanged (studio props remain separate).

### Phase 0B — Community Feedback
- `DishReviewSection` UI copy → Community Feedback (no star headline on profile).
- i18n keys: `communityFeedback.*` (NL/EN).
- Profile `ItemsWithReviews` defaults to **products only** (no dish trust on profile).

### Phase 0C — Trust Split
- `getProfileTrustSummary()` returns split channels: `product`, `deal`, `courier`, `totals`.
- **No composite trust average.**
- `ProfileTrustSummaryBlock` shows 🛒 Producten / 🤝 Afspraken / 🚚 Bezorgingen when evidence exists.
- Trust summary on Community + Vertrouwen profile tabs.

### Phase 0D — Stats Cleanup
- New `lib/stats/compute-user-public-stats.ts` (single source of truth).
- Fixed favorites count: uses `dishId` (not `listingId`).
- `totalProps` → workspace props only (`WorkspaceContentProp`).
- `totalReviews` / `averageRating` → product reviews only.
- `communityFeedbackCount` added (non-trust).
- `userStatsBatchPreview` aligned with shared compute.

### Phase 0E — Fan Language
- NL: Fan worden / Fan / Fans / Fan van {n}.
- EN: Become a fan / Fan / Fans / Fan of {n}.
- Updated `follow.*`, profile headers, `fansAndFollowers` label.

### Phase 0F — Trust Badge Priority
- `lib/gamification/badge-priority.ts` — TRUST → ACHIEVEMENT → COMMUNITY.
- Applied in `fetchAuthorBadgeSummariesByUserIds`, public profile, Profile V2 owner HCP.

### Phase 0G — Profile Hero Preparation
- `followingCount` exposed in public stats API and Profile V2 header.
- Public profile stats mapped correctly in `ProfileV2Client` (`fansCount` → `followers`).

---

## Partially completed

- **Fan terminology:** Some legacy strings remain in analytics/admin copy (`newFollowersWeek`, `sortMostFollowers`, vercel export JSON files).
- **Props API:** Deprecated but not removed; count/status routes still product/dish oriented.
- **ReviewForm on inspiration:** Still uses generic review form component internally (copy is community feedback).

---

## Deferred (by design — not Phase 0 scope)

- ListingKind implementation
- Discovery / recommendations / ranking
- SEO route changes
- `DishReview` table rename
- Legacy `/seller`, `/bezorger` redirects
- Removing legacy Listing from feed

---

## Blocked

None.

---

## Architecture deviations discovered

1. **Public profile stats API shape** differed from `ProfileV2Stats` — fixed via client-side mapping in `ProfileV2Client`.
2. **`UserStatsTile` had 6 fixed columns** including duplicate Props — now dynamic; hides empty workspace props / feedback columns.

---

## Files changed (summary)

| Area | Key files |
|------|-----------|
| Stats | `lib/stats/compute-user-public-stats.ts`, `app/api/user/[userId]/stats/route.ts`, `lib/userStatsBatchPreview.ts`, `lib/userStatsClientCache.ts`, `components/ui/UserStatsTile.tsx` |
| Trust | `lib/trust/profile-trust-summary.ts`, `components/profile/ProfileTrustSummaryBlock.tsx` |
| Favorites | `components/favorite/FavoriteButton.tsx`, `app/api/favorites/*`, product/feed/inspiratie UI |
| Feedback | `components/inspiratie/DishReviewSection.tsx`, `components/profile/ItemsWithReviews.tsx` |
| Badges | `lib/gamification/badge-priority.ts`, `lib/gamification/author-badge-summaries.ts` |
| Profile | `ProfileV2Header.tsx`, `ProfileV2Client.tsx`, `ProfileV2TabPanels.tsx`, `app/user/[username]/page.tsx` |
| i18n | `public/i18n/nl.json`, `public/i18n/en.json` |

---

## Related architecture docs

Update status in:
- `docs/architecture/REVIEW_ARCHITECTURE.md` — Phase 0 trust split **implemented**
- `docs/discovery/DISCOVERY_PREREQUISITES.md` — P0-5, P0-6, P0-7 partially **closed**

---

## Before Discovery Phase 1

Remaining P0 from discovery prerequisites:
- ListingKind derivation (`deriveListingKind`)
- Legacy Listing feed merge decision execution
- Dish price → sale pool leak fix
- Full fan terminology sweep in admin/analytics UI

# HomeCheff original feed UX — Phase 1–2 reconstruction

**Date:** 2026-08-09  
**Branch:** `fix/restore-original-feed-ux`  
**Repo:** Homecheff-app (not Growth)

## Phase 1 — Historical reconstruction

### Commits (verified)

| Role | SHA | Subject |
|------|-----|---------|
| Last known-good full feed UX (infinite scroll + progressive Nearby + CTA inserts present) | `5d500f3d2e7070b311caea1af768ee9110ce1aac` | `fix(security): allow Cloudflare Turnstile in CSP` — tip of main **immediately before** radius regression |
| CTA insert implementation (unchanged since) | same as above (and earlier) | `lib/home/resolve-home-mobile-insert.ts` + `HomeMobileFeedInserts` + GeoFeed `pushInsertIfNeeded` |
| Infinite-scroll known-good | `5d500f3d` (composition milestone also `062e94f0` / `7887df17`) | IntersectionObserver sentinel + progressive Nearby pool + recirculation |
| Regression that broke Nearby reachability / primary composition | `d70f8cf65ccdefd5c0de699162f82d09a1a97220` | `fix(feed): apply radius instantly and keep primary Nearby pool in-radius` |
| Later recovery patches (still incomplete UX) | `1eac6e55` … `fc14a950` | Broadened discovery chaining; production tip before this restore |

**Same state?** Yes for CTA + infinite-scroll + progressive composition: **`5d500f3d`**.  
CTA *source* did not disappear at `d70f8cf6`; user-visible CTA scarcity correlates with short/stalled Nearby primary pools after radius-strict primary ranking.

### CTA / interstitial inventory (still in tree at HEAD and at `5d500f3d`)

| Insert | Mechanism | Interval / gate |
|--------|-----------|-----------------|
| Vertical chip strip | `resolveHomeMobileInsert` → `verticals` | after feed item index **1** (mobile + `enableMobileFeedInserts`) |
| Community pulse | → `pulse` | after index **3** |
| Promotions | `HOME_PROMOTION_FEED_SLOTS` | after **4** android-beta, **8** affiliate-12-12, **12** werken-bij |
| Reputation | → `reputation` | after **7**, logged-in only |
| Share / create CTA | → `share` | after **11** |
| Trailing promo | `resolveHomeMobileTrailingPromo` | short feeds (&lt; 4 items) |
| Activity cards | `interleaveMobileActivityCards` / desktop | logged-in + discovery payload |
| Exchange suggestions | `interleaveExchangeFeedInserts` | sale chip + cards available |
| Growth / opportunity surfaces | mobile interleave | mobile + surface plan |

**Important:** Home mobile inserts are gated by `isMobileFeedUi`. Desktop relies on activity/exchange inserts (session) + sidebar surfaces — not the mobile promo strip.

### Files inspected

- `components/feed/GeoFeed.tsx`
- `lib/feed/*` (composition-state, composition-policy, pagination, feed-item-href, discovery rows)
- `components/home/HomeMobileFeedInserts.tsx`, `lib/home/resolve-home-mobile-insert.ts`
- `components/home/HomePageClient.tsx` (`enableMobileFeedInserts: true`)
- `app/api/feed/route.ts` (LOCAL_FIRST unchanged across regression)
- Exchange / growth / activity feed-row helpers (byte-identical `5d500f3d`→HEAD)

## Phase 2 — Behavioural diff (`5d500f3d` → production `fc14a950`)

| Area | Known-good (`5d500f3d`) | Production (`fc14a950`) |
|------|-------------------------|-------------------------|
| Infinite scroll | IO sentinel + load-more; progressive local+wider primary pool keeps scroll inventory rich | IO present; primary pool **radius-strict**; depends on broadened stage (recovery patches) |
| Item batch size | `FEED_FIRST_PAGE_TAKE = 10` | same |
| CTA insertion | mobile inserts after 1/3/4/7/8/11/12 | **same code**; fewer items → fewer later slots reached |
| CTA type/order | unchanged | unchanged |
| Feed ordering | local-first progressive merge | exact in-radius only in primary ranking |
| Radius behaviour | draft/applied lag possible; progressive merge | **instant** `handleRadiusChange` (keep) + local-only primary (revert) |
| National/discovery continuation | wider tail in primary + recirculation | broadened API pages + continuity band + recirculation |
| Mix recipes/products | stride 4 mixed Alles | same helpers |
| Skeleton / end-of-feed | recirculation after marketplace exhaust | recirculation only after **broadened** exhaust |
| Scroll container / sentinel | same pattern | same + broadened auto-kick / chain |
| Filter reset | requestKey reset | same + search context bar (`78ce7508`) |

### Diff stats (feed-relevant)

- `5d500f3d..d70f8cf6`: `GeoFeed.tsx` only (+40/−17) — sale pool + instant radius
- `5d500f3d..HEAD`: GeoFeed + composition-state broadened + search context bar; **CTA insert modules: 0 lines changed**

## Phase 3 — Selective restore plan (executed)

**Restore**

- Primary `salePoolForRanking` → `composeProgressiveNearbySalePool({ local, wider })`
- `progressiveWidenActive` when `saleWiderPool.length > 0`

**Keep (do not revert)**

- Instant radius apply (`handleRadiusChange`)
- Broadened discovery pagination after exact exhaust
- `FeedSearchContextBar`
- Public route helpers (`getFeedItemHref` / `lib/routing/public-hrefs.ts`)
- Listing/profile server-first + media auth fixes
- CTA insert modules (already correct)

**Do not restore**

- Whole-repo checkout of `5d500f3d`
- Pre-public-routes href construction
- Pre-media-auth upload behaviour

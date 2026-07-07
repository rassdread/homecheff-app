# Discovery Pillars — Phase 5C Audit

**Date:** 2026-07-08
**Scope:** Implementation audit for the low-risk, presentational P0/P1 roadmap
items identified in the Phase 5B IA audit. Code is the source of truth.

Phase 5B established that HomeCheff already *supports* a broad ecosystem
(verticals, Te koop, Gezocht, Inspiratie, Diensten/SERVICE·TASK·WORKSHOP·COACHING,
proposals, community deals, reviews, props, fans, trust, badges, HCP) but that
the discovery **UI** did not represent that breadth. Phase 5C closes the
presentational gaps without touching backend, ranking, or business logic.

---

## 1. Pre-implementation state (verified in code)

| Area | Before 5C |
|---|---|
| Intent chips | `all` / `sale` / `inspiration` / `gezocht` (GeoFeed `viewModeChipsEl` + `FeedMobileToolbar`) |
| Services | Classifiable (`deriveFeedTaxonomy` → `SERVICE`/`TASK`) but **no chip** — hidden inside "Te koop" |
| Verticals | Only in the filter-panel `<select>` (`category` draft → `appliedCategory`) — low visibility, absent from mobile toolbar |
| Props | `PropsButton` + `/api/props/*` existed but the button was **orphaned** (not rendered anywhere) |
| Mobile ecosystem | No compact strip; verticals only reachable via the filter sheet |
| Mijn Afspraken | Present in desktop role-quick-links + header dropdown; **absent on mobile home** |

Key architectural facts that made the implementation low-risk:

- **Chip filtering is client-side sectioning.** `feedChip` is **not** in the
  feed-fetch `useEffect` dependency array (deps: radius, scope, q, place, coords,
  `viewerPlaceForApi`, `apiLocationSource`, `appliedCategory`). Switching chips
  re-slices already-fetched data → **no refetch**.
- Service listings with a price or contact-only order method already land in the
  **sale pool** (`saleCandidates` → `filteredSaleBase` → `sortedSales`) via
  `isMarketplaceSaleItem`. A Diensten chip is therefore a **client-side subset**
  of the sale pool.
- The taxonomy layer already *anticipated* this: `FeedViewFilterIdFuture`
  declared `'services'` as a documented future chip.
- `appliedCategory` **is** a fetch dep (server-side `vertical` filter), so a
  vertical chip = one *intended* refetch, identical to applying the select.

---

## 2. What was implemented

### 5C.1 — Props-giving surface
- Wired the existing `PropsButton` onto **inspiration detail**
  (`components/inspiratie/InspiratieDetail.tsx`) using `dishId={item.id}`, in the
  Share/Favorite action row.
- **Props are valid for workspace/inspiration content, not marketplace tiles.**
  The props model is `WorkspaceContentProp` (appreciation for shared creations),
  so props-giving belongs on inspiration/dish content — not on priced product
  cards. This keeps marketplace tiles uncluttered and keeps the "what am I
  propping?" intent unambiguous.
- Guests are safe: `PropsButton` routes through `openSoftAuthGateWithScroll`
  before any write.

### 5C.2 — Diensten discovery view
- `lib/feed/feed-taxonomy.ts`: `'services'` promoted from *future* to an active
  `FeedViewFilterId`; `matchesFeedViewFilter` returns true for
  `OFFER · (SERVICE | TASK)`.
- `lib/feed/marketplace-sale.ts`: new `isMarketplaceServiceItem` /
  `isServiceListingKind` / `countMarketplaceServiceItems` — a sale-pool item
  whose listing kind ∈ {SERVICE, TASK, WORKSHOP, COACHING} (or taxonomy kind
  SERVICE/TASK).
- `GeoFeed`: `sortedServices = sortedSales.filter(isMarketplaceServiceItem)`
  (memoised, client-side) + a `feedChip === "services"` render branch + a
  dedicated empty state. No new fetch, no ranking change.

### 5C.3 — Discovery pillar chips
- Intent axis reordered and extended to **Alles · Te koop · Gezocht · Diensten ·
  Inspiratie** in both `viewModeChipsEl` (desktop/tablet) and `FeedMobileToolbar`
  (mobile). No existing chip removed.

### 5C.4 — Verticals as a visible axis
- Added `VERTICAL_CHIP_OPTIONS` (Alles/Eten/Tuin/Creaties) rendered under the
  intent chips. `selectVerticalChip` sets **the same** `category` +
  `appliedCategory` state the select uses → one intended refetch, no new axis,
  no duplicate confusion (select stays in sync).
- Added an effect to apply `?vertical=` deep-links on soft-navigation (mirrors
  the existing `?chip=` effect) so the mobile strip links work reliably.

### 5C.5 — Mobile ecosystem strip
- New mobile-only `components/home/HomeMobileEcosystemStrip.tsx`: a compact,
  horizontally-scrolling pill row (Eten · Tuin · Creaties · Gezocht · Diensten)
  mounted above the feed in `HomePageClient`. Uses existing `?vertical=` / `?chip=`
  deep-links — the same pattern already used by the sidebar/orders/messages
  surfaces — so it adds **no new fetch path** and does not remount GeoFeed.

### 5C.6 — Mijn Afspraken visibility
- For logged-in users the strip appends a **Mijn Afspraken** pill →
  `/profile/deals` (canonical route unchanged). This closes the mobile gap;
  desktop already surfaces it via role-quick-links + header dropdown.

### 5C.7 — Community proof visibility
- Restoring props on inspiration re-activates a visible community-appreciation
  loop (existing data only). Existing homepage community proof (community pulse,
  reputation card, tile trust cues, community/Gezocht cards from 5A) is retained;
  no new module was added to avoid overloading the homepage.

---

## 3. Deliberately deferred (out of scope, per prompt)

- Unified filter refactor / one-search merge / global reset refactor.
- Any backend / API / ranking / business-logic / payment / design-system change.
- ON_REQUEST-only services that are not in the sale pool are not separately
  surfaced by the Diensten chip (they are a small minority; documented, not a
  regression).
- A standalone "services hub" or new service models (explicitly disallowed).

---

## 4. Performance posture

- Chip switches (incl. Diensten) are client-side — asserted that `feedChip` is
  absent from the fetch-effect deps.
- Vertical chips reuse the existing applied-category mechanism (same behaviour as
  the select) — one intended refetch, no loop.
- Density defaults (desktop 2 / mobile 1), homepage return cache, unified SWR,
  and single GeoFeed mount are all preserved and re-asserted by
  `scripts/validate-discovery-pillars-phase5c.ts`.

# UX Finalization — Phase 5C: Discovery Pillars

**Date:** 2026-07-08
**Status:** ✅ Implemented — all validators + `npm run build` green.

Phase 5C implements the low-risk, presentational P0/P1 roadmap from the Phase 5B
IA audit so the discovery UI finally communicates HomeCheff's real pillars
(Eten · Tuin · Creaties · Te koop · Gezocht · Diensten · Inspiratie · Community ·
Afspraken · Vertrouwen) — additive, presentational, non-destructive, and without
performance or backend changes.

## Reported deliverables

1. **Which props surfaces were wired** — inspiration detail
   (`InspiratieDetail.tsx`), in the Share/Favorite action row, via
   `PropsButton dishId={item.id}`.
2. **Props valid for marketplace, inspiration, or both** — **inspiration /
   workspace content only.** Props (`WorkspaceContentProp`) are appreciation for
   shared creations; they are deliberately kept off marketplace tiles to avoid
   clutter and keep intent clear. Guests hit the soft-auth gate.
3. **How Diensten discovery works** — a new `services` view filter classifies
   sale-pool items by service listing kind and renders them client-side (subset
   of `sortedSales`). No new fetch, no ranking change.
4. **Which listing kinds are included** — `SERVICE`, `TASK`, `WORKSHOP`,
   `COACHING` (WORKSHOP/COACHING map to taxonomy kind `SERVICE`; TASK → `TASK`).
5. **How discovery chips changed** — intent axis is now
   **Alles · Te koop · Gezocht · Diensten · Inspiratie**, on both desktop chip row
   and the mobile toolbar. No chip removed.
6. **How vertical discovery is shown** — a visible **Categorie** chip row
   (Alles/Eten/Tuin/Creaties) under the intent chips, wired to the same applied
   category state as the existing select; plus the mobile ecosystem strip.
7. **What changed on mobile** — new `HomeMobileEcosystemStrip` (Eten · Tuin ·
   Creaties · Gezocht · Diensten, + Mijn Afspraken for logged-in users) above the
   feed; Diensten chip added to the mobile toolbar. Hero height unchanged.
8. **How Mijn Afspraken visibility improved** — surfaced on mobile home via the
   strip pill → `/profile/deals` (canonical route unchanged); desktop already had
   it via role-quick-links + header dropdown.
9. **What community proof is now visible** — the props-giving loop is restored on
   inspiration (existing data); existing homepage proof (community pulse,
   reputation card, tile trust cues, community/Gezocht cards) retained; no new
   module added, per the "don't overload" rule.
10. **Performance validation** — `feedChip` remains out of the fetch deps (no
    refetch on chip switch); vertical chips reuse the existing applied-category
    refetch (one intended fetch); density defaults, return cache, unified SWR and
    single GeoFeed mount preserved. All re-asserted in the 5C validator.
11. **What was deliberately deferred** — unified filter refactor, one-search
    merge, global reset refactor, services hub, and any backend / API / ranking /
    business-logic / payment / design-system change. ON_REQUEST-only services
    outside the sale pool are not separately surfaced.

## Files changed

- `lib/feed/feed-taxonomy.ts` — active `'services'` view filter.
- `lib/feed/marketplace-sale.ts` — `isMarketplaceServiceItem` + helpers.
- `components/feed/GeoFeed.tsx` — services pool/branch/empty state, Diensten +
  vertical chips, `?vertical=` deep-link effect.
- `components/feed/FeedMobileToolbar.tsx` — Diensten chip.
- `components/home/HomeMobileEcosystemStrip.tsx` — new mobile strip.
- `components/home/HomePageClient.tsx` — mounts the strip; widened chip type.
- `components/inspiratie/InspiratieDetail.tsx` — props-giving button.
- `app/page.tsx` — `?chip=services|diensten` normalization.
- `public/i18n/nl.json`, `public/i18n/en.json` — new copy (full NL/EN parity).

## Validation

```
npx tsx scripts/validate-discovery-pillars-phase5c.ts          # 43 passed
npx tsx scripts/validate-discovery2-information-architecture.ts # 28 passed
npx tsx scripts/validate-discovery-phase5a.ts                  # 32 passed
npx tsx scripts/validate-discovery-experience.ts               # 23 passed
npx tsx scripts/validate-runtime-performance-phase4c.ts        # 26 passed
npm run build                                                  # success
```

# Marketplace UX Polish & Consistency — Phase 5D Audit

**Date:** 2026-07-08
**Nature:** Codebase-first consistency audit + targeted, non-destructive polish.
**Hard constraints honoured:** no redesign, no new marketplace functionality, no
backend/API/ranking/business-logic/payment change, no performance regression.

> Goal: HomeCheff should feel like one coherent product. Every screen should
> answer "Where am I? What can I do? What happens next?"

This audit maps the visible marketplace surfaces, records concrete
inconsistencies (with file:line refs), states what was **fixed now** (safe,
presentational, copy-level) and what is **deliberately deferred** because fixing
it would require refactor/redesign (explicitly out of scope for 5D).

---

## Summary of what changed in this phase (safe fixes)

| Fix | Files | Category |
|---|---|---|
| Restored missing `ShareButton` import (latent `ReferenceError` when the inspiration card renders — masked by `typescript.ignoreBuildErrors`) | `components/inspiratie/InspirationCard.tsx` | 5D.3 card / bug |
| `PropsButton` labels + titles routed through the existing `props.*` i18n (was hardcoded "Props"/"Props geven"/"Props ingetrekken"), hardcoded Dutch error alert replaced with `errors.propsError`, dead empty success branches removed | `components/props/PropsButton.tsx` | 5D.1 / 5D.9 |
| Added `props.retract` (NL/EN) | `public/i18n/nl.json`, `public/i18n/en.json` | 5D.9 |
| "Mijn Afspraken" nav-label casing standardised across all nav entry points (was "Mijn afspraken" in `roleQuickLinks`, `profile.deals.navLabel`, `community.agreements.navLabel`; EN mirrored) | `public/i18n/{nl,en}.json` | 5D.1 |

All changes are copy/import level. No component structure, data flow, fetch, or
styling architecture was altered.

---

## 5D.1 Terminology

**Fixed**
- Same nav action rendered as both **"Mijn Afspraken"** and **"Mijn afspraken"**
  (`roleQuickLinks.agreements`, `profile.deals.navLabel`,
  `community.agreements.navLabel` vs the branded `agreements.myAgreements` /
  line-1562 form). Standardised the nav labels to **"Mijn Afspraken"** / **"My
  Agreements"** in both languages.
- **"Props"** hardcoded in `PropsButton` while the i18n layer localises the
  feature as **"Waardering"/"Appreciation"** — the button now uses the i18n
  strings, so the community term reads identically everywhere.

**Documented drift (deferred — needs product decision, not a code nit)**
- **Reviews vs "community feedback":** product detail calls them
  "Beoordelingen"/reviews (`marketplace.detail.sections.reviews`), inspiration
  detail calls the *same* `ReviewForm`/`ReviewList` "community feedback"
  (`communityFeedback.*` in `DishReviewSection.tsx`). Same mechanism, two names.
- **Favorites counted as "props":** `ProductMakerTrustStrip.tsx:94` renders
  `${favoriteCount} props` (favorites relabelled as props) with hardcoded Dutch
  fallbacks `verkopen`/`fans` (lines 85/89).
- **CTA verb sprawl** for adjacent actions: "Bestellen" / "In winkelwagen" /
  "Voorstel doen" / `common.startChat` / "Bericht sturen".

## 5D.2 CTA consistency
- Buy path CTA is consistently `primary-brand`. But the proposal action collapses
  to an **emerald** outline and expands into an **indigo** box
  (`ProductSaleProposalAction.tsx`), and the review "write" button uses a
  **category gradient** (`ListingDetailPage.tsx:853`) — three accent systems for
  primary-ish actions on one page. Deferred (design-system change, out of scope).

## 5D.3 Card consistency
- **Good:** a single unified tile family exists — `MarketplaceTileRouter` →
  `MarketplaceTileStandard/Compact/Mini/Sidebar`, built on shared primitives
  (`TileMedia`, `TileBadgeRow`, `TilePersonRow`, `TileValueExchangeBlock`,
  `TilePriceLine`, `TileTrustCue`). Legacy card names are `@deprecated` shims.
- **Fixed:** the inspiration card's missing `ShareButton` import (would crash on
  render).
- **Deferred:** `components/inspiratie/InspirationCard.tsx` is still a parallel,
  emerald-themed card that bypasses the unified tiles and renders the **category
  label in the price slot** (`text-2xl font-bold ... tabular-nums`, ~line 208).
  Inspiration therefore renders two ways depending on entry point. Migrating it
  into the tile router is a refactor (out of 5D scope) — logged as the top
  remaining opportunity.

## 5D.4 Detail page consistency
- Product detail has a clear rhythm (back bar → media + commerce zone →
  main sections → reviews → sticky CTA). Owner edit form uses emerald focus rings
  while the buy path is primary-brand — cosmetic drift, deferred.

## 5D.5 Empty states
- **Gold standard:** feed chips (`GeoFeed.tsx`) — every chip (sale / inspiration /
  gezocht / services / all / empty-radius) has title + body + a next-step action.
- **Dead ends (deferred):** `components/FavoritesGrid.tsx`,
  `components/profile/FavoritesGrid.tsx`, `components/profile/OrderList.tsx`,
  `components/profile/FansList.tsx`, and the agreements empty in
  `ProfileDealsClient.tsx` are bare, hardcoded-Dutch, no-CTA states. A shared
  `components/ui/EmptyState.tsx` exists but is under-used. Converting these is
  low-risk but touches several profile components + duplicates (two
  `FavoritesGrid`, two `OrderList`) — batched as a follow-up so 5D stays tight.

## 5D.6 Loading states
- Shared skeletons exist (`ui/LoadingSkeleton`, `navigation/RouteLoadingSkeletons`,
  route `loading.tsx` files) but most lists hand-roll `animate-pulse`. "Loading"
  is variously a skeleton, a `Loader2` spinner, or a disabled button. Deferred
  (consolidation = refactor).

## 5D.7 Success & feedback
- Fragmented: a typed toast dock (`NotificationProvider`), a *second* toast
  renderer (`notifications/ToastNotification` reading a different
  `useNotifications`), a reward toast (`HcpRewardToast`), a bespoke inline banner
  (`StartChatButton`), raw `alert()`, or **nothing**. Phase 5D removed the worst
  local case (PropsButton's hardcoded alert + empty success branches); full
  unification is an architecture task (deferred).

## 5D.8 Error experience
- `alert()` is used for errors across ~50 files (incl. `FavoriteButton`,
  `StartChatButton` with interpolated Dutch, `ListingDetailPage`,
  `DishReviewSection`). Some are hardcoded, some i18n. Phase 5D fixed the
  hardcoded PropsButton case; a systematic move to the typed error toast is
  deferred (large, cross-cutting).

## 5D.9 Community consistency
- Broadly emerald/amber/primary-brand with `·`-joined chip strings. Fixed: props
  terminology now flows through i18n. Deferred: multiple overlapping trust
  renderers (`ProductMakerTrustStrip`, `ProductSaleCommerceTrustLine`,
  `ProductDetailTrustBlock`, `ProfileTrustSummaryBlock`, …) and fragile localized
  string matching (`line.includes('sterren')`, `ProductSaleCommerceTrustLine:113`).

## 5D.10 Mobile / 5D.11 Desktop consistency
- Mobile chip surface (`FeedMobileToolbar`) + the 5C ecosystem strip and desktop
  chip row now share the same pillar vocabulary. No regressions observed; the
  duplicate list components (favorites/orders/fans) are the main cross-surface
  inconsistency and are deferred.

## 5D.12 Accessibility
- No regressions introduced. PropsButton retains its `title` (now localized);
  the inspiration `ShareButton` is now actually mountable (was dead). Broader a11y
  polish (focus-ring consistency, screen-reader labels on icon-only actions) is
  noted for a dedicated pass.

## 5D.13 Performance regression
- No fetch, mount, density, cache, or SWR path was touched. Re-asserted by
  `scripts/validate-marketplace-polish-phase5d.ts` (density defaults, no
  chip/density refetch, return cache, unified SWR, single GeoFeed mount) plus the
  Phase 5C / 4C / discovery-2 guards.

---

## Remaining polish opportunities (prioritized, for a future phase)

1. Migrate `InspirationCard` into `MarketplaceTileRouter` (kills the price-slot
   category label + parallel theme; single inspiration rendering).
2. Unify feedback: one toast API for success + error; retire `alert()` from
   marketplace flows; give props/favorite a success confirmation.
3. De-duplicate list components (`FavoritesGrid` ×2, `OrderList` ×2) and route
   their empties through the shared `EmptyState` with a next-step CTA.
4. Consolidate trust renderers + remove localized-string matching for stars.
5. Single accent language on product detail (retire category gradients / indigo
   proposal box for primary actions).
6. Reconcile "reviews" vs "community feedback" naming for the shared review UI.

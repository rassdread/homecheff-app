# UX Finalization — Phase 5D: Marketplace Polish & Consistency

**Date:** 2026-07-08
**Status:** ✅ Audit complete + targeted safe fixes applied — all validators +
`npm run build` green. No redesign, no new functionality, no performance change.

Phase 5D is a polish/consistency phase. It audits every visible marketplace
surface (`docs/audits/MARKETPLACE_UX_POLISH_PHASE5D_AUDIT.md`) and lands the
safe, copy/import-level fixes; larger architectural inconsistencies are recorded
as prioritized follow-ups (fixing them would be a refactor/redesign, explicitly
out of 5D scope).

## Report

1. **UX inconsistencies found** — parallel inspiration card bypassing the unified
   tile system (category label in the price slot); fragmented feedback (typed
   toast vs a 2nd toast vs reward toast vs inline banner vs `alert()` vs nothing);
   dead-end hardcoded-Dutch empty states + duplicate `FavoritesGrid`/`OrderList`;
   3 accent systems on product detail; overlapping trust renderers; skeleton vs
   spinner vs disabled-button loading; "reviews" vs "community feedback" naming.
2. **UX inconsistencies fixed** — restored the inspiration card's missing
   `ShareButton` import (a latent render crash masked by
   `typescript.ignoreBuildErrors`); removed `PropsButton`'s dead empty success
   branches.
3. **Copy inconsistencies fixed** — `PropsButton` now uses the existing
   `props.*` i18n ("Waardering"/"Appreciation") instead of hardcoded "Props";
   its hardcoded Dutch error string now uses `errors.propsError`; the
   "Mijn Afspraken" nav label casing is standardised across every nav entry
   point (NL + EN); added `props.retract`.
4. **Card improvements** — inspiration card no longer crashes on render and can
   actually surface Share; the unified `MarketplaceTileRouter` family is
   confirmed as the single source of truth for sale/request/service tiles.
5. **Detail page improvements** — audited; product-detail accent drift + review
   naming documented as deferred (design-system scope).
6. **Empty state improvements** — feed empties confirmed as the gold standard;
   the profile dead-ends are catalogued with file:line for a batched follow-up.
7. **CTA improvements** — pillar CTA vocabulary is consistent across desktop chip
   row, mobile toolbar and the 5C strip; buy-path CTA stays `primary-brand`.
8. **Community improvements** — props terminology now flows through i18n so
   "Waardering/Appreciation" reads identically everywhere.
9. **Mobile improvements** — mobile chip surface shares the pillar vocabulary; no
   regressions; duplicate list components flagged.
10. **Desktop improvements** — chip row + sidebar vocabulary aligned; no layout
    change.
11. **Accessibility improvements** — localized `title` on PropsButton; the
    inspiration Share action is now mountable; no regressions.
12. **Performance regression report** — none. No fetch/mount/density/cache/SWR
    path touched; re-asserted by the 5D validator + 5C/4C/discovery-2 guards.
13. **Remaining polish opportunities** — see the audit's prioritized list:
    migrate `InspirationCard` into the tile router; unify feedback + retire
    `alert()`; de-duplicate `FavoritesGrid`/`OrderList` and route empties through
    `EmptyState`; consolidate trust renderers; single accent language on product
    detail; reconcile reviews vs community-feedback naming.

## Files changed

- `components/inspiratie/InspirationCard.tsx` — import `ShareButton`.
- `components/props/PropsButton.tsx` — i18n labels/titles, `errors.propsError`,
  dead-branch cleanup.
- `public/i18n/nl.json`, `public/i18n/en.json` — `props.retract`; "Mijn
  Afspraken" / "My Agreements" nav-label casing.

## Deliverables

- `docs/audits/MARKETPLACE_UX_POLISH_PHASE5D_AUDIT.md`
- `docs/progress/UX_FINALIZATION_PHASE5D_MARKETPLACE_POLISH.md`
- `scripts/validate-marketplace-polish-phase5d.ts`

## Validation

```
npx tsx scripts/validate-marketplace-polish-phase5d.ts          # 32 passed
npx tsx scripts/validate-discovery-pillars-phase5c.ts           # 43 passed
npx tsx scripts/validate-runtime-performance-phase4c.ts         # 26 passed
npx tsx scripts/validate-discovery2-information-architecture.ts # 28 passed
npm run build                                                   # success
```

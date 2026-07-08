# UX Finalization — Phase 6A — Unified Design System Consolidation

**Date:** 2026-07-08
**Status:** Complete (audit + migration plan + safe consolidations; larger refactors documented as deferred)

## Intent
Consolidate the existing HomeCheff UI onto one Design System layer using only
components that already exist. No redesign, no reinvention, no new patterns/
functionality, no backend/API/DB/perf/ranking/business change, no removal of
in-use components.

## What shipped (safe consolidations)
1. **Dead `Hc*` primitive family removed** — `HcButton`, `HcCard`, `HcInput`,
   `HcTextarea` had **zero** code adoption (parallel shadow primitives). Canonical
   primitives remain `ui/Button`, `ui/Card`, `ui/Input`.
2. **Empty-state i18n unified** — collapsed the duplicate plural `emptyStates.*`
   namespace onto the pre-existing canonical singular `emptyState.*` (used by the
   feed + orders). Migrated all owned consumers; no dangling keys.
3. **Shared `EmptyState` adoption (+5)** — `FavoritesGrid` (root + profile),
   `profile/OrderList`, `profile/FansList`, `FollowsList` were bare hardcoded-Dutch
   dead ends → now the shared `ui/EmptyState` with explain + next-step CTA, NL/EN.

## Deliverables
1. **Component audit** — `docs/audits/DESIGN_SYSTEM_PHASE6A_AUDIT.md` §1
2. **Design system audit** — audit §2 (standards matrix)
3. **Migration plan** — audit §3 (current → target, impact/risk/strategy, executed flag)
4. **Executed safe consolidations** — audit §4 / this file
5. **Shared-component matrix** — audit §2
6. **Regression report** — audit §5
7. **Performance validation** — audit §6 + validator
8. **Build validation** — `npm run build` pass
9. **Validator** — `scripts/validate-design-system-phase6a.ts` (53 checks)
10. **Documentation** — this file + the audit

## Component families found (summary)
- Primitives: canonical `Button/Card/Input` + dead `Hc*` (removed).
- Empty states: canonical `ui/EmptyState`; two i18n namespaces → unified.
- Loading: two shared skeleton bases kept; **no shared Spinner** (gap).
- Toasts: three systems — reward dock kept; `NotificationProvider` vs
  `ToastNotification` duplication documented.
- Avatars: `UserCircleAvatar` canonical vs `ProfileAvatar` (documented).
- Badges/chips: taxonomy family + generic `Tag`/`ChipToggle` + bespoke status chips.
- Tiles/cards: `MarketplaceTileRouter` canonical; legacy `ItemCard`/`FeedMarketplaceCard` documented.
- Modals: **no shared primitive** (flagship gap).
- Section headers: only a feed-scoped one (extract opportunity).

## Regression / performance
- No in-use component removed; only 0-import `Hc*` files deleted.
- Canonical primitive visuals untouched.
- No fetch/mount/density/cache/SWR/navigation change.

## Validation
- `scripts/validate-design-system-phase6a.ts` — 53/53 pass
- `validate-unified-feedback-phase5e.ts` — 35/35 pass
- `validate-marketplace-polish-phase5d.ts`, `validate-discovery-pillars-phase5c.ts`,
  `validate-runtime-performance-phase4c.ts`,
  `validate-discovery2-information-architecture.ts` — pass
- `npm run build` — pass

## Remaining architectural opportunities
Shared `ui/Modal`, shared `ui/Spinner`, one toast pipeline, avatar unification,
legacy product-card → tile-router migration, extract `ui/SectionHeader`, and
folding the remaining ~35 bare empties into `ui/EmptyState`.

# Shared UI Infrastructure Consolidation — Phase 6B Audit

**Date:** 2026-07-08
**Nature:** Codebase-first infrastructure audit + safe consolidations.
**Constraints honoured:** no redesign, no new functionality/UX/navigation, no
backend/API/DB/ranking/business/marketplace change, no performance/cache/SWR/
density/GeoFeed change, no parallel systems. **The user sees virtually no difference.**

> Goal: consolidate the remaining shared UI infrastructure 6A deferred. Extend
> existing components; execute only safe consolidations; document anything with
> regression risk.

---

## 6B.1 Modal system
**Found:** no shared modal primitive; no Headless UI/Radix. ~60 files hand-roll
`fixed inset-0` overlays; 12+ named `*Modal`/`*Dialog`/sheets, each with bespoke
overlay classes, z-index, scroll-lock, escape and portal behaviour, and
inconsistent `role="dialog"`/`aria-modal`.

**Executed (safe):**
- **Created `components/ui/Modal.tsx`** — one shared overlay primitive:
  `role="dialog"` + `aria-modal`, Escape-to-close, body scroll-lock, focus
  move-in + restore-on-close, overlay-click close. The panel (children) is
  supplied by the caller, so styling is unchanged. This is **the** standard for
  new/future modals (not a parallel system).
- **Migrated `CreateRolesGateModal`** onto it — a clean, self-contained dialog
  (no portal, no external hooks). Its exact overlay classes
  (`fixed inset-0 z-[150] bg-black/50 …`) and panel markup are preserved; the
  only additions are shared a11y (escape/focus), which are invisible.

**Deferred (RISK → documented):** bottom-sheets and portal/animation-heavy modals
(`HcpBadgeDetailSheet`, `StartChatButton` sheet, `CartDrawer`,
`FeedMediaLightbox`, `OperationsOverviewDrawer`, `RecipeModal`, create-flow
`InspiratieDraftCloseDialog` — the latter is queried via `[data-create-flow-dialog]`
by `lib/reset-create-flow-ui.ts` and manages its own scroll-lock). These have
bespoke sizing/animation/scroll behaviour that cannot be migrated without visual/
behavioural risk.

## 6B.2 Spinner system
**Found:** **no shared spinner.** ~25 files use lucide `Loader2`; ~120 files
hand-roll `animate-spin` (SVG or border spinners) with ad-hoc sizes.

**Executed (safe):**
- **Created `components/ui/Spinner.tsx`** — wraps `Loader2 + animate-spin` with
  Button-style sizing (`xs/sm/md/lg` → `h-3.5/h-4/h-5/h-6`), `currentColor`, and
  `className` passthrough so existing colour/margin classes keep working. Optional
  `srLabel` renders `role="status"` for standalone use.
- **Migrated 4 identical inline spinners:** `ShareButton` (sm + xs),
  `PaymentButton` (md), `StartChatButton` (md). Tailwind is order-independent, so
  the rendered class set is identical → **no visual change**. `Loader2` imports
  dropped from the migrated files.

**Deferred:** border-based spinners (`border-t-primary-600 … animate-spin`) render
differently from `Loader2` — migrating them would change appearance, so they are
documented, not migrated.

## 6B.3 Toast infrastructure
**Found (unchanged from 5E/6A):** three systems —
`notifications/NotificationProvider` (context+dock, only mounted in Discover),
`notifications/ToastNotification` (globally mounted in `app/layout.tsx`, different
`useNotifications` hook), and `gamification/HcpRewardToast` (global reward channel).
**Verdict:** reward toast stays a separate channel (by design). The
`NotificationProvider` vs `ToastNotification` overlap is the real duplication →
unifying the pipeline touches global providers = RISK → **documented, not executed.**

## 6B.4 Avatar system
**Found:** canonical `ui/UserCircleAvatar` (SafeImage-based, token sizes, initial
fallback) vs `profile/ProfileAvatar` (px sizing, different border/placeholder,
no initials). `ui/SafeImage` is the shared base (keep). **Verdict:** different
frame/placeholder/sizing → migration is a visual change = RISK → documented.

## 6B.5 Section headers
**Found:** only `feed/DiscoveryFeedSectionHeading` (feed-scoped); page/section/list/
card headers are inline everywhere with varied markup. **Verdict:** a shared
`ui/SectionHeader` can only be introduced safely if it *replaces* existing headers
without visual change — the current headers are too varied to unify invisibly →
documented as a greenfield opportunity, not executed (avoids an unused parallel component).

## 6B.6 Marketplace cards
**Found:** canonical `marketplace/tiles/MarketplaceTileRouter` (+ primitives);
legacy `ItemCard`, `feed/FeedMarketplaceCard`, `marketplace/previews/MarketplacePreviewCard`.
**Verdict:** none are pure wrappers — each carries its own layout/props. No safe
wrapper-only migration exists → documented (RISK), not executed.

## 6B.7 Empty states
**Found:** shared `ui/EmptyState` (bordered white card, `role="status"`). Remaining
bare empties (`PublicFollowsList`, `FollowsList` variants, chat/review lists,
seller profiles) are **centered icon+text without a card** — swapping them to
`EmptyState` would change their appearance. **Verdict:** the bordered-card empties
were already unified in 6A; the centered ones are a visual change → documented,
not migrated. No new hardcoded empty text introduced.

## 6B.8 Loading states
**Found:** two complementary shared bases kept: `ui/LoadingSkeleton` (generic) and
`navigation/RouteLoadingSkeletons` (route-shaped). Inline `animate-pulse` skeletons
(~68) are layout-specific. **Verdict:** only spinners had an identical-implementation
consolidation (done via `ui/Spinner`); skeletons are layout-bound → documented.

## 6B.9 Accessibility
- `ui/Modal`: `role="dialog"`, `aria-modal`, Escape, focus move-in + restore,
  scroll-lock — a shared a11y baseline for every modal that adopts it.
- `ui/Spinner`: optional `srLabel` → `role="status"` `aria-live="polite"`.
- `ui/EmptyState`: retains `role="status"`/`aria-live`.
No regressions; improvements are invisible.

## 6B.10 Design tokens
Both new primitives use **existing** tokens only: `Loader2`/`animate-spin`,
`h-4/h-5/h-6` sizing consistent with `ui/Button`, `bg-black/50` overlay, `z-[150]`,
`currentColor`. No new colours, radii, spacing, elevation or focus styles introduced.

---

## Migration overview
| Area | Action | Risk | Status |
|---|---|---|---|
| Spinner primitive | create `ui/Spinner` | none (additive) | ✅ |
| Spinner call sites (4) | migrate identical `Loader2` spinners | none (same output) | ✅ |
| Modal primitive | create `ui/Modal` | none (additive) | ✅ |
| CreateRolesGateModal | migrate to `ui/Modal` | low (classes preserved) | ✅ |
| Border/other spinners | migrate | visual change | ⏸ documented |
| Bottom-sheets / portal modals | migrate | behavioural | ⏸ documented |
| Toast pipeline | unify Provider vs Toast | global providers | ⏸ documented |
| Avatars | `ProfileAvatar` → `UserCircleAvatar` | visual | ⏸ documented |
| Section headers | extract `ui/SectionHeader` | varied markup | ⏸ documented |
| Legacy cards → tile router | migrate | high | ⏸ documented |
| Centered bare empties | → `EmptyState` | visual | ⏸ documented |

## Regression report
- No in-use component removed. Two additive primitives created.
- 5 migrations (4 spinner + 1 modal) preserve exact rendered output / classes.
- No global provider, fetch, cache, SWR, density, GeoFeed or navigation path touched.

## Performance report
Frozen. Re-asserted by `scripts/validate-shared-ui-phase6b.ts` plus the
6A/5E/5D/5C/4C/discovery-2 guards (all green).

## Remaining architectural opportunities
Adopt `ui/Modal` across the remaining bespoke modals; adopt `ui/Spinner` across
`Loader2` sites and (with a visual decision) border spinners; unify the toast
pipeline; unify avatars; extract `ui/SectionHeader`; migrate legacy product cards
to the tile router.

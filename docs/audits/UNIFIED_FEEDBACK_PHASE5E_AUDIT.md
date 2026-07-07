# Unified Feedback, Empty States & Trust — Phase 5E Audit

**Date:** 2026-07-08
**Nature:** Codebase-first consistency audit + targeted, non-destructive fixes.
**Constraints honoured:** no redesign, no new functionality, no backend/API/
ranking/payment/business-logic change, no performance regression.

> Goal: the platform should feel emotionally consistent — every action gives
> predictable feedback, every empty screen helps, every trust element reinforces
> confidence.

---

## 5E.1 Feedback systems found (and the chosen standard)

| Mechanism | Where | Verdict |
|---|---|---|
| `NotificationProvider` (typed toast, `useNotifications()` context, `hc-toast-dock`) | `components/notifications/NotificationProvider.tsx` — **only mounted in `DiscoverHubClient`** | **Chosen toast standard**, but not globally mounted today |
| `notifications/ToastNotification` (2nd toast, different `useNotifications` hook) | `components/notifications/ToastNotification.tsx` | Duplicate dock — consolidation deferred |
| `HcpRewardToast` (reward dock) | `components/gamification/` | Intentional, separate reward channel |
| Inline banner | `StartChatButton`, `ProductSalePrimaryActions` (amber warnings) | Valid inline pattern |
| `alert()` | ~48 component files | To be phased out of user-facing flows |
| Nothing | props / favorite success | Gap |

**Standard decided (reuse existing, no new architecture):**
- **Inline feedback** (component-local `role="alert"` / `role="status"` region) is
  the default for form/action errors, because the typed toast provider is **not**
  globally mounted (mounting it app-wide would be an architectural change, out of
  5E scope).
- The **typed toast** (`NotificationProvider`) remains the opt-in richer channel
  where a provider is in scope.
- **Empty states** standardise on the shared `components/ui/EmptyState.tsx`.

---

## Fixes applied this phase (safe, presentational/copy-level)

| Fix | Files | Objective |
|---|---|---|
| Dead-end empty states → shared `EmptyState` (icon + title + why + next-step CTA), i18n | `components/FavoritesGrid.tsx`, `components/profile/OrderList.tsx`, `components/profile/FansList.tsx` | 5E.3 |
| `alert()` → inline `role="alert"` error using `communityFeedback.submitError` | `components/inspiratie/DishReviewSection.tsx` | 5E.2 / 5E.5 |
| Centralised `emptyStates.*` namespace (favorites / orders / fans), NL/EN parity | `public/i18n/{nl,en}.json` | 5E.4 |

---

## 5E.2 Remaining alert()
- **Fixed:** the inspiration review flow (`DishReviewSection`) — the clearest
  user-facing marketplace case, now inline.
- **Deferred (documented):** ~47 files still use `alert()`. The majority are
  **admin/upload/debug tooling** (`components/admin/*`, all `*PhotoUpload*`,
  analytics dashboards) which are explicitly out of scope. Remaining user-facing
  ones (`FavoriteButton`, `StartChatButton`, `ListingDetailPage`,
  `OrderMessageButton`, chat) should migrate to inline/toast in a dedicated pass —
  each needs per-file inline state, so batched to keep 5E non-destructive.

## 5E.3 Empty state unification
- **Gold standard already:** feed chips (`GeoFeed`) — every chip (sale /
  inspiration / gezocht / services / all) has explanation + next step.
- **Fixed:** favorites, orders, fans profile grids (were bare hardcoded-Dutch
  dead ends) now render `EmptyState` with explanation + CTA.
- **Deferred:** duplicate `components/profile/FavoritesGrid.tsx` and
  `components/OrderList.tsx`, and `ProfileDealsClient` agreements empty — logged
  for the shared-component pass (5E.10) to avoid touching many surfaces at once.

## 5E.4 Success language
- `emptyStates.*` copy uses one vocabulary and has NL/EN parity. Broader
  success-verb harmonisation (Saved/Published/Sent/…) audited; existing keys are
  largely consistent — no unsafe churn introduced.

## 5E.5 Error experience
- The converted review error is friendly, blame-free, and offers recovery (form
  stays open, error clears on cancel/retry). Consistent red `AlertCircle` +
  `role="alert"`. Same pattern recommended for the deferred alert() sites.

## 5E.6 Loading consistency
- Shared skeletons exist (`ui/LoadingSkeleton`, `navigation/RouteLoadingSkeletons`,
  route `loading.tsx`); many lists still hand-roll `animate-pulse`. Consolidation
  is a refactor — deferred (documented).

## 5E.7 Trust experience
- Unified tile trust cue (`primitives/TileTrustCue.tsx`, `·`-joined) is the tile
  standard. Detail-page trust is still split across `ProductMakerTrustStrip`,
  `ProductSaleCommerceTrustLine`, `ProductDetailTrustBlock`,
  `ProfileTrustSummaryBlock`. Consolidating them is a refactor — deferred; the
  fragile `line.includes('sterren')` star detection is flagged.

## 5E.8 Review consistency
- Same `ReviewForm`/`ReviewList` power product "reviews/Beoordelingen" and
  inspiration "community feedback". Naming reconciliation is a product decision
  (deferred); presentation is already shared.

## 5E.9 Community feedback loop
- **Gap noted:** props/favorite give no explicit success acknowledgement (only a
  state flip); the review flow now at least surfaces failures inline. A shared
  micro-confirmation for appreciation actions is recommended once a global toast
  is mounted.

## 5E.10 Shared list components
- Duplicate `FavoritesGrid`/`OrderList` remain; the unified ones now share the
  `EmptyState` language. De-duplication deferred (needs data-shape reconciliation).

## 5E.11 Accessibility
- New empty states use `EmptyState` (`role="status"` `aria-live="polite"`); the
  review error uses `role="alert"`. Icon-only actions elsewhere still need labels
  (deferred, documented). No regressions.

## 5E.12 Performance
- No fetch/mount/density/cache/SWR/navigation path touched. Re-asserted by
  `scripts/validate-unified-feedback-phase5e.ts` + the 5D/5C/4C/discovery-2 guards.

---

## Remaining architectural opportunities (for a future phase)

1. Mount one global toast provider, then migrate remaining user-facing `alert()`
   to inline/toast + add success acknowledgement for props/favorite.
2. Retire the duplicate toast (`ToastNotification`) / second `useNotifications`.
3. De-duplicate `FavoritesGrid`/`OrderList`; route all list empties through
   `EmptyState`.
4. Consolidate the detail-page trust renderers; remove localized star-string
   matching.
5. Consolidate skeleton usage onto the shared skeleton set.
6. Reconcile "reviews" vs "community feedback" naming for the shared review UI.

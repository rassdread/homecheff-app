# Design System Consolidation — Phase 6A Audit

**Date:** 2026-07-08
**Nature:** Codebase-first component/design-system audit + migration plan + safe consolidations.
**Constraints honoured:** no redesign, no reinvention, no new patterns, no new
functionality, no backend/API/DB/ranking/business/marketplace change, no
performance-architecture change, no removal of in-use components.

Scope surveyed: **476 `.tsx` under `components/`**, plus `public/i18n/{nl,en}.json`.

> Goal: consolidate the existing UI into one uniform Design System layer using
> only components that already exist. Prefer *one excellent component* over six
> near-identical ones.

---

## 1. Component audit — duplicate families

### Generic primitives (`components/ui/`)
| Purpose | Canonical (adopted) | Duplicate (adoption) | Verdict |
|---|---|---|---|
| Button | `ui/Button.tsx` (~33 importers) | `ui/HcButton.tsx` (**0**) | **Removed** dead dup |
| Card | `ui/Card.tsx` | `ui/HcCard.tsx` (**0**) | **Removed** dead dup |
| Input | `ui/Input.tsx` | `ui/HcInput.tsx` (**0**) | **Removed** dead dup |
| Textarea | (uses `HcTextarea` nowhere) | `ui/HcTextarea.tsx` (**0**) | **Removed** dead dup |

The entire `Hc*` family was a never-adopted parallel primitive set (referenced
only in its own files + old phase docs). Removing it eliminates a whole shadow
primitive layer with zero regression risk.

### Empty states
- **Canonical:** `ui/EmptyState.tsx` (`role="status"` `aria-live`, icon + title +
  description + CTA).
- **Two competing i18n namespaces** existed: `emptyState.*` (singular; used by
  `GeoFeed` + root `OrderList`) and `emptyStates.*` (plural; introduced in 5E).
  → **Consolidated onto the singular `emptyState.*`**; plural removed.
- ~40 hand-rolled bare empties remain (chat lists, review lists, seller profiles,
  admin) — documented; the simple text-only ones are safe migration targets.

### Loading / skeleton / spinner
- Two complementary shared bases: `ui/LoadingSkeleton.tsx` (generic) and
  `navigation/RouteLoadingSkeletons.tsx` (route-shaped). **Keep both.**
- Fragmentation: ~68 inline `animate-pulse` skeletons, ~90 inline `animate-spin`
  spinners, and **no shared `Spinner` primitive**. → Documented (RISKY refactor).

### Toasts / notifications — three parallel systems
| System | File | Mounted |
|---|---|---|
| Notification context + dock | `notifications/NotificationProvider.tsx` | only in `DiscoverHubClient` |
| Toast surfacer (different `useNotifications` hook) | `notifications/ToastNotification.tsx` | global (`app/layout.tsx`) |
| Reward dock | `gamification/HcpRewardToast.tsx` | global (`Providers`) |
→ Reward dock is intentionally separate. The `NotificationProvider` vs
`ToastNotification` split is the real duplication → documented (RISKY).

### Avatars
- Canonical: `ui/UserCircleAvatar.tsx` (SafeImage-based, token sizes, initial
  fallback). Near-duplicate: `profile/ProfileAvatar.tsx` (px sizing, different
  border/placeholder). `ui/SafeImage.tsx` is the shared base (keep). → RISKY.

### Badges / chips / tags
- Cohesive taxonomy family (keep): `marketplace/MarketplaceBadge → BadgeList →
  AcceptedBadgesRow → tiles/MarketplaceTileBadgeStrip → tiles/primitives/TileBadgeRow`.
- Generic primitives: `ui/Tag.tsx`, `ui/ChipToggle.tsx`.
- Bespoke status chips (distinct semantics, keep): `orders/OrderStatusChip`,
  `operations/OperationsStatusChips`, `communication/CommsUnreadBadge`,
  `home/HomeVerticalChipStrip`, `gamification/UserBadgeChips`,
  `ui/BusinessBadge`. → DOCUMENT-ONLY.

### Cards / tiles
- Canonical marketplace tile system: `marketplace/tiles/MarketplaceTileRouter`
  → Compact/Standard/Mini/Sidebar/Favorite + `tiles/primitives/*` + `lib/marketplace/tiles`.
- Legacy overlap: `ItemCard.tsx`, `feed/FeedMarketplaceCard.tsx`,
  `marketplace/previews/MarketplacePreviewCard.tsx`. → RISKY migration, documented.
- Domain cards (discovery/operations/agreements/chat/home/gamification): keep.
- Generic container: `ui/Card.tsx`.

### Dialogs / modals — no shared primitive
- No `ui/Modal`/`ui/Dialog`, no Headless UI/Radix. 12+ bespoke modals + ~60 files
  hand-rolling `fixed inset-0` overlays with inconsistent `aria-modal`/focus. →
  Highest structural payoff, but RISKY → documented as the flagship next step.

### Section headers
- Only `feed/DiscoveryFeedSectionHeading.tsx` (feed-scoped); elsewhere inline. →
  Opportunity: greenfield `ui/SectionHeader` (SAFE, additive) — documented.

### Buttons (feature)
- `ui/Button.tsx` is the confirmed generic canonical. Feature buttons
  (`FavoriteButton`, `PropsButton`, `ShareButton`, `FollowButton`,
  `StartChatButton`, `AddToCartButton`, `PaymentButton`, …) are legitimate
  behavioural components, **not** duplicates. → DOCUMENT-ONLY.

---

## 2. Design-system standards matrix

| Token / element | Canonical | Status |
|---|---|---|
| Button | `ui/Button` | ✅ dup removed |
| Card container | `ui/Card` | ✅ dup removed |
| Input | `ui/Input` | ✅ dup removed |
| Empty state | `ui/EmptyState` + `emptyState.*` i18n | ✅ namespace unified, +5 adopters |
| Skeleton (generic) | `ui/LoadingSkeleton` | keep |
| Skeleton (route) | `navigation/RouteLoadingSkeletons` | keep |
| Spinner | — (none) | ⚠️ gap, documented |
| Toast | `notifications/ToastNotification` (mounted) | ⚠️ dup w/ NotificationProvider |
| Reward toast | `gamification/HcpRewardToast` | keep (separate channel) |
| Avatar | `ui/UserCircleAvatar` | ⚠️ dup `ProfileAvatar` |
| Image | `ui/SafeImage` | keep (base) |
| Tag / Chip | `ui/Tag` / `ui/ChipToggle` | keep |
| Marketplace badge | `marketplace/MarketplaceBadge` family | keep |
| Marketplace tile | `marketplace/tiles/MarketplaceTileRouter` | keep (legacy cards documented) |
| Modal / Dialog | — (none) | ⚠️ gap, flagship next step |
| Section header | `feed/DiscoveryFeedSectionHeading` (scoped) | ⚠️ extract opportunity |
| Trust cue (tile) | `tiles/primitives/TileTrustCue` | keep (5E) |

---

## 3. Migration plan

| # | Current | Target | Impact | Risk | Strategy | Executed? |
|---|---|---|---|---|---|---|
| 1 | `Hc{Button,Card,Input,Textarea}` | `ui/{Button,Card,Input}` | none (0 users) | **None** | delete dead files | **✅ this phase** |
| 2 | `emptyStates.*` (plural) | `emptyState.*` (singular) | 3 files | **Low** (all consumers owned) | extend canonical, migrate consumers, drop plural | **✅ this phase** |
| 3 | bare empties in profile grids/lists | `ui/EmptyState` | 5 files | **Low** | swap text-only dead ends | **✅ this phase** (5 total) |
| 4 | remaining ~35 bare empties | `ui/EmptyState` | many | Med | per-file, text-only first | deferred |
| 5 | `ProfileAvatar` | `UserCircleAvatar` | ~n sites | Med | size-map + visual QA | deferred |
| 6 | `ItemCard`/`FeedMarketplaceCard` | `MarketplaceTileRouter` | high | High | prop adapters + parity QA | deferred |
| 7 | bespoke modals | new `ui/Modal` | very high | High | build primitive, migrate incrementally | deferred |
| 8 | inline spinners | new `ui/Spinner` | ~90 sites | Med | build primitive, migrate | deferred |
| 9 | `NotificationProvider` vs `ToastNotification` | one toast pipeline | med | High | pick mounted one, migrate | deferred |
| 10 | inline section headers | new `ui/SectionHeader` | many | Low (additive) | greenfield + gradual adoption | deferred |

**Only rows 1–3 (zero/low risk, all consumers owned) were executed.** Everything
else is documented with risk so it can be scheduled deliberately.

---

## 4. Executed safe consolidations (this phase)

1. **Removed the dead `Hc*` primitive family** (`HcButton`, `HcCard`, `HcInput`,
   `HcTextarea`) — 0 code references anywhere.
2. **Unified empty-state i18n** onto canonical `emptyState.*`; removed the
   duplicate plural `emptyStates.*` and migrated its 3 consumers.
3. **Routed 5 profile grids/lists** through the shared `ui/EmptyState`:
   `FavoritesGrid` (root + profile), `profile/OrderList`, `profile/FansList`,
   `FollowsList` — each now explains + offers a next step, NL/EN.

## 5. Regression report
- No in-use component removed. Only the 0-import `Hc*` files deleted.
- All empty-state consumers migrated in lockstep with the namespace change; no
  dangling `emptyStates.*` keys (asserted).
- Visual output of canonical primitives unchanged (not touched).

## 6. Performance report
- No fetch/mount/density/cache/SWR/navigation path touched. Re-asserted by
  `scripts/validate-design-system-phase6a.ts` + the 5E/5D/5C/4C/discovery-2 guards.

## Remaining architectural opportunities
Rows 4–10 above — flagship items: a shared `ui/Modal`, a shared `ui/Spinner`,
one toast pipeline, avatar unification, and legacy product-card → tile-router
migration.

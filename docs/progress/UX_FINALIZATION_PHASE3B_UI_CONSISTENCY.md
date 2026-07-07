# UX Finalization Phase 3B — UI Consistency, Loading & Interaction Polish

Status: **Completed**
Scope: consistency / loading / feedback polish only — no new features, no redesign,
no design-system migration.
Validator: `scripts/validate-ux-fin-3b-consistency.ts` — **67/67 checks pass**.

Builds on Phase 3A (money path + critical copy). This phase removes the last
visible inconsistencies so orders, deals, delivery, marketplace, seller and buyer
surfaces feel like one platform.

---

## UX-FIN-3B.1 — Uniform status chips (Audit J9)

One source of truth for order-status presentation, adopted on the order family
that previously re-implemented it ~3×:

- `lib/orders/order-status-display.ts` — canonical tone map + i18n label keys.
  Normalizes either the raw Prisma enum (preferred) or a localized NL/EN label.
- `components/orders/OrderStatusChip.tsx` — shared chip (same colours, label,
  spacing) using the new `orderStatus.*` i18n namespace.

Adopted in:

- Buyer orders (`app/orders/page.tsx`) — removed hand-rolled `getStatusColor`.
- Seller orders (`app/verkoper/orders/page-client.tsx`) — removed `getStatusColor`.
- Seller dashboard (`app/verkoper/dashboard/page-client.tsx`) — removed
  `getOrderStatusColor`.

New i18n: `orderStatus.{pending,confirmed,processing,shipped,delivered,cancelled,refunded,unknown}` (nl + en).

Consciously deferred: notifications, admin and deal/community-order status use a
different status domain; a full shared `Tag`/token codemod stays out of scope.

## UX-FIN-3B.2 — Skeleton parity (Audit J13)

- Added a shared `CardListLoadingSkeleton` to
  `components/navigation/RouteLoadingSkeletons.tsx`.
- Replaced bare spinners with it in Profile Deals (`ProfileDealsClient`) and the
  Delivery Dashboard (`DeliveryDashboard`). Buyer orders already used a skeleton.

## UX-FIN-3B.3 — REQUEST detail polish (Audit J12)

A request now reads like a help request, not a product page:

- `ListingDetailPage.tsx` — the reviews section is hidden for requests
  (`!isRequestListing`).
- `ProductSaleCommerceZone.tsx` — stock badge, "prijs incl. btw" line and the
  quantity selector are suppressed for `listingKind === 'REQUEST'`.
- `ProductSaleStickyCta.tsx` — a request never falls back to add-to-cart; the
  sticky bar routes to the proposal/contact block.

Kept: trust, accepted values, proposal CTA, conditions and exchange sections.

## UX-FIN-3B.4 — Favorites clarity (Audit J15)

`/favorites` no longer reads as a Fans page:

- Page header is now "Favorieten & fans" with an intro explaining favourites vs
  fans vs following, and it opens on the Favorites tab.
- `FansAndFollowsList` tab labels, badges and "since" copy moved to the new
  `favoritesHub.*` i18n namespace (nl + en). The confusing "Fan" label for the
  *following* tab is now "Ik volg" / "Following"; the *fans* tab is "Mijn fans".
- Removed debug `console.log` calls from the follows/fans fetch.

## UX-FIN-3B.5 — Touch targets (Audit J14)

Upload delete controls are no longer hover-only:

- Across 10 uploader components the delete/remove buttons switched from
  `opacity-0 group-hover:opacity-100` to `opacity-100 sm:opacity-0
  sm:group-hover:opacity-100` (always visible on touch, hover-reveal ≥ sm).
- The three primary product uploaders (`MultiImageUploader`,
  `SimpleImageUploader`, `ProductPhotoUpload`) get a ≥44px touch target on mobile
  (`min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0`). The upload flow is unchanged.

## UX-FIN-3B.6 — Inline feedback (Audit J10)

Blocking `alert()` replaced by inline feedback within scope:

- Checkout (`app/checkout/page.tsx`) — 4 alerts → a single inline error banner
  above the pay button (`checkoutError`).
- Seller orders — status-update alerts → dismissible inline banner
  (`statusError`), with new `errors.{notLoggedIn,noAccessOrder,orderNotFound}` keys.
- Delivery dashboard — status-toggle and accept-order alerts → dismissible inline
  banner (`feedback`). Stripe onboarding alerts left as-is (out of the operational
  scope for this phase).

No new toast library, no app-wide migration.

## UX-FIN-3B.7 — Small polish

- Removed the duplicate status chip on the hub deal card
  (`AgreementHubDealCard`) — it is now rendered once by `ProfileDealCard` (J20).
- Consistent chip spacing/sizing follows from the shared `OrderStatusChip`.

## UX-FIN-3B.8 — Mobile consistency

- Touch visibility for uploader controls (3B.5).
- Inline banners wrap and use `justify-between` with a close action instead of
  modal alerts (3B.6).
- Shared skeletons avoid layout jumps on load (3B.2).

## UX-FIN-3B.9 — Validation

`scripts/validate-ux-fin-3b-consistency.ts` — 67 static checks covering all of the
above plus nl/en parity of the new namespaces. Build verified with `npm run build`.

---

## Consciously deferred (design-system items)

- Single shared `Tag` primitive + design tokens for **all** status domains
  (notifications, admin, deals) — needs the wider J7/J9 codemod.
- App-wide `alert()` → toast replacement (~240 calls outside this scope).
- First-impression rework (J8) and Button/HcButton codemod.

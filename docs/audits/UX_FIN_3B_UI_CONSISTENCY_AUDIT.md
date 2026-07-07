# UX-FIN 3B — UI Consistency Audit Report

Companion to `docs/progress/UX_FINALIZATION_PHASE3B_UI_CONSISTENCY.md`.
Reports the outcome of the consistency pass against the Phase 3 findings
(J9, J10, J12, J13, J14, J15, J20).

## 1. Inconsistencies resolved

| Audit | Inconsistency | Resolution |
|-------|---------------|------------|
| J9 | Order status chip re-implemented per surface | Shared `OrderStatusChip` + `order-status-display` tone/label map |
| J13 | Bare spinners on profile deals & delivery dashboard | Shared `CardListLoadingSkeleton` |
| J12 | Requests showed sale chrome (reviews/stock/VAT/quantity) | Gated on `isRequestListing` / `listingKind === 'REQUEST'` |
| J15 | `/favorites` read as a Fans page | Clear title/intro + `favoritesHub.*` tabs/badges, opens on Favorites |
| J14 | Hover-only, sub-44px uploader delete controls | Touch-visible + 44px targets |
| J10 | `alert()` as feedback channel | Inline banners in checkout / seller orders / delivery dashboard |
| J20 | Double status chip on hub deal card | Rendered once (in `ProfileDealCard`) |

## 2. Screens now using the same status presentation

- Buyer orders (`/orders`)
- Seller orders (`/verkoper/orders`)
- Seller dashboard (`/verkoper/dashboard`)

All three render `OrderStatusChip`, backed by one tone map and the shared
`orderStatus.*` i18n labels — same colour, label and spacing everywhere.

## 3. REQUEST screens cleaned up

- `request/[slug]` via `ListingDetailPage` — reviews section hidden.
- `ProductSaleCommerceZone` — stock badge, VAT line and quantity selector hidden.
- `ProductSaleStickyCta` — proposal-oriented CTA instead of add-to-cart.

Retained: trust block, accepted values, conditions, exchange suggestions and the
proposal CTA.

## 4. Mobile improvements

- Uploader delete controls always reachable on touch (min 44px on the primary
  product uploaders).
- Feedback is inline/dismissible and wraps, replacing modal `alert()` popups in
  the money and operations paths.
- Shared skeletons keep list loading stable on small screens.

## 5. Larger design-system items deliberately deferred

- One `Tag` primitive + tokens spanning all status domains (notifications, admin,
  community-order/deal status) — requires the wider J7/J9 codemod.
- App-wide `alert()` → toast migration (~240 calls) beyond the four in-scope
  screens.
- First-impression rework (J8) and the Button/HcButton codemod.

## Verification

- `npx tsx scripts/validate-ux-fin-3b-consistency.ts` → 67/67 pass.
- `npm run build` → success.

# Settlement Options Data Wiring, Stripe Connect Guidance & Offer Classification — Phase 7C Audit

Date: 2026-07-08
Scope: data wiring + create/edit settlement options + Stripe Connect guidance +
feed/tile model + preview/detail explanation + settlement routing + offer
classification. No checkout-flow change, no payment-provider change, no ranking
change, no new payment rails.

---

## 7C.1 Current settlement data model (audit)

### Product fields (Prisma)
- `Product.acceptHomeCheffPayment Boolean @default(true)`,
  `Product.acceptDirectContact Boolean @default(false)` — **both booleans exist**.
- `Product.orderMethod` (`HOMECHEFF_PAYMENT | CONTACT`) — a **lossy** single
  value derived at write-time via `deriveOrderMethodFromPaymentFlags`
  (`lib/marketplace/listing-taxonomy.ts:171`). A listing accepting BOTH collapses
  to `HOMECHEFF_PAYMENT`, losing the "also direct contact" fact.
- `barterOpenness` (`MONEY | MONEY_AND_BARTER | BARTER_ONLY`),
  `acceptedSpecializations String[]`, `priceModel`, `priceCents`, `listingIntent`.

### Create/edit
- `PaymentMethodCheckboxes` already lets the seller pick **both** booleans
  independently; `BarterOpennessSelector` + `AcceptedValuesPicker` are
  independent. So multi-select already works at input time — the loss is
  downstream.

### Stripe Connect status
- On `User`: `stripeConnectAccountId`, `stripeConnectOnboardingCompleted`. No
  `chargesEnabled/payoutsEnabled` columns (only live-fetched).
- Ready check: `sellerPaymentsReady(user)` = both fields present
  (`lib/product/order-method.ts:68`). `requiresStripeForHomecheffCheckout` =
  HomeCheff + `priceCents > 0`.
- Onboarding route: `POST /api/stripe/connect/onboard` (GET returns
  `isCompleted`); component `StripeConnectSetup` / `StripeConnectPaymentsBanner`.
- Checkout hard-gate: `app/api/checkout/route.ts` blocks purchase when
  `requiresStripeForHomecheffCheckout && !sellerPaymentsReady`.

### Where data was lost (before 7C)
- **Feed query** (`app/api/feed/route.ts`) selected `orderMethod` but **not** the
  two booleans; seller join had `stripeConnectAccountId` but **not**
  `stripeConnectOnboardingCompleted`.
- **Tile model** collapsed to a single `orderMethod`; `build-tile-settlement-row`
  could not show HomeCheff + direct simultaneously, and could not gate HomeCheff
  on Connect readiness.
- **Preview/detail** showed a single payment label; no explicit settlement
  explanation or "why checkout not available yet".

### Offer classification
- `isMarketplaceSaleItem` (`lib/feed/marketplace-sale.ts:89`) already returns
  `true` for a PRODUCT/LISTING OFFER **before** price is considered (line 101),
  so OFFERs with no money price are already sale items. Price/orderMethod are
  only inclusive fallbacks. The remaining price-based *exclusion* is the client
  min-price filter (`lib/feed/feed-client-sort.ts:63`), which is an explicit
  user filter, not a classification bug.

---

## 7C.2 Canonical settlement standard (implemented)

`lib/marketplace/settlement/settlement-options.ts` —
`resolveSettlementOptions(input): SettlementOptions` is the single source of
truth:

- Options: `acceptsHomeCheffCheckout`, `acceptsDirectContact`, `allowsBarter`,
  `hasAcceptedValues`, `acceptedValueTaxonomyIds`.
- Availability: `homeCheffCheckoutSelectable`, `homeCheffCheckoutConfigured`,
  `homeCheffCheckoutNeedsConnect`, `canCheckoutNow`, `canDiscussDirectly`,
  `canMakeProposal`.
- Prefers the real booleans; falls back to `orderMethod` only for legacy rows.
  Unknown Connect status → assume configured (non-regression); explicit `false`
  → not publicly available.

---

## 7C.3 Create/edit — multiple settlement options
Already correct (independent checkboxes + barter + accepted values). No option
disables another. Added the Connect guidance (7C.4) alongside.

## 7C.4 Stripe Connect guidance (implemented)
`components/products/marketplace/SettlementConnectGuidance.tsx` shows a friendly,
non-blocking block where HomeCheff Checkout is chosen:
- Connect ready → green reassurance (`marketplace.settlement.connectReady`).
- Connect missing → guidance (`marketplace.settlement.needsConnect`) + CTA
  (`marketplace.settlement.setupConnectCta`) → existing `POST
  /api/stripe/connect/onboard`. Never blocks publishing.

## 7C.5 Feed/tile data wiring (implemented)
- Feed query now selects `acceptHomeCheffPayment`, `acceptDirectContact` and
  seller `stripeConnectOnboardingCompleted`; emits `acceptHomeCheffPayment`,
  `acceptDirectContact`, `sellerStripeConnectReady` per item.
- Threaded through `FeedItem` → `GeoFeedCardItem` → `MarketplaceTileModel`
  (`acceptsHomeCheffCheckout`, `acceptsDirectContact`,
  `homeCheffCheckoutConfigured`).
- **No extra fetch / N+1**: same selects, same single query; connect flag reused
  from the existing seller join.

## 7C.6 Tile settlement row (implemented)
`build-tile-settlement-row` now derives from canonical options and can show
multiple icons at once. HomeCheff icon only when `canCheckoutNow` (selected +
Connect configured). Distinct icons: `ShieldCheck` / `Banknote` / `Handshake` /
`ArrowLeftRight`. No Stripe logo.

## 7C.7 Preview explanation (implemented)
`MarketplacePreviewCard` → `PreviewSettlement` lists enabled settlement methods
in plain language, request-aware heading for Gezocht
(`marketplace.preview.settlement.*`).

## 7C.8 Detail explanation (implemented)
`ProductDetailSettlementSection` explains each available settlement option + why
HomeCheff Checkout may not be available yet (`marketplace.detail.settlement.*`),
wired into `ProductDetailMainSections`. Explanatory only — no conflicting CTA
(checkout/proposal CTAs remain in the commerce zone).

## 7C.9 Proposal / checkout availability (verified)
- Existing server checkout guard already blocks purchase without Connect.
- Tile/preview/detail now gate the public HomeCheff Checkout affordance on
  `canCheckoutNow`.
- Proposal remains available for direct/barter/accepted-values/request.
- No checkout-flow change made (out of scope).

## 7C.10 Central settlement router (implemented)
`lib/marketplace/settlement/settlement-router.ts`:
`resolveSettlementFlow(method)` → HomeCheff Checkout ⇒ `CHECKOUT`, everything
else ⇒ `PROPOSAL`. `resolveSettlementFlowAvailability(options)` returns available
flows. Business rule enforced centrally: **settlement choice drives the flow, not
category/listingKind/listingIntent/priceModel** — applies equally to Gezocht.
(Wiring every entrypoint CTA through this helper is staged as a follow-up; the
canonical helper + tile/preview/detail gating already use it.)

## 7C.X Offer classification (verified + guarded live)
OFFER stays "Aanbod/Te koop" regardless of value form (fixed / on-request /
voluntary / barter-only / accepted-values-only / direct-contact-only); REQUEST
stays "Gezocht". Asserted by executing `isMarketplaceSaleItem` in the validator.

---

## Deferred items
1. **Detail "both" display fidelity** — the detail data source doesn't yet select
   `acceptHomeCheffPayment`/`acceptDirectContact`; detail falls back to
   `orderMethod` (canonical helper). Wiring both booleans into the detail query
   is a small follow-up.
2. **Route every CTA through the settlement router** — tile/preview action
   buttons and the commerce zone should call `resolveSettlementFlow` directly so
   there is provably one routing path; today the router is the canonical helper
   but the legacy commerce actions still compute checkout/proposal themselves.
3. **Gezocht proposal reverse-flow** copy/direction (from Phase 7B) still open.
4. **Min-price filter** drops no-price offers from the sale feed when a min filter
   is set (`feed-client-sort.ts:63`) — arguably intended; revisit if it confuses.
5. **Legacy Listing/Dish** items still lack the payment booleans (Product-only).

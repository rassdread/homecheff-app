# Settlement Router & CTA — Phase 8E Audit

Date: 2026-07-08  
Scope: Wire every marketplace CTA through `lib/marketplace/settlement/settlement-router.ts`  
Prerequisite phases: 7C (settlement-options), 7D (tile architecture), 8C (reverse discovery), 8D (value economy UX)

## Executive summary

Phase 8E completes the routing layer that 7C documented but did not fully wire. **Settlement choice now determines user flow** on all primary commerce surfaces. Category, listing kind, intent, and price model no longer gate CTAs independently.

**Outcome:** One central resolver (`resolveMarketplaceCtaActions`) drives detail primary/sticky/commerce-zone CTAs, preview proposal buttons, secondary contact, and the checkout API gate.

---

## 1. CTA audit (entrypoints)

| Entrypoint | Before 8E | After 8E |
|------------|-----------|----------|
| Product detail primary CTA | `resolveDetailPageActions` + `resolveProductCommerceActions` + `isContactOnlyProduct` | `resolveMarketplaceCtaActions` |
| Sticky CTA (mobile) | `resolveProductCommerceActions` + barter blocks | `resolveMarketplaceCtaActions` |
| Commerce zone (price/qty) | `isContactOnlyProduct` + commerce actions | `resolveMarketplaceCtaActions` |
| Secondary contact | `isContactOnlyProduct` | `resolveMarketplaceCtaActions` (shown only when checkout path active) |
| Preview card actions | Category/kind list `PROPOSAL_PREVIEW_KINDS` | `resolveMarketplaceCtaActions` + `canMakeProposal` |
| Tile CTA | N/A — tiles link to detail/preview only | Unchanged (by design) |
| Profile listing tiles | Link-only (`MarketplaceTileMini`) | Unchanged — detail resolves CTA |
| Favorites tiles | Link-only | Unchanged — detail resolves CTA |
| Wanted (Gezocht) detail | Mixed kind-matrix + booleans | Router: proposal unless explicit HomeCheff checkout valid |
| Services detail | Same commerce zone | Router via shared detail components |
| Proposal buttons | `ProductSaleProposalAction` | Label from `resolveProposalCtaLabelKey` |
| Cart / add-to-cart | Parent-gated via `showCheckout` | Only rendered when router allows checkout |
| Checkout entry (`/checkout`, API) | `isContactOnlyProduct` + barter blocks | `resolveCheckoutBlockReason` + settlement booleans |
| Contact seller | `MakerContactSection` / `StartChatButton` | Labels from `marketplace.cta.*` keys |

---

## 2. Settlement-router usage

### Core helpers (`settlement-router.ts`)

| Export | Role |
|--------|------|
| `resolveSettlementFlow` | Method → CHECKOUT or PROPOSAL |
| `resolveSettlementFlowAvailability` | Options → available flows |
| `toMarketplaceCtaContext` | Product + runtime context → router input |
| `resolveMarketplaceCtaActions` | **Single CTA resolver for all surfaces** |
| `resolveProposalCtaLabelKey` | Proposal copy by dominant non-checkout method |
| `productAllowsHomecheffCheckout` | Server positive gate |
| `resolveCheckoutBlockReason` | Server block classification (CONTACT_ONLY, BARTER_ONLY, PAYMENTS_NOT_READY) |

### Wired components

- `ProductSalePrimaryActions.tsx`
- `ProductSaleStickyCta.tsx`
- `ProductSaleCommerceZone.tsx`
- `ProductSaleSecondaryContact.tsx`
- `MarketplacePreviewActions.tsx`
- `app/api/checkout/route.ts`

---

## 3. Checkout routing

HomeCheff Checkout routes to cart/checkout **only when:**

1. Seller accepts HomeCheff Checkout (`acceptHomeCheffPayment` or legacy eligible)
2. Stripe Connect is ready (`stripeConnectReady` / `sellerStripeReady`)
3. Listing is in stock and viewer is not owner
4. Barter openness does not block cart (`BARTER_ONLY`)

Dual settlement: when checkout **and** proposal are available, both CTAs render (`showDualPath`).

When Connect is missing but seller selected HomeCheff: `checkoutNeedsConnect` → proposal primary + guidance (existing payment warning).

---

## 4. Chat / proposal routing

Direct contact, cash, barter, and accepted values **always** route to chat + proposal — never checkout.

| Dominant method | CTA label key |
|-----------------|---------------|
| Direct contact only | `marketplace.cta.arrangeDirect` |
| Barter only | `marketplace.cta.discussBarter` |
| Accepted values / mixed | `marketplace.cta.makeProposal` |
| Generic conversation | `marketplace.cta.startConversation` |

`StartChatButton` uses `openProposalAfterStart` on proposal-primary paths.

---

## 5. Wanted routing

`listingIntent === 'REQUEST'` (Gezocht):

- Default: proposal CTA (`marketplace.cta.makeProposal`)
- Exception: when seller explicitly accepts HomeCheff Checkout **and** Connect is ready → checkout path available (same rules as offers)

Category/kind does not override this.

---

## 6. Services routing

Services (SERVICE, TASK, COACHING, etc.) use the same detail commerce components. No per-kind routing matrix remains on CTAs. Settlement booleans + barter/accepted values drive the flow.

---

## 7. Legacy fallback

When `acceptHomeCheffPayment` / `acceptDirectContact` are absent:

- `orderMethod === 'CONTACT'` → direct/proposal only
- Legacy priced rows (`isLegacyPricedCheckoutEligible`) → checkout when Connect ready
- Unknown Connect on legacy rows → assume configured (7C non-regression)

Explicit booleans **always win** over `orderMethod`.

---

## 8. Checkout API gate

`POST /api/checkout` now classifies each cart product via `resolveCheckoutBlockReason`:

| Reason | API error key |
|--------|---------------|
| `CONTACT_ONLY` | `checkout.errors.contactOnly` |
| `BARTER_ONLY` | `checkout.errors.barterOnly` |
| `PAYMENTS_NOT_READY` | `checkout.errors.paymentsNotReady` |

Uses `acceptHomeCheffPayment`, `acceptDirectContact`, `orderMethod`, barter, accepted values, price, and seller Connect status — not `isContactOnlyProduct` alone.

---

## 9. Copy / i18n

New keys under `marketplace.cta.*` (NL/EN parity):

| Key | NL | EN |
|-----|----|----|
| `checkoutHomeCheff` | Veilig afrekenen via HomeCheff | Pay securely via HomeCheff |
| `startConversation` | Start gesprek | Start conversation |
| `makeProposal` | Doe een voorstel | Make a proposal |
| `discussBarter` | Bespreek ruil | Discuss barter |
| `arrangeDirect` | Regel direct met aanbieder | Arrange directly with provider |

Detail settlement section copy unchanged (`marketplace.detail.settlement.*`).

---

## 10. Deferred items

| Item | Reason |
|------|--------|
| `AddToCartButton` internal barter guard | Parent already gates; low risk; uses `blocksHomecheffCartCheckout` as defense-in-depth |
| `useCart` barter block | Client cart hygiene — not a CTA surface |
| Feed/dorpsplein `isContactOnlyProduct` for **display** | Presentation/ranking — out of 8E scope |
| `resolveDetailPageActions` in older validators | Kept for historical scripts; no longer used by live CTAs |
| Full removal of `orderMethod` field | Data migration — future phase |
| Tile-level checkout CTA | Tiles intentionally link to detail; no checkout on tile |

---

## Validation

```bash
npx tsx scripts/validate-settlement-router-phase8e.ts
npx tsx scripts/validate-marketplace-value-economy-phase8d.ts
npx tsx scripts/validate-reverse-discovery-phase8c.ts
npx tsx scripts/validate-settlement-options-phase7c.ts
npm run build
```

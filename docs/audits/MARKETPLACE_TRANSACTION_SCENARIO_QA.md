# Marketplace Transaction Scenario QA

**Date:** 2026-07-07  
**Method:** Static scenario trace + automated validators (no new features, no browser E2E in CI).  
**Validators run:** lint, build, smoke-check, all `validate-marketplace-*` scripts (1323+ checks), `validate-exchange-funnel-analytics` (13/13).

---

## 1. Executive summary

Post **Phase 5E-B** commerce alignment, the core transaction matrix is **coherent and server-gated**:

| Path | Status |
|------|--------|
| MONEY + HomeCheff / Stripe checkout | **Pass** (code + validators) |
| MONEY + contact / direct pay (`orderMethod: CONTACT`, `paymentPath: DIRECT_CONTACT`) | **Pass** — no Stripe; deal via chat + CommunityOrder |
| MONEY_AND_BARTER — dual checkout + proposal | **Pass** — both paths available on detail; server validates settlement |
| BARTER_ONLY — proposal-only, no cart | **Pass** — client + API blocks checkout |
| Proposal → CommunityOrder → deal checkout | **Pass** — `communityOrderId` flow + webhook `checkoutOrderId` |
| Chat → proposal → accept | **Pass** — deep links, sheet, accept routing |

**Remaining gaps are data/UX quality (P1), not money-safety blockers (P0):**

- Legacy listings with `barterOpenness = null` but `acceptedSpecializations` set behave as **MONEY** at runtime until edited/saved.
- **MONEY_AND_BARTER** mobile **sticky CTA** is checkout-only (detail has proposal); intentional 5E-B, friction P1.
- No automated **browser** Stripe or chat E2E in this QA run — manual smoke still required before high-traffic release.

---

## 2. Scenario matrix

| # | Listing profile | Tile price | Detail primary | Cart | `POST /api/checkout` | Proposal | CommunityOrder | Stripe |
|---|-----------------|------------|----------------|------|----------------------|----------|----------------|--------|
| 1 | MONEY + `HOMECHEFF_PAYMENT` + price | € fixed | Bestellen | ✅ | ✅ | ❌ detail CTA* | N/A unless chat | ✅ |
| 2 | MONEY + `CONTACT` (cash/afspraak) | € · via contact | Contact | ❌ | ❌ `CONTACT_ONLY` | ✅ chat | ✅ `DIRECT_CONTACT` | ❌ |
| 3 | MONEY_AND_BARTER + price + accepted | € + ruil | Bestellen + Voorstel | ✅ | ✅ | ✅ | ✅ both legs | If money + `HOMECHEFF_CHECKOUT` |
| 4 | BARTER_ONLY + accepted | Ruil | Voorstel doen | ❌ | ❌ `BARTER_ONLY` | ✅ | ✅ no money leg | ❌ |
| 5a | BARTER_ONLY, no accepted | — | — | — | — | — | — | Form blocks publish |
| 5b | MONEY + VALUE proposal | — | — | — | — | ❌ server | — | — |
| 5c | BARTER_ONLY + MONEY proposal | — | — | — | — | ❌ server | — | — |
| 5d | `barterOpenness` null + accepted | € (MONEY line) | MONEY CTAs | ✅ | ✅ | ❌ detail† | Chat possible | If HOMECHEFF |

\* Chat still exposes “Voorstel maken”; server rejects barter settlement on MONEY listings.  
† Accepted badges may show; matching ignores accepted until openness saved.

---

## 3. MONEY flow (Scenario 1)

**Fields:** `barterOpenness: MONEY` (or null → normalized MONEY), `orderMethod: HOMECHEFF_PAYMENT`, `priceCents > 0`, seller Stripe ready.

| Step | Expected | Code evidence | QA |
|------|----------|---------------|-----|
| Tile price | Normal € / price model | `buildTilePriceLine` → `getMarketplacePriceDisplay` | ✅ |
| Detail “Betaling & ruil” | Money payment registry | `resolvePaymentMethod` → `MONEY` | ✅ |
| Detail CTA | Bestellen only | `resolveProductCommerceActions` → `showProposalCta: false` | ✅ validator |
| No barter copy | Secondary contact uses `commercePathContact` | `ProductSaleSecondaryContact` | ✅ validator 5E-D |
| Add to cart | Works | `AddToCartButton`, `useCart` | ✅ |
| Checkout page | Cart flow | `app/checkout/page.tsx` | ✅ |
| Checkout API | Stripe session | `app/api/checkout/route.ts` | ✅ |
| Payment success | Session poll + funnel event | `app/payment/success/page.tsx` | ✅ wired |
| Order created | Stripe webhook | `app/api/stripe/webhook/route.ts` | ✅ |

**Manual only:** live Stripe test card, stock decrement, email receipts.

---

## 4. CASH / direct payment flow (Scenario 2)

There is **no separate `CASH` enum**. Off-platform payment is modeled as:

| Concept | Field / token | Role |
|---------|---------------|------|
| Listing is contact-first | `orderMethod: 'CONTACT'` | `isContactOnlyProduct()` → true |
| Buyer must contact maker | `isContactOnlyProduct` | Primary actions = `MakerContactSection`, no cart |
| Checkout blocked | `CONTACT_ONLY_NOT_CHECKOUT` | `app/api/checkout/route.ts` |
| Proposal payment off-platform | `paymentPath: 'DIRECT_CONTACT'` | `defaultPaymentPath()` when no Stripe |
| Direct contact flag | `acceptDirectContact` or `orderMethod === 'CONTACT'` | `proposal-product-binding.ts` |
| Deal after accept | `CommunityOrder` OPEN | No `checkoutUrl` when no money leg or not `HOMECHEFF_CHECKOUT` |
| Buyer UX | `deal.status.discussPayment` | `deal-ux-state.ts` — “bespreek betaling” |

**Answers:**

| Question | Answer |
|----------|--------|
| Bestelling, contact-only, or CommunityOrder? | **Contact-only for cart/Stripe.** A **CommunityOrder** still forms if parties use **proposal → accept** in chat. |
| Clear payment is outside HomeCheff? | **Yes** — tile suffix `productOrder.badgeViaContact`, deal copy `deal.paymentPath.direct`, no Stripe CTA. |
| Stripe started? | **No** for `CONTACT` listings in cart; **No** on accept when `paymentPath !== HOMECHEFF_CHECKOUT`. |
| Clear agreement/deal? | **Yes** — `CommunityOrder` + `DealCard` in chat with status labels. |
| Status updates logical? | **Yes** — proposal status, CO OPEN/COMPLETED, delivery request when applicable. |

**Not the same as:** `settlementMode: MONEY` + `HOMECHEFF_CHECKOUT` on a HOMECHEFF listing — that **does** use Stripe.

---

## 5. MONEY_AND_BARTER flow (Scenario 3)

**Fields:** `barterOpenness: MONEY_AND_BARTER`, `priceCents > 0`, `acceptedSpecializations.length > 0`.

| Surface | Expected | QA |
|---------|----------|-----|
| Tile | `marketplace.tile.price.moneyAndBarter` | ✅ `buildTilePriceLine` |
| Detail commerce | Checkout + secondary proposal expand | ✅ `ProductSalePrimaryActions` |
| Checkout (money) | Cart + API allowed | ✅ validators |
| Proposal | All settlement modes in UI; server allows `MONEY_AND_VALUE` | ✅ `allowedSettlementModesForBarterOpenness` |
| CommunityOrder | Preserves `settlementMode` in `proposalSummary` | ✅ `proposal-service.ts` |
| Mobile sticky | **Checkout only** (add / go to checkout) | ⚠️ P1 — proposal via scroll to commerce zone or suggestions |

**Illogical flows prevented:**

- VALUE-only proposal on pure MONEY listing → server reject.
- Cart on BARTER_ONLY → blocked (not this scenario).

---

## 6. BARTER_ONLY flow (Scenario 4)

| Step | Expected | QA |
|------|----------|-----|
| Tile | `marketplace.tile.price.barterOnly` | ✅ |
| Detail | No Bestellen; Voorstel doen primary | ✅ CTA matrix |
| Mobile sticky | `StartChatButton` + `openProposalAfterStart` | ✅ validator 5E-E |
| Add to cart | Client error `checkout.errors.barterOnly` | ✅ |
| Checkout API | `BARTER_ONLY_NOT_CHECKOUT` | ✅ |
| Proposal | `VALUE_ONLY`, `FREE`, `VOLUNTARY` | ✅ |
| Accept | CommunityOrder, no Stripe URL | ✅ `resolveAcceptNextAction` |
| Form | `barterOpennessRequiresAcceptedValues('BARTER_ONLY')` | ✅ `MarketplaceOfferForm` |

---

## 7. Checkout gates

| Gate | Layer | Mechanism |
|------|-------|-----------|
| BARTER_ONLY | Client cart | `blocksHomecheffCartCheckout()` |
| BARTER_ONLY | Server | `blocksHomecheffCartCheckout(p.barterOpenness)` |
| CONTACT_ONLY | Server | `isContactOnlyProduct()` |
| Stripe not ready | Client detail | `requiresStripeForHomecheffCheckout` + warning |
| Stripe not ready | Server | `PAYMENTS_NOT_READY` |
| Deal checkout | Server | `validateCommunityOrderCheckoutItems` — buyer, OPEN, ACCEPTED, money leg, `HOMECHEFF_CHECKOUT`, price match |
| Deal metadata | Stripe webhook | `metadata.communityOrderId` → `checkoutOrderId` |

---

## 8. Proposal validation

| Check | Location |
|-------|----------|
| Settlement vs listing barter | `validateSettlementAgainstBarterOpenness` in `proposal-service.ts` |
| UI settlement filter | `CreateProposalSheet` + `allowedSettlementModesForBarterOpenness` |
| Payment path vs product | `validatePaymentPath` in `proposal-product-binding.ts` |
| Money amount / value terms | `validateProposalSettlement` |
| Stock on accept | `validateProposalQuantityAgainstStock` |

**Contradiction handling (Scenario 5):**

| Case | Result |
|------|--------|
| BARTER_ONLY, no accepted values | Publish blocked in form |
| MONEY listing + VALUE proposal | `proposal.errors.barterNotAllowedOnMoneyListing` |
| BARTER_ONLY + MONEY proposal | `proposal.errors.moneyNotAllowedOnBarterListing` |
| MONEY_AND_BARTER, checkout only | Valid |
| MONEY_AND_BARTER, proposal only | Valid |
| `barterOpenness` null | Runtime **MONEY** (`normalizeBarterOpenness`); edit prefill **MONEY_AND_BARTER** if accepted (`resolveBarterOpennessForFormPrefill`) |
| null + accepted (unsaved legacy) | Tile may show € + badges; matching **ignores** accepted (`buildBarterAcceptanceModel` returns null for MONEY) — **P1 data debt** |

---

## 9. CommunityOrder behavior

```
Proposal PENDING
  → accept (counterparty)
  → CommunityOrder OPEN + system message
  → resolveAcceptNextAction:
       money + HOMECHEFF_CHECKOUT → checkoutUrl ?communityOrderId&productId&quantity
       DIRECT_CONTACT / VALUE_ONLY / no money → COMMUNITY_ORDER_CREATED only
  → DealCard + deal-ux-state in chat
  → Stripe success → webhook sets checkoutOrderId
```

| Settlement | paymentPath | Checkout |
|------------|-------------|----------|
| MONEY | HOMECHEFF_CHECKOUT | Required |
| MONEY_AND_VALUE | HOMECHEFF_CHECKOUT | Required (money leg) |
| MONEY | DIRECT_CONTACT | Discuss in chat |
| VALUE_ONLY | NONE | No Stripe |
| BARTER_ONLY accept | NONE / DIRECT | No Stripe |

---

## 10. Oude listing fallback

| DB state | Runtime openness | Tile | Detail CTAs | Matching |
|----------|------------------|------|-------------|----------|
| `null`, no accepted | MONEY | € | Checkout only | No acceptance model |
| `null`, with accepted | MONEY (until save) | € + badges possible | Checkout only | **Accepted ignored** |
| Edit form prefill | MONEY_AND_BARTER suggested | — | — | After save: matching works |

**Recommendation (P1):** one-time backfill or prompt sellers with `acceptedSpecializations.length > 0` and `barterOpenness IS NULL` to confirm openness on edit.

---

## 11. Feed / tile / detail consistentie (Scenario 6)

| `barterOpenness` | Tile line | Detail payment block | Primary CTA | Sticky mobile |
|------------------|-----------|----------------------|-------------|---------------|
| MONEY | € | Money | Bestellen | Checkout |
| MONEY_AND_BARTER | € + ruil | Money & barter | Both | Checkout only† |
| BARTER_ONLY | Ruil | Barter | Voorstel | Proposal deep-link |
| CONTACT + MONEY | € · contact | Money + contact badge | Contact | Contact / scroll |

† Sticky asymmetry — detail has proposal; sticky does not (documented 5E-F).

**No contradictions found in code for explicit openness values.**  
**Exception:** legacy `null` + accepted (see §10).

---

## 12. Chat / proposal / order (Scenario 7)

| Flow | Component | QA |
|------|-----------|-----|
| Listing → chat | `StartChatButton`, `MakerContactSection` | ✅ |
| Listing → proposal open | `openProposalAfterStart`, `buildMessagesWithProposalOpenUrl` | ✅ validator |
| Suggestion → chat + product | `ExchangeSuggestionCard` `productId={counterpartyListingId}` | ✅ validator |
| Proposal submit | `CreateProposalSheet` → API | ✅ |
| Proposal accept | `ProposalCard` → `communityOrderCreated` analytics | ✅ |
| Money leg checkout | `checkout?page` + `dealCommunityOrderId` | ✅ |
| Barter-only accept | No checkout URL | ✅ |
| Status in chat | `ProposalCard`, `DealCard`, system messages | ✅ |

---

## 13. P0 blockers

**None identified in code review** for:

- Paying via Stripe on `BARTER_ONLY` listings (blocked).
- Accepting money settlement on `BARTER_ONLY` via API (blocked).
- Cart checkout on `CONTACT` listings (blocked).
- Deal checkout without validated CommunityOrder (blocked).

---

## 14. P1 verbeteringen

| ID | Issue | Impact |
|----|-------|--------|
| P1-1 | Legacy `barterOpenness null` + accepted values | Display/matching mismatch until edit |
| P1-2 | MONEY_AND_BARTER mobile sticky = checkout only | Proposal discovery friction (measure via 5E-G analytics) |
| P1-3 | No CI browser E2E for Stripe / chat accept | Regression risk on integration |
| P1-4 | `DIRECT_CONTACT` deals rely on off-platform payment discipline | Trust/reputation, not code bug |
| P1-5 | Counter-proposal barter taxonomy editing limited | Negotiation polish |

---

## 15. Wat nu veilig live kan

- **MONEY + HomeCheff checkout** listings with Stripe-ready sellers.
- **BARTER_ONLY** and **MONEY_AND_BARTER** gates (cart, API, proposal settlement).
- **Proposal → CommunityOrder → deal checkout** with webhook linking.
- **Contact-only** listings without accidental Stripe.
- **Tile/detail CTA matrix** for listings with **explicit** `barterOpenness`.

---

## 16. Wat nog niet live mag zonder fix / manual QA

| Item | Why |
|------|-----|
| High-volume launch without manual Stripe smoke | Webhook + session path not browser-tested here |
| Assuming legacy null+accepted listings are “ruil” | Runtime treats as MONEY until seller saves |
| Relying on sticky alone for MONEY_AND_BARTER proposals | Sticky does not open proposal (by design) — detail/suggestions required |

---

## 17. Validatie (uitgevoerd)

```text
npm run lint                          ✅
npm run build                         ✅
npm run smoke-check                   ✅
validate-marketplace-barter-openness-wiring     18/18
validate-marketplace-detail-system             182/182
validate-marketplace-exchange-commerce-alignment 17/17
validate-marketplace-exchange-proposal-conversion 30/30
validate-marketplace-preview-ux                 38/38
validate-marketplace-previews                  104/104
validate-marketplace-taxonomy-consolidation    845/845
validate-marketplace-taxonomy                  pass
validate-marketplace-tile-system                90/90
validate-marketplace-tiles                      96/96
validate-exchange-funnel-analytics              13/13
```

**Geen nieuwe validator toegevoegd** — Scenario 1–7 matrix is afgedekt door `validate-marketplace-exchange-commerce-alignment.ts`, `validate-marketplace-barter-openness-wiring.ts`, en `validate-marketplace-exchange-proposal-conversion.ts`.

---

## 18. Manual test checklist (aanbevolen)

- [ ] Scenario 1: create MONEY listing → purchase with Stripe test card → payment success
- [ ] Scenario 2: CONTACT listing → confirm no checkout button → chat proposal accept → deal shows direct payment
- [ ] Scenario 3: MONEY_AND_BARTER → cart checkout + separate proposal with `MONEY_AND_VALUE`
- [ ] Scenario 4: BARTER_ONLY → sticky proposal on mobile → accept → no Stripe
- [ ] Scenario 7: suggestion card → chat → accept with money → deal checkout completes

---

## References

- `lib/marketplace/commerce/barter-commerce-alignment.ts` — CTA matrix, checkout blocks, settlement validation
- `lib/product/order-method.ts` — `CONTACT` vs `HOMECHEFF_PAYMENT`
- `lib/proposals/proposal-accept-routing.ts` — accept → checkout URL
- `lib/marketplace/commerce/community-order-checkout.ts` — deal checkout validation
- `docs/audits/MARKETPLACE_EXCHANGE_COMMERCE_ALIGNMENT_AUDIT.md` — Phase 5E-B implementation record

# Marketplace Exchange Commerce Alignment Audit — Phase 5E-B

**Date:** 2026-07-07  
**Scope:** Align commerce (cart, checkout, detail CTAs) with existing exchange/barter foundation. No new enums, models, or redesigns.

---

## 1. Gevonden problemen (vóór 5E-B)

| # | Probleem | Impact |
|---|----------|--------|
| P1 | `BARTER_ONLY` listings toonden “Bestellen” / add-to-cart op detail | Split-brain vs `ProductValueExchangeSection` (“Alleen ruil”) |
| P2 | Geen server-side checkout gate voor `BARTER_ONLY` | Barter-only producten konden via `/api/checkout` → Stripe |
| P3 | Proposal settlement niet gevalideerd tegen `barterOpenness` | Geld-only voorstellen op ruil-only listings (en omgekeerd) |
| P4 | `/checkout?productId&communityOrderId` genegeerd | Proposal → CommunityOrder → checkout ketting gebroken |
| P5 | `CommunityOrder.checkoutOrderId` nooit gezet na Stripe | Deal bleef “unpaid” in chat/trust flows |
| P6 | `CreateProposalSheet` toonde alle settlement modes | UX inconsistent met listing intent |
| P7 | Hardcoded NL stock badges in commerce zone | i18n gap |

---

## 2. Opgeloste problemen

| # | Fix | Locatie |
|---|-----|---------|
| P1 | CTA matrix via `resolveProductCommerceActions` | `ProductSalePrimaryActions`, `ProductSaleStickyCta`, `ProductSaleCommerceZone` |
| P2 | `blocksHomecheffCartCheckout` in cart hook, AddToCartButton, checkout API | `lib/marketplace/commerce/barter-commerce-alignment.ts`, `app/api/checkout/route.ts` |
| P3 | `validateSettlementAgainstBarterOpenness` in `resolveProposalFields` | `lib/proposals/proposal-service.ts` |
| P4 | Deal checkout hydration + POST `communityOrderId` | `app/checkout/page.tsx`, `lib/marketplace/commerce/community-order-checkout.ts`, `app/api/community-orders/[id]/checkout-context/route.ts` |
| P5 | Webhook schrijft `checkoutOrderId` uit Stripe metadata | `app/api/stripe/webhook/route.ts` |
| P6 | UI filtert settlement modes per listing | `CreateProposalSheet.tsx` |
| P7 | Stock badges via `productOrder.stock*` i18n keys | `ProductSaleCommerceZone.tsx`, `public/i18n/*.json` |

---

## 3. CTA-uitlijning

Central helper: `lib/marketplace/commerce/barter-commerce-alignment.ts`

| `barterOpenness` | Bestellen / cart | Voorstel doen |
|------------------|------------------|---------------|
| `MONEY` | ✅ | ❌ |
| `MONEY_AND_BARTER` | ✅ | ✅ |
| `BARTER_ONLY` | ❌ | ✅ (primair) |

`ProductValueExchangeSection` en commerce zone gebruiken dezelfde listing `barterOpenness`. Geen gelijktijdige “Alleen ruil” + “Bestellen”.

---

## 4. Checkout-gates

| Laag | Gedrag |
|------|--------|
| Client — `AddToCartButton` / `useCart` | Weigert `BARTER_ONLY`, toont `checkout.errors.barterOnly` |
| Server — `POST /api/checkout` | Blokkeert `BARTER_ONLY` (parallel aan `CONTACT_ONLY`) |
| Deal checkout | Alleen via geaccepteerd proposal met `HOMECHEFF_CHECKOUT` payment path |

---

## 5. Proposal-validatie

| Listing | Toegestaan | Geblokkeerd |
|---------|------------|-------------|
| `MONEY` | MONEY, FREE, VOLUNTARY | VALUE_ONLY, MONEY_AND_VALUE |
| `BARTER_ONLY` | VALUE_ONLY, FREE, VOLUNTARY | MONEY, MONEY_AND_VALUE |
| `MONEY_AND_BARTER` | Alle bestaande modes | — |

Server: `validateSettlementAgainstBarterOpenness` in `proposal-service.ts`.  
UI: `allowedSettlementModesForBarterOpenness` in `CreateProposalSheet`.

---

## 6. CommunityOrder-fix

**Flow (hersteld):**

```
Proposal accept
  → CommunityOrder (OPEN)
  → checkoutUrl: /checkout?productId&quantity&communityOrderId
  → GET /api/community-orders/:id/checkout-context
  → POST /api/checkout { items, communityOrderId }
  → Stripe metadata.communityOrderId
  → webhook: CommunityOrder.checkoutOrderId = Order.id
```

Validaties: buyer-only, OPEN status, accepted proposal, money leg, `HOMECHEFF_CHECKOUT`, item/price/qty match.

---

## 7. Settlement consistency

| Laag | Bron |
|------|------|
| Proposal create | `settlementMode` + barter validation |
| Proposal accept | `Agreement.agreementSummary` snapshot |
| CommunityOrder checkout | Proposal `settlementMode` + `proposalSummary.paymentPath` |
| Stripe Order | Money leg only when routing says `CHECKOUT_REQUIRED` |

Barter-only deals: geen checkout routing; settlement blijft VALUE_ONLY / FREE / VOLUNTARY.  
Stock bij `HOMECHEFF_CHECKOUT`: decrement in webhook (niet bij accept) — ongewijzigd bestaand gedrag.

---

## 8. Chat ↔ Proposal ↔ Order

- **CommunityOrder ontstaat altijd** bij accept (ongewijzigd).
- **Settlement modes** blijven op Proposal + Agreement snapshot.
- **Barter intent** gaat niet verloren: VALUE_ONLY / MONEY_AND_VALUE taxonomy ids in proposal + agreement.
- **Checkout** koppelt alleen money-leg deals met `HOMECHEFF_CHECKOUT`.

---

## 9. Restrerende risico's

| Risico | Ernst | Notitie |
|--------|-------|---------|
| Direct API bypass zonder session | Laag | Auth + server gates aanwezig |
| Oude cart items zonder `barterOpenness` | Laag | Server check op product DB-waarde |
| Deal checkout zonder fulfillment match | Laag | Bestaand checkout delivery validation blijft gelden |
| Counter-proposals | Laag | Zelfde `resolveProposalFields` validatie |

---

## 10. Validatie

```bash
npm run lint
npm run build
npx tsx scripts/validate-marketplace-exchange-commerce-alignment.ts
npx tsx scripts/validate-marketplace-barter-openness-wiring.ts
# (+ overige marketplace validators uit 5E-B opdracht)
```

---

## 11. Niet gebouwd (bewust)

- Geen nieuwe enums / order- / proposal- / barter-modellen
- Geen checkout redesign
- Geen matching- of chat-redesign
- Geen wijzigingen aan exchange suggestions (4F/4G)

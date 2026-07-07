# Marketplace Post-Transaction, Revenue & Subscription Audit (Phase 5F-A)

**Date:** 2026-07-07  
**Scope:** Audit only — no feature code changes.  
**Method:** Static code trace across order lifecycle, dashboards, delivery, analytics, fees, affiliate, subscriptions.

**Related:** [MARKETPLACE_TRANSACTION_SCENARIO_QA.md](./MARKETPLACE_TRANSACTION_SCENARIO_QA.md), [MARKETPLACE_EXCHANGE_COMMERCE_ALIGNMENT_AUDIT.md](./MARKETPLACE_EXCHANGE_COMMERCE_ALIGNMENT_AUDIT.md)

---

## 1. Executive summary

HomeCheff runs **two parallel post-transaction models**:

| Model | Created by | Revenue / fees | Primary UI |
|-------|------------|----------------|------------|
| **`Order`** | Stripe `checkout.session.completed` webhook | Platform fee, Connect payout, affiliate commission | `/orders`, `/verkoper/orders`, seller dashboard |
| **`CommunityOrder`** | Proposal accept | Off-platform or pre-checkout deal state | `/profile/deals`, chat `DealCard` |

**What works end-to-end today**

- MONEY + Stripe checkout (direct cart or deal `communityOrderId`) → `Order` + webhook fee + affiliate on platform fee.
- Business subscriptions → Stripe → `SellerProfile.subscriptionId` → reduced `feeBps` in webhook.
- Affiliate attribution at signup → commission on paid orders and subscription invoices.
- Exchange funnel analytics (Phase 5E-G) for discovery → checkout.

**Structural gaps**

- Cash/direct and barter deals **never create `Order`** — invisible to seller dashboard stats and buyer `/orders`.
- **Dual records** for Stripe deals (`Order` + `CommunityOrder`) with manual completion on each side.
- **Community courier** (`DeliveryRequest`) has APIs but **no bezorger dashboard UI** (Stripe `DeliveryOrder` only).
- **Analytics:** exchange funnel yes; standard GA4 `purchase` no; affiliate/subscription not in GA4.
- **Affiliate payout crons** not scheduled in `vercel.json`.
- **Subscription tier limits** (listings, users, €2k cap) documented in `lib/pricing.ts` but **not enforced** in code.

**No P0 money-safety blockers** found for Stripe path (fees, webhook, barter checkout gates). **P0 operational gaps** exist where launched features promise visibility (deals, community delivery) that dashboards do not surface.

---

## 2. Order data lifecycle

### Architecture

```
Listing
  ├─ Cart checkout (no proposal)     → Stripe → Order only
  └─ Chat → Proposal → Accept
         → Agreement + CommunityOrder (always)
         ├─ paymentPath HOMECHEFF_CHECKOUT → Stripe → Order + CommunityOrder.checkoutOrderId
         ├─ paymentPath DIRECT_CONTACT   → CommunityOrder only (cash/off-platform)
         └─ settlement VALUE_ONLY etc.   → CommunityOrder only (barter)
```

**Link:** `CommunityOrder.checkoutOrderId` → `Order.id` (one-way). `Order` has no `communityOrderId` field; link is via webhook metadata + FK on community side.

### Per-path: what gets created

| Path | Order | CommunityOrder | Agreement | Stripe | Stock decrement |
|------|-------|----------------|-----------|--------|-----------------|
| 1. MONEY + Stripe (cart) | ✅ webhook | ❌ | ❌ | ✅ | webhook |
| 2. MONEY + direct/contact | ❌ | ✅ if via proposal | ✅ | ❌ | on accept |
| 3. MONEY_AND_BARTER + checkout | ✅ | ✅ linked | ✅ | ✅ money leg | webhook (deal) / accept rules |
| 4. MONEY_AND_BARTER + proposal only | ❌* | ✅ | ✅ | ❌* | on accept |
| 5. BARTER_ONLY + proposal | ❌ | ✅ | ✅ | ❌ | on accept |

\*Unless later upgraded to `HOMECHEFF_CHECKOUT` and buyer completes deal checkout.

### Field retention matrix

| Field | Order | CommunityOrder / Agreement | Notes |
|-------|-------|----------------------------|-------|
| `listingId` / `productId` | `OrderItem.productId` | `Proposal.productId` + `agreementSummary.productId` | Not on Order root |
| `sellerId` | via product → seller | `CommunityOrder.sellerId` | |
| `buyerId` | `Order.userId` | `CommunityOrder.buyerId` | |
| `price` | `OrderItem.priceCents`, `Order.totalAmount` | `Proposal.amountCents` in summary | Deal may differ from listing price |
| `quantity` | `OrderItem.quantity` | `Proposal.quantity` | |
| `orderMethod` | ❌ not on Order | ❌ not on CO; on **Product** at proposal time | CONTACT blocks cart |
| `paymentMethod` | implicit Stripe | `agreementSummary.paymentPath` | `HOMECHEFF_CHECKOUT` / `DIRECT_CONTACT` / `NONE` |
| `settlementMode` | ❌ | `agreementSummary.settlementMode` | MONEY, MONEY_AND_VALUE, VALUE_ONLY, … |
| `barterOpenness` | ❌ | ❌ on CO; on **Product** + proposal validation | Gates checkout/proposal |
| `accepted values` | ❌ | `acceptedValueTaxonomyIds` in summary | |
| `delivery/pickup` | `Order.deliveryMode`, addresses | `fulfillmentMode`, `deliveryRequested` | |
| `affiliate/referrer` | via buyer `Attribution` at payout | same (user-level, not order field) | Signup attribution, not checkout |
| `subscription tier` | affects fee via seller profile at payout | ❌ | `SellerProfile.subscriptionId` → `feeBps` |
| `platform fee` | `Transaction.platformFeeBps` | ❌ | Webhook payout loop |
| `Stripe payment id` | `Order.stripeSessionId` | ❌ | |
| `CommunityOrder id` | ❌ | `CommunityOrder.id` | In Stripe metadata for deals |
| `conversation id` | separate `order_{id}` convo | `CommunityOrder.conversationId` | **Two conversations** for Stripe deals |

**Key files:** `app/api/stripe/webhook/route.ts`, `app/api/checkout/route.ts`, `lib/proposals/proposal-service.ts`, `lib/marketplace/commerce/community-order-checkout.ts`, `prisma/schema.prisma` (`Order`, `CommunityOrder`, `Agreement`).

---

## 3. Dashboard visibility

### Seller (`/verkoper/dashboard`, `/verkoper/orders`)

| Data | Visible? | Source |
|------|----------|--------|
| Stripe-paid `Order` | ✅ | `/api/seller/dashboard/*` — requires `stripeSessionId` |
| Revenue / stats | ✅ Stripe only | Same filter |
| Local self-delivery orders | ✅ | `/api/delivery/dashboard` (seller mode) |
| `CommunityOrder` (cash/barter) | ❌ | No `communityOrder` queries under `verkoper/` |
| Open deals awaiting payment | ❌ | |

### Buyer (`/orders`, `/orders/[id]`)

| Data | Visible? |
|------|----------|
| `Order` (incl. unpaid PENDING) | ✅ `/api/orders` |
| Stripe deal checkout | ✅ appears as `Order` |
| Cash/barter deals | ❌ | No `Order` record |

### Community deals (`/profile/deals`, chat)

| Data | Visible? |
|------|----------|
| All `CommunityOrder` (buyer/seller) | ✅ `/api/profile/deals` |
| Deal UX (pay, mark complete, delivery) | ✅ `DealCard` + `resolveDealUxState` |
| Stripe + deal | ✅ both `/orders` **and** `/profile/deals` (no cross-link) |

### Answers

| Question | Answer |
|----------|--------|
| Komt iedere order/deal zichtbaar binnen? | **Nee** — split: Stripe → orders/dashboard; deals → profile/deals + chat |
| Verkoper ziet wat te doen? | **Stripe orders ja**; cash/barter deals **alleen via chat/profile** |
| Koper ziet status/volgende stap? | **Stripe:** order tracking; **deals:** DealCard CTAs |
| Cash/direct zichtbaar? | **Alleen** `/profile/deals` + chat |
| Barter-only zichtbaar? | **Alleen** `/profile/deals` + chat |
| Stripe-orders zichtbaar? | ✅ seller + buyer dashboards |
| Ontbrekende statussen? | No “paid” for `DIRECT_CONTACT`; `CommunityOrder` stays OPEN until manual complete |

**Minor bug:** `verkoper/orders?period=all` still applies ~30-day server window (`period=all` not fully honored).

**Dead code:** `CommunityOrderSummaryCard.tsx` unused.

---

## 4. Delivery dashboard flow

### Two delivery systems

| System | Model | Trigger | Dashboard |
|--------|-------|---------|-----------|
| **Commerce delivery** | `DeliveryOrder` → Stripe `Order` | Teen/local/shipping checkout | `/delivery/dashboard` (ambassador + seller tabs) |
| **Community delivery** | `DeliveryRequest` + `CourierAssignment` | Deal accept + delivery requested | **No courier UI** — APIs only |

### What appears in bezorgdashboard?

| Order type | Teen courier pool | Seller self-delivery |
|------------|-------------------|----------------------|
| Stripe checkout TEEN_DELIVERY | ✅ | — |
| Stripe LOCAL_DELIVERY (seller) | — | ✅ |
| Cash/barter `CommunityOrder` | ❌ | ❌ |
| `DeliveryRequest` (community) | ❌ **no UI** | N/A |

### Delivery fee

- Stripe path: `deliveryFeeCents` in checkout metadata; platform 12% on delivery (`lib/fees.ts`, webhook).
- Community `DeliveryRequest`: separate marketplace v1 flow; not merged into ambassador dashboard.

### When delivery applies

- Product `delivery` / proposal `fulfillmentType` = DELIVERY.
- Barter/cash deals can request community delivery → creates `DeliveryRequest` but courier cannot accept via current dashboard.

**Doc:** `lib/delivery/DELIVERY_MARKETPLACE_V1.md` — checkout `DeliveryOrder` remains Stripe-only.

---

## 5. Analytics coverage

### Instrumented (production)

| Layer | Events / data | Paths |
|-------|---------------|-------|
| GA4 page views | auto | `GoogleAnalytics.tsx` |
| Exchange funnel | 10 `exchange_funnel_*` | detail → checkout → payment success; proposals |
| Exchange suggestions | impression + CTA | `exchange-suggestion-analytics.ts` |
| Tile tracking | `tile_view`, `tile_click` | `useTileTracking.ts` |
| Onboarding | internal DB | `/api/onboarding/analytics` |
| Seller analytics | DB aggregates | `/verkoper/analytics`, `AnalyticsEvent` VIEW |
| Admin | unified API | `/api/admin/analytics/unified` |
| Affiliate | internal ledger | `/api/affiliate/dashboard` |

### Not instrumented / gaps

| Question | Answer |
|----------|--------|
| Alle stappen gemeten? | **Nee** — post-deal completion, cash pay, barter value exchange not in GA4 |
| Stripe orders gemeten? | **Partial** — `checkout_completed` on success page; **no** standard `purchase` event |
| Cash/direct deals? | **Nee** in GA4 |
| Barter proposals? | **Ja** — exchange funnel + proposal events |
| Order completion? | **Server** order complete API; **no** GA4 |
| Affiliate/referrer in events? | **Nee** in GA4 |
| Subscription tier in events? | **Nee** |
| Conversie per listingtype | **Possible** via funnel `barter_openness` filter — not revenue |
| Omzet per bedrijf | **Seller dashboard DB** — Stripe orders only |
| Fee-opbrengst | **Admin/transaction tables** — not GA4 |
| Affiliate payout | **CommissionLedger** — not GA4 |
| Delivery volume | **Partial** — delivery APIs, no unified analytics export |
| Barter engagement | **Exchange funnel** — yes |

**Unused:** `lib/analytics-events.ts` (typed stubs, not imported).

---

## 6. Fee / commissie flow

### Current logic

| Step | Behavior |
|------|----------|
| Default platform fee | **12%** (`lib/fees.ts`) |
| Business subscription | `Subscription.feeBps`: Basic **700** (7%), Pro **400** (4%), Premium **200** (2%) |
| Authoritative calculation | **`app/api/stripe/webhook/route.ts`** on payout — reads `SellerProfile.Subscription.feeBps` |
| Stripe Connect | Transfer to seller **after** platform fee deduction — **not** `application_fee` at session create |
| Delivery platform cut | 12% on delivery fees |
| Buyer Stripe fee | Gross-up in checkout (`calculateStripeFeeForBuyer`) |
| Persisted | `Transaction.platformFeeBps`, metadata on transfer |

### Per account type

| Type | Fee |
|------|-----|
| Particulier (no subscription) | 12% |
| Basic / Pro / Premium business | 7% / 4% / 2% via `feeBps` |

### Per transaction path

| Path | Platform fee? |
|------|----------------|
| MONEY + Stripe | ✅ webhook |
| MONEY + direct/contact | ❌ no `Order` → no fee |
| Barter-only | ❌ |
| MONEY_AND_BARTER + Stripe | ✅ on money leg only |
| MONEY_AND_BARTER + direct | ❌ |

### Gaps

| Gap | Severity |
|-----|----------|
| `/api/seller/fees` uses flat 12% — ignores subscription | P1 |
| `lib/pricing.ts` €2000 individual cap — **not enforced** | P1 |
| `createConnectPaymentIntent(applicationFeeAmount)` — **unused** | info |
| Refund → platform fee / affiliate reversal incomplete for **orders** | P1 |

**Safe adjustment point:** webhook payout loop + `Subscription.feeBps` (single source of truth for production fees).

---

## 7. Affiliate / referral flow

### Storage & attribution

| Event | Stored? | Mechanism |
|-------|---------|-----------|
| User signup | ✅ | `hc_ref` cookie → `Attribution` (`processAttributionOnSignup`) |
| Listing creation | ❌ | No listing-level affiliate |
| Checkout | ❌ | Attribution is **signup-based**, not re-tagged at checkout |
| Order paid | ✅ | `processCommissionForOrder` in webhook (25% of platform fee; 50% if both parties attributed) |
| Subscription | ✅ | `processCommissionForInvoice` — 50% of invoice; `BusinessSubscription` 12-month window |

### Commission base

- **Transactions:** % of **platform fee** (not GMV).
- **Subscriptions:** % of **invoice amount** (promo discounts reduce affiliate share via subscribe flow).

### Sub-affiliate

- ✅ `SubAffiliateInvite`, split 20%/5% (order) and 40%/10% (subscription) per `lib/affiliate-commission.ts`.

### Payout

- `CommissionLedger`: PENDING → AVAILABLE (14d) → PAID via Stripe Connect transfer.
- APIs: `/api/affiliate/payouts/process`, `update-status`.
- **Gap:** **not in `vercel.json` crons** — manual/external trigger required.

### Dashboard

- ✅ `/affiliate/dashboard` — pending/available/paid, ORDER_PAID vs INVOICE_PAID.

### Distinction

- **Ambassador** in product = **delivery courier** role, not affiliate program.

---

## 8. Subscription flow

### Plans in code (DB seed)

| Plan | Price | `feeBps` | Fee |
|------|-------|----------|-----|
| Basic | €39/mo | 700 | 7% |
| Pro | €99/mo | 400 | 4% |
| Premium | €199/mo | 200 | 2% |
| Particulier | €0 | default | 12% |

### Wired

- `POST /api/subscribe` → Stripe subscription.
- Webhook assigns `SellerProfile.subscriptionId`, `subscriptionValidUntil`.
- `feeBps` drives transaction fees in webhook.
- Promo codes on subscribe (affiliate-linked discounts).

### Not wired / broken

| Item | Status |
|------|--------|
| Listing limits per tier | ❌ not enforced on product create |
| `maxUsers` per business | ❌ marketing only |
| €2000 individual revenue cap | ❌ marketing only |
| `/app/pricing/page.tsx` calls `/api/user/revenue`, `/api/user/upgrade` | ❌ **routes missing** |
| Ranking boost by subscription | ❌ not in ranking engine |
| Visibility boosts | ❌ separate promo system, not tier-gated in code |

### Particulieren gratis

- **Consistent:** `INDIVIDUAL` tier €0, 12% fee only on Stripe sales.
- Business value prop today = **fee reduction** primarily; analytics mention in Pro/Premium copy but not tier-gated beyond existing seller analytics page.

---

## 9. Promo / subscription relationship

- **Affiliate promo codes** reduce subscription price at subscribe; discount taken from affiliate commission share.
- **`BusinessSubscription`** tracks affiliate revenue share on business signups (12-month window).
- **Home promotions** (`HomeRecommendedPromotions`, feed inserts) — separate from subscription tier; sponsored placements architecture exists but not subscription-bound.
- **No** automatic “subscribe → get feed boost” wiring in ranking or feed insert resolution.

---

## 10. Business model advies (geen prijswijziging)

### Huidige logica

Particulieren: gratis, 12% op Stripe-transacties.  
Bedrijven: abonnement **vooral** fee-korting (7% → 2%).

### Probleem na “particulier gratis”

Fee-korting is **zinvol voor high-volume zakelijke sellers**, maar:

- Particulieren betalen geen abonnement → geen upsell op volume.
- Lage GMV-sellers raakt fee-korting niet (abonnement > besparing).
- **Zichtbaarheid** en **promotie** zijn niet gekoppeld aan tiers in code — abonnement voelt als “belasting op groei” zonder tastbaar platformvoordeel.

### Aanbevolen verschuiving (strategie, geen implementatie)

| Van (oud) | Naar (nieuw hoofdvoordeel) | Fee-korting als |
|-----------|------------------------------|-----------------|
| Lagere fee = hoofdreden | **Bereik + tools** = hoofdreden | Secundair voordeel |

**Concrete pakketten (hergebruik bestaande systemen):**

1. **Zichtbaarheid** — koppel `Subscription` aan bestaande `ranking-engine` weights + `HomeRecommendedPromotions` / sponsored placement slots (docs already describe mobile inserts).
2. **Analytics** — tier-gate `/verkoper/analytics` depth (basis gratis, advanced Pro+).
3. **Profiel** — business badge via bestaand `isBusiness` / seller profile (already in commerce zone).
4. **Listing limits** — **enforce** `PRICING_TIERS` limits (currently documented only) — particulier soft cap, business unlimited.
5. **Promotie** — lokale campagnes via bestaande promo/insert infrastructure, not new models.
6. **Fee-korting** — behouden op Premium/Pro maar **niet** als hero op pricing page.

**Hergebruik absoluut:**

- `Subscription` + `feeBps` + Stripe webhook (fees).
- `CommissionLedger` + affiliate (acquisition).
- `CommunityOrder` + `DealCard` (non-Stripe deals).
- Exchange funnel analytics (conversion measurement).
- Feed insert / ranking engines (visibility products).

---

## 11. P0 blockers

| ID | Issue | Why P0 |
|----|-------|--------|
| P0-1 | **Community `DeliveryRequest` zonder courier UI** | Feature promises delivery; couriers cannot accept jobs |
| P0-2 | **Affiliate payout crons niet gepland** | Commissions accrue; AVAILABLE→PAID may never run in prod |
| P0-3 | **Seller dashboard blind voor alle non-Stripe deals** | Operational failure if barter/contact volume grows — sellers miss open deals |

**Not P0 (money safety OK):** Stripe fee calculation, barter checkout blocks, deal checkout validation, webhook `checkoutOrderId` link (fixed 5E-B).

---

## 12. P1 verbeteringen

| ID | Issue |
|----|-------|
| P1-1 | Unified seller “open deals” widget (CommunityOrder OPEN) on `/verkoper/dashboard` |
| P1-2 | Cross-link `Order` ↔ `CommunityOrder` in buyer/seller UI |
| P1-3 | `DIRECT_CONTACT` — mark-as-paid or complete flow (no perpetual `showPaymentRequired`) |
| P1-4 | GA4 `purchase` + deal completion events |
| P1-5 | `/api/seller/fees` respect `feeBps` |
| P1-6 | Order commission reversal on refund |
| P1-7 | Fix `/pricing` page missing APIs |
| P1-8 | Enforce or remove €2000 / listing limits in `lib/pricing.ts` |
| P1-9 | `verkoper/orders` `period=all` date filter |
| P1-10 | Sync `CommunityOrder` COMPLETED with `Order` DELIVERED (or single completion action) |

---

## 13. P2 polish

- Wire `CommunityOrderSummaryCard` or remove.
- `lib/analytics-events.ts` merge or delete.
- Standard GA4 e-commerce (`add_to_cart`, `view_item`).
- Affiliate funnel GA4 events.
- Counter-proposal value taxonomy editing.
- Deal review prompts timing.

---

## 14. Wat veilig live kan

- Stripe marketplace checkout (direct + deal `communityOrderId`).
- Platform fee + Connect payout with subscription `feeBps`.
- Affiliate commission accrual on orders/invoices (with manual payout ops until cron fixed).
- Business subscription purchase + fee discount.
- Community deals in chat + `/profile/deals`.
- Exchange funnel analytics for product decisions.
- Seller/buyer **Stripe** order dashboards.

---

## 15. Wat eerst gefixt moet worden

| Priority | Action |
|----------|--------|
| 1 | Schedule affiliate payout crons (`update-status`, `process`) |
| 2 | Seller visibility for OPEN `CommunityOrder` (minimal read-only list) |
| 3 | Community delivery courier surface OR disable delivery CTA until ready |
| 4 | Document ops runbook: cash/barter deals live in chat only |
| 5 | GA4 `purchase` on payment success (low effort, high reporting value) |

---

## Conclusie — expliciete antwoorden

| Vraag | Antwoord |
|-------|----------|
| **Komt elke bestelling/deal in het juiste dashboard?** | **Nee.** Stripe → `/orders` + verkoper; deals → `/profile/deals` + chat. **Split by design, incomplete for sellers.** |
| **Komt elke bezorgbare bestelling in bezorgdashboard?** | **Nee.** Alleen Stripe `DeliveryOrder`. Community `DeliveryRequest` **niet**. |
| **Worden alle analytics events correct afgevuurd?** | **Nee.** Exchange funnel ja; `purchase`, cash/barter completion, affiliate nee. |
| **Worden platformfees juist berekend?** | **Ja** in Stripe webhook met `feeBps`; **nee** in seller fee preview API. |
| **Worden affiliate/referral gegevens behouden?** | **Ja** at signup + ledger on pay; **payout automation gap**. |
| **Werken abonnementen nog?** | **Ja** Stripe + webhook + fee discount; **limits/boosts niet afgedwongen**. |
| **Is fee-korting nog logisch als hoofdvoordeel?** | **Beperkt** — particulier gratis maakt fee-korting alleen relevant voor zakelijke volume sellers; **zwakke value prop** zonder visibility tools. |
| **Moeten abonnementen richting zichtbaarheid/promotie?** | **Ja, strategisch aanbevolen** — hergebruik ranking, feed inserts, analytics gating; fee-korting secundair. |
| **Welke systemen absoluut hergebruiken?** | `Order`+webhook, `CommunityOrder`+`DealCard`, `Subscription.feeBps`, `CommissionLedger`, exchange funnel, ranking/inserts. |
| **Waar zitten echte P0’s?** | Courier UI for community delivery; affiliate payout scheduling; seller blind spot for non-Stripe deals. |

---

## Validatie (uitgevoerd)

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
validate-marketplace-tile-system                90/90
validate-marketplace-tiles                      96/96
validate-exchange-funnel-analytics              13/13
validate-hcp-economy                           116/116
```

### Ontbrekende validators (documented)

| Expected domain | Status |
|-----------------|--------|
| Order lifecycle E2E (`Order` ↔ `CommunityOrder` ↔ webhook) | **Partial** — `validate-marketplace-exchange-commerce-alignment.ts` (checkout + webhook link only) |
| Affiliate commission / payout | **None** |
| Subscription / `feeBps` wiring | **None** |
| Dashboard visibility per transaction type | **None** |
| Delivery `DeliveryRequest` vs `DeliveryOrder` | **None** |
| Post-transaction analytics completeness | **None** |

**Geen nieuwe validator toegevoegd** — gaps documented for Phase 5F-B planning.

---

## Key file index

| Area | Path |
|------|------|
| Order create | `app/api/stripe/webhook/route.ts` |
| Checkout | `app/api/checkout/route.ts` |
| Proposal accept | `lib/proposals/proposal-service.ts` |
| Deal UX | `lib/proposals/deal-ux-state.ts`, `components/chat/proposals/DealCard.tsx` |
| Community orders list | `lib/trust/community-order-service.ts`, `app/profile/deals` |
| Seller dashboard | `app/api/seller/dashboard/stats/route.ts` |
| Delivery dashboard | `app/api/delivery/dashboard/route.ts` |
| Fees | `lib/fees.ts`, webhook payout ~L1220+ |
| Affiliate | `lib/affiliate-commission.ts`, `lib/affiliate-attribution.ts` |
| Subscriptions | `app/api/subscribe/route.ts`, `prisma` `Subscription` |
| Pricing marketing | `lib/pricing.ts`, `app/pricing/page.tsx` |
| Exchange analytics | `lib/marketplace/exchange/exchange-funnel-analytics.ts` |

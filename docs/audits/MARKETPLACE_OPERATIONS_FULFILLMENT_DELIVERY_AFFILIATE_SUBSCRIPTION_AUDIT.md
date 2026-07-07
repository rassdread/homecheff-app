# Marketplace Operations, Fulfillment, Delivery, Affiliate & Subscription Audit (Phase 5F-B)

**Date:** 2026-07-07  
**Scope:** Audit only — no feature code, refactor, or migration.  
**Method:** Static code trace across listing → chat → proposal → order → payment → delivery → dashboard → analytics → affiliate → subscription. Explicit search for built-but-disconnected systems.

**Related:** [MARKETPLACE_TRANSACTION_SCENARIO_QA.md](./MARKETPLACE_TRANSACTION_SCENARIO_QA.md), [MARKETPLACE_POST_TRANSACTION_REVENUE_SUBSCRIPTION_AUDIT.md](./MARKETPLACE_POST_TRANSACTION_REVENUE_SUBSCRIPTION_AUDIT.md), [MARKETPLACE_EXCHANGE_FUNNEL_ANALYTICS_AUDIT.md](./MARKETPLACE_EXCHANGE_FUNNEL_ANALYTICS_AUDIT.md)

---

## 1. Executive summary

HomeCheff’s **discovery and transaction funnel** (taxonomy, exchange matching, proposals, checkout gates, exchange analytics) is largely coherent after Phase 5E. The **operational layer** behind that funnel is **not one system** — it is several stacks that only partially connect.

### Two parallel post-transaction models (unchanged from 5F-A)

| Model | Created by | Revenue | Primary UI |
|-------|------------|---------|------------|
| **`Order`** | Stripe `checkout.session.completed` | Platform fee, Connect payout, affiliate | `/orders`, `/verkoper/orders`, `/verkoper/dashboard` |
| **`CommunityOrder`** | Proposal accept | Off-platform / pre-checkout deal state | `/profile/deals`, chat `DealCard` |

### Two parallel delivery stacks (new emphasis in 5F-B)

| Stack | Models | Entry | Courier UI | Order types |
|-------|--------|-------|------------|-------------|
| **Teen / platform delivery (active)** | `DeliveryOrder`, `DeliveryProfile` | Checkout `teen_delivery` → Stripe webhook | `/delivery/dashboard` (`DeliveryDashboard.tsx`) | Stripe `Order` only |
| **Community courier (partial)** | `DeliveryRequest`, `CourierAssignment` | Deal accept auto-create or `DealCard` CTA | **None** — APIs only | `CommunityOrder` only |

### Headline findings

| Area | Status |
|------|--------|
| Stripe MONEY checkout → seller dashboard | **Works** |
| Cash/barter deals → seller dashboard | **Missing** — only `/profile/deals` + chat |
| Buyer unified transaction view | **Split** — `/orders` vs `/profile/deals` |
| Teen courier operations | **Works** for Stripe orders (first-accept model) |
| CommunityOrder delivery | **Request only** — assign/accept/complete APIs exist, no courier UI |
| Courier pre-select at checkout | **Built but unused** (`DelivererSelector.tsx`) |
| Roster / schedule for matching | **Partial** — shift-notification cron yes; `CourierScheduleService` orphan |
| Affiliate attribution + ledger | **Works** on signup + webhook |
| Affiliate payout automation | **APIs exist, crons not scheduled** |
| Subscription fee discount | **Enforced** in Stripe webhook (`feeBps`) |
| Subscription tier limits / boosts | **Marketing only** — `lib/pricing.ts` not enforced |
| Promotion / visibility boosts | **Contracts + HCP grants exist; ranking does not consume** |
| Exchange funnel analytics | **Wired** (Phase 5E-G) |
| Delivery / affiliate / subscription ops analytics | **Gaps** |

**Conclusion:** The marketplace **can transact**; the **operation** (seller, buyer, courier, affiliate payout, subscription perks, community fulfillment) does **not** function as one coherent system.

---

## 2. End-to-end operations map

Legend: **✅** active end-to-end · **⚠️** partial / split UI · **❌** not connected · **—** N/A for path

### 2.1 MONEY (`barterOpenness: MONEY`, `orderMethod: HOMECHEFF_PAYMENT`)

| Step | Component / page | Service / API | Model | Status |
|------|------------------|---------------|-------|--------|
| Listing | `Product` detail, tiles | `resolveProductCommerceActions` | `Product` | ✅ |
| Chat | `StartChatButton`, `ChatBox` | `/api/conversations/*` | `Conversation` | ✅ optional |
| Proposal | — (detail blocks proposal CTA) | Server rejects barter settlement | — | — |
| CommunityOrder | — | — | — | — |
| Order | Cart → `/checkout` | `POST /api/checkout` | `Order` (pending) | ✅ |
| Betaling | Stripe Checkout | `app/api/stripe/webhook/route.ts` | `Order.stripeSessionId` | ✅ |
| Bezorging | Checkout `teen_delivery` / pickup | Webhook → `DeliveryOrder` | `DeliveryOrder` | ✅ if teen delivery selected |
| Dashboard (seller) | `/verkoper/dashboard`, `/verkoper/orders` | `/api/seller/dashboard/*` | `Order` (Stripe only) | ✅ |
| Dashboard (buyer) | `/orders` | `/api/orders` | `Order` | ✅ |
| Analytics | GA4 `purchase` (`GoogleAnalytics.tsx`) | Exchange funnel N/A | — | ⚠️ standard purchase only |
| Affiliate | Signup cookie → webhook | `lib/affiliate-commission.ts` | `CommissionLedger` | ✅ |
| Subscription | Seller `Subscription.feeBps` | Webhook fee calc | `Subscription` | ✅ fee only |

### 2.2 MONEY_AND_BARTER

| Step | MONEY leg (checkout) | Value leg (proposal) | Status |
|------|---------------------|----------------------|--------|
| Listing | Detail: Bestellen + Voorstel | Same | ✅ |
| Proposal | Optional | `CreateProposalSheet` → accept | ✅ |
| CommunityOrder | Created on accept | `ProposalService` | ✅ |
| Order | Deal checkout `?communityOrderId=` | Linked via `checkoutOrderId` | ✅ |
| Betaling | Stripe when `HOMECHEFF_CHECKOUT` | Cash path: `DIRECT_CONTACT` | ⚠️ split |
| Bezorging | Teen delivery on Stripe `Order` | `DeliveryRequest` on CO if `deliveryRequested` | ⚠️ dual stacks |
| Dashboard | Stripe on seller dashboard | Deals on `/profile/deals` only | ⚠️ |
| Analytics | Exchange funnel + checkout events | No deal-completion GA4 | ⚠️ |

**Key files:** `lib/marketplace/commerce/barter-commerce-alignment.ts`, `lib/marketplace/commerce/community-order-checkout.ts`, `lib/proposals/proposal-service.ts`, `lib/proposals/deal-ux-state.ts`

### 2.3 BARTER_ONLY

| Step | Component | Service | Model | Status |
|------|-----------|---------|-------|--------|
| Listing | Proposal CTA only | `resolveProductCommerceActions` | `Product` | ✅ |
| Chat → Proposal | `CreateProposalSheet`, `ProposalCard` | `POST /api/conversations/.../proposals` | `Proposal` | ✅ |
| CommunityOrder | `DealCard` | `ProposalService.accept` | `CommunityOrder` | ✅ |
| Order | — | Cart/checkout blocked | — | ❌ by design |
| Betaling | — | `paymentPath: NONE` or off-platform | — | — |
| Bezorging | `DealCard` REQUEST_DELIVERY | `DeliveryRequestService` | `DeliveryRequest` | ⚠️ request only |
| Dashboard | `/profile/deals` | `/api/profile/deals` | `CommunityOrder` | ⚠️ not seller dashboard |
| Analytics | Exchange funnel | — | — | ✅ discovery only |
| Affiliate | — | No order commission | — | — |
| Subscription | — | — | — | — |

### 2.4 CONTACT / DIRECT (`orderMethod: CONTACT`, `paymentPath: DIRECT_CONTACT`)

| Step | Status | Notes |
|------|--------|-------|
| Listing | ✅ | No cart; contact CTA |
| Chat → Proposal | ✅ | Settlement MONEY or value per proposal |
| CommunityOrder | ✅ | No Stripe |
| Order | ❌ | Never created — invisible to `/orders` and seller stats |
| Betaling | Off-platform | `deal-ux-state` → DISCUSS_PAYMENT |
| Bezorging | ⚠️ | Same `DeliveryRequest` path as barter if requested |
| Dashboard | ⚠️ | Deals page + chat only |
| Analytics | ⚠️ | Funnel to proposal; no purchase event |
| Affiliate | ❌ | No platform fee → no commission |
| Subscription | — | — |

---

## 3. Delivery audit

### 3.1 Systems inventory

| System | Location | Purpose | Active? |
|--------|----------|---------|---------|
| **DeliveryOrder** | `prisma` + `/api/delivery/orders/*` | Stripe checkout teen delivery jobs | ✅ **Active** |
| **DeliveryProfile** | `DeliveryProfile`, `/api/delivery/profile` | Ambassador/courier profile, availability days/slots | ✅ **Active** |
| **DeliveryRequest** | `lib/delivery/delivery-request-service.ts` | Community-order courier jobs | ⚠️ **Partial** |
| **CourierAssignment** | Same service + `/api/delivery-requests/[id]/*` | Assign/accept/complete | ⚠️ **API only** |
| **CourierAvailability** | Prisma model + `courier-availability-service.ts` | Per-slot availability | ❌ **Orphan** (no API/UI) |
| **CourierScheduleService** | `lib/delivery/courier-schedule-service.ts` | Aggregates availability + assignments | ❌ **Orphan** (no callers) |
| **DelivererSelector** | `components/checkout/DelivererSelector.tsx` | Pre-select courier at checkout | ❌ **Dead UI** (never imported) |
| **match-deliverers** | `/api/delivery/match-deliverers` | Used only by DelivererSelector | ❌ **Orphan entry** |
| **match-orders** | `/api/delivery/match-orders` | Auto-match orders to deliverers | ❌ **No UI callers** |
| **assign-order** | `/api/delivery/assign-order` | Manual assignment | ❌ **No UI callers** |
| **gps-location** | `/api/delivery/gps-location` | GPS tracking | ❌ **No UI callers** |
| **Shift notifications** | `/api/cron/schedule-shift-notifications` | Roster-based push/email | ✅ **Scheduled** (`vercel.json`) |
| **delivery-warnings** | `/api/cron/delivery-warnings` | Late delivery warnings | ❌ **Not in vercel.json** |
| **Seller delivery settings** | `SellerDeliverySettings.tsx` | PLATFORM vs SELLER delivery mode | ✅ Seller settings only |

### 3.2 Operational questions

| Question | Answer |
|----------|--------|
| Bezorger kiezen tijdens order? | **Nee.** `DelivererSelector` exists but is **not imported** anywhere. Checkout uses `teen_delivery` / pickup selection without named courier. |
| Bezorger reserveren vooraf? | **Nee** for buyers. Sellers set `DeliveryProfile.availableDays/TimeSlots`; cron sends shift reminders — not buyer-facing reservation. |
| Bezorger op basis van rooster? | **Partial.** `schedule-shift-notifications` cron reads `DeliveryProfile` roster. **Not** used for order matching UI. |
| Bezorger op basis van beschikbaarheid? | **Partial.** `/api/delivery/check-availability`, `toggle-status` for teen delivery. `CourierAvailability` model **unused** in live flow. |
| Bezorger op basis van locatie? | **Ja** for teen delivery fee/matching APIs (`match-deliverers`, `calculate-delivery-fee`, geolib). **Nee** for community `DeliveryRequest` assignment UI. |
| Automatische matching? | **Post-payment first-accept** for `DeliveryOrder` on `/delivery/dashboard`. `match-orders` API exists without UI. Community: `tryAutoCreateAfterAccept` creates request only — **no auto-assign**. |

### 3.3 Active teen delivery flow

```
Checkout (teen_delivery) → Stripe webhook → Order + DeliveryOrder (OPEN)
  → Ambassador /delivery/dashboard → accept → update-status → payout
```

**Screens:** `app/checkout/page.tsx`, `components/delivery/DeliveryDashboard.tsx`, `app/delivery/dashboard/page.tsx`  
**Models:** `Order`, `DeliveryOrder`, `DeliveryProfile`  
**Order types:** Stripe `Order` with `deliveryMode` teen/platform delivery only

### 3.4 Abandoned / partial community delivery flow

```
Proposal accept (deliveryRequested) → DeliveryRequestService.tryAutoCreateAfterAccept
  OR DealCard REQUEST_DELIVERY → POST /api/community-orders/[id]/delivery-request
  → DeliveryRequest (OPEN)
  → [GAP] assign / accept / complete APIs — no courier dashboard
```

**APIs exist:** `assign`, `accept`, `complete` under `/api/delivery-requests/[id]/`  
**UI:** `DealCard` shows status; `VIEW_DELIVERY` CTA has `href: null` — read-only in chat

---

## 4. CommunityOrder fulfillment audit

### 4.1 Can a CommunityOrder today…?

| Capability | Status | Evidence |
|------------|--------|----------|
| Get a courier (`DeliveryRequest`)? | ⚠️ **Create yes** | `createFromCommunityOrder`, auto-create on accept, `DealCard.requestDelivery` |
| Be assigned (`CourierAssignment`)? | ❌ **No UI** | `POST .../assign` — no screen calls it |
| Have delivery status? | ⚠️ **Read-only** | `DealCard` shows `delivery.request.status.*` |
| Have pickup status? | ⚠️ **Data only** | `pickupDate`, `pickupTimeWindow` on model; no pickup tracking UI |
| Be completed (delivery)? | ❌ **No courier UI** | `complete` API exists; buyer/seller cannot drive courier completion in-app |
| Be completed (deal)? | ✅ | `MARK_COMPLETE`, trust review flows |

### 4.2 Reusable infrastructure (do not rebuild)

| Asset | Path | Reuse for |
|-------|------|-----------|
| `DeliveryRequestService` | `lib/delivery/delivery-request-service.ts` | Full community courier lifecycle |
| DTOs + serialization | `lib/delivery/delivery-marketplace-types.ts` | Courier dashboard wiring |
| Notifications | `lib/delivery/notify-delivery-request.ts` | Already on create/assign/accept/complete |
| Trust reviews | `lib/trust/community-delivery-review-service.ts` | Post-delivery review (`/delivery-review/[id]`) |
| Deal UX routing | `lib/proposals/deal-ux-state.ts` | CTA kinds `REQUEST_DELIVERY`, `VIEW_DELIVERY`, `REVIEW_DELIVERY` |
| Teen dashboard patterns | `DeliveryDashboard.tsx` | UX reference for community queue |

---

## 5. Seller operations audit

### 5.1 Surfaces

| Surface | Route | Data source | Transaction types |
|---------|-------|-------------|-------------------|
| Seller dashboard | `/verkoper/dashboard` | `/api/seller/dashboard/stats` | **Stripe `Order` only** |
| Seller orders | `/verkoper/orders` | `/api/seller/dashboard/orders` | **Stripe `Order` only** |
| Deals | `/profile/deals` | `/api/profile/deals` | **CommunityOrder** (buyer + seller) |
| Chat deals | `DealCard` in `ChatBox` | Conversation APIs | **CommunityOrder** |
| Delivery (seller view) | `/delivery/dashboard` (seller tab) | `/api/delivery/dashboard` | Teen `DeliveryOrder` for their Stripe orders |
| Payouts | `/verkoper/instellingen`, earnings APIs | Stripe Connect | Stripe revenue only |
| Operations today | `UserActionCenter`, operations cards | Mixed snapshots | Partial |

### 5.2 Can a seller today…?

| Question | Answer |
|----------|--------|
| See all transactions? | **No** — cash/barter/direct deals absent from verkoper dashboard |
| See Stripe orders? | **Yes** — `/verkoper/orders`, dashboard stats |
| See cash/direct deals? | **Only** `/profile/deals` + chat (same page as buyer) |
| See barter deals? | **Same** — deals page, not seller dashboard |
| See delivery status? | **Stripe orders:** yes via delivery dashboard links. **Community:** chat `DealCard` only |
| See open actions? | **Partial** — action center for Stripe pending orders; deal CTAs in chat |

### 5.3 Where is the split?

```
SellerProfile.id ──► Order (via Product.sellerId)     → verkoper dashboard ✅
User.id ───────────► CommunityOrder.sellerId          → /profile/deals only ⚠️
```

`getStatsForPeriod` explicitly filters `stripeSessionId` — non-Stripe deals never counted.

---

## 6. Buyer operations audit

### 6.1 Surfaces

| Surface | Route | Models |
|---------|-------|--------|
| Orders | `/orders`, `/orders/[id]` | `Order` |
| Deals | `/profile/deals` | `CommunityOrder` |
| Chat | `/chat/*` | Proposals, `DealCard`, delivery status |
| Payment success | `/payment/success` | Stripe session → Order lookup |
| Tracking | `OrderTracking.tsx` | `Order` status |

### 6.2 Can a buyer follow all transactions?

**No — three worlds:**

1. **Stripe orders** → `/orders` (tracking, delivery address, teen delivery via `DeliveryOrder`)
2. **Deals** (cash, barter, unpaid/paid community) → `/profile/deals` + chat
3. **Pre-deal chat** → proposals only

No unified “my transactions” hub. `UserActionCenter` deep-links to `/orders` for buyer order notifications, not deals.

---

## 7. Courier / ambassador operations audit

### 7.1 Does courier operations exist?

**Yes — for teen/platform Stripe delivery only.**

| Surface | Route | Role |
|---------|-------|------|
| Delivery dashboard | `/delivery/dashboard` | Ambassadors (`DeliveryProfile`) |
| Signup | `/api/delivery/signup` | Create `DeliveryProfile` |
| Available orders | Dashboard “Available” tab | `DeliveryOrder` pool, first-accept |
| Earnings | `/api/delivery/earnings` | Delivery payouts |
| Seller-as-courier | Same dashboard, seller-specific messaging | Own shop deliveries |

**“Ambassador”** in product copy = user with `DeliveryProfile` (teen delivery program), not a separate app role.

### 7.2 CommunityOrders for couriers?

| Question | Answer |
|----------|--------|
| Queue for `DeliveryRequest`? | **No UI** |
| Accept community jobs? | API only |
| Works for CommunityOrders? | **No operational path** |

### 7.3 Built but disconnected courier assets

- `CourierScheduleService` — 14-day schedule aggregation, zero importers
- `CourierAvailability` — CRUD service, no routes
- `DelivererSelector` + `match-deliverers` — checkout pre-pick, unwired
- `match-orders`, `assign-order`, `gps-location` — backend without frontend

---

## 8. Affiliate audit

### 8.1 What works

| Component | Path | Status |
|-----------|------|--------|
| Signup attribution | Referral cookie / link | ✅ |
| Commission on order | Stripe webhook → `processCommissionForOrder` | ✅ |
| Commission on subscription | `invoice.paid` → `processCommissionForInvoice` | ✅ |
| Reversal on refund/chargeback | `processCommissionReversal` | ✅ |
| Ledger | `CommissionLedger` model | ✅ |
| Affiliate dashboard | `/affiliate/dashboard` | ✅ stats, links, commissions |
| Admin affiliate mgmt | `AffiliateManagement.tsx` | ✅ |
| Payout request (user) | Action center `affiliate-payout-available` | ✅ surface |
| Payout process API | `/api/affiliate/payouts/process` | ✅ exists |
| Payout status API | `/api/affiliate/payouts/update-status` | ✅ exists |

### 8.2 Gaps / disconnected

| Gap | Detail |
|-----|--------|
| **Payout crons not scheduled** | `vercel.json` has only `schedule-shift-notifications` + `send-notifications` — no affiliate payout cron |
| **No automated payout job in production** | APIs callable manually; weekly payout promise in FAQ not enforced by scheduler |
| **No GA4 affiliate events** | Ledger internal only |
| **No validator** | `scripts/validate-*` has no affiliate coverage |

### 8.3 Sub-affiliate tree

Parent commission on sub-affiliate orders implemented in `lib/affiliate-commission.ts` — **works** if attribution chain exists.

---

## 9. Subscription audit

### 9.1 What is technically enforced

| Benefit | Enforced? | Where |
|---------|-----------|-------|
| Reduced platform fee (`feeBps`) | ✅ **Yes** | `app/api/stripe/webhook/route.ts`, seller earnings APIs |
| Stripe billing | ✅ | Webhook subscription events |
| `SellerProfile.subscriptionId` link | ✅ | On subscribe |

### 9.2 Marketing-only (not enforced)

| Claimed in `lib/pricing.ts` | Enforced? |
|-----------------------------|-----------|
| €2000/year revenue cap (individual) | ❌ No check before checkout or listing |
| Max users (5 / 25) | ❌ No multi-user enforcement |
| Analytics dashboard | ❌ Same dashboard for all |
| Custom branding | ❌ Not gated |
| API access | ❌ Not gated |
| Priority / premium support | ❌ Not gated |

### 9.3 Broken wiring

| Issue | Detail |
|-------|--------|
| `/api/user/revenue` | **Missing** — called from `app/pricing/page.tsx` |
| `/api/user/upgrade` | **Missing** — upgrade button calls dead endpoint |
| Tier selection UX | Pricing page cannot complete upgrade flow in-app |

### 9.4 Subscription analytics

No dedicated GA4 or internal analytics for subscription conversions beyond Stripe dashboard.

---

## 10. Promotion & visibility audit

### 10.1 What exists

| System | Location | Used? |
|--------|----------|-------|
| Home internal promos | `lib/promotions/home-promotions.ts`, sidebar `home_promotions` | ✅ |
| HCP carousel / spotlights | `lib/gamification/home-carousel-build.ts` | ✅ homepage |
| HCP reward grants | `hcp-rewards-engine.ts` (`profile_boost_500`, spotlights) | ✅ grants to DB |
| Sidebar sponsored slot | `sponsored_placeholder` in sidebar stack | ❌ **Stripped** in `flattenSidebarStackModules` |
| Tile `sponsored` badge | `lib/marketplace/tiles/types.ts` | ❌ **Unreachable** (always `false` / filtered) |
| Exchange `sponsoredBoost` | contract only | ❌ Not in ranking input |
| Local campaigns | discovery activations | ⚠️ separate from subscriptions |

### 10.2 Subscription vs promotion

**Decoupled.** Subscription affects `feeBps` only. Visibility boosts from HCP rewards are **not consumed** by `lib/discovery/ranking/ranking-engine.ts` (no boost/subscription/sponsored terms in ranking code).

### 10.3 Reuse for business plans

- `home_promotions` infrastructure for paid placements
- HCP grant pipeline for earned visibility
- Sidebar slot registry (`sponsored_placeholder`) — wire + stop stripping in flatten
- Ranking engine profiles — add modifier hook without new feed

---

## 11. Analytics audit

### 11.1 Measured today

| Domain | Events / source | Coverage |
|--------|-----------------|----------|
| Exchange funnel | `lib/marketplace/exchange/exchange-funnel-analytics.ts` (10 GA4 events) | ✅ discovery → proposal → checkout |
| Purchase | `GoogleAnalytics.tsx` `purchase` | ✅ Stripe success path |
| Product views | `AnalyticsEvent` in DB | ✅ seller dashboard views count |
| Seller dashboard stats | Order aggregates | ✅ Stripe only |
| Exchange analytics validators | `validate-exchange-funnel-analytics.ts` | ✅ 13/13 |

### 11.2 Not measured (operational gaps)

| Domain | Gap |
|--------|-----|
| Deal completion (non-Stripe) | No GA4 |
| CommunityOrder lifecycle | No funnel |
| DeliveryOrder lifecycle | No GA4 (internal only) |
| DeliveryRequest lifecycle | No analytics |
| Affiliate conversion funnel | No GA4 |
| Subscription upgrade funnel | Broken page + no events |
| Payout events | No product analytics |
| Courier accept/complete | No analytics |
| Promotion impression/click | Partial (home promos internal) |
| Subscription perk usage | N/A (not enforced) |

---

## 12. Dead system audit

| Asset | Type | Symptom |
|-------|------|---------|
| `DelivererSelector.tsx` | UI | Zero imports |
| `CommunityOrderSummaryCard.tsx` | UI | Zero imports (superseded by `DealCard`) |
| `HcpActivationCard.tsx` | UI | Zero imports |
| `CourierScheduleService` | Service | Zero callers |
| `CourierAvailabilityService` | Service | No API routes |
| `/api/delivery/match-orders` | API | No frontend caller |
| `/api/delivery/assign-order` | API | No frontend caller |
| `/api/delivery/gps-location` | API | No frontend caller |
| `/api/cron/delivery-warnings` | Cron | Not in `vercel.json` |
| `/api/cron/cleanup-stock-reservations` | Cron | Not in `vercel.json` |
| `sponsored_placeholder` sidebar | UI slot | Built then stripped in flatten |
| Tile `sponsored` variant | Type/badge | Never true in producers |
| `/api/user/revenue`, `/api/user/upgrade` | API | Called from pricing page, **routes missing** |
| `lib/pricing.ts` limits | Config | Never imported for enforcement |
| Affiliate payout cron | Job | APIs without scheduler |
| HCP `visibility_boost` grants | DB rewards | Ranking engine ignores |

---

## 13. Reuse audit (do not rebuild)

| System | Why reuse |
|--------|-----------|
| `DeliveryOrder` + `DeliveryDashboard` | Production teen delivery; payout, accept, status |
| `DeliveryRequestService` + APIs | Full community courier state machine already coded |
| `deal-ux-state.ts` + `DealCard` | Deal operations UX hub |
| `ProposalService` → `CommunityOrder` | Single deal creation path |
| `barter-commerce-alignment.ts` | Checkout/proposal gates |
| `community-order-checkout.ts` | Deal Stripe checkout |
| Stripe webhook | Order, fees, affiliate, delivery order creation |
| `lib/affiliate-commission.ts` + `CommissionLedger` | Attribution + ledger |
| `Subscription.feeBps` webhook path | Only enforced subscription perk |
| Exchange funnel analytics | Phase 5E-G registry |
| Discovery ranking engine | Add modifiers; don’t second feed |
| Shift notification cron | Roster → notification pipeline |
| `notify-delivery-request.ts` | Community delivery notifications ready |

---

## 14. P0 blockers

| # | Blocker | Risk |
|---|---------|------|
| P0-1 | **Community delivery has no courier UI** | Deals can request delivery but cannot be fulfilled in-app |
| P0-2 | **Seller cannot see non-Stripe deals on verkoper dashboard** | Operational blindness for cash/barter volume |
| P0-3 | **Affiliate payout automation not scheduled** | Commissions accrue; payout SLA not met at scale |
| P0-4 | **Pricing upgrade endpoints missing** | Subscription growth path broken from `/pricing` |

*Note: Stripe money path (fees, webhook, teen delivery) has no P0 money-safety blocker per 5F-A.*

---

## 15. P1 gaps

| # | Gap |
|---|-----|
| P1-1 | Buyer split: `/orders` vs `/profile/deals` vs chat |
| P1-2 | Dual completion: mark `CommunityOrder` complete vs Stripe `Order` state |
| P1-3 | `DelivererSelector` / pre-assign — built but unwired (product expectation mismatch) |
| P1-4 | Subscription tier limits (€2k cap, max users) documented but unenforced |
| P1-5 | HCP visibility boosts granted but not applied in ranking |
| P1-6 | Orphan crons (`delivery-warnings`, `cleanup-stock-reservations`) |
| P1-7 | No operational analytics for delivery, deals, affiliate, subscriptions |
| P1-8 | Legacy `barterOpenness=null` listings (data debt, 5F-A) |

---

## 16. P2 improvements

| # | Improvement |
|---|-------------|
| P2-1 | Wire `sponsored_placeholder` or remove dead slot |
| P2-2 | Consolidate ambassador terminology in seller vs courier UX |
| P2-3 | `CommunityOrderSummaryCard` — delete or wire |
| P2-4 | `HcpActivationCard` — surface or remove |
| P2-5 | Courier schedule UI atop existing `CourierScheduleService` |
| P2-6 | Unified “operations” inbox spanning Order + CommunityOrder |
| P2-7 | GA4 events for deal completion and delivery milestones |
| P2-8 | Validators for delivery, affiliate, subscription enforcement |

---

## 17. Wat veilig live kan

| Flow | Confidence |
|------|------------|
| MONEY listing → cart → Stripe checkout | ✅ High |
| MONEY_AND_BARTER → proposal → deal checkout → webhook | ✅ High |
| BARTER_ONLY / CONTACT → proposal → CommunityOrder in chat | ✅ High |
| Teen delivery for Stripe orders | ✅ High (manual scale testing advised) |
| Seller Stripe dashboard + orders | ✅ High |
| Affiliate attribution + commission ledger | ✅ High |
| Business subscription fee discount | ✅ High |
| Exchange funnel analytics | ✅ High |

---

## 18. Wat eerst aangesloten moet worden

| Priority | Connection |
|----------|------------|
| 1 | `DeliveryRequest` assign/accept/complete → courier UI (extend `DeliveryDashboard` or sibling) |
| 2 | Seller dashboard → include `CommunityOrder` summary or deep-link hub |
| 3 | Affiliate payout cron → `vercel.json` + `payouts/process` |
| 4 | `/api/user/revenue` + `/api/user/upgrade` OR remove pricing page calls |
| 5 | Buyer unified transaction list (read-model merge, not new Order type) |
| 6 | HCP visibility boosts → ranking input modifier |

---

## 19. Aanbevolen volgende fase

**Phase 5G — Operational wiring (not greenfield build)**

1. **Community courier MVP** — Queue tab on `/delivery/dashboard` calling existing `DeliveryRequest` APIs; reuse `DeliveryDashboard` patterns.
2. **Seller operations hub** — Extend `/verkoper/dashboard` with CommunityOrder strip + link to deals; shared “open actions” counts.
3. **Affiliate payout cron** — Schedule weekly `payouts/process`; admin alert on failure.
4. **Subscription wiring** — Implement missing pricing APIs or redirect to Stripe Customer Portal; enforce `maxRevenue` if legally required.
5. **Analytics pack** — Deal completed, delivery accepted/completed, affiliate payout; validators for each.
6. **Dead code triage** — Remove or wire `DelivererSelector`, `CommunityOrderSummaryCard`, orphan crons.

---

## Conclusie — expliciete antwoorden

| Vraag | Antwoord |
|-------|----------|
| **Kan een verkoper vandaag volledig binnen HomeCheff werken?** | **Nee.** Stripe-verkopen ja; cash/barter/direct deals alleen via `/profile/deals` en chat, niet op het verkoper-dashboard. |
| **Kan een koper vandaag volledig binnen HomeCheff werken?** | **Gedeeltelijk.** Stripe-aankopen op `/orders`; deals elders. Geen één transactie-overzicht. |
| **Kan een bezorger vandaag volledig binnen HomeCheff werken?** | **Alleen voor teen/Stripe `DeliveryOrder`.** Geen werk voor community `DeliveryRequest`. |
| **Kan een CommunityOrder vandaag bezorgd worden?** | **Niet end-to-end.** Request aanmaken wel; toewijzen/accepteren/afronden niet via UI. |
| **Bestaat de oude rooster-/beschikbaarheidslogica nog?** | **Ja, gedeeltelijk.** `DeliveryProfile` roster + shift cron actief; `CourierScheduleService` / `CourierAvailability` bestaan maar zijn niet aangesloten. |
| **Kan vooraf een bezorger gekozen of gereserveerd worden?** | **Nee.** `DelivererSelector` is gebouwd maar niet gekoppeld. |
| **Kan locatie gebruikt worden voor bezorgtoewijzing?** | **Ja** voor teen delivery (fee + matching APIs). **Nee** voor community courier (geen assignment UI). |
| **Welke systemen zijn gebouwd maar niet meer aangesloten?** | Zie §12 — o.a. DelivererSelector, DeliveryRequest courier UI, affiliate payout cron, pricing APIs, HCP boosts → ranking, sponsored sidebar. |
| **Welke systemen mogen absoluut niet opnieuw gebouwd worden?** | Zie §13 — DeliveryOrder stack, DeliveryRequestService, deal-ux/DealCard, webhook, CommissionLedger, ranking engine. |
| **Grootste operationele risico's vóór schaalvergroting?** | (1) Gesplitste dashboards → support chaos; (2) community delivery belofte zonder fulfillment; (3) affiliate payouts niet geautomatiseerd; (4) subscription upgrade kapot; (5) dubbele waarheid Order vs CommunityOrder. |

---

## Validatie

### Build pipeline (2026-07-07)

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ Pass |
| `npm run build` | ✅ Pass |
| `npm run smoke-check` | ✅ Pass |

### Marketplace / exchange validators

| Script | Result |
|--------|--------|
| `validate-marketplace-barter-openness-wiring` | 18/18 |
| `validate-marketplace-detail-system` | 182/182 |
| `validate-marketplace-exchange-commerce-alignment` | 17/17 |
| `validate-marketplace-exchange-proposal-conversion` | 30/30 |
| `validate-marketplace-preview-ux` | 38/38 |
| `validate-marketplace-previews` | 104/104 |
| `validate-marketplace-taxonomy-consolidation` | ✅ Pass |
| `validate-marketplace-tile-system` | 90/90 |
| `validate-exchange-funnel-analytics` | 13/13 |
| `validate-exchange-foundation` | 50/50 |
| `validate-exchange-suggestions` | 124/124 |
| `validate-hcp-economy` | 116/116 |
| `validate-ranking-engine` | 16/16 |

**Combined marketplace-related checks:** ~1,643 passed, 0 failed.

### Missing automated validator coverage

| Operational area | Validator |
|------------------|-----------|
| DeliveryOrder lifecycle (accept → complete) | ❌ None |
| DeliveryRequest / CourierAssignment lifecycle | ❌ None |
| CommunityOrder fulfillment states | ❌ None |
| Seller/buyer dashboard transaction parity | ❌ None |
| Affiliate payout job + ledger transitions | ❌ None |
| Subscription limit enforcement | ❌ None |
| Promotion boost → ranking consumption | ❌ None |
| Dead system detection (orphan API/UI) | ❌ None |
| Cron scheduling parity (`vercel.json` vs routes) | ❌ None |

---

*Audit complete. No application code was modified.*

# Follow the Money — Phase 11B Financial Integrity Audit

**Date:** 2026-07-08  
**Method:** End-to-end trace of every euro from buyer payment through platform revenue, seller payout, subscription billing, and affiliate commission. Architecture frozen (Phases 7A–11A). No redesign.  
**Scope:** Real-money pilot readiness for Vlaardingen city launch.

---

## Executive summary

HomeCheff uses a **platform-collect, split-later** model: buyers pay via Stripe Checkout into the platform account; sellers, deliverers, and affiliates receive funds via **Stripe Connect transfers** after webhook processing.

| Flow | Verdict | Notes |
|------|---------|-------|
| HomeCheff Checkout (marketplace) | ✅ Ready | Settlement gate, stock reservation, webhook order creation |
| Seller payouts (Connect) | ✅ Ready | Immediate transfer (pickup/delivery); escrow + release (shipping) |
| Platform commission | ✅ Ready | 12% individual; 7/4/2% business tiers via `feeBps` |
| Subscriptions (Basic/Pro/Premium) | ✅ Ready | Stripe Billing + webhook; auth hardened in 11B |
| Affiliate commissions | ⚠️ Ops | Ledger idempotent; **cron must be scheduled** for unlock/payout |
| Refunds | ⚠️ Partial | Admin order cancel works; marketplace clawback incomplete |
| VAT / tax engine | ⚠️ Display only | Prices assumed VAT-inclusive; no Stripe Tax |
| Reporting | ⚠️ Partial | GMV + fee totals; no true MRR |

**Fixes applied in 11B (P0/P1):**
1. Missing `requiresStripeForHomecheffCheckout` import in checkout route (runtime ReferenceError on Connect check).
2. Removed dangerous `prisma.subscription.upsert` in payment webhook (could corrupt subscription catalog).
3. Session ownership on `/api/subscribe` and `/api/subscribe/confirm`.
4. Admin refund resolves `payment_intent` from checkout session when `providerRef` is `cs_*`.
5. Escrow release atomic lock (`held` → `payout_scheduled`) before Stripe transfer.

---

## Severity legend

| Level | Meaning |
|-------|---------|
| **P0** | Financial risk, revenue loss, double payment, security, broken payout |
| **P1** | Incorrect reporting, wrong commission, subscription inconsistency, ops blocker |
| **P2** | Accounting/reporting improvement |
| **P3** | Future optimisation |

---

## 1. Revenue sources audited

| Source | Status | Implementation |
|--------|--------|----------------|
| HomeCheff Checkout | ✅ Live | `POST /api/checkout` → Stripe Checkout `mode: payment` |
| Marketplace commission | ✅ Live | `lib/fees.ts` — 12% default; business `feeBps` |
| Subscriptions Basic/Pro/Premium | ✅ Live | `POST /api/subscribe` → Stripe `mode: subscription` |
| Subscription upgrades/downgrades | ✅ Live | `stripe.subscriptions.update` with proration |
| Stripe fees (pass-through) | ✅ Live | Buyer pays 1.4% + €0.25 gross-up |
| Delivery fees | ✅ Live | Google Maps pricing; 12% platform / 88% deliverer split |
| Premium features / boosts | ❌ Not built | Documented future — no code paths |
| Affiliate income | ✅ Accrual | `CommissionLedger`; payout needs cron |
| Investor dashboards | N/A | `/pitch` only — no live financial data feed |

---

## 2. Payment lifecycle (marketplace)

```
Customer cart
  → POST /api/checkout
      → auth + account requirements
      → resolveCheckoutBlockReason (settlement-router)
      → atomic stock check + stockReservation (15 min)
      → stripe.checkout.sessions.create (platform account)
  → Stripe Hosted Checkout
  → POST /api/stripe/webhook (checkout.session.completed)
      → idempotency: existing Order by stripeSessionId
      → Order CONFIRMED + OrderItems + stock decrement
      → Transaction (providerRef: session.id)
      → PICKUP/DELIVERY: stripe.transfers.create → seller Connect
      → SHIPPING: PaymentEscrow (held) → release on DELIVERED
      → processCommissionForOrder (affiliate)
      → DeliveryOrder if platform delivery
  → /payment/success polls until Order exists
```

### Idempotency

| Layer | Mechanism | Status |
|-------|-----------|--------|
| Order creation | `Order.stripeSessionId` lookup before create | ✅ |
| Stock hold | `StockReservation.stripeSessionId` @unique | ✅ |
| Affiliate commission | `CommissionLedger.eventId` @unique | ✅ |
| Global webhook dedup | Stripe `event.id` store | ❌ Missing (mitigated by above) |
| Escrow release | Atomic `updateMany` on `held` (11B) | ✅ |
| Stripe transfer idempotency keys | — | ❌ Not used |

---

## 3. Subscriptions

### Plans

| Plan | Price (UI) | Platform fee | `feeBps` |
|------|------------|--------------|----------|
| Basic | €39/mo | 7% | 700 |
| Pro | €99/mo | 4% | 400 |
| Premium | €199/mo | 2% | 200 |
| Individual (no plan) | — | 12% | 1200 |

### Lifecycle

| Event | Handler | Status |
|-------|---------|--------|
| Create | `checkout.session.completed` (subscription) | ✅ |
| Renewal | Stripe invoices; `invoice.paid` → affiliate | ✅ |
| Upgrade/downgrade | `/api/subscribe` → `subscriptions.update` | ✅ |
| Cancel | `customer.subscription.deleted` webhook | ✅ |
| Failed payment | — | ❌ No `invoice.payment_failed` handler |
| Grace period | — | ❌ `past_due` instantly revokes benefits |
| Confirm fallback | `/api/subscribe/confirm` | ✅ |
| Auth | Session must match `userId` (11B) | ✅ |

### Risks

| ID | Severity | Finding |
|----|----------|---------|
| SUB1 | P1 | No grace period — failed payment immediately drops to 12% fee |
| SUB2 | P2 | `BusinessSubscription` not updated on renewal |
| SUB3 | P2 | No user-facing cancel / Stripe Customer Portal |
| SUB4 | P2 | Promo `redemptionCount` never incremented |
| SUB5 | P2 | `/api/user/upgrade` referenced from pricing page but missing |

---

## 4. Stripe integration

| Surface | Status | File |
|---------|--------|------|
| Checkout Sessions | ✅ | `app/api/checkout/route.ts` |
| PaymentIntents | ⚠️ Legacy mock only | `app/api/payment/create/route.ts` |
| Connect Accounts | ✅ | `app/api/stripe/connect/onboard/route.ts` |
| Transfers | ✅ | Webhook + `releaseEscrowOnDelivered` |
| Application fees at charge time | ❌ Unused | `createConnectPaymentIntent` in `lib/stripe.ts` |
| Refunds | ⚠️ Partial | Admin routes; no `charge.refunded` for orders |
| Disputes | ⚠️ Affiliate only | `charge.dispute.created` → commission reversal |
| Webhook signatures | ✅ | `constructEvent` on both webhooks |
| Connect webhook | ✅ | `account.updated`, deauthorize |

---

## 5. Seller payouts

| State | Mechanism |
|-------|-----------|
| Immediate (non-shipping) | Webhook `transfers.create` on checkout |
| Held (shipping) | `PaymentEscrow` until DELIVERED |
| Release | `releaseEscrowForOrder` — atomic lock (11B) |
| Manual request | `POST /api/seller/payouts/request` — min €10 |
| Incomplete Connect | Checkout blocked via `PAYMENTS_NOT_READY` |
| Failed transfer | `providerRef: failed_*` — manual repair needed |

| ID | Severity | Finding |
|----|----------|---------|
| PAY1 | P2 | Failed webhook transfer uses `failed_*` ref — hard to retry |
| PAY2 | P2 | Deliverer ledger on DELIVERED; Stripe transfer via combined payout request only |
| PAY3 | P2 | No automatic seller clawback on buyer refund |

---

## 6. Affiliate system

### Rules (`lib/affiliate-config.ts`)

| Rule | Value |
|------|-------|
| Order commission | 25% of platform fee per side (50% both) |
| Sub-affiliate order | 20% / parent 5% |
| Subscription commission | 50% direct / 40% sub + 10% parent |
| Attribution window | 365 days |
| Commission lock | 14 days PENDING |
| Min payout | €10 |

### Protections

| Check | Status |
|-------|--------|
| Self-referral blocked | ✅ |
| Duplicate commission (`eventId`) | ✅ |
| Refund reversal | ✅ (`charge.refunded`, disputes) |
| Parent reversal on `_parent` entries | ⚠️ Partial |
| Payout automation | ❌ **Cron not in vercel.json** |

| ID | Severity | Finding |
|----|----------|---------|
| AFF1 | **P1 ops** | `/api/affiliate/payouts/update-status` and `/process` not scheduled — commissions stay PENDING |
| AFF2 | P2 | Commission base uses `amount_paid` not list price on discounts |
| AFF3 | P2 | Parent ledger entries may miss reversal on partial refund |

---

## 7. Financial integrity matrix

| Question | Answer |
|----------|--------|
| Can money disappear? | **Unlikely** — Stripe is source of truth; platform retains balance after transfers |
| Can money be duplicated? | **Mitigated** — order/commission idempotency; escrow lock added 11B |
| One payment → two orders? | **No** — `stripeSessionId` guard |
| Webhook pays twice? | **Unlikely** — same guards; no global event dedup |
| Subscription activates twice? | **No** — `BusinessSubscription` check by `stripeSubscriptionId` |
| Commission paid twice? | **No** — `eventId` unique |
| Commission skipped? | **Possible** if affiliate inactive or attribution missing |
| Payouts exceed revenue? | **Unlikely** at pilot scale — manual affiliate batching |
| Balances negative incorrectly? | **Not observed** — ledger uses positive amounts + reversals |
| VAT inconsistent? | **N/A engine** — display-only VAT-inclusive assumption |

---

## 8. Accounting & reconciliation

| Entity | Traceable | Notes |
|--------|-----------|-------|
| Payment | ✅ | Stripe session id on Order |
| Transaction | ✅ | `providerRef: session.id` |
| Payout | ✅ | Transfer id on `providerRef` |
| Refund | ⚠️ | Admin paths; incomplete order linkage |
| Subscription | ✅ | `stripeSubscriptionId` on SellerProfile |
| Commission | ✅ | `CommissionLedger` with `eventId` |
| Affiliate payout | ✅ | `AffiliatePayout` records |
| Invoice | ⚠️ | Stripe invoices; not mirrored locally |

**Admin reporting:** `GET /api/admin/financial` — GMV-like totals, platform fees, payouts, 6-month stats. **No MRR/ARR computation.**

---

## 9. Permissions

| Action | Gate | Status |
|--------|------|--------|
| Checkout | Auth + account requirements | ✅ |
| Subscribe | Auth + userId match (11B) | ✅ |
| Seller payout request | Session + seller profile | ✅ |
| Affiliate payout process | Admin or `CRON_SECRET` | ✅ |
| Admin financial | ADMIN / SUPERADMIN | ✅ |
| Webhook | Stripe signature | ✅ |
| Legacy `/api/payment/create` | Mock — no auth needed | ⚠️ Dead path |

---

## 10. Failure scenarios

| Scenario | Behaviour | Gap |
|----------|-----------|-----|
| Stripe unavailable | Checkout fails gracefully | ✅ |
| Webhook delayed | Success page polls | ✅ |
| Webhook duplicated | Order idempotency | ✅ |
| Payment succeeds, webhook fails | Stripe retries; orphan risk if metadata bad | ⚠️ |
| Seller disconnects Connect | Future checkouts blocked | ✅ |
| Subscription expires mid-checkout | Checkout is one-time payment | N/A |
| Partial/full refund | Admin can Stripe-refund; no seller clawback | P2 |
| Chargeback | Affiliate reversal only | P2 marketplace |

---

## 11. Security

| Threat | Status |
|--------|--------|
| Webhook spoofing | ✅ Signature verification |
| Replay (webhook) | ⚠️ No event.id store |
| Unauthorized subscribe (pre-11B) | ✅ Fixed — session ownership |
| Unauthorized payout | ✅ Session + seller profile |
| Hidden admin routes | ✅ Role checks |
| Legacy mock payment | ⚠️ Exists but unused in main flow |

---

## 12. Scalability (financial)

| Scale | Assessment |
|-------|--------------|
| 100 users | ✅ Current webhook + DB model sufficient |
| 500 users | ✅ Monitor webhook duration (30s Vercel limit) |
| 5,000 users | ⚠️ Webhook serial processing; consider event queue |
| 50,000 users | ❌ Needs async job infrastructure |
| High webhook volume | ⚠️ No dedup table; relies on DB constraints |
| Subscription renewals | ✅ Stripe handles billing |

---

## 13. Findings summary

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| **FIN1** | **P0** | Checkout missing `requiresStripeForHomecheffCheckout` import | **Fixed 11B** |
| **FIN2** | **P0** | Webhook `subscription.upsert` could corrupt catalog | **Removed 11B** |
| **FIN3** | **P1** | Subscribe routes lacked session ownership | **Fixed 11B** |
| **FIN4** | **P1** | Admin refund used session id as payment_intent | **Fixed 11B** |
| **FIN5** | **P1** | Escrow release race on parallel DELIVERED | **Fixed 11B** |
| AFF1 | P1 ops | Affiliate payout crons not scheduled | **Open — ops task** |
| SUB1 | P1 | No failed-payment grace period | Open |
| PAY3 | P2 | No seller clawback on refund | Open |
| VAT1 | P2 | No tax engine | Open |
| REP1 | P2 | No true MRR | Open |
| LEG1 | P3 | Mock `PaymentButton` / `/api/payment/create` | Open |

**P0 count after 11B fixes: 0**

---

## 14. Pilot financial verdict — six questions

### 1. Can HomeCheff safely receive money?

**Yes.** Stripe Checkout is the live path. Settlement router blocks ineligible listings. Stock is reserved atomically. Webhook creates orders idempotently by `stripeSessionId`. Checkout Connect-readiness check is restored (11B).

### 2. Can HomeCheff safely distribute money?

**Yes, with documented limits.** Non-shipping orders transfer immediately to seller Connect. Shipping uses escrow with atomic release (11B). Seller manual payout request available for held balances. Refund clawback from sellers is not automated (P2).

### 3. Can HomeCheff safely manage subscriptions?

**Yes.** Stripe Billing handles renewals. Webhook assigns plan + `feeBps`. Upgrade/downgrade via subscription update. Auth hardened (11B). **Caveat:** failed payments instantly revoke benefits — no grace period (P1 UX/billing, not money loss).

### 4. Can HomeCheff safely manage affiliate commissions?

**Accrual: Yes. Payout: Conditional.** Commissions are calculated idempotently and reversed on refunds/disputes. **Blocker for automatic payout:** schedule cron jobs with `CRON_SECRET` for:
- `POST /api/affiliate/payouts/update-status` (daily)
- `POST /api/affiliate/payouts/process` (weekly)

Manual admin trigger works without cron.

### 5. Can HomeCheff safely scale financially?

**Yes for pilot scale (100–500 users).** Architecture is adequate. Monitor webhook latency and escrow edge cases. Not ready for 5,000+ without async processing.

### 6. Is HomeCheff financially ready for the first city pilot?

**Yes — for marketplace checkout and seller payouts.**

**Pre-launch ops checklist:**
1. Confirm Stripe webhook endpoints + secrets in production
2. Confirm Connect onboarding tested end-to-end
3. Schedule affiliate payout crons (if affiliate program active at launch)
4. Document admin refund process (use order cancel route for full refunds)

---

## Validation

```bash
npx tsx scripts/validate-follow-the-money-phase11b.ts
npm run lint
npm run build
```

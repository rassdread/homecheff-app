# HOMECHEFF MARKETPLACE NL — Live App Technical Closeout

**Date:** 2026-09-01  
**Repository:** `homecheff-app` (authoritative EUR Marketplace)  
**Production domain:** `https://homecheff.eu`  
**Vercel project:** `homecheff-app` (`prj_V0aZoSgSjd8dJKM0YtWkAKI88NLV`)  
**Baseline SHA (pre-deploy):** `00790c06`  
**Scope:** Checkout / Connect / refunds / finance / €10 checkout floor — **HomeCheff-app only**

---

## 0. Certified baseline (unchanged)

Prior Growth/homecheff-leads closeout remains valid unless contradicted by live app evidence:

- `MARKETPLACE_TECHNICAL_FINANCIAL_FOUNDATION = CLOSED`
- `DAC7_TECHNICAL_FOUNDATION = CLOSED` (Growth repo foundations; HomeCheff-app supplies transaction inputs)
- Fee tiers: individual 12%, basic 9%, pro 7%, premium 5%
- Buyer surcharge: 1.4% + €0.25 gross-up (ceil)

Live app evidence **confirms** supporting-repo fee model and Stripe architecture.

---

## 1. Repository & production identity

| Field | Value |
|-------|-------|
| REPOSITORY | `/Users/sergioarrias/HomeCheffProjects/homecheff-app` |
| REMOTE_MAIN_SHA (pre-feature) | `00790c06` |
| PRODUCTION_DOMAIN | `homecheff.eu` |
| VERCEL_PROJECT | `homecheff-app` |
| LIVE_MARKETPLACE_REPOSITORY_CONFIRMED | **YES** |

---

## 2. Live checkout path (EUR Stripe)

| Step | Module / route |
|------|----------------|
| Listing → cart CTA | `components/cart/AddToCartButton.tsx`, `hooks/useCart.ts` |
| Checkout UI | `app/checkout/page.tsx` |
| Checkout API | `POST /api/checkout` → `app/api/checkout/route.ts` |
| Delivery quote | `POST /api/checkout/calculate-delivery-fee` |
| Stripe Checkout Session | `stripe.checkout.sessions.create` (`mode: payment`, `currency: eur`) |
| Webhook | `POST /api/stripe/webhook` → `checkout.session.completed` |
| Order creation | Webhook → `prisma.order.create` + `OrderItem` |
| Seller settlement | `lib/payments/seller-settlement.ts` → `stripe.transfers.create` |
| Refunds | `lib/payments/refund-settlement.ts`, `app/api/admin/refunds/*` |

**Direct/cash:** `lib/marketplace/settlement/settlement-options.ts`, `lib/product/order-method.ts` — not blocked below €10.

---

## 3. Stripe Connect architecture (technical)

| Flag | Live value |
|------|------------|
| STRIPE_CHARGE_TYPE | **Separate Charges and Transfers (SCT)** |
| PLATFORM_ACCOUNT | HomeCheff platform Stripe account |
| CONNECTED_ACCOUNT_ROLE | Seller Express/Custom Connect — payout destination |
| APPLICATION_FEE_IMPLEMENTATION | **Not at charge time** — platform fee deducted at transfer settlement |
| TRANSFER_IMPLEMENTATION | `stripe.transfers.create` post-payment (`seller-settlement.ts`) |
| STRIPE_FEE_PAYER | Buyer (gross-up line item “Transactiekosten”) |
| SELLER_PAYOUT_FORMULA | `sellerGross − platformFee` (bps from subscription tier at settlement) |
| REFUND_IMPLEMENTATION | `refund-settlement.ts` — buyer refund + proportional transfer reversal |
| DISPUTE_IMPLEMENTATION | `DisputeSettlement` model + admin dispute routes |
| WEBHOOK_OWNER | `app/api/stripe/webhook/route.ts` |

`createConnectPaymentIntent` with `application_fee_amount` exists in `lib/stripe.ts` but is **not** used for marketplace EUR checkout.

---

## 4. Fee model verification

**SSOT:** `lib/business/visibility-profile.ts` (`PLAN_CONFIG` feeBps: 1200/900/700/500)  
**Math:** `lib/fees.ts` → `calculatePlatformFeeCents`  
**Settlement:** `resolvePlatformFeeBps` in `lib/payments/seller-settlement.ts`  
**Tier source:** Seller `SellerProfile.subscriptionId` → `Subscription.feeBps`  
**Order total base:** Product consideration + delivery (separate delivery txn with 12% platform cut)  
**Delivery inclusion:** Yes — in subtotal and platform fee base  
**SMS:** Buyer-paid add-on; excluded from checkout floor  
**Rounding:** Platform fee `Math.round`; buyer surcharge `Math.ceil` gross-up  

`SUPPORTING_REPO_FEE_MODEL_MATCHES_LIVE_APP = **YES**`

---

## 5. Buyer Stripe surcharge

| Property | Value |
|----------|-------|
| Formula | `buyerTotal = ceil((subtotal + 25) / (1 − 0.014))`; surcharge = buyerTotal − subtotal |
| Module | `lib/fees.ts` → `calculateStripeFeeForBuyer` |
| Line item | “Transactiekosten” in checkout session |
| Visible pre-payment | Yes (checkout page fee breakdown) |
| Included in seller payout | **No** |
| Included in platform revenue | **No** (pass-through to Stripe) |

`BUYER_SURCHARGE_VERIFIED = **YES**`

---

## 6. €10 checkout floor (owner-approved)

| Decision | Value |
|----------|-------|
| OWNER_MICRO_ORDER_FLOOR | **APPROVED** |
| CHECKOUT_FLOOR_CENTS | **1000** |
| CHECKOUT_FLOOR_BASE_FIELD | `productsTotalCents + deliveryFeeCents` (before Stripe surcharge; SMS excluded) |
| DELIVERY_COUNTS_TOWARD_FLOOR | **YES** (Option B — aligns with platform fee / settlement base) |
| SMS_COUNTS_TOWARD_FLOOR | **NO** |
| Server enforcement | `lib/marketplace/checkout-floor.ts` + `POST /api/checkout` |
| Error code | `CHECKOUT_MINIMUM_NOT_MET` |
| i18n | `checkout.errors.minimumNotMet` (nl/en) |
| Sub-€10 listings | **Allowed** |
| Sub-€10 direct/cash | **Unchanged** |
| Historical paid orders | **Not altered** |

### Economic examples (floor base)

| Items | Delivery | SMS | Floor base | Eligible |
|-------|----------|-----|------------|----------|
| €7.00 | €3.00 | — | €10.00 | YES |
| €9.00 | €4.00 | — | €13.00 | YES |
| €5.00 | €5.00 | — | €10.00 | YES |
| €9.80 | — | surcharge only | €9.80 | **NO** (buyer total >€10 does not help) |
| €7.50 | — | €0.06 SMS | €7.50 | **NO** |

---

## 7. Refund reconciliation

Engine: `lib/payments/refund-settlement.ts` (v1 schema)

| Scenario | Behavior |
|----------|----------|
| Full refund | Buyer gross refund; proportional transfer reversal per seller leg |
| Partial refund | `SELLER_CONSIDERATION` / `EXPLICIT_ALLOCATION` modes |
| Application fee | Platform fee not separately refunded via Stripe application_fee (SCT model) |
| Transfer reversal | `reverseRecipientTransfer` before/with buyer refund |
| Seller already paid | Reversal from connected account balance |
| Stripe fee | Not returned to platform (Stripe policy) |
| Delivery refund | `includeCourierCents` allocation |
| Chargeback | `DisputeSettlement` separate from ordinary refund |

`MARKETPLACE_REFUND_RECONCILIATION_READY = **YES**` (code-evidence closed)

---

## 8. Financial snapshot mapping

| Desired field | Live source |
|---------------|-------------|
| ORDER_ID | `Order.id` |
| CURRENCY | EUR (implicit) |
| ITEMS_GROSS_CENTS | Stripe metadata `productsTotalCents` |
| DELIVERY_CENTS | metadata `deliveryFeeCents` / `Order.shippingCostCents` |
| SMS_CENTS | metadata `smsNotificationCostCents` |
| CHECKOUT_ELIGIBLE_BASE_CENTS | metadata `checkoutEligibleBaseCents` (new orders) |
| BUYER_PROCESSING_SURCHARGE_CENTS | metadata `stripeFeeCents` |
| BUYER_TOTAL_CENTS | metadata `amountPaidCents` / `Order.totalAmount` |
| PLATFORM_FEE_BPS | `Transaction.platformFeeBps` (immutable at capture) |
| PLATFORM_FEE_CENTS | computed from txn |
| SELLER_GROSS_CENTS | `Transaction.amountCents` |
| SELLER_PAYOUT_CENTS | `Payout.amountCents` |
| REFUNDED_CENTS | `Refund` + `RefundSettlement` |
| STRIPE_PAYMENT_ID | `Order.stripeSessionId` |
| CONNECTED_ACCOUNT_ID | seller `stripeConnectAccountId` at settlement |

Historical orders without metadata fields: `UNKNOWN_HISTORICAL` — no backfill with guessed values.

`MARKETPLACE_ORDER_FINANCIAL_SNAPSHOT_READY = **YES**` (future orders enriched; legacy partial)

---

## 9. Finance export

**Module:** `lib/marketplace/finance/order-financial-normalization.ts`  
**Admin route:** `GET /api/admin/marketplace/finance-export` (ADMIN/SUPERADMIN)  
**VAT status:** `UNKNOWN_PENDING_Q3` — no VAT invented  

`MARKETPLACE_FINANCE_EXPORT_READY = **YES**`

---

## 10. DAC7 transaction inputs

| Field | Technical source |
|-------|------------------|
| seller | `Transaction.sellerId` |
| period | `Order.createdAt` |
| transaction count | per seller aggregation |
| consideration | `productsTotalCents` metadata / `OrderItem.priceCents` sum |
| platform fees | `Transaction.platformFeeBps` × amount |
| refunds | `Refund` / `RefundSettlement` |
| currency | EUR |

`DAC7_CONSIDERATION_SOURCE_FIELD = **OrderItem.priceCents × qty sum at capture** (pending legal Q5)**  
`DELIVERY_SEPARATELY_RECONCILABLE = **YES**` (metadata + `DeliveryOrder.deliveryFee`)

Cross-repo DAC7 aggregation remains in homecheff-leads; HomeCheff-app export contract is stable JSON via finance-export.

`DAC7_TRANSACTION_INPUT_READY = **YES**`

---

## 11. Direct/cash below €10

| Flag | Value |
|------|-------|
| DIRECT_PAYMENT_RECORDED_VALUE | Listing/negotiated amount only — no confirmed payment |
| ACTUAL_PAYMENT_CONFIRMED | **NO** (off-platform) |
| DAC7_DATA_QUALITY | **LIMITED** for direct/cash |
| MARKETPLACE_NL_DIRECT_PAYMENT_TECHNICAL_READY | **YES** |
| MARKETPLACE_NL_DIRECT_PAYMENT_LEGAL_DEPENDENCY | Q3 VAT / intermediary role |
| MARKETPLACE_NL_DIRECT_PAYMENT_PUBLIC_READY | **NO** (legal Q3) |

---

## 12. Checkout readiness flags

| Flag | Value |
|------|-------|
| MARKETPLACE_NL_CHECKOUT_TECHNICAL_READY | **YES** |
| MARKETPLACE_NL_CHECKOUT_TAX_READY | **NO** |
| MARKETPLACE_NL_CHECKOUT_PUBLIC_READY | **NO** |
| CHECKOUT_FLOOR_SERVER_ENFORCED | **YES** |
| MARKETPLACE_CUSTOMER_PRICE_CHANGE | **NO** (except sub-€10 checkout blocked) |
| MARKETPLACE_SELLER_PAYOUT_CHANGE | **NO** |
| ACCOUNT_REQUIREMENTS_MISSING | Preserved — unchanged |

---

## 13. Q3 accountant questions (Marketplace NL)

Using live SCT + platform-fee intermediary model:

### Example A — €15 food order (HomeCheff checkout, individual 12%)

| Party | Amount |
|-------|--------|
| Buyer pays | €15.00 + Stripe surcharge (~€0.47) |
| Platform fee | €1.80 |
| Seller payout | €13.20 |
| Stripe fee | From buyer surcharge |

### Example B — €25 service paid direct

HomeCheff receives **no payment**; platform fee **€0** unless separate arrangement. Order record may exist; payment unconfirmed.

### Example C — €20 meal + €4 delivery

| Component | Amount |
|-----------|--------|
| Items | €20.00 |
| Delivery | €4.00 |
| Floor base | €24.00 ✓ |
| Platform fee (12% on items) | €2.40 |
| Delivery platform cut (12%) | €0.48 |

**Accountant / legal — confirm YES / NO / CORRECTION:**

1. Is seller the supplier to buyer? — **PENDING**
2. Is HomeCheff acting as disclosed intermediary/agent? — **PENDING**
3. Is HomeCheff's taxable supply the platform/intermediation service? — **PENDING**
4. Is HomeCheff VAT base limited to platform fee? — **PENDING**
5. Who owes VAT on underlying seller sale? — **PENDING**
6. Who issues buyer invoice for underlying supply? — **PENDING**
7. How should delivery be treated? — **PENDING**
8. How should platform-fee refunds be treated? — **PENDING**
9. Does direct/cash create HomeCheff VAT event? — **PENDING**

`ACCOUNTANT_Q3_REQUIRED = **YES**`  
`LEGAL_MARKETPLACE_ROLE_REQUIRED = **YES**`

---

## 14. Implementation summary (this workstream)

| File | Change |
|------|--------|
| `lib/marketplace/checkout-floor.ts` | SSOT €10 floor |
| `app/api/checkout/route.ts` | Server gate + authoritative DB prices + metadata |
| `lib/marketplace/finance/order-financial-normalization.ts` | Finance normalization |
| `app/api/admin/marketplace/finance-export/route.ts` | Internal export |
| `public/i18n/nl.json`, `en.json` | `checkout.errors.minimumNotMet` |
| `lib/marketplace/checkout-floor.test.ts` | 9 tests |
| `lib/marketplace/finance/order-financial-normalization.test.ts` | 4 tests |

**Tests:** 13/13 pass  
**Migration:** None required (metadata-only enrichment)

---

## 15. Workstream status

`MARKETPLACE_LIVE_APP_TECHNICAL_WORKSTREAM = **CLOSED / TAX ACTIVATION PENDING**`

Do **not** activate VAT, change fee rates, or enable HC public wallet in this phase.

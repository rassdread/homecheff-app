# P0 Live Payment Routing Forensic Audit — Controlled €1

**Audit mode:** read-only (no transfer, no payout, no Order mutation, no Stripe Dashboard change)  
**Main SHA before:** `251bb3aaec41ad3143a8ea6ea7385e1377d3c8cb`  
**Production before:** `dpl_BWf8ZZBRZU9x3wfbMbx32PAZ8dgk`  
**Audited at:** 2026-08-16

---

## LIVE PAYMENT FORENSIC VERDICT

**WEBHOOK_ROUTING_FAILED**

Exact root cause: Stripe webhook endpoint is `https://homecheff.nl/api/stripe/webhook`. Middleware canonicalizes `.nl` → `.eu` with **HTTP 307**. Stripe does **not** follow redirects for webhook delivery. Event `checkout.session.completed` (`evt_1U55lY2KvmKfeN9t8wI5TEIP`) still shows `pending_webhooks: 1`. Settlement code (Order + `transfers.create`) never ran.

### Secondary latent P0 (proven, not yet hit on this payment)

Even after webhook delivery is fixed, `prisma.transaction.create` in `app/api/stripe/webhook/route.ts` omits required `reservationId` (`NOT NULL` + FK to `Reservation`). Dry-run create fails. Catch path returns **200 if Order already exists**, which permanently suppresses Stripe retries → historical pattern: Order `4d78e8bc-…` (Jan 2026) exists with **0** Transactions, **0** Payouts, **0** Stripe Transfers on the platform account.

---

## Phase A — Exact live deal

| Entity | Value |
|--------|-------|
| Proposal.id | `2b1f7626-941b-4bdb-8f95-6372a5fb41f0` |
| Proposal.status | `ACCEPTED` |
| Proposal.amountCents | `100` |
| Proposal.paymentPath | `HOMECHEFF_CHECKOUT` (in proposalSummary) |
| Agreement.id | `420e0c11-29bf-4b0c-bce6-b1f1d1641074` |
| CommunityOrder.id | `c71e774f-9b4c-4a59-ad53-98e40657287f` |
| CommunityOrder.status | `OPEN` |
| checkoutOrderId | **null** |
| Order.id | **NONE** |
| Transaction | **NONE** |
| Payout | **NONE** |

Product: Design Studio `fcc5ff2a-651a-4983-9d17-b3f1acf7ca17`  
Seller user: `7647bf21-e9ab-4e3a-af83-eeec23e24dcb`  
Buyer user: `c54bbbcf-1323-4539-8e30-c2a6b7f95662`

---

## Phase B — Stripe charge

| Field | Value |
|-------|-------|
| Checkout Session | `cs_live_b1nk3VYigeiF2dwMTDV4knrfPyJn9oqgB146ATA8vcAK6mfhNn4ZTZs69l` |
| PaymentIntent | `pi_3U55jB2KvmKfeN9t1qgoZzLL` |
| Charge/payment | `py_3U55jB2KvmKfeN9t1Qr93icB` |
| amount charged | **127** EUR cents |
| payment_status | paid / succeeded |
| livemode | true |
| transfer_group | **null** |
| metadata.communityOrderId | `c71e774f-9b4c-4a59-ad53-98e40657287f` |
| metadata.productsTotalCents | 100 |
| metadata.stripeFeeCents | 27 (buyer surcharge) |

Platform received the charge. Seller consideration ≠ buyer total.

---

## Phase C — Seller

| Field | Value |
|-------|-------|
| Canonical seller user | `7647bf21-e9ab-4e3a-af83-eeec23e24dcb` |
| Connect | `acct_1Sj52gRyMYBvOmov` |
| onboarding completed | true |
| charges_enabled / payouts_enabled / transfers | true / true / active |
| sellerPaymentsReady | **true** |

Derived from CommunityOrder → Proposal → Product.seller → User (not from currentUser/buyer/platform).

---

## Phase D/E — transfers.create

| Question | Answer |
|----------|--------|
| transfers.create expected? | Yes (PICKUP, Connect ready, sellerPayoutCents > 0) |
| transfers.create attempted? | **NO** |
| Transfer exists? | **NO** (Stripe `transfers.list` = 0 for platform; 0 to seller acct) |
| Branch | Webhook never entered settlement path |

---

## Phase F/J — Cents ledger (this payment)

| Line | Cents |
|------|------:|
| BUYER_GROSS_CENTS | 127 |
| SELLER_GROSS_CENTS | 100 |
| BUYER_PAYMENT_FEE_CENTS (surcharge) | 27 |
| STRIPE_PROCESSING_FEE_CENTS (actual) | **29** (`txn_3U55jB2KvmKfeN9t1jc7vGJ8`) |
| Seller platformFeeBps (no business sub) | **1200** (12%) |
| PLATFORM_FEE_CENTS (expected) | 12 |
| AFFILIATE_COMMISSION_CENTS | 0 |
| DELIVERY_PROVIDER_CENTS | 0 |
| SELLER_NET_CENTS (expected transfer) | **88** |
| Platform net after Stripe | 98 (pending + instant_available) |
| Platform retained if 88 transferred | 10 (=12 fee − 2 surcharge shortfall) |
| HELD_CENTS (escrow) | 0 (would be immediate transfer for PICKUP) |
| UNRECONCILED_CENTS (cash) | **0** using actual Stripe fee: 88+10+29=127 |

Buyer surcharge (27) ≠ actual Stripe fee (29). Difference (−2) would be borne by platform retention under current fee math.

Affiliate: none. Delivery: none.

---

## Phase G — CAPTURED-without-transfer

| Check | This €1 case |
|-------|----------------|
| Order financially captured in DB? | **No Order row** |
| Buyer charge captured in Stripe? | **Yes** |
| Seller financially settled? | **No** |
| Platform holding seller money? | **Yes** (~98¢ pending on platform) |
| Retry mechanism? | Stripe event retries while `pending_webhooks>0`; **no** safe app-level seller-transfer retry for this deal yet |
| Admin retry? | No dedicated safe recovery tool for this path |
| Idempotent safe retry? | Not yet — requires Order+Transaction+Payout state machine repair first |

Historical proof of swallow-on-partial-success: Jan Order exists, zero transfers ever.

---

## Phase H — No patch applied to financial state

Per contract: root cause proven; **no** automatic recovery of this €1; **no** manual transfer; **no** Dashboard change.

### Schema gate (STOP before migration)

To make `transfers.create` reachable after webhook delivery:

`Transaction.reservationId` is required, but marketplace checkout has **no** Reservation/Listing (`Listing` count = 0). Making `reservationId` optional (or replacing with orderItem-scoped settlement) needs a **schema migration**. Owner approval required before migration.

### Also required (non-schema)

1. Exempt `/api/stripe/webhook` from `.nl→.eu` middleware 307 (or point Stripe endpoint at `.eu` — Dashboard change forbidden in this task).
2. Fix webhook catch that returns **200 when Order exists after settlement failure** (prevents permanent CAPTURED-without-transfer).

**Do not** ship middleware-only unblock without (schema + catch fix): Stripe would create Order, fail Transaction, return 200, and freeze this €1 into the worse state.

---

## Phase J — This €1 recovery

| Question | Answer |
|----------|--------|
| existing transfer found? | **NO** |
| safe to retry transfer now? | **NO** |
| idempotency proof | N/A — no `tr_` / Payout.providerRef |
| expected destination | `acct_1Sj52gRyMYBvOmov` |
| expected amount | **88** cents |

Await explicit owner approval before any financial mutation.

---

## Recipient table

| RECIPIENT | ROLE | AMOUNT CENTS | STRIPE DESTINATION | TRANSFER ID | STATUS |
|-----------|------|-------------:|--------------------|-------------|--------|
| Seller | seller net | 88 expected / 0 actual | acct_1Sj52gRyMYBvOmov | — | NOT_ATTEMPTED |
| HomeCheff | platform fee residual | 10 expected after transfer | platform balance | n/a | HOLDING full 98 net |
| Stripe | processing | 29 | n/a | txn_…jc7vGJ8 | TAKEN |
| Affiliate | — | 0 | — | — | N/A |
| Courier | — | 0 | — | — | N/A |

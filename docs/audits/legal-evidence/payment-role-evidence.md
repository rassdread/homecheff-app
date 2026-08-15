# Payment Role — Factual Evidence Pack

**Legal MoR / PSD2 conclusion:** `COUNSEL_REQUIRED` (not made here)  
**Stripe architecture label (technical):** SEPARATE_CHARGES_AND_TRANSFERS without `on_behalf_of` on live Checkout path — `PROVEN_FROM_CODE`

---

## B1 — Stripe implementation reconfirmed (main `bd6db78a`)

| Element | Finding | Code reference | Class |
|---|---|---|---|
| Checkout Session creation | Platform `stripe.checkout.sessions.create` — `mode: payment`; **no** `payment_intent_data.transfer_data`, **no** `application_fee_amount`, **no** `on_behalf_of` | `app/api/checkout/route.ts` ~921–937 | `PROVEN_FROM_CODE` |
| PaymentIntent ownership | Created by platform Checkout on **platform** Stripe account | same | `PROVEN_FROM_CODE` |
| Charge account | Platform account | Checkout without Connect destination charge | `PROVEN_FROM_CODE` |
| Transfer destination | Seller Express Connect `stripeConnectAccountId` | webhook `transfers.create` ~1710–1725 | `PROVEN_FROM_CODE` |
| Transfer timing | Immediate for non-shipping; delayed via `PaymentEscrow` for shipping until DELIVERED | webhook + `lib/releaseEscrowOnDelivered.ts` | `PROVEN_FROM_CODE` |
| Fee handling | Retain by transferring **less** (`sellerPayoutCents = itemTotal - platformFee - sms`) | webhook ~1612–1636 | `PROVEN_FROM_CODE` |
| `transfer_group` | `order_{orderId}` | webhook ~1714 | `PROVEN_FROM_CODE` |
| `application_fee` on live Checkout | **Unused** | checkout comment ~824–825; helper exists but not called on this path | `PROVEN_FROM_CODE` |
| `transfer_data` on live Checkout | **Unused** | `createConnectPaymentIntent` in `lib/stripe.ts` is alternate/unused path | `PROVEN_FROM_CODE` |
| `on_behalf_of` | **No usage** found on Checkout/transfer path | repo search | `PROVEN_FROM_CODE` |
| Connect account type | Default **Express** | `lib/stripe.ts` `createConnectAccount` | `PROVEN_FROM_CODE` |
| Refund path | Admin `stripe.refunds.create` on PaymentIntent; DB `Refund` row; **no** automatic transfer reversal in admin refund | `app/api/admin/refunds/route.ts` | `PROVEN_FROM_CODE` |
| Transfer reversal path | Webhook listens `transfer.reversed` → DB refund-ish + seller notify | webhook ~537–613 | `PROVEN_FROM_CODE` (reactive) |
| Dispute path | `charge.dispute.created` → affiliate commission reversal primarily | webhook ~391+ | `PROVEN_FROM_CODE` |

**Technical Stripe role (Stripe docs sense):** platform is charge merchant / settlement account; sellers receive transfers later.  
**Civil-law seller / MoR of underlying goods:** `COUNSEL_REQUIRED` — do **not** infer from SCT alone.

---

## B2 — Stripe Dashboard

See [stripe-dashboard-checklist.md](./stripe-dashboard-checklist.md).  
**Dashboard evidence available in repo?** **NO** — `MANUAL_DOCUMENT_REQUIRED` / `PROVEN_FROM_STRIPE` pending.

---

## B3 — Buyer payment experience

| Signal | Evidence | Class |
|---|---|---|
| Seller named on listing | Product/seller profile UI | `PROVEN_FROM_CODE` |
| Checkout handoff | Redirect to Stripe Hosted Checkout | `PROVEN_FROM_CODE` |
| Line items include product names + optional “Bezorgkosten — {provider}” + “Transactiekosten (Stripe)” | checkout route | `PROVEN_FROM_CODE` |
| Actual Stripe Checkout merchant name / statement | **Not safely inspected** without controlled payment | `CONTROLLED CHECKOUT FIXTURE REQUIRED` |
| Terms links on site | Present (`/terms`) | `PROVEN_FROM_PRODUCTION` (prior probes) |

---

## B4 — Receipt / card statement

| Item | Result |
|---|---|
| Controlled receipt in repo/tests | **Not found** as archived live receipt artifact |
| Statement descriptor in code | **Not set** in Checkout session params | `PROVEN_FROM_CODE` (absence) |
| Conclusion | `MANUAL STRIPE DASHBOARD OR CONTROLLED PAYMENT EVIDENCE REQUIRED` |

---

## B5 — Seller payout wording (factual)

From `public/i18n/nl.json` seller revenue strings (`PROVEN_FROM_CODE`):

- Net may remain in “reservering (**escrow**)” until delivered/picked up
- Payments of completed orders “al naar je **Stripe Connect**-account overgemaakt”
- Payout request → bank via Stripe
- Escrow release hint for shipping orders
- FAQ EN: “Payment is held in **escrow**” / “Escrow protection for shipping”

**Seller-reasonable understanding (descriptive, not legal):**

- Buyer paid via HomeCheff/Stripe Checkout
- Platform holds then transfers to Connect
- Entitlement timing depends on delivery/shipping
- Platform can withhold until DELIVERED (shipping)

→ Legal characterisation of that relationship: `COUNSEL_REQUIRED`

---

## B6 — Refund evidence matrix

| Scenario | Status | Notes |
|---|---|---|
| Refund before transfer | `PARTIAL` | Possible in principle if admin refunds PI before transfer completes; **no dedicated branch** proven |
| Refund after transfer | `PARTIAL` | Stripe refund on PI implemented; **seller clawback / transfer reversal not automatic** in admin refund |
| Partial refund | `IMPLEMENTED` (Stripe amount param) | Admin can pass `amountCents` |
| Full refund | `IMPLEMENTED` | Same path |
| Who triggers | Admin (primary) | `PROVEN_FROM_CODE` |
| Transfer reversed on refund? | `NOT_IMPLEMENTED` as automatic on admin refund | `transfer.reversed` only if Stripe/reversal occurs separately |
| Seller balance adjusted | `PARTIAL` / `UNKNOWN` in app ledger | Connect balance side-effects are Stripe-side |
| HomeCheff bears shortfall | `UNKNOWN` / ops fact | Depends on timing + Stripe balances — `USER/OWNER_CONFIRMATION` + Stripe |
| Platform fee on refund | `PARTIAL` | Fee not systematically returned in code path audited |
| Delivery fee on refund | `UNKNOWN` / `PARTIAL` | Needs case-by-case |

---

## B7 — Chargeback / dispute

| Item | Result |
|---|---|
| `charge.dispute.created` | Handled — affiliate reversal focus | `PROVEN_FROM_CODE` |
| `charge.dispute.updated` / `.closed` | **Not found** as dedicated handlers | `NOT_IMPLEMENTED` / `UNKNOWN` |
| Account receiving dispute | Platform charge account (architecture) | `PROVEN_FROM_CODE` (inferred from charge locus) |
| DB dispute store | No dedicated Dispute model found | `UNKNOWN` / absent |
| Admin UI for disputes | Limited / financial admin — not full dispute desk | `PARTIAL` |
| Seller notification (dispute) | Not proven as dedicated dispute notify | `UNKNOWN` |
| Fund recovery / clawback | Incomplete vs transfers | `PARTIAL` |
| Affiliate reversal | Implemented on dispute created | `IMPLEMENTED` |
| Courier impact | Not proven | `UNKNOWN` |
| Negative balance / reserve | Not coded as first-class product feature | `UNKNOWN` — Stripe Dashboard |

---

## B8 — Invoice evidence

| Question | Answer | Class |
|---|---|---|
| Buyer marketplace sales invoice (VAT) | **No** HomeCheff VAT sales invoice engine found | `PROVEN_FROM_CODE` (absence) |
| Seller commission invoice | **No** dedicated commission invoice PDF | absence |
| Stripe receipt only? | Likely primary buyer document | `PROVEN_FROM_STRIPE` pending confirmation |
| Subscription invoice | Stripe Billing `invoice.paid` path for **subscriptions** | `PROVEN_FROM_CODE` — separate from marketplace sales |
| Whose VAT on marketplace receipt | **UNKNOWN** until Dashboard/receipt inspected | |
| Named supplier on receipt | **UNKNOWN** | |

---

## B9 — Delivery contract / courier independence

| Signal | Evidence | Class |
|---|---|---|
| Courier named in checkout line | `Bezorgkosten — {providerDisplayNameSnapshot}` | `PROVEN_FROM_CODE` |
| FAQ: bezorger = zelfstandige ondernemer; HomeCheff niet werkgever | nl.json FAQ | `PROVEN_FROM_CODE` |
| “onze bezorger” as employer claim | Not established as SSOT employer language; still search ambiguity | `PARTIAL` — review flag |
| Tariff | Platform pricing + provider quote snapshot | `PROVEN_FROM_CODE` |
| Buyer/seller selection | Named provider selection exists (feature-flagged) | `PROVEN_FROM_CODE` |
| HomeCheff guarantee of delivery | FAQ disclaims delivery responsibility | `PROVEN_FROM_CODE` |
| Conflict risk | Public “escrow protection” + platform fee split may look principal-like | `COUNSEL_REQUIRED` wording |

---

## B10 — Public “escrow” wording

| Layer | Uses “escrow”? |
|---|---|
| Internal model `PaymentEscrow` | YES — technical | `PROVEN_FROM_CODE` |
| Seller i18n (`netIncludesEscrow`, etc.) | YES — user-facing NL | `PROVEN_FROM_CODE` |
| FAQ EN shipping | YES — “held in escrow” | `PROVEN_FROM_CODE` |
| Marketplace ops parity script | Forbids word `escrow` in some surfaces | `PROVEN_FROM_CODE` (inconsistent discipline) |

**Flag:** public escrow language → **legal wording review** (`COUNSEL_REQUIRED`).  
Do not “fix” in this evidence phase.

---

## B11 — Terms 1.1 factual consistency (no rewrite)

| Clause theme | Factual implementation | Status |
|---|---|---|
| HomeCheff platform / “geen partij in transacties” | Charge settles on platform; transfers later; admin refunds | **AMBIGUOUS** / possible **CONFLICT** with payment fact pattern → `COUNSEL_REQUIRED` |
| Payments / Stripe | Platform Checkout + Connect transfers | **AMBIGUOUS** vs “not party” |
| Fees | Platform retains fee by short transfer | CONSISTENT with fee model; legal role open |
| Refunds | Admin-triggered Stripe refunds; incomplete clawback | **AMBIGUOUS** |
| Delivery | Independent courier copy + platform fee split | **AMBIGUOUS** |
| Disputes | Platform mediates; chargebacks on platform account | **AMBIGUOUS** / `COUNSEL_REQUIRED` |
| Professional seller | LEGAL-1 self-declaration | Separate axis — CONSISTENT with LEGAL-1 design |
| Consumer withdrawal | LEGAL-3 context | Separate — not payment-role |

Terms version in code: `lib/legal/document-versions.ts` (LEGAL-4A freeze — unchanged this phase).

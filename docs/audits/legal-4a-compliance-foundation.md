# LEGAL-4A — Compliance foundation + DSA SME gate + DAC7 readiness

**Phase:** LEGAL-4A  
**Mode:** CONNECT / DERIVE / VERIFY / GATE (not rebuild)  
**Baseline main (before):** `d100d6fdb14ff6099f88ab4953b9cd4cf6a01b5a`  
**Baseline production (before):** `dpl_GcE7yUfMppBmFSdJP5J6HP6EACr5`

---

## ALREADY BUILT

| Capability | Status | Location |
|---|---|---|
| User identity | ALREADY_EXISTS | `User` |
| SellerProfile | ALREADY_EXISTS | `SellerProfile` |
| Business (+ `verified`) | PARTIAL — read existed; true-write path was dormant | `Business` |
| commerceDeclaration | ALREADY_EXISTS | LEGAL-1 |
| Food / allergens | ALREADY_EXISTS | LEGAL-2 |
| Consumer / withdrawal | ALREADY_EXISTS | LEGAL-3 |
| Integrity / contribution | ALREADY_EXISTS | TRUST-1 / 1.1 |
| Stripe Connect IDs | ALREADY_EXISTS | `User.stripeConnectAccountId` |
| Order / Transaction / Refund / Payout / PaymentEscrow | ALREADY_EXISTS | money truth |
| Admin financial tools | ALREADY_EXISTS | `FinancialManagement` |
| Notification model | ALREADY_EXISTS | `Notification` |
| CSV / export | ALREADY_EXISTS | admin financial exports |
| Dormant `User.iban` | DORMANT — not revived for DSA | freeze |

---

## REUSED

- Separate compliance axes (LEGAL-1/2/3, TRUST, Stripe) — not collapsed into `isCompliant`
- OrderItem + Product taxonomy for DAC7 activity class
- Transaction + Refund for refund reconciliation evidence
- Existing admin financial surface (new **Compliance** sub-tab only)
- Existing Business.verified boolean (metadata fields added; no second verified flag)
- Existing identity fields for readiness scoring

---

## EXTENDED

- `Business.verifiedAt` / `verifiedNote` / `verifiedByUserId` — factual admin verification only
- Admin financial UI: Compliance sub-tab → `ComplianceFoundationPanel`
- `POST /api/admin/compliance` — DSA assessment + Business.verified write path

---

## NEW

| Item | Purpose |
|---|---|
| `lib/compliance/*` | Axes, DSA gate, DAC7 classify/threshold/derive/readiness, refunds, identity, article30 coverage, notification prep |
| `CompliancePlatformAssessment` | Singleton DSA applicability assessment (no PII) |
| `GET/POST /api/admin/compliance` | Internal report + reviewed DSA state |
| `scripts/validate-legal-4a-compliance-foundation.ts` | Deterministic matrix |
| `docs/audits/legal-4a-dsa-sme-article29-evidence.md` | Art.29 evidence notes |

---

## NOT BUILT

- Full DSA Article 30 trader onboarding / ID copies / BSN / TIN / new IBAN collection
- Automatic legal SME conclusion from runtime metrics
- DAC7 XML reporting / filing
- Seller tax onboarding UX during listing create
- HomeCheff wallet / stored balances / HCP-as-money
- Stripe architecture migration
- Second transaction / refund / identity ledger
- Mega-booleans (`isBusiness`, `isCompliant`, `isTaxable`, …)
- Payment-role Terms rewrite
- Privacy bump (no new local PII collected in this phase)
- Live notifications for DAC7/compliance (prepared constants only; send disabled)

---

## COUNSEL_REQUIRED

- Whether HomeCheff is civil-law seller / MoR of underlying goods/services despite Stripe SCT without `on_behalf_of`
- PSD2 / DNB authorisation vs commercial-agent exclusion
- Exact DAC7 identity field set for NL platform operators (TIN/BSN etc.)
- DAC7 valuation of BARTER_ONLY / barter leg of MONEY_AND_BARTER
- Refund / chargeback / invoice / VAT role allocation wording in Terms
- When ARTICLE_30_APPLIES becomes mandatory for HomeCheff (post-SME / VLOP / 12-month rules)

---

## DSA SME STATUS

Representation: `CompliancePlatformAssessment.dsaApplicabilityState`

States: `NOT_ASSESSED` | `SME_EXCLUSION_EXPECTED` | `ARTICLE_30_APPLIES` | `COUNSEL_REVIEW_REQUIRED`

**Default / current reviewed state until admin records otherwise:** `NOT_ASSESSED`

Automatic legal SME conclusion: **NO**

Article 30 full onboarding in this phase: **NO** (only required when state is `ARTICLE_30_APPLIES`; even then LEGAL-4A only checks existing reusable fields)

See: `docs/audits/legal-4a-dsa-sme-article29-evidence.md`

---

## DAC7 READINESS

- Activity: taxonomy → `GOODS` / `PERSONAL_SERVICE` / `OTHER_NON_REPORTABLE_OR_REVIEW` (DESIGN → review)
- Goods exclusion: **both** `< 30` activities **and** net ≤ €2,000 — **not** applied to personal services
- Money source: Stripe-backed Order items (non-pending/cancelled) + Transaction CAPTURED/REFUNDED + Refund rows
- CommunityOrder / unpaid proposals: not monetary consideration
- Free / VOLUNTARY / €0: not consideration unless captured money exists
- BARTER_ONLY: non-monetary + counsel valuation flag
- Readiness labels are internal (admin) — not buyer-facing tax verdicts

---

## PAYMENT ROLE UNCHANGED

Stripe remains SEPARATE_CHARGES_AND_TRANSFERS without `on_behalf_of`. No checkout / transfer / wallet changes in LEGAL-4A.

---

## DATA MINIMISATION

No new sensitive identity collection. Missing future legal IDs marked `COUNSEL_REQUIRED_FIELD`. Dormant IBAN not revived for DSA. Privacy document not bumped (no new local PII).

---

## REMAINING LEGAL QUESTIONS

1. MoR / seller-of-record civil-law meaning  
2. PSD2 scope  
3. DAC7 reportable identity package for NL  
4. Barter valuation  
5. When to flip DSA state from SME exclusion to Article 30  
6. Notification legal triggers for sellers  

**Stop after LEGAL-4A** — do not auto-start LEGAL-4B / LEGAL-5.

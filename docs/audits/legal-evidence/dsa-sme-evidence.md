# DSA SME / Article 29 — Size Evidence Pack

**Evidence verdict (this file):** `DSA_SME_EVIDENCE_INCOMPLETE`  
**Persisted product state:** still `NOT_ASSESSED` (not mutated)

Canonical legal sources used for thresholds (not remembered):

- Commission Recommendation **2003/361/EC** (EUR-Lex CELEX `32003H0361`)
- Regulation (EU) **2022/2065** (DSA) **Article 29** (Section 4 exclusion for micro/small)

---

## A1 — Legal entity operating HomeCheff

| Field | Value | Classification |
|---|---|---|
| Legal name | Arrias Beheer B.V. | `PROVEN_FROM_CODE` — `lib/seo/organization-identity.ts` `LEGAL_OPERATOR` |
| Brand vs operator | HomeCheff = brand; Arrias Beheer B.V. = legal operator | `PROVEN_FROM_CODE` |
| KvK | `80532829` | `PROVEN_FROM_CODE` (same SSOT); live KvK.nl fetch **failed** this session → `PROVEN_FROM_PUBLIC_REGISTRY` **not reconfirmed today** |
| VAT | `NL861704782B01` | `PROVEN_FROM_CODE` |
| Locality | Vlaardingen | `PROVEN_FROM_CODE` |
| Country | NL | `PROVEN_FROM_CODE` |
| Legal form | B.V. (from name) | `PROVEN_FROM_CODE` (name only); full articles of association = `MANUAL_DOCUMENT_REQUIRED` |
| Founder (name/role) | Sergio Arrias / Founder | `PROVEN_FROM_CODE` — not ownership % |
| Operator relationship | i18n / Terms: platform uitgevoerd door Arrias Beheer B.V. | `PROVEN_FROM_CODE` / public copy |
| Other operating entities | **Not proven absent** | `OWNER_DOCUMENT_REQUIRED` / `INSUFFICIENT_EVIDENCE` |

KvK search URL referenced in code: `https://www.kvk.nl/zoeken/?q=80532829` (`VERIFIED_SAME_AS`). Automated fetch returned error page → treat registry live confirmation as pending.

---

## A2 — Enterprise relationship / group structure

| Question | Result | Classification |
|---|---|---|
| Parent / subsidiary / sister / holding in repo | **None found** | `UNKNOWN` (absence in repo ≠ absence in law) |
| Ownership percentages | **Not in repo** | `OWNER_DOCUMENT_REQUIRED` |
| Voting rights / controlling persons | **Not in repo** | `OWNER_DOCUMENT_REQUIRED` |
| Partner / linked enterprises analysis | **Cannot be completed** | `INSUFFICIENT_EVIDENCE` |
| Consolidated accounts | **Not in repo** | `MANUAL_DOCUMENT_REQUIRED` |

**Structure classification:** `INSUFFICIENT_EVIDENCE`  
(Do **not** record `INDEPENDENT_ENTERPRISE` without owner shareholding + accountant confirmation.)

---

## A3 — Employees / FTE

| Item | Result |
|---|---|
| NUMBER OF EMPLOYEES PROVEN | **0 proven** (no payroll/HR source in repo) |
| AWU / FTE data available? | **NO** |
| Director/DGA treatment needs review? | **YES** — DGA/director AWU treatment is `COUNSEL_REQUIRED` + accountant |
| Contractors found? | Platform sellers/couriers/affiliates exist as **users**, not company employees — do **not** count as staff headcount |
| Evidence source | N/A in repo |
| Reference period | N/A |

→ `MANUAL PAYROLL/ANNUAL-ACCOUNTS EVIDENCE REQUIRED`

---

## A4 — Financial size evidence

| Year | Net turnover evidence | Balance-sheet total | Source | Confidence |
|---|---|---|---|---|
| Latest closed (likely 2024 or company boekjaar) | **NONE in repo** | **NONE** | — | — |
| Preceding year | **NONE** | **NONE** | — | — |
| 2026 YTD Stripe/GMV | Must **not** be treated as Arrias Beheer net turnover | N/A | Stripe/Order GMV | Wrong proxy |

Rules applied (factual, not legal conclusion):

- Marketplace GMV ≠ company turnover (`PROVEN_FROM_CODE` architecture + accounting principle noted)
- Platform fee retention ≠ automatically “net turnover” without accounts
- Stripe volume ≠ company turnover

→ `MANUAL ANNUAL ACCOUNTS REQUIRED`

---

## A5 — Reference years

| Item | Status |
|---|---|
| Book year end date | `USER/OWNER_CONFIRMATION_REQUIRED` (calendar vs other) |
| Latest closed financial year | `MANUAL_DOCUMENT_REQUIRED` |
| Preceding financial year | `MANUAL_DOCUMENT_REQUIRED` |
| Current provisional year | Useful for ops, **not** alone for SME closed-year proof |
| Multi-period / Art.4(2) loss of status | Relevant under DSA Art.29 + Rec. 2003/361 Art.4(2) — `COUNSEL_REQUIRED` once numbers exist |

Do **not** classify from incomplete 2026 alone.

---

## A6 — Micro / small threshold comparison table

Source: Recommendation **2003/361/EC** Art.2 Annex (EUR-Lex).

### Micro

| Criterion | Legal threshold | HomeCheff / Arrias evidence | PASS / FAIL / UNKNOWN | Source |
|---|---|---|---|---|
| Staff headcount (AWU) | < 10 | No proven headcount | **UNKNOWN** | Rec. 2003/361 |
| Annual turnover **or** balance sheet | ≤ EUR 2m (either) | No accounts | **UNKNOWN** | Rec. 2003/361 |
| Linked/partner aggregation | Required if applicable | Structure unknown | **UNKNOWN** | Rec. 2003/361 Arts.3–6 |

### Small (Art.29 ceiling — micro **or** small qualify)

| Criterion | Legal threshold | Evidence | Result | Source |
|---|---|---|---|---|
| Staff | < 50 | Unknown | **UNKNOWN** | Rec. 2003/361 |
| Turnover and/or balance sheet | ≤ EUR 10m | Unknown | **UNKNOWN** | Rec. 2003/361 |
| Linked/partner aggregation | Required if applicable | Unknown | **UNKNOWN** | Rec. 2003/361 |

**No legal SME conclusion issued** — required components remain UNKNOWN.

---

## A7 — Other Article 29 factual conditions

| Condition | Evidence | Classification |
|---|---|---|
| Online platform allowing consumers↔traders distance contracts | HomeCheff marketplace + Checkout | `PROVEN_FROM_CODE` / product |
| VLOP designation (Art.33) | No designation evidence found in repo; HomeCheff not known as designated VLOP | `USER/OWNER_CONFIRMATION_REQUIRED` to affirm “not designated”; not proven from Commission list in this session |
| Previously crossed SME threshold | No accounts → unknown | `UNKNOWN` |
| Date status could have changed | Unknown | `UNKNOWN` |
| 12-month post-loss period | Text in DSA Art.29; applicability dates need counsel once size known | `COUNSEL_REQUIRED` |
| “Exempt forever” | Explicitly rejected in LEGAL-4A docs | `PROVEN_FROM_CODE` (policy stance) |

---

## A8 — DSA size evidence verdict

**`DSA_SME_EVIDENCE_INCOMPLETE`**

Recommended **human** assessment state **after** owner docs + counsel/accountant review (not applied):

- If micro/small + not VLOP + aggregation OK → consider recording `SME_EXCLUSION_EXPECTED`
- If medium+ or VLOP or aggregation fails → `ARTICLE_30_APPLIES` or `COUNSEL_REVIEW_REQUIRED`
- Until then keep **`NOT_ASSESSED`**

Production must **not** be flipped in this phase.

# LEGAL-4A — DSA Article 29 SME evidence (internal)

**Status:** Internal audit note — not a legal opinion.  
**LEGAL-4A.1 update:** Size evidence reassessment lives in `docs/audits/legal-evidence/dsa-sme-evidence-4a1-reassessment.md` (recommended `SME_EXCLUSION_EXPECTED`; production state not auto-flipped).  
**Related code:** `lib/compliance/dsa-applicability.ts`, `CompliancePlatformAssessment`

---

## Why Article 29 may exclude HomeCheff from Section 4

DSA Article 29 provides an exclusion from the Section that contains Article 30 trader-traceability obligations for providers that qualify as **micro or small enterprises** under Recommendation 2003/361/EC, subject to the Regulation’s exceptions (including VLOP status and post-status rules).

This is a **gate**, not a permanent exemption claim.

HomeCheff must **not** hard-code a permanent Art.29 exclusion.

---

## What evidence is required to establish micro/small status

Counsel / admin review should retain (outside this app or referenced by note id):

- Headcount (FTE) evidence for the relevant accounting period(s)
- Annual turnover and/or balance-sheet total vs Recommendation 2003/361/EC thresholds
- Corporate structure / linked-enterprise analysis if applicable
- Date of assessment and who reviewed it

The platform assessment row stores only:

- `dsaApplicabilityState`
- `assessedAt`
- `assessmentNote` (basis reference — **no sensitive PII**)
- optional `reviewDueAt`

Runtime product metrics alone must **not** auto-set legal SME status.

---

## What would cause reassessment

- Crossing Recommendation 2003/361/EC thresholds (size)
- Designation as VLOP / VLOSE (or equivalent DSA status that removes the exclusion)
- Material change in platform role or corporate group
- Counsel instruction
- Scheduled `reviewDueAt`

---

## 12-month post-loss rule

When micro/small status is lost, DSA rules around continued application / delayed loss of the exclusion (commonly discussed as a **12-month** post-loss effect in secondary guidance) must be confirmed with counsel before flipping `SME_EXCLUSION_EXPECTED` → `ARTICLE_30_APPLIES` or clearing exclusion.

Do not encode a silent automatic flip in product code without counsel-confirmed dates.

---

## VLOP exception

Article 29 exclusion does **not** apply in the same way once VLOP (or other carved-out) status applies. Treat any VLOP trajectory as `COUNSEL_REVIEW_REQUIRED` until confirmed.

---

## Operational states (product)

| State | Meaning |
|---|---|
| `NOT_ASSESSED` | No reviewed assessment recorded |
| `SME_EXCLUSION_EXPECTED` | Reviewed expectation that Art.29 exclusion applies — **no** full Art.30 pack required |
| `ARTICLE_30_APPLIES` | Reviewed that Section 4 / Art.30 obligations apply — architecture may check **existing** fields first |
| `COUNSEL_REVIEW_REQUIRED` | Ambiguity / size change / VLOP risk |

Automatic legal SME conclusion from code: **forbidden**.

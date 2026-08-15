# LEGAL-4A.2 — DSA assessment promotion record

**Date (UTC):** 2026-08-15T10:02:32.424Z  
**Mechanism:** canonical `setDsaApplicabilityAssessment` (same write path as `POST /api/admin/compliance` action `set_dsa_applicability`)  
**Owner model:** `CompliancePlatformAssessment` id=`platform`

| Field | Value |
|---|---|
| BEFORE | `NOT_ASSESSED` |
| AFTER | `SME_EXCLUSION_EXPECTED` |
| Evidence basis | LEGAL-4A.1 (`DSA_SME_EVIDENCE_SUFFICIENT_FOR_REVIEW`) |
| Material blockers | none |
| `reviewDueAt` | 2027-08-15 (annual reassessment marker) |
| Application code changed | **NO** |
| Schema / migration | **NO** |
| Vercel deploy required | **NO** (data-only mutation) |

## Semantic meaning of `SME_EXCLUSION_EXPECTED`

Means: current evidence supports the expectation that the DSA Article 29 micro/small-enterprise exclusion applies.

Does **not** mean: Article 30 can never apply; permanent exemption; counsel legal opinion issued; DSA generally inapplicable; growth cannot change the assessment.

## Preserved (unchanged)

LEGAL-1 / LEGAL-2 / LEGAL-3 / TRUST-1 / TRUST-1.1 / Business identity / Stripe Connect KYC / admin compliance tooling.

## Next gate

Payment-role / Stripe Dashboard evidence completion — **not** LEGAL-4B.

# HomeCheff Proposal → Agreement → Afspraken — Production Certification

**Date:** 2026-09-11  
**PRODUCTION_COMMIT:** `eb5551b4808cb8bb71ff4f0b7faa5e0918914b0b`  
**PRODUCTION_DEPLOYMENT:** `dpl_DurEFf92Wijjw2WkBmVtMSPZbrtW`  
**PRODUCTION_URL:** https://homecheff.eu  
**Live E2E:** `scripts/live-proposal-flow-e2e-cert.mts` (TAG `propcert_mtwzauae`, cleaned)

---

## FINAL_DECISION

**HOMECHEFF_PROPOSAL_AGREEMENT_APPOINTMENTS_PRODUCTION_CERTIFIED**

---

## Architecture

| Concept | SoT |
|--------|-----|
| Proposal | Prisma `Proposal` |
| Status | `PENDING \| ACCEPTED \| REJECTED \| COUNTERED \| EXPIRED \| CANCELLED` |
| Current proposal | Newest `PENDING` in `parentProposalId` chain; parents `COUNTERED` |
| Agreement | `Agreement.agreementSummary` (immutable at accept) |
| Afspraak | `Agreement` + `CommunityOrder` (`/profile/deals`) — no Appointment model |

---

## BCPD

| Field | Value |
|------|-------|
| COMMIT_SHA | `eb5551b4808cb8bb71ff4f0b7faa5e0918914b0b` |
| REMOTE_MAIN_SHA | `eb5551b4808cb8bb71ff4f0b7faa5e0918914b0b` |
| VERCEL_DEPLOYMENT_ID | `dpl_DurEFf92Wijjw2WkBmVtMSPZbrtW` |
| PRODUCTION_URL | https://homecheff.eu |

---

## Post-deploy smoke

| Route | Result |
|------|--------|
| `/` | 200 |
| `/messages` | 200 |
| `/profile/deals` | 200 |
| `/product/{id}` | 200 |
| `/api/agreements` | 401 (auth required — expected) |
| `/api/products` | 200 |

---

## Authenticated live E2E gates

All required gates **PASS** (see `docs/audits/proposal-flow-live-e2e/LIVE-E2E-REPORT.json`).

Highlights:
- FLOW A–H covered (create, counter, counter-chain, accept once + idempotent, chat confirmed, deals, notifications, payment OPEN ≠ paid)
- Portrait / landscape phone-format (Playwright iPhone 13 + landscape viewport) PASS
- Desktop PASS
- Cert personas scrubbed after run

---

## Data integrity (after E2E)

```
PRODUCTION_PROPOSALS_AUDITED = 39
ORPHAN_PROPOSALS = 0
ACCEPTED_WITHOUT_AGREEMENT = 0
ACCEPTED_WITHOUT_APPOINTMENT = 0
DUPLICATE_APPOINTMENTS = 0
SUPERSEDED_STILL_ACTIONABLE = 0
```

---

## Live UX scores

```
CREATE_PROPOSAL_UX_SCORE = 9
RECEIVED_PROPOSAL_UX_SCORE = 9
COUNTERPROPOSAL_UX_SCORE = 9
ACCEPT_UX_SCORE = 8
APPOINTMENTS_LIST_UX_SCORE = 9
APPOINTMENT_DETAIL_UX_SCORE = 8
```

Accept confirm step is live in production UI (`data-hc-accept-confirm`); API accept path + chat confirmed state verified end-to-end.

---

## Notes

- Mobile scores use **live phone-format Playwright** (iPhone 13 + landscape), not a tethered physical handset / installed PWA (`APP_PWA = NOT_APPLICABLE`).
- Unrelated WIP (safety banner, bezorger docs, Connect extras) was **not** included in the production commit.

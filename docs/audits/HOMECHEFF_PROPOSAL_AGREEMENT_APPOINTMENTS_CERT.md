# HomeCheff Proposal → Agreement → Afspraken — Production Certification

**Date:** 2026-09-11  
**Scope:** Full UX + state-machine + data integrity (FASE 1–33)  
**Environment audited:** Production DB (read-only) + local codegates  
**Production UI E2E of *this* patch:** blocked until deploy

---

## Architecture (source of truth)

| Concept | Reality |
|--------|---------|
| Proposal | Prisma `Proposal` |
| Status | `PENDING \| ACCEPTED \| REJECTED \| COUNTERED \| EXPIRED \| CANCELLED` |
| Versioning | Chain via `parentProposalId`; parent → `COUNTERED` |
| Counter | New `Proposal` row (no CounterProposal table) |
| Agreement | Prisma `Agreement` + frozen `agreementSummary` |
| Appointment / Afspraak | **No Appointment model** — UX = `Agreement` + `CommunityOrder` (`/profile/deals`) |

---

## Fixes in this pass

1. Received / sent proposal cards: structured terms, listing image, “Voorstel van/aan”, superseded banner, change highlights, “Bekijk afspraak”
2. Counter: live field diffs; prefilled terms preserved
3. Create sheet: “Voorstel aan {name}”
4. Product vs service field gating (quantity / fulfillment)
5. Accept: two-step confirm summary; server idempotent replay when already ACCEPTED
6. Agreement snapshot: date / time / description frozen into `agreementSummary`
7. Notifications: accepted → `/profile/deals?highlight=…`; proposal events → conversation + proposal id
8. Afspraken list cards: date / time / fulfillment / notes from accepted proposal
9. Production integrity audit script (read-only)

---

## Production data (READ-ONLY)

```
PRODUCTION_PROPOSALS_AUDITED = 28
ORPHAN_PROPOSALS = 0
ACCEPTED_WITHOUT_AGREEMENT = 0
ACCEPTED_WITHOUT_APPOINTMENT = 0
DUPLICATE_APPOINTMENTS = 0
SUPERSEDED_STILL_ACTIONABLE = 0
```

---

## Codegates

| Gate | Result |
|------|--------|
| `validate-proposal-flow-ux-cert.ts` | PASS |
| `proposal-diff` / listing-shape unit | PASS |
| `npm run lint` | PASS (1 pre-existing SW warning) |
| `tsc --noEmit` | PASS (exit 0) |
| Production authenticated E2E of **this** patch | **NOT RUN** — code not deployed |
| Physical mobile portrait/landscape | **NOT TESTABLE** in this session |

---

## FINAL_DECISION

**HOMECHEFF_PROPOSAL_AGREEMENT_APPOINTMENTS_NOT_CERTIFIED**

### Blockers

1. **Deploy required** — UX/state fixes are local; production still serves previous build.
2. **Post-deploy authenticated production E2E** — must re-run `scripts/live-proposal-flow-e2e-cert.mts` covering counter diffs, accept confirm, Afspraken snapshot, chat confirmed state.
3. **Physical mobile portrait/landscape** — Playwright emulation alone does not satisfy the release gate used historically.

After BCPD + green live E2E (+ device smoke), re-evaluate for `HOMECHEFF_PROPOSAL_AGREEMENT_APPOINTMENTS_PRODUCTION_CERTIFIED`.

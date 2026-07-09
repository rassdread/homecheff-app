# Phase 13G — Pilot Readiness & Operational Excellence

**Status:** Complete (audit-only)  
**Date:** 2026-07-09  
**Pilot geography:** Vlaardingen · Schiedam · Rotterdam (Rijnmond)

## Objective

Final pre-pilot assessment: no new features, no IA redesign. Verify completeness, polish, consistency, and production readiness across all existing surfaces.

## Deliverables

| Artifact | Path |
|----------|------|
| Audit (Parts 1–11) | `docs/audits/PILOT_READINESS_PHASE13G_AUDIT.md` |
| Validator | `scripts/validate-pilot-readiness-phase13g.ts` |

## Founder verdict

**🟡 Ready with acceptable risks**

Core marketplace, checkout, orders, barter/proposals, seller/affiliate/delivery ops, and Founder Control Center are sufficient to launch a **founder-supervised** Rijnmond pilot tomorrow — provided Stripe production keys, webhook, and `prisma migrate deploy` are confirmed.

**Acceptable risks:** pilot funnel telemetry gaps (honest `not tracked` in Command Center), mock delivery *availability* fee display, admin API permission granularity, external Stripe/Vercel for edge cases.

**Not launch blockers:** entity admin hub (13G candidate deferred), global search, `/reservations` and `/place` stubs (hide from nav).

## Validation

```bash
npx tsx scripts/validate-pilot-readiness-phase13g.ts
npx tsx scripts/validate-founder-control-center-phase13f.ts
npx tsx scripts/validate-admin-p0-fixes-phase13e.ts
npm run lint
npm run build
```

## Pre-launch checklist (founder)

1. Confirm `STRIPE_*` live keys + webhook endpoint in production
2. Run `npx prisma migrate deploy`
3. Smoke: register → list → checkout (test card) → order → seller complete
4. Smoke: proposal → deal → optional deal checkout
5. Do not link `/reservations` or `/place` in marketing until implemented
6. Monitor Command Center daily; use Trust queue for reports
7. Document known telemetry blind spots (Part 7 of audit)

## Relation to prior phases

Builds on Phase 10A (pilot-ready verdict), 11A RC, 13B ops dashboards, 13C attribution, 13E admin P0, 13F Founder Control Center IA.

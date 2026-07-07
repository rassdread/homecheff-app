# UX Finalization Phase 5B — Discovery 2.0 (Information Architecture, Navigation & Ecosystem Alignment)

**Date:** 2026-07-08

Full audit: [`docs/audits/DISCOVERY_2_INFORMATION_ARCHITECTURE_AUDIT.md`](../audits/DISCOVERY_2_INFORMATION_ARCHITECTURE_AUDIT.md).

---

## Summary

Phase 5B is a **codebase-first IA audit + prioritized roadmap** (filters explicitly audit-only). It verifies, against schema/API/components, that HomeCheff is already a **full local community commerce platform** — buy, sell, request (Gezocht), services, value exchange/barter-openness, negotiation, community deals, delivery, reviews, fans, trust, badges, reputation — and identifies where the **information architecture** fails to represent that breadth.

No runtime code was changed this phase. All Phase 4/4B/4C performance architecture is preserved and re-validated.

---

## Deliverables

| Deliverable | Status |
|---|---|
| `docs/audits/DISCOVERY_2_INFORMATION_ARCHITECTURE_AUDIT.md` | ✅ |
| `docs/progress/UX_FINALIZATION_PHASE5B_DISCOVERY2.md` | ✅ (this) |
| `scripts/validate-discovery2-information-architecture.ts` | ✅ green |

---

## Key findings (12-point)

1. **Ecosystem (5B.1):** all pillars verified in code — verticals (Cheff/Garden/Designer), intents (Te koop/Gezocht/Inspiratie), Diensten (SERVICE/TASK/WORKSHOP/COACHING), value exchange (proposals/counters/barter-openness/accepted values), fulfilment (checkout/verkopen/bezorging/afspraken/community deals), community/trust (reviews/props/fans/trust/badges/HCP/pulse). Classified Core/Secondary/Advanced.
2. **Homepage IA (5B.2):** desktop hero+sidebar tell a good story post-5A; **mobile loses ecosystem breadth**; **services not communicated**.
3. **Navigation (5B.3):** bottom nav = 5 slots; heavy duplication (Create/Messages/HCP/Profile/Deals); no nav entry for Gezocht/Diensten/Reviews/Fans/Trust/Deals; operations IA is well grouped, consumer discovery is not.
4. **Discovery categories (5B.4):** feed chips (all/sale/inspiration/gezocht) + vertical `<select>` split the mental model; services hidden. Proposed intent-axis + vertical-axis chip model.
5. **Filters (5B.5, audit only):** dual search, three surfaces, fragmented reset, no desktop applied-filter summary; target = one system/search/reset/overview.
6. **Community visibility (5B.6):** homepage shows tile cues + pulse + reputation; **props-giving UI is orphaned/broken**; deals, per-channel trust, fans, leaderboards buried/login-gated.
7. **Services discovery (5B.7):** recommend a "Diensten" feed view via existing `deriveListingKind` — no new backend.
8. **Mobile (5B.8):** native-feel strengths intact; desktop assumptions remain (hero chips/orbit hidden, no community surface).
9. **Marketplace identity (5B.9):** local/buy/sell/verticals communicated; requests/services/collaboration/delivery-as-community under-communicated.
10. **Visual hierarchy (5B.10):** tiles/detail strong; profile buries trust/fans; mobile homepage buries breadth.
11. **Consistency (5B.11):** cards/chips/icons coherent; filters and vertical-axis inconsistent; minor jargon.
12. **Future-proofing (5B.12):** data model is future-proof (enum + runtime-derived kinds + i18n parity); the **presentation IA** would force a later redesign — moving to a pillar/axis discovery model now prevents that.

---

## Prioritized roadmap (later phases, non-destructive)

- **P0:** re-wire props-giving (restore orphaned `PropsButton`); Services discovery view + pointer.
- **P1:** discovery pillars (verticals as chips + Diensten chip); Afspraken/Deals as first-class consumer destination; mobile ecosystem strip.
- **P2:** unified filter surface; homepage community proof; link HCP leaderboard.
- **P3:** dead-code + stale-i18n cleanup.

All items additive/presentational — no backend/API/ranking/marketplace-logic/performance change.

---

## Files changed

- `docs/audits/DISCOVERY_2_INFORMATION_ARCHITECTURE_AUDIT.md` (new)
- `docs/progress/UX_FINALIZATION_PHASE5B_DISCOVERY2.md` (new)
- `scripts/validate-discovery2-information-architecture.ts` (new)

No component, i18n, schema, API, or logic changes this phase.

---

## Validation

```
npx tsx scripts/validate-discovery2-information-architecture.ts   # IA structure + perf guard
npx tsx scripts/validate-discovery-phase5a.ts                     # 32/32
npx tsx scripts/validate-discovery-experience.ts                  # 23/23
npx tsx scripts/validate-runtime-performance-phase4c.ts           # 26/26
npm run build                                                     # pass
```

# HomeCheff — Phase 3B.3.1  
## Controlled Feed Host Contract, Dormant Host Shell & Rollback Foundation

| Field | Value |
| --- | --- |
| Date | 2026-07-25 |
| Branch | `identity/phase2-auth-foundation` |
| Baseline start | `ab66dbe` — test(workspace): freeze feed sealed runtime browser invariants |
| Decision | **READY FOR PHASE 3B.3.2** |
| Browser | Chromium via puppeteer-core |
| Evidence | `docs/audits/artifacts/phase3b3/phase3b3-1-feed-dormant-host-proof.json` |

---

## 1. Executive summary

Phase 3B.3.1 levert een typed Controlled Feed Host Contract, een **dormant** Host Shell (`null`), een fail-closed activation gate (`PHASE_3B3_1_DORMANT_HOST_ONLY`), rollback foundation metadata, en Chromium-bewijs dat deze foundation de bestaande Feed-runtime niet beïnvloedt. GeoFeed blijft legacy-rendered, single-mounted, enige writer.

---

## 2. Baseline

- Branch: `identity/phase2-auth-foundation`
- Start: `ab66dbe`
- Match: **YES**

---

## 3. Pre-existing dirty tree

~73 dirty/untracked entries beschermd; niet gestaged.

---

## 4. Scope

Controlled host contracts, dormant shell, gate, rollback/plan/readiness, validators, tests, browser proof.

---

## 5. Non-goals

Geen GeoFeed-verplaatsing, geen host child render, geen hostActivation/renderActivation true, geen Feed ON, geen DOM-wrapper, geen Phase 3B.3.2 shadow placement.

---

## 6. Bestaande legacy renderroute

`app/page.tsx` → `HomePageClient` → `HomeGeoFeedDynamic` → `GeoFeed` (exact één JSX-mount). Ongewijzigd. Geen tweede dynamic import.

---

## 7. Controlled Feed Host Contract

`createControlledFeedHostContract()` — sealed-runtime + controlled-host-candidate; hostActivation=false; renderActivation=false; writer/renderOwner=legacy; mountingStrategy=reuse-existing-single-mount-only; nextEligibleStep=3B.3.2. Fail-closed validatie.

---

## 8. Dormant Host Shell

`FeedControlledHostShell` → altijd `null`. Geen GeoFeed/HomeGeoFeedDynamic import; geen effects/state/observers/requests.

---

## 9. Host Activation Gate

`evaluateFeedHostActivationGate()` — altijd `allowed=false` met blocker `PHASE_3B3_1_DORMANT_HOST_ONLY`. Force/env/query/cookie/localStorage genegeerd.

---

## 10. Rollback Foundation

`createFeedHostRollbackContract()` — target/writer/mountOwner=legacy; readiness=`prepared-not-active`; 16 triggercategorieën. Geen runtime rollback rond GeoFeed.

---

## 11. Controlled Host Plan

Pure metadata: activationState=dormant; recommendedNextStep=`3B.3.2-controlled-host-shadow-placement`.

---

## 12. Manifestintegratie

`FEED_DISCOVERY_HOST_CANDIDATE_METADATA` — geen renderer, geen child factory, geen Feed imports.

---

## 13–18. Boundaries

Single writer/render owner = legacy. Request/observer/scroll/cache = Feed-owned. Identity = preserve existing React identity. Geen Workspace-input in requestKey/nativePaintKey.

---

## 19. Static validator

`validate:adaptive-workspace-feed-dormant-host` — ok.

---

## 20. Unit tests

`test:adaptive-workspace-feed-dormant-host` — 8 assertions ok. Phase 3B.1/3B.2 tests groen.

---

## 21–23. Browser scenarios / 20/20 / forced activation

| Proof | Verdict |
| --- | --- |
| Phase 3B.2 rerun | **20/20 PASS** `READY_FOR_PHASE_3B_3` |
| Phase 3B.3.1 dormant host | **20/20 PASS** `READY_FOR_PHASE_3B_3_2` |
| Forced host activation | blocked; `PHASE_3B3_1_DORMANT_HOST_ONLY` |
| shellChildCount / shellDOMNodeCount / rendererRegistrationCount | 0 / 0 / 0 |

Probe hardening: observer-quiet baseline vóór shadow (flaky late IntersectionObserver).

---

## 24. Proof artifacts

- `docs/audits/artifacts/phase3b3/phase3b3-1-feed-dormant-host-proof.json`
- `docs/audits/artifacts/phase3b3/phase3b3-1-feed-dormant-host-readiness.json`
- `docs/audits/artifacts/phase3b3/phase3b3-1-feed-dormant-host-summary.md`
- Updated Phase 3B.2 proof (rerun)

---

## 25. Production build

`NEXT_PUBLIC_FEED_SEALED_BASELINE=1 npm run build` — pass. Lint — pass.

---

## 26. Repository-hygiëne

Alleen Phase 3B.3.1-bestanden gestaged; pre-existing dirty tree intact.

---

## 27. Risico’s

Eerste actieve host-placement (3B.3.2) mag GeoFeed niet remounten of wrappen met lifecycle-keys. Gate en rollback metadata zijn voorbereid maar nog niet operationeel actief.

---

## 28. Exacte voorwaarden voor Phase 3B.3.2

- Host activation blijft fail-closed tot expliciete 3B.3.2 gate-wijziging
- Placement mag alleen `reuse-same-instance-without-remount`
- Nieuwe Chromium proof verplicht vóór enige hostActivation=true
- Rollback path moet live testbaar blijven zonder tweede mount

---

## 29. Expliciet besluit

**READY FOR PHASE 3B.3.2**

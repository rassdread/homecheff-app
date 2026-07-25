# Phase 3B.3.4 — Controlled Host Eligibility

| Field | Value |
|-------|--------|
| Phase | 3B.3.4 |
| Branch | `workspace/phase3b34-controlled-host-eligibility` |
| Browser proof commit | `a53bf3757aeb530b379d28f0a9d8f5219e00cc7b` |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **READY FOR PHASE 3B.3.5** |

## 1. Architecture

Workspace evaluates whether the single registered Controlled Host candidate qualifies for *future* activation. Eligibility is metadata-only. GeoFeed remains sole owner of rendering, writer, request lifecycle, pagination, observers, caches, filters, loading, skeletons, tiles, scroll, SSR, and hydration.

`hostActivation=false`, `renderActivation=false`. No ownership transfer. No activation path opens.

## 2. Eligibility model

| Field | Value |
|-------|--------|
| hostId | `feed.discovery.controlled-host` |
| runtimeId | `feed.discovery.legacy-single-mount.v1` |
| registrationState | `registered` |
| eligibilityState | `eligible` |
| eligibilityReason | `registered-stable-legacy-host-prerequisites-met` |
| owner / writer / renderer | legacy / legacy / legacy |
| activationState | `dormant` |
| rollbackState | `prepared-not-active` |
| canStartActivation | false |
| activationBlocker | `PHASE_3B3_4_HOST_ELIGIBILITY_ONLY` |
| nextEligibleStep | `3B.3.5` |

Components: Eligibility Contract, Eligibility Engine (`evaluateControlledHostEligibility`), Eligibility Descriptor, Eligibility Validator, Eligibility Diagnostics, Eligibility Browser Instrumentation (`readHostEligibility`, probe v5).

## 3. Registry

Unchanged from 3B.3.3: metadata-only registry, `hostCount=1`, no runtime objects, no React instances. Eligibility is a separate evaluation layer over the registry.

## 4. Identity

Browser-measured on proof commit `a53bf37`: mount=1, unmount=0, activeInstanceCount=1, stable `runtimeId`, owner/writer/renderer remain legacy, rendererRegistrationCount=0.

## 5. Ownership / runtime

Workspace owns registry metadata, eligibility metadata, diagnostics, and planning only. Shell remains `return null`. Forced activation remains fail-closed under `PHASE_3B3_4_HOST_ELIGIBILITY_ONLY`. Rollback foundation `prepared-not-active`.

## 6. Browser proof

Artifact: `docs/audits/artifacts/phase3b34/phase3b3-4-feed-host-eligibility-proof.json`

- New Chromium production run (not reused)
- Proof commit matches implementation commit `a53bf37`
- 20/20 release-blocking invariants PASS
- Eligibility metadata visible via probe `readHostEligibility`
- Forced activation blocked (`PHASE_3B3_4_HOST_ELIGIBILITY_ONLY`)
- Phase 3B.2 rerun also 20/20 PASS

## 7. Validators / tests

All green: sealed, sealed-browser, dormant-host, shadow-placement, host-registration, eligibility; unit suites including 8 eligibility assertions; production sealed build pass.

## 8. Regression risk

Low for runtime/DOM. Residual risk for 3B.3.5: treating eligibility as permission to activate without identity-preserving activation gates.

## 9. Limits toward 3B.3.5

No hostActivation, no renderActivation, no Workspace renderer, no live rollback executor, no second GeoFeed, no remount, no wrappers/portals/parent replacement.

## 10. Decision

**READY FOR PHASE 3B.3.5**

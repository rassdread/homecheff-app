# Phase 3B.3.7 — Controlled Host Activation Decision

| Field | Value |
|-------|--------|
| Phase | 3B.3.7 |
| Branch | `workspace/phase3b37-controlled-host-activation-decision` |
| Implementation commit | `139951a45e931df229bab06e6c3aec3b712a20e5` |
| Browser proof commit | `139951a45e931df229bab06e6c3aec3b712a20e5` |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **READY FOR PHASE 3B.3.8** |

## 1. Architecture

Workspace computes a deterministic activation *decision* from sealed metadata layers (registration, shadow placement, eligibility, activation readiness, shadow activation simulation). The decision is metadata only. GeoFeed remains sole owner of rendering, writer, request lifecycle, pagination, observers, caches, filters, loading, skeletons, tiles, scroll, SSR, and hydration.

`hostActivation=false`, `renderActivation=false`, `canStartActivation=false`. No executor. No scheduler. No runtime mutation. No activation.

## 2. Decision model

| Field | Value |
|-------|--------|
| hostId | `feed.discovery.controlled-host` |
| runtimeId | `feed.discovery.legacy-single-mount.v1` |
| decisionState | `completed` |
| decisionResult | `ALLOW` |
| wouldActivate | `true` (decision intent only) |
| decisionReasons | prerequisites + readiness + simulation + identity + ownership |
| decisionBlockers | `PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY` |
| confidence | `high` |
| owner / writer / renderer | legacy / legacy / legacy |
| activationState | `dormant` (always false activation flags) |
| rollbackState | `prepared-not-active` |
| canStartActivation | false |
| nextEligibleStep | `3B.3.8` |

Components: Activation Decision Contract, Decision Descriptor + Engine, Decision Diagnostics, Decision Validator, Browser Instrumentation (`readHostActivationDecision`, probe v8).

## 3. Decision engine

Pure, deterministic `evaluateControlledHostActivationDecision(registry)`:

- no side effects
- no React / browser / global state
- identical input → identical output
- chains `evaluateControlledHostShadowActivationSimulation` as the prior layer
- explicit inputs: `CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES`

## 4. Decision contract

Fail-closed contract covers decision conditions, identity, ownership, renderer, rollback, and activation blockades. No codepath may execute activation. Forced activation remains blocked by `PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY`.

## 5. Diagnostics

Readable only: `decisionCompleted`, `decisionResult`, `wouldActivate`, `confidence`, used conditions, blockers, readiness/eligibility/simulation status, `currentPhase=3B.3.7`, `nextEligibleStep=3B.3.8`.

## 6. Registry / identity / ownership / runtime

Unchanged metadata-only registry: `hostCount=1`, no runtime objects, no React instances.

Browser-measured on proof commit `139951a`: mount=1, unmount=0, activeInstanceCount=1, stable `runtimeId`, owner/writer/renderer remain legacy. Shell remains `return null`. Forced activation blocked.

## 7. Browser proof

Artifact: `docs/audits/artifacts/phase3b37/phase3b3-7-feed-host-activation-decision-proof.json`

- New Chromium production run (not reused)
- Proof commit matches implementation commit `139951a`
- 20/20 release-blocking invariants PASS
- Decision metadata + diagnostics + decisionResult + wouldActivate visible
- Forced activation blocked (`PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY`)
- Phase 3B.2 rerun also 20/20 PASS
- Zero DOM / renderer / writer delta vs freeze baseline

## 8. Validators / tests

All green through sealed → shadow-activation-simulation + activation-decision; unit suites including 8 decision assertions; production sealed build pass.

## 9. Regression risk

Low for DOM/runtime. Residual risk for 3B.3.8: treating `decisionResult=ALLOW` / `wouldActivate=true` as authorization to execute activation.

## 10. Limits toward 3B.3.8

No activation executor, no scheduler, no hostActivation flip, no Workspace renderer, no remount/wrappers/portals, no runtime mutation. Phase 3B.3.8 may introduce an activation *candidate* plan only if it remains non-executing and fail-closed.

## 11. Decision

**READY FOR PHASE 3B.3.8**

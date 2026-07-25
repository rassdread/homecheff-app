# Phase 3B.3.5 — Controlled Host Activation Readiness

| Field | Value |
|-------|--------|
| Phase | 3B.3.5 |
| Branch | `workspace/phase3b35-controlled-host-activation-readiness` |
| Browser proof commit | _(filled after Chromium proof)_ |
| Browser | Chromium · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **PENDING** |

## 1. Architecture

Workspace determines whether the registered Controlled Host is architecturally ready for a *future* activation. Readiness is metadata + diagnostics only. GeoFeed remains sole owner of rendering, writer, and all Feed runtime surfaces.

`hostActivation=false`, `renderActivation=false`, `canStartActivation=false`. No executor. No scheduler. No ownership transfer.

## 2. Readiness model

| Field | Value |
|-------|--------|
| hostId | `feed.discovery.controlled-host` |
| runtimeId | `feed.discovery.legacy-single-mount.v1` |
| registrationState | `registered` |
| placementState | `shadow-registered` |
| eligibilityState | `eligible` |
| readinessState | `ready` |
| readinessReasons | stable prerequisites (registration, placement, eligibility, identity, ownership, rollback) |
| readinessBlockers | `PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY` |
| owner / writer / renderer | legacy / legacy / legacy |
| activationState | `dormant` |
| rollbackState | `prepared-not-active` |

## 3. Diagnostics

Readable diagnostics expose: readinessSatisfied, activeBlockers, missingConditionsForActivation, currentPhase=`3B.3.5`, nextEligibleStep=`3B.3.6`. Diagnostics never mutate runtime.

## 4. Registry / identity / ownership / runtime

Registry remains metadata-only (`hostCount=1`). Browser identity: mount=1, unmount=0, stable runtimeId. Shell remains `return null`.

## 5. Browser proof / validators / tests

Artifacts under `docs/audits/artifacts/phase3b35/`. Probe v6 `readHostActivationReadiness`. Forced activation blocked.

## 6. Regression risk

Low for DOM/runtime. Residual risk for 3B.3.6: treating readiness as authorization to execute activation.

## 7. Limits toward 3B.3.6

No activation executor, no scheduler, no hostActivation flip, no Workspace renderer.

## 8. Decision

**PENDING — complete after green Chromium proof**

# Phase 3B.3.7 — Controlled Host Activation Decision

| Field | Value |
|-------|--------|
| Phase | 3B.3.7 |
| Branch | `workspace/phase3b37-controlled-host-activation-decision` |
| Browser proof commit | _(filled after Chromium proof)_ |
| Browser | Chromium · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **PENDING** |

## 1. Architecture

Workspace computes a deterministic activation *decision* from sealed metadata (registration, placement, eligibility, readiness, simulation). Decision is metadata only. GeoFeed remains sole runtime owner.

`hostActivation=false`, `renderActivation=false`, `canStartActivation=false`.

## 2. Decision model / engine

| Field | Value |
|-------|--------|
| decisionState | `completed` |
| decisionResult | `ALLOW` |
| wouldActivate | `true` |
| confidence | `high` |
| decisionBlockers | `PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY` |
| activationState | `dormant` |

Pure engine: no side effects, no React/browser/global state; identical input → identical output. Explicit inputs listed in `CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES`.

## 3–8. Diagnostics / identity / proof / limits

Diagnostics expose decisionResult, wouldActivate, confidence, used conditions, blockers, readiness/eligibility/simulation status, currentPhase=`3B.3.7`, nextEligibleStep=`3B.3.8`. Residual risk for 3B.3.8: treating ALLOW as authorization to execute.

## 9. Decision

**PENDING — complete after green Chromium proof**

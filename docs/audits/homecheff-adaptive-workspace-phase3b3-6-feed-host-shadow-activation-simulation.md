# Phase 3B.3.6 — Controlled Host Shadow Activation Simulation

| Field | Value |
|-------|--------|
| Phase | 3B.3.6 |
| Branch | `workspace/phase3b36-controlled-host-shadow-activation-simulation` |
| Browser proof commit | _(filled after Chromium proof)_ |
| Browser | Chromium · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **PENDING** |

## 1. Architecture

Workspace runs a deterministic dry-run that evaluates whether a *future* host activation would be architecturally allowed. Simulation produces metadata only. GeoFeed remains sole owner of rendering, writer, and all Feed runtime surfaces.

`hostActivation=false`, `renderActivation=false`, `canStartActivation=false`. No executor. No scheduler. No runtime mutation.

## 2. Simulation model

| Field | Value |
|-------|--------|
| simulationState | `completed` |
| simulationResult | `dry-run-complete-would-activate` |
| wouldActivate | `true` (intent only) |
| simulationBlockers | `PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY` |
| activationState | `dormant` |
| canStartActivation | false |

## 3. Diagnostics

Readable: simulationCompleted, wouldActivate, why, blockers, readiness/eligibility status, currentPhase=`3B.3.6`, nextEligibleStep=`3B.3.7`.

## 4–8. Identity / proof / validators / limits

Mount=1 unmount=0; registry metadata-only; forced activation blocked. Residual risk for 3B.3.7: treating `wouldActivate=true` as authorization to execute.

## 9. Decision

**PENDING — complete after green Chromium proof**

# Phase 3B.3.8 — Controlled Host Activation Plan

| Field | Value |
|-------|--------|
| Phase | 3B.3.8 |
| Branch | `workspace/phase3b38-controlled-host-activation-plan` |
| Browser proof commit | _(filled after Chromium proof)_ |
| Browser | Chromium · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **PENDING** |

## 1. Architecture

Workspace computes a deterministic activation *plan* (execution description) from sealed metadata layers including the Phase 3B.3.7 decision. The plan is metadata only. GeoFeed remains sole runtime owner.

`hostActivation=false`, `renderActivation=false`, `canStartActivation=false`. No executor. No scheduler. No runtime mutation.

## 2. Activation plan model / engine

| Field | Value |
|-------|--------|
| planId | `feed.discovery.controlled-host.activation-plan.v1` |
| planVersion | `1` |
| planState | `completed` |
| planResult | `plan-complete-not-executable` |
| decisionResult | `ALLOW` |
| wouldActivate | `true` |
| plannedSteps | 10 deterministic future steps (never executed) |
| activationState | `dormant` |
| blockers | `PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY` |

Pure engine: no side effects; identical input → identical output; step order fixed by `CONTROLLED_HOST_ACTIVATION_PLAN_STEPS`.

## 3–8. Diagnostics / identity / proof / limits

Diagnostics expose planResult, plannedSteps, preconditions, validation points, rollback checkpoints, abort conditions, invariants, blockers, `currentPhase=3B.3.8`, `nextEligibleStep=3B.3.9`. Residual risk for 3B.3.9: treating a completed plan as authorization to execute.

## 9. Decision

**PENDING — complete after green Chromium proof**

# Phase 3B.3.8 — Controlled Host Activation Plan

| Field | Value |
|-------|--------|
| Phase | 3B.3.8 |
| Branch | `workspace/phase3b38-controlled-host-activation-plan` |
| Implementation commit | `27bc4ec24272bdf91c1f242e7ce07bddb1661638` |
| Browser proof commit | `27bc4ec24272bdf91c1f242e7ce07bddb1661638` |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` |
| Decision | **READY FOR PHASE 3B.3.9** |

## 1. Architecture

Workspace computes a deterministic activation *plan* (execution description) from sealed metadata: registration, shadow placement, eligibility, activation readiness, shadow simulation, and activation decision. The plan is metadata only. GeoFeed remains sole owner of rendering, writer, and all Feed runtime surfaces.

`hostActivation=false`, `renderActivation=false`, `canStartActivation=false`. No executor. No scheduler. No runtime mutation. No activation.

## 2. Activation plan model

| Field | Value |
|-------|--------|
| hostId | `feed.discovery.controlled-host` |
| runtimeId | `feed.discovery.legacy-single-mount.v1` |
| planId | `feed.discovery.controlled-host.activation-plan.v1` |
| planVersion | `1` |
| planState | `completed` |
| planResult | `plan-complete-not-executable` |
| decisionResult | `ALLOW` |
| wouldActivate | `true` (intent only) |
| plannedSteps | 10 fixed future steps (never executed) |
| preconditions / validationPoints / rollbackCheckpoints / abortConditions | sealed arrays |
| invariants | all 20 release-blocking IDs |
| owner / writer / renderer | legacy / legacy / legacy |
| activationState | `dormant` |
| rollbackState | `prepared-not-active` |
| canStartActivation | false |
| nextEligibleStep | `3B.3.9` |
| activationBlocker | `PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY` |

Components: Activation Plan Contract, Plan Descriptor + Engine, Plan Diagnostics, Plan Validator, Browser Instrumentation (`readHostActivationPlan`, probe v9).

## 3. Activation plan engine

Pure `evaluateControlledHostActivationPlan(registry)`:

- no side effects / React / browser / global state
- chains `evaluateControlledHostActivationDecision`
- explicit inputs: `CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES`
- `plannedSteps` order fixed by `CONTROLLED_HOST_ACTIVATION_PLAN_STEPS` (deterministic)

## 4. Planned steps

Future sequence only (descriptive): verify registry → placement → eligibility → readiness → simulation → decision → identity → ownership → rollback → hold pending future authorization.

## 5. Diagnostics

Readable: plan completed, planResult, decisionResult, wouldActivate, planned step count, preconditions, validation points, rollback checkpoints, abort conditions, invariants, blockers, `currentPhase=3B.3.8`, `nextEligibleStep=3B.3.9`.

## 6. Identity / ownership / runtime

Browser-measured on proof commit `27bc4ec`: mount=1, unmount=0, stable `runtimeId`, owner/writer/renderer legacy, registry + plan metadata-only. Shell remains `return null`. Forced activation blocked.

## 7. Browser proof

Artifact: `docs/audits/artifacts/phase3b38/phase3b3-8-feed-host-activation-plan-proof.json`

- New Chromium production run (not reused)
- Proof commit matches implementation commit `27bc4ec`
- 20/20 release-blocking invariants PASS
- Plan metadata + diagnostics + plannedSteps + planResult visible
- Forced activation blocked (`PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY`)
- Phase 3B.2 rerun also 20/20 PASS

## 8. Validators / tests

All green through sealed → activation-decision + activation-plan; unit suites including 8 plan assertions; production sealed build pass.

## 9. Regression risk

Low for DOM/runtime. Residual risk for 3B.3.9: treating `planResult=plan-complete-not-executable` as authorization to execute plannedSteps.

## 10. Limits toward 3B.3.9

No activation executor, no scheduler, no hostActivation flip, no Workspace renderer, no remount/wrappers/portals, no runtime mutation. Phase 3B.3.9 may only introduce further non-executing controls if fail-closed.

## 11. Decision

**READY FOR PHASE 3B.3.9**

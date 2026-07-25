# Phase 3B.3.10 — Controlled Host Activation Transaction

Status: DRAFT (pending browser proof)

## Architecture

Workspace models an atomic **Activation Transaction** as metadata only. GeoFeed remains sole renderer, writer, and runtime owner. No commit, rollback execution, activation, scheduler, or executor.

## Transaction model

- `transactionResult`: `transaction-complete-not-committed`
- `wouldCommit`: `true` (prerequisites agree a future atomic commit could be valid)
- `transactionCommitted`: always `false`
- `activationState`: always dormant / false
- `beginState` / `intendedEndState` fully recorded
- commit / rollback / abort / compensating / checkpoint / invariant metadata only

## Transaction engine

Pure deterministic `evaluateControlledHostActivationTransaction(registry)` — no side effects, no React/browser/global state. Chains prior pipeline evaluation; never executes.

## Commit / rollback model

Commit and rollback are described and validated as conditions only. Fail-closed contract forbids `commitAllowed`, `rollbackExecutionAllowed`, executors, and schedulers.

## Diagnostics

Readable diagnostics include transaction completed/result, wouldCommit, transactionCommitted, begin/end state, conditions, checkpoints, compensating actions, abort conditions, invariants, blockers, pipeline/plan/decision results, wouldActivate, currentPhase, nextEligibleStep.

## Identity / ownership / runtime

- runtimeId stable (`feed.discovery.legacy-single-mount.v1`)
- mount=1, unmount=0
- owner/writer/renderer = legacy
- registry + activation-transaction metadata-only
- `hostActivation=false`, `renderActivation=false`, `canStartActivation=false`

## Browser proof

Pending Chromium production proof on implementation commit (port 3031, probe v11).

## Validators / tests

- `validate:adaptive-workspace-feed-activation-transaction`
- `test:adaptive-workspace-feed-activation-transaction`
- Prior phase validators must remain green.

## Regression risk

Low if boundaries hold: no GeoFeed ownership shift, no DOM/runtime mutation, gate remains fail-closed on `PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY`.

## Limits toward Phase 3B.3.11

Transaction models atomic activation but does not authorize candidate activation, commit, or any runtime cutover. Phase 3B.3.11 may introduce the next metadata gate only under Master Specification constraints.

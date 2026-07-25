# Phase 3B.3.13 — Controlled Host Activation State Machine

| Field | Value |
|-------|--------|
| Phase | 3B.3.13 |
| Branch | `workspace/phase3b313-controlled-host-activation-state-machine` |
| Implementation commit | `a2c0457a60862186814548cc43e8a4ceb4a22aff` |
| Browser proof commit | `a2c0457a60862186814548cc43e8a4ceb4a22aff` |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` · port 3034 |
| Decision | **READY FOR PHASE 3B.3.14** |

## 1. Architecture

Workspace models a sealed Activation *State Machine* describing the theoretical lifecycle of a future Host Activation. Metadata only. GeoFeed remains sole owner of rendering, writer, request lifecycle, pagination, observers, caches, filters, loading, skeletons, tiles, scroll, SSR, and hydration.

`hostActivation=false`, `renderActivation=false`, `canStartActivation=false`, `transactionCommitted=false`, `protocolExecuted=false`, `transitionExecuted=false`, ownership/writer/renderer remain legacy. No executor. No scheduler. No transition execution. No commit. No rollback. No runtime mutation.

## 2. State machine model

| Field | Value |
|-------|--------|
| hostId | `feed.discovery.controlled-host` |
| runtimeId | `feed.discovery.legacy-single-mount.v1` |
| machineId | `feed.discovery.controlled-host.activation-state-machine.v1` |
| machineVersion | `1` |
| machineState | `completed` |
| machineResult | `state-machine-complete-not-executable` |
| currentState | `COMMIT_READY` |
| initialState | `LEGACY_DORMANT` |
| terminalStates | `ACTIVE` (theoretical), `ABORTED`, `ROLLED_BACK` |
| allowedTransitions | 10 linear sealed transitions ending at `COMMIT_READY` |
| blockedTransitions | includes `COMMIT_READY->ACTIVE` and forced-activation paths |
| transitionGuards / reasons / blockers / preconditions / validationPoints | sealed arrays |
| transitionExecuted | `false` (always) |
| protocolExecuted / transactionCommitted | `false` / `false` |
| owner / writer / renderer | legacy / legacy / legacy |
| activationState | dormant / false |
| rollbackState | `prepared-not-active` |
| nextEligibleStep | `3B.3.14` |
| activationBlocker | `PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY` |

Components: Activation State Machine Contract, Descriptor + Engine, Diagnostics, Validator, Browser Instrumentation (`readHostActivationStateMachine`, probe v14).

## 3. State machine engine

Pure `evaluateControlledHostActivationStateMachine(registry)`:

- no side effects / React / browser / global state
- chains `evaluateControlledHostActivationCommitProtocol(registry)`
- enumerates states, allowed/blocked transitions, guards, blockers, preconditions, validation points
- `transitionExecuted` remains false; `ACTIVE` is unreachable
- identical input → identical output

## 4. States / transitions / guards

Lifecycle states: `LEGACY_DORMANT` → … → `COMMIT_READY`, with theoretical terminals `ACTIVE` / `ABORTED` / `ROLLED_BACK`. Allowed transitions describe the theoretical path already traversed as metadata history; blocked transitions prevent any jump to `ACTIVE` or reverse/forced paths. Guards and blockers permanently deny transition execution because no executor exists and `transitionExecutionAllowed=false`.

## 5. Diagnostics

Readable: `machineCompleted`, `machineResult`, `currentState`, `allowedTransitions`, `blockedTransitions`, `transitionGuards`, `transitionReasons`, `transitionBlockers`, `transitionPreconditions`, `transitionValidationPoints`, `invariants`, upstream protocol/readiness/transaction/pipeline/plan/decision results, `currentPhase=3B.3.13`, `nextEligibleStep=3B.3.14`.

## 6. Identity / ownership / runtime

Browser-measured on proof commit `a2c0457`: mount=1, unmount=0, stable `runtimeId`, React identity stable, owner/writer/renderer legacy, registry + activation-state-machine metadata-only. Shell remains `return null`. Forced activation blocked.

## 7. Browser proof

Artifact: `docs/audits/artifacts/phase3b313/phase3b3-13-feed-host-activation-state-machine-proof.json`

- New Chromium production run (not reused)
- Proof commit matches implementation commit `a2c0457`
- 20/20 release-blocking invariants PASS
- State machine metadata + diagnostics + `currentState=COMMIT_READY` visible
- `transitionExecuted=false`, `protocolExecuted=false`, `transactionCommitted=false`
- Forced activation blocked (`PHASE_3B3_13_…`)
- Phase 3B.2 rerun also 20/20 PASS
- `stateMachineMetaOk=true`, verdict `READY_FOR_PHASE_3B_3_14`

## 8. Validators / tests

All green through sealed → activation-commit-protocol + activation-state-machine; unit suites including 8 state-machine assertions; production sealed build pass; `validate:adaptive-workspace-feed-activation-state-machine` ok (with artifacts).

## 9. Regression risk

Low: metadata-only extension of sealed host path; no GeoFeed remount, no DOM/UI change, no writer/renderer ownership shift. Residual risk is gate/blocker drift in historical layer tests (mitigated by layer-owned `PHASE_3B3_N` restores).

## 10. Limits toward Phase 3B.3.14

State machine does **not** authorize transition execution, commit, activation, ownership/writer/renderer transfer, executor, or scheduler. `canStartActivation` remains `false`. Next eligible step is controlled host activation *candidate* modelling only under 3B.3.14 constraints.

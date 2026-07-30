# AW-R1 — Final Pre-Activation Seal

## Stage identification

Stage **AW-R1** — Controlled Workspace Host Candidate Pre-Activation Seal (Final Pre-Activation Seal).

Predecessor: Phase **3B.3.47** (final freeze `18c178a6aaaa537f57cce8ecb0eb8bfb17e77c59`; proof target `a333f7051a60f515a3784dcfbf9a52ee2cb16dad`).

Next eligible: **AW-R2** — Controlled LIVE Authorization (**not implemented** in this stage).

Roadmap authority: `docs/architecture/homecheff-adaptive-workspace-condensed-implementation-roadmap.md`.

## Objective

Seal the remaining **candidate-only** lifecycle metadata required before LIVE authorization becomes possible. Repository-native fields advanced atomically in this stage:

| Field | Transition |
|-------|------------|
| `candidateActivationExecuted` | own-property **absent → true** |
| `candidateActivationCompleted` | own-property **absent → true** |

Preserved from predecessor: Started / Executable / Active / Activated / Ready / Authorized = true.

This stage does **not** unlock Allowed/Executable, set issuancePipelineExecutable, render or mount Workspace, create runtime capability, transfer GeoFeed authority, or authorize LIVE execution.

Successful result: `controlled-workspace-host-candidate-pre-activation-sealed-not-live`

Successful lifecycle state: `CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE`

Primary blocker: `PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY`

Primary transitions: transitionCount=2 (Executed + Completed)

## Executed / Completed are not LIVE / Workspace / Runtime / GeoFeed

| Field | Decision | Evidence |
|-------|----------|----------|
| `candidateActivationExecuted` | **sealed** absent → `true` | Atomic with Completed |
| `candidateActivationCompleted` | **sealed** absent → `true` | Atomic with Executed |
| `candidateActivationStarted` | **remains true** | Frozen from 3B.3.47 |
| `issuancePipelineExecutable` | **remains false** | Separate from candidate seal |
| `issuancePipelineState` | **NON_EXECUTABLE** | Preserved |
| Allowed / Executable / hostActivation | false | Preserved |
| Transaction | OPENED | Preserved |
| Workspace / runtime / handles | absent | Preserved |
| GeoFeed | legacy 1/1/0 | Preserved |

## Non-goals

This stage does **not** authorize LIVE, set Allowed/Executable true, introduce Workspace presence, create runtime hosts/handles, transfer GeoFeed ownership/writing/rendering, or start AW-R2+. Nothing was pushed.

## Official predecessor authority

| Field | Value |
|-------|-------|
| Branch | `workspace/phase3b347-controlled-workspace-host-candidate-execution-started` |
| Final freeze | `18c178a6aaaa537f57cce8ecb0eb8bfb17e77c59` |
| Implementation / proof target | `a333f7051a60f515a3784dcfbf9a52ee2cb16dad` |
| Proof documentary | `f40c2c8da68452667909d2fe4353e120cc332349` |
| Lineage documentary | `f5d79507b74671187e2984352af90950bd4dbc99` |
| Result | `controlled-workspace-host-candidate-execution-started-not-executed` |
| Lifecycle | `CANDIDATE_EXECUTION_STARTED_NOT_EXECUTED` |
| Bridge | v48 |
| Verdict | `READY_FOR_PHASE_3B_3_48` (continuation = AW-R1) |

## Architecture

Candidate Pre-Activation Seal (AW-R1 action)  
← Candidate Execution Started (3B.3.47)  
← Candidate Executable (3B.3.46)  
← …

Engine: pure `evaluateControlledWorkspaceHostCandidatePreActivationSeal(registry, input?)`.

## Bridge / proof

| Field | Value |
|-------|-------|
| Bridge | v49 |
| Reader | `readControlledWorkspaceHostCandidatePreActivationSeal` |
| MetaOk | `candidatePreActivationSealMetaOk` |
| Proof port | 3069 |
| LIVE gate | currentStep=`AW-R1`, eligibleStep=`AW-R2`, Allowed=false |

## Proof summary

| Check | Result |
|-------|--------|
| Dedicated tests | PASS — 5 assertion groups |
| Validator | PASS |
| Forced-negative (Chromium matrix) | 53/53 PASS |
| Production build | PASS (sealed baseline) |
| Chromium | 20/20 PASS |
| Controlled Workspace regression | 20/20 PASS |
| Recursive capability audit | PASS |
| GeoFeed | legacy 1/1/0 |
| Verdict | `READY_FOR_AW_R2` |
| Push | Nothing pushed |

## Release lineage (filled by lineage / freeze commits)

| Field | Value |
|-------|-------|
| Branch | `workspace/aw-r1-final-pre-activation-seal` |
| Implementation commit | `264340b1a2ca1d52c2850a66dadb93dcdeed2591` |
| Documentary commit | `e323aff5d46eba1fb9e3d75938c5e2c17cf6eede` |
| Lineage documentary commit | `8fe89c749f4712120c3c2b5ae6dabcf7e44a2542` |
| Freeze commit | `pending` |

## Release verdict

`READY_FOR_AW_R2`

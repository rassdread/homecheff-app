# Phase 3B.3.47 — Controlled Workspace Host Candidate Execution Started

## Phase identification

Phase **3B.3.47** — Controlled Workspace Host Candidate Execution Started.

Predecessor: Phase **3B.3.46** (final freeze `2fa240cb637e70daab96531fa969239b147acd6c`; proof target `1a1c75e45de4f5109cc9891e8a991c92b78fc0ee`).

Next eligible: **3B.3.48** (sequential only; title not yet confirmed; **not implemented**).

## Objective

Advance exactly one architectural fact: after Phase 3B.3.46 candidate executable, record **candidateActivationStarted** as sealed lifecycle metadata only (own-property absence → `true`). This phase does **not** execute the candidate, unlock Allowed/Executable, set issuancePipelineExecutable, introduce Executed/Completed, render or mount Workspace, create runtime capability, or transfer GeoFeed authority.

Successful result: `controlled-workspace-host-candidate-execution-started-not-executed`

Successful lifecycle state: `CANDIDATE_EXECUTION_STARTED_NOT_EXECUTED`

Primary blocker: `PHASE_3B3_47_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ONLY`

Primary transition: `candidateActivationStarted: absent → true` (transitionCount=1)

## Started is not Executed / Completed / Pipeline / Live / Workspace / Runtime

| Field | Decision | Evidence |
|-------|----------|----------|
| `candidateActivationStarted` | **advanced** absent → `true` | Sole primary action fact for this phase |
| `candidateExecutable` / Active / Activated / Ready / Authorized | **remain true** | Frozen from 3B.3.46 |
| `candidateActivationExecuted` / `Completed` | **absent** | Not introduced |
| `issuancePipelineExecutable` | **remains false** | Separate from Started |
| `issuancePipelineState` | **NON_EXECUTABLE** | Preserved |
| Allowed / Executable / hostActivation | false | Preserved |
| Transaction | OPENED | Preserved |
| Workspace / runtime / handles | absent | Preserved |
| GeoFeed | legacy 1/1/0 | Preserved |

## Non-goals

This phase does **not** execute or complete the candidate, set Allowed/Executable true, set issuancePipelineExecutable true, introduce Executed/Completed fields, create runtime hosts/handles, render/mount Workspace, or transfer GeoFeed ownership/writing/rendering. Phase 3B.3.48 was not started. Nothing was pushed.

## Official predecessor authority

| Field | Value |
|-------|-------|
| Branch | `workspace/phase3b346-controlled-workspace-host-candidate-executable` |
| Final freeze | `2fa240cb637e70daab96531fa969239b147acd6c` |
| Implementation / proof target | `1a1c75e45de4f5109cc9891e8a991c92b78fc0ee` |
| Proof documentary | `fe091acce0219b399738b191755d23a64431808e` |
| Lineage documentary | `942940b6dc273f7abcfa762ccaf86985e80fae65` |
| Result | `controlled-workspace-host-candidate-executable-not-executed` |
| Lifecycle | `CANDIDATE_EXECUTABLE_NOT_EXECUTED` |
| Bridge | v47 |
| Verdict | `READY_FOR_PHASE_3B_3_47` |

## Architecture

Candidate Execution Started (3B.3.47 action)  
← Candidate Executable (3B.3.46)  
← Candidate Active (3B.3.45)  
← …

Engine: pure `evaluateControlledWorkspaceHostCandidateExecutionStarted(registry, input?)`.

## Bridge / proof

| Field | Value |
|-------|-------|
| Bridge | v48 |
| Reader | `readControlledWorkspaceHostCandidateExecutionStarted` |
| MetaOk | `candidateActivationStartedMetaOk` |
| Proof port | 3068 |
| LIVE gate | currentStep=3B.3.47, eligibleStep=3B.3.48, Allowed=false |

## Proof summary

| Check | Result |
|-------|--------|
| Dedicated tests | PASS — 13 assertions |
| Validator | PASS — 57 forced-negative labels |
| Production build | PASS (sealed baseline) |
| Chromium | 20/20 PASS |
| Forced-negative Chromium | 53/53 PASS |
| Controlled Workspace regression | 20/20 PASS |
| Recursive capability audit | PASS |
| GeoFeed | legacy 1/1/0 |
| Verdict | `READY_FOR_PHASE_3B_3_48` |
| Push | Nothing pushed |

## Release verdict

`READY_FOR_PHASE_3B_3_48`

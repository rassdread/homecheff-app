# AW-R3 — Controlled Execution

## Stage identification

Stage **AW-R3** — Controlled Execution.

Predecessor: **AW-R2** (final freeze `df9b9b9a86ee31db79a546a2ebfa4c33036e6738`; proof target `002586b455849e9f4be4eec9d87548fb72a87438`).

Next eligible: **AW-R4** — GeoFeed Authority Transition (**not implemented**).

Roadmap authority: `docs/architecture/homecheff-adaptive-workspace-condensed-implementation-roadmap.md`.

## Objective

Introduce **controlled Workspace execution** as one capability-stage pack while preserving GeoFeed as the sole legacy feed owner/writer/renderer.

Successful result: `controlled-workspace-executing-geofeed-legacy-authority`

Successful lifecycle: `CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY`

Primary blocker: `PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY` (blocks GeoFeed authority takeover; gate.allowed remains false)

## Explicit statements

- AW-R3 allows controlled Workspace execution.
- AW-R3 does not transfer GeoFeed authority.
- AW-R3 does not authorize Feed ON.
- AW-R3 does not promote production.

## Capability transition set (atomic)

| Dimension | Field(s) | Transition |
|-----------|----------|------------|
| Executable | `issuancePipelineExecutable` (+ `issuancePipelineExecutionAllowed`) | false → true |
| Pipeline | `issuancePipelineState` | `NON_EXECUTABLE` → `CONTROLLED_EXECUTABLE` |
| Transaction | `issuanceTransactionState` | `OPENED` → `CONTROLLED_EXECUTION` |
| Workspace | visible/mounted/rendered/reactInstance | absent → present |
| Runtime | capability/host/activationHandle/executionHandle | absent → present |
| Host | `hostActivation`, `canStartActivation` | false → true |
| Feed render | `renderActivation` | **stays false** |

Preserved: Allowed=`true`; GeoFeed legacy 1/1/0; Feed ON closed; production promotion closed.

## Stable mount / runtime handles

- `stableMountId`: `feed.discovery.controlled-host.stable-mount.v1`
- `stableMountIdentityPreserved`: true
- Typed metadata handles (non-authority): workspace runtime / activation / execution handle ids
- Handles cannot transfer GeoFeed owner/writer/renderer/request/pagination/observer/cache authority

## Rollback

Metadata-gate-only rollback to AW-R2 frozen contract:

Allowed=true · Executable=false · Pipeline=NON_EXECUTABLE · Transaction=OPENED · Workspace absent · Runtime absent · GeoFeed legacy 1/1/0

Proven via `createControlledWorkspaceExecutionRollbackContract()`; freeze tip remains AW-R3 executed state.

## Failure atomicity

All AW-R3 capability fields advance together or not at all. Partial/duplicate/incomplete prerequisites fail closed. GeoFeed continuity unaffected.

## Non-goals

AW-R4+ not started. No GeoFeed ownership/writer/renderer transfer. No remount. No second instance. No Feed ON. Nothing pushed.

## Bridge / proof

| Field | Value |
|-------|-------|
| Bridge | v51 |
| Reader | `readControlledWorkspaceExecution` |
| MetaOk | `controlledWorkspaceExecutionMetaOk` |
| Proof port | 3071 |
| Gate | currentStep=`AW-R3`, eligibleStep=`AW-R4`, allowed=false |

## Proof summary

| Check | Result |
|-------|--------|
| Dedicated tests | PASS — 9 assertion groups |
| Validator | PASS |
| Forced-negative Chromium | 69/69 PASS (≥53 baseline) |
| Production build | PASS (sealed baseline) |
| Chromium | 20/20 PASS |
| Controlled Workspace regression | 20/20 PASS |
| GeoFeed regression | legacy 1/1/0 |
| Recursive capability audit | PASS |
| Performance regression guard | PASS (mount/render 1/1/0; no remount) |
| Stable mount proof | PASS |
| Runtime handle proof | PASS |
| Rollback proof | PASS |
| Failure atomicity | PASS |
| Verdict | `READY_FOR_AW_R4` |
| Push | Nothing pushed |

## Release lineage (filled by lineage / freeze commits)

| Field | Value |
|-------|-------|
| Branch | `workspace/aw-r3-controlled-execution` |
| Implementation commit | `a58caed6f61ced4f55e986a493ba431058d9ab2b` |
| Documentary commit | `ff0e22f77bc291ad95940f8fb92c86c56cee65ba` |
| Lineage documentary commit | `pending-lineage` |
| Freeze commit | `pending` |

## Release verdict

`READY_FOR_AW_R4`

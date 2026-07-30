# AW-R2 — Controlled LIVE Authorization

## Stage identification

Stage **AW-R2** — Controlled LIVE Authorization.

Predecessor: **AW-R1** (final freeze `c281c27173e3393f97b8e4cad703563dc0fb77f3`; proof target `264340b1a2ca1d52c2850a66dadb93dcdeed2591`).

Next eligible: **AW-R3** — Controlled Execution (**not implemented** in this stage).

Roadmap authority: `docs/architecture/homecheff-adaptive-workspace-condensed-implementation-roadmap.md`.

## Objective

Open exactly one genuine capability boundary: **Controlled LIVE authorization**.

| Field | Transition |
|-------|------------|
| `activationExecutionAllowed` (freeze-pack `Allowed`) | **false → true** |

This means the sealed candidate is explicitly authorized to proceed toward controlled execution in AW-R3. It does **not** authorize execution, mount, render, runtime, pipeline executability, Workspace presence, GeoFeed authority transfer, or Feed ON.

Successful result: `controlled-workspace-live-authorized-not-executable`

Successful lifecycle state: `LIVE_AUTHORIZED_NOT_EXECUTABLE`

Primary blocker: `PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY`

Primary transition: transitionCount=1 (`Allowed` false→true)

## Explicit statements

- AW-R2 authorizes LIVE eligibility only.
- AW-R2 does not authorize execution.
- AW-R2 does not mount or render Workspace.
- AW-R2 does not transfer GeoFeed authority.
- AW-R2 does not authorize Feed ON.

## Allowed is not Executable / Workspace / Runtime / GeoFeed / Feed ON

| Field | Decision | Evidence |
|-------|----------|----------|
| `activationExecutionAllowed` / Allowed | **advanced** false → `true` | Sole capability action |
| Gate `allowed` (attemptHostActivation) | **remains false** | Execution still blocked by PHASE_AW_R2 |
| `issuancePipelineExecutable` | **remains false** | Separate AW-R3 boundary |
| `issuancePipelineState` | **NON_EXECUTABLE** | Preserved |
| Executable (operational) | false | Preserved |
| Transaction | OPENED | Preserved |
| Workspace / runtime / handles | absent | Preserved |
| GeoFeed | legacy 1/1/0 | Preserved |

## Rollback

Rollback is **metadata/capability-gate only** (platform U19):

- Target: restore `Allowed=false` / AW-R1-safe contract
- Mode: `metadata-gate-only`
- Preserves GeoFeed identity, request identity, scroll/pagination/cache/observer ownership
- No remount, no Feed reconstruction, no Workspace runtime change (Workspace remains absent)

Descriptor fields: `rollbackTargetAllowed=false`, `rollbackMode=metadata-gate-only`, `rollbackPreservesGeoFeedIdentity=true`.

Dedicated tests exercise the rollback contract. Final frozen contract remains Allowed=true (rollback is proven, not applied as the freeze tip).

## Non-goals

AW-R3+ not started. No Workspace presence. No runtime hosts/handles. No GeoFeed ownership/writer/renderer transfer. No Feed ON. Nothing pushed.

## Official predecessor authority

| Field | Value |
|-------|-------|
| Branch | `workspace/aw-r1-final-pre-activation-seal` |
| Final freeze | `c281c27173e3393f97b8e4cad703563dc0fb77f3` |
| Implementation | `264340b1a2ca1d52c2850a66dadb93dcdeed2591` |
| Documentary | `e323aff5d46eba1fb9e3d75938c5e2c17cf6eede` |
| Lineage | `8fe89c749f4712120c3c2b5ae6dabcf7e44a2542` |
| Result | `controlled-workspace-host-candidate-pre-activation-sealed-not-live` |
| Lifecycle | `CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE` |
| Bridge | v49 |
| Verdict | `READY_FOR_AW_R2` |

## Architecture

Controlled LIVE Authorization (AW-R2 action)  
← Candidate Pre-Activation Seal (AW-R1)  
← Candidate Execution Started (3B.3.47)  
← …

Engine: pure `evaluateControlledWorkspaceLiveAuthorization(registry, input?)`.

## Bridge / proof

| Field | Value |
|-------|-------|
| Bridge | v50 |
| Reader | `readControlledWorkspaceLiveAuthorization` |
| MetaOk | `controlledLiveAuthorizationMetaOk` |
| Proof port | 3070 |
| LIVE gate | currentStep=`AW-R2`, eligibleStep=`AW-R3`, gate.allowed=false |

## Proof summary

| Check | Result |
|-------|--------|
| Dedicated tests | PASS — 6 assertion groups |
| Validator | PASS |
| Forced-negative Chromium | 53/53 PASS |
| Production build | PASS (sealed baseline) |
| Chromium | 20/20 PASS |
| Controlled Workspace regression | 20/20 PASS |
| Recursive capability audit | PASS |
| Rollback proof | PASS (metadata-gate-only) |
| GeoFeed | legacy 1/1/0 |
| Verdict | `READY_FOR_AW_R3` |
| Push | Nothing pushed |

## Release lineage (filled by lineage / freeze commits)

| Field | Value |
|-------|-------|
| Branch | `workspace/aw-r2-controlled-live-authorization` |
| Implementation commit | `002586b455849e9f4be4eec9d87548fb72a87438` |
| Documentary commit | `8dfdb08354a640c23d6d31cf062c2efbe665f122` |
| Lineage documentary commit | `96e270f6dd8b5aea2fdf2931e7345e60353791c7` |
| Freeze commit | `pending` |

## Release verdict

`READY_FOR_AW_R3`

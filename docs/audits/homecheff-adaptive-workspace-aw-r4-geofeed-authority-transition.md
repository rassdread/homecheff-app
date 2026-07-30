# AW-R4 — GeoFeed Authority Transition

## Stage identification

Stage **AW-R4** — GeoFeed Authority Transition.

Predecessor: **AW-R3** (final freeze `227c2ee6cb89e5a838d9df2e45c08dd2073ea152`; implementation `a58caed6f61ced4f55e986a493ba431058d9ab2b`).

Next eligible: **AW-R5** — Production Readiness (**not implemented**).

Roadmap authority: `docs/architecture/homecheff-adaptive-workspace-condensed-implementation-roadmap.md`.

## Objective

Transfer GeoFeed operational authority from the legacy host boundary to the Controlled Workspace architecture **without** remounting GeoFeed, creating a second instance, duplicating requests, or losing runtime state.

Successful result: `controlled-workspace-geofeed-authority-transitioned-not-production-on`

Successful lifecycle: `GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON`

Primary blocker: `PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY` (blocks Feed ON / production promotion; gate.allowed remains false)

## Explicit statements

- AW-R4 changes GeoFeed authority.
- AW-R4 does not authorize production Feed ON.
- AW-R4 does not complete production readiness.
- AW-R4 does not perform production promotion.

## Canonicalization

| Field | Value |
|-------|-------|
| Stage | AW-R4 |
| Title | GeoFeed Authority Transition |
| Result | `controlled-workspace-geofeed-authority-transitioned-not-production-on` |
| Lifecycle | `GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON` |
| Blocker | `PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY` |
| Bridge | v52 |
| Reader | `readControlledWorkspaceGeoFeedAuthorityTransition` |
| MetaOk | `geoFeedAuthorityTransitionMetaOk` |
| Proof port | 3072 |
| Rollback target | AW-R3 frozen contract |
| Next | AW-R5 — Production Readiness |

## Authority architecture

Authority is transferred as one atomic metadata pack over the **same** GeoFeed instance.

### Dimensions transferred (legacy → workspace)

| Dimension | Before (AW-R3) | After (AW-R4) |
|-----------|----------------|---------------|
| owner | legacy | workspace |
| writer | legacy | workspace |
| renderer | legacy | workspace |
| requestAuthority | legacy | workspace |
| paginationAuthority | legacy | workspace |
| cacheAuthority | legacy | workspace |
| observerAuthority | legacy | workspace |
| lifecycleAuthority | legacy | workspace |
| geoFeedAuthorityTransferred | false | true |
| renderActivation | false | true |
| legacyAuthorityActive | true | false |
| targetAuthorityActive | false | true |
| authorityCommitBoundary | PRE_COMMIT | COMMITTED |
| Pipeline | CONTROLLED_EXECUTABLE | AUTHORITY_TRANSITIONED |
| Transaction | CONTROLLED_EXECUTION | AUTHORITY_COMMITTED |

### Dimensions retained inside GeoFeed runtime (identity / continuity)

| Dimension | Value (unchanged) |
|-----------|-------------------|
| GeoFeed instance count | 1 |
| mountCount / geoFeedRenderCount / unmountCount | 1 / 1 / 0 |
| stableMountId | `feed.discovery.controlled-host.stable-mount.v1` |
| request identity | preserved |
| feed / filter / pagination / cache / scroll / loading / skeleton / tile state | preserved |
| feedOnAuthorized | false |
| productionPromotionAuthorized | false |

### Separation: renderActivation vs Feed ON

- Sealed AW-R4: `renderActivation=true` means Workspace holds **controlled renderer authority**.
- Host tip contract keeps dormant `hostActivation=false` / `renderActivation=false` for production UI takeover.
- `attemptFeedOn` / `feedOnAuthorized` remain closed.
- AW-R6 remains the only stage that may authorize final production Feed ON.

## Transition sequence

1. AW-R3 predecessor verified (Allowed/Executable/pipeline/tx/Workspace/runtime/legacy GeoFeed 1/1/0).
2. Target Workspace authority prepared (descriptor/contract/identity).
3. Target validated but inactive until commit (`targetAuthorityActive=false` pre-commit).
4. Legacy remains sole active authority until commit.
5. Atomic authority boundary commits (`authorityCommitBoundary=COMMITTED`).
6. Legacy authority becomes inactive (`legacyAuthorityActive=false`).
7. Target becomes sole active authority (`targetAuthorityActive=true`; owner/writer/renderer=`workspace`).
8. Post-transition invariants verified (single-* proofs; 1/1/0; Feed ON closed).
9. Rollback remains available to AW-R3 (`createControlledWorkspaceGeoFeedAuthorityTransitionRollbackContract`).

No stage permits dual writers, dual renderers, dual request authorities, or GeoFeed remount.

## Failure atomicity

If target preparation/validation fails before commit: legacy remains sole authority; pipeline/tx stay AW-R3; no partial transfer.

If failure is modeled after the commit boundary: rollback restores AW-R3 authority exactly once without remount or duplicate requests.

## Rollback

Metadata-gate-only rollback to AW-R3:

Allowed=true · Executable=true · Pipeline=CONTROLLED_EXECUTABLE · Transaction=CONTROLLED_EXECUTION · Workspace present · Runtime present · GeoFeed owner/writer/renderer=legacy · renderActivation=false · mount 1/1/0

Proven via `createControlledWorkspaceGeoFeedAuthorityTransitionRollbackContract()`; freeze tip remains AW-R4 transitioned state.

## Non-goals

AW-R5/AW-R6 not started. No production Feed ON. No production promotion. No remount. No second GeoFeed instance. Nothing pushed.

## Bridge / proof

| Field | Value |
|-------|-------|
| Bridge | v52 |
| Reader | `readControlledWorkspaceGeoFeedAuthorityTransition` |
| MetaOk | `geoFeedAuthorityTransitionMetaOk` |
| Proof port | 3072 |
| Gate | currentStep=`AW-R4`, eligibleStep=`AW-R5`, allowed=false |

## Proof summary

| Check | Result |
|-------|--------|
| Dedicated tests | PASS — 9 assertion groups |
| Validator | PASS |
| Forced-negative Chromium | 78/78 PASS (≥69 baseline) |
| Production build | PASS (sealed baseline) |
| Chromium | 20/20 PASS |
| Controlled Workspace regression | 20/20 PASS |
| GeoFeed regression | workspace authority 1/1/0 PASS (pre: legacy 1/1/0) |
| Recursive capability audit | PASS |
| Performance regression guard | PASS (mount/render 1/1/0; no remount; no duplicate requests) |
| Stable instance / mount / request identity | PASS |
| Single-owner / writer / renderer | PASS |
| Pagination / cache / observer authority | PASS (singular workspace) |
| Legacy deactivation / target activation | PASS |
| Failure atomicity / rollback | PASS |
| Verdict | `READY_FOR_AW_R5` |
| Push | Nothing pushed |

## Release lineage (filled by lineage / freeze commits)

| Field | Value |
|-------|-------|
| Branch | `workspace/aw-r4-geofeed-authority-transition` |
| Implementation commit | `28c8abe858e8cefe73c66e884048cb4526456448` |
| Documentary commit | `pending-docs` |
| Lineage documentary commit | `pending-lineage` |
| Freeze commit | `pending` |

## Release verdict

`READY_FOR_AW_R5`

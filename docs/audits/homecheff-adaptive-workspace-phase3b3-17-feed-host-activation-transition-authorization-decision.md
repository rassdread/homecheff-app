# Phase 3B.3.17 — Controlled Host Activation Transition Authorization Decision

| Field | Value |
|-------|--------|
| Phase | 3B.3.17 |
| Branch | `workspace/phase3b317-controlled-host-activation-transition-authorization-decision` |
| Implementation commit (proof target) | `da0916006f3ebdc05404b42c4fd79f630d906805` |
| Browser proof / audit commit | see tip after artifacts commit |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` · port **3038** |
| Probe bridge | **v18** |
| Decision | **READY FOR PHASE 3B.3.18** |

## 1. Goal / architecture position

Workspace subjects the Phase 3B.3.16 sealed Transition Preflight result (`transition-preflight-ready-not-authorized`, `COMMIT_READY->ACTIVE`) to a deterministic **authorization decision** evaluation. The decision determines whether the transition is **authorization-eligible** under sealed policy. It never grants, applies, or executes authorization, and never mutates state or runtime.

Phase position: descriptive chain step **17** (Activation Transition Authorization Decision). No executor, no scheduler, no authorization authority.

## 2. Relation to prior layers

| Layer | Relation |
|-------|----------|
| Transition Preflight (3B.3.16) | Required input; `preflightCompleted=true`, `preflightReady=true`, `failedPreflightChecks=[]` |
| Transition Selection (3B.3.15) | Selected candidate `COMMIT_READY->ACTIVE` preserved |
| Transition Graph (3B.3.14) | Edge existence/eligibility validated via chained evaluation |
| State Machine (3B.3.13) | `currentState`/`currentNode` remain `COMMIT_READY` |
| Commit Protocol / Readiness / Transaction / Pipeline / Plan / Decision | Cross-layer identity + result linkage validated |

Engine chains `evaluateControlledHostActivationTransitionPreflight(registry)` and evaluates authorization conditions/guards against sealed metadata only.

## 3. Authorization decision model / engine

Pure `evaluateControlledHostActivationTransitionAuthorizationDecision(registry)`:

- **71** unique ordered authorization conditions (preflight, transition, identity, ownership, runtime expectations, rollback, execution-block) — all satisfied on happy path
- **16** unique authorization guards — all satisfied on happy path
- Policy: `sealed-transition-authorization-policy` v1
- Strategy: `preflight-ready-then-sealed-policy-eligibility`
- `authorizationEligible=true` **AND** `authorizationBlocked=true` simultaneously
- `authorizationDecisionResult=authorization-eligible-not-granted`
- `wouldAuthorize=true`; grant/application/execution flags remain permanently false
- `currentState`/`currentNode` remain `COMMIT_READY`; `selectedTransition` remains `COMMIT_READY->ACTIVE`
- Gate blocker: `PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY`

Supporting artifacts: contract, identity, prepared metadata, diagnostics, probe bridge reader.

## 4. Eligible vs granted / wouldAuthorize vs applied

| Concept | Meaning in 3B.3.17 |
|---------|---------------------|
| `authorizationEligible=true` | Metadata satisfies all conditions/guards for *later* formal authorization |
| `wouldAuthorize=true` | Policy would authorize **if** a later grant phase existed |
| `authorizationGranted=false` | No permission granted |
| `authorizationApplied=false` | No authorization applied to runtime |
| `transitionAuthorized=false` | Transition not authorized for execution |
| `authorizationDecisionExecuted=false` | Decision is metadata modelling, not an executable action |

Eligibility is **not** authorization, runtime authority, execution permission, activation, commit, or ownership/writer/renderer transfer.

## 5. Proven outcome

| Field | Value |
|-------|--------|
| authorizationDecisionCompleted | `true` |
| authorizationEligible | `true` |
| authorizationBlocked | `true` |
| wouldAuthorize | `true` |
| authorizationDecisionResult | `authorization-eligible-not-granted` |
| authorizationReason | `all-preflight-and-policy-conditions-satisfied-but-grant-disabled-by-phase-contract` |
| authorizationGranted | `false` |
| authorizationApplied | `false` |
| transitionAuthorized | `false` |
| authorizationDecisionExecuted | `false` |
| authorizationExecutionAllowed | `false` |
| transitionExecutionAllowed | `false` |
| preflightReady (linked) | `true` |
| preflightResult (linked) | `transition-preflight-ready-not-authorized` |
| failedPreflightChecks | `[]` |
| selectedTransition | `COMMIT_READY->ACTIVE` |
| selectedFromState / selectedToState | `COMMIT_READY` / `ACTIVE` |
| currentState / currentNode | `COMMIT_READY` / `COMMIT_READY` |
| canStartActivation | `false` |
| hostActivation / renderActivation / activationState | `false` / `false` / dormant |
| nextEligibleStep | `3B.3.18` |

## 6. Identity / ownership / runtime (browser-measured on `da09160`)

- mount=1, unmount=0, single GeoFeed instance
- stable `runtimeId` / `hostId` / machine / graph / selection / preflight / selected-transition / protocol / transaction / authorization-policy identities
- owner=legacy, writer=legacy, renderer=legacy
- ownershipTransferred / writerTransferred / rendererTransferred = false
- shell `return null`; registry + authorization-decision metadata-only
- zero DOM / renderer / writer / owner / request / observer / cache deltas (per sealed invariants)

## 7. Probe / browser proof

Probe bridge **v18** · port **3038** · artifacts under `docs/audits/artifacts/phase3b317/`

Proof target commit: `da0916006f3ebdc05404b42c4fd79f630d906805`

- 20/20 release-blocking invariants PASS
- `authorizationMetaOk=true`
- `forcedNegativeProofsOk=true` (grant/application/execution/activation/commit/rollback/transfer/state-mutation attempts fail-closed)
- Forced activation blocked by `PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY`
- Phase 3B.2 rerun **20/20 PASS**
- Prior Phase 3B.3.16 preflight proof required at `READY_FOR_PHASE_3B_3_17`
- Verdict: **`READY_FOR_PHASE_3B_3_18`**

## 8. Validators / tests / build

- `validate:adaptive-workspace-feed-activation-transition-authorization-decision` PASS (with artifacts)
- Prior validators dormant → preflight PASS
- Unit suites Phase 3B.3.1–3B.3.17 PASS (authorization-decision **9/9**)
- Sealed production build PASS (`NEXT_PUBLIC_FEED_SEALED_BASELINE=1`)

## 9. Regression risks / known limits toward Phase 3B.3.18

**Risks:** treating eligibility as a grant; enabling `authorizationGranted` / `transitionAuthorized` / execution flags; mutating `currentState`/`currentNode`; wrapping GeoFeed; advancing gate without new phase blocker.

**Not done in 3B.3.17:** authorization grant, authorization application, transition authorization/execution, preflight/selection/graph execution, activation, commit, rollback, ownership/writer/renderer transfer, scheduler/executor.

Phase 3B.3.18 must not interpret eligibility as permission to mutate runtime.

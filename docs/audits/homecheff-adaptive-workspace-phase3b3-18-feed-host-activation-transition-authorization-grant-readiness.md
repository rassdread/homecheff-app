# Phase 3B.3.18 — Controlled Host Activation Transition Authorization Grant Readiness

| Field | Value |
|-------|--------|
| Phase | 3B.3.18 |
| Branch | `workspace/phase3b318-controlled-host-activation-transition-authorization-grant-readiness` |
| Implementation commit (proof target) | _pending — filled in after proof run_ |
| Browser proof / audit commit | _pending — filled in after proof run_ |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` · port **3039** |
| Probe bridge | **v19** |
| Decision | _pending — **READY FOR PHASE 3B.3.19** once proof passes_ |

## 1. Goal / architecture position

Workspace subjects the Phase 3B.3.17 sealed Authorization Decision result (`authorization-eligible-not-granted`, `COMMIT_READY->ACTIVE`) to a deterministic **grant readiness** evaluation. Grant readiness determines whether sealed metadata is consistent enough to prepare a future authorization grant. It never issues, creates, persists, or applies a grant, never grants authority, and never mutates state or runtime.

Phase position: descriptive chain step **18** (Activation Transition Authorization Grant Readiness). No executor, no scheduler, no grant authority.

## 2. Relation to prior layers

| Layer | Relation |
|-------|----------|
| Authorization Decision (3B.3.17) | Required input; `authorizationDecisionCompleted=true`, `authorizationEligible=true`, `authorizationGranted=false` |
| Transition Preflight (3B.3.16) | `preflightCompleted=true`, `preflightReady=true` preserved via chained evaluation |
| Transition Selection (3B.3.15) | Selected candidate `COMMIT_READY->ACTIVE` preserved |
| Transition Graph / State Machine / Commit Protocol / Transaction / Pipeline / Plan / Decision | Cross-layer identity + result linkage validated |

Engine chains `evaluateControlledHostActivationTransitionAuthorizationDecision(registry)` and evaluates grant-readiness conditions/guards against sealed metadata only.

## 3. Grant readiness model / engine

Pure `evaluateControlledHostActivationTransitionAuthorizationGrantReadiness(registry)`:

- **94** unique ordered grant conditions (authorization-decision, preflight, transition, identity, ownership, runtime, rollback, grant-block, execution-block) — all satisfied on happy path
- **24** unique grant guards — all satisfied on happy path
- Policy: `sealed-authorization-grant-readiness-policy` v1
- Strategy: `authorization-eligible-then-sealed-grant-readiness`
- `grantReady=true` **AND** `grantBlocked=true` simultaneously
- `grantReadinessResult=authorization-grant-ready-not-issued`
- `wouldIssueGrant=true`; issuance/creation/persistence/application/authority flags remain permanently false
- No grant token/secret/signature/callback present
- `currentState`/`currentNode` remain `COMMIT_READY`; `selectedTransition` remains `COMMIT_READY->ACTIVE`
- Gate blocker: `PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY`

Supporting artifacts: contract, identity, prepared metadata, diagnostics, probe bridge reader.

## 4. Ready vs issued / would-issue vs applied

| Concept | Meaning in 3B.3.18 |
|---------|---------------------|
| `grantReady=true` | Metadata satisfies all conditions/guards for a *later* formal grant |
| `wouldIssueGrant=true` | Policy would issue a grant **if** a later issuance phase existed |
| `grantIssued=false` | No grant issued |
| `grantCreated=false` / `grantPersisted=false` / `grantApplied=false` | No grant created, persisted, or applied to runtime |
| `grantAuthorityAvailable=false` / `grantAuthorityEnabled=false` | No grant authority available or enabled |
| `grantReadinessExecuted=false` | Readiness is metadata modelling, not an executable action |

Readiness is **not** issuance, authority, execution permission, activation, commit, or ownership/writer/renderer transfer.

## 5. Proven outcome

_Pending — table below to be filled in from the proof artifact once `npm run probe:adaptive-workspace-feed-activation-transition-authorization-grant-readiness` completes._

| Field | Value |
|-------|--------|
| grantReadinessCompleted | _pending_ |
| grantReady | _pending_ |
| grantBlocked | _pending_ |
| wouldIssueGrant | _pending_ |
| grantReadinessResult | _pending_ |
| grantIssued | _pending_ |
| grantCreated | _pending_ |
| grantPersisted | _pending_ |
| grantApplied | _pending_ |
| grantAuthorityAvailable | _pending_ |
| grantReadinessExecuted | _pending_ |
| authorizationEligible (linked) | _pending_ |
| authorizationGranted (linked) | _pending_ |
| selectedTransition | _pending_ |
| currentState / currentNode | _pending_ |
| canStartActivation | _pending_ |
| hostActivation / renderActivation / activationState | _pending_ |
| nextEligibleStep | _pending_ |

## 6. Identity / ownership / runtime (browser-measured)

_Pending — filled in from proof run._

- mount=1, unmount=0, single GeoFeed instance
- stable `runtimeId` / `hostId` / machine / graph / selection / preflight / selected-transition / protocol / transaction / authorization-decision / authorization-policy / grant-policy identities
- owner=legacy, writer=legacy, renderer=legacy
- ownershipTransferred / writerTransferred / rendererTransferred = false
- shell `return null`; registry + grant-readiness metadata-only
- zero DOM / renderer / writer / owner / request / observer / cache deltas (per sealed invariants)

## 7. Probe / browser proof

Probe bridge **v19** · port **3039** · artifacts under `docs/audits/artifacts/phase3b318/`

Proof target commit: _pending_

- 20/20 release-blocking invariants PASS (expected)
- `grantMetaOk=true` (expected)
- `forcedNegativeProofsOk=true` (expected; grant creation/issuance/persistence/application/authority/authorization/transition/activation attempts fail-closed)
- Forced activation blocked by `PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY`
- Phase 3B.2 rerun **20/20 PASS** (expected)
- Prior Phase 3B.3.17 authorization decision proof required at `READY_FOR_PHASE_3B_3_18`
- Verdict: _pending_ (expected **`READY_FOR_PHASE_3B_3_19`**)

## 8. Validators / tests / build

- `validate:adaptive-workspace-feed-activation-transition-authorization-grant-readiness` — run before/after proof
- Prior validators dormant → authorization decision PASS
- Unit suites Phase 3B.3.1–3B.3.18 PASS (grant-readiness **9/9**)
- Sealed production build PASS (`NEXT_PUBLIC_FEED_SEALED_BASELINE=1`)

## 9. Regression risks / known limits toward Phase 3B.3.19

**Risks:** treating readiness as a grant; enabling `grantIssued` / `grantCreated` / `grantPersisted` / `grantApplied` / `grantAuthorityAvailable` / `authorizationGranted` / `transitionAuthorized` / execution flags; mutating `currentState`/`currentNode`; wrapping GeoFeed; advancing gate without new phase blocker.

**Not done in 3B.3.18:** grant creation, grant issuance, grant persistence, grant application, grant authority, authorization grant/application, transition authorization/execution, preflight/selection/graph execution, activation, commit, rollback, ownership/writer/renderer transfer, scheduler/executor.

Phase 3B.3.19 must not interpret grant readiness as permission to mutate runtime.

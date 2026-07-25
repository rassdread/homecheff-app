# Phase 3B.3.17 — Controlled Host Activation Transition Authorization Decision

| Field | Value |
|-------|--------|
| Phase | 3B.3.17 |
| Branch | `workspace/phase3b317-controlled-host-activation-transition-authorization-decision` |
| Implementation commit | _pending — fill in after proof run_ |
| Browser proof commit | _pending — fill in after proof run_ |
| Browser | Chromium · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` · port 3038 |
| Decision | _pending — fill in after proof run_ |

## 1. Goal / architecture position

Workspace subjects the Phase 3B.3.16 sealed preflight result (ready-not-authorized, for the `COMMIT_READY->ACTIVE` candidate) to a deterministic authorization-decision evaluation. The decision determines whether the transition *would* be eligible for authorization under sealed policy — it never grants, applies, or executes that authorization, and never mutates state or runtime.

## 2. Relation to prior layers

The authorization decision chains `evaluateControlledHostActivationTransitionPreflight` (which already chains selection → graph → state machine → commit protocol path). It cross-checks preflight completeness/readiness, selected-transition identity, host/runtime/graph/machine/protocol/transaction identities, ownership, and sealed-runtime invariants before concluding eligibility.

## 3. Authorization decision model / engine

Pure `evaluateControlledHostActivationTransitionAuthorizationDecision(registry)`:

- ~90 unique ordered authorization conditions (preflight, transition, identity, ownership, runtime expectations, rollback, execution-block) — all satisfied on the happy path
- 16 unique authorization guards — all satisfied on the happy path
- `authorizationEligible=true` AND `authorizationBlocked=true` simultaneously
- `authorizationDecisionResult=authorization-eligible-not-granted`
- `wouldAuthorize=true`; grant/application/execution flags remain permanently false
- `currentState`/`currentNode` remain `COMMIT_READY`; `selectedTransition` remains `COMMIT_READY->ACTIVE`

## 4. Eligible vs granted

`authorizationEligible=true` means the sealed metadata for the selected edge satisfies every authorization condition/guard. It does **not** grant `authorizationGranted`, `authorizationApplied`, or `transitionAuthorized`. Phase contract keeps those false via `PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY`.

## 5. Expected outcome (to be proven)

| Field | Value |
|-------|--------|
| authorizationDecisionCompleted | `true` |
| authorizationEligible | `true` |
| authorizationBlocked | `true` |
| wouldAuthorize | `true` |
| authorizationDecisionResult | `authorization-eligible-not-granted` |
| authorizationGranted | `false` |
| authorizationApplied | `false` |
| transitionAuthorized | `false` |
| authorizationDecisionExecuted | `false` |
| authorizationExecutionAllowed | `false` |
| preflightReady (linked) | `true` |
| preflightResult (linked) | `transition-preflight-ready-not-authorized` |
| selectedTransition | `COMMIT_READY->ACTIVE` |
| currentState / currentNode | `COMMIT_READY` / `COMMIT_READY` |
| canStartActivation | `false` |
| nextEligibleStep | `3B.3.18` |

## 6. Identity / ownership / runtime

To be browser-measured on the proof commit: mount=1, unmount=0, stable `runtimeId`, owner/writer/renderer legacy, transfers false, shell `return null`, registry + authorization decision metadata-only.

## 7. Probe / browser proof

Probe bridge **v18** · port **3038** · artifact under `docs/audits/artifacts/phase3b317/`

- 20/20 invariants PASS (expected) · `authorizationMetaOk=true` (expected)
- Forced negative proofs covering: authorization decision execution, grant, application, transition authorization, transition execution, preflight execution, selection execution, graph traversal, activation, commit, rollback, ownership/writer/renderer transfers, and state/node/selectedTransition mutation — all expected false/unchanged
- Forced activation attempt blocked (`PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY`)
- Phase 3B.2 rerun 20/20 PASS (expected)
- Prior Phase 3B.3.16 preflight proof required at `READY_FOR_PHASE_3B_3_17`
- Verdict: `READY_FOR_PHASE_3B_3_18` (pending actual run)

_Run `SKIP_BUILD=1 node scripts/run-feed-host-activation-transition-authorization-decision-proof-phase3b317.mjs` (after a sealed-baseline production build) to populate this section with real numbers._

## 8. Validators / tests / build

Authorization decision unit tests live in `lib/adaptive-workspace/tests/run-host-activation-transition-authorization-decision-tests.ts` (descriptor determinism, engine/diagnostics, fail-closed descriptor/contract/identity/prepared-contract validation, gate blocking, owner/writer/renderer/rollback stability). Prior dormant → preflight validators/tests remain green. Sealed production build expected PASS with `NEXT_PUBLIC_FEED_SEALED_BASELINE=1`.

## 9. Limits toward Phase 3B.3.18

The authorization decision does **not** grant authorization, apply authorization, authorize the transition, execute the transition/selection/graph traversal, commit, roll back, or transfer ownership/writer/renderer. Eligibility must not be treated as a grant in 3B.3.18.

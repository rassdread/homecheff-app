# Phase 3B.3.16 — Controlled Host Activation Transition Preflight

| Field | Value |
|-------|--------|
| Phase | 3B.3.16 |
| Branch | `workspace/phase3b316-controlled-host-activation-transition-preflight` |
| Browser | Chromium · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` · port **3037** |
| Decision | **PENDING PROOF** (contracts wired; run orchestrator for READY_FOR_PHASE_3B_3_17) |

## 1. Goal / architecture position

Workspace validates the selected transition candidate (`COMMIT_READY->ACTIVE`) across sealed upstream layers via deterministic preflight checks. Metadata only. Phase 16 sits after Transition Selection (15) and before activation-candidate work (17). No executor, scheduler, traversal, transition execution, authorization, activation, commit, or rollback.

## 2. Relation to Selection / upstream layers

Preflight reads completed unexecuted selection metadata (`transition-selected-not-executable`), graph/machine/protocol/commit readiness, and registry identity. All 81 mandatory checks pass when upstream sealed metadata is valid. Preflight never mutates `currentState`/`currentNode` (remain `COMMIT_READY`).

## 3. Preflight model / engine

Pure `evaluateControlledHostActivationTransitionPreflight(registry)`:

1. Validate registry identity/ownership
2. Require sealed selection at `COMMIT_READY->ACTIVE`
3. Run 81 ordered unique preflight checks (identity, state, graph, selection, commit, rollback, ownership, runtime, execution-block)
4. Emit `transition-preflight-ready-not-authorized`
5. Never authorize or execute

| Field | Value |
|-------|--------|
| preflightResult | `transition-preflight-ready-not-authorized` |
| preflightReady | `true` |
| preflightBlocked | `true` |
| preflightExecuted | `false` |
| transitionAuthorized | `false` |
| authorizationGranted | `false` |
| selectedTransition | `COMMIT_READY->ACTIVE` |
| activationBlocker | `PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY` |
| nextEligibleStep | `3B.3.17` |

## 4. Checks / blockers / fail-closed

`CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS` — 81 checks, all pass under sealed upstream. Blockers permanently deny preflight/authorization/transition execution. Contract forbids all execution flags. Identity forbids preflight/authorization/transition/activation via preflight path.

## 5. Identity / ownership / runtime

Browser proof expects mount=1, unmount=0, stable `runtimeId`, owner/writer/renderer legacy, transfers false, shell `return null`, single GeoFeed mount. `preflightReady=true` while `transitionAuthorized=false`.

## 6. Probe bridge / browser proof

Probe bridge **v17** exposes `readHostActivationTransitionPreflight` (read-only). Artifact target: `docs/audits/artifacts/phase3b316/phase3b3-16-feed-host-activation-transition-preflight-proof.json`

- New Chromium production run on port **3037**
- Requires prior selection proof `READY_FOR_PHASE_3B_3_16`
- Expect `preflightMetaOk=true`, forced activation blocked (`PHASE_3B3_16_…`)
- Verdict target: `READY_FOR_PHASE_3B_3_17`

## 7. Validators / tests

- `run-host-activation-transition-preflight-tests.ts` — 8 assertions
- `validate-adaptive-workspace-feed-activation-transition-preflight.ts` — static validator (artifacts optional until proof)
- Prior dormant → selection validators/tests updated for LIVE gate 3B.3.16 / eligible 3B.3.17

## 8. Regression risk / limits toward 3B.3.17

Low: metadata-only. Preflight does **not** authorize execution, traversal, commit, activation, ownership/writer/renderer transfer, executor, or scheduler. `canStartActivation=false` remains. Phase 3B.3.17 must not treat preflight-ready as authorization to activate.

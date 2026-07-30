# Phase 3B.3.15 — Controlled Host Activation Transition Selection

| Field | Value |
|-------|--------|
| Phase | 3B.3.15 |
| Branch | `workspace/phase3b315-controlled-host-activation-transition-selection` |
| Implementation commit | `9a92c08babcedb5ac798fb386d1f6fd0acaaa2e2` |
| Browser proof commit | `9a92c08babcedb5ac798fb386d1f6fd0acaaa2e2` |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` · port 3036 |
| Decision | **READY FOR PHASE 3B.3.16** |

## 1. Goal / architecture position

Workspace deterministically selects the theoretical next transition candidate from the sealed Activation State Machine and Transition Graph. Metadata only. Phase 15 sits after Transition Graph (14) and before any future execution-oriented step (16). No executor, scheduler, traversal, transition execution, activation, commit, or rollback.

## 2. Relation to State Machine / Transition Graph

Selection reads completed unexecuted state-machine (`COMMIT_READY`) and transition-graph descriptors. Outgoing theoretical edges from `COMMIT_READY` are taken from sealed graph `blockedPaths` (`COMMIT_READY->ACTIVE|ABORTED|ROLLED_BACK`). Selection never mutates machine or graph metadata.

## 3. Selection model / engine

Pure `evaluateControlledHostActivationTransitionSelection(registry)`:

1. Validate registry identity/ownership
2. Require completed untraversed graph at `COMMIT_READY`
3. Collect candidate outgoing edges
4. Classify eligible (`COMMIT_READY->ACTIVE`) vs ineligible (abort/rollback)
5. Rank by activation-path priority, then lexicographic transitionId
6. Select exactly one winner: `COMMIT_READY->ACTIVE`
7. Never execute; `currentState`/`currentNode` remain `COMMIT_READY`

| Field | Value |
|-------|--------|
| selectionResult | `transition-selected-not-executable` |
| selectionCompleted | `true` |
| selectionExecuted | `false` |
| selectedTransition | `COMMIT_READY->ACTIVE` |
| selectedFromState | `COMMIT_READY` |
| selectedToState | `ACTIVE` |
| selectionStrategy | `activation-path-priority-then-lexicographic-transition-id` |
| selectionPriority | `100` |
| deterministicTieBreak | `lexicographic-transition-id` |
| activationBlocker | `PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY` |
| nextEligibleStep | `3B.3.16` |

## 4. Candidate classification

| Set | Members |
|-----|---------|
| candidateTransitions | `COMMIT_READY->ABORTED`, `COMMIT_READY->ACTIVE`, `COMMIT_READY->ROLLED_BACK` (lex sorted) |
| eligibleTransitions | `COMMIT_READY->ACTIVE` |
| ineligibleTransitions | `COMMIT_READY->ABORTED`, `COMMIT_READY->ROLLED_BACK` |
| alternativeTransitions | same as ineligible |

Sets are disjoint, deterministic, and reference existing graph-model edges only.

## 5. Guards / blockers / fail-closed

Guards cover identity, ownership, graph/machine completeness, and execution forbids. Blockers permanently deny selection/transition/traversal/activation execution. Mismatch of host/runtime/graph/state, duplicate IDs, or unresolved ties throw `HardContractViolation` (no silent fallback).

## 6. Identity / ownership / runtime

Browser-measured on proof commit `9a92c08`: mount=1, unmount=0, stable `runtimeId`, owner/writer/renderer legacy, transfers false, registry + transition-selection metadata-only. Shell `return null`. `currentState`/`currentNode` remain `COMMIT_READY` after selection.

## 7. Probe bridge / browser proof

Probe bridge **v16** exposes `readHostActivationTransitionSelection` (read-only). Artifact: `docs/audits/artifacts/phase3b315/phase3b3-15-feed-host-activation-transition-selection-proof.json`

- New Chromium production run on port **3036**
- 20/20 invariants PASS · `transitionSelectionMetaOk=true`
- Forced activation blocked (`PHASE_3B3_15_…`)
- Phase 3B.2 rerun 20/20 PASS
- Verdict: `READY_FOR_PHASE_3B_3_16`

## 8. Validators / tests / build

Selection validator ok (with artifacts). Prior dormant → transition-graph validators/tests green. Unit suites 3B.3.1–3B.3.15 green (selection 8/8). Sealed production build PASS.

## 9. Regression risk / limits toward 3B.3.16

Low: metadata-only. Selection does **not** authorize execution, traversal, commit, activation, ownership/writer/renderer transfer, executor, or scheduler. `canStartActivation=false` remains. Phase 3B.3.16 must not treat selectedTransition as an execution mandate.

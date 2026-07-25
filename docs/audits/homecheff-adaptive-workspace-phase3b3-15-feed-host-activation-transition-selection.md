# Phase 3B.3.15 — Controlled Host Activation Transition Selection

| Field | Value |
|-------|--------|
| Phase | 3B.3.15 |
| Branch | `workspace/phase3b315-controlled-host-activation-transition-selection` |
| Implementation commit | _(pending proof)_ |
| Browser proof commit | _(pending proof)_ |
| Browser | Chromium · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` · port 3036 |
| Decision | **PENDING PROOF — contract wiring complete** |

## 1. Architecture

Workspace builds a sealed Activation *Transition Selection* atop the Activation Transition Graph. The selection engine deterministically chooses the theoretical next transition candidate (`COMMIT_READY->ACTIVE`) from sealed outgoing edges. GeoFeed remains sole owner of rendering, writer, and all Feed runtime surfaces.

`hostActivation=false`, `renderActivation=false`, `canStartActivation=false`, `selectionExecuted=false`, `transitionExecuted=false`, `graphTraversalExecuted=false`, `transactionCommitted=false`, `protocolExecuted=false`, ownership/writer/renderer remain legacy. No executor. No scheduler. No selection execution. No traversal. No transition execution. No commit. No rollback. No runtime mutation.

## 2. Selection model

| Field | Value |
|-------|--------|
| hostId | `feed.discovery.controlled-host` |
| runtimeId | `feed.discovery.legacy-single-mount.v1` |
| selectionId | `feed.discovery.controlled-host.activation-transition-selection.v1` |
| selectionVersion | `1` |
| selectionState | `completed` |
| selectionResult | `transition-selected-not-executable` |
| currentState / currentNode | `COMMIT_READY` (unchanged) |
| candidateTransitions | `COMMIT_READY->ABORTED`, `COMMIT_READY->ACTIVE`, `COMMIT_READY->ROLLED_BACK` |
| eligibleTransitions | `COMMIT_READY->ACTIVE` |
| ineligibleTransitions | abort + rollback paths |
| selectedTransition | `COMMIT_READY->ACTIVE` |
| selectionStrategy | `activation-path-priority-then-lexicographic-transition-id` |
| selectionExecuted | `false` (always) |
| owner / writer / renderer | legacy / legacy / legacy |
| activationState | dormant / false |
| rollbackState | `prepared-not-active` |
| nextEligibleStep | `3B.3.16` |
| activationBlocker | `PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY` |

Components: Transition Selection Contract, Descriptor + Engine, Diagnostics, Validator, Browser Instrumentation (`readHostActivationTransitionSelection`, probe v16).

## 3. Selection engine

Pure `evaluateControlledHostActivationTransitionSelection(registry)`:

- no side effects / React / browser / global state
- chains `evaluateControlledHostActivationTransitionGraph(registry)`
- classifies outgoing `COMMIT_READY` edges into eligible/ineligible sets
- ranks eligible edges by activation-path priority + lexicographic tie-break
- selects `COMMIT_READY->ACTIVE` as theoretical winner
- `selectionExecuted` remains false; currentState/currentNode remain `COMMIT_READY`
- identical input → identical output

## 4. Candidates / eligibility / guards

Candidates mirror sealed outgoing edges from `COMMIT_READY`. Only the activation path to `ACTIVE` is eligible; abort/rollback paths are ineligible but preserved as alternatives. Guards/blockers permanently deny selection execution because no executor exists and `selectionExecutionAllowed=false`.

## 5. Diagnostics

Readable: `selectionCompleted`, `selectionResult`, `currentState`, `currentNode`, `candidateTransitions`, `eligibleTransitions`, `ineligibleTransitions`, `selectedTransition`, `selectionReason`, `selectionStrategy`, upstream graph/machine/protocol results, `currentPhase=3B.3.15`, `nextEligibleStep=3B.3.16`.

## 6. Identity / ownership / runtime

Browser-measured expectations: mount=1, unmount=0, stable `runtimeId`, React identity stable, owner/writer/renderer legacy, registry + activation-transition-selection metadata-only. Shell remains `return null`. Forced activation blocked.

## 7. Browser proof

Artifact (after orchestrator): `docs/audits/artifacts/phase3b315/phase3b3-15-feed-host-activation-transition-selection-proof.json`

- New Chromium production run (requires Phase 3B.3.14 graph proof artifact as upstream reference)
- 20/20 release-blocking invariants PASS
- Transition selection metadata + diagnostics + `selectedTransition=COMMIT_READY->ACTIVE` visible
- `selectionExecuted=false`, `transitionExecuted=false`, `graphTraversalExecuted=false`
- Forced activation blocked (`PHASE_3B3_15_…`)
- `transitionSelectionMetaOk=true`, verdict `READY_FOR_PHASE_3B_3_16`

## 8. Validators / tests

Unit suite: `run-host-activation-transition-selection-tests.ts`  
Static validator: `validate-adaptive-workspace-feed-activation-transition-selection.ts` (artifacts optional until proof; `REQUIRE_PHASE3B315_ARTIFACTS=1` for strict mode)

## 9. Regression risk

Low: metadata-only extension of sealed host path; no GeoFeed remount, no DOM/UI change, no writer/renderer ownership shift. Residual risk is gate/blocker drift in historical layer tests (mitigated by layer-owned `PHASE_3B3_N` on prior descriptors).

## 10. Limits toward Phase 3B.3.16

Transition selection does **not** authorize selection execution, graph traversal, transition execution, commit, activation, ownership/writer/renderer transfer, executor, or scheduler. `canStartActivation` remains `false`. Next eligible step remains under 3B.3.16 constraints.

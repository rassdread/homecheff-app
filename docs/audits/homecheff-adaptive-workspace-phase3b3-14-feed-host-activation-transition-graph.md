# Phase 3B.3.14 — Controlled Host Activation Transition Graph

| Field | Value |
|-------|--------|
| Phase | 3B.3.14 |
| Branch | `workspace/phase3b314-controlled-host-activation-transition-graph` |
| Implementation commit | `20d39ebf9d71f662aba84b61a660060674b66c24` |
| Browser proof commit | `20d39ebf9d71f662aba84b61a660060674b66c24` |
| Browser | Chromium Chrome/131 · production · `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` · port 3035 |
| Decision | **READY FOR PHASE 3B.3.15** |

## 1. Architecture

Workspace builds a sealed Activation *Transition Graph* atop the Activation State Machine. The graph describes theoretical nodes, edges, dependencies, guards, blockers, and paths as metadata only. GeoFeed remains sole owner of rendering, writer, and all Feed runtime surfaces.

`hostActivation=false`, `renderActivation=false`, `canStartActivation=false`, `transactionCommitted=false`, `protocolExecuted=false`, `transitionExecuted=false`, `graphTraversalExecuted=false`, ownership/writer/renderer remain legacy. No executor. No scheduler. No traversal. No transition execution. No commit. No rollback. No runtime mutation.

## 2. Graph model

| Field | Value |
|-------|--------|
| hostId | `feed.discovery.controlled-host` |
| runtimeId | `feed.discovery.legacy-single-mount.v1` |
| graphId | `feed.discovery.controlled-host.activation-transition-graph.v1` |
| graphVersion | `1` |
| graphState | `completed` |
| graphResult | `transition-graph-complete-not-executable` |
| currentNode | `COMMIT_READY` |
| entryNode | `LEGACY_DORMANT` |
| terminalNodes | `ACTIVE` (theoretical), `ABORTED`, `ROLLED_BACK` |
| graphNodes | 14 lifecycle nodes |
| graphEdges | 10 sealed allowed edges |
| reachableNodes | path nodes through `COMMIT_READY` |
| unreachableNodes | `ACTIVE`, `ABORTED`, `ROLLED_BACK` |
| allowedPaths | 1 linear sealed path to `COMMIT_READY` |
| blockedPaths | includes `COMMIT_READY->ACTIVE` and forced-activation paths |
| edgeGuards / blockers / preconditions | sealed arrays |
| graphTraversalExecuted | `false` (always) |
| owner / writer / renderer | legacy / legacy / legacy |
| activationState | dormant / false |
| rollbackState | `prepared-not-active` |
| nextEligibleStep | `3B.3.15` |
| activationBlocker | `PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY` |

Components: Transition Graph Contract, Descriptor + Engine, Diagnostics, Validator, Browser Instrumentation (`readHostActivationTransitionGraph`, probe v15).

## 3. Graph engine

Pure `evaluateControlledHostActivationTransitionGraph(registry)`:

- no side effects / React / browser / global state
- chains `evaluateControlledHostActivationStateMachine(registry)`
- builds nodes from lifecycle states; edges from allowed transitions
- computes reachable/unreachable nodes and allowed/blocked paths deterministically
- `graphTraversalExecuted` remains false; `ACTIVE` is unreachable
- identical input → identical output

## 4. Nodes / edges / paths / guards

Nodes mirror the sealed lifecycle. Edges are the theoretical allowed transitions ending at `COMMIT_READY`. The single allowed path is the linear chain from `LEGACY_DORMANT` to `COMMIT_READY`. Blocked paths permanently deny jumps to `ACTIVE` and forced-activation traversals. Edge guards/blockers permanently deny traversal because no executor exists and `graphTraversalAllowed=false`.

## 5. Diagnostics

Readable: `graphCompleted`, `graphResult`, `currentNode`, `reachableNodes`, `unreachableNodes`, `allowedPaths`, `blockedPaths`, `edgeGuards`, `edgeBlockers`, `edgePreconditions`, `invariants`, upstream state-machine/protocol results, `currentPhase=3B.3.14`, `nextEligibleStep=3B.3.15`.

## 6. Identity / ownership / runtime

Browser-measured on proof commit `20d39eb`: mount=1, unmount=0, stable `runtimeId`, React identity stable, owner/writer/renderer legacy, registry + activation-transition-graph metadata-only. Shell remains `return null`. Forced activation blocked.

## 7. Browser proof

Artifact: `docs/audits/artifacts/phase3b314/phase3b3-14-feed-host-activation-transition-graph-proof.json`

- New Chromium production run (not reused)
- Proof commit matches implementation commit `20d39eb`
- 20/20 release-blocking invariants PASS
- Transition graph metadata + diagnostics + `currentNode=COMMIT_READY` visible
- `graphTraversalExecuted=false`, `transitionExecuted=false`, `protocolExecuted=false`, `transactionCommitted=false`
- Forced activation blocked (`PHASE_3B3_14_…`)
- Phase 3B.2 rerun also 20/20 PASS
- `transitionGraphMetaOk=true`, verdict `READY_FOR_PHASE_3B_3_15`

## 8. Validators / tests

All green through sealed → activation-state-machine + activation-transition-graph; unit suites including 8 transition-graph assertions; production sealed build pass; `validate:adaptive-workspace-feed-activation-transition-graph` ok (with artifacts).

## 9. Regression risk

Low: metadata-only extension of sealed host path; no GeoFeed remount, no DOM/UI change, no writer/renderer ownership shift. Residual risk is gate/blocker drift in historical layer tests (mitigated by layer-owned `PHASE_3B3_N` restores).

## 10. Limits toward Phase 3B.3.15

Transition graph does **not** authorize graph traversal, transition execution, commit, activation, ownership/writer/renderer transfer, executor, or scheduler. `canStartActivation` remains `false`. Next eligible step remains under 3B.3.15 constraints.

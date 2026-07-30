# Phase 3B.3.45 — Controlled Workspace Host Candidate Active

## Phase identification

Phase **3B.3.45** — Controlled Workspace Host Candidate Active.

Predecessor: Phase **3B.3.44** (final freeze `a05ad10b4c5be068da0c043ff114a9d597f764d3`; reproof target `69e6ab57294975beeab6355d4c9885b487c0b175`).

Next eligible: **3B.3.46** (sequential only; title not yet confirmed; **not implemented**).

## Objective

Advance exactly one architectural fact: after Phase 3B.3.44 candidate activation, the candidate is now **active** as sealed metadata only. This phase does **not** set `candidateExecutable`, unlock Allowed/Executable, render or mount Workspace, create runtime capability, or transfer GeoFeed authority.

Successful result: `controlled-workspace-host-candidate-active-not-executable`

Successful lifecycle state: `CANDIDATE_ACTIVE_NOT_EXECUTABLE`

Primary blocker: `PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY`

Primary transition: `candidateActive: false → true` (transitionCount=1)

## Authority verification

Authority was verified before branch creation:

- Branch: `workspace/phase3b344-controlled-workspace-host-candidate-activation`
- HEAD: `a05ad10b4c5be068da0c043ff114a9d597f764d3`

Target branch created from that exact freeze HEAD:

`workspace/phase3b345-controlled-workspace-host-candidate-active`

## Active is not Executable / Workspace / Runtime

| Field | Decision | Evidence |
|-------|----------|----------|
| `candidateActive` | **advanced** `false` → `true` | Sole primary action fact for this phase |
| `candidateActivated` | **present and remains true** | Frozen from 3B.3.44 |
| `candidateActivationReady` / `Authorized` | **remain true** | Frozen predecessors |
| `candidateExecutable` | **present and remains false** | Must not be derived from Active |
| `candidateActivationStarted` / `Executed` / `Completed` | **absent** | Not introduced |
| Allowed / Executable / Pipeline | false / false / NON_EXECUTABLE | Preserved |
| Transaction | OPENED | Preserved |
| Workspace / runtime / handles | absent | Preserved |
| GeoFeed | legacy 1/1/0 | Preserved |

## Non-goals

This phase does **not** set `candidateExecutable=true`, Allowed/Executable true, introduce Started/Executed/Completed fields, create runtime hosts/handles, render/mount Workspace, or transfer GeoFeed ownership/writing/rendering. Phase 3B.3.46 was not started. Nothing was pushed.

## Official predecessor authority

| Field | Value |
|-------|-------|
| Branch | `workspace/phase3b344-controlled-workspace-host-candidate-activation` |
| Final freeze | `a05ad10b4c5be068da0c043ff114a9d597f764d3` |
| Reproof target | `69e6ab57294975beeab6355d4c9885b487c0b175` |
| Reproof documentary | `c88876b2d1b6153468909f5af5abfb166e9fb9d3` |
| Result | `controlled-workspace-host-candidate-activated-not-active` |
| Lifecycle | `CANDIDATE_ACTIVATED_NOT_ACTIVE` |
| Bridge | v45 |
| Verdict | `READY_FOR_PHASE_3B_3_45` |

## Architecture

Candidate Active (3B.3.45 action)  
← Candidate Activation (3B.3.44)  
← Candidate Activation Authorization (3B.3.43)  
← Candidate Activation Readiness (3B.3.42)  
← …

Engine: pure `evaluateControlledWorkspaceHostCandidateActive(registry, input?)`.

Structural clone of Phase 3B.3.44 action mechanics; semantic predecessor Phase 3B.3.44.

## Bridge / proof

| Field | Value |
|-------|-------|
| Bridge | v46 |
| Reader | `readControlledWorkspaceHostCandidateActive` |
| metaOk | `candidateActiveMetaOk` (computed) |
| Proof port | 3066 |
| Chromium proof | 20/20 PASS |
| Controlled Workspace regression | 20/20 PASS |
| Forced-negative Chromium proofs | 50/50 PASS |
| Final verdict | `READY_FOR_PHASE_3B_3_46` |

## Proof commands

```bash
npm run test:adaptive-workspace-host-candidate-active
npx tsx scripts/validate-adaptive-workspace-host-candidate-active-phase3b345.ts
npm run probe:adaptive-workspace-host-candidate-active
```

## Nothing pushed

Nothing was pushed.

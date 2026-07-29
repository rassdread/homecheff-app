# Phase 3B.3.44 — Controlled Workspace Host Candidate Activation

## Phase identification

Phase **3B.3.44** — Controlled Workspace Host Candidate Activation.

Predecessor: Phase **3B.3.43** (frozen tip `fc3870a68f164249f990dcbea93baa914da676c9`; proof target `a6def223792c369ecd0d7235fb698d9378f9ef3a`).

Next eligible: **3B.3.45** (sequential only; title not yet confirmed; **not implemented**).

## Objective

Advance exactly one architectural fact: after Phase 3B.3.43 candidate-activation authorization, the candidate is now **activated** as sealed metadata only. This phase does **not** set `candidateActive`, unlock Allowed/Executable, render or mount Workspace, create runtime capability, or transfer GeoFeed authority.

Successful result: `controlled-workspace-host-candidate-activated-not-active`

Successful lifecycle state: `CANDIDATE_ACTIVATED_NOT_ACTIVE`

Primary blocker: `PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY`

Primary transition: `candidateActivated: false → true` (transitionCount=1)

## Authority verification

Authority was verified before branch creation:

- `git branch --show-current` → `workspace/phase3b343-controlled-workspace-host-candidate-activation-authorization`
- `git rev-parse HEAD` → `fc3870a68f164249f990dcbea93baa914da676c9`

Target branch created from that exact freeze HEAD:

`workspace/phase3b344-controlled-workspace-host-candidate-activation`

## Activated is not Active

| Field | Decision | Evidence |
|-------|----------|----------|
| `candidateActivated` | **advanced** `false` → `true` | Sole primary action fact for this phase |
| `candidateActivationReady` | **present and remains true** | Frozen from 3B.3.42 |
| `candidateActivationAuthorized` | **present and remains true** | Frozen from 3B.3.43 |
| `candidateActive` | **present and remains false** | Must not be derived from Activated |
| `candidateExecutable` | **present and remains false** | No execution authority |
| `candidateActivationStarted` | **absent** | Not introduced |
| `candidateActivationExecuted` | **absent** | Not introduced |
| `candidateActivationCompleted` | **absent** | Not introduced |
| `issuancePipelineExecuted` | **present and remains true** | Frozen predecessor fact |
| `issuancePipelineExecutionAllowed` | **false** | Preserved |
| `issuancePipelineExecutable` | **false** | Preserved |
| `issuancePipelineState` | `NON_EXECUTABLE` | Preserved |
| `issuanceTransactionState` | `OPENED` | Preserved (committed=true, aborted=false) |

## Non-goals

This phase does **not** set `candidateActive=true`, `candidateExecutable=true`, Allowed/Executable true, introduce Started/Executed/Completed fields, create runtime hosts/handles, render/mount Workspace, or transfer GeoFeed ownership/writing/rendering. Phase 3B.3.45 was not started. Nothing was pushed.

## Official predecessor authority

| Field | Value |
|-------|-------|
| Branch | `workspace/phase3b343-controlled-workspace-host-candidate-activation-authorization` |
| Frozen HEAD | `fc3870a68f164249f990dcbea93baa914da676c9` |
| Documentary tip | `2cb8f42f493f3ba33d143e69dc1689cd8c3f06e1` |
| Proof target | `a6def223792c369ecd0d7235fb698d9378f9ef3a` |
| Result | `controlled-workspace-host-candidate-activation-authorized-not-activated` |
| Lifecycle | `CANDIDATE_ACTIVATION_AUTHORIZED_NOT_ACTIVATED` |
| Primary blocker | `PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY` |
| Bridge | v44 |
| Proof port | 3064 |
| Verdict | `READY_FOR_PHASE_3B_3_44` |

## Architecture

Candidate Activation (3B.3.44 action)  
← Candidate Activation Authorization (3B.3.43)  
← Candidate Activation Readiness (3B.3.42)  
← Issuance Pipeline Execution (3B.3.41)  
← …

Engine: pure `evaluateControlledWorkspaceHostCandidateActivation(registry, input?)`.

Structural clone of Phase 3B.3.41 action mechanics with subject translated to candidate activation; predecessor bound to Phase 3B.3.43 authorization output.

## Candidate activation model

| Field | Predecessor (3B.3.43) | This phase (3B.3.44) |
|-------|------------------------|----------------------|
| Lifecycle | `CANDIDATE_ACTIVATION_AUTHORIZED_NOT_ACTIVATED` | `CANDIDATE_ACTIVATED_NOT_ACTIVE` |
| Result | `…-authorized-not-activated` | `…-activated-not-active` |
| `candidateActivationReady` | `true` | `true` (preserved) |
| `candidateActivationAuthorized` | `true` | `true` (preserved) |
| `candidateActivated` | `false` | **true** |
| `candidateActive` | `false` | `false` (preserved) |
| `candidateExecutable` | `false` | `false` (preserved) |
| Allowed / Executable | `false` | `false` (preserved) |
| Pipeline | `NON_EXECUTABLE` | `NON_EXECUTABLE` (preserved) |
| Transaction | `OPENED` | `OPENED` (preserved) |

## Capability absence / runtime continuity

No runtime capability, host instance, activation/execution handle, token, credential, certificate, or permit. Candidate selected/ready/authorized/granted/activation-ready/activation-authorized/**activated**; not active/executable. Owner/writer/renderer=legacy; mount=1; unmount=0; GeoFeed render=1; Workspace null (rendered/mounted/visible/React instance absent).

## Condition / guard / blocker inventories

- Conditions: 130/130 satisfied
- Guards: 48/48 satisfied
- Primary blocker: `PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY`

## Identity constants

- Identity: `feed.discovery.adaptive-workspace.host-candidate-activation.v1`
- Contract identity: `feed.discovery.adaptive-workspace.host-candidate-activation.contract.v1`

## Bridge / proof

| Field | Value |
|-------|-------|
| Bridge | v45 |
| Reader | `readControlledWorkspaceHostCandidateActivation` |
| metaOk | `candidateActivatedMetaOk` (computed) |
| Proof port | 3065 |
| Chromium proof | 20/20 PASS |
| Controlled Workspace regression | 20/20 PASS |
| Final verdict | `READY_FOR_PHASE_3B_3_45` |

## Proof commands

```bash
npm run test:adaptive-workspace-host-candidate-activation
npx tsx scripts/validate-adaptive-workspace-host-candidate-activation-phase3b344.ts
node scripts/run-controlled-workspace-host-candidate-activation-proof-phase3b344.mjs
```

## Proof results

| Stage | Result |
|-------|--------|
| Dedicated tests | PASS (12 assertion groups) |
| Validator | PASS |
| Forced-negative cases (validator) | ≥30 labels |
| Production sealed build | PASS |
| Bridge v45 Chromium | 20/20 PASS (`candidateActivatedMetaOk=true`) |
| Controlled Workspace Phase 3B.2 regression | 20/20 PASS |
| Final verdict | `READY_FOR_PHASE_3B_3_45` |

## Commits (implementation / proof / documentary)

| Role | Hash |
|------|------|
| Implementation / proof target | `b4f092d522e558938f38a8c36eaf0d05033d8883` |
| Documentary | recorded in Git after this audit lands |
| Freeze | subsequent non-self-referential freeze tip (not embedded here) |

## File manifest (Phase 3B.3.44)

### Created

- `lib/adaptive-workspace/sealed/controlled-workspace-host-candidate-activation.ts`
- `lib/adaptive-workspace/sealed/controlled-workspace-host-candidate-activation-contract.ts`
- `lib/adaptive-workspace/sealed/feed-workspace-host-candidate-activation-identity.ts`
- `lib/adaptive-workspace/sealed/feed-workspace-host-candidate-activation-prepared.ts`
- `lib/adaptive-workspace/tests/run-controlled-workspace-host-candidate-activation-tests.ts`
- `scripts/validate-adaptive-workspace-host-candidate-activation-phase3b344.ts`
- `scripts/probe-controlled-workspace-host-candidate-activation-phase3b344.mjs`
- `scripts/run-controlled-workspace-host-candidate-activation-proof-phase3b344.mjs`
- `docs/audits/artifacts/phase3b344/*`
- `docs/audits/homecheff-adaptive-workspace-phase3b344-controlled-workspace-host-candidate-activation.md`

### Modified (shared integration)

- LIVE gate, controlled-host plan/types/contract/validation, settings manifest, Adaptive Workspace exports, Bridge v45, package scripts, continuity tests

## Nothing pushed

Nothing was pushed.

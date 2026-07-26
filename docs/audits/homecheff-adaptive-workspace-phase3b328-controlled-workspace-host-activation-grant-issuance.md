# Phase 3B.3.28 — Controlled Workspace Host Activation Grant Issuance

## Phase identification

Phase **3B.3.28** — Controlled Workspace Host Activation Grant Issuance.

Predecessor: Phase **3B.3.27** (HEAD `0eb38d757f5dada48727eea72e63a378f6c1647b`; documentary tip `74e034358984865c8159ec5e95b8d35070b8e391`; proof target `323af2e8043b053e058f96ab3a7d6224e11fd29b`).

Next eligible: **3B.3.29** — Controlled Workspace Host Activation Commit Boundary Entry (described only; not implemented).

## Objective

Establish one architectural fact: exactly one sealed, immutable, non-executable activation grant is issued for the authorized Adaptive Workspace host candidate, without activating, entering the commit boundary, opening the transaction, or executing the pipeline.

Successful result: `controlled-workspace-host-activation-grant-issued-not-activated`

Successful lifecycle state: `GRANTED_NOT_ACTIVATED`

## Non-goals

This phase does **not** activate Workspace, enter the commit boundary, open the issuance transaction, execute the issuance pipeline, create runtime hosts/handles, issue tokens/credentials/certificates/permits, render or mount Workspace, change ownership/writer/renderer, relocate or duplicate GeoFeed, or change production runtime behavior.

## Frozen predecessor

Phase 3B.3.27 frozen:

- Result: `controlled-workspace-host-activation-authorized-not-granted`
- State: `AUTHORIZED_NOT_GRANTED`
- Candidate / registration / selection / readiness / authorization identities unchanged
- Authorized = 1; granted/activated/executable = 0
- Bridge v28; port 3048; commit boundary `NOT_ENTERED`

## Architecture

Controlled Workspace Host Activation Grant Issuance  
→ Activation Authorization  
→ Activation Readiness  
→ Candidate Selection  
→ Candidate Registration  
→ Commit Boundary  
→ Issuance Transaction  
→ Issuance Pipeline  
→ Previous controlled-host metadata

Engine: pure `evaluateControlledWorkspaceHostActivationGrantIssuance(registry, input?)`.

Consumes only frozen metadata. No runtime inspection, DOM, React traversal, dynamic discovery, or service lookup.

## Identity chain

| Identity | Value |
|----------|-------|
| Candidate | `feed.discovery.adaptive-workspace.host-candidate.v1` |
| Registration | `feed.discovery.adaptive-workspace.host-candidate-registration.v1` |
| Selection | `feed.discovery.adaptive-workspace.host-candidate-selection.v1` |
| Activation readiness | `feed.discovery.adaptive-workspace.host-activation-readiness.v1` |
| Activation authorization | `feed.discovery.adaptive-workspace.host-activation-authorization.v1` |
| Activation grant | `feed.discovery.adaptive-workspace.host-activation-grant.v1` |
| Activation grant contract | `feed.discovery.adaptive-workspace.host-activation-grant.contract.v1` |
| Grant issuance | `feed.discovery.adaptive-workspace.host-activation-grant-issuance.v1` |
| Grant issuance contract | `feed.discovery.adaptive-workspace.host-activation-grant-issuance.contract.v1` |
| Controlled host | `feed.discovery.controlled-host` |
| Legacy runtime | `feed.discovery.legacy-single-mount.v1` |

## Grant issuance model

Exactly one grant / grant-issuance record references the frozen authorized candidate.

Successful flags:

- `selected=true`, `ready=true`, `authorized=true`, `granted=true`
- `grantPresent=true`, `grantIssued=true`, `grantValid=true`, `grantImmutable=true`, `grantUnique=true`
- `grantExecutable=false`, `activationGrantIssuanceAllowed=false`
- `futureGrantPossible=true`, `futureGrantIssued=true`
- `futureActivationPossible=true`, `futureActivationAuthorized=true`, `futureActivationStarted=false`
- `activated=false`, `active=false`, and all capability / handle / token / credential / certificate / permit / command / callback fields `false`
- commit boundary `NOT_ENTERED`; transaction `NOT_OPENED`; pipeline `NON_EXECUTABLE`

## Capability absence / runtime continuity

No runtime capability, host instance, activation/execution handle, token, credential, certificate, permit, command, callback, dispatcher, scheduler, queue, executor, provider, service, or coordinator.

Owner = legacy; writer = legacy; renderer = legacy; mount = 1; unmount = 0; GeoFeed render count = 1; Workspace shell null.

## Commit-boundary / transaction / pipeline continuity

- Phase 3B.3.23 commit boundary: `NOT_ENTERED`
- Phase 3B.3.22 issuance transaction: `NOT_OPENED`
- Phase 3B.3.21 issuance pipeline: `NON_EXECUTABLE`

## Condition / guard / blocker inventories

- Conditions: 106/106 satisfied
- Guards: 36/36 satisfied
- Blockers: 53 including primary `PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY`

## Forced negatives

Deterministic fail-closed proofs for missing/duplicated candidates, grantExecutable, runtime capability/host/handle, Workspace render, GeoFeed duplication, owner/writer/renderer change, commit boundary entered, transaction opened, pipeline executable, activated candidate. Artifact: `forced-negative-results.json` (`allPass=true`). Chromium: `forcedNegativeProofsOk=true`.

## Unit tests

`test:adaptive-workspace-host-activation-grant-issuance` — **9/9 PASS**

Predecessor regressions:

- Phase 3B.3.27 authorization — 9/9 PASS
- Phase 3B.3.26 readiness — 9/9 PASS
- Phase 3B.3.25 selection — 9/9 PASS
- Phase 3B.3.24 registration — 9/9 PASS
- Phase 3B.3.23 commit-boundary suite — 9/9 PASS

## Validator

`validate:adaptive-workspace-host-activation-grant-issuance` — **PASS** (with artifacts present).

## Production build

`NEXT_PUBLIC_FEED_SEALED_BASELINE=1 npm run build` → **PASS**

## Chromium proof

Port **3049** · bridge **v29** · proof target commit `7b2bb2fbfc6c4edc52ac7552e31513ce34710fc3`

- 20/20 release invariants PASS
- `activationGrantIssuanceMetaOk=true`
- `forcedNegativeProofsOk=true`
- overallVerdict=`READY_FOR_PHASE_3B_3_29`

## Regression proof

Phase 3B.2 Chromium rerun: **20/20 PASS** · `READY_FOR_PHASE_3B_3`

## Git isolation

Branch: `workspace/phase3b328-controlled-workspace-host-activation-grant-issuance`

Scoped staging only (no `git add .` / `git add -A`). Unrelated dirty/untracked files left untouched.

Implementation commits:

1. `e486b7d9b9640cae5eee88f5f56487c057e3a822` — contracts, identity, prepared, evaluator, LIVE gate
2. `49fbc1f510a5f9bda1d895bc1a40c02301a30656` — validator, bridge v29, Chromium probe
3. `7b2bb2fbfc6c4edc52ac7552e31513ce34710fc3` — probe prior-path fix (proof target)

Proof target: `7b2bb2fbfc6c4edc52ac7552e31513ce34710fc3`

Audit/artifacts commit: `0d6204c30d671532a2f8c1fa241982613d23e566`

Documentary tip: `d105e9f727b60074108c8c90422d4963016f58a9`

Freeze HEAD: `FREEZE_HEAD_PLACEHOLDER`

## Rollback

Restore Phase 3B.3.27 HEAD `0eb38d757f5dada48727eea72e63a378f6c1647b`:

- `currentPhase=3B.3.27`
- `nextEligibleStep=3B.3.28`
- bridge=v28
- result=`controlled-workspace-host-activation-authorized-not-granted`
- state=`AUTHORIZED_NOT_GRANTED`
- `candidateGranted=false`, grant absent

No runtime / DB / storage / cache / DOM cleanup required. See `docs/audits/artifacts/phase3b328/rollback-plan.txt`.

## Freeze declaration

Phase 3B.3.28 freezes the fact that the authorized Workspace candidate holds exactly one sealed, immutable, non-executable activation grant. Nothing established by prior Phase 3B.3 layers is weakened. Phase 3B.3.29 is not implemented.

## Final verdict

**READY_FOR_PHASE_3B_3_29**

## Next eligible phase

Phase **3B.3.29** — Controlled Workspace Host Activation Commit Boundary Entry (not started).

## Push status

Nothing pushed.

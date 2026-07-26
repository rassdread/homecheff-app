/**
 * Phase 3B.3.29 — controlled workspace host activation commit-boundary entry unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostActivationCommitBoundaryEntryDescriptor,
  evaluateControlledWorkspaceHostActivationCommitBoundaryEntry,
  validateControlledWorkspaceHostActivationCommitBoundaryEntryDescriptor,
  createControlledWorkspaceHostActivationCommitBoundaryEntryContract,
  validateControlledWorkspaceHostActivationCommitBoundaryEntryContract,
  createFeedWorkspaceHostActivationCommitBoundaryEntryIdentity,
  validateFeedWorkspaceHostActivationCommitBoundaryEntryIdentity,
  createFeedWorkspaceHostActivationCommitBoundaryEntryPreparedContract,
  validateFeedWorkspaceHostActivationCommitBoundaryEntryPreparedContract,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_BLOCKERS,
  PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b329] activation commit-boundary entry descriptor + engine");

{
  const a = createControlledWorkspaceHostActivationCommitBoundaryEntryDescriptor();
  const b = createControlledWorkspaceHostActivationCommitBoundaryEntryDescriptor();
  assert.equal(a.currentPhase, "3B.3.29");
  assert.equal(a.previousPhase, "3B.3.28");
  assert.equal(a.nextEligibleStep, "3B.3.30");
  assert.equal(
    a.commitBoundaryEntryResult,
    "controlled-workspace-host-activation-commit-boundary-entered",
  );
  assert.equal(a.commitBoundaryEntryState, "COMMIT_BOUNDARY_ENTERED");
  assert.equal(a.candidateId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID);
  assert.equal(a.registrationId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID);
  assert.equal(a.selectionId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID);
  assert.equal(a.activationReadinessId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID);
  assert.equal(a.activationAuthorizationId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID);
  assert.equal(a.activationGrantId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID);
  assert.equal(a.activationGrantIssuanceId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID);
  assert.equal(
    a.activationGrantIssuanceContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
  );
  assert.equal(a.activationCommitBoundaryId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID);
  assert.equal(
    a.activationCommitBoundaryEntryId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
  );
  assert.equal(
    a.activationCommitBoundaryEntryContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONTRACT_ID,
  );
  assert.equal(a.candidateCount, 1);
  assert.equal(a.readyCandidateCount, 1);
  assert.equal(a.authorizedCandidateCount, 1);
  assert.equal(a.grantedCandidateCount, 1);
  assert.equal(a.grantCount, 1);
  assert.equal(a.commitBoundaryEntryCount, 1);
  assert.equal(a.duplicateCommitBoundaryEntryCount, 0);
  assert.equal(a.futureActivationTargetCount, 1);
  assert.equal(a.candidateSelected, true);
  assert.equal(a.candidateReady, true);
  assert.equal(a.candidateAuthorized, true);
  assert.equal(a.candidateGranted, true);
  assert.equal(a.candidateActivated, false);
  assert.equal(a.grantExecutable, false);
  assert.equal(a.activationCommitBoundaryEntered, true);
  assert.equal(a.activationCommitBoundaryState, "ENTERED");
  assert.equal(a.activationCommitBoundaryArmed, false);
  assert.equal(a.activationCommitBoundaryCrossed, false);
  assert.equal(a.activationCommitBoundaryCommitted, false);
  assert.equal(a.activationCommitBoundaryAborted, false);
  assert.equal(a.activationCommitBoundaryExecutable, false);
  assert.equal(a.activationCommitBoundaryBlocked, true);
  assert.equal(a.activationCommitBoundaryEntryAllowed, false);
  assert.equal(a.activationExecutionAllowed, false);
  assert.equal(a.transitionFrom, "NOT_ENTERED");
  assert.equal(a.transitionTo, "ENTERED");
  assert.equal(a.transitionLegal, true);
  assert.equal(a.futureGrantPossible, true);
  assert.equal(a.futureGrantIssued, true);
  assert.equal(a.futureActivationAuthorized, true);
  assert.equal(a.futureActivationStarted, false);
  assert.equal(a.predecessorActivationGrantIssuanceState, "GRANTED_NOT_ACTIVATED");
  assert.equal(a.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(a.issuanceTransactionState, "NOT_OPENED");
  assert.equal(a.issuancePipelineExecutable, false);
  assert.equal(a.owner, "legacy");
  assert.equal(a.mountCount, 1);
  assert.equal(a.geoFeedRenderCount, 1);
  assert.equal(a.shellRendered, false);
  assert.equal(a.grantPresent, true);
  assert.equal(a.grantValid, true);
  assert.equal(a.grantImmutable, true);
  assert.equal(a.grantUnique, true);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic commit-boundary entry descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationCommitBoundaryEntry();
  const d = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.29");
  assert.equal(d.candidateGranted, true);
  assert.equal(d.candidateActivated, false);
  assert.equal(d.grantedCandidateCount, 1);
  assert.equal(d.grantCount, 1);
  assert.equal(d.commitBoundaryEntryCount, 1);
  assert.equal(d.runtimeCapabilityPresent, false);
  assert.equal(d.activationHandlePresent, false);
  assert.equal(d.grantPresent, true);
  assert.equal(d.grantExecutable, false);
  assert.equal(d.activationCommitBoundaryEntered, true);
  assert.equal(d.activationCommitBoundaryState, "ENTERED");
  assert.equal(d.activationCommitBoundaryExecutable, false);
  assert.equal(d.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(
    d.conditionCount,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONDITIONS.length,
  );
  assert.equal(d.satisfiedConditionCount, d.conditionCount);
  assert.equal(d.unsatisfiedConditionCount, 0);
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  );
  assert.equal(typeof (evaluation as { then?: unknown }).then, "undefined");
  ok("engine diagnostics metadata only (chained from 3B.3.28)");
}

{
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationCommitBoundaryEntryDescriptor({
        ...createControlledWorkspaceHostActivationCommitBoundaryEntryDescriptor(),
        candidateGranted: false,
      } as ReturnType<typeof createControlledWorkspaceHostActivationCommitBoundaryEntryDescriptor>),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { candidates: [{}, {}] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { entry: { activated: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { entry: { runtimeCapabilityPresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { shellRendered: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { owner: "workspace" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { issuanceCommitBoundaryEntered: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { issuanceTransactionOpened: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { issuancePipelineExecutable: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { geoFeedRenderCount: 2 },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { entryRecords: [{}, {}] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { transitionFrom: "ENTERED" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        createControlledHostRegistry(),
        { activationCommitBoundaryArmed: true },
      ),
    HardContractViolation,
  );
  ok(
    "fail-closed duplicate/activated/capability/shell/ownership/boundary/second-entry/illegal-transition paths",
  );
}

console.log("\n[phase3b329] contract + identity + gate + host + prepared");

{
  const c = createControlledWorkspaceHostActivationCommitBoundaryEntryContract();
  assert.equal(c.candidateGranted, true);
  assert.equal(c.candidateActivated, false);
  assert.equal(c.grantPresent, true);
  assert.equal(c.grantExecutable, false);
  assert.equal(c.activationCommitBoundaryEntered, true);
  assert.equal(c.activationCommitBoundaryArmed, false);
  assert.equal(c.nextEligibleStep, "3B.3.30");
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationCommitBoundaryEntryContract({
        ...c,
        commitBoundaryEntryAllowed: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationCommitBoundaryEntryContract({
        ...c,
        activationCommitBoundaryArmed: true,
      }),
    HardContractViolation,
  );
  ok("commit-boundary entry contract fail-closed");
}

{
  const id = createFeedWorkspaceHostActivationCommitBoundaryEntryIdentity();
  assert.equal(
    id.activationCommitBoundaryEntryId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
  );
  assert.equal(id.expectedOwner, "legacy");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationCommitBoundaryEntryIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("commit-boundary entry identity forbids remount and further boundary progression");
}

{
  const gate = evaluateFeedHostActivationGate({
    forceHostActivation: true,
    phase3b2ProofValid: true,
    phase3b2FreezeValid: true,
    phase3b32ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  } as Parameters<typeof evaluateFeedHostActivationGate>[0]);
  assert.equal(gate.allowed, false);
  assert.ok(
    gate.blockers.includes(
      PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.36");
  assert.equal(gate.eligibleStep, "3B.3.37");
  ok("activation remains impossible (gate currentStep=3B.3.36, eligibleStep=3B.3.37)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.37");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.37");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  const prepared = createFeedWorkspaceHostActivationCommitBoundaryEntryPreparedContract({
    evidenceCommit: "test",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b329/proof.json",
    conditionCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_GUARDS.length,
  });
  assert.equal(prepared.candidateGranted, true);
  assert.equal(prepared.candidateActivated, false);
  assert.equal(prepared.activationCommitBoundaryEntered, true);
  assert.equal(prepared.nextEligibleStep, "3B.3.30");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationCommitBoundaryEntryPreparedContract({
        ...prepared,
        browserProof: "fail",
      }),
    HardContractViolation,
  );
  ok("prepared commit-boundary entry fail-closed");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_BLOCKERS.includes(
      PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationCommitBoundaryEntry();
  assert.equal(evaluation.descriptor.candidateGranted, true);
  assert.equal(evaluation.descriptor.candidateActivated, false);
  assert.equal(evaluation.descriptor.commitBoundaryEntryRecords[0].granted, true);
  assert.equal(evaluation.descriptor.commitBoundaryEntryRecords[0].grantExecutable, false);
  assert.equal(evaluation.descriptor.commitBoundaryEntryRecords[0].commitBoundaryEntered, true);
  assert.equal(evaluation.descriptor.commitBoundaryEntryRecords[0].commitBoundaryArmed, false);
  ok("candidate entered-not-armed with PHASE_3B3_29 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.29 controlled workspace host activation commit boundary entry: ${passed} assertions ok\n`,
);

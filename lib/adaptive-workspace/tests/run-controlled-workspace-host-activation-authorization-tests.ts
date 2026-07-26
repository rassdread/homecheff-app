/**
 * Phase 3B.3.27 — controlled workspace host activation authorization unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostActivationAuthorizationDescriptor,
  evaluateControlledWorkspaceHostActivationAuthorization,
  validateControlledWorkspaceHostActivationAuthorizationDescriptor,
  createControlledWorkspaceHostActivationAuthorizationContract,
  validateControlledWorkspaceHostActivationAuthorizationContract,
  createFeedWorkspaceHostActivationAuthorizationIdentity,
  validateFeedWorkspaceHostActivationAuthorizationIdentity,
  createFeedWorkspaceHostActivationAuthorizationPreparedContract,
  validateFeedWorkspaceHostActivationAuthorizationPreparedContract,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS,
  PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
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

console.log("\n[phase3b327] activation authorization descriptor + engine");

{
  const a = createControlledWorkspaceHostActivationAuthorizationDescriptor();
  const b = createControlledWorkspaceHostActivationAuthorizationDescriptor();
  assert.equal(a.currentPhase, "3B.3.27");
  assert.equal(a.previousPhase, "3B.3.26");
  assert.equal(a.nextEligibleStep, "3B.3.28");
  assert.equal(
    a.activationAuthorizationResult,
    "controlled-workspace-host-activation-authorized-not-granted",
  );
  assert.equal(a.activationAuthorizationState, "AUTHORIZED_NOT_GRANTED");
  assert.equal(a.candidateId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID);
  assert.equal(a.registrationId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID);
  assert.equal(a.selectionId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID);
  assert.equal(a.activationReadinessId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID);
  assert.equal(a.activationAuthorizationId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID);
  assert.equal(
    a.activationAuthorizationContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
  );
  assert.equal(a.candidateCount, 1);
  assert.equal(a.readyCandidateCount, 1);
  assert.equal(a.authorizedCandidateCount, 1);
  assert.equal(a.futureGrantTargetCount, 1);
  assert.equal(a.candidateSelected, true);
  assert.equal(a.candidateReady, true);
  assert.equal(a.candidateAuthorized, true);
  assert.equal(a.candidateGranted, false);
  assert.equal(a.candidateActivated, false);
  assert.equal(a.activationAuthorizationExecutable, false);
  assert.equal(a.activationGrantIssuanceAllowed, false);
  assert.equal(a.futureGrantPossible, true);
  assert.equal(a.futureGrantIssued, false);
  assert.equal(a.futureActivationAuthorized, true);
  assert.equal(a.predecessorActivationReadinessState, "READY_NOT_AUTHORIZED");
  assert.equal(a.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(a.issuanceTransactionState, "NOT_OPENED");
  assert.equal(a.issuancePipelineExecutable, false);
  assert.equal(a.owner, "legacy");
  assert.equal(a.mountCount, 1);
  assert.equal(a.shellRendered, false);
  assert.equal(a.grantPresent, false);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic authorization descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationAuthorization();
  const d = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.27");
  assert.equal(d.candidateAuthorized, true);
  assert.equal(d.candidateGranted, false);
  assert.equal(d.authorizedCandidateCount, 1);
  assert.equal(d.futureGrantTargetCount, 1);
  assert.equal(d.runtimeCapabilityPresent, false);
  assert.equal(d.activationHandlePresent, false);
  assert.equal(d.grantPresent, false);
  assert.equal(d.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(
    d.conditionCount,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
  );
  assert.equal(d.satisfiedConditionCount, d.conditionCount);
  assert.equal(d.unsatisfiedConditionCount, 0);
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  );
  assert.equal(typeof (evaluation as { then?: unknown }).then, "undefined");
  ok("engine diagnostics metadata only (chained from 3B.3.26)");
}

{
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationAuthorizationDescriptor({
        ...createControlledWorkspaceHostActivationAuthorizationDescriptor(),
        candidateGranted: true,
      } as ReturnType<typeof createControlledWorkspaceHostActivationAuthorizationDescriptor>),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationAuthorization(
        createControlledHostRegistry(),
        { authorization: { granted: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationAuthorization(
        createControlledHostRegistry(),
        { candidates: [{}, {}] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationAuthorization(
        createControlledHostRegistry(),
        { authorization: { runtimeCapabilityPresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationAuthorization(
        createControlledHostRegistry(),
        { authorization: { activationHandlePresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationAuthorization(
        createControlledHostRegistry(),
        { shellRendered: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationAuthorization(
        createControlledHostRegistry(),
        { owner: "workspace" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationAuthorization(
        createControlledHostRegistry(),
        { geoFeedRenderCount: 2 },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationAuthorization(
        createControlledHostRegistry(),
        { issuanceCommitBoundaryEntered: true },
      ),
    HardContractViolation,
  );
  ok("fail-closed grant/capability/shell/ownership paths");
}

console.log("\n[phase3b327] contract + identity + gate + host + prepared");

{
  const c = createControlledWorkspaceHostActivationAuthorizationContract();
  assert.equal(c.candidateAuthorized, true);
  assert.equal(c.candidateGranted, false);
  assert.equal(c.nextEligibleStep, "3B.3.28");
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationAuthorizationContract({
        ...c,
        grantIssuanceAllowed: true,
      }),
    HardContractViolation,
  );
  ok("authorization contract fail-closed");
}

{
  const id = createFeedWorkspaceHostActivationAuthorizationIdentity();
  assert.equal(id.activationAuthorizationId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID);
  assert.equal(id.expectedOwner, "legacy");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationAuthorizationIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("authorization identity forbids remount and grant issuance");
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
  const prepared = createFeedWorkspaceHostActivationAuthorizationPreparedContract({
    evidenceCommit: "test",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b327/proof.json",
    conditionCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
  });
  assert.equal(prepared.candidateAuthorized, true);
  assert.equal(prepared.candidateGranted, false);
  assert.equal(prepared.nextEligibleStep, "3B.3.28");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationAuthorizationPreparedContract({
        ...prepared,
        browserProof: "fail",
      }),
    HardContractViolation,
  );
  ok("prepared authorization fail-closed");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS.includes(
      PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationAuthorization();
  assert.equal(evaluation.descriptor.candidateAuthorized, true);
  assert.equal(evaluation.descriptor.candidateGranted, false);
  assert.equal(evaluation.descriptor.authorizationRecords[0].authorized, true);
  assert.equal(evaluation.descriptor.authorizationRecords[0].granted, false);
  ok("candidate authorized-not-granted with PHASE_3B3_27 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.27 controlled workspace host activation authorization: ${passed} assertions ok\n`,
);

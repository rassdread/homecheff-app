import { PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY } from "../sealed/controlled-workspace-host-candidate-active";
import { PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY,
  PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY } from "../sealed/controlled-workspace-host-candidate-activation";
/**
 * Phase 3B.3.28 — controlled workspace host activation grant issuance unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostActivationGrantIssuanceDescriptor,
  evaluateControlledWorkspaceHostActivationGrantIssuance,
  validateControlledWorkspaceHostActivationGrantIssuanceDescriptor,
  createControlledWorkspaceHostActivationGrantIssuanceContract,
  validateControlledWorkspaceHostActivationGrantIssuanceContract,
  createFeedWorkspaceHostActivationGrantIssuanceIdentity,
  validateFeedWorkspaceHostActivationGrantIssuanceIdentity,
  createFeedWorkspaceHostActivationGrantIssuancePreparedContract,
  validateFeedWorkspaceHostActivationGrantIssuancePreparedContract,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS,
  PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";

import {
  PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY,
} from "../sealed/controlled-workspace-host-candidate-activation-readiness";
import {
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
} from "../sealed/controlled-workspace-host-candidate-activation-authorization";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b328] activation grant issuance descriptor + engine");

{
  const a = createControlledWorkspaceHostActivationGrantIssuanceDescriptor();
  const b = createControlledWorkspaceHostActivationGrantIssuanceDescriptor();
  assert.equal(a.currentPhase, "3B.3.28");
  assert.equal(a.previousPhase, "3B.3.27");
  assert.equal(a.nextEligibleStep, "3B.3.29");
  assert.equal(
    a.grantIssuanceResult,
    "controlled-workspace-host-activation-grant-issued-not-activated",
  );
  assert.equal(a.grantIssuanceState, "GRANTED_NOT_ACTIVATED");
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
  assert.equal(a.candidateCount, 1);
  assert.equal(a.readyCandidateCount, 1);
  assert.equal(a.authorizedCandidateCount, 1);
  assert.equal(a.grantedCandidateCount, 1);
  assert.equal(a.grantCount, 1);
  assert.equal(a.duplicateGrantCount, 0);
  assert.equal(a.futureActivationTargetCount, 1);
  assert.equal(a.candidateSelected, true);
  assert.equal(a.candidateReady, true);
  assert.equal(a.candidateAuthorized, true);
  assert.equal(a.candidateGranted, true);
  assert.equal(a.candidateActivated, false);
  assert.equal(a.grantIssuanceExecutable, false);
  assert.equal(a.grantExecutable, false);
  assert.equal(a.activationGrantIssuanceAllowed, false);
  assert.equal(a.futureGrantPossible, true);
  assert.equal(a.futureGrantIssued, true);
  assert.equal(a.futureActivationAuthorized, true);
  assert.equal(a.futureActivationStarted, false);
  assert.equal(a.predecessorActivationAuthorizationState, "AUTHORIZED_NOT_GRANTED");
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
  ok("successful deterministic grant issuance descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationGrantIssuance();
  const d = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.28");
  assert.equal(d.candidateGranted, true);
  assert.equal(d.candidateActivated, false);
  assert.equal(d.grantedCandidateCount, 1);
  assert.equal(d.grantCount, 1);
  assert.equal(d.runtimeCapabilityPresent, false);
  assert.equal(d.activationHandlePresent, false);
  assert.equal(d.grantPresent, true);
  assert.equal(d.grantExecutable, false);
  assert.equal(d.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(
    d.conditionCount,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS.length,
  );
  assert.equal(d.satisfiedConditionCount, d.conditionCount);
  assert.equal(d.unsatisfiedConditionCount, 0);
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
  );
  assert.equal(typeof (evaluation as { then?: unknown }).then, "undefined");
  ok("engine diagnostics metadata only (chained from 3B.3.27)");
}

{
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationGrantIssuanceDescriptor({
        ...createControlledWorkspaceHostActivationGrantIssuanceDescriptor(),
        candidateGranted: false,
      } as ReturnType<typeof createControlledWorkspaceHostActivationGrantIssuanceDescriptor>),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { grant: { granted: false } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { candidates: [{}, {}] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { grantRecords: [{}, {}] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { grant: { grantExecutable: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { grant: { activated: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { grant: { runtimeCapabilityPresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { shellRendered: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { owner: "workspace" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { geoFeedRenderCount: 2 },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { issuanceCommitBoundaryEntered: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { issuanceTransactionOpened: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationGrantIssuance(
        createControlledHostRegistry(),
        { issuancePipelineExecutable: true },
      ),
    HardContractViolation,
  );
  ok("fail-closed grant-executable/duplicate/capability/shell/ownership/boundary paths");
}

console.log("\n[phase3b328] contract + identity + gate + host + prepared");

{
  const c = createControlledWorkspaceHostActivationGrantIssuanceContract();
  assert.equal(c.candidateGranted, true);
  assert.equal(c.candidateActivated, false);
  assert.equal(c.grantPresent, true);
  assert.equal(c.grantExecutable, false);
  assert.equal(c.nextEligibleStep, "3B.3.29");
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationGrantIssuanceContract({
        ...c,
        grantIssuanceAllowed: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationGrantIssuanceContract({
        ...c,
        grantExecutable: true,
      }),
    HardContractViolation,
  );
  ok("grant issuance contract fail-closed");
}

{
  const id = createFeedWorkspaceHostActivationGrantIssuanceIdentity();
  assert.equal(id.activationGrantIssuanceId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID);
  assert.equal(id.expectedOwner, "legacy");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationGrantIssuanceIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("grant issuance identity forbids remount and further grant issuance");
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
      PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.45");
  assert.equal(gate.eligibleStep, "3B.3.46");
  ok("activation remains impossible (gate currentStep=3B.3.43, eligibleStep=3B.3.44)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.46");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.46");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  const prepared = createFeedWorkspaceHostActivationGrantIssuancePreparedContract({
    evidenceCommit: "test",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b328/proof.json",
    conditionCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS.length,
  });
  assert.equal(prepared.candidateGranted, true);
  assert.equal(prepared.candidateActivated, false);
  assert.equal(prepared.nextEligibleStep, "3B.3.29");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationGrantIssuancePreparedContract({
        ...prepared,
        browserProof: "fail",
      }),
    HardContractViolation,
  );
  ok("prepared grant issuance fail-closed");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS.includes(
      PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationGrantIssuance();
  assert.equal(evaluation.descriptor.candidateGranted, true);
  assert.equal(evaluation.descriptor.candidateActivated, false);
  assert.equal(evaluation.descriptor.grantRecords[0].granted, true);
  assert.equal(evaluation.descriptor.grantRecords[0].grantExecutable, false);
  ok("candidate granted-not-activated with PHASE_3B3_28 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.28 controlled workspace host activation grant issuance: ${passed} assertions ok\n`,
);

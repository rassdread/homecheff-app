/**
 * Phase 3B.3.21 — host activation transition authorization grant issuance
 * decision unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuancePipeline,
  validateControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor,
  createControlledHostActivationTransitionAuthorizationGrantIssuancePipelineContract,
  validateControlledHostActivationTransitionAuthorizationGrantIssuancePipelineContract,
  createFeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity,
  validateFeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity,
  createFeedHostActivationTransitionAuthorizationGrantIssuancePipelinePreparedContract,
  validateFeedHostActivationTransitionAuthorizationGrantIssuancePipelinePreparedContract,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_GUARDS,
  CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_PIPELINE_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_POLICY,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";

import {
  PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY,
} from "../sealed/controlled-workspace-host-candidate-activation-readiness";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log(
  "\n[phase3b321] activation transition authorization grant issuance pipeline descriptor + engine",
);

{
  const a =
    createControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor();
  const b =
    createControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor();
  assert.equal(a.issuancePipelineState, "completed");
  assert.equal(
    a.issuancePipelineResult,
    "authorization-grant-issuance-pipeline-ready-not-executable",
  );
  assert.equal(a.issuancePipelineCompleted, true);
  assert.equal(a.issuancePipelineReady, true);
  assert.equal(a.issuancePipelineBlocked, true);
  assert.equal(a.issuancePipelineExecutable, false);
  assert.equal(a.wouldExecuteIssuancePipeline, true);
  assert.equal(a.pipelineStageCount, 30);
  assert.equal(a.completedPipelineStageCount, 0);
  assert.equal(a.executablePipelineStageCount, 0);
  assert.equal(a.blockedPipelineStageCount, 30);
  assert.equal(a.invalidPipelineStageCount, 0);
  assert.equal(a.sourcePlanStepCount, 30);
  assert.equal(a.coveredPlanStepCount, 30);
  assert.equal(a.uncoveredPlanStepCount, 0);
  assert.equal(a.duplicateCoveredPlanStepCount, 0);
  assert.equal(a.unknownReferencedPlanStepCount, 0);
  assert.equal(a.planCoverageComplete, true);
  assert.equal(a.planCoverageExact, true);
  assert.equal(a.planOrderPreserved, true);
  assert.equal(a.pipelineDependencyGraphAcyclic, true);
  assert.equal(a.commandPresent, false);
  assert.equal(a.schedulerPresent, false);
  assert.equal(a.executorPresent, false);
  assert.equal(a.dispatcherPresent, false);
  assert.equal(a.queuePresent, false);
  assert.equal(a.issuancePipelineExecutionImpossible, true);
  assert.equal(a.issuancePipelineExecuted, false);
  assert.equal(a.issuanceEligible, true);
  assert.equal(a.issuanceBlocked, true);
  assert.equal(a.wouldIssueGrant, true);
  assert.equal(a.grantIssued, false);
  assert.equal(a.grantCreated, false);
  assert.equal(a.grantMaterialized, false);
  assert.equal(a.grantPersisted, false);
  assert.equal(a.grantApplied, false);
  assert.equal(a.grantActivated, false);
  assert.equal(a.grantConsumed, false);
  assert.equal(a.grantRevoked, false);
  assert.equal(a.grantAuthorityAvailable, false);
  assert.equal(a.grantAuthorityEnabled, false);
  assert.equal(a.grantAuthorityDelegated, false);
  assert.equal(a.grantAuthorityTransferred, false);
  assert.equal(a.tokenPresent, false);
  assert.equal(a.secretPresent, false);
  assert.equal(a.signaturePresent, false);
  assert.equal(a.noncePresent, false);
  assert.equal(a.credentialPresent, false);
  assert.equal(a.certificatePresent, false);
  assert.equal(a.permitPresent, false);
  assert.equal(a.callbackPresent, false);
  assert.equal(a.executableHandlePresent, false);
  assert.equal(a.runtimeCapabilityPresent, false);
  assert.equal(a.grantReadinessResult, "authorization-grant-ready-not-issued");
  assert.equal(a.grantReady, true);
  assert.equal(a.grantBlocked, true);
  assert.equal(
    a.authorizationDecisionResult,
    "authorization-eligible-not-granted",
  );
  assert.equal(a.authorizationEligible, true);
  assert.equal(a.authorizationGranted, false);
  assert.equal(a.transitionAuthorized, false);
  assert.equal(a.currentState, "COMMIT_READY");
  assert.equal(a.currentNode, "COMMIT_READY");
  assert.equal(a.selectedTransition, "COMMIT_READY->ACTIVE");
  assert.equal(a.selectedFromState, "COMMIT_READY");
  assert.equal(a.selectedToState, "ACTIVE");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.renderActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(a.issuancePipelinePolicy, CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_POLICY);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY,
  );
  assert.deepEqual(
    [...a.issuancePipelineConditions],
    [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_CONDITIONS],
  );
  assert.equal(a.issuancePipelineConditions.length, 204);
  assert.deepEqual(
    [...a.satisfiedIssuancePipelineConditions],
    [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_CONDITIONS],
  );
  assert.equal(a.unsatisfiedIssuancePipelineConditions.length, 0);
  assert.deepEqual(
    [...a.issuancePipelineGuards],
    [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_GUARDS],
  );
  assert.equal(a.issuancePipelineGuards.length, 62);
  assert.equal(a.unsatisfiedIssuancePipelineGuards.length, 0);
  assert.ok(
    a.issuancePipelineBlockers.includes(
      PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY,
    ),
  );
  assert.equal(
    a.selectedTransition,
    CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  );
  assert.equal(
    new Set(a.issuancePipelineConditions).size,
    a.issuancePipelineConditions.length,
  );
  assert.equal(new Set(a.issuancePipelineGuards).size, a.issuancePipelineGuards.length);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("authorization grant issuance plan descriptor deterministic");
}

{
  const evaluation =
    evaluateControlledHostActivationTransitionAuthorizationGrantIssuancePipeline(
      createControlledHostRegistry(),
    );
  assert.equal(
    evaluation.descriptor.issuancePipelineResult,
    "authorization-grant-issuance-pipeline-ready-not-executable",
  );
  assert.equal(evaluation.diagnostics.issuancePipelineCompleted, true);
  assert.equal(evaluation.diagnostics.issuancePipelineReady, true);
  assert.equal(evaluation.diagnostics.issuanceBlocked, true);
  assert.equal(evaluation.diagnostics.wouldIssueGrant, true);
  assert.equal(evaluation.diagnostics.grantIssued, false);
  assert.equal(evaluation.diagnostics.grantCreated, false);
  assert.equal(evaluation.diagnostics.grantMaterialized, false);
  assert.equal(evaluation.diagnostics.grantPersisted, false);
  assert.equal(evaluation.diagnostics.grantApplied, false);
  assert.equal(evaluation.diagnostics.grantActivated, false);
  assert.equal(evaluation.diagnostics.grantConsumed, false);
  assert.equal(evaluation.diagnostics.grantRevoked, false);
  assert.equal(evaluation.diagnostics.grantAuthorityAvailable, false);
  assert.equal(evaluation.diagnostics.grantAuthorityEnabled, false);
  assert.equal(evaluation.diagnostics.grantAuthorityDelegated, false);
  assert.equal(evaluation.diagnostics.grantAuthorityTransferred, false);
  assert.equal(evaluation.diagnostics.tokenPresent, false);
  assert.equal(evaluation.diagnostics.secretPresent, false);
  assert.equal(evaluation.diagnostics.signaturePresent, false);
  assert.equal(evaluation.diagnostics.noncePresent, false);
  assert.equal(evaluation.diagnostics.credentialPresent, false);
  assert.equal(evaluation.diagnostics.certificatePresent, false);
  assert.equal(evaluation.diagnostics.permitPresent, false);
  assert.equal(evaluation.diagnostics.callbackPresent, false);
  assert.equal(evaluation.diagnostics.executableHandlePresent, false);
  assert.equal(evaluation.diagnostics.runtimeCapabilityPresent, false);
  assert.equal(evaluation.diagnostics.grantReadinessCompleted, true);
  assert.equal(
    evaluation.diagnostics.grantReadinessResult,
    "authorization-grant-ready-not-issued",
  );
  assert.equal(evaluation.diagnostics.authorizationDecisionCompleted, true);
  assert.equal(evaluation.diagnostics.authorizationEligible, true);
  assert.equal(evaluation.diagnostics.authorizationGranted, false);
  assert.equal(evaluation.diagnostics.transitionAuthorized, false);
  assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.currentNode, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.21");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.22");
  assert.equal(evaluation.diagnostics.issuanceImpossible, true);
  assert.equal(evaluation.diagnostics.authorityImpossible, true);
  assert.equal(evaluation.diagnostics.executionImpossible, true);
  assert.equal(
    evaluation.diagnostics.conditionCount,
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_CONDITIONS.length,
  );
  assert.equal(
    evaluation.diagnostics.satisfiedConditionCount,
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_CONDITIONS.length,
  );
  assert.equal(evaluation.diagnostics.unsatisfiedConditionCount, 0);
  assert.equal(
    evaluation.diagnostics.guardCount,
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_GUARDS.length,
  );
  assert.equal(evaluation.diagnostics.unsatisfiedGuardCount, 0);
  ok(
    "authorization grant issuance pipeline engine + diagnostics metadata only (currentPhase 3B.3.21, chained from 3B.3.18)",
  );
}

{
  const base =
    createControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor(
        { ...base, grantIssued: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor(
        { ...base, grantCreated: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor(
        { ...base, grantAuthorityAvailable: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor(
        { ...base, tokenPresent: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor(
        { ...base, canStartActivation: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuancePipelineDescriptor(
        { ...base, currentState: "ACTIVE" },
      ),
    HardContractViolation,
  );
  ok("authorization grant issuance plan descriptor fail-closed");
}

console.log(
  "\n[phase3b321] contract + identity + gate + host metadata + prepared + permanent block",
);

{
  const c =
    createControlledHostActivationTransitionAuthorizationGrantIssuancePipelineContract();
  assert.equal(
    c.issuancePipelineResult,
    "authorization-grant-issuance-pipeline-ready-not-executable",
  );
  assert.equal(c.issuanceEligible, true);
  assert.equal(c.issuanceBlocked, true);
  assert.equal(c.wouldIssueGrant, true);
  assert.equal(c.grantIssued, false);
  assert.equal(c.grantCreated, false);
  assert.equal(c.grantMaterialized, false);
  assert.equal(c.grantAuthorityAvailable, false);
  assert.equal(c.authorizationGranted, false);
  assert.equal(c.transitionAuthorized, false);
  assert.equal(c.currentState, "COMMIT_READY");
  assert.equal(c.issuancePipelineExecuted, false);
  assert.equal(c.grantCreationAllowed, false);
  assert.equal(c.grantIssuanceAllowed, false);
  assert.equal(c.grantMaterializationAllowed, false);
  assert.equal(c.authorizationGrantAllowed, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuancePipelineContract(
        { ...c, remountAllowed: true },
      ),
    HardContractViolation,
  );
  ok("authorization grant issuance pipeline contract fail-closed");
}

{
  const id =
    createFeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.expectedUnmountCount, 0);
  assert.equal(id.grantCreationViaIssuancePipelineAllowed, false);
  assert.equal(id.grantIssuanceViaIssuancePipelineAllowed, false);
  assert.equal(id.grantMaterializationViaIssuancePipelineAllowed, false);
  assert.equal(id.grantAuthorityViaIssuancePipelineAllowed, false);
  assert.equal(id.authorizationGrantViaIssuancePipelineAllowed, false);
  assert.equal(id.activationViaIssuancePipelineAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.tokenViaIssuancePipelineAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity(
        { ...id, remountAllowed: true },
      ),
    HardContractViolation,
  );
  ok(
    "authorization grant issuance pipeline identity forbids grant creation/issuance/materialization/authority",
  );
}

{
  const gate = evaluateFeedHostActivationGate({
    forceHostActivation: true,
    phase3b2ProofValid: true,
    phase3b2FreezeValid: true,
    phase3b32ProofValid: true,
    phase3b33ProofValid: true,
    phase3b34ProofValid: true,
    phase3b35ProofValid: true,
    phase3b36ProofValid: true,
    phase3b37ProofValid: true,
    phase3b38ProofValid: true,
    phase3b39ProofValid: true,
    phase3b310ProofValid: true,
    phase3b311ProofValid: true,
    phase3b312ProofValid: true,
    phase3b313ProofValid: true,
    phase3b314ProofValid: true,
    phase3b315ProofValid: true,
    phase3b316ProofValid: true,
    phase3b317ProofValid: true,
    phase3b318ProofValid: true,
    phase3b321ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
    observedRegistrationState: "registered",
    observedEligibilityState: "eligible",
    observedReadinessState: "ready",
    observedSimulationState: "completed",
    observedDecisionState: "completed",
    observedPlanState: "completed",
    observedPipelineState: "completed",
    observedTransactionState: "completed",
    observedCommitReadinessState: "completed",
    observedCommitProtocolState: "completed",
    observedStateMachineState: "completed",
    observedTransitionGraphState: "completed",
    observedTransitionSelectionState: "completed",
    observedTransitionPreflightState: "completed",
    observedTransitionAuthorizationDecisionState: "completed",
    observedTransitionAuthorizationGrantReadinessState: "completed",
    observedTransitionAuthorizationGrantIssuancePipelineState: "completed",
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  } as Parameters<typeof evaluateFeedHostActivationGate>[0]);
  assert.equal(gate.allowed, false);
  assert.ok(
    gate.blockers.includes(
      PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.42");
  assert.equal(gate.eligibleStep, "3B.3.43");
  ok(
    "activation remains impossible (gate currentStep=3B.3.22, eligibleStep=3B.3.23)",
  );
}

{
  const host = createControlledFeedHostContract();
  const rollback = createFeedHostRollbackContract();
  const registry = createControlledHostRegistry();
  assert.equal(host.activeWriter, "legacy");
  assert.equal(host.activeRenderOwner, "legacy");
  assert.equal(host.hostActivation, false);
  assert.equal(registry.hostCount, 1);
  assert.equal(rollback.rollbackReadiness, "prepared-not-active");
  assert.equal(host.nextEligibleStep, "3B.3.43");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
    ),
  );
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
    ),
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.37",
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.grantIssued, false);
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation,
    false,
  );
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  const prepared =
    createFeedHostActivationTransitionAuthorizationGrantIssuancePipelinePreparedContract(
      {
        evidenceCommit: "abcdef0123456789",
        evidenceArtifactPath:
          "docs/audits/artifacts/phase3b321/phase3b3-20-feed-host-activation-transition-authorization-grant-issuance-pipeline-proof.json",
        conditionCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_CONDITIONS.length,
        satisfiedConditionCount:
          CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_CONDITIONS.length,
        guardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_GUARDS.length,
        satisfiedGuardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PIPELINE_GUARDS.length,
      },
    );
  assert.equal(
    prepared.status,
    "host-activation-transition-authorization-grant-issuance-pipeline-prepared",
  );
  assert.equal(prepared.nextEligibleStep, "3B.3.22");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.grantIssued, false);
  assert.equal(prepared.issuancePipelineExecuted, false);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationGrantIssuancePipelinePreparedContract(
        { ...prepared, grantIssued: true },
      ),
    HardContractViolation,
  );
  ok("prepared authorization grant issuance pipeline fail-closed");
}

{
  assert.ok(
    CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_PIPELINE_BLOCKERS.includes(
      PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY,
    ),
  );
  const e =
    evaluateControlledHostActivationTransitionAuthorizationGrantIssuancePipeline();
  assert.equal(e.descriptor.grantIssued, false);
  assert.equal(e.descriptor.grantCreated, false);
  assert.equal(e.descriptor.grantMaterialized, false);
  assert.equal(e.descriptor.grantPersisted, false);
  assert.equal(e.descriptor.grantApplied, false);
  assert.equal(e.descriptor.grantActivated, false);
  assert.equal(e.descriptor.grantConsumed, false);
  assert.equal(e.descriptor.grantRevoked, false);
  assert.equal(e.descriptor.grantAuthorityAvailable, false);
  assert.equal(e.descriptor.grantAuthorityEnabled, false);
  assert.equal(e.descriptor.grantAuthorityDelegated, false);
  assert.equal(e.descriptor.grantAuthorityTransferred, false);
  assert.equal(e.descriptor.tokenPresent, false);
  assert.equal(e.descriptor.secretPresent, false);
  assert.equal(e.descriptor.signaturePresent, false);
  assert.equal(e.descriptor.noncePresent, false);
  assert.equal(e.descriptor.credentialPresent, false);
  assert.equal(e.descriptor.certificatePresent, false);
  assert.equal(e.descriptor.permitPresent, false);
  assert.equal(e.descriptor.callbackPresent, false);
  assert.equal(e.descriptor.executableHandlePresent, false);
  assert.equal(e.descriptor.runtimeCapabilityPresent, false);
  assert.equal(e.descriptor.transitionAuthorized, false);
  assert.equal(e.descriptor.transitionExecuted, false);
  assert.equal(e.descriptor.selectionExecuted, false);
  assert.equal(e.descriptor.graphTraversalExecuted, false);
  assert.equal(e.descriptor.protocolExecuted, false);
  assert.equal(e.descriptor.transactionCommitted, false);
  assert.equal(e.descriptor.canStartActivation, false);
  assert.equal(e.descriptor.executorAllowed, false);
  assert.equal(e.descriptor.schedulerAllowed, false);
  assert.equal(e.descriptor.hostActivation, false);
  assert.equal(e.descriptor.renderActivation, false);
  ok("grant issuance permanently blocked with PHASE_3B3_21 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.21 host activation transition authorization grant issuance pipeline: ${passed} assertions ok\n`,
);

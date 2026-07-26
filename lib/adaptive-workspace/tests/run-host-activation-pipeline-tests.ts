/**
 * Phase 3B.3.9 — host activation pipeline unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationPipelineDescriptor,
  evaluateControlledHostActivationPipeline,
  validateControlledHostActivationPipelineDescriptor,
  createControlledHostActivationPipelineContract,
  validateControlledHostActivationPipelineContract,
  createFeedHostActivationPipelineIdentity,
  validateFeedHostActivationPipelineIdentity,
  createFeedHostActivationPipelinePreparedContract,
  validateFeedHostActivationPipelinePreparedContract,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_ORDER,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_VALIDATION_POINTS,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_ROLLBACK_CHECKPOINTS,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_ABORT_CONDITIONS,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
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

console.log("\n[phase3b39] activation pipeline descriptor + engine");

{
  const a = createControlledHostActivationPipelineDescriptor();
  const b = createControlledHostActivationPipelineDescriptor();
  assert.equal(a.pipelineState, "completed");
  assert.equal(a.pipelineResult, "pipeline-complete-not-executable");
  assert.equal(a.decisionResult, "ALLOW");
  assert.equal(a.planResult, "plan-complete-not-executable");
  assert.equal(a.wouldActivate, true);
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(a.activationBlocker, PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY);
  assert.deepEqual(
    [...a.pipelineStages],
    [...CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES],
  );
  assert.deepEqual(
    [...a.stageOrder],
    [...CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_ORDER],
  );
  assert.deepEqual(
    [...a.stageDependencies],
    [...CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES],
  );
  assert.deepEqual(
    [...a.validationPoints],
    [...CONTROLLED_HOST_ACTIVATION_PIPELINE_VALIDATION_POINTS],
  );
  assert.deepEqual(
    [...a.rollbackCheckpoints],
    [...CONTROLLED_HOST_ACTIVATION_PIPELINE_ROLLBACK_CHECKPOINTS],
  );
  assert.deepEqual(
    [...a.abortConditions],
    [...CONTROLLED_HOST_ACTIVATION_PIPELINE_ABORT_CONDITIONS],
  );
  assert.deepEqual(
    [...a.pipelineInputSources],
    [...CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES],
  );
  assert.equal(a.invariants.length, 20);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("pipeline descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationPipeline(
    createControlledHostRegistry(),
  );
  assert.equal(
    evaluation.descriptor.pipelineResult,
    "pipeline-complete-not-executable",
  );
  assert.equal(evaluation.diagnostics.pipelineCompleted, true);
  assert.equal(evaluation.diagnostics.wouldActivate, true);
  assert.equal(
    evaluation.diagnostics.stageCount,
    CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length,
  );
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.9");
  assert.equal(evaluation.diagnostics.planStatus, "completed");
  assert.equal(evaluation.diagnostics.registryHostCount, 1);
  ok("pipeline engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationPipelineDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationPipelineDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationPipelineDescriptor({
        ...base,
        stageOrder: [...CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES].reverse(),
      }),
    HardContractViolation,
  );
  ok("pipeline descriptor fail-closed");
}

console.log("\n[phase3b39] contract + identity + activation safety");

{
  const c = createControlledHostActivationPipelineContract();
  assert.equal(c.pipelineResult, "pipeline-complete-not-executable");
  assert.equal(c.wouldActivate, true);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(c.schedulerAllowed, false);
  assert.equal(c.stageExecutionAllowed, false);
  assert.equal(c.runtimeMutationAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationPipelineContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("pipeline contract fail-closed");
}

{
  const id = createFeedHostActivationPipelineIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.activationViaPipelineAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.executorViaPipelineAllowed, false);
  assert.equal(id.schedulerViaPipelineAllowed, false);
  assert.equal(id.stageExecutionViaPipelineAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationPipelineIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("pipeline identity forbids activation/remount");
}

{
  const gate = evaluateFeedHostActivationGate({
    forceHostActivation: true,
    envHostActivation: true,
    queryHostActivation: true,
    cookieHostActivation: true,
    localStorageHostActivation: true,
    sessionStorageHostActivation: true,
    contextHostActivation: true,
    globalHostActivation: true,
    featureFlagHostActivation: true,
    debugOverrideHostActivation: true,
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
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  });
  assert.equal(gate.allowed, false);
  assert.ok(gate.blockers.includes(PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY));
  assert.equal(gate.currentStep, "3B.3.28");
  assert.equal(gate.eligibleStep, "3B.3.29");
  ok("activation remains impossible");
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
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.pipelineState,
    "completed",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.pipelineResult,
    "pipeline-complete-not-executable",
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback unchanged");
}

{
  const ready = createFeedHostActivationPipelinePreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b39/phase3b3-9-feed-host-activation-pipeline-proof.json",
    stageCount: CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length,
  });
  assert.equal(ready.status, "host-activation-pipeline-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.10");
  assert.equal(ready.pipelineResult, "pipeline-complete-not-executable");
  assert.equal(ready.canStartActivation, false);
  assert.throws(
    () =>
      validateFeedHostActivationPipelinePreparedContract({
        ...ready,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  ok("prepared pipeline fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.9 host activation pipeline: ${passed} assertions ok\n`,
);

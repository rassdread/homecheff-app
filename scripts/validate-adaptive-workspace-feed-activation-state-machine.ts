/**
 * Phase 3B.3.13 static validator — activation state machine contract /
 * integrity / diagnostics / metadata / transition / activation / ownership /
 * renderer / writer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationStateMachineDescriptor,
  createControlledHostActivationStateMachineContract,
  evaluateControlledHostActivationStateMachine,
  createFeedHostActivationStateMachineIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_GUARDS,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_PRECONDITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_VALIDATION_POINTS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationStateMachinePreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-state-machine.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-state-machine-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-state-machine-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-state-machine-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-state-machine-phase3b313.mjs");
mustExist("scripts/run-feed-host-activation-state-machine-proof-phase3b313.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-13-feed-host-activation-state-machine.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b312/phase3b3-12-feed-host-activation-commit-protocol-proof.json",
);

const machineProofPath = join(
  root,
  "docs/audits/artifacts/phase3b313/phase3b3-13-feed-host-activation-state-machine-proof.json",
);
const machinePreparedPath = join(
  root,
  "docs/audits/artifacts/phase3b313/phase3b3-13-feed-host-activation-state-machine-prepared.json",
);
const artifactsPresent =
  existsSync(machineProofPath) && existsSync(machinePreparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B313_ARTIFACTS === "1") {
  assert.fail(
    "Phase 3B.3.13 proof/prepared artifacts required but missing",
  );
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.20");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor = createControlledHostActivationStateMachineDescriptor();
assert.equal(descriptor.machineResult, "state-machine-complete-not-executable");
assert.equal(descriptor.currentState, "COMMIT_READY");
assert.equal(descriptor.transitionExecuted, false);
assert.equal(descriptor.protocolExecuted, false);
assert.equal(descriptor.transactionCommitted, false);
assert.equal(descriptor.canStartActivation, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
);
assert.deepEqual(
  [...descriptor.allowedTransitions],
  [...CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS],
);
assert.deepEqual(
  [...descriptor.blockedTransitions],
  [...CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS],
);
assert.deepEqual(
  [...descriptor.transitionGuards],
  [...CONTROLLED_HOST_ACTIVATION_TRANSITION_GUARDS],
);
assert.deepEqual(
  [...descriptor.transitionPreconditions],
  [...CONTROLLED_HOST_ACTIVATION_TRANSITION_PRECONDITIONS],
);
assert.deepEqual(
  [...descriptor.transitionValidationPoints],
  [...CONTROLLED_HOST_ACTIVATION_TRANSITION_VALIDATION_POINTS],
);
assert.deepEqual(
  [...descriptor.machineInputSources],
  [...CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_INPUT_SOURCES],
);
assert.ok(descriptor.blockedTransitions.includes("COMMIT_READY->ACTIVE"));
assert.equal(descriptor.invariants.length, 20);

const evaluation = evaluateControlledHostActivationStateMachine(registry);
assert.equal(evaluation.diagnostics.machineCompleted, true);
assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
assert.equal(evaluation.diagnostics.transitionExecuted, false);
assert.equal(evaluation.diagnostics.activeUnreachable, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.13");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.14");

const machineContract = createControlledHostActivationStateMachineContract();
assert.equal(
  machineContract.machineResult,
  "state-machine-complete-not-executable",
);
assert.equal(machineContract.transitionExecutionAllowed, false);
assert.equal(machineContract.commitAllowed, false);

const identity = createFeedHostActivationStateMachineIdentity();
assert.equal(identity.transitionExecutionViaStateMachineAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(
  plan.stateMachineResult,
  "state-machine-complete-not-executable",
);
assert.equal(plan.currentActivationLifecycleState, "COMMIT_READY");
assert.equal(plan.transitionExecuted, false);
assert.equal(
  plan.recommendedNextStep,
  "3B.3.20-controlled-host-activation-candidate",
);

const rollback = createFeedHostRollbackContract();
assert.equal(rollback.rollbackReadiness, "prepared-not-active");

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
    phase3b319ProofValid: true,
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
    observedTransitionAuthorizationGrantIssuanceDecisionState: "completed",
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
});
assert.equal(gate.allowed, false);
assert.ok(
  gate.blockers.includes(PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY),
);
assert.equal(gate.currentStep, "3B.3.19");
assert.equal(gate.eligibleStep, "3B.3.20");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.stateMachineResult,
  "state-machine-complete-not-executable",
);
assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.currentActivationLifecycleState,
  "COMMIT_READY",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionExecuted, false);

const shell = readFileSync(
  join(root, "components/adaptive-workspace/FeedControlledHostShell.tsx"),
  "utf8",
);
assert.match(shell, /return null/);
const home = readFileSync(join(root, "components/home/HomePageClient.tsx"), "utf8");
assert.equal((home.match(/<GeoFeed\b/g) ?? []).length, 1);

const probeBridge = readFileSync(
  join(root, "lib/feed/feed-sealed-probe-bridge.ts"),
  "utf8",
);
assert.match(probeBridge, /version:\s*20/);
assert.match(probeBridge, /readHostActivationStateMachine/);
assert.match(probeBridge, /PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY/);

for (const name of [
  "controlled-host-activation-state-machine.ts",
  "controlled-host-activation-state-machine-contract.ts",
  "feed-host-activation-state-machine-identity.ts",
  "feed-host-activation-state-machine-prepared.ts",
]) {
  assert.doesNotMatch(
    readFileSync(join(root, "lib/adaptive-workspace/sealed", name), "utf8"),
    /GeoFeed|HomeGeoFeedDynamic/,
  );
}

const proof3b2 = validateFeedBrowserProofArtifact(
  JSON.parse(
    readFileSync(
      join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json"),
      "utf8",
    ),
  ),
);
assert.equal(proof3b2.overallVerdict, "READY_FOR_PHASE_3B_3");

const freezeRaw = JSON.parse(
  readFileSync(
    join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json"),
    "utf8",
  ),
);
validateFeedDiscoveryFreezeContract({
  ...freezeRaw,
  sealedContract: createFeedDiscoverySealedContract(),
  releaseBlockingInvariantIds: createFeedDiscoverySealedContract().invariantIds,
});

const protocolProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b312/phase3b3-12-feed-host-activation-commit-protocol-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(protocolProof.overallVerdict, "READY_FOR_PHASE_3B_3_13");

if (artifactsPresent) {
  const machineProof = JSON.parse(readFileSync(machineProofPath, "utf8"));
  assert.equal(machineProof.overallVerdict, "READY_FOR_PHASE_3B_3_14");
  assert.equal(machineProof.hostActivation, false);
  assert.equal(machineProof.canStartActivation, false);
  assert.equal(
    machineProof.hostActivationStateMachine.machineResult,
    "state-machine-complete-not-executable",
  );
  assert.equal(
    machineProof.hostActivationStateMachine.currentState,
    "COMMIT_READY",
  );
  assert.equal(
    machineProof.hostActivationStateMachine.transitionExecuted,
    false,
  );
  assert.ok(
    machineProof.hostActivationStateMachine.allowedTransitions.length > 0,
  );
  assert.ok(
    machineProof.hostActivationStateMachine.blockedTransitions.includes(
      "COMMIT_READY->ACTIVE",
    ),
  );
  assert.equal(
    machineProof.hostActivationStateMachine.activationBlocker,
    PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  );
  assert.equal(machineProof.mountUnmount.mountCount, 1);
  assert.equal(machineProof.mountUnmount.unmountCount, 0);
  assert.equal(machineProof.activationAttempt.blocked, true);
  assert.ok(
    machineProof.activationAttempt.blockers.includes(
      PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
    ),
  );
  assert.equal(
    (machineProof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );

  const prepared = validateFeedHostActivationStateMachinePreparedContract(
    JSON.parse(readFileSync(machinePreparedPath, "utf8")),
  );
  assert.equal(prepared.nextEligibleStep, "3B.3.14");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.transitionExecuted, false);
}

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-feed-activation-state-machine: ok (with artifacts)"
    : "validate-adaptive-workspace-feed-activation-state-machine: ok (pre-proof contracts)",
);

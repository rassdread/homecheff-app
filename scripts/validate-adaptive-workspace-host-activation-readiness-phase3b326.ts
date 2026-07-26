/**
 * Phase 3B.3.26 static validator — controlled workspace host activation readiness.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledWorkspaceHostActivationReadinessDescriptor,
  createControlledWorkspaceHostActivationReadinessContract,
  evaluateControlledWorkspaceHostActivationReadiness,
  createFeedWorkspaceHostActivationReadinessIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKERS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedWorkspaceHostActivationReadinessPreparedContract,
  HardContractViolation,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-readiness.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-readiness-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-readiness-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-readiness-prepared.ts",
);
mustExist(
  "scripts/probe-controlled-workspace-host-activation-readiness-phase3b326.mjs",
);
mustExist(
  "scripts/run-controlled-workspace-host-activation-readiness-proof-phase3b326.mjs",
);

mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorProofPath = join(
  root,
  "docs/audits/artifacts/phase3b325/phase3b3-25-controlled-workspace-host-candidate-selection-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b325/phase3b3-25-controlled-workspace-host-candidate-selection-proof.json",
);
const priorProof = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(priorProof.overallVerdict, "READY_FOR_PHASE_3B_3_26");

const proofPath = join(
  root,
  "docs/audits/artifacts/phase3b326/phase3b3-26-controlled-workspace-host-activation-readiness-proof.json",
);
const preparedPath = join(
  root,
  "docs/audits/artifacts/phase3b326/phase3b3-26-controlled-workspace-host-activation-readiness-prepared.json",
);
const auditPath =
  "docs/audits/homecheff-adaptive-workspace-phase3b326-controlled-workspace-host-activation-readiness.md";
const artifactsPresent = existsSync(proofPath) && existsSync(preparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B326_ARTIFACTS === "1") {
  assert.fail("Phase 3B.3.26 proof/prepared artifacts required but missing");
}
if (artifactsPresent || process.env.REQUIRE_PHASE3B326_ARTIFACTS === "1") {
  mustExist(auditPath);
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.31");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledWorkspaceHostActivationReadinessDescriptor();
assert.equal(
  descriptor.activationReadinessResult,
  "controlled-workspace-host-activation-ready-not-authorized",
);
assert.equal(descriptor.activationReadinessState, "READY_NOT_AUTHORIZED");
assert.equal(descriptor.candidateId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID);
assert.equal(
  descriptor.registrationId,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
);
assert.equal(descriptor.selectionId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID);
assert.equal(
  descriptor.activationReadinessId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
);
assert.equal(
  descriptor.activationReadinessContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
);
assert.equal(descriptor.candidateCount, 1);
assert.equal(descriptor.selectedCandidateCount, 1);
assert.equal(descriptor.futureActivationTargetCount, 1);
assert.equal(descriptor.candidateSelected, true);
assert.equal(descriptor.candidateReady, true);
assert.equal(descriptor.candidateAuthorized, false);
assert.equal(descriptor.candidateGranted, false);
assert.equal(descriptor.candidateActivated, false);
assert.equal(descriptor.candidateExecutable, false);
assert.equal(descriptor.predecessorCandidateSelectionState, "SELECTED_NOT_ACTIVATED");
assert.equal(descriptor.issuanceCommitBoundaryState, "NOT_ENTERED");
assert.equal(descriptor.issuanceTransactionState, "NOT_OPENED");
assert.equal(descriptor.issuancePipelineExecutable, false);
assert.equal(descriptor.owner, "legacy");
assert.equal(descriptor.writer, "legacy");
assert.equal(descriptor.renderer, "legacy");
assert.equal(descriptor.mountCount, 1);
assert.equal(descriptor.shellRendered, false);
assert.equal(descriptor.runtimeCapabilityPresent, false);
assert.equal(descriptor.runtimeHostInstancePresent, false);
assert.equal(descriptor.activationHandlePresent, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
);
assert.deepEqual(
  [...descriptor.conditions],
  [...CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS],
);
assert.equal(descriptor.unsatisfiedConditions.length, 0);
assert.deepEqual(
  [...descriptor.guards],
  [...CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS],
);
assert.equal(descriptor.unsatisfiedGuards.length, 0);
assert.ok(
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKERS.includes(
    PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
  ),
);

const evaluation = evaluateControlledWorkspaceHostActivationReadiness(registry);
assert.equal(evaluation.diagnostics.candidateReady, true);
assert.equal(evaluation.diagnostics.candidateAuthorized, false);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.26");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.27");
assert.equal(
  evaluation.diagnostics.satisfiedConditionCount,
  evaluation.diagnostics.conditionCount,
);
assert.equal(evaluation.diagnostics.unsatisfiedConditionCount, 0);
assert.equal(
  evaluation.diagnostics.satisfiedGuardCount,
  evaluation.diagnostics.guardCount,
);

assert.throws(
  () =>
    evaluateControlledWorkspaceHostActivationReadiness(registry, {
      readiness: { runtimeCapabilityPresent: true },
    }),
  HardContractViolation,
);
assert.throws(
  () =>
    evaluateControlledWorkspaceHostActivationReadiness(registry, {
      candidates: [{}, {}],
    }),
  HardContractViolation,
);

const contract = createControlledWorkspaceHostActivationReadinessContract();
assert.equal(contract.phase, "3B.3.26");
assert.equal(contract.nextEligibleStep, "3B.3.27");
const identity = createFeedWorkspaceHostActivationReadinessIdentity();
assert.equal(identity.activationReadinessId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID);

const gate = evaluateFeedHostActivationGate({
  forceHostActivation: true,
  phase3b2ProofValid: true,
  phase3b2FreezeValid: true,
  observedWriter: "legacy",
  observedRenderOwner: "legacy",
  observedMountCount: 1,
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
} as Parameters<typeof evaluateFeedHostActivationGate>[0]);
assert.equal(gate.allowed, false);
assert.equal(gate.currentStep, "3B.3.30");
assert.equal(gate.eligibleStep, "3B.3.31");
assert.ok(
  gate.blockers.includes(
    PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  ),
);

const plan = createControlledFeedHostPlan();
assert.ok(
  plan.blockerSet.includes(
    PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  ),
);
assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.31");

const proofArtifact = JSON.parse(
  readFileSync(
    join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json"),
    "utf8",
  ),
);
validateFeedBrowserProofArtifact(proofArtifact);
const freeze = JSON.parse(
  readFileSync(
    join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json"),
    "utf8",
  ),
);
validateFeedDiscoveryFreezeContract(freeze);
createFeedDiscoverySealedContract();

if (artifactsPresent) {
  const proof = JSON.parse(readFileSync(proofPath, "utf8"));
  assert.equal(proof.overallVerdict, "READY_FOR_PHASE_3B_3_27");
  assert.equal(proof.activationReadinessMetaOk, true);
  assert.equal(proof.forcedNegativeProofsOk, true);
  const prepared = JSON.parse(readFileSync(preparedPath, "utf8"));
  validateFeedWorkspaceHostActivationReadinessPreparedContract(prepared);
  assert.equal(prepared.nextEligibleStep, "3B.3.27");
}

console.log(
  "validate-adaptive-workspace-host-activation-readiness-phase3b326: PASS",
);

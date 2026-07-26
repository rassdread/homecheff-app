/**
 * Phase 3B.3.27 static validator — controlled workspace host activation authorization.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledWorkspaceHostActivationAuthorizationDescriptor,
  createControlledWorkspaceHostActivationAuthorizationContract,
  evaluateControlledWorkspaceHostActivationAuthorization,
  createFeedWorkspaceHostActivationAuthorizationIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedWorkspaceHostActivationAuthorizationPreparedContract,
  HardContractViolation,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-authorization.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-authorization-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-authorization-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-authorization-prepared.ts",
);
mustExist(
  "scripts/probe-controlled-workspace-host-activation-authorization-phase3b327.mjs",
);
mustExist(
  "scripts/run-controlled-workspace-host-activation-authorization-proof-phase3b327.mjs",
);

mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorProofPath = join(
  root,
  "docs/audits/artifacts/phase3b326/phase3b3-26-controlled-workspace-host-activation-readiness-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b326/phase3b3-26-controlled-workspace-host-activation-readiness-proof.json",
);
const priorProof = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(priorProof.overallVerdict, "READY_FOR_PHASE_3B_3_27");

const proofPath = join(
  root,
  "docs/audits/artifacts/phase3b327/phase3b3-27-controlled-workspace-host-activation-authorization-proof.json",
);
const preparedPath = join(
  root,
  "docs/audits/artifacts/phase3b327/phase3b3-27-controlled-workspace-host-activation-authorization-prepared.json",
);
const auditPath =
  "docs/audits/homecheff-adaptive-workspace-phase3b327-controlled-workspace-host-activation-authorization.md";
const artifactsPresent = existsSync(proofPath) && existsSync(preparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B327_ARTIFACTS === "1") {
  assert.fail("Phase 3B.3.27 proof/prepared artifacts required but missing");
}
if (artifactsPresent || process.env.REQUIRE_PHASE3B327_ARTIFACTS === "1") {
  mustExist(auditPath);
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.28");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledWorkspaceHostActivationAuthorizationDescriptor();
assert.equal(
  descriptor.activationAuthorizationResult,
  "controlled-workspace-host-activation-authorized-not-granted",
);
assert.equal(descriptor.activationAuthorizationState, "AUTHORIZED_NOT_GRANTED");
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
  descriptor.activationAuthorizationId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
);
assert.equal(
  descriptor.activationAuthorizationContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
);
assert.equal(descriptor.candidateAuthorized, true);
assert.equal(descriptor.candidateGranted, false);
assert.equal(descriptor.authorizedCandidateCount, 1);
assert.equal(descriptor.grantedCandidateCount, 0);
assert.equal(descriptor.activationGrantIssuanceAllowed, false);
assert.equal(descriptor.predecessorActivationReadinessState, "READY_NOT_AUTHORIZED");
assert.equal(descriptor.issuanceCommitBoundaryState, "NOT_ENTERED");
assert.equal(descriptor.issuanceTransactionState, "NOT_OPENED");
assert.equal(descriptor.issuancePipelineExecutable, false);
assert.equal(descriptor.owner, "legacy");
assert.equal(descriptor.mountCount, 1);
assert.equal(descriptor.shellRendered, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
);
assert.deepEqual(
  [...descriptor.conditions],
  [...CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS],
);
assert.equal(descriptor.unsatisfiedConditions.length, 0);
assert.ok(
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS.includes(
    PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  ),
);

const evaluation = evaluateControlledWorkspaceHostActivationAuthorization(registry);
assert.equal(evaluation.diagnostics.candidateAuthorized, true);
assert.equal(evaluation.diagnostics.candidateGranted, false);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.27");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.28");
assert.equal(
  evaluation.diagnostics.satisfiedConditionCount,
  evaluation.diagnostics.conditionCount,
);

assert.throws(
  () =>
    evaluateControlledWorkspaceHostActivationAuthorization(registry, {
      authorization: { granted: true },
    }),
  HardContractViolation,
);
assert.throws(
  () =>
    evaluateControlledWorkspaceHostActivationAuthorization(registry, {
      candidates: [{}, {}],
    }),
  HardContractViolation,
);

const contract = createControlledWorkspaceHostActivationAuthorizationContract();
assert.equal(contract.phase, "3B.3.27");
assert.equal(contract.nextEligibleStep, "3B.3.28");
const identity = createFeedWorkspaceHostActivationAuthorizationIdentity();
assert.equal(
  identity.activationAuthorizationId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
);

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
assert.equal(gate.currentStep, "3B.3.27");
assert.equal(gate.eligibleStep, "3B.3.28");
assert.ok(
  gate.blockers.includes(
    PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  ),
);

const plan = createControlledFeedHostPlan();
assert.ok(
  plan.blockerSet.includes(
    PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  ),
);
assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.28");

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
  assert.equal(proof.overallVerdict, "READY_FOR_PHASE_3B_3_28");
  assert.equal(proof.activationAuthorizationMetaOk, true);
  assert.equal(proof.forcedNegativeProofsOk, true);
  const prepared = JSON.parse(readFileSync(preparedPath, "utf8"));
  validateFeedWorkspaceHostActivationAuthorizationPreparedContract(prepared);
  assert.equal(prepared.nextEligibleStep, "3B.3.28");
}

console.log(
  "validate-adaptive-workspace-host-activation-authorization-phase3b327: PASS",
);

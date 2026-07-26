/**
 * Phase 3B.3.28 static validator — controlled workspace host activation grant issuance.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledWorkspaceHostActivationGrantIssuanceDescriptor,
  createControlledWorkspaceHostActivationGrantIssuanceContract,
  evaluateControlledWorkspaceHostActivationGrantIssuance,
  createFeedWorkspaceHostActivationGrantIssuanceIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
  PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedWorkspaceHostActivationGrantIssuancePreparedContract,
  HardContractViolation,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-grant-issuance.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-grant-issuance-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-grant-issuance-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-grant-issuance-prepared.ts",
);
mustExist(
  "scripts/probe-controlled-workspace-host-activation-grant-issuance-phase3b328.mjs",
);
mustExist(
  "scripts/run-controlled-workspace-host-activation-grant-issuance-proof-phase3b328.mjs",
);

mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorProofPath = join(
  root,
  "docs/audits/artifacts/phase3b327/phase3b3-27-controlled-workspace-host-activation-authorization-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b327/phase3b3-27-controlled-workspace-host-activation-authorization-proof.json",
);
const priorProof = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(priorProof.overallVerdict, "READY_FOR_PHASE_3B_3_28");
assert.equal(
  priorProof.commit,
  "323af2e8043b053e058f96ab3a7d6224e11fd29b",
);

const proofPath = join(
  root,
  "docs/audits/artifacts/phase3b328/phase3b3-28-controlled-workspace-host-activation-grant-issuance-proof.json",
);
const preparedPath = join(
  root,
  "docs/audits/artifacts/phase3b328/phase3b3-28-controlled-workspace-host-activation-grant-issuance-prepared.json",
);
const auditPath =
  "docs/audits/homecheff-adaptive-workspace-phase3b328-controlled-workspace-host-activation-grant-issuance.md";
const artifactsPresent = existsSync(proofPath) && existsSync(preparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B328_ARTIFACTS === "1") {
  assert.fail("Phase 3B.3.28 proof/prepared artifacts required but missing");
}
if (artifactsPresent || process.env.REQUIRE_PHASE3B328_ARTIFACTS === "1") {
  mustExist(auditPath);
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.31");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledWorkspaceHostActivationGrantIssuanceDescriptor();
assert.equal(
  descriptor.grantIssuanceResult,
  "controlled-workspace-host-activation-grant-issued-not-activated",
);
assert.equal(descriptor.grantIssuanceState, "GRANTED_NOT_ACTIVATED");
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
assert.equal(descriptor.activationGrantId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID);
assert.equal(
  descriptor.activationGrantContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_CONTRACT_ID,
);
assert.equal(
  descriptor.activationGrantIssuanceId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
);
assert.equal(
  descriptor.activationGrantIssuanceContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
);
assert.equal(descriptor.candidateAuthorized, true);
assert.equal(descriptor.candidateGranted, true);
assert.equal(descriptor.grantPresent, true);
assert.equal(descriptor.grantExecutable, false);
assert.equal(descriptor.grantedCandidateCount, 1);
assert.equal(descriptor.grantCount, 1);
assert.equal(descriptor.activationGrantIssuanceAllowed, false);
assert.equal(
  descriptor.predecessorActivationAuthorizationState,
  "AUTHORIZED_NOT_GRANTED",
);
assert.equal(descriptor.issuanceCommitBoundaryState, "NOT_ENTERED");
assert.equal(descriptor.issuanceTransactionState, "NOT_OPENED");
assert.equal(descriptor.issuancePipelineExecutable, false);
assert.equal(descriptor.owner, "legacy");
assert.equal(descriptor.mountCount, 1);
assert.equal(descriptor.shellRendered, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
);
assert.deepEqual(
  [...descriptor.conditions],
  [...CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS],
);
assert.equal(descriptor.unsatisfiedConditions.length, 0);
assert.ok(
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS.includes(
    PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
  ),
);

const evaluation = evaluateControlledWorkspaceHostActivationGrantIssuance(registry);
assert.equal(evaluation.diagnostics.candidateGranted, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.28");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.29");
assert.equal(
  evaluation.diagnostics.satisfiedConditionCount,
  evaluation.diagnostics.conditionCount,
);

assert.throws(
  () =>
    evaluateControlledWorkspaceHostActivationGrantIssuance(registry, {
      grant: { grantExecutable: true },
    }),
  HardContractViolation,
);
assert.throws(
  () =>
    evaluateControlledWorkspaceHostActivationGrantIssuance(registry, {
      candidates: [{}, {}],
    }),
  HardContractViolation,
);

const contract = createControlledWorkspaceHostActivationGrantIssuanceContract();
assert.equal(contract.phase, "3B.3.28");
assert.equal(contract.nextEligibleStep, "3B.3.29");
const identity = createFeedWorkspaceHostActivationGrantIssuanceIdentity();
assert.equal(
  identity.activationGrantIssuanceId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
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
  assert.equal(proof.overallVerdict, "READY_FOR_PHASE_3B_3_29");
  assert.equal(proof.activationGrantIssuanceMetaOk, true);
  assert.equal(proof.forcedNegativeProofsOk, true);
  const prepared = JSON.parse(readFileSync(preparedPath, "utf8"));
  validateFeedWorkspaceHostActivationGrantIssuancePreparedContract(prepared);
  assert.equal(prepared.nextEligibleStep, "3B.3.29");
}

console.log(
  "validate-adaptive-workspace-host-activation-grant-issuance-phase3b328: PASS",
);

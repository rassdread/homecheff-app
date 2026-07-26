/**
 * Phase 3B.3.24 static validator — controlled workspace host candidate registration.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledWorkspaceHostCandidateRegistrationDescriptor,
  createControlledWorkspaceHostCandidateRegistrationContract,
  evaluateControlledWorkspaceHostCandidateRegistration,
  createFeedWorkspaceHostCandidateIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKERS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedWorkspaceHostCandidateRegistrationPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-candidate-registration.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-candidate-registration-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-candidate-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-candidate-registration-prepared.ts",
);
mustExist(
  "scripts/probe-controlled-workspace-host-candidate-registration-phase3b324.mjs",
);
mustExist(
  "scripts/run-controlled-workspace-host-candidate-registration-proof-phase3b324.mjs",
);

mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorProofPath = join(
  root,
  "docs/audits/artifacts/phase3b323/phase3b3-23-feed-host-activation-transition-authorization-grant-issuance-commit-boundary-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b323/phase3b3-23-feed-host-activation-transition-authorization-grant-issuance-commit-boundary-proof.json",
);
const priorProof = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(priorProof.overallVerdict, "READY_FOR_PHASE_3B_3_24");

const proofPath = join(
  root,
  "docs/audits/artifacts/phase3b324/phase3b3-24-controlled-workspace-host-candidate-registration-proof.json",
);
const preparedPath = join(
  root,
  "docs/audits/artifacts/phase3b324/phase3b3-24-controlled-workspace-host-candidate-registration-prepared.json",
);
const auditPath =
  "docs/audits/homecheff-adaptive-workspace-phase3b3-24-controlled-workspace-host-candidate-registration.md";
const artifactsPresent = existsSync(proofPath) && existsSync(preparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B324_ARTIFACTS === "1") {
  assert.fail("Phase 3B.3.24 proof/prepared artifacts required but missing");
}
if (artifactsPresent || process.env.REQUIRE_PHASE3B324_ARTIFACTS === "1") {
  mustExist(auditPath);
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.26");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  ),
);
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledWorkspaceHostCandidateRegistrationDescriptor();
assert.equal(
  descriptor.candidateRegistrationResult,
  "controlled-workspace-host-candidate-registered-not-selected",
);
assert.equal(descriptor.candidateRegistrationState, "REGISTERED_NOT_SELECTED");
assert.equal(descriptor.candidateId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID);
assert.equal(
  descriptor.candidateRegistrationId,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
);
assert.equal(descriptor.candidateCount, 1);
assert.equal(descriptor.selectedCandidateCount, 0);
assert.equal(descriptor.candidateSelected, false);
assert.equal(descriptor.issuanceCommitBoundaryState, "NOT_ENTERED");
assert.equal(descriptor.issuanceTransactionState, "NOT_OPENED");
assert.equal(descriptor.issuancePipelineExecutable, false);
assert.equal(descriptor.owner, "legacy");
assert.equal(descriptor.mountCount, 1);
assert.equal(descriptor.shellRendered, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
);
assert.deepEqual(
  [...descriptor.conditions],
  [...CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS],
);
assert.equal(descriptor.unsatisfiedConditions.length, 0);
assert.deepEqual(
  [...descriptor.guards],
  [...CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS],
);
assert.equal(descriptor.unsatisfiedGuards.length, 0);
assert.ok(
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKERS.includes(
    PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  ),
);

const evaluation = evaluateControlledWorkspaceHostCandidateRegistration(registry);
assert.equal(evaluation.diagnostics.candidateRegistered, true);
assert.equal(evaluation.diagnostics.candidateSelected, false);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.24");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.25");
assert.equal(
  evaluation.diagnostics.satisfiedConditionCount,
  evaluation.diagnostics.conditionCount,
);
assert.equal(evaluation.diagnostics.unsatisfiedConditionCount, 0);
assert.equal(
  evaluation.diagnostics.satisfiedGuardCount,
  evaluation.diagnostics.guardCount,
);

const contract = createControlledWorkspaceHostCandidateRegistrationContract();
assert.equal(contract.candidateSelected, false);
assert.equal(contract.nextEligibleStep, "3B.3.25");

const identity = createFeedWorkspaceHostCandidateIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.candidateOwner, "none");

const plan = createControlledFeedHostPlan();
assert.equal(
  plan.recommendedNextStep,
  "3B.3.26-controlled-workspace-host-activation-readiness",
);

const rollback = createFeedHostRollbackContract();
assert.equal(rollback.rollbackReadiness, "prepared-not-active");

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
assert.equal(gate.currentStep, "3B.3.25");
assert.equal(gate.eligibleStep, "3B.3.26");
assert.ok(
  gate.blockers.includes(
    PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  ),
);

assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.26");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.grantIssued, false);

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
assert.match(probeBridge, /version: 26/);
assert.match(probeBridge, /readControlledWorkspaceHostCandidateRegistration/);
assert.match(
  probeBridge,
  /PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY/,
);

for (const name of [
  "controlled-workspace-host-candidate-registration.ts",
  "controlled-workspace-host-candidate-registration-contract.ts",
  "feed-workspace-host-candidate-identity.ts",
  "feed-workspace-host-candidate-registration-prepared.ts",
]) {
  assert.doesNotMatch(
    readFileSync(join(root, "lib/adaptive-workspace/sealed", name), "utf8"),
    /\b(fetch|localStorage|sessionStorage|setTimeout|setInterval)\b/,
  );
}

const browserProof = JSON.parse(
  readFileSync(
    join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json"),
    "utf8",
  ),
);
validateFeedBrowserProofArtifact(browserProof);
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

if (artifactsPresent) {
  const proof = JSON.parse(readFileSync(proofPath, "utf8"));
  assert.equal(proof.overallVerdict, "READY_FOR_PHASE_3B_3_25");
  assert.equal(proof.candidateRegistrationMetaOk, true);
  assert.equal(proof.hostActivation, false);
  assert.equal(proof.mountUnmount.mountCount, 1);
  assert.equal(proof.mountUnmount.unmountCount, 0);
  assert.equal(
    (proof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );
  const prepared = validateFeedWorkspaceHostCandidateRegistrationPreparedContract(
    JSON.parse(readFileSync(preparedPath, "utf8")),
  );
  assert.equal(prepared.nextEligibleStep, "3B.3.25");
  assert.equal(prepared.candidateSelected, false);
  assert.equal(prepared.issuanceCommitBoundaryState, "NOT_ENTERED");
}

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-controlled-workspace-host-candidate-registration: ok (with artifacts)"
    : "validate-adaptive-workspace-controlled-workspace-host-candidate-registration: ok (pre-proof contracts)",
);

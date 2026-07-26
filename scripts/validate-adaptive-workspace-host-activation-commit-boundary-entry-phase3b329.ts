/**
 * Phase 3B.3.29 static validator — controlled workspace host activation commit-boundary entry.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledWorkspaceHostActivationCommitBoundaryEntryDescriptor,
  createControlledWorkspaceHostActivationCommitBoundaryEntryContract,
  evaluateControlledWorkspaceHostActivationCommitBoundaryEntry,
  createFeedWorkspaceHostActivationCommitBoundaryEntryIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_BLOCKERS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedWorkspaceHostActivationCommitBoundaryEntryPreparedContract,
  HardContractViolation,
  stableStringify,
} from "../lib/adaptive-workspace";

const root = process.cwd();

const PREDECESSOR_PHASE = "3B.3.28";
const PREDECESSOR_HEAD =
  "2af07c062edd176fcf6631461d6a9e3d93bcce2c";
const PREDECESSOR_PROOF_TARGET =
  "7b2bb2fbfc6c4edc52ac7552e31513ce34710fc3";
const PREDECESSOR_RESULT =
  "controlled-workspace-host-activation-grant-issued-not-activated";
const PREDECESSOR_LIFECYCLE = "GRANTED_NOT_ACTIVATED";
const PREDECESSOR_VERDICT = "READY_FOR_PHASE_3B_3_29";

const UNRESOLVED = [
  "UNRESOLVED_UNTIL_3B328_FROZEN",
  "UNKNOWN",
  "TBD",
  "PLACEHOLDER",
  "CURRENT_HEAD",
  "LATEST",
] as const;

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

function rejectUnresolved(label: string, value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const token of UNRESOLVED) {
    assert.ok(
      !text.includes(token),
      `${label} must not contain unresolved token ${token}`,
    );
  }
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-commit-boundary-entry.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-commit-boundary-entry-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-commit-boundary-entry-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-commit-boundary-entry-prepared.ts",
);
mustExist(
  "scripts/probe-controlled-workspace-host-activation-commit-boundary-entry-phase3b329.mjs",
);
mustExist(
  "scripts/run-controlled-workspace-host-activation-commit-boundary-entry-proof-phase3b329.mjs",
);

mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorProofPath = join(
  root,
  "docs/audits/artifacts/phase3b328/phase3b3-28-controlled-workspace-host-activation-grant-issuance-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b328/phase3b3-28-controlled-workspace-host-activation-grant-issuance-proof.json",
);
const priorProof = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(priorProof.overallVerdict, PREDECESSOR_VERDICT);
assert.equal(priorProof.commit, PREDECESSOR_PROOF_TARGET);
rejectUnresolved("priorProof.overallVerdict", priorProof.overallVerdict);
rejectUnresolved("priorProof.commit", priorProof.commit);

try {
  execSync(`git merge-base --is-ancestor ${PREDECESSOR_HEAD} HEAD`, {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  });
} catch {
  assert.fail(
    `predecessor HEAD ${PREDECESSOR_HEAD} must be ancestor of current HEAD`,
  );
}
rejectUnresolved("predecessorHead", PREDECESSOR_HEAD);

const proofPath = join(
  root,
  "docs/audits/artifacts/phase3b329/phase3b3-29-controlled-workspace-host-activation-commit-boundary-entry-proof.json",
);
const preparedPath = join(
  root,
  "docs/audits/artifacts/phase3b329/phase3b3-29-controlled-workspace-host-activation-commit-boundary-entry-prepared.json",
);
const auditPath =
  "docs/audits/homecheff-adaptive-workspace-phase3b329-controlled-workspace-host-activation-commit-boundary-entry.md";
const artifactsPresent = existsSync(proofPath) && existsSync(preparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B329_ARTIFACTS === "1") {
  assert.fail("Phase 3B.3.29 proof/prepared artifacts required but missing");
}
if (artifactsPresent || process.env.REQUIRE_PHASE3B329_ARTIFACTS === "1") {
  mustExist(auditPath);
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.30");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledWorkspaceHostActivationCommitBoundaryEntryDescriptor();
assert.equal(descriptor.phase, "3B.3.29");
assert.equal(
  descriptor.commitBoundaryEntryResult,
  "controlled-workspace-host-activation-commit-boundary-entered",
);
assert.equal(descriptor.commitBoundaryEntryState, "COMMIT_BOUNDARY_ENTERED");
assert.equal(descriptor.activationCommitBoundaryState, "ENTERED");
assert.equal(descriptor.activationCommitBoundaryEntered, true);
assert.equal(descriptor.transitionFrom, "NOT_ENTERED");
assert.equal(descriptor.transitionTo, "ENTERED");
assert.equal(descriptor.transitionLegal, true);
assert.equal(descriptor.commitBoundaryEntryCount, 1);
assert.equal(descriptor.duplicateCommitBoundaryEntryCount, 0);
assert.equal(descriptor.activationCommitBoundaryArmed, false);
assert.equal(descriptor.activationCommitBoundaryCrossed, false);
assert.equal(descriptor.activationCommitBoundaryCommitted, false);
assert.equal(descriptor.activationCommitBoundaryAborted, false);
assert.equal(descriptor.activationCommitBoundaryExecutable, false);
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
  descriptor.activationGrantIssuanceId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
);
assert.equal(
  descriptor.activationCommitBoundaryId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
);
assert.equal(
  descriptor.activationCommitBoundaryContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_CONTRACT_ID,
);
assert.equal(
  descriptor.activationCommitBoundaryEntryId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
);
assert.equal(
  descriptor.activationCommitBoundaryEntryContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONTRACT_ID,
);
assert.equal(descriptor.candidateSelected, true);
assert.equal(descriptor.candidateReady, true);
assert.equal(descriptor.candidateAuthorized, true);
assert.equal(descriptor.candidateGranted, true);
assert.equal(descriptor.grantPresent, true);
assert.equal(descriptor.grantExecutable, false);
assert.equal(descriptor.candidateActivated, false);
assert.equal(descriptor.candidateActive, false);
assert.equal(descriptor.candidateExecutable, false);
assert.equal(descriptor.grantedCandidateCount, 1);
assert.equal(descriptor.grantCount, 1);
assert.equal(descriptor.runtimeCapabilityPresent, false);
assert.equal(descriptor.runtimeHostInstancePresent, false);
assert.equal(descriptor.activationHandlePresent, false);
assert.equal(descriptor.tokenPresent, false);
assert.equal(descriptor.credentialPresent, false);
assert.equal(descriptor.certificatePresent, false);
assert.equal(descriptor.permitPresent, false);
assert.equal(
  descriptor.predecessorActivationGrantIssuanceState,
  PREDECESSOR_LIFECYCLE,
);
assert.equal(
  descriptor.predecessorActivationGrantIssuanceResult,
  PREDECESSOR_RESULT,
);
assert.equal(descriptor.issuanceCommitBoundaryState, "NOT_ENTERED");
assert.equal(descriptor.issuanceTransactionState, "NOT_OPENED");
assert.equal(descriptor.issuanceTransactionOpened, false);
assert.equal(descriptor.issuancePipelineExecutable, false);
assert.equal(descriptor.owner, "legacy");
assert.equal(descriptor.writer, "legacy");
assert.equal(descriptor.renderer, "legacy");
assert.equal(descriptor.mountCount, 1);
assert.equal(descriptor.geoFeedRenderCount, 1);
assert.equal(descriptor.shellRendered, false);
assert.equal(descriptor.workspaceHostMounted, false);
assert.equal(descriptor.nextEligibleStep, "3B.3.30");
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
);
assert.deepEqual(
  [...descriptor.conditions],
  [...CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.guards],
  [...CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_GUARDS],
);
assert.equal(descriptor.unsatisfiedConditions.length, 0);
assert.ok(
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_BLOCKERS.includes(
    PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  ),
);

rejectUnresolved("descriptor.commitBoundaryEntryResult", descriptor.commitBoundaryEntryResult);
rejectUnresolved("descriptor.activationCommitBoundaryId", descriptor.activationCommitBoundaryId);
rejectUnresolved("PREDECESSOR_PHASE", PREDECESSOR_PHASE);

const evaluation = evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(registry);
assert.equal(evaluation.diagnostics.activationCommitBoundaryEntered, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.29");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.30");
assert.equal(
  evaluation.diagnostics.satisfiedConditionCount,
  evaluation.diagnostics.conditionCount,
);
assert.equal(
  evaluation.diagnostics.satisfiedGuardCount,
  evaluation.diagnostics.guardCount,
);

const serialized = stableStringify(evaluation.diagnostics);
assert.ok(typeof serialized === "string" && serialized.length > 0);
rejectUnresolved("diagnostics", serialized);

const failClosedCases: Array<{ label: string; input: Record<string, unknown> }> = [
  {
    label: "missing predecessor grant issuance",
    input: { candidateGranted: false },
  },
  {
    label: "wrong predecessor result",
    input: {
      grantIssuanceResult: "controlled-workspace-host-activation-authorized-not-granted",
    },
  },
  {
    label: "wrong predecessor lifecycle",
    input: { grantIssuanceState: "AUTHORIZED_NOT_GRANTED" },
  },
  { label: "missing candidate", input: { candidates: [] } },
  { label: "duplicated candidate", input: { candidates: [{}, {}] } },
  { label: "missing grant", input: { entry: { grantPresent: false } } },
  {
    label: "duplicated grant / second entry",
    input: { entryRecords: [{}, {}] },
  },
  {
    label: "invalid commit-boundary identity",
    input: { entry: { activationCommitBoundaryId: "invalid.boundary.id" } },
  },
  {
    label: "invalid commit-boundary contract path",
    input: { entry: { activationCommitBoundaryEntryAllowed: true } },
  },
  { label: "candidate activated", input: { entry: { activated: true } } },
  { label: "candidate active", input: { entry: { active: true } } },
  {
    label: "candidate executable",
    input: { entry: { grantExecutable: true } },
  },
  {
    label: "runtime capability present",
    input: { entry: { runtimeCapabilityPresent: true } },
  },
  {
    label: "runtime host present",
    input: { entry: { runtimeHostInstancePresent: true } },
  },
  {
    label: "activation handle present",
    input: { entry: { activationHandlePresent: true } },
  },
  {
    label: "execution handle present",
    input: { entry: { executorPresent: true } },
  },
  { label: "transaction opened", input: { issuanceTransactionOpened: true } },
  { label: "pipeline executable", input: { issuancePipelineExecutable: true } },
  {
    label: "boundary armed beyond ENTERED",
    input: { activationCommitBoundaryArmed: true },
  },
  {
    label: "boundary crossed",
    input: { activationCommitBoundaryCrossed: true },
  },
  {
    label: "boundary committed",
    input: { activationCommitBoundaryCommitted: true },
  },
  {
    label: "boundary aborted",
    input: { activationCommitBoundaryAborted: true },
  },
  { label: "illegal boundary transition", input: { transitionFrom: "ENTERED" } },
  { label: "second boundary entry", input: { entryRecords: [{}, {}] } },
  { label: "Workspace rendered", input: { shellRendered: true } },
  { label: "Workspace mounted/hosting", input: { entry: { hosting: true } } },
  { label: "Workspace visible", input: { entry: { visible: true } } },
  {
    label: "Workspace React/render instance present",
    input: { entry: { rendering: true } },
  },
  {
    label: "GeoFeed duplicated",
    input: { entry: { duplicatesGeoFeed: true } },
  },
  { label: "GeoFeed wrapped", input: { entry: { wrapsGeoFeed: true } } },
  { label: "GeoFeed relocated", input: { entry: { mountsGeoFeed: true } } },
  { label: "owner changed", input: { owner: "adaptive-workspace" } },
  { label: "writer changed", input: { writer: "adaptive-workspace" } },
  { label: "renderer changed", input: { renderer: "adaptive-workspace" } },
  {
    label: "ownership transfer attempted",
    input: { entry: { ownershipTransferAllowed: true } },
  },
  {
    label: "writer transfer attempted",
    input: { entry: { writerTransferAllowed: true } },
  },
  {
    label: "renderer transfer attempted",
    input: { entry: { rendererTransferAllowed: true } },
  },
  {
    label: "runtime adoption attempted",
    input: { entry: { runtimeAdoptionAllowed: true } },
  },
];

let forcedNegativePassCount = 0;
for (const { label, input } of failClosedCases) {
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationCommitBoundaryEntry(
        registry,
        input as never,
      ),
    HardContractViolation,
    `forced-negative must fail closed: ${label}`,
  );
  forcedNegativePassCount += 1;
}
assert.equal(forcedNegativePassCount, failClosedCases.length);
assert.ok(forcedNegativePassCount >= 30, "expected at least 30 forced-negative cases");

const contract = createControlledWorkspaceHostActivationCommitBoundaryEntryContract();
assert.equal(contract.phase, "3B.3.29");
assert.equal(contract.nextEligibleStep, "3B.3.30");
const identity = createFeedWorkspaceHostActivationCommitBoundaryEntryIdentity();
assert.equal(
  identity.activationCommitBoundaryEntryId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
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
assert.equal(gate.currentStep, "3B.3.29");
assert.equal(gate.eligibleStep, "3B.3.30");
assert.ok(
  gate.blockers.includes(
    PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  ),
);

const plan = createControlledFeedHostPlan();
assert.ok(
  plan.blockerSet.includes(
    PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY,
  ),
);
assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.30");

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
  assert.equal(proof.overallVerdict, "READY_FOR_PHASE_3B_3_30");
  assert.equal(proof.activationCommitBoundaryEntryMetaOk, true);
  assert.equal(proof.forcedNegativeProofsOk, true);
  assert.equal(proof.bridgeVersion ?? proof.version ?? 30, 30);
  rejectUnresolved("proof.overallVerdict", proof.overallVerdict);
  const prepared = JSON.parse(readFileSync(preparedPath, "utf8"));
  validateFeedWorkspaceHostActivationCommitBoundaryEntryPreparedContract(prepared);
  assert.equal(prepared.nextEligibleStep, "3B.3.30");
  assert.equal(prepared.activationCommitBoundaryState, "ENTERED");
  assert.equal(prepared.transitionFrom, "NOT_ENTERED");
  assert.equal(prepared.transitionTo, "ENTERED");
}

console.log(
  "validate-adaptive-workspace-host-activation-commit-boundary-entry-phase3b329: PASS",
);

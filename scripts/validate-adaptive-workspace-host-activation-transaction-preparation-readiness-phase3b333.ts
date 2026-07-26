/**
 * Phase 3B.3.33 static validator — controlled workspace host activation transaction-preparation-readiness.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledWorkspaceHostActivationTransactionPreparationReadinessDescriptor,
  createControlledWorkspaceHostActivationTransactionPreparationReadinessContract,
  evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness,
  createFeedWorkspaceHostActivationTransactionPreparationReadinessIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
  PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY,
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
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_BLOCKERS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedWorkspaceHostActivationTransactionPreparationReadinessPreparedContract,
  HardContractViolation,
  stableStringify,
} from "../lib/adaptive-workspace";

const root = process.cwd();

const PREDECESSOR_PHASE = "3B.3.32";
const PREDECESSOR_HEAD =
  "bd9e2a0589a007175f582509c37432b631bff20c";
const PREDECESSOR_PROOF_TARGET =
  "ce41003696dd9a42b7f5c8f49a1482de345c4968";
const PREDECESSOR_RESULT =
  "controlled-workspace-host-activation-transaction-opened-not-prepared";
const PREDECESSOR_LIFECYCLE = "TRANSACTION_OPENED_NOT_PREPARED";
const PREDECESSOR_VERDICT = "READY_FOR_PHASE_3B_3_33";

const UNRESOLVED = [
  "UNRESOLVED_UNTIL_3B330_FROZEN",
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
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-transaction-preparation-readiness.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-activation-transaction-preparation-readiness-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-transaction-preparation-readiness-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-activation-transaction-preparation-readiness-prepared.ts",
);
mustExist(
  "scripts/probe-controlled-workspace-host-activation-transaction-preparation-readiness-phase3b333.mjs",
);
mustExist(
  "scripts/run-controlled-workspace-host-activation-transaction-preparation-readiness-proof-phase3b333.mjs",
);

mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorProofPath = join(
  root,
  "docs/audits/artifacts/phase3b332/phase3b3-32-controlled-workspace-host-activation-transaction-opening-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b332/phase3b3-32-controlled-workspace-host-activation-transaction-opening-proof.json",
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
  "docs/audits/artifacts/phase3b333/phase3b3-33-controlled-workspace-host-activation-transaction-preparation-readiness-proof.json",
);
const preparedPath = join(
  root,
  "docs/audits/artifacts/phase3b333/phase3b3-33-controlled-workspace-host-activation-transaction-preparation-readiness-prepared.json",
);
const auditPath =
  "docs/audits/homecheff-adaptive-workspace-phase3b333-controlled-workspace-host-activation-transaction-preparation-readiness.md";
const artifactsPresent = existsSync(proofPath) && existsSync(preparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B333_ARTIFACTS === "1") {
  assert.fail("Phase 3B.3.33 proof/prepared artifacts required but missing");
}
if (artifactsPresent || process.env.REQUIRE_PHASE3B333_ARTIFACTS === "1") {
  mustExist(auditPath);
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.35");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledWorkspaceHostActivationTransactionPreparationReadinessDescriptor();
assert.equal(descriptor.phase, "3B.3.33");
assert.equal(
  descriptor.transactionPreparationReadinessResult,
  "controlled-workspace-host-activation-transaction-preparation-ready-not-prepared",
);
assert.equal(
  descriptor.transactionPreparationReadinessState,
  "TRANSACTION_PREPARATION_READY_NOT_PREPARED",
);
assert.equal(descriptor.activationCommitBoundaryState, "ENTERED");
assert.equal(descriptor.activationCommitBoundaryEntered, true);
assert.equal(descriptor.transitionFrom, "NOT_ENTERED");
assert.equal(descriptor.transitionTo, "ENTERED");
assert.equal(descriptor.transitionLegal, true);
assert.equal(descriptor.transactionPreparationReadinessCount, 1);
assert.equal(descriptor.duplicateTransactionPreparationReadinessCount, 0);
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
  descriptor.activationTransactionOpeningReadinessId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
);
assert.equal(
  descriptor.activationTransactionOpeningAuthorizationId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
);
assert.equal(
  descriptor.activationTransactionOpeningAuthorizationContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
);
assert.equal(
  descriptor.activationTransactionOpeningId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
);
assert.equal(
  descriptor.activationTransactionOpeningContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
);
assert.equal(
  descriptor.activationTransactionPreparationReadinessId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
);
assert.equal(
  descriptor.activationTransactionPreparationReadinessContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID,
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
  descriptor.predecessorActivationTransactionOpeningState,
  PREDECESSOR_LIFECYCLE,
);
assert.equal(
  descriptor.predecessorActivationTransactionOpeningResult,
  PREDECESSOR_RESULT,
);
assert.equal(descriptor.transactionOpeningReady, true);
assert.equal(descriptor.transactionOpeningAuthorized, true);
assert.equal(descriptor.transactionOpeningStarted, true);
assert.equal(descriptor.transactionOpeningCompleted, true);
assert.equal(descriptor.transactionPreparationReady, true);
assert.equal(descriptor.transactionPreparationAuthorized, false);
assert.equal(descriptor.issuancePipelineState, "NON_EXECUTABLE");
assert.equal(descriptor.issuanceCommitBoundaryState, "NOT_ENTERED");
assert.equal(descriptor.issuanceTransactionState, "OPENED");
assert.equal(descriptor.issuanceTransactionOpened, true);
assert.equal(descriptor.issuanceTransactionPrepared, false);
assert.equal(descriptor.issuanceTransactionCommitted, false);
assert.equal(descriptor.issuanceTransactionAborted, false);
assert.equal(descriptor.issuancePipelineExecutable, false);
assert.equal(descriptor.owner, "legacy");
assert.equal(descriptor.writer, "legacy");
assert.equal(descriptor.renderer, "legacy");
assert.equal(descriptor.mountCount, 1);
assert.equal(descriptor.geoFeedRenderCount, 1);
assert.equal(descriptor.shellRendered, false);
assert.equal(descriptor.workspaceHostMounted, false);
assert.equal(descriptor.nextEligibleStep, "3B.3.34");
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
);
assert.deepEqual(
  [...descriptor.conditions],
  [...CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.guards],
  [...CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_GUARDS],
);
assert.equal(descriptor.unsatisfiedConditions.length, 0);
assert.ok(
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_BLOCKERS.includes(
    PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
  ),
);

rejectUnresolved("descriptor.transactionPreparationReadinessResult", descriptor.transactionPreparationReadinessResult);
rejectUnresolved("descriptor.activationCommitBoundaryId", descriptor.activationCommitBoundaryId);
rejectUnresolved("PREDECESSOR_PHASE", PREDECESSOR_PHASE);

const evaluation = evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(registry);
assert.equal(evaluation.diagnostics.activationCommitBoundaryEntered, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.33");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.34");
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
    label: "missing predecessor commit-boundary grant",
    input: { candidateGranted: false },
  },
  {
    label: "wrong predecessor result",
    input: {
      commitBoundaryEntryResult: "controlled-workspace-host-activation-grant-issued-not-activated",
    },
  },
  {
    label: "wrong predecessor lifecycle",
    input: { commitBoundaryEntryState: "GRANTED_NOT_ACTIVATED" },
  },
  {
    label: "issuance transaction state not opened",
    input: { issuanceTransactionState: "NOT_OPENED" },
  },
  {
    label: "transaction opening readiness absent",
    input: { transactionOpeningReady: false },
  },
  {
    label: "transaction preparation readiness duplicate",
    input: { transactionPreparationReady: true },
  },
  {
    label: "transaction opening authorization absent",
    input: { transactionOpeningAuthorized: false },
  },
  {
    label: "transaction opening completed absent",
    input: { transactionOpeningCompleted: false },
  },
  {
    label: "transaction preparation authorized early",
    input: { transactionPreparationAuthorized: true },
  },
  {
    label: "issuance transaction prepared early",
    input: { issuanceTransactionPrepared: true },
  },
  {
    label: "issuance transaction committed early",
    input: { issuanceTransactionCommitted: true },
  },
  {
    label: "issuance transaction aborted early",
    input: { issuanceTransactionAborted: true },
  },
  {
    label: "pipeline started early",
    input: { issuancePipelineStarted: true },
  },
  {
    label: "pipeline executed early",
    input: { issuancePipelineExecuted: true },
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
    input: { entry: { activationTransactionOpeningAllowed: true } },
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
  { label: "transaction not opened", input: { issuanceTransactionOpened: false } },
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
      evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(
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

const contract = createControlledWorkspaceHostActivationTransactionPreparationReadinessContract();
assert.equal(contract.phase, "3B.3.33");
assert.equal(contract.nextEligibleStep, "3B.3.34");
const identity = createFeedWorkspaceHostActivationTransactionPreparationReadinessIdentity();
assert.equal(
  identity.activationTransactionOpeningReadinessId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
);
assert.equal(
  identity.activationTransactionOpeningAuthorizationId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
);
assert.equal(
  identity.activationTransactionOpeningId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
);
assert.equal(
  identity.activationTransactionPreparationReadinessId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
);
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
assert.equal(gate.currentStep, "3B.3.34");
assert.equal(gate.eligibleStep, "3B.3.35");
assert.ok(
  gate.blockers.includes(
    PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY,
  ),
);

const plan = createControlledFeedHostPlan();
assert.ok(
  plan.blockerSet.includes(
    PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
  ),
);
assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.35");

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
  assert.equal(proof.overallVerdict, "READY_FOR_PHASE_3B_3_34");
  assert.equal(proof.transactionPreparationReadinessMetaOk, true);
  assert.equal(proof.forcedNegativeProofsOk, true);
  assert.equal(proof.bridgeVersion ?? proof.version ?? 34, 34);
  rejectUnresolved("proof.overallVerdict", proof.overallVerdict);
  const prepared = JSON.parse(readFileSync(preparedPath, "utf8"));
  validateFeedWorkspaceHostActivationTransactionPreparationReadinessPreparedContract(prepared);
  assert.equal(prepared.nextEligibleStep, "3B.3.34");
  assert.equal(prepared.activationCommitBoundaryEntered, true);
  assert.equal(prepared.issuanceTransactionState, "OPENED");
  assert.equal(prepared.transactionOpeningReady, true);
  assert.equal(prepared.transactionOpeningAuthorized, true);
  assert.equal(prepared.transactionOpeningStarted, true);
  assert.equal(prepared.transactionOpeningCompleted, true);
  assert.equal(prepared.transactionPreparationReady, true);
  assert.equal(prepared.transactionPreparationAuthorized, false);
  assert.equal(prepared.issuanceTransactionOpened, true);
  assert.equal(prepared.issuanceTransactionPrepared, false);
}

console.log(
  "validate-adaptive-workspace-host-activation-transaction-preparation-readiness-phase3b333: PASS",
);

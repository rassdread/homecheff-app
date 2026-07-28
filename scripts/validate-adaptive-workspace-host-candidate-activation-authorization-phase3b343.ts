/**
 * Phase 3B.3.43 static validator — controlled workspace host candidate activation authorization.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledWorkspaceHostCandidateActivationAuthorizationDescriptor,
  createControlledWorkspaceHostCandidateActivationAuthorizationContract,
  evaluateControlledWorkspaceHostCandidateActivationAuthorization,
  createFeedWorkspaceHostCandidateActivationAuthorizationIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
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
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_BLOCKERS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedWorkspaceHostCandidateActivationAuthorizationPreparedContract,
  HardContractViolation,
  stableStringify,
} from "../lib/adaptive-workspace";

const root = process.cwd();

const PREDECESSOR_PHASE = "3B.3.42";
const PREDECESSOR_BRANCH =
  "workspace/phase3b342-controlled-workspace-host-candidate-activation-readiness";
const PREDECESSOR_HEAD =
  "a720a4d8f05903c59c0c5ed9dc301d70e6770d4b";
const PREDECESSOR_PROOF_TARGET =
  "6406c509efd5e2993093d168ea30f57e4c73cf52";
const PREDECESSOR_RESULT =
  "controlled-workspace-host-candidate-activation-ready-not-activated";
const PREDECESSOR_LIFECYCLE = "CANDIDATE_ACTIVATION_READY_NOT_ACTIVATED";
const PREDECESSOR_VERDICT = "READY_FOR_PHASE_3B_3_43";

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
  "lib/adaptive-workspace/sealed/controlled-workspace-host-candidate-activation-authorization.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-workspace-host-candidate-activation-authorization-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-candidate-activation-authorization-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-workspace-host-candidate-activation-authorization-prepared.ts",
);
mustExist(
  "scripts/probe-controlled-workspace-host-candidate-activation-authorization-phase3b343.mjs",
);
mustExist(
  "scripts/run-controlled-workspace-host-candidate-activation-authorization-proof-phase3b343.mjs",
);

mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorProofPath = join(
  root,
  "docs/audits/artifacts/phase3b342/phase3b3-42-controlled-workspace-host-candidate-activation-readiness-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b342/phase3b3-42-controlled-workspace-host-candidate-activation-readiness-proof.json",
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
  "docs/audits/artifacts/phase3b343/phase3b3-43-controlled-workspace-host-candidate-activation-authorization-proof.json",
);
const preparedPath = join(
  root,
  "docs/audits/artifacts/phase3b343/phase3b3-43-controlled-workspace-host-candidate-activation-authorization-prepared.json",
);
const auditPath =
  "docs/audits/homecheff-adaptive-workspace-phase3b343-controlled-workspace-host-candidate-activation-authorization.md";
const artifactsPresent = existsSync(proofPath) && existsSync(preparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B343_ARTIFACTS === "1") {
  assert.fail("Phase 3B.3.43 proof/prepared artifacts required but missing");
}
if (artifactsPresent || process.env.REQUIRE_PHASE3B343_ARTIFACTS === "1") {
  mustExist(auditPath);
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.44");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledWorkspaceHostCandidateActivationAuthorizationDescriptor();
assert.equal(descriptor.phase, "3B.3.43");
assert.equal(
  descriptor.candidateActivationAuthorizationResult,
  "controlled-workspace-host-candidate-activation-authorized-not-activated",
);
assert.equal(
  descriptor.candidateActivationAuthorizationState,
  "CANDIDATE_ACTIVATION_AUTHORIZED_NOT_ACTIVATED",
);
assert.equal(descriptor.activationCommitBoundaryState, "ENTERED");
assert.equal(descriptor.activationCommitBoundaryEntered, true);
assert.equal(descriptor.transitionFrom, "NOT_ENTERED");
assert.equal(descriptor.transitionTo, "ENTERED");
assert.equal(descriptor.transitionLegal, true);
assert.equal(descriptor.transactionCommitCount, 1);
assert.equal(descriptor.duplicateTransactionCommitCount, 0);
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
  descriptor.activationTransactionPreparationId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
);
assert.equal(
  descriptor.activationTransactionPreparationContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
);
assert.equal(
  descriptor.activationTransactionCommitReadinessId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID,
);
assert.equal(
  descriptor.activationTransactionCommitReadinessContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID,
);
assert.equal(
  descriptor.activationTransactionCommitAuthorizationId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ID,
);
assert.equal(
  descriptor.activationTransactionCommitAuthorizationContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONTRACT_ID,
);
assert.equal(
  descriptor.activationTransactionCommitId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ID,
);
assert.equal(
  descriptor.activationTransactionCommitContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_CONTRACT_ID,
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
  descriptor.predecessorActivationIssuancePipelineExecutionReadinessState,
  "PIPELINE_EXECUTION_READY_NOT_EXECUTED",
);
assert.equal(
  descriptor.predecessorActivationIssuancePipelineExecutionReadinessResult,
  "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed",
);
assert.equal(
  descriptor.predecessorActivationIssuancePipelineExecutionAuthorizationState,
  "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED",
);
assert.equal(
  descriptor.predecessorActivationIssuancePipelineExecutionAuthorizationResult,
  "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed",
);
assert.equal(
  descriptor.predecessorActivationIssuancePipelineExecutionState,
  "PIPELINE_EXECUTED_NOT_ACTIVATED",
);
assert.equal(
  descriptor.predecessorActivationIssuancePipelineExecutionResult,
  "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated",
);
assert.equal(
  descriptor.candidateActivationAuthorizationState,
  "CANDIDATE_ACTIVATION_AUTHORIZED_NOT_ACTIVATED",
);
assert.equal(
  descriptor.candidateActivationAuthorizationResult,
  "controlled-workspace-host-candidate-activation-authorized-not-activated",
);
assert.equal(descriptor.activationBlocker, "PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY");
assert.equal(PREDECESSOR_LIFECYCLE, "CANDIDATE_ACTIVATION_READY_NOT_ACTIVATED");
assert.equal(PREDECESSOR_RESULT, "controlled-workspace-host-candidate-activation-ready-not-activated");
assert.equal(
  descriptor.predecessorActivationTransactionCommitState,
  "TRANSACTION_COMMITTED_NOT_EXECUTED",
);
assert.equal(
  descriptor.predecessorActivationTransactionCommitResult,
  "controlled-workspace-host-activation-transaction-committed-not-executed",
);
assert.equal(descriptor.transactionOpeningReady, true);
assert.equal(descriptor.transactionOpeningAuthorized, true);
assert.equal(descriptor.transactionOpeningStarted, true);
assert.equal(descriptor.transactionOpeningCompleted, true);
assert.equal(descriptor.transactionPreparationReady, true);
assert.equal(descriptor.transactionPreparationAuthorized, true);
assert.equal(descriptor.transactionCommitReady, true);
assert.equal(descriptor.transactionCommitAuthorized, true);
assert.equal(descriptor.issuanceTransactionCommitted, true);
assert.equal(descriptor.issuancePipelineExecutionReady, true);
assert.equal(descriptor.issuancePipelineExecutionAuthorized, true);
assert.equal(descriptor.issuancePipelineExecuted, true);
assert.equal(descriptor.candidateActivationReady, true);
assert.equal(descriptor.issuancePipelineExecutionAllowed, false);
assert.equal(
  descriptor.activationIssuancePipelineExecutionReadinessId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ID,
);
assert.equal(
  descriptor.activationIssuancePipelineExecutionReadinessContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_CONTRACT_ID,
);
assert.equal(
  descriptor.activationIssuancePipelineExecutionAuthorizationId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ID,
);
assert.equal(
  descriptor.activationIssuancePipelineExecutionAuthorizationContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_CONTRACT_ID,
);
assert.equal(
  descriptor.activationIssuancePipelineExecutionId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ID,
);
assert.equal(
  descriptor.activationIssuancePipelineExecutionContractId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONTRACT_ID,
);
assert.equal(
  descriptor.activationCandidateActivationAuthorizationId,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ID,
);
assert.equal(
  descriptor.activationCandidateActivationAuthorizationContractId,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
);
assert.equal(descriptor.issuanceTransactionAborted, false);
assert.equal(descriptor.issuanceTransactionState, "OPENED");
assert.equal(descriptor.issuancePipelineState, "NON_EXECUTABLE");
assert.equal(descriptor.issuanceCommitBoundaryState, "NOT_ENTERED");
assert.equal(descriptor.issuanceTransactionOpened, true);
assert.equal(descriptor.issuanceTransactionPrepared, true);
assert.equal(descriptor.issuancePipelineExecutable, false);
assert.equal(descriptor.owner, "legacy");
assert.equal(descriptor.writer, "legacy");
assert.equal(descriptor.renderer, "legacy");
assert.equal(descriptor.mountCount, 1);
assert.equal(descriptor.geoFeedRenderCount, 1);
assert.equal(descriptor.shellRendered, false);
assert.equal(descriptor.workspaceHostMounted, false);
assert.equal(descriptor.nextEligibleStep, "3B.3.44");
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
);
assert.deepEqual(
  [...descriptor.conditions],
  [...CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.guards],
  [...CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_GUARDS],
);
assert.equal(descriptor.unsatisfiedConditions.length, 0);
assert.ok(
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_BLOCKERS.includes(
    PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
  ),
);

rejectUnresolved("descriptor.candidateActivationAuthorizationResult", descriptor.candidateActivationAuthorizationResult);
rejectUnresolved("descriptor.activationCommitBoundaryId", descriptor.activationCommitBoundaryId);
rejectUnresolved("PREDECESSOR_PHASE", PREDECESSOR_PHASE);

const evaluation = evaluateControlledWorkspaceHostCandidateActivationAuthorization();
assert.equal(evaluation.diagnostics.activationCommitBoundaryEntered, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.43");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.44");
assert.equal(
  evaluation.diagnostics.predecessorActivationBlocker,
  "PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY",
);
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
    label: "transaction preparation authorization duplicate",
    input: { transactionPreparationReady: false },
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
    input: { transactionPreparationAuthorized: false },
  },
  {
    label: "issuance transaction not prepared",
    input: { issuanceTransactionPrepared: false },
  },
  {
    label: "missing candidateActivationReady",
    input: { candidateActivationReady: false },
  },
  {
    label: "pre-advanced candidateActivationAuthorized",
    input: { candidateActivationAuthorized: true },
  },
  {
    label: "missing candidate activation readiness authorization",
    input: { issuancePipelineExecutionAuthorized: false },
  },
  {
    label: "commit readiness absent",
    input: { transactionCommitReady: false },
  },
  {
    label: "commit authorization absent",
    input: { transactionCommitAuthorized: false },
  },
  {
    label: "duplicate readiness records",
    input: { entryRecords: [{}, {}] },
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
    label: "pipeline executed absent",
    input: { issuancePipelineExecuted: false },
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
    label: "transaction not committed",
    input: { issuanceTransactionCommitted: false },
  },
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
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(
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

const contract = createControlledWorkspaceHostCandidateActivationAuthorizationContract();
assert.equal(contract.phase, "3B.3.43");
assert.equal(contract.nextEligibleStep, "3B.3.44");
const identity = createFeedWorkspaceHostCandidateActivationAuthorizationIdentity();
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
  identity.activationTransactionPreparationId,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
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
assert.equal(gate.currentStep, "3B.3.43");
assert.equal(gate.eligibleStep, "3B.3.44");
assert.ok(
  gate.blockers.includes(
    PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
  ),
);

const plan = createControlledFeedHostPlan();
assert.ok(
  plan.blockerSet.includes(
    PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
  ),
);
assert.equal(
  plan.recommendedNextStep,
  "3B.3.44-controlled-workspace-host-candidate-activation",
);
assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.44");

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
  assert.equal(proof.overallVerdict, "READY_FOR_PHASE_3B_3_44");
  assert.equal(proof.candidateActivationAuthorizedMetaOk, true);
  assert.equal(proof.forcedNegativeProofsOk, true);
  assert.equal(proof.bridgeVersion ?? proof.version ?? 43, 43);
  rejectUnresolved("proof.overallVerdict", proof.overallVerdict);
  const prepared = JSON.parse(readFileSync(preparedPath, "utf8"));
  validateFeedWorkspaceHostCandidateActivationAuthorizationPreparedContract(prepared);
  assert.equal(prepared.nextEligibleStep, "3B.3.44");
  assert.equal(prepared.activationCommitBoundaryEntered, true);
  assert.equal(prepared.issuanceTransactionState, "OPENED");
  assert.equal(prepared.transactionOpeningReady, true);
  assert.equal(prepared.transactionOpeningAuthorized, true);
  assert.equal(prepared.transactionOpeningStarted, true);
  assert.equal(prepared.transactionOpeningCompleted, true);
  assert.equal(prepared.transactionPreparationReady, true);
  assert.equal(prepared.transactionPreparationAuthorized, true);
  assert.equal(prepared.issuanceTransactionCommitted, true);
  assert.equal(prepared.issuanceTransactionOpened, true);
  assert.equal(prepared.issuanceTransactionPrepared, true);
}

console.log(
  "validate-adaptive-workspace-host-candidate-activation-authorization-phase3b343: PASS",
);

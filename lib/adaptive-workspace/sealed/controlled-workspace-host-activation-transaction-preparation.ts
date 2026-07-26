/**
 * Phase 3B.3.35 — Controlled Workspace Host Activation Transaction Preparation
 * (metadata only).
 *
 * Consumes the frozen Phase 3B.3.34 preparation-authorized state to prepare the
 * issuance transaction metadata. Does not commit or abort the transaction, and
 * does not make the issuance pipeline executable.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
} from "./controlled-workspace-host-activation-commit-boundary-entry";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-opening-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-opening";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-opening-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-preparation-readiness";
import {
  PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_CONTRACT_ID,
  evaluateControlledWorkspaceHostActivationTransactionPreparationAuthorization as evaluatePredecessorPreparationAuthorization,
} from "./controlled-workspace-host-activation-transaction-preparation-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
} from "./controlled-workspace-host-activation-grant-issuance";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID } from "./controlled-workspace-host-activation-authorization";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID } from "./controlled-workspace-host-activation-readiness";
import { CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID } from "./controlled-workspace-host-candidate-selection";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
} from "./controlled-workspace-host-candidate-registration";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ID,
} from "./controlled-host-activation-transition-authorization-grant-issuance-transaction";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ID,
} from "./controlled-host-activation-transition-authorization-grant-issuance-pipeline";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY =
  "PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY" as const;



export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID =
  "feed.discovery.adaptive-workspace.host-activation-transaction-preparation.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-activation-transaction-preparation.contract.v1" as const;


export type ControlledWorkspaceHostActivationTransactionPreparationState =
  | "TRANSACTION_PREPARED_NOT_COMMITTED"
  | "BLOCKED";

export type ControlledWorkspaceHostActivationTransactionPreparationResult =
  | "controlled-workspace-host-activation-transaction-prepared-not-committed"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-missing-readiness"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-missing-preparation-readiness"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-duplicate-preparation"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-predecessor"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-grant-issuance"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-readiness"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-selection"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-candidate"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-contract"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-duplicate-entry"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-boundary-executable"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-runtime-capability"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-runtime-host"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-activation-handle"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-workspace-render"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-second-geofeed"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-runtime-mutation"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-shell"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-ownership"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-renderer"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-writer"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-pipeline"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-transaction"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-armed"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-crossed"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-committed"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-aborted"
  | "controlled-workspace-host-activation-transaction-preparation-blocked-illegal-transition";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_BLOCKERS =
  Object.freeze([
    "PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY",
    "PHASE_3B3_31_METADATA_ONLY",
    "PHASE_3B3_31_ACTIVATION_FORBIDDEN",
    "PHASE_3B3_31_ACTIVE_STATE_FORBIDDEN",
    "PHASE_3B3_31_EXECUTION_FORBIDDEN",
    "PHASE_3B3_31_BOUNDARY_EXECUTION_FORBIDDEN",
    "PHASE_3B3_31_BOUNDARY_MUTATION_FORBIDDEN",
    "PHASE_3B3_31_BOUNDARY_DUPLICATION_FORBIDDEN",
    "PHASE_3B3_31_SECOND_ENTRY_FORBIDDEN",
    "PHASE_3B3_31_RUNTIME_HOST_FORBIDDEN",
    "PHASE_3B3_31_HOST_INSTANCE_FORBIDDEN",
    "PHASE_3B3_31_RUNTIME_CAPABILITY_FORBIDDEN",
    "PHASE_3B3_31_ACTIVATION_HANDLE_FORBIDDEN",
    "PHASE_3B3_31_AUTHORITY_HANDLE_FORBIDDEN",
    "PHASE_3B3_31_CREDENTIAL_FORBIDDEN",
    "PHASE_3B3_31_TOKEN_FORBIDDEN",
    "PHASE_3B3_31_CERTIFICATE_FORBIDDEN",
    "PHASE_3B3_31_PERMIT_FORBIDDEN",
    "PHASE_3B3_31_COMMAND_FORBIDDEN",
    "PHASE_3B3_31_CALLBACK_FORBIDDEN",
    "PHASE_3B3_31_DISPATCHER_FORBIDDEN",
    "PHASE_3B3_31_QUEUE_FORBIDDEN",
    "PHASE_3B3_31_SCHEDULER_FORBIDDEN",
    "PHASE_3B3_31_EXECUTOR_FORBIDDEN",
    "PHASE_3B3_31_PROVIDER_FORBIDDEN",
    "PHASE_3B3_31_SERVICE_FORBIDDEN",
    "PHASE_3B3_31_COORDINATOR_FORBIDDEN",
    "PHASE_3B3_31_RUNTIME_REGISTRY_FORBIDDEN",
    "PHASE_3B3_31_MUTABLE_REGISTRY_FORBIDDEN",
    "PHASE_3B3_31_BOUNDARY_ARM_FORBIDDEN",
    "PHASE_3B3_31_BOUNDARY_CROSS_FORBIDDEN",
    "PHASE_3B3_31_BOUNDARY_COMMIT_FORBIDDEN",
    "PHASE_3B3_31_BOUNDARY_ABORT_FORBIDDEN",
    "PHASE_3B3_31_TRANSACTION_OPEN_FORBIDDEN",
    "PHASE_3B3_31_PIPELINE_EXECUTION_FORBIDDEN",
    "PHASE_3B3_31_OWNERSHIP_TRANSFER_FORBIDDEN",
    "PHASE_3B3_31_WRITER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_31_RENDERER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_31_RUNTIME_ADOPTION_FORBIDDEN",
    "PHASE_3B3_31_GEOFEED_RELOCATION_FORBIDDEN",
    "PHASE_3B3_31_SECOND_GEOFEED_FORBIDDEN",
    "PHASE_3B3_31_GEOFEED_WRAP_FORBIDDEN",
    "PHASE_3B3_31_GEOFEED_CLONE_FORBIDDEN",
    "PHASE_3B3_31_WORKSPACE_RENDER_FORBIDDEN",
    "PHASE_3B3_31_WORKSPACE_MOUNT_FORBIDDEN",
    "PHASE_3B3_31_WORKSPACE_REACT_INSTANCE_FORBIDDEN",
    "PHASE_3B3_31_VISIBLE_UI_FORBIDDEN",
    "PHASE_3B3_31_DOM_MUTATION_FORBIDDEN",
    "PHASE_3B3_31_RUNTIME_MUTATION_FORBIDDEN",
    "PHASE_3B3_31_REQUEST_MUTATION_FORBIDDEN",
    "PHASE_3B3_31_CACHE_MUTATION_FORBIDDEN",
    "PHASE_3B3_31_OBSERVER_MUTATION_FORBIDDEN",
    "PHASE_3B3_31_NETWORK_FORBIDDEN",
    "PHASE_3B3_31_PERSISTENCE_FORBIDDEN",
    "PHASE_3B3_31_DATE_DEPENDENCY_FORBIDDEN",
    "PHASE_3B3_31_RANDOMNESS_FORBIDDEN",
    "PHASE_3B3_31_ILLEGAL_TRANSITION_FORBIDDEN",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONDITIONS =
  Object.freeze([
    "phase-3b334-active",
    "previous-phase-3b333-complete",
    "next-eligible-step-3b335",
    "transaction-preparation-result-exact",
    "transaction-preparation-state-exact",
    "candidate-identity-exact",
    "registration-identity-exact",
    "selection-identity-exact",
    "activation-readiness-identity-exact",
    "activation-authorization-identity-exact",
    "activation-grant-identity-exact",
    "activation-grant-contract-identity-exact",
    "activation-grant-issuance-identity-exact",
    "activation-grant-issuance-contract-identity-exact",
    "activation-commit-boundary-identity-exact",
    "activation-commit-boundary-contract-identity-exact",
    "activation-transaction-opening-identity-exact",
    "activation-transaction-opening-contract-identity-exact",
    "controlled-host-identity-preserved",
    "legacy-runtime-identity-preserved",
    "exactly-one-candidate",
    "exactly-one-registered-candidate",
    "exactly-one-selected-candidate",
    "exactly-one-ready-candidate",
    "exactly-one-authorized-candidate",
    "exactly-one-granted-candidate",
    "exactly-one-grant",
    "exactly-one-transaction-opening",
    "exactly-one-future-activation-target",
    "active-candidate-count-zero",
    "activated-candidate-count-zero",
    "executable-candidate-count-zero",
    "executable-grant-count-zero",
    "executable-boundary-count-zero",
    "candidate-identity-unique",
    "registration-identity-unique",
    "selection-identity-unique",
    "readiness-identity-unique",
    "authorization-identity-unique",
    "grant-identity-unique",
    "grant-issuance-identity-unique",
    "commit-boundary-identity-unique",
    "transaction-opening-identity-unique",
    "candidate-structurally-compatible",
    "candidate-deterministic",
    "candidate-immutable",
    "grant-deterministic",
    "grant-immutable",
    "grant-sealed",
    "grant-unique",
    "grant-non-executable",
    "commit-boundary-deterministic",
    "commit-boundary-immutable",
    "commit-boundary-sealed",
    "commit-boundary-unique",
    "commit-boundary-non-executable",
    "candidate-selected",
    "candidate-ready",
    "candidate-authorized",
    "candidate-granted",
    "candidate-not-activated",
    "candidate-not-active",
    "candidate-not-executable",
    "candidate-not-visible",
    "candidate-not-rendering",
    "candidate-not-hosting",
    "grant-present",
    "grant-issued",
    "grant-valid",
    "commit-boundary-present",
    "commit-boundary-entered",
    "commit-boundary-valid",
    "commit-boundary-not-armed",
    "commit-boundary-not-crossed",
    "commit-boundary-not-committed",
    "commit-boundary-not-aborted",
    "transition-recorded",
    "transition-legal",
    "transition-from-not-entered",
    "transition-to-entered",
    "future-grant-possible",
    "future-grant-issued",
    "future-activation-possible",
    "future-activation-authorized",
    "future-activation-not-started",
    "activation-execution-not-allowed",
    "transaction-opening-not-allowed-after-entry",
    "runtime-capability-absent",
    "runtime-host-instance-absent",
    "activation-handle-absent",
    "token-absent",
    "credential-absent",
    "certificate-absent",
    "permit-absent",
    "callback-absent",
    "command-absent",
    "dispatcher-absent",
    "scheduler-absent",
    "queue-absent",
    "executor-absent",
    "provider-absent",
    "service-absent",
    "coordinator-absent",
    "ownership-capability-absent",
    "writer-capability-absent",
    "renderer-capability-absent",
    "runtime-adoption-absent",
    "workspace-shell-null",
    "workspace-children-zero",
    "workspace-dom-nodes-zero",
    "geofeed-mount-count-one",
    "geofeed-render-count-one",
    "geofeed-wrapper-absent",
    "geofeed-clone-absent",
    "geofeed-relocation-absent",
    "owner-legacy",
    "writer-legacy",
    "renderer-legacy",
    "mount-count-one",
    "unmount-count-zero",
    "active-runtime-instance-one",
    "issuance-commit-boundary-frozen-not-entered",
    "issuance-transaction-not-opened",
    "issuance-pipeline-non-executable",
    "predecessor-grant-issuance-result-exact",
    "predecessor-grant-issuance-state-exact",
    "production-runtime-unchanged",
    "output-serializable",
    "ordering-deterministic",
    "blocker-inventory-complete",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_GUARDS =
  Object.freeze([
    "predecessor-exactness",
    "candidate-identity-exactness",
    "registration-identity-exactness",
    "selection-identity-exactness",
    "activation-readiness-identity-exactness",
    "activation-authorization-identity-exactness",
    "activation-grant-identity-exactness",
    "activation-grant-issuance-identity-exactness",
    "activation-commit-boundary-identity-exactness",
    "activation-transaction-opening-identity-exactness",
    "candidate-uniqueness",
    "grant-uniqueness",
    "commit-boundary-uniqueness",
    "transaction-opening-uniqueness",
    "future-activation-target-uniqueness",
    "candidate-selected",
    "candidate-ready",
    "candidate-authorized",
    "candidate-granted",
    "candidate-inactive",
    "candidate-unactivated",
    "candidate-non-executable",
    "grant-sealed",
    "grant-immutable",
    "grant-non-executable",
    "commit-boundary-sealed",
    "commit-boundary-immutable",
    "commit-boundary-non-executable",
    "commit-boundary-not-armed-beyond-entry",
    "commit-boundary-not-crossed",
    "commit-boundary-not-committed",
    "commit-boundary-not-aborted",
    "transition-legality",
    "runtime-capability-absent",
    "runtime-host-absent",
    "activation-handle-absent",
    "null-workspace-shell",
    "single-geofeed",
    "legacy-runtime-ownership",
    "legacy-writer",
    "legacy-renderer",
    "stable-mount",
    "issuance-commit-boundary-preserved",
    "issuance-transaction-preserved",
    "issuance-pipeline-preserved",
    "serializable-output",
    "stable-ordering",
    "mandatory-blockers-present",
  ] as const);

export type ControlledWorkspaceHostActivationTransactionPreparationRecord = {
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  readonly activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  readonly activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  readonly activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  readonly activationGrantIssuanceContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID;
  readonly activationCommitBoundaryId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID;
  readonly activationCommitBoundaryContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_CONTRACT_ID;
  readonly activationTransactionOpeningReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID;
  readonly activationTransactionOpeningReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID;
  readonly activationTransactionOpeningAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID;
  readonly activationTransactionOpeningAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID;
  readonly activationTransactionOpeningId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID;
  readonly activationTransactionOpeningContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID;
  readonly activationTransactionPreparationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID;
  readonly activationTransactionPreparationReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID;
  readonly activationTransactionPreparationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID;
  readonly activationTransactionPreparationAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_CONTRACT_ID;
  readonly activationTransactionPreparationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID;
  readonly activationTransactionPreparationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID;
  readonly candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  readonly candidateLabel: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly activeRuntimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly selected: true;
  readonly ready: true;
  readonly authorized: true;
  readonly granted: true;
  readonly activated: false;
  readonly active: false;
  readonly visible: false;
  readonly rendering: false;
  readonly hosting: false;
  readonly executable: false;
  readonly grantPresent: true;
  readonly grantIssued: true;
  readonly grantValid: true;
  readonly grantImmutable: true;
  readonly grantUnique: true;
  readonly grantExecutable: false;
  readonly commitBoundaryEntered: true;
  readonly commitBoundaryArmed: false;
  readonly commitBoundaryCrossed: false;
  readonly commitBoundaryCommitted: false;
  readonly commitBoundaryAborted: false;
  readonly commitBoundaryExecutable: false;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly activationHandlePresent: false;
  readonly tokenPresent: false;
  readonly credentialPresent: false;
  readonly certificatePresent: false;
  readonly permitPresent: false;
  readonly callbackPresent: false;
  readonly commandPresent: false;
  readonly executorPresent: false;
  readonly providerPresent: false;
  readonly servicePresent: false;
  readonly dispatcherPresent: false;
  readonly schedulerPresent: false;
  readonly queuePresent: false;
  readonly coordinatorPresent: false;
  readonly activationTransactionOpeningAllowed: false;
  readonly activationExecutionAllowed: false;
  readonly transactionOpenAllowed: false;
  readonly pipelineExecutionAllowed: false;
  readonly runtimeAdoptionAllowed: false;
  readonly ownershipTransferAllowed: false;
  readonly writerTransferAllowed: false;
  readonly rendererTransferAllowed: false;
  readonly futureGrantPossible: true;
  readonly futureGrantIssued: true;
  readonly futureActivationPossible: true;
  readonly futureActivationAuthorized: true;
  readonly futureActivationStarted: false;
  readonly owner: "none";
  readonly writer: "none";
  readonly renderer: "none";
  readonly mountsGeoFeed: false;
  readonly containsGeoFeed: false;
  readonly wrapsGeoFeed: false;
  readonly duplicatesGeoFeed: false;
  readonly createsSecondGeoFeed: false;
  readonly shellRendered: false;
  readonly shellChildCount: 0;
  readonly shellDOMNodeCount: 0;
  readonly candidateStructurallyCompatible: true;
};

export type ControlledWorkspaceHostActivationTransactionPreparationDescriptor = {
  readonly schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_SCHEMA_VERSION;
  readonly phase: "3B.3.35";
  readonly previousPhase: "3B.3.34";
  readonly currentPhase: "3B.3.35";
  readonly nextEligibleStep: "3B.3.36";
  readonly activationCommitBoundaryId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID;
  readonly activationCommitBoundaryContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_CONTRACT_ID;
  readonly activationTransactionOpeningReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID;
  readonly activationTransactionOpeningReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID;
  readonly activationTransactionOpeningAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID;
  readonly activationTransactionOpeningAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID;
  readonly activationTransactionOpeningId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID;
  readonly activationTransactionOpeningContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID;
  readonly activationTransactionPreparationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID;
  readonly activationTransactionPreparationReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID;
  readonly activationTransactionPreparationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID;
  readonly activationTransactionPreparationAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_CONTRACT_ID;
  readonly activationTransactionPreparationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID;
  readonly activationTransactionPreparationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID;
  readonly activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  readonly activationGrantContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_CONTRACT_ID;
  readonly activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  readonly activationGrantIssuanceContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID;
  readonly activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  readonly activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly transactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
  readonly transactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
  readonly transactionOpeningReady: true;
  readonly transactionOpeningAuthorized: true;
  readonly transactionOpeningStarted: true;
  readonly transactionOpeningCompleted: true;
  readonly transactionPreparationReady: true;
  readonly transactionPreparationAuthorized: true;
  readonly issuancePipelineState: "NON_EXECUTABLE";
  readonly activationCommitBoundaryEntered: true;
  readonly activationCommitBoundaryState: "ENTERED";
  readonly activationCommitBoundaryArmed: false;
  readonly activationCommitBoundaryCrossed: false;
  readonly activationCommitBoundaryCommitted: false;
  readonly activationCommitBoundaryAborted: false;
  readonly activationCommitBoundaryExecutable: false;
  readonly activationCommitBoundaryBlocked: true;
  readonly activationTransactionOpeningAllowed: false;
  readonly activationExecutionAllowed: false;
  readonly transitionFrom: "NOT_ENTERED";
  readonly transitionTo: "ENTERED";
  readonly transitionLegal: true;
  readonly candidateSelected: true;
  readonly candidateReady: true;
  readonly candidateAuthorized: true;
  readonly candidateGranted: true;
  readonly candidateActivated: false;
  readonly candidateActive: false;
  readonly candidateExecutable: false;
  readonly grantPresent: true;
  readonly grantIssued: true;
  readonly grantValid: true;
  readonly grantImmutable: true;
  readonly grantUnique: true;
  readonly grantExecutable: false;
  readonly futureGrantPossible: true;
  readonly futureGrantIssued: true;
  readonly futureActivationPossible: true;
  readonly futureActivationAuthorized: true;
  readonly futureActivationStarted: false;
  readonly candidateCount: 1;
  readonly registeredCandidateCount: 1;
  readonly selectedCandidateCount: 1;
  readonly readyCandidateCount: 1;
  readonly authorizedCandidateCount: 1;
  readonly grantedCandidateCount: 1;
  readonly grantCount: 1;
  readonly transactionPreparationCount: 1;
  readonly futureActivationTargetCount: 1;
  readonly activeCandidateCount: 0;
  readonly activatedCandidateCount: 0;
  readonly executableCandidateCount: 0;
  readonly executableGrantCount: 0;
  readonly executableBoundaryCount: 0;
  readonly invalidCandidateCount: 0;
  readonly duplicateCandidateCount: 0;
  readonly duplicateGrantCount: 0;
  readonly duplicateTransactionPreparationCount: 0;
  readonly candidateIdentityUnique: true;
  readonly selectionIdentityUnique: true;
  readonly registrationIdentityUnique: true;
  readonly activationReadinessIdentityUnique: true;
  readonly activationAuthorizationIdentityUnique: true;
  readonly activationGrantIdentityUnique: true;
  readonly activationGrantIssuanceIdentityUnique: true;
  readonly activationCommitBoundaryIdentityUnique: true;
  readonly activationTransactionOpeningReadinessIdentityUnique: true;
  readonly activationTransactionOpeningAuthorizationIdentityUnique: true;
  readonly activationTransactionPreparationIdentityUnique: true;
  readonly candidateStructurallyCompatible: true;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly activationHandlePresent: false;
  readonly executionHandlePresent: false;
  readonly tokenPresent: false;
  readonly credentialPresent: false;
  readonly certificatePresent: false;
  readonly permitPresent: false;
  readonly transactionPreparationRecords: readonly [ControlledWorkspaceHostActivationTransactionPreparationRecord];
  readonly predecessorActivationTransactionPreparationAuthorizationResult: "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared";
  readonly predecessorActivationTransactionPreparationAuthorizationState: "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED";
  readonly predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
  readonly predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
  readonly predecessorCandidateGranted: true;
  readonly predecessorCandidateActivated: false;
  readonly issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
  readonly issuanceCommitBoundaryState: "NOT_ENTERED";
  readonly issuanceCommitBoundaryEntered: false;
  readonly issuanceCommitBoundaryArmed: false;
  readonly issuanceBoundaryCrossed: false;
  readonly issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
  readonly issuanceTransactionState: "OPENED";
  readonly issuanceTransactionOpened: true;
  readonly issuanceTransactionPrepared: true;
  readonly issuanceTransactionCommitted: false;
  readonly issuanceTransactionAborted: false;
  readonly issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
  readonly issuancePipelineExecutable: false;
  readonly issuancePipelineExecutionAllowed: false;
  readonly owner: "legacy";
  readonly writer: "legacy";
  readonly renderer: "legacy";
  readonly mountCount: 1;
  readonly unmountCount: 0;
  readonly activeInstanceCount: 1;
  readonly geoFeedRenderCount: 1;
  readonly shellRendered: false;
  readonly shellChildCount: 0;
  readonly shellDOMNodeCount: 0;
  readonly workspaceVisible: false;
  readonly workspaceHostMounted: false;
  readonly workspaceCandidateRendered: false;
  readonly workspaceCandidateDOMPresent: false;
  readonly workspaceCandidateReactInstancePresent: false;
  readonly hostActivation: false;
  readonly renderActivation: false;
  readonly canStartActivation: false;
  readonly activationBlocker: typeof PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY;
  readonly conditions: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONDITIONS;
  readonly unsatisfiedConditions: readonly [];
  readonly guards: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_GUARDS;
  readonly unsatisfiedGuards: readonly [];
  readonly blockers: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_BLOCKERS;
  readonly browserInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
};

export type ControlledWorkspaceHostActivationTransactionPreparationDiagnostics = {
  readonly [key: string]: unknown;
};

export type ControlledWorkspaceHostActivationTransactionPreparationEvaluation = {
  readonly descriptor: ControlledWorkspaceHostActivationTransactionPreparationDescriptor;
  readonly diagnostics: ControlledWorkspaceHostActivationTransactionPreparationDiagnostics;
};

export type ControlledWorkspaceHostActivationTransactionPreparationInput = {
  readonly entry?: Partial<ControlledWorkspaceHostActivationTransactionPreparationRecord> &
    Record<string, unknown>;
  readonly entryRecords?: readonly Record<string, unknown>[];
  readonly candidates?: readonly Record<string, unknown>[];
  readonly selections?: readonly Record<string, unknown>[];
  readonly owner?: string;
  readonly writer?: string;
  readonly renderer?: string;
  readonly mountCount?: number;
  readonly unmountCount?: number;
  readonly activeInstanceCount?: number;
  readonly geoFeedRenderCount?: number;
  readonly shellRendered?: boolean;
  readonly shellChildCount?: number;
  readonly shellDOMNodeCount?: number;
  readonly grantIssuanceResult?: string;
  readonly grantIssuanceState?: string;
  readonly commitBoundaryEntryResult?: string;
  readonly commitBoundaryEntryState?: string;
  readonly activationCommitBoundaryState?: string;
  readonly activationCommitBoundaryEntered?: boolean;
  readonly issuanceTransactionPrepared?: boolean;
  readonly issuanceTransactionCommitted?: boolean;
  readonly issuanceTransactionAborted?: boolean;
  readonly transactionOpeningReady?: boolean;
  readonly transactionOpeningAuthorized?: boolean;
  readonly transactionOpeningStarted?: boolean;
  readonly transactionOpeningCompleted?: boolean;
  readonly transactionPreparationReady?: boolean;
  readonly transactionPreparationAuthorized?: boolean;
  readonly issuancePipelineStarted?: boolean;
  readonly issuancePipelineExecuted?: boolean;
  readonly candidateGranted?: boolean;
  readonly candidateActivated?: boolean;
  readonly issuanceCommitBoundaryState?: string;
  readonly issuanceCommitBoundaryEntered?: boolean;
  readonly issuanceCommitBoundaryArmed?: boolean;
  readonly issuanceBoundaryCrossed?: boolean;
  readonly issuanceTransactionState?: string;
  readonly issuanceTransactionOpened?: boolean;
  readonly issuancePipelineExecutable?: boolean;
  readonly activationCommitBoundaryArmed?: boolean;
  readonly activationCommitBoundaryCrossed?: boolean;
  readonly activationCommitBoundaryCommitted?: boolean;
  readonly activationCommitBoundaryAborted?: boolean;
  readonly transitionFrom?: string;
  readonly transitionTo?: string;
};

function createPreparationRecord(): ControlledWorkspaceHostActivationTransactionPreparationRecord {
  return Object.freeze({
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
    activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
    activationGrantIssuanceContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
    activationCommitBoundaryId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
    activationCommitBoundaryContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_CONTRACT_ID,
    activationTransactionOpeningReadinessId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
    activationTransactionOpeningReadinessContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID,
    activationTransactionOpeningAuthorizationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
    activationTransactionOpeningAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
    activationTransactionOpeningId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
    activationTransactionOpeningContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
    activationTransactionPreparationReadinessId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
    activationTransactionPreparationReadinessContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID,
    activationTransactionPreparationAuthorizationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
    activationTransactionPreparationAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_CONTRACT_ID,
    activationTransactionPreparationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
    activationTransactionPreparationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    candidateLabel: CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    activeRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    selected: true,
    ready: true,
    authorized: true,
    granted: true,
    activated: false,
    active: false,
    visible: false,
    rendering: false,
    hosting: false,
    executable: false,
    grantPresent: true,
    grantIssued: true,
    grantValid: true,
    grantImmutable: true,
    grantUnique: true,
    grantExecutable: false,
    commitBoundaryEntered: true,
    commitBoundaryArmed: false,
    commitBoundaryCrossed: false,
    commitBoundaryCommitted: false,
    commitBoundaryAborted: false,
    commitBoundaryExecutable: false,
    runtimeCapabilityPresent: false,
    runtimeHostInstancePresent: false,
    activationHandlePresent: false,
    tokenPresent: false,
    credentialPresent: false,
    certificatePresent: false,
    permitPresent: false,
    callbackPresent: false,
    commandPresent: false,
    executorPresent: false,
    providerPresent: false,
    servicePresent: false,
    dispatcherPresent: false,
    schedulerPresent: false,
    queuePresent: false,
    coordinatorPresent: false,
    activationTransactionOpeningAllowed: false,
    activationExecutionAllowed: false,
    transactionOpenAllowed: false,
    pipelineExecutionAllowed: false,
    runtimeAdoptionAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    futureGrantPossible: true,
    futureGrantIssued: true,
    futureActivationPossible: true,
    futureActivationAuthorized: true,
    futureActivationStarted: false,
    owner: "none",
    writer: "none",
    renderer: "none",
    mountsGeoFeed: false,
    containsGeoFeed: false,
    wrapsGeoFeed: false,
    duplicatesGeoFeed: false,
    createsSecondGeoFeed: false,
    shellRendered: false,
    shellChildCount: 0,
    shellDOMNodeCount: 0,
    candidateStructurallyCompatible: true,
  });
}

function blockedResultFor(
  input: ControlledWorkspaceHostActivationTransactionPreparationInput | undefined,
): ControlledWorkspaceHostActivationTransactionPreparationResult | null {
  if (!input) return null;

  if (
    input.commitBoundaryEntryState !== undefined &&
    input.commitBoundaryEntryState !== "COMMIT_BOUNDARY_ENTERED"
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-predecessor";
  }
  if (
    input.commitBoundaryEntryResult !== undefined &&
    input.commitBoundaryEntryResult !==
      "controlled-workspace-host-activation-commit-boundary-entered"
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-predecessor";
  }
  if (
    input.activationCommitBoundaryState !== undefined &&
    input.activationCommitBoundaryState !== "ENTERED"
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-predecessor";
  }
  if (input.candidateGranted === false) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-grant-issuance";
  }
  if (input.candidateActivated === true) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-candidate";
  }

  if (
    input.issuanceCommitBoundaryState !== undefined &&
    input.issuanceCommitBoundaryState !== "NOT_ENTERED"
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-transaction";
  }
  if (
    input.issuanceCommitBoundaryEntered === true ||
    input.issuanceCommitBoundaryArmed === true ||
    input.issuanceBoundaryCrossed === true
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-predecessor";
  }
  if (
    input.issuanceTransactionState !== undefined &&
    input.issuanceTransactionState !== "OPENED"
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-transaction";
  }
  if (input.issuanceTransactionOpened === false) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-transaction";
  }
  if (input.issuancePipelineExecutable === true) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-pipeline";
  }
  if (input.issuancePipelineStarted === true || input.issuancePipelineExecuted === true) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-pipeline";
  }
  if (
    input.issuanceTransactionPrepared === true ||
    input.issuanceTransactionCommitted === true ||
    input.issuanceTransactionAborted === true
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-transaction";
  }
  if (input.transactionOpeningReady === false) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-missing-readiness";
  }
  if (input.transactionOpeningAuthorized === false) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-missing-preparation-readiness";
  }
  if (input.transactionPreparationReady === false) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-missing-preparation-readiness";
  }
  if (input.transactionPreparationAuthorized === false) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-duplicate-preparation";
  }
  if (
    input.transactionOpeningStarted === false ||
    input.transactionOpeningCompleted === false
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-predecessor";
  }

  if (input.activationCommitBoundaryArmed === true) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-armed";
  }
  if (input.activationCommitBoundaryCrossed === true) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-crossed";
  }
  if (input.activationCommitBoundaryCommitted === true) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-committed";
  }
  if (input.activationCommitBoundaryAborted === true) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-aborted";
  }

  if (
    input.transitionFrom !== undefined &&
    input.transitionFrom !== "NOT_ENTERED"
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-illegal-transition";
  }
  if (input.transitionTo !== undefined && input.transitionTo !== "ENTERED") {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-illegal-transition";
  }

  if (input.candidates && input.candidates.length !== 1) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-candidate";
  }
  if (input.selections && input.selections.length !== 1) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-selection";
  }
  if (input.entryRecords && input.entryRecords.length !== 1) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-duplicate-entry";
  }

  const r = input.entry;
  if (r) {
    if (
      (r.candidateId !== undefined &&
        r.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID) ||
      (r.registrationId !== undefined &&
        r.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID) ||
      (r.selectionId !== undefined &&
        r.selectionId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID) ||
      (r.activationReadinessId !== undefined &&
        r.activationReadinessId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID) ||
      (r.activationAuthorizationId !== undefined &&
        r.activationAuthorizationId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID)
    ) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-candidate";
    }
    if (
      r.activationCommitBoundaryId !== undefined &&
      r.activationCommitBoundaryId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID
    ) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-contract";
    }
    if (r.granted === false || r.grantPresent === false) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-grant-issuance";
    }
    if (r.grantExecutable === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-boundary-executable";
    }
    if (r.commitBoundaryExecutable === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-boundary-executable";
    }
    if (r.commitBoundaryArmed === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-armed";
    }
    if (r.commitBoundaryCrossed === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-crossed";
    }
    if (r.commitBoundaryCommitted === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-committed";
    }
    if (r.commitBoundaryAborted === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-aborted";
    }
    if (r.activated === true || r.active === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-invalid-candidate";
    }
    if (r.runtimeCapabilityPresent === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-runtime-capability";
    }
    if (r.runtimeHostInstancePresent === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-runtime-host";
    }
    if (r.activationHandlePresent === true) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-activation-handle";
    }
    if (
      r.callbackPresent === true ||
      r.commandPresent === true ||
      r.executorPresent === true ||
      r.providerPresent === true ||
      r.servicePresent === true ||
      r.dispatcherPresent === true ||
      r.schedulerPresent === true ||
      r.queuePresent === true ||
      r.coordinatorPresent === true
    ) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-runtime-capability";
    }
    if (
      r.visible === true ||
      r.rendering === true ||
      r.hosting === true ||
      r.shellRendered === true
    ) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-workspace-render";
    }
    if (
      (typeof r.shellChildCount === "number" && r.shellChildCount !== 0) ||
      (typeof r.shellDOMNodeCount === "number" && r.shellDOMNodeCount !== 0)
    ) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-shell";
    }
    if (
      r.mountsGeoFeed === true ||
      r.containsGeoFeed === true ||
      r.wrapsGeoFeed === true ||
      r.duplicatesGeoFeed === true ||
      r.createsSecondGeoFeed === true
    ) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-second-geofeed";
    }
    if (
      r.runtimeAdoptionAllowed === true ||
      r.ownershipTransferAllowed === true ||
      r.writerTransferAllowed === true ||
      r.rendererTransferAllowed === true ||
      r.activationTransactionOpeningAllowed === true ||
      r.activationExecutionAllowed === true
    ) {
      return "controlled-workspace-host-activation-transaction-preparation-blocked-runtime-mutation";
    }
  }

  if (input.owner !== undefined && input.owner !== "legacy") {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-ownership";
  }
  if (input.writer !== undefined && input.writer !== "legacy") {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-writer";
  }
  if (input.renderer !== undefined && input.renderer !== "legacy") {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-renderer";
  }
  if (
    (input.mountCount !== undefined && input.mountCount !== 1) ||
    (input.unmountCount !== undefined && input.unmountCount !== 0) ||
    (input.activeInstanceCount !== undefined &&
      input.activeInstanceCount !== 1) ||
    (input.geoFeedRenderCount !== undefined && input.geoFeedRenderCount !== 1)
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-second-geofeed";
  }
  if (
    input.shellRendered === true ||
    (input.shellChildCount !== undefined && input.shellChildCount !== 0) ||
    (input.shellDOMNodeCount !== undefined && input.shellDOMNodeCount !== 0)
  ) {
    return "controlled-workspace-host-activation-transaction-preparation-blocked-shell";
  }

  return null;
}

export function createControlledWorkspaceHostActivationTransactionPreparationDescriptor(): ControlledWorkspaceHostActivationTransactionPreparationDescriptor {
  const record = createPreparationRecord();
  return validateControlledWorkspaceHostActivationTransactionPreparationDescriptor(
    {
      schemaVersion:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_SCHEMA_VERSION,
      phase: "3B.3.35",
      previousPhase: "3B.3.34",
      currentPhase: "3B.3.35",
      nextEligibleStep: "3B.3.36",
      activationCommitBoundaryId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
      activationCommitBoundaryContractId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_CONTRACT_ID,
      activationTransactionOpeningReadinessId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
      activationTransactionOpeningReadinessContractId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID,
      activationTransactionOpeningAuthorizationId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
      activationTransactionOpeningAuthorizationContractId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
      activationTransactionOpeningId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
      activationTransactionOpeningContractId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
      activationTransactionPreparationReadinessId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
      activationTransactionPreparationReadinessContractId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID,
      activationTransactionPreparationAuthorizationId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
      activationTransactionPreparationAuthorizationContractId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_CONTRACT_ID,
      activationTransactionPreparationId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
      activationTransactionPreparationContractId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
      activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
      activationGrantContractId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_CONTRACT_ID,
      activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
      activationGrantIssuanceContractId:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
      activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
      activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
      candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
      registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
      selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
      hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
      runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
      transactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED",
      transactionPreparationResult:
        "controlled-workspace-host-activation-transaction-prepared-not-committed",
      transactionOpeningReady: true,
      transactionOpeningAuthorized: true,
      transactionOpeningStarted: true,
      transactionOpeningCompleted: true,
      transactionPreparationReady: true,
      transactionPreparationAuthorized: true,
      issuancePipelineState: "NON_EXECUTABLE" as const,
      activationCommitBoundaryEntered: true,
      activationCommitBoundaryState: "ENTERED",
      activationCommitBoundaryArmed: false,
      activationCommitBoundaryCrossed: false,
      activationCommitBoundaryCommitted: false,
      activationCommitBoundaryAborted: false,
      activationCommitBoundaryExecutable: false,
      activationCommitBoundaryBlocked: true,
      activationTransactionOpeningAllowed: false,
      activationExecutionAllowed: false,
      transitionFrom: "NOT_ENTERED",
      transitionTo: "ENTERED",
      transitionLegal: true,
      candidateSelected: true,
      candidateReady: true,
      candidateAuthorized: true,
      candidateGranted: true,
      candidateActivated: false,
      candidateActive: false,
      candidateExecutable: false,
      grantPresent: true,
      grantIssued: true,
      grantValid: true,
      grantImmutable: true,
      grantUnique: true,
      grantExecutable: false,
      futureGrantPossible: true,
      futureGrantIssued: true,
      futureActivationPossible: true,
      futureActivationAuthorized: true,
      futureActivationStarted: false,
      candidateCount: 1,
      registeredCandidateCount: 1,
      selectedCandidateCount: 1,
      readyCandidateCount: 1,
      authorizedCandidateCount: 1,
      grantedCandidateCount: 1,
      grantCount: 1,
      transactionPreparationCount: 1,
      futureActivationTargetCount: 1,
      activeCandidateCount: 0,
      activatedCandidateCount: 0,
      executableCandidateCount: 0,
      executableGrantCount: 0,
      executableBoundaryCount: 0,
      invalidCandidateCount: 0,
      duplicateCandidateCount: 0,
      duplicateGrantCount: 0,
      duplicateTransactionPreparationCount: 0,
      candidateIdentityUnique: true,
      selectionIdentityUnique: true,
      registrationIdentityUnique: true,
      activationReadinessIdentityUnique: true,
      activationAuthorizationIdentityUnique: true,
      activationGrantIdentityUnique: true,
      activationGrantIssuanceIdentityUnique: true,
      activationCommitBoundaryIdentityUnique: true,
      activationTransactionOpeningReadinessIdentityUnique: true,
      activationTransactionOpeningAuthorizationIdentityUnique: true,
      activationTransactionOpeningIdentityUnique: true,
      activationTransactionPreparationReadinessIdentityUnique: true,
      activationTransactionPreparationAuthorizationIdentityUnique: true,
      activationTransactionPreparationIdentityUnique: true,
      candidateStructurallyCompatible: true,
      runtimeCapabilityPresent: false,
      runtimeHostInstancePresent: false,
      activationHandlePresent: false,
      executionHandlePresent: false,
      tokenPresent: false,
      credentialPresent: false,
      certificatePresent: false,
      permitPresent: false,
      transactionPreparationRecords: [record],
      predecessorActivationTransactionPreparationAuthorizationResult:
        "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared",
      predecessorActivationTransactionPreparationAuthorizationState: "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED",
      predecessorActivationCommitBoundaryEntryResult:
        "controlled-workspace-host-activation-commit-boundary-entered",
      predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED",
      predecessorCandidateGranted: true,
      predecessorCandidateActivated: false,
      issuanceCommitBoundaryResult:
        "authorization-grant-issuance-commit-boundary-ready-not-entered",
      issuanceCommitBoundaryState: "NOT_ENTERED",
      issuanceCommitBoundaryEntered: false,
      issuanceCommitBoundaryArmed: false,
      issuanceBoundaryCrossed: false,
      issuanceTransactionResult:
        "authorization-grant-issuance-transaction-opened-not-prepared",
      issuanceTransactionState: "OPENED",
      issuanceTransactionOpened: true,
      issuanceTransactionPrepared: true,
      issuanceTransactionCommitted: false,
      issuanceTransactionAborted: false,
      issuancePipelineResult:
        "authorization-grant-issuance-pipeline-ready-not-executable",
      issuancePipelineExecutable: false,
      issuancePipelineExecutionAllowed: false,
      owner: "legacy",
      writer: "legacy",
      renderer: "legacy",
      mountCount: 1,
      unmountCount: 0,
      activeInstanceCount: 1,
      geoFeedRenderCount: 1,
      shellRendered: false,
      shellChildCount: 0,
      shellDOMNodeCount: 0,
      workspaceVisible: false,
      workspaceHostMounted: false,
      workspaceCandidateRendered: false,
      workspaceCandidateDOMPresent: false,
      workspaceCandidateReactInstancePresent: false,
      hostActivation: false,
      renderActivation: false,
      canStartActivation: false,
      activationBlocker:
        PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY,
      conditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONDITIONS,
      satisfiedConditions:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONDITIONS,
      unsatisfiedConditions: [],
      guards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_GUARDS,
      satisfiedGuards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_GUARDS,
      unsatisfiedGuards: [],
      blockers: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_BLOCKERS,
      browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
    },
  );
}

export function validateControlledWorkspaceHostActivationTransactionPreparationDescriptor(
  d: ControlledWorkspaceHostActivationTransactionPreparationDescriptor,
): ControlledWorkspaceHostActivationTransactionPreparationDescriptor {
  if (
    d.phase !== "3B.3.35" ||
    d.previousPhase !== "3B.3.34" ||
    d.currentPhase !== "3B.3.35" ||
    d.nextEligibleStep !== "3B.3.36"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PHASE",
      "Phase chain must be 3B.3.34 → 3B.3.35 → 3B.3.36",
    );
  }
  if (
    d.transactionPreparationState !== "TRANSACTION_PREPARED_NOT_COMMITTED" ||
    d.transactionPreparationResult !==
      "controlled-workspace-host-activation-transaction-prepared-not-committed"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_RESULT",
      "Successful preparation must be TRANSACTION_PREPARED_NOT_COMMITTED",
    );
  }
  if (
    d.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID ||
    d.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID ||
    d.selectionId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID ||
    d.activationReadinessId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID ||
    d.activationAuthorizationId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID ||
    d.activationGrantId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID ||
    d.activationGrantIssuanceId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID ||
    d.activationCommitBoundaryId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID ||
    d.activationTransactionOpeningReadinessId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID ||
    d.activationTransactionOpeningAuthorizationId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID ||
    d.activationTransactionOpeningId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID ||
    d.activationTransactionPreparationReadinessId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID ||
    d.activationTransactionPreparationId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_IDENTITY",
      "Identity chain must be exact",
    );
  }
  if (
    d.transactionOpeningReady !== true ||
    d.transactionOpeningAuthorized !== true ||
    d.transactionOpeningStarted !== true ||
    d.transactionOpeningCompleted !== true ||
    d.transactionPreparationReady !== true ||
    d.transactionPreparationAuthorized !== true ||
    d.issuanceTransactionState !== "OPENED" ||
    d.issuanceTransactionOpened !== true ||
    d.issuanceTransactionPrepared !== true ||
    d.issuanceTransactionCommitted !== false ||
    d.issuanceTransactionAborted !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_FLAGS",
      "Transaction preparation requires opening completed, preparation ready+authorized, transaction OPENED and prepared, not committed/aborted",
    );
  }
  if (
    d.candidateCount !== 1 ||
    d.grantedCandidateCount !== 1 ||
    d.grantCount !== 1 ||
    d.transactionPreparationCount !== 1 ||
    d.duplicateTransactionPreparationCount !== 0 ||
    d.candidateGranted !== true ||
    d.candidateActivated !== false ||
    d.grantExecutable !== false ||
    d.activationCommitBoundaryExecutable !== false ||
    d.activationTransactionOpeningAllowed !== false ||
    d.activationExecutionAllowed !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_COUNTS",
      "Entered candidate must remain unactivated and non-executable, with exactly one commit-boundary entry",
    );
  }
  if (
    d.activationCommitBoundaryArmed !== false ||
    d.activationCommitBoundaryCrossed !== false ||
    d.activationCommitBoundaryCommitted !== false ||
    d.activationCommitBoundaryAborted !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PROGRESSION",
      "Commit boundary must not be armed, crossed, committed, or aborted beyond entry",
    );
  }
  if (
    d.transitionFrom !== "NOT_ENTERED" ||
    d.transitionTo !== "ENTERED" ||
    d.transitionLegal !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_TRANSITION",
      "Only the legal NOT_ENTERED → ENTERED transition may be recorded",
    );
  }
  if (
    d.predecessorActivationTransactionPreparationAuthorizationState !== "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED" ||
    d.predecessorActivationTransactionPreparationAuthorizationResult !==
      "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared" ||
    d.predecessorActivationCommitBoundaryEntryState !== "COMMIT_BOUNDARY_ENTERED" ||
    d.issuanceCommitBoundaryState !== "NOT_ENTERED" ||
    d.issuanceTransactionState !== "OPENED" ||
    d.issuancePipelineExecutable !== false ||
    d.issuancePipelineState !== "NON_EXECUTABLE"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREDECESSOR",
      "Predecessor authorization must remain AUTHORIZED_NOT_OPENED; opened transaction must stay unprepared with NON_EXECUTABLE pipeline",
    );
  }
  if (
    d.owner !== "legacy" ||
    d.writer !== "legacy" ||
    d.renderer !== "legacy" ||
    d.mountCount !== 1 ||
    d.geoFeedRenderCount !== 1 ||
    d.shellRendered !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_RUNTIME",
      "Legacy runtime and null shell must be preserved",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceHostActivationTransactionPreparation(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceHostActivationTransactionPreparationInput,
): ControlledWorkspaceHostActivationTransactionPreparationEvaluation {
  if (registry.hostCount !== 1) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_REGISTRY",
      "Transaction-opening requires exactly one controlled-host registry entry",
    );
  }

  const predecessor = evaluatePredecessorPreparationAuthorization(registry);
  const pred = predecessor.descriptor;

  if (
    pred.transactionPreparationAuthorizationResult !==
      "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared" ||
    pred.transactionPreparationAuthorizationState !== "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED" ||
    pred.transactionOpeningReady !== true ||
    pred.transactionOpeningAuthorized !== true ||
    pred.transactionOpeningStarted !== true ||
    pred.transactionOpeningCompleted !== true ||
    pred.transactionPreparationReady !== true ||
    pred.transactionPreparationAuthorized !== true ||
    pred.activationCommitBoundaryState !== "ENTERED" ||
    pred.activationCommitBoundaryEntered !== true ||
    pred.candidateGranted !== true ||
    pred.candidateActivated !== false ||
    pred.issuanceTransactionState !== "OPENED" ||
    pred.issuanceTransactionOpened !== true ||
    pred.issuanceTransactionPrepared !== false ||
    pred.issuancePipelineExecutable !== false ||
    pred.issuancePipelineState !== "NON_EXECUTABLE"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREDECESSOR_LIVE",
      "Predecessor preparation-authorization must remain AUTHORIZED_NOT_PREPARED with transaction OPENED unprepared",
    );
  }

  const blocked = blockedResultFor(input);
  if (blocked) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_BLOCKED",
      blocked,
    );
  }

  const descriptor =
    createControlledWorkspaceHostActivationTransactionPreparationDescriptor();
  const record = descriptor.transactionPreparationRecords[0];

  return {
    descriptor,
    diagnostics: {
      transactionOpeningReady: true,
      transactionOpeningAuthorized: true,
      transactionOpeningStarted: true,
      transactionOpeningCompleted: true,
      transactionPreparationReady: true,
      transactionPreparationAuthorized: true,
      issuancePipelineState: "NON_EXECUTABLE",
      activationCommitBoundaryEntered: true,
      activationCommitBoundaryState: descriptor.activationCommitBoundaryState,
      activationCommitBoundaryExecutable: false,
      activationCommitBoundaryBlocked: true,
      activationTransactionOpeningAllowed: false,
      activationExecutionAllowed: false,
      transactionPreparationResult: descriptor.transactionPreparationResult,
      transactionPreparationState: descriptor.transactionPreparationState,
      transitionFrom: descriptor.transitionFrom,
      transitionTo: descriptor.transitionTo,
      transitionLegal: true,
      candidateSelected: true,
      candidateReady: true,
      candidateAuthorized: true,
      candidateGranted: true,
      candidateActivated: false,
      candidateActive: false,
      candidateExecutable: false,
      grantPresent: true,
      grantIssued: true,
      grantValid: true,
      grantImmutable: true,
      grantUnique: true,
      grantExecutable: false,
      futureGrantPossible: true,
      futureGrantIssued: true,
      futureActivationPossible: true,
      futureActivationAuthorized: true,
      futureActivationStarted: false,
      candidateCount: 1,
      registeredCandidateCount: 1,
      selectedCandidateCount: 1,
      readyCandidateCount: 1,
      authorizedCandidateCount: 1,
      grantedCandidateCount: 1,
      grantCount: 1,
      transactionPreparationCount: 1,
      futureActivationTargetCount: 1,
      activeCandidateCount: 0,
      activatedCandidateCount: 0,
      executableCandidateCount: 0,
      executableGrantCount: 0,
      duplicateTransactionPreparationCount: 0,
      candidateIdentityUnique: true,
      selectionIdentityUnique: true,
      activationReadinessIdentityUnique: true,
      activationAuthorizationIdentityUnique: true,
      activationGrantIdentityUnique: true,
      activationGrantIssuanceIdentityUnique: true,
      activationCommitBoundaryIdentityUnique: true,
      activationTransactionOpeningReadinessIdentityUnique: true,
      activationTransactionOpeningAuthorizationIdentityUnique: true,
      activationTransactionOpeningIdentityUnique: true,
      activationTransactionPreparationReadinessIdentityUnique: true,
      activationTransactionPreparationAuthorizationIdentityUnique: true,
      activationTransactionPreparationIdentityUnique: true,
      candidateStructurallyCompatible: true,
      candidateId: record.candidateId,
      registrationId: record.registrationId,
      selectionId: record.selectionId,
      activationReadinessId: record.activationReadinessId,
      activationAuthorizationId: record.activationAuthorizationId,
      activationGrantId: record.activationGrantId,
      activationGrantIssuanceId: record.activationGrantIssuanceId,
      activationGrantIssuanceContractId: record.activationGrantIssuanceContractId,
      activationCommitBoundaryId: record.activationCommitBoundaryId,
      activationCommitBoundaryContractId: record.activationCommitBoundaryContractId,
      activationTransactionOpeningReadinessId: record.activationTransactionOpeningReadinessId,
      activationTransactionOpeningReadinessContractId:
        record.activationTransactionOpeningReadinessContractId,
      activationTransactionOpeningAuthorizationId:
        record.activationTransactionOpeningAuthorizationId,
      activationTransactionOpeningAuthorizationContractId:
        record.activationTransactionOpeningAuthorizationContractId,
      activationTransactionPreparationId: record.activationTransactionPreparationId,
      activationTransactionPreparationContractId:
        record.activationTransactionPreparationContractId,
      runtimeCapabilityPresent: false,
      runtimeHostInstancePresent: false,
      activationHandlePresent: false,
      executionHandlePresent: false,
      tokenPresent: false,
      credentialPresent: false,
      certificatePresent: false,
      permitPresent: false,
      shellRendered: false,
      shellChildCount: 0,
      shellDOMNodeCount: 0,
      workspaceVisible: false,
      mountsGeoFeed: false,
      containsGeoFeed: false,
      wrapsGeoFeed: false,
      duplicatesGeoFeed: false,
      createsSecondGeoFeed: false,
      predecessorActivationCommitBoundaryEntryResult:
        descriptor.predecessorActivationCommitBoundaryEntryResult,
      predecessorActivationCommitBoundaryEntryState:
        descriptor.predecessorActivationCommitBoundaryEntryState,
      issuanceCommitBoundaryState: descriptor.issuanceCommitBoundaryState,
      issuanceCommitBoundaryEntered: false,
      issuanceTransactionState: descriptor.issuanceTransactionState,
      issuanceTransactionOpened: true,
      issuanceTransactionPrepared: true,
      issuanceTransactionCommitted: false,
      issuanceTransactionAborted: false,
      issuancePipelineExecutable: false,
      owner: "legacy",
      writer: "legacy",
      renderer: "legacy",
      mountCount: 1,
      unmountCount: 0,
      activeInstanceCount: 1,
      geoFeedRenderCount: 1,
      hostActivation: false,
      renderActivation: false,
      canStartActivation: false,
      currentPhase: "3B.3.35",
      previousPhase: "3B.3.34",
      nextEligibleStep: "3B.3.36",
      activationBlocker:
        PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY,
      predecessorActivationBlocker:
        PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY,
      conditionCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONDITIONS.length,
      unsatisfiedConditionCount: 0,
      guardCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_GUARDS.length,
      satisfiedGuardCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_GUARDS.length,
      unsatisfiedGuardCount: 0,
      blockerCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_BLOCKERS.length,
      conditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONDITIONS,
      guards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_GUARDS,
      blockers: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_BLOCKERS,
      transactionPreparationRecords: descriptor.transactionPreparationRecords,
    },
  };
}

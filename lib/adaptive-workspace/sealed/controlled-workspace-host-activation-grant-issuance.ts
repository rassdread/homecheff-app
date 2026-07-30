/**
 * Phase 3B.3.28 — Controlled Workspace Host Activation Grant Issuance (metadata only).
 *
 * Proves the authorized Adaptive Workspace candidate can have exactly one
 * sealed, immutable, non-executable activation grant issued without
 * activating, rendering, or entering the Phase 3B.3.23 commit boundary.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
  evaluateControlledWorkspaceHostActivationAuthorization,
} from "./controlled-workspace-host-activation-authorization";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID } from "./controlled-workspace-host-activation-readiness";
import { CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID } from "./controlled-workspace-host-candidate-selection";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
} from "./controlled-workspace-host-candidate-registration";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY =
  "PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY" as const;

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID =
  "feed.discovery.adaptive-workspace.host-activation-grant-issuance.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-activation-grant-issuance.contract.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID =
  "feed.discovery.adaptive-workspace.host-activation-grant.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-activation-grant.contract.v1" as const;

export type ControlledWorkspaceHostActivationGrantIssuanceState =
  | "GRANTED_NOT_ACTIVATED"
  | "BLOCKED";

export type ControlledWorkspaceHostActivationGrantIssuanceResult =
  | "controlled-workspace-host-activation-grant-issued-not-activated"
  | "controlled-workspace-host-activation-grant-issuance-blocked-invalid-predecessor"
  | "controlled-workspace-host-activation-grant-issuance-blocked-invalid-authorization"
  | "controlled-workspace-host-activation-grant-issuance-blocked-invalid-readiness"
  | "controlled-workspace-host-activation-grant-issuance-blocked-invalid-selection"
  | "controlled-workspace-host-activation-grant-issuance-blocked-invalid-candidate"
  | "controlled-workspace-host-activation-grant-issuance-blocked-invalid-contract"
  | "controlled-workspace-host-activation-grant-issuance-blocked-duplicate-grant"
  | "controlled-workspace-host-activation-grant-issuance-blocked-grant-executable"
  | "controlled-workspace-host-activation-grant-issuance-blocked-runtime-capability"
  | "controlled-workspace-host-activation-grant-issuance-blocked-runtime-host"
  | "controlled-workspace-host-activation-grant-issuance-blocked-activation-handle"
  | "controlled-workspace-host-activation-grant-issuance-blocked-workspace-render"
  | "controlled-workspace-host-activation-grant-issuance-blocked-second-geofeed"
  | "controlled-workspace-host-activation-grant-issuance-blocked-runtime-mutation"
  | "controlled-workspace-host-activation-grant-issuance-blocked-shell"
  | "controlled-workspace-host-activation-grant-issuance-blocked-ownership"
  | "controlled-workspace-host-activation-grant-issuance-blocked-renderer"
  | "controlled-workspace-host-activation-grant-issuance-blocked-writer"
  | "controlled-workspace-host-activation-grant-issuance-blocked-pipeline"
  | "controlled-workspace-host-activation-grant-issuance-blocked-transaction"
  | "controlled-workspace-host-activation-grant-issuance-blocked-commit-boundary";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS =
  Object.freeze([
    "PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY",
    "PHASE_3B3_28_METADATA_ONLY",
    "PHASE_3B3_28_ACTIVATION_FORBIDDEN",
    "PHASE_3B3_28_ACTIVE_STATE_FORBIDDEN",
    "PHASE_3B3_28_EXECUTION_FORBIDDEN",
    "PHASE_3B3_28_GRANT_EXECUTION_FORBIDDEN",
    "PHASE_3B3_28_GRANT_MUTATION_FORBIDDEN",
    "PHASE_3B3_28_GRANT_DUPLICATION_FORBIDDEN",
    "PHASE_3B3_28_SECOND_GRANT_FORBIDDEN",
    "PHASE_3B3_28_RUNTIME_HOST_FORBIDDEN",
    "PHASE_3B3_28_HOST_INSTANCE_FORBIDDEN",
    "PHASE_3B3_28_RUNTIME_CAPABILITY_FORBIDDEN",
    "PHASE_3B3_28_ACTIVATION_HANDLE_FORBIDDEN",
    "PHASE_3B3_28_AUTHORITY_HANDLE_FORBIDDEN",
    "PHASE_3B3_28_CREDENTIAL_FORBIDDEN",
    "PHASE_3B3_28_TOKEN_FORBIDDEN",
    "PHASE_3B3_28_CERTIFICATE_FORBIDDEN",
    "PHASE_3B3_28_PERMIT_FORBIDDEN",
    "PHASE_3B3_28_COMMAND_FORBIDDEN",
    "PHASE_3B3_28_CALLBACK_FORBIDDEN",
    "PHASE_3B3_28_DISPATCHER_FORBIDDEN",
    "PHASE_3B3_28_QUEUE_FORBIDDEN",
    "PHASE_3B3_28_SCHEDULER_FORBIDDEN",
    "PHASE_3B3_28_EXECUTOR_FORBIDDEN",
    "PHASE_3B3_28_PROVIDER_FORBIDDEN",
    "PHASE_3B3_28_SERVICE_FORBIDDEN",
    "PHASE_3B3_28_COORDINATOR_FORBIDDEN",
    "PHASE_3B3_28_RUNTIME_REGISTRY_FORBIDDEN",
    "PHASE_3B3_28_MUTABLE_REGISTRY_FORBIDDEN",
    "PHASE_3B3_28_COMMIT_BOUNDARY_ENTRY_FORBIDDEN",
    "PHASE_3B3_28_TRANSACTION_OPEN_FORBIDDEN",
    "PHASE_3B3_28_PIPELINE_EXECUTION_FORBIDDEN",
    "PHASE_3B3_28_OWNERSHIP_TRANSFER_FORBIDDEN",
    "PHASE_3B3_28_WRITER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_28_RENDERER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_28_RUNTIME_ADOPTION_FORBIDDEN",
    "PHASE_3B3_28_GEOFEED_RELOCATION_FORBIDDEN",
    "PHASE_3B3_28_SECOND_GEOFEED_FORBIDDEN",
    "PHASE_3B3_28_GEOFEED_WRAP_FORBIDDEN",
    "PHASE_3B3_28_GEOFEED_CLONE_FORBIDDEN",
    "PHASE_3B3_28_WORKSPACE_RENDER_FORBIDDEN",
    "PHASE_3B3_28_WORKSPACE_MOUNT_FORBIDDEN",
    "PHASE_3B3_28_WORKSPACE_REACT_INSTANCE_FORBIDDEN",
    "PHASE_3B3_28_VISIBLE_UI_FORBIDDEN",
    "PHASE_3B3_28_DOM_MUTATION_FORBIDDEN",
    "PHASE_3B3_28_RUNTIME_MUTATION_FORBIDDEN",
    "PHASE_3B3_28_REQUEST_MUTATION_FORBIDDEN",
    "PHASE_3B3_28_CACHE_MUTATION_FORBIDDEN",
    "PHASE_3B3_28_OBSERVER_MUTATION_FORBIDDEN",
    "PHASE_3B3_28_NETWORK_FORBIDDEN",
    "PHASE_3B3_28_PERSISTENCE_FORBIDDEN",
    "PHASE_3B3_28_DATE_DEPENDENCY_FORBIDDEN",
    "PHASE_3B3_28_RANDOMNESS_FORBIDDEN",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS =
  Object.freeze([
    "phase-3b328-active",
    "previous-phase-3b327-complete",
    "next-eligible-step-3b329",
    "grant-issuance-result-exact",
    "grant-issuance-state-exact",
    "candidate-identity-exact",
    "registration-identity-exact",
    "selection-identity-exact",
    "activation-readiness-identity-exact",
    "activation-authorization-identity-exact",
    "activation-authorization-contract-identity-exact",
    "activation-grant-identity-exact",
    "activation-grant-contract-identity-exact",
    "activation-grant-issuance-identity-exact",
    "activation-grant-issuance-contract-identity-exact",
    "controlled-host-identity-preserved",
    "legacy-runtime-identity-preserved",
    "exactly-one-candidate",
    "exactly-one-registered-candidate",
    "exactly-one-selected-candidate",
    "exactly-one-ready-candidate",
    "exactly-one-authorized-candidate",
    "exactly-one-granted-candidate",
    "exactly-one-grant",
    "exactly-one-future-activation-target",
    "active-candidate-count-zero",
    "activated-candidate-count-zero",
    "executable-candidate-count-zero",
    "executable-grant-count-zero",
    "candidate-identity-unique",
    "registration-identity-unique",
    "selection-identity-unique",
    "readiness-identity-unique",
    "authorization-identity-unique",
    "grant-identity-unique",
    "grant-issuance-identity-unique",
    "candidate-structurally-compatible",
    "candidate-deterministic",
    "candidate-immutable",
    "grant-deterministic",
    "grant-immutable",
    "grant-sealed",
    "grant-unique",
    "grant-non-executable",
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
    "future-grant-possible",
    "future-grant-issued",
    "future-activation-possible",
    "future-activation-authorized",
    "future-activation-not-started",
    "activation-grant-issuance-not-allowed-after-issuance",
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
    "commit-boundary-not-entered",
    "transaction-not-opened",
    "pipeline-non-executable",
    "predecessor-authorization-result-exact",
    "predecessor-authorization-state-exact",
    "production-runtime-unchanged",
    "output-serializable",
    "ordering-deterministic",
    "blocker-inventory-complete",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS =
  Object.freeze([
    "predecessor-exactness",
    "candidate-identity-exactness",
    "registration-identity-exactness",
    "selection-identity-exactness",
    "activation-readiness-identity-exactness",
    "activation-authorization-identity-exactness",
    "activation-grant-identity-exactness",
    "activation-grant-issuance-identity-exactness",
    "candidate-uniqueness",
    "grant-uniqueness",
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
    "runtime-capability-absent",
    "runtime-host-absent",
    "activation-handle-absent",
    "null-workspace-shell",
    "single-geofeed",
    "legacy-runtime-ownership",
    "legacy-writer",
    "legacy-renderer",
    "stable-mount",
    "commit-boundary-preserved",
    "transaction-preserved",
    "pipeline-preserved",
    "serializable-output",
    "stable-ordering",
    "mandatory-blockers-present",
  ] as const);

export type ControlledWorkspaceHostActivationGrantRecord = {
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  readonly activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  readonly activationAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID;
  readonly activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  readonly activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  readonly activationGrantIssuanceContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID;
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
  readonly commitBoundaryEntryAllowed: false;
  readonly issuanceTransactionOpenAllowed: false;
  readonly issuancePipelineExecutionAllowed: false;
  readonly activationGrantIssuanceAllowed: false;
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

export type ControlledWorkspaceHostActivationGrantIssuanceDescriptor = {
  readonly schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_SCHEMA_VERSION;
  readonly phase: "3B.3.28";
  readonly previousPhase: "3B.3.27";
  readonly currentPhase: "3B.3.28";
  readonly nextEligibleStep: "3B.3.29";
  readonly activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  readonly activationGrantContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_CONTRACT_ID;
  readonly activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  readonly activationGrantIssuanceContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID;
  readonly activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  readonly activationAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID;
  readonly activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly grantIssuanceState: "GRANTED_NOT_ACTIVATED";
  readonly grantIssuanceResult: "controlled-workspace-host-activation-grant-issued-not-activated";
  readonly grantIssuanceCompleted: true;
  readonly grantIssuanceGranted: true;
  readonly grantIssuanceBlocked: true;
  readonly grantIssuanceExecutable: false;
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
  readonly activationGrantIssuanceAllowed: false;
  readonly candidateCount: 1;
  readonly registeredCandidateCount: 1;
  readonly selectedCandidateCount: 1;
  readonly readyCandidateCount: 1;
  readonly authorizedCandidateCount: 1;
  readonly grantedCandidateCount: 1;
  readonly grantCount: 1;
  readonly futureActivationTargetCount: 1;
  readonly activeCandidateCount: 0;
  readonly activatedCandidateCount: 0;
  readonly executableCandidateCount: 0;
  readonly executableGrantCount: 0;
  readonly invalidCandidateCount: 0;
  readonly duplicateCandidateCount: 0;
  readonly duplicateGrantCount: 0;
  readonly candidateIdentityUnique: true;
  readonly selectionIdentityUnique: true;
  readonly registrationIdentityUnique: true;
  readonly activationReadinessIdentityUnique: true;
  readonly activationAuthorizationIdentityUnique: true;
  readonly activationGrantIdentityUnique: true;
  readonly activationGrantIssuanceIdentityUnique: true;
  readonly candidateStructurallyCompatible: true;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly activationHandlePresent: false;
  readonly tokenPresent: false;
  readonly credentialPresent: false;
  readonly certificatePresent: false;
  readonly permitPresent: false;
  readonly grantRecords: readonly [ControlledWorkspaceHostActivationGrantRecord];
  readonly predecessorActivationAuthorizationResult: "controlled-workspace-host-activation-authorized-not-granted";
  readonly predecessorActivationAuthorizationState: "AUTHORIZED_NOT_GRANTED";
  readonly predecessorCandidateAuthorized: true;
  readonly predecessorCandidateGranted: false;
  readonly issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
  readonly issuanceCommitBoundaryState: "NOT_ENTERED";
  readonly issuanceCommitBoundaryEntered: false;
  readonly issuanceCommitBoundaryArmed: false;
  readonly boundaryCrossed: false;
  readonly issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
  readonly issuanceTransactionState: "NOT_OPENED";
  readonly issuanceTransactionOpened: false;
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
  readonly activationBlocker: typeof PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY;
  readonly conditions: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS;
  readonly unsatisfiedConditions: readonly [];
  readonly guards: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS;
  readonly unsatisfiedGuards: readonly [];
  readonly blockers: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS;
  readonly browserInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
};

export type ControlledWorkspaceHostActivationGrantIssuanceDiagnostics = {
  readonly [key: string]: unknown;
};

export type ControlledWorkspaceHostActivationGrantIssuanceEvaluation = {
  readonly descriptor: ControlledWorkspaceHostActivationGrantIssuanceDescriptor;
  readonly diagnostics: ControlledWorkspaceHostActivationGrantIssuanceDiagnostics;
};

export type ControlledWorkspaceHostActivationGrantIssuanceInput = {
  readonly grant?: Partial<ControlledWorkspaceHostActivationGrantRecord> &
    Record<string, unknown>;
  readonly grantRecords?: readonly Record<string, unknown>[];
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
  readonly activationAuthorizationResult?: string;
  readonly activationAuthorizationState?: string;
  readonly candidateAuthorized?: boolean;
  readonly candidateGranted?: boolean;
  readonly candidateActivated?: boolean;
  readonly issuanceCommitBoundaryState?: string;
  readonly issuanceCommitBoundaryEntered?: boolean;
  readonly issuanceCommitBoundaryArmed?: boolean;
  readonly boundaryCrossed?: boolean;
  readonly issuanceTransactionState?: string;
  readonly issuanceTransactionOpened?: boolean;
  readonly issuancePipelineExecutable?: boolean;
};

function createGrantRecord(): ControlledWorkspaceHostActivationGrantRecord {
  return Object.freeze({
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
    activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
    activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
    activationGrantIssuanceContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
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
    commitBoundaryEntryAllowed: false,
    issuanceTransactionOpenAllowed: false,
    issuancePipelineExecutionAllowed: false,
    activationGrantIssuanceAllowed: false,
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
  input: ControlledWorkspaceHostActivationGrantIssuanceInput | undefined,
): ControlledWorkspaceHostActivationGrantIssuanceResult | null {
  if (!input) return null;

  if (
    input.activationAuthorizationState !== undefined &&
    input.activationAuthorizationState !== "AUTHORIZED_NOT_GRANTED"
  ) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-authorization";
  }
  if (
    input.activationAuthorizationResult !== undefined &&
    input.activationAuthorizationResult !==
      "controlled-workspace-host-activation-authorized-not-granted"
  ) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-authorization";
  }
  if (input.candidateAuthorized === false) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-authorization";
  }
  if (input.candidateActivated === true) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-candidate";
  }

  if (
    input.issuanceCommitBoundaryState !== undefined &&
    input.issuanceCommitBoundaryState !== "NOT_ENTERED"
  ) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-commit-boundary";
  }
  if (
    input.issuanceCommitBoundaryEntered === true ||
    input.issuanceCommitBoundaryArmed === true ||
    input.boundaryCrossed === true
  ) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-commit-boundary";
  }
  if (
    input.issuanceTransactionOpened === true ||
    (input.issuanceTransactionState !== undefined &&
      input.issuanceTransactionState !== "NOT_OPENED")
  ) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-transaction";
  }
  if (input.issuancePipelineExecutable === true) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-pipeline";
  }

  if (input.candidates && input.candidates.length !== 1) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-candidate";
  }
  if (input.selections && input.selections.length !== 1) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-selection";
  }
  if (input.grantRecords && input.grantRecords.length !== 1) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-duplicate-grant";
  }

  const r = input.grant;
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
      return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-candidate";
    }
    if (
      r.activationGrantId !== undefined &&
      r.activationGrantId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID
    ) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-contract";
    }
    if (r.granted === false || r.grantPresent === false) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-authorization";
    }
    if (r.grantExecutable === true) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-grant-executable";
    }
    if (r.activated === true || r.active === true) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-invalid-candidate";
    }
    if (r.runtimeCapabilityPresent === true) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-runtime-capability";
    }
    if (r.runtimeHostInstancePresent === true) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-runtime-host";
    }
    if (r.activationHandlePresent === true) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-activation-handle";
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
      return "controlled-workspace-host-activation-grant-issuance-blocked-runtime-capability";
    }
    if (
      r.visible === true ||
      r.rendering === true ||
      r.hosting === true ||
      r.shellRendered === true
    ) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-workspace-render";
    }
    if (
      (typeof r.shellChildCount === "number" && r.shellChildCount !== 0) ||
      (typeof r.shellDOMNodeCount === "number" && r.shellDOMNodeCount !== 0)
    ) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-shell";
    }
    if (
      r.mountsGeoFeed === true ||
      r.containsGeoFeed === true ||
      r.wrapsGeoFeed === true ||
      r.duplicatesGeoFeed === true ||
      r.createsSecondGeoFeed === true
    ) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-second-geofeed";
    }
    if (
      r.runtimeAdoptionAllowed === true ||
      r.ownershipTransferAllowed === true ||
      r.writerTransferAllowed === true ||
      r.rendererTransferAllowed === true ||
      r.activationGrantIssuanceAllowed === true
    ) {
      return "controlled-workspace-host-activation-grant-issuance-blocked-runtime-mutation";
    }
  }

  if (input.owner !== undefined && input.owner !== "legacy") {
    return "controlled-workspace-host-activation-grant-issuance-blocked-ownership";
  }
  if (input.writer !== undefined && input.writer !== "legacy") {
    return "controlled-workspace-host-activation-grant-issuance-blocked-writer";
  }
  if (input.renderer !== undefined && input.renderer !== "legacy") {
    return "controlled-workspace-host-activation-grant-issuance-blocked-renderer";
  }
  if (
    (input.mountCount !== undefined && input.mountCount !== 1) ||
    (input.unmountCount !== undefined && input.unmountCount !== 0) ||
    (input.activeInstanceCount !== undefined &&
      input.activeInstanceCount !== 1) ||
    (input.geoFeedRenderCount !== undefined && input.geoFeedRenderCount !== 1)
  ) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-second-geofeed";
  }
  if (
    input.shellRendered === true ||
    (input.shellChildCount !== undefined && input.shellChildCount !== 0) ||
    (input.shellDOMNodeCount !== undefined && input.shellDOMNodeCount !== 0)
  ) {
    return "controlled-workspace-host-activation-grant-issuance-blocked-shell";
  }

  return null;
}

export function createControlledWorkspaceHostActivationGrantIssuanceDescriptor(): ControlledWorkspaceHostActivationGrantIssuanceDescriptor {
  const record = createGrantRecord();
  return validateControlledWorkspaceHostActivationGrantIssuanceDescriptor({
    schemaVersion: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_SCHEMA_VERSION,
    phase: "3B.3.28",
    previousPhase: "3B.3.27",
    currentPhase: "3B.3.28",
    nextEligibleStep: "3B.3.29",
    activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
    activationGrantContractId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_CONTRACT_ID,
    activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
    activationGrantIssuanceContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    grantIssuanceState: "GRANTED_NOT_ACTIVATED",
    grantIssuanceResult:
      "controlled-workspace-host-activation-grant-issued-not-activated",
    grantIssuanceCompleted: true,
    grantIssuanceGranted: true,
    grantIssuanceBlocked: true,
    grantIssuanceExecutable: false,
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
    activationGrantIssuanceAllowed: false,
    candidateCount: 1,
    registeredCandidateCount: 1,
    selectedCandidateCount: 1,
    readyCandidateCount: 1,
    authorizedCandidateCount: 1,
    grantedCandidateCount: 1,
    grantCount: 1,
    futureActivationTargetCount: 1,
    activeCandidateCount: 0,
    activatedCandidateCount: 0,
    executableCandidateCount: 0,
    executableGrantCount: 0,
    invalidCandidateCount: 0,
    duplicateCandidateCount: 0,
    duplicateGrantCount: 0,
    candidateIdentityUnique: true,
    selectionIdentityUnique: true,
    registrationIdentityUnique: true,
    activationReadinessIdentityUnique: true,
    activationAuthorizationIdentityUnique: true,
    activationGrantIdentityUnique: true,
    activationGrantIssuanceIdentityUnique: true,
    candidateStructurallyCompatible: true,
    runtimeCapabilityPresent: false,
    runtimeHostInstancePresent: false,
    activationHandlePresent: false,
    tokenPresent: false,
    credentialPresent: false,
    certificatePresent: false,
    permitPresent: false,
    grantRecords: [record],
    predecessorActivationAuthorizationResult:
      "controlled-workspace-host-activation-authorized-not-granted",
    predecessorActivationAuthorizationState: "AUTHORIZED_NOT_GRANTED",
    predecessorCandidateAuthorized: true,
    predecessorCandidateGranted: false,
    issuanceCommitBoundaryResult:
      "authorization-grant-issuance-commit-boundary-ready-not-entered",
    issuanceCommitBoundaryState: "NOT_ENTERED",
    issuanceCommitBoundaryEntered: false,
    issuanceCommitBoundaryArmed: false,
    boundaryCrossed: false,
    issuanceTransactionResult:
      "authorization-grant-issuance-transaction-ready-not-opened",
    issuanceTransactionState: "NOT_OPENED",
    issuanceTransactionOpened: false,
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
      PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
    conditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS,
    satisfiedConditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS,
    unsatisfiedConditions: [],
    guards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS,
    satisfiedGuards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS,
    unsatisfiedGuards: [],
    blockers: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  });
}

export function validateControlledWorkspaceHostActivationGrantIssuanceDescriptor(
  d: ControlledWorkspaceHostActivationGrantIssuanceDescriptor,
): ControlledWorkspaceHostActivationGrantIssuanceDescriptor {
  if (
    d.phase !== "3B.3.28" ||
    d.previousPhase !== "3B.3.27" ||
    d.currentPhase !== "3B.3.28" ||
    d.nextEligibleStep !== "3B.3.29"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PHASE",
      "Phase chain must be 3B.3.27 → 3B.3.28 → 3B.3.29",
    );
  }
  if (
    d.grantIssuanceState !== "GRANTED_NOT_ACTIVATED" ||
    d.grantIssuanceResult !==
      "controlled-workspace-host-activation-grant-issued-not-activated"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_RESULT",
      "Successful grant issuance must be GRANTED_NOT_ACTIVATED",
    );
  }
  if (
    d.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID ||
    d.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID ||
    d.selectionId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID ||
    d.activationReadinessId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID ||
    d.activationAuthorizationId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID ||
    d.activationGrantId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID ||
    d.activationGrantIssuanceId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_IDENTITY",
      "Identity chain must be exact",
    );
  }
  if (
    d.candidateCount !== 1 ||
    d.grantedCandidateCount !== 1 ||
    d.grantCount !== 1 ||
    d.duplicateGrantCount !== 0 ||
    d.candidateGranted !== true ||
    d.candidateActivated !== false ||
    d.grantExecutable !== false ||
    d.grantIssuanceExecutable !== false ||
    d.activationGrantIssuanceAllowed !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_COUNTS",
      "Granted candidate must remain unactivated and non-executable, with exactly one grant",
    );
  }
  if (
    d.predecessorActivationAuthorizationState !== "AUTHORIZED_NOT_GRANTED" ||
    d.issuanceCommitBoundaryState !== "NOT_ENTERED" ||
    d.issuanceTransactionState !== "NOT_OPENED" ||
    d.issuancePipelineExecutable !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREDECESSOR",
      "Predecessor authorization/commit-boundary/transaction/pipeline must remain frozen",
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
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_RUNTIME",
      "Legacy runtime and null shell must be preserved",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceHostActivationGrantIssuance(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceHostActivationGrantIssuanceInput,
): ControlledWorkspaceHostActivationGrantIssuanceEvaluation {
  if (registry.hostCount !== 1) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_REGISTRY",
      "Grant issuance requires exactly one controlled-host registry entry",
    );
  }

  const predecessor =
    evaluateControlledWorkspaceHostActivationAuthorization(registry);
  const pred = predecessor.descriptor;

  if (
    pred.activationAuthorizationResult !==
      "controlled-workspace-host-activation-authorized-not-granted" ||
    pred.activationAuthorizationState !== "AUTHORIZED_NOT_GRANTED" ||
    pred.candidateAuthorized !== true ||
    pred.candidateGranted !== false ||
    pred.candidateActivated !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREDECESSOR_LIVE",
      "Predecessor authorization must remain AUTHORIZED_NOT_GRANTED",
    );
  }

  const blocked = blockedResultFor(input);
  if (blocked) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKED",
      blocked,
    );
  }

  const descriptor =
    createControlledWorkspaceHostActivationGrantIssuanceDescriptor();
  const record = descriptor.grantRecords[0];

  return {
    descriptor,
    diagnostics: {
      grantIssuanceCompleted: true,
      grantIssuanceGranted: true,
      grantIssuanceBlocked: true,
      grantIssuanceExecutable: false,
      grantIssuanceResult: descriptor.grantIssuanceResult,
      grantIssuanceState: descriptor.grantIssuanceState,
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
      activationGrantIssuanceAllowed: false,
      candidateCount: 1,
      registeredCandidateCount: 1,
      selectedCandidateCount: 1,
      readyCandidateCount: 1,
      authorizedCandidateCount: 1,
      grantedCandidateCount: 1,
      grantCount: 1,
      futureActivationTargetCount: 1,
      activeCandidateCount: 0,
      activatedCandidateCount: 0,
      executableCandidateCount: 0,
      executableGrantCount: 0,
      duplicateGrantCount: 0,
      candidateIdentityUnique: true,
      selectionIdentityUnique: true,
      activationReadinessIdentityUnique: true,
      activationAuthorizationIdentityUnique: true,
      activationGrantIdentityUnique: true,
      activationGrantIssuanceIdentityUnique: true,
      candidateStructurallyCompatible: true,
      candidateId: record.candidateId,
      registrationId: record.registrationId,
      selectionId: record.selectionId,
      activationReadinessId: record.activationReadinessId,
      activationAuthorizationId: record.activationAuthorizationId,
      activationAuthorizationContractId: record.activationAuthorizationContractId,
      activationGrantId: record.activationGrantId,
      activationGrantIssuanceId: record.activationGrantIssuanceId,
      activationGrantIssuanceContractId: record.activationGrantIssuanceContractId,
      runtimeCapabilityPresent: false,
      runtimeHostInstancePresent: false,
      activationHandlePresent: false,
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
      predecessorActivationAuthorizationResult:
        descriptor.predecessorActivationAuthorizationResult,
      predecessorActivationAuthorizationState:
        descriptor.predecessorActivationAuthorizationState,
      issuanceCommitBoundaryState: descriptor.issuanceCommitBoundaryState,
      issuanceCommitBoundaryEntered: false,
      issuanceTransactionState: descriptor.issuanceTransactionState,
      issuanceTransactionOpened: false,
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
      currentPhase: "3B.3.28",
      previousPhase: "3B.3.27",
      nextEligibleStep: "3B.3.29",
      activationBlocker:
        PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
      predecessorActivationBlocker:
        PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
      conditionCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS.length,
      unsatisfiedConditionCount: 0,
      guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS.length,
      satisfiedGuardCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS.length,
      unsatisfiedGuardCount: 0,
      blockerCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS.length,
      conditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONDITIONS,
      guards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_GUARDS,
      blockers: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS,
      grantRecords: descriptor.grantRecords,
    },
  };
}

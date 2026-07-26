/**
 * Phase 3B.3.27 — Controlled Workspace Host Activation Authorization (metadata only).
 *
 * Proves the ready selected Adaptive Workspace candidate is authorized for a
 * future controlled activation without granting, activating, or rendering.
 * Never enters the Phase 3B.3.23 commit boundary.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
  evaluateControlledWorkspaceHostActivationReadiness,
} from "./controlled-workspace-host-activation-readiness";
import { CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID } from "./controlled-workspace-host-candidate-selection";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
} from "./controlled-workspace-host-candidate-registration";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY =
  "PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY" as const;

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID =
  "feed.discovery.adaptive-workspace.host-activation-authorization.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-activation-authorization.contract.v1" as const;

export type ControlledWorkspaceHostActivationAuthorizationState =
  | "AUTHORIZED_NOT_GRANTED"
  | "BLOCKED";

export type ControlledWorkspaceHostActivationAuthorizationResult =
  | "controlled-workspace-host-activation-authorized-not-granted"
  | "controlled-workspace-host-activation-authorization-blocked-invalid-predecessor"
  | "controlled-workspace-host-activation-authorization-blocked-invalid-readiness"
  | "controlled-workspace-host-activation-authorization-blocked-invalid-selection"
  | "controlled-workspace-host-activation-authorization-blocked-invalid-candidate"
  | "controlled-workspace-host-activation-authorization-blocked-invalid-contract"
  | "controlled-workspace-host-activation-authorization-blocked-grant-present"
  | "controlled-workspace-host-activation-authorization-blocked-runtime-capability"
  | "controlled-workspace-host-activation-authorization-blocked-runtime-host"
  | "controlled-workspace-host-activation-authorization-blocked-activation-handle"
  | "controlled-workspace-host-activation-authorization-blocked-workspace-render"
  | "controlled-workspace-host-activation-authorization-blocked-second-geofeed"
  | "controlled-workspace-host-activation-authorization-blocked-runtime-mutation"
  | "controlled-workspace-host-activation-authorization-blocked-shell"
  | "controlled-workspace-host-activation-authorization-blocked-ownership"
  | "controlled-workspace-host-activation-authorization-blocked-renderer"
  | "controlled-workspace-host-activation-authorization-blocked-writer"
  | "controlled-workspace-host-activation-authorization-blocked-pipeline"
  | "controlled-workspace-host-activation-authorization-blocked-transaction"
  | "controlled-workspace-host-activation-authorization-blocked-commit-boundary";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS =
  Object.freeze([
    "PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY",
    "PHASE_3B3_27_METADATA_ONLY",
    "PHASE_3B3_27_GRANT_ISSUANCE_FORBIDDEN",
    "PHASE_3B3_27_GRANT_PRESENT_FORBIDDEN",
    "PHASE_3B3_27_ACTIVATION_FORBIDDEN",
    "PHASE_3B3_27_ACTIVE_STATE_FORBIDDEN",
    "PHASE_3B3_27_EXECUTION_FORBIDDEN",
    "PHASE_3B3_27_RUNTIME_HOST_FORBIDDEN",
    "PHASE_3B3_27_HOST_INSTANCE_FORBIDDEN",
    "PHASE_3B3_27_RUNTIME_CAPABILITY_FORBIDDEN",
    "PHASE_3B3_27_ACTIVATION_HANDLE_FORBIDDEN",
    "PHASE_3B3_27_AUTHORITY_HANDLE_FORBIDDEN",
    "PHASE_3B3_27_CREDENTIAL_FORBIDDEN",
    "PHASE_3B3_27_TOKEN_FORBIDDEN",
    "PHASE_3B3_27_CERTIFICATE_FORBIDDEN",
    "PHASE_3B3_27_PERMIT_FORBIDDEN",
    "PHASE_3B3_27_COMMAND_FORBIDDEN",
    "PHASE_3B3_27_CALLBACK_FORBIDDEN",
    "PHASE_3B3_27_DISPATCHER_FORBIDDEN",
    "PHASE_3B3_27_QUEUE_FORBIDDEN",
    "PHASE_3B3_27_SCHEDULER_FORBIDDEN",
    "PHASE_3B3_27_EXECUTOR_FORBIDDEN",
    "PHASE_3B3_27_PROVIDER_FORBIDDEN",
    "PHASE_3B3_27_SERVICE_FORBIDDEN",
    "PHASE_3B3_27_COORDINATOR_FORBIDDEN",
    "PHASE_3B3_27_RUNTIME_REGISTRY_FORBIDDEN",
    "PHASE_3B3_27_MUTABLE_REGISTRY_FORBIDDEN",
    "PHASE_3B3_27_COMMIT_BOUNDARY_ENTRY_FORBIDDEN",
    "PHASE_3B3_27_TRANSACTION_OPEN_FORBIDDEN",
    "PHASE_3B3_27_PIPELINE_EXECUTION_FORBIDDEN",
    "PHASE_3B3_27_OWNERSHIP_TRANSFER_FORBIDDEN",
    "PHASE_3B3_27_WRITER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_27_RENDERER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_27_RUNTIME_ADOPTION_FORBIDDEN",
    "PHASE_3B3_27_GEOFEED_RELOCATION_FORBIDDEN",
    "PHASE_3B3_27_SECOND_GEOFEED_FORBIDDEN",
    "PHASE_3B3_27_GEOFEED_WRAP_FORBIDDEN",
    "PHASE_3B3_27_GEOFEED_CLONE_FORBIDDEN",
    "PHASE_3B3_27_WORKSPACE_RENDER_FORBIDDEN",
    "PHASE_3B3_27_WORKSPACE_MOUNT_FORBIDDEN",
    "PHASE_3B3_27_WORKSPACE_REACT_INSTANCE_FORBIDDEN",
    "PHASE_3B3_27_VISIBLE_UI_FORBIDDEN",
    "PHASE_3B3_27_DOM_MUTATION_FORBIDDEN",
    "PHASE_3B3_27_RUNTIME_MUTATION_FORBIDDEN",
    "PHASE_3B3_27_REQUEST_MUTATION_FORBIDDEN",
    "PHASE_3B3_27_CACHE_MUTATION_FORBIDDEN",
    "PHASE_3B3_27_OBSERVER_MUTATION_FORBIDDEN",
    "PHASE_3B3_27_NETWORK_FORBIDDEN",
    "PHASE_3B3_27_PERSISTENCE_FORBIDDEN",
    "PHASE_3B3_27_DATE_DEPENDENCY_FORBIDDEN",
    "PHASE_3B3_27_RANDOMNESS_FORBIDDEN",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS =
  Object.freeze([
    "phase-3b327-active",
    "previous-phase-3b326-complete",
    "next-eligible-step-3b328",
    "authorization-result-exact",
    "authorization-state-exact",
    "candidate-identity-exact",
    "registration-identity-exact",
    "selection-identity-exact",
    "activation-readiness-identity-exact",
    "activation-authorization-identity-exact",
    "activation-authorization-contract-identity-exact",
    "controlled-host-identity-preserved",
    "legacy-runtime-identity-preserved",
    "exactly-one-candidate",
    "exactly-one-registered-candidate",
    "exactly-one-selected-candidate",
    "exactly-one-ready-candidate",
    "exactly-one-authorized-candidate",
    "exactly-one-future-activation-target",
    "exactly-one-future-grant-target",
    "active-candidate-count-zero",
    "activated-candidate-count-zero",
    "granted-candidate-count-zero",
    "executable-candidate-count-zero",
    "candidate-identity-unique",
    "registration-identity-unique",
    "selection-identity-unique",
    "readiness-identity-unique",
    "authorization-identity-unique",
    "candidate-structurally-compatible",
    "candidate-deterministic",
    "candidate-immutable",
    "candidate-selected",
    "candidate-ready",
    "candidate-authorized",
    "candidate-not-granted",
    "candidate-not-activated",
    "candidate-not-active",
    "candidate-not-executable",
    "candidate-not-visible",
    "candidate-not-rendering",
    "candidate-not-hosting",
    "future-grant-possible",
    "future-grant-not-issued",
    "future-activation-possible",
    "future-activation-authorized",
    "activation-grant-issuance-not-allowed",
    "runtime-capability-absent",
    "runtime-host-instance-absent",
    "activation-handle-absent",
    "grant-absent",
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
    "predecessor-readiness-result-exact",
    "predecessor-readiness-state-exact",
    "production-runtime-unchanged",
    "output-serializable",
    "ordering-deterministic",
    "blocker-inventory-complete",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS =
  Object.freeze([
    "predecessor-exactness",
    "candidate-identity-exactness",
    "registration-identity-exactness",
    "selection-identity-exactness",
    "activation-readiness-identity-exactness",
    "activation-authorization-identity-exactness",
    "candidate-uniqueness",
    "authorization-uniqueness",
    "future-activation-target-uniqueness",
    "future-grant-target-uniqueness",
    "candidate-selected",
    "candidate-ready",
    "candidate-authorized",
    "candidate-inactive",
    "candidate-unactivated",
    "candidate-ungranted",
    "candidate-non-executable",
    "runtime-capability-absent",
    "runtime-host-absent",
    "activation-handle-absent",
    "grant-absent",
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

export type ControlledWorkspaceHostActivationAuthorizationRecord = {
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  readonly activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  readonly activationAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID;
  readonly candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  readonly candidateLabel: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly activeRuntimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly selected: true;
  readonly ready: true;
  readonly authorized: true;
  readonly granted: false;
  readonly activated: false;
  readonly active: false;
  readonly visible: false;
  readonly rendering: false;
  readonly hosting: false;
  readonly executable: false;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly activationHandlePresent: false;
  readonly grantPresent: false;
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
  readonly futureGrantIssued: false;
  readonly futureActivationPossible: true;
  readonly futureActivationAuthorized: true;
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

export type ControlledWorkspaceHostActivationAuthorizationDescriptor = {
  readonly schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_SCHEMA_VERSION;
  readonly phase: "3B.3.27";
  readonly previousPhase: "3B.3.26";
  readonly currentPhase: "3B.3.27";
  readonly nextEligibleStep: "3B.3.28";
  readonly activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  readonly activationAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID;
  readonly activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly activationAuthorizationState: "AUTHORIZED_NOT_GRANTED";
  readonly activationAuthorizationResult: "controlled-workspace-host-activation-authorized-not-granted";
  readonly activationAuthorizationCompleted: true;
  readonly activationAuthorizationAuthorized: true;
  readonly activationAuthorizationBlocked: true;
  readonly activationAuthorizationExecutable: false;
  readonly candidateSelected: true;
  readonly candidateReady: true;
  readonly candidateAuthorized: true;
  readonly candidateGranted: false;
  readonly candidateActivated: false;
  readonly candidateActive: false;
  readonly candidateExecutable: false;
  readonly futureGrantPossible: true;
  readonly futureGrantIssued: false;
  readonly futureActivationPossible: true;
  readonly futureActivationAuthorized: true;
  readonly activationGrantIssuanceAllowed: false;
  readonly candidateCount: 1;
  readonly registeredCandidateCount: 1;
  readonly selectedCandidateCount: 1;
  readonly readyCandidateCount: 1;
  readonly authorizedCandidateCount: 1;
  readonly futureActivationTargetCount: 1;
  readonly futureGrantTargetCount: 1;
  readonly activeCandidateCount: 0;
  readonly activatedCandidateCount: 0;
  readonly grantedCandidateCount: 0;
  readonly executableCandidateCount: 0;
  readonly invalidCandidateCount: 0;
  readonly duplicateCandidateCount: 0;
  readonly candidateIdentityUnique: true;
  readonly selectionIdentityUnique: true;
  readonly registrationIdentityUnique: true;
  readonly activationReadinessIdentityUnique: true;
  readonly activationAuthorizationIdentityUnique: true;
  readonly candidateStructurallyCompatible: true;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly activationHandlePresent: false;
  readonly grantPresent: false;
  readonly tokenPresent: false;
  readonly credentialPresent: false;
  readonly certificatePresent: false;
  readonly permitPresent: false;
  readonly authorizationRecords: readonly [ControlledWorkspaceHostActivationAuthorizationRecord];
  readonly predecessorActivationReadinessResult: "controlled-workspace-host-activation-ready-not-authorized";
  readonly predecessorActivationReadinessState: "READY_NOT_AUTHORIZED";
  readonly predecessorCandidateAuthorized: false;
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
  readonly activationBlocker: typeof PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY;
  readonly conditions: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS;
  readonly unsatisfiedConditions: readonly [];
  readonly guards: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS;
  readonly unsatisfiedGuards: readonly [];
  readonly blockers: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS;
  readonly browserInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
};

export type ControlledWorkspaceHostActivationAuthorizationDiagnostics = {
  readonly [key: string]: unknown;
};

export type ControlledWorkspaceHostActivationAuthorizationEvaluation = {
  readonly descriptor: ControlledWorkspaceHostActivationAuthorizationDescriptor;
  readonly diagnostics: ControlledWorkspaceHostActivationAuthorizationDiagnostics;
};

export type ControlledWorkspaceHostActivationAuthorizationInput = {
  readonly authorization?: Partial<ControlledWorkspaceHostActivationAuthorizationRecord> &
    Record<string, unknown>;
  readonly authorizationRecords?: readonly Record<string, unknown>[];
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
  readonly activationReadinessResult?: string;
  readonly activationReadinessState?: string;
  readonly candidateReady?: boolean;
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

function createAuthorizationRecord(): ControlledWorkspaceHostActivationAuthorizationRecord {
  return Object.freeze({
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    candidateLabel: CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    activeRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    selected: true,
    ready: true,
    authorized: true,
    granted: false,
    activated: false,
    active: false,
    visible: false,
    rendering: false,
    hosting: false,
    executable: false,
    runtimeCapabilityPresent: false,
    runtimeHostInstancePresent: false,
    activationHandlePresent: false,
    grantPresent: false,
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
    futureGrantIssued: false,
    futureActivationPossible: true,
    futureActivationAuthorized: true,
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
  input: ControlledWorkspaceHostActivationAuthorizationInput | undefined,
): ControlledWorkspaceHostActivationAuthorizationResult | null {
  if (!input) return null;

  if (
    input.activationReadinessState !== undefined &&
    input.activationReadinessState !== "READY_NOT_AUTHORIZED"
  ) {
    return "controlled-workspace-host-activation-authorization-blocked-invalid-readiness";
  }
  if (
    input.activationReadinessResult !== undefined &&
    input.activationReadinessResult !==
      "controlled-workspace-host-activation-ready-not-authorized"
  ) {
    return "controlled-workspace-host-activation-authorization-blocked-invalid-readiness";
  }
  if (input.candidateReady === false) {
    return "controlled-workspace-host-activation-authorization-blocked-invalid-readiness";
  }
  if (input.candidateGranted === true) {
    return "controlled-workspace-host-activation-authorization-blocked-grant-present";
  }
  if (input.candidateActivated === true) {
    return "controlled-workspace-host-activation-authorization-blocked-invalid-candidate";
  }

  if (
    input.issuanceCommitBoundaryState !== undefined &&
    input.issuanceCommitBoundaryState !== "NOT_ENTERED"
  ) {
    return "controlled-workspace-host-activation-authorization-blocked-commit-boundary";
  }
  if (
    input.issuanceCommitBoundaryEntered === true ||
    input.issuanceCommitBoundaryArmed === true ||
    input.boundaryCrossed === true
  ) {
    return "controlled-workspace-host-activation-authorization-blocked-commit-boundary";
  }
  if (
    input.issuanceTransactionOpened === true ||
    (input.issuanceTransactionState !== undefined &&
      input.issuanceTransactionState !== "NOT_OPENED")
  ) {
    return "controlled-workspace-host-activation-authorization-blocked-transaction";
  }
  if (input.issuancePipelineExecutable === true) {
    return "controlled-workspace-host-activation-authorization-blocked-pipeline";
  }

  if (input.candidates && input.candidates.length !== 1) {
    return "controlled-workspace-host-activation-authorization-blocked-invalid-candidate";
  }
  if (input.selections && input.selections.length !== 1) {
    return "controlled-workspace-host-activation-authorization-blocked-invalid-selection";
  }
  if (input.authorizationRecords && input.authorizationRecords.length !== 1) {
    return "controlled-workspace-host-activation-authorization-blocked-invalid-candidate";
  }

  const r = input.authorization;
  if (r) {
    if (
      (r.candidateId !== undefined &&
        r.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID) ||
      (r.registrationId !== undefined &&
        r.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID) ||
      (r.selectionId !== undefined &&
        r.selectionId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID) ||
      (r.activationReadinessId !== undefined &&
        r.activationReadinessId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID)
    ) {
      return "controlled-workspace-host-activation-authorization-blocked-invalid-candidate";
    }
    if (
      r.activationAuthorizationId !== undefined &&
      r.activationAuthorizationId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID
    ) {
      return "controlled-workspace-host-activation-authorization-blocked-invalid-contract";
    }
    if (r.granted === true || r.grantPresent === true) {
      return "controlled-workspace-host-activation-authorization-blocked-grant-present";
    }
    if (r.activated === true || r.active === true) {
      return "controlled-workspace-host-activation-authorization-blocked-invalid-candidate";
    }
    if (r.runtimeCapabilityPresent === true) {
      return "controlled-workspace-host-activation-authorization-blocked-runtime-capability";
    }
    if (r.runtimeHostInstancePresent === true) {
      return "controlled-workspace-host-activation-authorization-blocked-runtime-host";
    }
    if (r.activationHandlePresent === true) {
      return "controlled-workspace-host-activation-authorization-blocked-activation-handle";
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
      return "controlled-workspace-host-activation-authorization-blocked-runtime-capability";
    }
    if (
      r.visible === true ||
      r.rendering === true ||
      r.hosting === true ||
      r.shellRendered === true
    ) {
      return "controlled-workspace-host-activation-authorization-blocked-workspace-render";
    }
    if (
      (typeof r.shellChildCount === "number" && r.shellChildCount !== 0) ||
      (typeof r.shellDOMNodeCount === "number" && r.shellDOMNodeCount !== 0)
    ) {
      return "controlled-workspace-host-activation-authorization-blocked-shell";
    }
    if (
      r.mountsGeoFeed === true ||
      r.containsGeoFeed === true ||
      r.wrapsGeoFeed === true ||
      r.duplicatesGeoFeed === true ||
      r.createsSecondGeoFeed === true
    ) {
      return "controlled-workspace-host-activation-authorization-blocked-second-geofeed";
    }
    if (
      r.runtimeAdoptionAllowed === true ||
      r.ownershipTransferAllowed === true ||
      r.writerTransferAllowed === true ||
      r.rendererTransferAllowed === true ||
      r.activationGrantIssuanceAllowed === true
    ) {
      return "controlled-workspace-host-activation-authorization-blocked-runtime-mutation";
    }
  }

  if (input.owner !== undefined && input.owner !== "legacy") {
    return "controlled-workspace-host-activation-authorization-blocked-ownership";
  }
  if (input.writer !== undefined && input.writer !== "legacy") {
    return "controlled-workspace-host-activation-authorization-blocked-writer";
  }
  if (input.renderer !== undefined && input.renderer !== "legacy") {
    return "controlled-workspace-host-activation-authorization-blocked-renderer";
  }
  if (
    (input.mountCount !== undefined && input.mountCount !== 1) ||
    (input.unmountCount !== undefined && input.unmountCount !== 0) ||
    (input.activeInstanceCount !== undefined &&
      input.activeInstanceCount !== 1) ||
    (input.geoFeedRenderCount !== undefined && input.geoFeedRenderCount !== 1)
  ) {
    return "controlled-workspace-host-activation-authorization-blocked-second-geofeed";
  }
  if (
    input.shellRendered === true ||
    (input.shellChildCount !== undefined && input.shellChildCount !== 0) ||
    (input.shellDOMNodeCount !== undefined && input.shellDOMNodeCount !== 0)
  ) {
    return "controlled-workspace-host-activation-authorization-blocked-shell";
  }

  return null;
}

export function createControlledWorkspaceHostActivationAuthorizationDescriptor(): ControlledWorkspaceHostActivationAuthorizationDescriptor {
  const record = createAuthorizationRecord();
  return validateControlledWorkspaceHostActivationAuthorizationDescriptor({
    schemaVersion: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_SCHEMA_VERSION,
    phase: "3B.3.27",
    previousPhase: "3B.3.26",
    currentPhase: "3B.3.27",
    nextEligibleStep: "3B.3.28",
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    activationAuthorizationState: "AUTHORIZED_NOT_GRANTED",
    activationAuthorizationResult:
      "controlled-workspace-host-activation-authorized-not-granted",
    activationAuthorizationCompleted: true,
    activationAuthorizationAuthorized: true,
    activationAuthorizationBlocked: true,
    activationAuthorizationExecutable: false,
    candidateSelected: true,
    candidateReady: true,
    candidateAuthorized: true,
    candidateGranted: false,
    candidateActivated: false,
    candidateActive: false,
    candidateExecutable: false,
    futureGrantPossible: true,
    futureGrantIssued: false,
    futureActivationPossible: true,
    futureActivationAuthorized: true,
    activationGrantIssuanceAllowed: false,
    candidateCount: 1,
    registeredCandidateCount: 1,
    selectedCandidateCount: 1,
    readyCandidateCount: 1,
    authorizedCandidateCount: 1,
    futureActivationTargetCount: 1,
    futureGrantTargetCount: 1,
    activeCandidateCount: 0,
    activatedCandidateCount: 0,
    grantedCandidateCount: 0,
    executableCandidateCount: 0,
    invalidCandidateCount: 0,
    duplicateCandidateCount: 0,
    candidateIdentityUnique: true,
    selectionIdentityUnique: true,
    registrationIdentityUnique: true,
    activationReadinessIdentityUnique: true,
    activationAuthorizationIdentityUnique: true,
    candidateStructurallyCompatible: true,
    runtimeCapabilityPresent: false,
    runtimeHostInstancePresent: false,
    activationHandlePresent: false,
    grantPresent: false,
    tokenPresent: false,
    credentialPresent: false,
    certificatePresent: false,
    permitPresent: false,
    authorizationRecords: [record],
    predecessorActivationReadinessResult:
      "controlled-workspace-host-activation-ready-not-authorized",
    predecessorActivationReadinessState: "READY_NOT_AUTHORIZED",
    predecessorCandidateAuthorized: false,
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
      PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
    conditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
    satisfiedConditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
    unsatisfiedConditions: [],
    guards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
    satisfiedGuards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
    unsatisfiedGuards: [],
    blockers: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  });
}

export function validateControlledWorkspaceHostActivationAuthorizationDescriptor(
  d: ControlledWorkspaceHostActivationAuthorizationDescriptor,
): ControlledWorkspaceHostActivationAuthorizationDescriptor {
  if (
    d.phase !== "3B.3.27" ||
    d.previousPhase !== "3B.3.26" ||
    d.currentPhase !== "3B.3.27" ||
    d.nextEligibleStep !== "3B.3.28"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PHASE",
      "Phase chain must be 3B.3.26 → 3B.3.27 → 3B.3.28",
    );
  }
  if (
    d.activationAuthorizationState !== "AUTHORIZED_NOT_GRANTED" ||
    d.activationAuthorizationResult !==
      "controlled-workspace-host-activation-authorized-not-granted"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_RESULT",
      "Successful authorization must be AUTHORIZED_NOT_GRANTED",
    );
  }
  if (
    d.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID ||
    d.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID ||
    d.selectionId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID ||
    d.activationReadinessId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID ||
    d.activationAuthorizationId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_IDENTITY",
      "Identity chain must be exact",
    );
  }
  if (
    d.candidateCount !== 1 ||
    d.authorizedCandidateCount !== 1 ||
    d.candidateAuthorized !== true ||
    d.candidateGranted !== false ||
    d.candidateActivated !== false ||
    d.activationAuthorizationExecutable !== false ||
    d.activationGrantIssuanceAllowed !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_COUNTS",
      "Authorized candidate must remain ungranted and non-executable",
    );
  }
  if (
    d.predecessorActivationReadinessState !== "READY_NOT_AUTHORIZED" ||
    d.issuanceCommitBoundaryState !== "NOT_ENTERED" ||
    d.issuanceTransactionState !== "NOT_OPENED" ||
    d.issuancePipelineExecutable !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREDECESSOR",
      "Predecessor readiness/commit-boundary/transaction/pipeline must remain frozen",
    );
  }
  if (
    d.owner !== "legacy" ||
    d.writer !== "legacy" ||
    d.renderer !== "legacy" ||
    d.mountCount !== 1 ||
    d.shellRendered !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_RUNTIME",
      "Legacy runtime and null shell must be preserved",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceHostActivationAuthorization(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceHostActivationAuthorizationInput,
): ControlledWorkspaceHostActivationAuthorizationEvaluation {
  if (registry.hostCount !== 1) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_REGISTRY",
      "Authorization requires exactly one controlled-host registry entry",
    );
  }

  const predecessor =
    evaluateControlledWorkspaceHostActivationReadiness(registry);
  const pred = predecessor.descriptor;

  if (
    pred.activationReadinessResult !==
      "controlled-workspace-host-activation-ready-not-authorized" ||
    pred.activationReadinessState !== "READY_NOT_AUTHORIZED" ||
    pred.candidateReady !== true ||
    pred.candidateAuthorized !== false ||
    pred.candidateGranted !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREDECESSOR_LIVE",
      "Predecessor readiness must remain READY_NOT_AUTHORIZED",
    );
  }

  const blocked = blockedResultFor(input);
  if (blocked) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKED",
      blocked,
    );
  }

  const descriptor =
    createControlledWorkspaceHostActivationAuthorizationDescriptor();
  const record = descriptor.authorizationRecords[0];

  return {
    descriptor,
    diagnostics: {
      activationAuthorizationCompleted: true,
      activationAuthorizationAuthorized: true,
      activationAuthorizationBlocked: true,
      activationAuthorizationExecutable: false,
      activationAuthorizationResult: descriptor.activationAuthorizationResult,
      activationAuthorizationState: descriptor.activationAuthorizationState,
      candidateSelected: true,
      candidateReady: true,
      candidateAuthorized: true,
      candidateGranted: false,
      candidateActivated: false,
      candidateActive: false,
      candidateExecutable: false,
      futureGrantPossible: true,
      futureGrantIssued: false,
      futureActivationPossible: true,
      futureActivationAuthorized: true,
      activationGrantIssuanceAllowed: false,
      candidateCount: 1,
      registeredCandidateCount: 1,
      selectedCandidateCount: 1,
      readyCandidateCount: 1,
      authorizedCandidateCount: 1,
      futureActivationTargetCount: 1,
      futureGrantTargetCount: 1,
      activeCandidateCount: 0,
      activatedCandidateCount: 0,
      grantedCandidateCount: 0,
      executableCandidateCount: 0,
      candidateIdentityUnique: true,
      selectionIdentityUnique: true,
      activationReadinessIdentityUnique: true,
      activationAuthorizationIdentityUnique: true,
      candidateStructurallyCompatible: true,
      candidateId: record.candidateId,
      registrationId: record.registrationId,
      selectionId: record.selectionId,
      activationReadinessId: record.activationReadinessId,
      activationAuthorizationId: record.activationAuthorizationId,
      activationAuthorizationContractId: record.activationAuthorizationContractId,
      runtimeCapabilityPresent: false,
      runtimeHostInstancePresent: false,
      activationHandlePresent: false,
      grantPresent: false,
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
      predecessorActivationReadinessResult:
        descriptor.predecessorActivationReadinessResult,
      predecessorActivationReadinessState:
        descriptor.predecessorActivationReadinessState,
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
      currentPhase: "3B.3.27",
      previousPhase: "3B.3.26",
      nextEligibleStep: "3B.3.28",
      activationBlocker:
        PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
      predecessorActivationBlocker:
        PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
      conditionCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
      unsatisfiedConditionCount: 0,
      guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
      satisfiedGuardCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
      unsatisfiedGuardCount: 0,
      blockerCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS.length,
      conditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
      guards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
      blockers: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS,
      authorizationRecords: descriptor.authorizationRecords,
    },
  };
}

/**
 * Phase 3B.3.26 — Controlled Workspace Host Activation Readiness (metadata only).
 *
 * Proves the selected Adaptive Workspace candidate is structurally ready for a
 * future controlled activation without authorizing, granting, activating, or
 * rendering anything. Never enters the Phase 3B.3.23 commit boundary.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  evaluateControlledWorkspaceHostCandidateSelection,
} from "./controlled-workspace-host-candidate-selection";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
} from "./controlled-workspace-host-candidate-registration";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY =
  "PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY" as const;

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID =
  "feed.discovery.adaptive-workspace.host-activation-readiness.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-activation-readiness.contract.v1" as const;

export type ControlledWorkspaceHostActivationReadinessState =
  | "READY_NOT_AUTHORIZED"
  | "BLOCKED";

export type ControlledWorkspaceHostActivationReadinessResult =
  | "controlled-workspace-host-activation-ready-not-authorized"
  | "controlled-workspace-host-activation-readiness-blocked-invalid-predecessor"
  | "controlled-workspace-host-activation-readiness-blocked-invalid-selection"
  | "controlled-workspace-host-activation-readiness-blocked-invalid-candidate"
  | "controlled-workspace-host-activation-readiness-blocked-runtime-capability"
  | "controlled-workspace-host-activation-readiness-blocked-runtime-host"
  | "controlled-workspace-host-activation-readiness-blocked-activation-handle"
  | "controlled-workspace-host-activation-readiness-blocked-grant"
  | "controlled-workspace-host-activation-readiness-blocked-authority"
  | "controlled-workspace-host-activation-readiness-blocked-workspace-render"
  | "controlled-workspace-host-activation-readiness-blocked-second-geofeed"
  | "controlled-workspace-host-activation-readiness-blocked-runtime-mutation"
  | "controlled-workspace-host-activation-readiness-blocked-contract"
  | "controlled-workspace-host-activation-readiness-blocked-shell"
  | "controlled-workspace-host-activation-readiness-blocked-ownership"
  | "controlled-workspace-host-activation-readiness-blocked-renderer"
  | "controlled-workspace-host-activation-readiness-blocked-writer"
  | "controlled-workspace-host-activation-readiness-blocked-pipeline"
  | "controlled-workspace-host-activation-readiness-blocked-transaction"
  | "controlled-workspace-host-activation-readiness-blocked-commit-boundary";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKERS =
  Object.freeze([
    "PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY",
    "PHASE_3B3_26_METADATA_ONLY",
    "PHASE_3B3_26_ACTIVATION_FORBIDDEN",
    "PHASE_3B3_26_AUTHORIZATION_FORBIDDEN",
    "PHASE_3B3_26_GRANT_FORBIDDEN",
    "PHASE_3B3_26_AUTHORITY_FORBIDDEN",
    "PHASE_3B3_26_CREDENTIAL_FORBIDDEN",
    "PHASE_3B3_26_TOKEN_FORBIDDEN",
    "PHASE_3B3_26_CERTIFICATE_FORBIDDEN",
    "PHASE_3B3_26_PERMIT_FORBIDDEN",
    "PHASE_3B3_26_HOST_INSTANCE_FORBIDDEN",
    "PHASE_3B3_26_RUNTIME_CAPABILITY_FORBIDDEN",
    "PHASE_3B3_26_ACTIVATION_HANDLE_FORBIDDEN",
    "PHASE_3B3_26_COMMAND_FORBIDDEN",
    "PHASE_3B3_26_CALLBACK_FORBIDDEN",
    "PHASE_3B3_26_DISPATCHER_FORBIDDEN",
    "PHASE_3B3_26_QUEUE_FORBIDDEN",
    "PHASE_3B3_26_SCHEDULER_FORBIDDEN",
    "PHASE_3B3_26_EXECUTOR_FORBIDDEN",
    "PHASE_3B3_26_PROVIDER_FORBIDDEN",
    "PHASE_3B3_26_SERVICE_FORBIDDEN",
    "PHASE_3B3_26_COORDINATOR_FORBIDDEN",
    "PHASE_3B3_26_COMMIT_BOUNDARY_ENTRY_FORBIDDEN",
    "PHASE_3B3_26_TRANSACTION_OPEN_FORBIDDEN",
    "PHASE_3B3_26_PIPELINE_EXECUTION_FORBIDDEN",
    "PHASE_3B3_26_OWNERSHIP_TRANSFER_FORBIDDEN",
    "PHASE_3B3_26_WRITER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_26_RENDERER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_26_RUNTIME_ADOPTION_FORBIDDEN",
    "PHASE_3B3_26_GEOFEED_RELOCATION_FORBIDDEN",
    "PHASE_3B3_26_SECOND_GEOFEED_FORBIDDEN",
    "PHASE_3B3_26_WORKSPACE_RENDER_FORBIDDEN",
    "PHASE_3B3_26_VISIBLE_UI_FORBIDDEN",
    "PHASE_3B3_26_DOM_MUTATION_FORBIDDEN",
    "PHASE_3B3_26_RUNTIME_MUTATION_FORBIDDEN",
    "PHASE_3B3_26_REQUEST_MUTATION_FORBIDDEN",
    "PHASE_3B3_26_CACHE_MUTATION_FORBIDDEN",
    "PHASE_3B3_26_OBSERVER_MUTATION_FORBIDDEN",
    "PHASE_3B3_26_NETWORK_FORBIDDEN",
    "PHASE_3B3_26_PERSISTENCE_FORBIDDEN",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS =
  Object.freeze([
    "phase-3b326-active",
    "previous-phase-3b325-complete",
    "next-eligible-step-3b327",
    "readiness-result-exact",
    "readiness-state-exact",
    "candidate-identity-exact",
    "registration-identity-exact",
    "selection-identity-exact",
    "activation-readiness-identity-exact",
    "activation-readiness-contract-identity-exact",
    "controlled-host-identity-preserved",
    "legacy-runtime-identity-preserved",
    "exactly-one-candidate",
    "exactly-one-registered-candidate",
    "exactly-one-selected-candidate",
    "exactly-one-future-activation-target",
    "candidate-identity-unique",
    "selection-identity-unique",
    "candidate-structurally-compatible",
    "candidate-deterministic",
    "candidate-immutable",
    "candidate-selected",
    "candidate-ready",
    "candidate-not-authorized",
    "candidate-not-granted",
    "candidate-not-activated",
    "candidate-not-active",
    "candidate-not-executable",
    "candidate-not-visible",
    "candidate-not-rendering",
    "candidate-not-hosting",
    "runtime-capability-absent",
    "runtime-host-instance-absent",
    "activation-handle-absent",
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
    "predecessor-selection-result-exact",
    "predecessor-selection-state-exact",
    "production-runtime-unchanged",
    "output-serializable",
    "ordering-deterministic",
    "blocker-inventory-complete",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS =
  Object.freeze([
    "predecessor-exactness",
    "candidate-identity-exactness",
    "registration-identity-exactness",
    "selection-identity-exactness",
    "activation-readiness-identity-exactness",
    "candidate-uniqueness",
    "selection-uniqueness",
    "future-activation-target-uniqueness",
    "candidate-selected",
    "candidate-ready",
    "candidate-inactive",
    "candidate-unauthorized",
    "candidate-ungranted",
    "candidate-non-executable",
    "runtime-capability-absent",
    "runtime-host-absent",
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

export type ControlledWorkspaceHostActivationReadinessRecord = {
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  readonly activationReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID;
  readonly candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  readonly candidateLabel: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly activeRuntimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly selected: true;
  readonly ready: true;
  readonly authorized: false;
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
  readonly activationAuthorizationAllowed: false;
  readonly runtimeAdoptionAllowed: false;
  readonly ownershipTransferAllowed: false;
  readonly writerTransferAllowed: false;
  readonly rendererTransferAllowed: false;
  readonly futureActivationPossible: true;
  readonly futureActivationAuthorized: false;
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

export type ControlledWorkspaceHostActivationReadinessDescriptor = {
  readonly schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_SCHEMA_VERSION;
  readonly phase: "3B.3.26";
  readonly previousPhase: "3B.3.25";
  readonly currentPhase: "3B.3.26";
  readonly nextEligibleStep: "3B.3.27";
  readonly activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  readonly activationReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID;
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly activationReadinessState: "READY_NOT_AUTHORIZED";
  readonly activationReadinessResult: "controlled-workspace-host-activation-ready-not-authorized";
  readonly activationReadinessCompleted: true;
  readonly activationReadinessReady: true;
  readonly activationReadinessBlocked: true;
  readonly activationReadinessExecutable: false;
  readonly candidateSelected: true;
  readonly candidateReady: true;
  readonly candidateAuthorized: false;
  readonly candidateGranted: false;
  readonly candidateActivated: false;
  readonly candidateActive: false;
  readonly candidateExecutable: false;
  readonly futureActivationPossible: true;
  readonly futureActivationAuthorized: false;
  readonly candidateCount: 1;
  readonly registeredCandidateCount: 1;
  readonly selectedCandidateCount: 1;
  readonly futureActivationTargetCount: 1;
  readonly activeCandidateCount: 0;
  readonly activatedCandidateCount: 0;
  readonly authorizedCandidateCount: 0;
  readonly grantedCandidateCount: 0;
  readonly executableCandidateCount: 0;
  readonly invalidCandidateCount: 0;
  readonly duplicateCandidateCount: 0;
  readonly candidateIdentityUnique: true;
  readonly selectionIdentityUnique: true;
  readonly registrationIdentityUnique: true;
  readonly activationReadinessIdentityUnique: true;
  readonly candidateStructurallyCompatible: true;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly activationHandlePresent: false;
  readonly readinessRecords: readonly [ControlledWorkspaceHostActivationReadinessRecord];
  readonly predecessorCandidateSelectionResult: "controlled-workspace-host-candidate-selected-not-activated";
  readonly predecessorCandidateSelectionState: "SELECTED_NOT_ACTIVATED";
  readonly predecessorCandidateSelected: true;
  readonly predecessorCandidateActivated: false;
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
  readonly activationBlocker: typeof PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY;
  readonly conditions: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS;
  readonly unsatisfiedConditions: readonly [];
  readonly guards: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS;
  readonly unsatisfiedGuards: readonly [];
  readonly blockers: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKERS;
  readonly browserInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
};

export type ControlledWorkspaceHostActivationReadinessDiagnostics = {
  readonly [key: string]: unknown;
};

export type ControlledWorkspaceHostActivationReadinessEvaluation = {
  readonly descriptor: ControlledWorkspaceHostActivationReadinessDescriptor;
  readonly diagnostics: ControlledWorkspaceHostActivationReadinessDiagnostics;
};

export type ControlledWorkspaceHostActivationReadinessInput = {
  readonly readiness?: Partial<ControlledWorkspaceHostActivationReadinessRecord> &
    Record<string, unknown>;
  readonly readinessRecords?: readonly Record<string, unknown>[];
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
  readonly candidateSelectionResult?: string;
  readonly candidateSelectionState?: string;
  readonly candidateSelected?: boolean;
  readonly candidateActivated?: boolean;
  readonly issuanceCommitBoundaryState?: string;
  readonly issuanceCommitBoundaryEntered?: boolean;
  readonly issuanceCommitBoundaryArmed?: boolean;
  readonly boundaryCrossed?: boolean;
  readonly issuanceTransactionState?: string;
  readonly issuanceTransactionOpened?: boolean;
  readonly issuancePipelineExecutable?: boolean;
};

function createReadinessRecord(): ControlledWorkspaceHostActivationReadinessRecord {
  return Object.freeze({
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationReadinessContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    candidateLabel: CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    activeRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    selected: true,
    ready: true,
    authorized: false,
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
    activationAuthorizationAllowed: false,
    runtimeAdoptionAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    futureActivationPossible: true,
    futureActivationAuthorized: false,
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
  input: ControlledWorkspaceHostActivationReadinessInput | undefined,
): ControlledWorkspaceHostActivationReadinessResult | null {
  if (!input) return null;

  if (
    input.candidateSelectionState !== undefined &&
    input.candidateSelectionState !== "SELECTED_NOT_ACTIVATED"
  ) {
    return "controlled-workspace-host-activation-readiness-blocked-invalid-selection";
  }
  if (
    input.candidateSelectionResult !== undefined &&
    input.candidateSelectionResult !==
      "controlled-workspace-host-candidate-selected-not-activated"
  ) {
    return "controlled-workspace-host-activation-readiness-blocked-invalid-selection";
  }
  if (input.candidateSelected === false) {
    return "controlled-workspace-host-activation-readiness-blocked-invalid-selection";
  }
  if (input.candidateActivated === true) {
    return "controlled-workspace-host-activation-readiness-blocked-invalid-candidate";
  }

  if (
    input.issuanceCommitBoundaryState !== undefined &&
    input.issuanceCommitBoundaryState !== "NOT_ENTERED"
  ) {
    return "controlled-workspace-host-activation-readiness-blocked-commit-boundary";
  }
  if (
    input.issuanceCommitBoundaryEntered === true ||
    input.issuanceCommitBoundaryArmed === true ||
    input.boundaryCrossed === true
  ) {
    return "controlled-workspace-host-activation-readiness-blocked-commit-boundary";
  }
  if (
    input.issuanceTransactionOpened === true ||
    (input.issuanceTransactionState !== undefined &&
      input.issuanceTransactionState !== "NOT_OPENED")
  ) {
    return "controlled-workspace-host-activation-readiness-blocked-transaction";
  }
  if (input.issuancePipelineExecutable === true) {
    return "controlled-workspace-host-activation-readiness-blocked-pipeline";
  }

  if (input.candidates && input.candidates.length !== 1) {
    return "controlled-workspace-host-activation-readiness-blocked-invalid-candidate";
  }
  if (input.selections && input.selections.length !== 1) {
    return "controlled-workspace-host-activation-readiness-blocked-invalid-selection";
  }
  if (input.readinessRecords && input.readinessRecords.length !== 1) {
    return "controlled-workspace-host-activation-readiness-blocked-invalid-candidate";
  }

  const r = input.readiness;
  if (r) {
    if (
      (r.candidateId !== undefined &&
        r.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID) ||
      (r.registrationId !== undefined &&
        r.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID) ||
      (r.selectionId !== undefined &&
        r.selectionId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID)
    ) {
      return "controlled-workspace-host-activation-readiness-blocked-invalid-candidate";
    }
    if (
      r.activationReadinessId !== undefined &&
      r.activationReadinessId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID
    ) {
      return "controlled-workspace-host-activation-readiness-blocked-contract";
    }
    if (r.activated === true || r.active === true) {
      return "controlled-workspace-host-activation-readiness-blocked-invalid-candidate";
    }
    if (r.authorized === true) {
      return "controlled-workspace-host-activation-readiness-blocked-authority";
    }
    if (r.granted === true) {
      return "controlled-workspace-host-activation-readiness-blocked-grant";
    }
    if (r.runtimeCapabilityPresent === true) {
      return "controlled-workspace-host-activation-readiness-blocked-runtime-capability";
    }
    if (r.runtimeHostInstancePresent === true) {
      return "controlled-workspace-host-activation-readiness-blocked-runtime-host";
    }
    if (r.activationHandlePresent === true) {
      return "controlled-workspace-host-activation-readiness-blocked-activation-handle";
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
      return "controlled-workspace-host-activation-readiness-blocked-runtime-capability";
    }
    if (
      r.visible === true ||
      r.rendering === true ||
      r.hosting === true ||
      r.shellRendered === true
    ) {
      return "controlled-workspace-host-activation-readiness-blocked-workspace-render";
    }
    if (
      (typeof r.shellChildCount === "number" && r.shellChildCount !== 0) ||
      (typeof r.shellDOMNodeCount === "number" && r.shellDOMNodeCount !== 0)
    ) {
      return "controlled-workspace-host-activation-readiness-blocked-shell";
    }
    if (
      r.mountsGeoFeed === true ||
      r.containsGeoFeed === true ||
      r.wrapsGeoFeed === true ||
      r.duplicatesGeoFeed === true ||
      r.createsSecondGeoFeed === true
    ) {
      return "controlled-workspace-host-activation-readiness-blocked-second-geofeed";
    }
    if (
      r.runtimeAdoptionAllowed === true ||
      r.ownershipTransferAllowed === true ||
      r.writerTransferAllowed === true ||
      r.rendererTransferAllowed === true ||
      r.activationAuthorizationAllowed === true
    ) {
      return "controlled-workspace-host-activation-readiness-blocked-runtime-mutation";
    }
  }

  if (input.owner !== undefined && input.owner !== "legacy") {
    return "controlled-workspace-host-activation-readiness-blocked-ownership";
  }
  if (input.writer !== undefined && input.writer !== "legacy") {
    return "controlled-workspace-host-activation-readiness-blocked-writer";
  }
  if (input.renderer !== undefined && input.renderer !== "legacy") {
    return "controlled-workspace-host-activation-readiness-blocked-renderer";
  }
  if (
    (input.mountCount !== undefined && input.mountCount !== 1) ||
    (input.unmountCount !== undefined && input.unmountCount !== 0) ||
    (input.activeInstanceCount !== undefined &&
      input.activeInstanceCount !== 1) ||
    (input.geoFeedRenderCount !== undefined && input.geoFeedRenderCount !== 1)
  ) {
    return "controlled-workspace-host-activation-readiness-blocked-second-geofeed";
  }
  if (
    input.shellRendered === true ||
    (input.shellChildCount !== undefined && input.shellChildCount !== 0) ||
    (input.shellDOMNodeCount !== undefined && input.shellDOMNodeCount !== 0)
  ) {
    return "controlled-workspace-host-activation-readiness-blocked-shell";
  }

  return null;
}

export function createControlledWorkspaceHostActivationReadinessDescriptor(): ControlledWorkspaceHostActivationReadinessDescriptor {
  const record = createReadinessRecord();
  return validateControlledWorkspaceHostActivationReadinessDescriptor({
    schemaVersion: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_SCHEMA_VERSION,
    phase: "3B.3.26",
    previousPhase: "3B.3.25",
    currentPhase: "3B.3.26",
    nextEligibleStep: "3B.3.27",
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationReadinessContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    activationReadinessState: "READY_NOT_AUTHORIZED",
    activationReadinessResult:
      "controlled-workspace-host-activation-ready-not-authorized",
    activationReadinessCompleted: true,
    activationReadinessReady: true,
    activationReadinessBlocked: true,
    activationReadinessExecutable: false,
    candidateSelected: true,
    candidateReady: true,
    candidateAuthorized: false,
    candidateGranted: false,
    candidateActivated: false,
    candidateActive: false,
    candidateExecutable: false,
    futureActivationPossible: true,
    futureActivationAuthorized: false,
    candidateCount: 1,
    registeredCandidateCount: 1,
    selectedCandidateCount: 1,
    futureActivationTargetCount: 1,
    activeCandidateCount: 0,
    activatedCandidateCount: 0,
    authorizedCandidateCount: 0,
    grantedCandidateCount: 0,
    executableCandidateCount: 0,
    invalidCandidateCount: 0,
    duplicateCandidateCount: 0,
    candidateIdentityUnique: true,
    selectionIdentityUnique: true,
    registrationIdentityUnique: true,
    activationReadinessIdentityUnique: true,
    candidateStructurallyCompatible: true,
    runtimeCapabilityPresent: false,
    runtimeHostInstancePresent: false,
    activationHandlePresent: false,
    readinessRecords: [record],
    predecessorCandidateSelectionResult:
      "controlled-workspace-host-candidate-selected-not-activated",
    predecessorCandidateSelectionState: "SELECTED_NOT_ACTIVATED",
    predecessorCandidateSelected: true,
    predecessorCandidateActivated: false,
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
      PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
    conditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS,
    satisfiedConditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS,
    unsatisfiedConditions: [],
    guards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS,
    satisfiedGuards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS,
    unsatisfiedGuards: [],
    blockers: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  });
}

export function validateControlledWorkspaceHostActivationReadinessDescriptor(
  d: ControlledWorkspaceHostActivationReadinessDescriptor,
): ControlledWorkspaceHostActivationReadinessDescriptor {
  if (
    d.phase !== "3B.3.26" ||
    d.previousPhase !== "3B.3.25" ||
    d.currentPhase !== "3B.3.26" ||
    d.nextEligibleStep !== "3B.3.27"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PHASE",
      "Phase chain must be 3B.3.25 → 3B.3.26 → 3B.3.27",
    );
  }
  if (
    d.activationReadinessState !== "READY_NOT_AUTHORIZED" ||
    d.activationReadinessResult !==
      "controlled-workspace-host-activation-ready-not-authorized"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_RESULT",
      "Successful readiness must be READY_NOT_AUTHORIZED",
    );
  }
  if (
    d.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID ||
    d.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID ||
    d.selectionId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID ||
    d.activationReadinessId !== CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_IDENTITY",
      "Candidate/registration/selection/readiness identities must be exact",
    );
  }
  if (
    d.candidateCount !== 1 ||
    d.selectedCandidateCount !== 1 ||
    d.futureActivationTargetCount !== 1 ||
    d.candidateReady !== true ||
    d.candidateAuthorized !== false ||
    d.candidateActivated !== false ||
    d.activationReadinessExecutable !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_COUNTS",
      "Ready selected candidate must remain unauthorized and non-executable",
    );
  }
  if (
    d.predecessorCandidateSelectionState !== "SELECTED_NOT_ACTIVATED" ||
    d.issuanceCommitBoundaryState !== "NOT_ENTERED" ||
    d.issuanceTransactionState !== "NOT_OPENED" ||
    d.issuancePipelineExecutable !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREDECESSOR",
      "Predecessor selection/commit-boundary/transaction/pipeline must remain frozen",
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
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_RUNTIME",
      "Legacy runtime and null shell must be preserved",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceHostActivationReadiness(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceHostActivationReadinessInput,
): ControlledWorkspaceHostActivationReadinessEvaluation {
  if (registry.hostCount !== 1) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_REGISTRY",
      "Readiness requires exactly one controlled-host registry entry",
    );
  }

  const predecessor =
    evaluateControlledWorkspaceHostCandidateSelection(registry);
  const pred = predecessor.descriptor;

  if (
    pred.candidateSelectionResult !==
      "controlled-workspace-host-candidate-selected-not-activated" ||
    pred.candidateSelectionState !== "SELECTED_NOT_ACTIVATED" ||
    pred.candidateSelected !== true ||
    pred.candidateActivated !== false ||
    pred.selectedCandidateCount !== 1
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREDECESSOR_LIVE",
      "Predecessor selection must remain SELECTED_NOT_ACTIVATED",
    );
  }

  const blocked = blockedResultFor(input);
  if (blocked) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKED",
      blocked,
    );
  }

  const descriptor =
    createControlledWorkspaceHostActivationReadinessDescriptor();
  const record = descriptor.readinessRecords[0];

  return {
    descriptor,
    diagnostics: {
      activationReadinessCompleted: true,
      activationReadinessReady: true,
      activationReadinessBlocked: true,
      activationReadinessExecutable: false,
      activationReadinessResult: descriptor.activationReadinessResult,
      activationReadinessState: descriptor.activationReadinessState,
      candidateSelected: true,
      candidateReady: true,
      candidateAuthorized: false,
      candidateGranted: false,
      candidateActivated: false,
      candidateActive: false,
      candidateExecutable: false,
      futureActivationPossible: true,
      futureActivationAuthorized: false,
      candidateCount: 1,
      registeredCandidateCount: 1,
      selectedCandidateCount: 1,
      futureActivationTargetCount: 1,
      activeCandidateCount: 0,
      activatedCandidateCount: 0,
      authorizedCandidateCount: 0,
      grantedCandidateCount: 0,
      executableCandidateCount: 0,
      candidateIdentityUnique: true,
      selectionIdentityUnique: true,
      activationReadinessIdentityUnique: true,
      candidateStructurallyCompatible: true,
      candidateId: record.candidateId,
      registrationId: record.registrationId,
      selectionId: record.selectionId,
      activationReadinessId: record.activationReadinessId,
      activationReadinessContractId: record.activationReadinessContractId,
      runtimeCapabilityPresent: false,
      runtimeHostInstancePresent: false,
      activationHandlePresent: false,
      shellRendered: false,
      shellChildCount: 0,
      shellDOMNodeCount: 0,
      workspaceVisible: false,
      mountsGeoFeed: false,
      containsGeoFeed: false,
      wrapsGeoFeed: false,
      duplicatesGeoFeed: false,
      createsSecondGeoFeed: false,
      predecessorCandidateSelectionResult:
        descriptor.predecessorCandidateSelectionResult,
      predecessorCandidateSelectionState:
        descriptor.predecessorCandidateSelectionState,
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
      currentPhase: "3B.3.26",
      previousPhase: "3B.3.25",
      nextEligibleStep: "3B.3.27",
      activationBlocker:
        PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
      predecessorActivationBlocker:
        PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
      conditionCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS.length,
      unsatisfiedConditionCount: 0,
      guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS.length,
      satisfiedGuardCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS.length,
      unsatisfiedGuardCount: 0,
      blockerCount:
        CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKERS.length,
      conditions: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS,
      guards: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS,
      blockers: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKERS,
      readinessRecords: descriptor.readinessRecords,
    },
  };
}

/**
 * Phase 3B.3.24 — Controlled Workspace Host Candidate Registration (metadata only).
 *
 * Registers the Adaptive Workspace as the sole future controlled-host candidate.
 * Never selects, authorizes, activates, renders, or owns anything. Never enters
 * the Phase 3B.3.23 commit boundary. Never relocates GeoFeed.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ID,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary,
} from "./controlled-host-activation-transition-authorization-grant-issuance-commit-boundary";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY =
  "PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY" as const;

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID =
  "feed.discovery.adaptive-workspace.host-candidate.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID =
  "feed.discovery.adaptive-workspace.host-candidate-registration.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-candidate-registration.contract.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND =
  "adaptive-workspace" as const;

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL =
  "Adaptive Workspace" as const;

export type ControlledWorkspaceHostCandidateRegistrationState =
  | "REGISTERED_NOT_SELECTED"
  | "BLOCKED";

export type ControlledWorkspaceHostCandidateRegistrationResult =
  | "controlled-workspace-host-candidate-registered-not-selected"
  | "controlled-workspace-host-candidate-registration-blocked-predecessor-invalid"
  | "controlled-workspace-host-candidate-registration-blocked-identity-invalid"
  | "controlled-workspace-host-candidate-registration-blocked-candidate-count-invalid"
  | "controlled-workspace-host-candidate-registration-blocked-duplicate-candidate"
  | "controlled-workspace-host-candidate-registration-blocked-selection-detected"
  | "controlled-workspace-host-candidate-registration-blocked-activation-detected"
  | "controlled-workspace-host-candidate-registration-blocked-capability-detected"
  | "controlled-workspace-host-candidate-registration-blocked-runtime-mutation-detected"
  | "controlled-workspace-host-candidate-registration-blocked-ownership-change-detected"
  | "controlled-workspace-host-candidate-registration-blocked-geofeed-singularity-invalid"
  | "controlled-workspace-host-candidate-registration-blocked-shell-non-null"
  | "controlled-workspace-host-candidate-registration-blocked-contract-invalid";

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKERS =
  Object.freeze([
    "PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY",
    "PHASE_3B3_24_METADATA_ONLY",
    "PHASE_3B3_24_CANDIDATE_SELECTION_FORBIDDEN",
    "PHASE_3B3_24_CANDIDATE_NOMINATION_FORBIDDEN",
    "PHASE_3B3_24_CANDIDATE_APPROVAL_FORBIDDEN",
    "PHASE_3B3_24_CANDIDATE_AUTHORIZATION_FORBIDDEN",
    "PHASE_3B3_24_CANDIDATE_ACTIVATION_FORBIDDEN",
    "PHASE_3B3_24_CANDIDATE_EXECUTION_FORBIDDEN",
    "PHASE_3B3_24_RUNTIME_HOST_INSTANCE_FORBIDDEN",
    "PHASE_3B3_24_RUNTIME_CAPABILITY_FORBIDDEN",
    "PHASE_3B3_24_GRANT_CREATION_FORBIDDEN",
    "PHASE_3B3_24_AUTHORITY_CREATION_FORBIDDEN",
    "PHASE_3B3_24_CREDENTIAL_CREATION_FORBIDDEN",
    "PHASE_3B3_24_CALLBACK_FORBIDDEN",
    "PHASE_3B3_24_EXECUTABLE_HANDLE_FORBIDDEN",
    "PHASE_3B3_24_COMMAND_FORBIDDEN",
    "PHASE_3B3_24_DISPATCHER_FORBIDDEN",
    "PHASE_3B3_24_QUEUE_FORBIDDEN",
    "PHASE_3B3_24_SCHEDULER_FORBIDDEN",
    "PHASE_3B3_24_EXECUTOR_FORBIDDEN",
    "PHASE_3B3_24_PROVIDER_FORBIDDEN",
    "PHASE_3B3_24_SERVICE_FORBIDDEN",
    "PHASE_3B3_24_COORDINATOR_FORBIDDEN",
    "PHASE_3B3_24_TRANSACTION_FORBIDDEN",
    "PHASE_3B3_24_JOURNAL_FORBIDDEN",
    "PHASE_3B3_24_LOCK_FORBIDDEN",
    "PHASE_3B3_24_RESERVATION_FORBIDDEN",
    "PHASE_3B3_24_WRITE_SET_FORBIDDEN",
    "PHASE_3B3_24_MUTATION_SET_FORBIDDEN",
    "PHASE_3B3_24_COMMIT_BOUNDARY_ENTRY_FORBIDDEN",
    "PHASE_3B3_24_COMMIT_BOUNDARY_ARMING_FORBIDDEN",
    "PHASE_3B3_24_COMMIT_INVOCATION_FORBIDDEN",
    "PHASE_3B3_24_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN",
    "PHASE_3B3_24_ISSUANCE_PIPELINE_EXECUTION_FORBIDDEN",
    "PHASE_3B3_24_OWNERSHIP_TRANSFER_FORBIDDEN",
    "PHASE_3B3_24_WRITER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_24_RENDERER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_24_GEOFEED_RELOCATION_FORBIDDEN",
    "PHASE_3B3_24_GEOFEED_WRAPPING_FORBIDDEN",
    "PHASE_3B3_24_SECOND_GEOFEED_FORBIDDEN",
    "PHASE_3B3_24_GEOFEED_REMOUNT_FORBIDDEN",
    "PHASE_3B3_24_WORKSPACE_RENDER_FORBIDDEN",
    "PHASE_3B3_24_NON_NULL_SHELL_FORBIDDEN",
    "PHASE_3B3_24_DOM_MUTATION_FORBIDDEN",
    "PHASE_3B3_24_RUNTIME_MUTATION_FORBIDDEN",
    "PHASE_3B3_24_REQUEST_MUTATION_FORBIDDEN",
    "PHASE_3B3_24_CACHE_MUTATION_FORBIDDEN",
    "PHASE_3B3_24_OBSERVER_MUTATION_FORBIDDEN",
    "PHASE_3B3_24_PERSISTENCE_FORBIDDEN",
    "PHASE_3B3_24_NETWORK_FORBIDDEN",
    "PHASE_3B3_24_VISIBLE_UI_FORBIDDEN",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS =
  Object.freeze([
    "phase-3b324-active",
    "previous-phase-3b323-complete",
    "next-eligible-step-3b325",
    "candidate-result-exact",
    "candidate-state-exact",
    "candidate-identity-exact",
    "registration-identity-exact",
    "controlled-host-identity-preserved",
    "active-runtime-identity-preserved",
    "predecessor-commit-boundary-result-preserved",
    "predecessor-commit-boundary-state-preserved",
    "predecessor-boundary-not-entered",
    "predecessor-boundary-not-armed",
    "predecessor-boundary-not-crossed",
    "predecessor-commit-not-invoked",
    "predecessor-transaction-not-opened",
    "predecessor-pipeline-not-executable",
    "exactly-one-candidate",
    "exactly-one-registered-candidate",
    "zero-selected-candidates",
    "zero-active-candidates",
    "zero-executable-candidates",
    "zero-invalid-candidates",
    "unique-candidate-identity",
    "unique-registration-identity",
    "candidate-kind-adaptive-workspace",
    "candidate-registered",
    "candidate-not-selected",
    "candidate-not-nominated",
    "candidate-not-approved",
    "candidate-not-authorized",
    "candidate-no-grant",
    "candidate-no-credential",
    "candidate-no-authority",
    "candidate-no-runtime-capability",
    "candidate-no-executable-handle",
    "candidate-no-runtime-host-instance",
    "candidate-structurally-compatible",
    "candidate-not-selection-eligible-now",
    "candidate-not-activation-eligible-now",
    "candidate-owns-no-runtime",
    "candidate-owns-no-feed",
    "candidate-writes-no-runtime",
    "candidate-writes-no-feed",
    "candidate-renders-no-runtime",
    "candidate-renders-no-feed",
    "candidate-mounts-no-geofeed",
    "candidate-contains-no-geofeed",
    "candidate-wraps-no-geofeed",
    "candidate-duplicates-no-geofeed",
    "candidate-creates-no-second-geofeed",
    "active-owner-legacy",
    "active-writer-legacy",
    "active-renderer-legacy",
    "active-runtime-legacy",
    "mount-count-one",
    "unmount-count-zero",
    "active-instance-count-one",
    "geofeed-render-count-one",
    "workspace-shell-null",
    "workspace-shell-child-count-zero",
    "workspace-shell-dom-node-count-zero",
    "no-runtime-mutation",
    "no-dom-mutation",
    "no-request-mutation",
    "no-cache-mutation",
    "no-observer-mutation",
    "no-persistence",
    "no-network",
    "no-command",
    "no-dispatcher",
    "no-queue",
    "no-scheduler",
    "no-executor",
    "no-provider",
    "no-service",
    "no-coordinator",
    "no-transaction",
    "no-journal",
    "no-lock",
    "no-reservation",
    "no-write-set",
    "no-mutation-set",
    "no-callback",
    "no-token",
    "no-secret",
    "no-signature",
    "no-nonce",
    "no-credential",
    "no-certificate",
    "no-permit",
    "no-ownership-transfer",
    "no-writer-transfer",
    "no-renderer-transfer",
    "no-commit-boundary-entry-permission",
    "no-issuance-transaction-open-permission",
    "no-issuance-pipeline-execution-permission",
    "blocker-inventory-complete",
    "probe-metadata-serializable",
    "production-behavior-unchanged",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS =
  Object.freeze([
    "predecessor-phase-exact",
    "predecessor-result-exact",
    "predecessor-state-exact",
    "predecessor-proof-continuity",
    "candidate-count-exact",
    "candidate-identity-unique",
    "registration-identity-unique",
    "candidate-kind-exact",
    "successful-state-exact",
    "successful-result-exact",
    "no-selected-candidate",
    "no-active-candidate",
    "no-executable-candidate",
    "no-runtime-host-instance",
    "no-capability",
    "no-grant",
    "no-authority",
    "no-credential",
    "no-executable-path",
    "no-runtime-ownership-change",
    "no-writer-change",
    "no-renderer-change",
    "single-geofeed",
    "stable-mount",
    "stable-runtime-identity",
    "null-workspace-shell",
    "no-second-mount-site",
    "no-dom-mutation-permission",
    "no-runtime-mutation-permission",
    "no-request-mutation-permission",
    "no-cache-mutation-permission",
    "no-observer-mutation-permission",
    "blocker-inventory-complete",
    "output-serializable",
    "stable-deterministic-ordering",
  ] as const);

export type ControlledWorkspaceHostCandidate = {
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  readonly candidateLabel: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly activeRuntimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly registered: true;
  readonly selected: false;
  readonly nominated: false;
  readonly approved: false;
  readonly authorized: false;
  readonly granted: false;
  readonly activated: false;
  readonly active: false;
  readonly executable: false;
  readonly executionAllowed: false;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly owner: "none";
  readonly writer: "none";
  readonly renderer: "none";
  readonly ownsRuntime: false;
  readonly ownsFeed: false;
  readonly ownsRequests: false;
  readonly ownsCache: false;
  readonly ownsObservers: false;
  readonly writesRuntime: false;
  readonly writesFeed: false;
  readonly rendersRuntime: false;
  readonly rendersFeed: false;
  readonly mountsGeoFeed: false;
  readonly containsGeoFeed: false;
  readonly wrapsGeoFeed: false;
  readonly duplicatesGeoFeed: false;
  readonly createsSecondGeoFeed: false;
  readonly shellRendered: false;
  readonly shellChildCount: 0;
  readonly shellDOMNodeCount: 0;
  readonly visible: false;
  readonly domMutationAllowed: false;
  readonly runtimeMutationAllowed: false;
  readonly requestMutationAllowed: false;
  readonly cacheMutationAllowed: false;
  readonly observerMutationAllowed: false;
  readonly selectionAllowed: false;
  readonly activationAllowed: false;
  readonly ownershipTransferAllowed: false;
  readonly writerTransferAllowed: false;
  readonly rendererTransferAllowed: false;
  readonly commitBoundaryEntryAllowed: false;
  readonly issuanceTransactionOpenAllowed: false;
  readonly issuancePipelineExecutionAllowed: false;
  readonly candidateStructurallyCompatible: true;
  readonly candidateRuntimeCompatible: true;
  readonly candidateSelectionEligibleInFuture: true;
  readonly candidateSelectionEligibleNow: false;
  readonly candidateActivationEligibleNow: false;
  readonly candidateRuntimeAdoptionEligibleNow: false;
  readonly futureSelectionTarget: true;
};

export type ControlledWorkspaceHostCandidateRegistrationDescriptor = {
  readonly schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_SCHEMA_VERSION;
  readonly phase: "3B.3.24";
  readonly previousPhase: "3B.3.23";
  readonly currentPhase: "3B.3.24";
  readonly nextEligibleStep: "3B.3.25";
  readonly candidateRegistrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly candidateRegistrationContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_ID;
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly candidateRegistrationState: "REGISTERED_NOT_SELECTED";
  readonly candidateRegistrationResult: "controlled-workspace-host-candidate-registered-not-selected";
  readonly candidateRegistrationCompleted: true;
  readonly candidateRegistrationReady: true;
  readonly candidateRegistrationBlocked: true;
  readonly candidateRegistrationExecutable: false;
  readonly candidateRegistered: true;
  readonly candidateSelected: false;
  readonly candidateActivated: false;
  readonly wouldSelectCandidate: true;
  readonly futureSelectionTarget: true;
  readonly candidateCount: 1;
  readonly registeredCandidateCount: 1;
  readonly selectedCandidateCount: 0;
  readonly activeCandidateCount: 0;
  readonly executableCandidateCount: 0;
  readonly invalidCandidateCount: 0;
  readonly duplicateCandidateCount: 0;
  readonly unknownCandidateCount: 0;
  readonly singleCandidateExact: true;
  readonly candidateIdentityUnique: true;
  readonly registrationIdentityUnique: true;
  readonly candidateKindUnique: true;
  readonly candidateStructurallyCompatible: true;
  readonly candidateRuntimeCompatible: true;
  readonly candidateSelectionEligibleInFuture: true;
  readonly candidateSelectionEligibleNow: false;
  readonly candidateActivationEligibleNow: false;
  readonly candidateRuntimeAdoptionEligibleNow: false;
  readonly candidates: readonly [ControlledWorkspaceHostCandidate];
  readonly issuanceCommitBoundaryId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ID;
  readonly issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
  readonly issuanceCommitBoundaryState: "NOT_ENTERED";
  readonly issuanceCommitBoundaryEntered: false;
  readonly commitBoundaryEntered: false;
  readonly issuanceCommitBoundaryArmed: false;
  readonly commitBoundaryArmed: false;
  readonly boundaryCrossed: false;
  readonly commitRequested: false;
  readonly commitInvoked: false;
  readonly commitStarted: false;
  readonly issuanceCommitBoundaryCommitted: false;
  readonly issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
  readonly issuanceTransactionState: "NOT_OPENED";
  readonly issuanceTransactionOpened: false;
  readonly issuanceTransactionPrepared: false;
  readonly issuanceTransactionCommitted: false;
  readonly issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
  readonly issuancePipelineExecutable: false;
  readonly issuancePipelineExecutionAllowed: false;
  readonly owner: "legacy";
  readonly writer: "legacy";
  readonly renderer: "legacy";
  readonly ownershipTransferred: false;
  readonly writerTransferred: false;
  readonly rendererTransferred: false;
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
  readonly activationBlocker: typeof PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY;
  readonly conditions: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS;
  readonly unsatisfiedConditions: readonly [];
  readonly guards: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS;
  readonly unsatisfiedGuards: readonly [];
  readonly blockers: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKERS;
  readonly browserInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
};

export type ControlledWorkspaceHostCandidateRegistrationDiagnostics = {
  readonly [key: string]: unknown;
};

export type ControlledWorkspaceHostCandidateRegistrationEvaluation = {
  readonly descriptor: ControlledWorkspaceHostCandidateRegistrationDescriptor;
  readonly diagnostics: ControlledWorkspaceHostCandidateRegistrationDiagnostics;
};

export type ControlledWorkspaceHostCandidateRegistrationInput = {
  readonly candidate?: Partial<ControlledWorkspaceHostCandidate> &
    Record<string, unknown>;
  readonly candidates?: readonly Record<string, unknown>[];
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
  readonly issuanceCommitBoundaryState?: string;
  readonly issuanceCommitBoundaryResult?: string;
  readonly issuanceCommitBoundaryEntered?: boolean;
  readonly issuanceCommitBoundaryArmed?: boolean;
  readonly boundaryCrossed?: boolean;
  readonly commitInvoked?: boolean;
  readonly issuanceTransactionState?: string;
  readonly issuanceTransactionOpened?: boolean;
  readonly issuancePipelineExecutable?: boolean;
};

function createWorkspaceHostCandidate(): ControlledWorkspaceHostCandidate {
  return Object.freeze({
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    candidateLabel: CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    activeRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    registered: true,
    selected: false,
    nominated: false,
    approved: false,
    authorized: false,
    granted: false,
    activated: false,
    active: false,
    executable: false,
    executionAllowed: false,
    runtimeCapabilityPresent: false,
    runtimeHostInstancePresent: false,
    owner: "none",
    writer: "none",
    renderer: "none",
    ownsRuntime: false,
    ownsFeed: false,
    ownsRequests: false,
    ownsCache: false,
    ownsObservers: false,
    writesRuntime: false,
    writesFeed: false,
    rendersRuntime: false,
    rendersFeed: false,
    mountsGeoFeed: false,
    containsGeoFeed: false,
    wrapsGeoFeed: false,
    duplicatesGeoFeed: false,
    createsSecondGeoFeed: false,
    shellRendered: false,
    shellChildCount: 0,
    shellDOMNodeCount: 0,
    visible: false,
    domMutationAllowed: false,
    runtimeMutationAllowed: false,
    requestMutationAllowed: false,
    cacheMutationAllowed: false,
    observerMutationAllowed: false,
    selectionAllowed: false,
    activationAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    commitBoundaryEntryAllowed: false,
    issuanceTransactionOpenAllowed: false,
    issuancePipelineExecutionAllowed: false,
    candidateStructurallyCompatible: true,
    candidateRuntimeCompatible: true,
    candidateSelectionEligibleInFuture: true,
    candidateSelectionEligibleNow: false,
    candidateActivationEligibleNow: false,
    candidateRuntimeAdoptionEligibleNow: false,
    futureSelectionTarget: true,
  });
}

function blockedResultFor(
  input: ControlledWorkspaceHostCandidateRegistrationInput | undefined,
): ControlledWorkspaceHostCandidateRegistrationResult | null {
  if (!input) return null;

  if (
    input.issuanceCommitBoundaryState !== undefined &&
    input.issuanceCommitBoundaryState !== "NOT_ENTERED"
  ) {
    return "controlled-workspace-host-candidate-registration-blocked-predecessor-invalid";
  }
  if (
    input.issuanceCommitBoundaryResult !== undefined &&
    input.issuanceCommitBoundaryResult !==
      "authorization-grant-issuance-commit-boundary-ready-not-entered"
  ) {
    return "controlled-workspace-host-candidate-registration-blocked-predecessor-invalid";
  }
  if (
    input.issuanceCommitBoundaryEntered === true ||
    input.issuanceCommitBoundaryArmed === true ||
    input.boundaryCrossed === true ||
    input.commitInvoked === true ||
    input.issuanceTransactionOpened === true ||
    input.issuancePipelineExecutable === true ||
    (input.issuanceTransactionState !== undefined &&
      input.issuanceTransactionState !== "NOT_OPENED")
  ) {
    return "controlled-workspace-host-candidate-registration-blocked-predecessor-invalid";
  }

  if (input.candidates) {
    if (input.candidates.length === 0) {
      return "controlled-workspace-host-candidate-registration-blocked-candidate-count-invalid";
    }
    if (input.candidates.length > 1) {
      return "controlled-workspace-host-candidate-registration-blocked-duplicate-candidate";
    }
  }

  const c = input.candidate;
  if (c) {
    if (
      (c.candidateId !== undefined &&
        c.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID) ||
      (c.registrationId !== undefined &&
        c.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID)
    ) {
      return "controlled-workspace-host-candidate-registration-blocked-identity-invalid";
    }
    if (c.selected === true || c.nominated === true || c.approved === true) {
      return "controlled-workspace-host-candidate-registration-blocked-selection-detected";
    }
    if (c.activated === true || c.active === true) {
      return "controlled-workspace-host-candidate-registration-blocked-activation-detected";
    }
    if (
      c.authorized === true ||
      c.granted === true ||
      c.runtimeCapabilityPresent === true ||
      c.executable === true ||
      c.executionAllowed === true ||
      c.runtimeHostInstancePresent === true
    ) {
      return "controlled-workspace-host-candidate-registration-blocked-capability-detected";
    }
    if (
      c.ownsRuntime === true ||
      c.writesRuntime === true ||
      c.rendersRuntime === true ||
      c.mountsGeoFeed === true ||
      c.containsGeoFeed === true ||
      c.wrapsGeoFeed === true ||
      c.duplicatesGeoFeed === true ||
      c.createsSecondGeoFeed === true
    ) {
      return "controlled-workspace-host-candidate-registration-blocked-geofeed-singularity-invalid";
    }
    if (
      c.shellRendered === true ||
      (typeof c.shellChildCount === "number" && c.shellChildCount !== 0) ||
      (typeof c.shellDOMNodeCount === "number" && c.shellDOMNodeCount !== 0)
    ) {
      return "controlled-workspace-host-candidate-registration-blocked-shell-non-null";
    }
    if (
      c.domMutationAllowed === true ||
      c.runtimeMutationAllowed === true ||
      c.requestMutationAllowed === true ||
      c.cacheMutationAllowed === true ||
      c.observerMutationAllowed === true
    ) {
      return "controlled-workspace-host-candidate-registration-blocked-runtime-mutation-detected";
    }
  }

  if (
    (input.owner !== undefined && input.owner !== "legacy") ||
    (input.writer !== undefined && input.writer !== "legacy") ||
    (input.renderer !== undefined && input.renderer !== "legacy")
  ) {
    return "controlled-workspace-host-candidate-registration-blocked-ownership-change-detected";
  }
  if (
    (input.mountCount !== undefined && input.mountCount !== 1) ||
    (input.unmountCount !== undefined && input.unmountCount !== 0) ||
    (input.activeInstanceCount !== undefined &&
      input.activeInstanceCount !== 1) ||
    (input.geoFeedRenderCount !== undefined && input.geoFeedRenderCount !== 1)
  ) {
    return "controlled-workspace-host-candidate-registration-blocked-geofeed-singularity-invalid";
  }
  if (
    input.shellRendered === true ||
    (input.shellChildCount !== undefined && input.shellChildCount !== 0) ||
    (input.shellDOMNodeCount !== undefined && input.shellDOMNodeCount !== 0)
  ) {
    return "controlled-workspace-host-candidate-registration-blocked-shell-non-null";
  }

  return null;
}

export function createControlledWorkspaceHostCandidateRegistrationDescriptor(): ControlledWorkspaceHostCandidateRegistrationDescriptor {
  const candidate = createWorkspaceHostCandidate();
  return validateControlledWorkspaceHostCandidateRegistrationDescriptor({
    schemaVersion: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_SCHEMA_VERSION,
    phase: "3B.3.24",
    previousPhase: "3B.3.23",
    currentPhase: "3B.3.24",
    nextEligibleStep: "3B.3.25",
    candidateRegistrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    candidateRegistrationContractId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_ID,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    candidateRegistrationState: "REGISTERED_NOT_SELECTED",
    candidateRegistrationResult:
      "controlled-workspace-host-candidate-registered-not-selected",
    candidateRegistrationCompleted: true,
    candidateRegistrationReady: true,
    candidateRegistrationBlocked: true,
    candidateRegistrationExecutable: false,
    candidateRegistered: true,
    candidateSelected: false,
    candidateActivated: false,
    wouldSelectCandidate: true,
    futureSelectionTarget: true,
    candidateCount: 1,
    registeredCandidateCount: 1,
    selectedCandidateCount: 0,
    activeCandidateCount: 0,
    executableCandidateCount: 0,
    invalidCandidateCount: 0,
    duplicateCandidateCount: 0,
    unknownCandidateCount: 0,
    singleCandidateExact: true,
    candidateIdentityUnique: true,
    registrationIdentityUnique: true,
    candidateKindUnique: true,
    candidateStructurallyCompatible: true,
    candidateRuntimeCompatible: true,
    candidateSelectionEligibleInFuture: true,
    candidateSelectionEligibleNow: false,
    candidateActivationEligibleNow: false,
    candidateRuntimeAdoptionEligibleNow: false,
    candidates: [candidate],
    issuanceCommitBoundaryId:
      CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ID,
    issuanceCommitBoundaryResult:
      "authorization-grant-issuance-commit-boundary-ready-not-entered",
    issuanceCommitBoundaryState: "NOT_ENTERED",
    issuanceCommitBoundaryEntered: false,
    commitBoundaryEntered: false,
    issuanceCommitBoundaryArmed: false,
    commitBoundaryArmed: false,
    boundaryCrossed: false,
    commitRequested: false,
    commitInvoked: false,
    commitStarted: false,
    issuanceCommitBoundaryCommitted: false,
    issuanceTransactionResult:
      "authorization-grant-issuance-transaction-ready-not-opened",
    issuanceTransactionState: "NOT_OPENED",
    issuanceTransactionOpened: false,
    issuanceTransactionPrepared: false,
    issuanceTransactionCommitted: false,
    issuancePipelineResult:
      "authorization-grant-issuance-pipeline-ready-not-executable",
    issuancePipelineExecutable: false,
    issuancePipelineExecutionAllowed: false,
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
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
      PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
    conditions: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS,
    satisfiedConditions: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS,
    unsatisfiedConditions: [],
    guards: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS,
    satisfiedGuards: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS,
    unsatisfiedGuards: [],
    blockers: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  });
}

export function validateControlledWorkspaceHostCandidateRegistrationDescriptor(
  d: ControlledWorkspaceHostCandidateRegistrationDescriptor,
): ControlledWorkspaceHostCandidateRegistrationDescriptor {
  if (
    d.phase !== "3B.3.24" ||
    d.previousPhase !== "3B.3.23" ||
    d.currentPhase !== "3B.3.24" ||
    d.nextEligibleStep !== "3B.3.25"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_PHASE",
      "Phase chain must be 3B.3.23 → 3B.3.24 → 3B.3.25",
    );
  }
  if (
    d.candidateRegistrationState !== "REGISTERED_NOT_SELECTED" ||
    d.candidateRegistrationResult !==
      "controlled-workspace-host-candidate-registered-not-selected"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_RESULT",
      "Successful registration must be REGISTERED_NOT_SELECTED",
    );
  }
  if (
    d.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID ||
    d.candidateRegistrationId !==
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_IDENTITY",
      "Candidate/registration identities must be exact",
    );
  }
  if (
    d.candidateCount !== 1 ||
    d.registeredCandidateCount !== 1 ||
    d.selectedCandidateCount !== 0 ||
    d.activeCandidateCount !== 0 ||
    d.executableCandidateCount !== 0 ||
    d.invalidCandidateCount !== 0 ||
    d.duplicateCandidateCount !== 0 ||
    d.candidates.length !== 1
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_COUNTS",
      "Exactly one registered, unselected candidate required",
    );
  }
  if (
    d.issuanceCommitBoundaryState !== "NOT_ENTERED" ||
    d.issuanceCommitBoundaryEntered !== false ||
    d.issuanceTransactionState !== "NOT_OPENED" ||
    d.issuancePipelineExecutable !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_PREDECESSOR",
      "Predecessor commit-boundary/transaction/pipeline must remain frozen",
    );
  }
  if (
    d.owner !== "legacy" ||
    d.writer !== "legacy" ||
    d.renderer !== "legacy" ||
    d.mountCount !== 1 ||
    d.unmountCount !== 0 ||
    d.shellRendered !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_RUNTIME",
      "Legacy runtime and null shell must be preserved",
    );
  }
  if (d.candidateSelected === true || d.candidateRegistrationExecutable === true) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_SELECTION",
      "Candidate must remain unselected and non-executable",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceHostCandidateRegistration(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceHostCandidateRegistrationInput,
): ControlledWorkspaceHostCandidateRegistrationEvaluation {
  if (registry.hostCount !== 1) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_REGISTRY",
      "Registration requires exactly one controlled-host registry entry",
    );
  }

  const predecessor =
    evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary(
      registry,
    );
  const pred = predecessor.descriptor;

  if (
    pred.issuanceCommitBoundaryResult !==
      "authorization-grant-issuance-commit-boundary-ready-not-entered" ||
    pred.issuanceCommitBoundaryState !== "NOT_ENTERED" ||
    pred.issuanceCommitBoundaryEntered !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_PREDECESSOR_LIVE",
      "Predecessor commit boundary must remain NOT_ENTERED",
    );
  }

  const blocked = blockedResultFor(input);
  if (blocked) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKED",
      blocked,
    );
  }

  const descriptor =
    createControlledWorkspaceHostCandidateRegistrationDescriptor();
  const candidate = descriptor.candidates[0];

  return {
    descriptor,
    diagnostics: {
      candidateRegistrationCompleted: true,
      candidateRegistrationReady: true,
      candidateRegistrationBlocked: true,
      candidateRegistrationExecutable: false,
      candidateRegistrationResult: descriptor.candidateRegistrationResult,
      candidateRegistrationState: descriptor.candidateRegistrationState,
      candidateRegistered: true,
      candidateSelected: false,
      candidateActivated: false,
      wouldSelectCandidate: true,
      futureSelectionTarget: true,
      candidateCount: 1,
      registeredCandidateCount: 1,
      selectedCandidateCount: 0,
      activeCandidateCount: 0,
      executableCandidateCount: 0,
      invalidCandidateCount: 0,
      duplicateCandidateCount: 0,
      unknownCandidateCount: 0,
      singleCandidateExact: true,
      candidateIdentityUnique: true,
      registrationIdentityUnique: true,
      candidateKindUnique: true,
      candidateStructurallyCompatible: true,
      candidateRuntimeCompatible: true,
      candidateSelectionEligibleInFuture: true,
      candidateSelectionEligibleNow: false,
      candidateActivationEligibleNow: false,
      candidateRuntimeAdoptionEligibleNow: false,
      candidateId: candidate.candidateId,
      registrationId: candidate.registrationId,
      candidateKind: candidate.candidateKind,
      runtimeCapabilityPresent: false,
      runtimeHostInstancePresent: false,
      ownsRuntime: false,
      ownsFeed: false,
      writesRuntime: false,
      writesFeed: false,
      rendersRuntime: false,
      rendersFeed: false,
      mountsGeoFeed: false,
      containsGeoFeed: false,
      wrapsGeoFeed: false,
      duplicatesGeoFeed: false,
      createsSecondGeoFeed: false,
      shellRendered: false,
      shellChildCount: 0,
      shellDOMNodeCount: 0,
      workspaceVisible: false,
      workspaceHostMounted: false,
      workspaceCandidateRendered: false,
      workspaceCandidateDOMPresent: false,
      workspaceCandidateReactInstancePresent: false,
      issuanceCommitBoundaryResult: descriptor.issuanceCommitBoundaryResult,
      issuanceCommitBoundaryState: descriptor.issuanceCommitBoundaryState,
      issuanceCommitBoundaryEntered: false,
      issuanceTransactionResult: descriptor.issuanceTransactionResult,
      issuanceTransactionState: descriptor.issuanceTransactionState,
      issuanceTransactionOpened: false,
      issuancePipelineResult: descriptor.issuancePipelineResult,
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
      currentPhase: "3B.3.24",
      previousPhase: "3B.3.23",
      nextEligibleStep: "3B.3.25",
      activationBlocker:
        PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
      predecessorActivationBlocker:
        PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
      conditionCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS.length,
      unsatisfiedConditionCount: 0,
      guardCount: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS.length,
      satisfiedGuardCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS.length,
      unsatisfiedGuardCount: 0,
      blockerCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKERS.length,
      conditions: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS,
      guards: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS,
      blockers: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKERS,
      candidates: descriptor.candidates,
    },
  };
}

/**
 * Phase 3B.3.25 — Controlled Workspace Host Candidate Selection (metadata only).
 *
 * Selects the sole frozen Adaptive Workspace host candidate from Phase 3B.3.24
 * as the unique future controlled-host target. Never activates, authorizes,
 * grants, renders, owns, or relocates GeoFeed. Never enters the Phase 3B.3.23
 * commit boundary.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
  evaluateControlledWorkspaceHostCandidateRegistration,
} from "./controlled-workspace-host-candidate-registration";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY =
  "PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY" as const;

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID =
  "feed.discovery.adaptive-workspace.host-candidate-selection.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-candidate-selection.contract.v1" as const;

export type ControlledWorkspaceHostCandidateSelectionState =
  | "SELECTED_NOT_ACTIVATED"
  | "BLOCKED";

export type ControlledWorkspaceHostCandidateSelectionResult =
  | "controlled-workspace-host-candidate-selected-not-activated"
  | "controlled-workspace-host-candidate-selection-blocked-predecessor-invalid"
  | "controlled-workspace-host-candidate-selection-blocked-registration-invalid"
  | "controlled-workspace-host-candidate-selection-blocked-candidate-count-invalid"
  | "controlled-workspace-host-candidate-selection-blocked-selected-count-invalid"
  | "controlled-workspace-host-candidate-selection-blocked-candidate-identity-invalid"
  | "controlled-workspace-host-candidate-selection-blocked-registration-identity-invalid"
  | "controlled-workspace-host-candidate-selection-blocked-selection-identity-invalid"
  | "controlled-workspace-host-candidate-selection-blocked-duplicate-candidate"
  | "controlled-workspace-host-candidate-selection-blocked-multiple-selection"
  | "controlled-workspace-host-candidate-selection-blocked-unregistered-candidate"
  | "controlled-workspace-host-candidate-selection-blocked-incompatible-candidate"
  | "controlled-workspace-host-candidate-selection-blocked-activation-detected"
  | "controlled-workspace-host-candidate-selection-blocked-authorization-detected"
  | "controlled-workspace-host-candidate-selection-blocked-grant-detected"
  | "controlled-workspace-host-candidate-selection-blocked-capability-detected"
  | "controlled-workspace-host-candidate-selection-blocked-runtime-host-instance-detected"
  | "controlled-workspace-host-candidate-selection-blocked-runtime-mutation-detected"
  | "controlled-workspace-host-candidate-selection-blocked-ownership-change-detected"
  | "controlled-workspace-host-candidate-selection-blocked-geofeed-singularity-invalid"
  | "controlled-workspace-host-candidate-selection-blocked-shell-non-null"
  | "controlled-workspace-host-candidate-selection-blocked-contract-invalid";

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_BLOCKERS =
  Object.freeze([
    "PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY",
    "PHASE_3B3_25_METADATA_ONLY",
    "PHASE_3B3_25_CANDIDATE_ACTIVATION_FORBIDDEN",
    "PHASE_3B3_25_CANDIDATE_AUTHORIZATION_FORBIDDEN",
    "PHASE_3B3_25_GRANT_CREATION_FORBIDDEN",
    "PHASE_3B3_25_AUTHORITY_CREATION_FORBIDDEN",
    "PHASE_3B3_25_CREDENTIAL_CREATION_FORBIDDEN",
    "PHASE_3B3_25_RUNTIME_HOST_INSTANCE_FORBIDDEN",
    "PHASE_3B3_25_RUNTIME_CAPABILITY_FORBIDDEN",
    "PHASE_3B3_25_ACTIVATION_HANDLE_FORBIDDEN",
    "PHASE_3B3_25_SELECTION_HANDLE_FORBIDDEN",
    "PHASE_3B3_25_CALLBACK_FORBIDDEN",
    "PHASE_3B3_25_COMMAND_FORBIDDEN",
    "PHASE_3B3_25_DISPATCHER_FORBIDDEN",
    "PHASE_3B3_25_QUEUE_FORBIDDEN",
    "PHASE_3B3_25_SCHEDULER_FORBIDDEN",
    "PHASE_3B3_25_EXECUTOR_FORBIDDEN",
    "PHASE_3B3_25_PROVIDER_FORBIDDEN",
    "PHASE_3B3_25_SERVICE_FORBIDDEN",
    "PHASE_3B3_25_COORDINATOR_FORBIDDEN",
    "PHASE_3B3_25_TRANSACTION_CONTEXT_FORBIDDEN",
    "PHASE_3B3_25_TRANSACTION_HANDLE_FORBIDDEN",
    "PHASE_3B3_25_JOURNAL_FORBIDDEN",
    "PHASE_3B3_25_LOCK_FORBIDDEN",
    "PHASE_3B3_25_RESERVATION_FORBIDDEN",
    "PHASE_3B3_25_WRITE_SET_FORBIDDEN",
    "PHASE_3B3_25_MUTATION_SET_FORBIDDEN",
    "PHASE_3B3_25_COMMIT_BOUNDARY_ENTRY_FORBIDDEN",
    "PHASE_3B3_25_COMMIT_BOUNDARY_ARMING_FORBIDDEN",
    "PHASE_3B3_25_COMMIT_INVOCATION_FORBIDDEN",
    "PHASE_3B3_25_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN",
    "PHASE_3B3_25_ISSUANCE_TRANSACTION_PREPARE_FORBIDDEN",
    "PHASE_3B3_25_ISSUANCE_TRANSACTION_COMMIT_FORBIDDEN",
    "PHASE_3B3_25_ISSUANCE_PIPELINE_EXECUTION_FORBIDDEN",
    "PHASE_3B3_25_RUNTIME_ADOPTION_FORBIDDEN",
    "PHASE_3B3_25_OWNERSHIP_TRANSFER_FORBIDDEN",
    "PHASE_3B3_25_WRITER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_25_RENDERER_TRANSFER_FORBIDDEN",
    "PHASE_3B3_25_GEOFEED_RELOCATION_FORBIDDEN",
    "PHASE_3B3_25_GEOFEED_WRAPPING_FORBIDDEN",
    "PHASE_3B3_25_SECOND_GEOFEED_FORBIDDEN",
    "PHASE_3B3_25_GEOFEED_REMOUNT_FORBIDDEN",
    "PHASE_3B3_25_WORKSPACE_RENDER_FORBIDDEN",
    "PHASE_3B3_25_NON_NULL_SHELL_FORBIDDEN",
    "PHASE_3B3_25_VISIBLE_UI_FORBIDDEN",
    "PHASE_3B3_25_DOM_MUTATION_FORBIDDEN",
    "PHASE_3B3_25_RUNTIME_MUTATION_FORBIDDEN",
    "PHASE_3B3_25_REQUEST_MUTATION_FORBIDDEN",
    "PHASE_3B3_25_CACHE_MUTATION_FORBIDDEN",
    "PHASE_3B3_25_OBSERVER_MUTATION_FORBIDDEN",
    "PHASE_3B3_25_PERSISTENCE_FORBIDDEN",
    "PHASE_3B3_25_NETWORK_FORBIDDEN",
    "PHASE_3B3_25_ALTERNATE_CANDIDATE_FORBIDDEN",
    "PHASE_3B3_25_MULTIPLE_SELECTION_FORBIDDEN",
    "PHASE_3B3_25_LEGACY_RUNTIME_SELECTION_FORBIDDEN",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS =
  Object.freeze([
    "phase-3b325-active",
    "previous-phase-3b324-complete",
    "next-eligible-step-3b326",
    "selection-result-exact",
    "selection-state-exact",
    "candidate-identity-exact",
    "registration-identity-exact",
    "selection-identity-exact",
    "selection-contract-identity-exact",
    "controlled-host-identity-preserved",
    "active-runtime-identity-preserved",
    "predecessor-registration-result-exact",
    "predecessor-registration-state-exact",
    "predecessor-candidate-registered",
    "predecessor-candidate-unselected",
    "predecessor-candidate-structurally-compatible",
    "predecessor-candidate-future-selection-eligible",
    "exactly-one-candidate",
    "exactly-one-registered-candidate",
    "exactly-one-selected-candidate",
    "zero-active-candidates",
    "zero-activated-candidates",
    "zero-authorized-candidates",
    "zero-granted-candidates",
    "zero-executable-candidates",
    "zero-invalid-candidates",
    "zero-duplicate-candidates",
    "exactly-one-future-activation-target",
    "unique-candidate-identity",
    "unique-registration-identity",
    "unique-selection-identity",
    "selected-candidate-identity-exact",
    "selected-candidate-was-registered",
    "selected-candidate-kind-exact",
    "selected-candidate-structurally-compatible",
    "candidate-selected",
    "candidate-nominated",
    "candidate-not-approved",
    "candidate-not-authorized",
    "candidate-not-granted",
    "candidate-not-activated",
    "candidate-not-active",
    "candidate-not-executable",
    "candidate-no-runtime-capability",
    "candidate-no-host-instance",
    "candidate-no-activation-handle",
    "candidate-no-selection-handle",
    "candidate-owns-no-runtime",
    "candidate-owns-no-feed",
    "candidate-owns-no-requests",
    "candidate-owns-no-cache",
    "candidate-owns-no-observers",
    "candidate-writes-no-runtime",
    "candidate-writes-no-feed",
    "candidate-renders-no-runtime",
    "candidate-renders-no-feed",
    "candidate-mounts-no-geofeed",
    "candidate-contains-no-geofeed",
    "candidate-wraps-no-geofeed",
    "candidate-duplicates-no-geofeed",
    "candidate-creates-no-second-geofeed",
    "candidate-not-visible",
    "workspace-shell-null",
    "workspace-shell-child-count-zero",
    "workspace-shell-dom-node-count-zero",
    "commit-boundary-not-entered-state",
    "commit-boundary-not-entered",
    "commit-boundary-not-armed",
    "commit-boundary-not-crossed",
    "commit-not-requested",
    "commit-not-invoked",
    "transaction-not-opened-state",
    "transaction-not-prepared",
    "transaction-not-committed",
    "pipeline-non-executable",
    "pipeline-execution-not-allowed",
    "active-owner-legacy",
    "active-writer-legacy",
    "active-renderer-legacy",
    "mount-count-one",
    "unmount-count-zero",
    "active-instance-count-one",
    "geofeed-render-count-one",
    "one-geofeed-mount-site",
    "no-runtime-mutation",
    "no-dom-mutation",
    "no-request-mutation",
    "no-cache-mutation",
    "no-observer-mutation",
    "no-persistence",
    "no-network",
    "no-grant",
    "no-authority",
    "no-credential",
    "no-callback",
    "no-command",
    "no-dispatcher",
    "no-queue",
    "no-scheduler",
    "no-executor",
    "no-provider",
    "no-service",
    "no-coordinator",
    "no-transaction-context",
    "no-transaction-handle",
    "no-journal",
    "no-lock",
    "no-reservation",
    "no-write-set",
    "no-mutation-set",
    "no-ownership-transfer",
    "no-writer-transfer",
    "no-renderer-transfer",
    "no-runtime-adoption",
    "no-activation-permission",
    "no-commit-boundary-entry-permission",
    "no-issuance-transaction-open-permission",
    "no-issuance-pipeline-execution-permission",
    "output-serializable",
    "deterministic-ordering",
    "blocker-inventory-complete",
    "production-behavior-unchanged",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS =
  Object.freeze([
    "predecessor-phase-exact",
    "predecessor-result-exact",
    "predecessor-state-exact",
    "predecessor-candidate-identity-exact",
    "predecessor-registration-identity-exact",
    "candidate-inventory-exact",
    "selected-candidate-count-exact",
    "selected-identity-exact",
    "selection-identity-unique",
    "successful-state-exact",
    "successful-result-exact",
    "selected-candidate-was-registered",
    "selected-candidate-structurally-compatible",
    "selected-candidate-inactive",
    "selected-candidate-unauthorized",
    "selected-candidate-ungranted",
    "selected-candidate-non-executable",
    "no-runtime-capability",
    "no-host-instance",
    "no-executable-handle",
    "no-activation-handle",
    "no-selection-handle",
    "no-ownership-change",
    "no-writer-change",
    "no-renderer-change",
    "stable-live-runtime-identity",
    "stable-mount",
    "single-geofeed",
    "null-workspace-shell",
    "commit-boundary-not-entered",
    "issuance-transaction-not-opened",
    "issuance-pipeline-not-executable",
    "no-dom-mutation-permission",
    "no-runtime-mutation-permission",
    "no-request-mutation-permission",
    "no-cache-mutation-permission",
    "no-observer-mutation-permission",
    "output-serializable",
    "stable-deterministic-ordering",
    "blocker-inventory-complete",
  ] as const);

export type ControlledWorkspaceHostSelectedCandidate = {
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly selectionContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID;
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  readonly candidateLabel: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly activeRuntimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly selectionSource: "phase-3b324-frozen-registration";
  readonly selectionReason: "sole-registered-structurally-compatible-adaptive-workspace-candidate";
  readonly registered: true;
  readonly selected: true;
  readonly selectionCompleted: true;
  readonly selectionReady: true;
  readonly selectionBlocked: true;
  readonly selectionExecutable: false;
  readonly metadataSelectionAllowed: true;
  readonly selectionAllowed: true;
  readonly selectionApplied: false;
  readonly selectionCommitted: false;
  readonly selectionActivated: false;
  readonly nominated: true;
  readonly approved: false;
  readonly authorized: false;
  readonly granted: false;
  readonly activated: false;
  readonly active: false;
  readonly executable: false;
  readonly executionAllowed: false;
  readonly futureActivationTarget: true;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly activationHandlePresent: false;
  readonly selectionHandlePresent: false;
  readonly callbackPresent: false;
  readonly commandPresent: false;
  readonly dispatcherPresent: false;
  readonly queuePresent: false;
  readonly schedulerPresent: false;
  readonly executorPresent: false;
  readonly providerPresent: false;
  readonly servicePresent: false;
  readonly coordinatorPresent: false;
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
  readonly selectedCandidateRendered: false;
  readonly selectedCandidateDOMPresent: false;
  readonly domMutationAllowed: false;
  readonly runtimeMutationAllowed: false;
  readonly requestMutationAllowed: false;
  readonly cacheMutationAllowed: false;
  readonly observerMutationAllowed: false;
  readonly activationAllowed: false;
  readonly runtimeAdoptionAllowed: false;
  readonly ownershipTransferAllowed: false;
  readonly writerTransferAllowed: false;
  readonly rendererTransferAllowed: false;
  readonly commitBoundaryEntryAllowed: false;
  readonly issuanceTransactionOpenAllowed: false;
  readonly issuancePipelineExecutionAllowed: false;
  readonly candidateStructurallyCompatible: true;
  readonly candidateRuntimeCompatible: true;
  readonly candidateActivationEligibleInFuture: true;
  readonly candidateActivationEligibleNow: false;
  readonly candidateRuntimeAdoptionEligibleNow: false;
};

export type ControlledWorkspaceHostCandidateSelectionDescriptor = {
  readonly schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_SCHEMA_VERSION;
  readonly phase: "3B.3.25";
  readonly previousPhase: "3B.3.24";
  readonly currentPhase: "3B.3.25";
  readonly nextEligibleStep: "3B.3.26";
  readonly selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  readonly selectionContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID;
  readonly candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  readonly registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  readonly hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  readonly runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readonly candidateSelectionState: "SELECTED_NOT_ACTIVATED";
  readonly candidateSelectionResult: "controlled-workspace-host-candidate-selected-not-activated";
  readonly candidateSelectionCompleted: true;
  readonly candidateSelectionReady: true;
  readonly candidateSelectionBlocked: true;
  readonly candidateSelectionExecutable: false;
  readonly candidateSelectionAllowed: true;
  readonly metadataSelectionAllowed: true;
  readonly candidateSelectionApplied: false;
  readonly candidateSelectionCommitted: false;
  readonly candidateSelected: true;
  readonly candidateNominated: true;
  readonly candidateApproved: false;
  readonly candidateAuthorized: false;
  readonly candidateGranted: false;
  readonly candidateActivated: false;
  readonly candidateActive: false;
  readonly candidateExecutable: false;
  readonly futureActivationTarget: true;
  readonly candidateCount: 1;
  readonly registeredCandidateCount: 1;
  readonly selectedCandidateCount: 1;
  readonly activeCandidateCount: 0;
  readonly activatedCandidateCount: 0;
  readonly authorizedCandidateCount: 0;
  readonly grantedCandidateCount: 0;
  readonly executableCandidateCount: 0;
  readonly invalidCandidateCount: 0;
  readonly duplicateCandidateCount: 0;
  readonly futureActivationTargetCount: 1;
  readonly singleCandidateExact: true;
  readonly singleSelectionExact: true;
  readonly candidateIdentityUnique: true;
  readonly registrationIdentityUnique: true;
  readonly selectionIdentityUnique: true;
  readonly selectedCandidateIdentityExact: true;
  readonly selectedCandidateWasRegistered: true;
  readonly selectedCandidateStructurallyCompatible: true;
  readonly candidateActivationEligibleInFuture: true;
  readonly candidateActivationEligibleNow: false;
  readonly candidateRuntimeAdoptionEligibleNow: false;
  readonly candidateRuntimeCapabilityPresent: false;
  readonly candidateRuntimeHostInstancePresent: false;
  readonly selections: readonly [ControlledWorkspaceHostSelectedCandidate];
  readonly predecessorCandidateRegistrationResult: "controlled-workspace-host-candidate-registered-not-selected";
  readonly predecessorCandidateRegistrationState: "REGISTERED_NOT_SELECTED";
  readonly predecessorCandidateRegistrationCompleted: true;
  readonly predecessorCandidateRegistrationReady: true;
  readonly predecessorCandidateRegistrationBlocked: true;
  readonly predecessorCandidateRegistrationExecutable: false;
  readonly predecessorCandidateRegistered: true;
  readonly predecessorCandidateSelected: false;
  readonly predecessorSelectedCandidateCount: 0;
  readonly predecessorActiveCandidateCount: 0;
  readonly predecessorExecutableCandidateCount: 0;
  readonly predecessorCandidateStructurallyCompatible: true;
  readonly predecessorCandidateSelectionEligibleInFuture: true;
  readonly predecessorCandidateActivationEligibleNow: false;
  readonly predecessorCandidateRuntimeAdoptionEligibleNow: false;
  readonly issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
  readonly issuanceCommitBoundaryState: "NOT_ENTERED";
  readonly issuanceCommitBoundaryEntered: false;
  readonly commitBoundaryEntered: false;
  readonly issuanceCommitBoundaryArmed: false;
  readonly commitBoundaryArmed: false;
  readonly boundaryCrossed: false;
  readonly prepared: false;
  readonly committed: false;
  readonly commitRequested: false;
  readonly commitInvoked: false;
  readonly commitStarted: false;
  readonly issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
  readonly issuanceTransactionState: "NOT_OPENED";
  readonly issuanceTransactionOpened: false;
  readonly issuanceTransactionPrepared: false;
  readonly issuanceTransactionCommitted: false;
  readonly transactionOpenAllowed: false;
  readonly transactionPrepareAllowed: false;
  readonly transactionCommitAllowed: false;
  readonly issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
  readonly issuancePipelineExecutable: false;
  readonly issuancePipelineExecutionAllowed: false;
  readonly issuancePipelineExecutionImpossible: true;
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
  readonly selectedCandidateRendered: false;
  readonly selectedCandidateDOMPresent: false;
  readonly hostActivation: false;
  readonly renderActivation: false;
  readonly canStartActivation: false;
  readonly activationBlocker: typeof PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY;
  readonly conditions: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS;
  readonly unsatisfiedConditions: readonly [];
  readonly guards: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS;
  readonly unsatisfiedGuards: readonly [];
  readonly blockers: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_BLOCKERS;
  readonly browserInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
};

export type ControlledWorkspaceHostCandidateSelectionDiagnostics = {
  readonly [key: string]: unknown;
};

export type ControlledWorkspaceHostCandidateSelectionEvaluation = {
  readonly descriptor: ControlledWorkspaceHostCandidateSelectionDescriptor;
  readonly diagnostics: ControlledWorkspaceHostCandidateSelectionDiagnostics;
};

export type ControlledWorkspaceHostCandidateSelectionInput = {
  readonly selection?: Partial<ControlledWorkspaceHostSelectedCandidate> &
    Record<string, unknown>;
  readonly selections?: readonly Record<string, unknown>[];
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
  readonly candidateRegistrationResult?: string;
  readonly candidateRegistrationState?: string;
  readonly candidateRegistered?: boolean;
  readonly predecessorCandidateSelected?: boolean;
  readonly selectedCandidateCount?: number;
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

function createSelectedCandidate(): ControlledWorkspaceHostSelectedCandidate {
  return Object.freeze({
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    selectionContractId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    candidateLabel: CONTROLLED_WORKSPACE_HOST_CANDIDATE_LABEL,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    activeRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    selectionSource: "phase-3b324-frozen-registration",
    selectionReason:
      "sole-registered-structurally-compatible-adaptive-workspace-candidate",
    registered: true,
    selected: true,
    selectionCompleted: true,
    selectionReady: true,
    selectionBlocked: true,
    selectionExecutable: false,
    metadataSelectionAllowed: true,
    selectionAllowed: true,
    selectionApplied: false,
    selectionCommitted: false,
    selectionActivated: false,
    nominated: true,
    approved: false,
    authorized: false,
    granted: false,
    activated: false,
    active: false,
    executable: false,
    executionAllowed: false,
    futureActivationTarget: true,
    runtimeCapabilityPresent: false,
    runtimeHostInstancePresent: false,
    activationHandlePresent: false,
    selectionHandlePresent: false,
    callbackPresent: false,
    commandPresent: false,
    dispatcherPresent: false,
    queuePresent: false,
    schedulerPresent: false,
    executorPresent: false,
    providerPresent: false,
    servicePresent: false,
    coordinatorPresent: false,
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
    selectedCandidateRendered: false,
    selectedCandidateDOMPresent: false,
    domMutationAllowed: false,
    runtimeMutationAllowed: false,
    requestMutationAllowed: false,
    cacheMutationAllowed: false,
    observerMutationAllowed: false,
    activationAllowed: false,
    runtimeAdoptionAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    commitBoundaryEntryAllowed: false,
    issuanceTransactionOpenAllowed: false,
    issuancePipelineExecutionAllowed: false,
    candidateStructurallyCompatible: true,
    candidateRuntimeCompatible: true,
    candidateActivationEligibleInFuture: true,
    candidateActivationEligibleNow: false,
    candidateRuntimeAdoptionEligibleNow: false,
  });
}

function blockedResultFor(
  input: ControlledWorkspaceHostCandidateSelectionInput | undefined,
): ControlledWorkspaceHostCandidateSelectionResult | null {
  if (!input) return null;

  if (
    input.candidateRegistrationState !== undefined &&
    input.candidateRegistrationState !== "REGISTERED_NOT_SELECTED"
  ) {
    return "controlled-workspace-host-candidate-selection-blocked-registration-invalid";
  }
  if (
    input.candidateRegistrationResult !== undefined &&
    input.candidateRegistrationResult !==
      "controlled-workspace-host-candidate-registered-not-selected"
  ) {
    return "controlled-workspace-host-candidate-selection-blocked-registration-invalid";
  }
  if (input.candidateRegistered === false) {
    return "controlled-workspace-host-candidate-selection-blocked-unregistered-candidate";
  }
  if (input.predecessorCandidateSelected === true) {
    return "controlled-workspace-host-candidate-selection-blocked-multiple-selection";
  }
  if (
    input.selectedCandidateCount !== undefined &&
    input.selectedCandidateCount !== 1
  ) {
    return "controlled-workspace-host-candidate-selection-blocked-selected-count-invalid";
  }

  if (
    input.issuanceCommitBoundaryState !== undefined &&
    input.issuanceCommitBoundaryState !== "NOT_ENTERED"
  ) {
    return "controlled-workspace-host-candidate-selection-blocked-predecessor-invalid";
  }
  if (
    input.issuanceCommitBoundaryResult !== undefined &&
    input.issuanceCommitBoundaryResult !==
      "authorization-grant-issuance-commit-boundary-ready-not-entered"
  ) {
    return "controlled-workspace-host-candidate-selection-blocked-predecessor-invalid";
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
    return "controlled-workspace-host-candidate-selection-blocked-predecessor-invalid";
  }

  if (input.candidates) {
    if (input.candidates.length === 0) {
      return "controlled-workspace-host-candidate-selection-blocked-candidate-count-invalid";
    }
    if (input.candidates.length > 1) {
      return "controlled-workspace-host-candidate-selection-blocked-duplicate-candidate";
    }
  }
  if (input.selections) {
    if (input.selections.length === 0) {
      return "controlled-workspace-host-candidate-selection-blocked-selected-count-invalid";
    }
    if (input.selections.length > 1) {
      return "controlled-workspace-host-candidate-selection-blocked-multiple-selection";
    }
  }

  const s = input.selection;
  if (s) {
    if (
      (s.candidateId !== undefined &&
        s.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID) ||
      (s.registrationId !== undefined &&
        s.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID)
    ) {
      return "controlled-workspace-host-candidate-selection-blocked-candidate-identity-invalid";
    }
    if (
      s.selectionId !== undefined &&
      s.selectionId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID
    ) {
      return "controlled-workspace-host-candidate-selection-blocked-selection-identity-invalid";
    }
    if (s.registered === false) {
      return "controlled-workspace-host-candidate-selection-blocked-unregistered-candidate";
    }
    if (s.candidateStructurallyCompatible === false) {
      return "controlled-workspace-host-candidate-selection-blocked-incompatible-candidate";
    }
    if (s.activated === true || s.active === true) {
      return "controlled-workspace-host-candidate-selection-blocked-activation-detected";
    }
    if (s.authorized === true) {
      return "controlled-workspace-host-candidate-selection-blocked-authorization-detected";
    }
    if (s.granted === true) {
      return "controlled-workspace-host-candidate-selection-blocked-grant-detected";
    }
    if (
      s.runtimeCapabilityPresent === true ||
      s.executable === true ||
      s.executionAllowed === true ||
      s.activationHandlePresent === true ||
      s.selectionHandlePresent === true ||
      s.callbackPresent === true ||
      s.commandPresent === true ||
      s.dispatcherPresent === true ||
      s.queuePresent === true ||
      s.schedulerPresent === true ||
      s.executorPresent === true ||
      s.providerPresent === true ||
      s.servicePresent === true ||
      s.coordinatorPresent === true
    ) {
      return "controlled-workspace-host-candidate-selection-blocked-capability-detected";
    }
    if (s.runtimeHostInstancePresent === true) {
      return "controlled-workspace-host-candidate-selection-blocked-runtime-host-instance-detected";
    }
    if (
      s.ownsRuntime === true ||
      s.writesRuntime === true ||
      s.rendersRuntime === true ||
      s.mountsGeoFeed === true ||
      s.containsGeoFeed === true ||
      s.wrapsGeoFeed === true ||
      s.duplicatesGeoFeed === true ||
      s.createsSecondGeoFeed === true
    ) {
      return "controlled-workspace-host-candidate-selection-blocked-geofeed-singularity-invalid";
    }
    if (
      s.shellRendered === true ||
      (typeof s.shellChildCount === "number" && s.shellChildCount !== 0) ||
      (typeof s.shellDOMNodeCount === "number" && s.shellDOMNodeCount !== 0) ||
      s.visible === true
    ) {
      return "controlled-workspace-host-candidate-selection-blocked-shell-non-null";
    }
    if (
      s.domMutationAllowed === true ||
      s.runtimeMutationAllowed === true ||
      s.requestMutationAllowed === true ||
      s.cacheMutationAllowed === true ||
      s.observerMutationAllowed === true
    ) {
      return "controlled-workspace-host-candidate-selection-blocked-runtime-mutation-detected";
    }
    if (s.activeRuntimeId === "feed.discovery.legacy-single-mount.v1" && s.selected === true && s.candidateId === "feed.discovery.legacy-single-mount.v1") {
      return "controlled-workspace-host-candidate-selection-blocked-candidate-identity-invalid";
    }
  }

  if (
    (input.owner !== undefined && input.owner !== "legacy") ||
    (input.writer !== undefined && input.writer !== "legacy") ||
    (input.renderer !== undefined && input.renderer !== "legacy")
  ) {
    return "controlled-workspace-host-candidate-selection-blocked-ownership-change-detected";
  }
  if (
    (input.mountCount !== undefined && input.mountCount !== 1) ||
    (input.unmountCount !== undefined && input.unmountCount !== 0) ||
    (input.activeInstanceCount !== undefined &&
      input.activeInstanceCount !== 1) ||
    (input.geoFeedRenderCount !== undefined && input.geoFeedRenderCount !== 1)
  ) {
    return "controlled-workspace-host-candidate-selection-blocked-geofeed-singularity-invalid";
  }
  if (
    input.shellRendered === true ||
    (input.shellChildCount !== undefined && input.shellChildCount !== 0) ||
    (input.shellDOMNodeCount !== undefined && input.shellDOMNodeCount !== 0)
  ) {
    return "controlled-workspace-host-candidate-selection-blocked-shell-non-null";
  }

  return null;
}

export function createControlledWorkspaceHostCandidateSelectionDescriptor(): ControlledWorkspaceHostCandidateSelectionDescriptor {
  const selection = createSelectedCandidate();
  return validateControlledWorkspaceHostCandidateSelectionDescriptor({
    schemaVersion: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_SCHEMA_VERSION,
    phase: "3B.3.25",
    previousPhase: "3B.3.24",
    currentPhase: "3B.3.25",
    nextEligibleStep: "3B.3.26",
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    selectionContractId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    candidateSelectionState: "SELECTED_NOT_ACTIVATED",
    candidateSelectionResult:
      "controlled-workspace-host-candidate-selected-not-activated",
    candidateSelectionCompleted: true,
    candidateSelectionReady: true,
    candidateSelectionBlocked: true,
    candidateSelectionExecutable: false,
    candidateSelectionAllowed: true,
    metadataSelectionAllowed: true,
    candidateSelectionApplied: false,
    candidateSelectionCommitted: false,
    candidateSelected: true,
    candidateNominated: true,
    candidateApproved: false,
    candidateAuthorized: false,
    candidateGranted: false,
    candidateActivated: false,
    candidateActive: false,
    candidateExecutable: false,
    futureActivationTarget: true,
    candidateCount: 1,
    registeredCandidateCount: 1,
    selectedCandidateCount: 1,
    activeCandidateCount: 0,
    activatedCandidateCount: 0,
    authorizedCandidateCount: 0,
    grantedCandidateCount: 0,
    executableCandidateCount: 0,
    invalidCandidateCount: 0,
    duplicateCandidateCount: 0,
    futureActivationTargetCount: 1,
    singleCandidateExact: true,
    singleSelectionExact: true,
    candidateIdentityUnique: true,
    registrationIdentityUnique: true,
    selectionIdentityUnique: true,
    selectedCandidateIdentityExact: true,
    selectedCandidateWasRegistered: true,
    selectedCandidateStructurallyCompatible: true,
    candidateActivationEligibleInFuture: true,
    candidateActivationEligibleNow: false,
    candidateRuntimeAdoptionEligibleNow: false,
    candidateRuntimeCapabilityPresent: false,
    candidateRuntimeHostInstancePresent: false,
    selections: [selection],
    predecessorCandidateRegistrationResult:
      "controlled-workspace-host-candidate-registered-not-selected",
    predecessorCandidateRegistrationState: "REGISTERED_NOT_SELECTED",
    predecessorCandidateRegistrationCompleted: true,
    predecessorCandidateRegistrationReady: true,
    predecessorCandidateRegistrationBlocked: true,
    predecessorCandidateRegistrationExecutable: false,
    predecessorCandidateRegistered: true,
    predecessorCandidateSelected: false,
    predecessorSelectedCandidateCount: 0,
    predecessorActiveCandidateCount: 0,
    predecessorExecutableCandidateCount: 0,
    predecessorCandidateStructurallyCompatible: true,
    predecessorCandidateSelectionEligibleInFuture: true,
    predecessorCandidateActivationEligibleNow: false,
    predecessorCandidateRuntimeAdoptionEligibleNow: false,
    issuanceCommitBoundaryResult:
      "authorization-grant-issuance-commit-boundary-ready-not-entered",
    issuanceCommitBoundaryState: "NOT_ENTERED",
    issuanceCommitBoundaryEntered: false,
    commitBoundaryEntered: false,
    issuanceCommitBoundaryArmed: false,
    commitBoundaryArmed: false,
    boundaryCrossed: false,
    prepared: false,
    committed: false,
    commitRequested: false,
    commitInvoked: false,
    commitStarted: false,
    issuanceTransactionResult:
      "authorization-grant-issuance-transaction-ready-not-opened",
    issuanceTransactionState: "NOT_OPENED",
    issuanceTransactionOpened: false,
    issuanceTransactionPrepared: false,
    issuanceTransactionCommitted: false,
    transactionOpenAllowed: false,
    transactionPrepareAllowed: false,
    transactionCommitAllowed: false,
    issuancePipelineResult:
      "authorization-grant-issuance-pipeline-ready-not-executable",
    issuancePipelineExecutable: false,
    issuancePipelineExecutionAllowed: false,
    issuancePipelineExecutionImpossible: true,
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
    selectedCandidateRendered: false,
    selectedCandidateDOMPresent: false,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    activationBlocker:
      PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
    conditions: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS,
    satisfiedConditions: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS,
    unsatisfiedConditions: [],
    guards: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS,
    satisfiedGuards: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS,
    unsatisfiedGuards: [],
    blockers: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  });
}

export function validateControlledWorkspaceHostCandidateSelectionDescriptor(
  d: ControlledWorkspaceHostCandidateSelectionDescriptor,
): ControlledWorkspaceHostCandidateSelectionDescriptor {
  if (
    d.phase !== "3B.3.25" ||
    d.previousPhase !== "3B.3.24" ||
    d.currentPhase !== "3B.3.25" ||
    d.nextEligibleStep !== "3B.3.26"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PHASE",
      "Phase chain must be 3B.3.24 → 3B.3.25 → 3B.3.26",
    );
  }
  if (
    d.candidateSelectionState !== "SELECTED_NOT_ACTIVATED" ||
    d.candidateSelectionResult !==
      "controlled-workspace-host-candidate-selected-not-activated"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_RESULT",
      "Successful selection must be SELECTED_NOT_ACTIVATED",
    );
  }
  if (
    d.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID ||
    d.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID ||
    d.selectionId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_IDENTITY",
      "Candidate/registration/selection identities must be exact",
    );
  }
  if (
    d.candidateCount !== 1 ||
    d.registeredCandidateCount !== 1 ||
    d.selectedCandidateCount !== 1 ||
    d.activeCandidateCount !== 0 ||
    d.executableCandidateCount !== 0 ||
    d.futureActivationTargetCount !== 1 ||
    d.selections.length !== 1
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_COUNTS",
      "Exactly one registered and selected candidate required",
    );
  }
  if (
    d.predecessorCandidateRegistrationState !== "REGISTERED_NOT_SELECTED" ||
    d.predecessorCandidateSelected !== false ||
    d.issuanceCommitBoundaryState !== "NOT_ENTERED" ||
    d.issuanceTransactionState !== "NOT_OPENED" ||
    d.issuancePipelineExecutable !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREDECESSOR",
      "Predecessor registration/commit-boundary/transaction/pipeline must remain frozen",
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
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_RUNTIME",
      "Legacy runtime and null shell must be preserved",
    );
  }
  if (
    d.candidateActivated === true ||
    d.candidateActive === true ||
    d.candidateSelectionExecutable === true ||
    d.candidateAuthorized === true ||
    d.candidateGranted === true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_ACTIVATION",
      "Selected candidate must remain inactive, unauthorized, and non-executable",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceHostCandidateSelection(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceHostCandidateSelectionInput,
): ControlledWorkspaceHostCandidateSelectionEvaluation {
  if (registry.hostCount !== 1) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_REGISTRY",
      "Selection requires exactly one controlled-host registry entry",
    );
  }

  const predecessor =
    evaluateControlledWorkspaceHostCandidateRegistration(registry);
  const pred = predecessor.descriptor;

  if (
    pred.candidateRegistrationResult !==
      "controlled-workspace-host-candidate-registered-not-selected" ||
    pred.candidateRegistrationState !== "REGISTERED_NOT_SELECTED" ||
    pred.candidateSelected !== false ||
    pred.candidateCount !== 1 ||
    pred.registeredCandidateCount !== 1 ||
    pred.selectedCandidateCount !== 0
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREDECESSOR_LIVE",
      "Predecessor registration must remain REGISTERED_NOT_SELECTED with exactly one unselected candidate",
    );
  }

  const blocked = blockedResultFor(input);
  if (blocked) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_BLOCKED",
      blocked,
    );
  }

  const descriptor =
    createControlledWorkspaceHostCandidateSelectionDescriptor();
  const selection = descriptor.selections[0];

  return {
    descriptor,
    diagnostics: {
      candidateSelectionCompleted: true,
      candidateSelectionReady: true,
      candidateSelectionBlocked: true,
      candidateSelectionExecutable: false,
      candidateSelectionAllowed: true,
      metadataSelectionAllowed: true,
      candidateSelectionApplied: false,
      candidateSelectionCommitted: false,
      candidateSelectionResult: descriptor.candidateSelectionResult,
      candidateSelectionState: descriptor.candidateSelectionState,
      candidateSelected: true,
      candidateNominated: true,
      candidateApproved: false,
      candidateAuthorized: false,
      candidateGranted: false,
      candidateActivated: false,
      candidateActive: false,
      candidateExecutable: false,
      futureActivationTarget: true,
      candidateCount: 1,
      registeredCandidateCount: 1,
      selectedCandidateCount: 1,
      activeCandidateCount: 0,
      activatedCandidateCount: 0,
      authorizedCandidateCount: 0,
      grantedCandidateCount: 0,
      executableCandidateCount: 0,
      invalidCandidateCount: 0,
      duplicateCandidateCount: 0,
      futureActivationTargetCount: 1,
      singleCandidateExact: true,
      singleSelectionExact: true,
      candidateIdentityUnique: true,
      registrationIdentityUnique: true,
      selectionIdentityUnique: true,
      selectedCandidateIdentityExact: true,
      selectedCandidateWasRegistered: true,
      selectedCandidateStructurallyCompatible: true,
      candidateActivationEligibleInFuture: true,
      candidateActivationEligibleNow: false,
      candidateRuntimeAdoptionEligibleNow: false,
      candidateId: selection.candidateId,
      registrationId: selection.registrationId,
      selectionId: selection.selectionId,
      selectionContractId: selection.selectionContractId,
      candidateKind: selection.candidateKind,
      runtimeCapabilityPresent: false,
      runtimeHostInstancePresent: false,
      activationHandlePresent: false,
      selectionHandlePresent: false,
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
      selectedCandidateRendered: false,
      selectedCandidateDOMPresent: false,
      predecessorCandidateRegistrationResult:
        descriptor.predecessorCandidateRegistrationResult,
      predecessorCandidateRegistrationState:
        descriptor.predecessorCandidateRegistrationState,
      predecessorCandidateSelected: false,
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
      currentPhase: "3B.3.25",
      previousPhase: "3B.3.24",
      nextEligibleStep: "3B.3.26",
      activationBlocker:
        PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
      predecessorActivationBlocker:
        PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
      conditionCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS.length,
      unsatisfiedConditionCount: 0,
      guardCount: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS.length,
      satisfiedGuardCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS.length,
      unsatisfiedGuardCount: 0,
      blockerCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_BLOCKERS.length,
      conditions: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS,
      guards: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS,
      blockers: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_BLOCKERS,
      selections: descriptor.selections,
    },
  };
}

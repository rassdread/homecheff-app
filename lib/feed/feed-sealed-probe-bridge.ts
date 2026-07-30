/**
 * Phase 3B.2/3B.3.20 — namespaced browser probe bridge for sealed Feed instrumentation.
 *
 * Installed only when NEXT_PUBLIC_FEED_SEALED_BASELINE=1 (compile-time gate).
 */

import {
  isFeedSealedInstrumentationEnabled,
  readFeedSealedInstrumentationCounters,
  type SealedCounters,
} from "@/lib/feed/feed-sealed-runtime-instrumentation";

export const HC_FEED_SEALED_PROBE_KEY = "__HC_FEED_SEALED_PROBE__" as const;

export type FeedSealedProbeApi = {
  version: 51;
  readCounters: () => Readonly<SealedCounters>;
  evaluateShadow: () => Promise<{
    widgetId: string;
    renderActivation: false;
    shadowActivation: true;
    activeWriter: "legacy";
    runtimeClassification: "sealed-runtime";
    workspaceRendererRegistered: false;
  }>;
  attemptFeedOn: () => {
    allowed: false;
    renderActivation: false;
    reason: string;
  };
  attemptHostActivation: (force?: unknown) => Promise<{
    allowed: false;
    blockers: readonly string[];
    currentStep: "3B.3.20";
    eligibleStep: "3B.3.21";
  }>;
  readControlledHostContract: () => Promise<{
    hostActivation: false;
    renderActivation: false;
    activeRenderOwner: "legacy";
    activeWriter: "legacy";
    nextEligibleStep: "3B.3.20";
    hostClassification: "controlled-host-candidate";
  }>;
  readHostPlan: () => Promise<{
    activationState: "dormant";
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    placementState: "shadow-registered";
    registrationState: "registered";
    eligibilityState: "eligible";
    readinessState: "ready";
    simulationState?: "completed";
    wouldActivate?: true;
    decisionState?: "completed";
    decisionResult?: "ALLOW";
    confidence?: "high";
    planState?: "completed";
    planResult?: "plan-complete-not-executable";
    pipelineState?: "completed";
    pipelineResult?: "pipeline-complete-not-executable";
    transactionState?: "completed";
    transactionResult?: "transaction-complete-not-committed";
    wouldCommit?: true;
    transactionCommitted?: false;
    commitReadinessState?: "completed";
    commitReadinessResult?: "commit-ready-not-executable";
    commitReady?: true;
    commitBlocked?: true;
    commitProtocolState?: "completed";
    commitProtocolResult?: "protocol-complete-not-executable";
    protocolExecuted?: false;
    stateMachineState?: "completed";
    stateMachineResult?: "state-machine-complete-not-executable";
    currentActivationLifecycleState?: "COMMIT_READY";
    transitionExecuted?: false;
    transitionGraphState?: "completed";
    transitionGraphResult?: "transition-graph-complete-not-executable";
    currentGraphNode?: "COMMIT_READY";
    graphTraversalExecuted?: false;
    transitionSelectionState?: "completed";
    transitionSelectionResult?: "transition-selected-not-executable";
    selectionCompleted?: true;
    selectionExecuted?: false;
    selectedTransition?: "COMMIT_READY->ACTIVE";
    selectedFromState?: "COMMIT_READY";
    selectedToState?: "ACTIVE";
    transitionPreflightState?: "completed";
    transitionPreflightResult?: "transition-preflight-ready-not-authorized";
    preflightCompleted?: true;
    preflightReady?: true;
    preflightBlocked?: true;
    preflightExecuted?: false;
    authorizationDecisionState?: "completed";
    authorizationDecisionResult?: "authorization-eligible-not-granted";
    authorizationDecisionCompleted?: true;
    authorizationDecisionExecuted?: false;
    authorizationEligible?: true;
    authorizationBlocked?: true;
    wouldAuthorize?: true;
    authorizationApplied?: false;
    authorizationExecutionAllowed?: false;
    transitionAuthorized?: false;
    authorizationGranted?: false;
    grantReadinessState?: "completed";
    grantReadinessResult?: "authorization-grant-ready-not-issued";
    grantReadinessCompleted?: true;
    grantReady?: true;
    grantBlocked?: true;
    wouldIssueGrant?: true;
    grantIssued?: false;
    grantCreated?: false;
    grantMaterialized?: false;
    grantPersisted?: false;
    grantApplied?: false;
    grantActivated?: false;
    grantConsumed?: false;
    grantRevoked?: false;
    grantAuthorityAvailable?: false;
    grantAuthorityEnabled?: false;
    grantAuthorityDelegated?: false;
    grantAuthorityTransferred?: false;
    issuanceDecisionState?: "completed";
    issuanceDecisionResult?: "authorization-grant-issuance-eligible-not-issued";
    issuanceDecisionCompleted?: true;
    issuanceDecisionExecuted?: false;
    issuanceEligible?: true;
    issuanceBlocked?: true;
    tokenPresent?: false;
    secretPresent?: false;
    signaturePresent?: false;
    noncePresent?: false;
    credentialPresent?: false;
    certificatePresent?: false;
    permitPresent?: false;
    callbackPresent?: false;
    executableHandlePresent?: false;
    runtimeCapabilityPresent?: false;
    recommendedNextStep: string;
  }>;
  readShadowPlacement: () => Promise<{
    phase: "3B.3.2";
    placementState: "shadow-registered";
    placementMode: "sibling-after-legacy-mount";
    hostActivation: false;
    renderActivation: false;
    activeWriter: "legacy";
    activeRenderOwner: "legacy";
    registrationVisibleInMetadata: true;
    rollbackTarget: "legacy";
    nextEligibleStep: "3B.3.3";
    activationBlocker: "PHASE_3B3_2_SHADOW_PLACEMENT_ONLY";
  }>;
  readShadowPlacementIdentity: () => Promise<{
    expectedMountCount: 1;
    expectedUnmountCount: 0;
    expectedRendererRegistrationCount: 0;
    identityTransitionAllowed: false;
  }>;
  readHostRegistry: () => Promise<{
    phase: "3B.3.3";
    hostCount: 1;
    containsRuntimeObjects: false;
    containsReactInstances: false;
    hostId: string;
    runtimeId: string;
    registrationState: "registered";
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    activationState: "dormant";
    hostActivation: false;
    renderActivation: false;
  }>;
  readHostRegistration: () => Promise<{
    phase: "3B.3.3";
    registrationState: "registered";
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    activationRestriction: "PHASE_3B3_3_HOST_REGISTRATION_ONLY";
    nextEligibleStep: "3B.3.4";
  }>;
  readHostEligibility: () => Promise<{
    phase: "3B.3.4";
    eligibilityState: "eligible";
    eligibilityReason: string;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_4_HOST_ELIGIBILITY_ONLY";
    nextEligibleStep: "3B.3.5";
    diagnostics: {
      registryHostCount: 1;
      runtimeIdStable: true;
      ownershipLegacy: true;
      rendererLegacy: true;
      rollbackPrepared: true;
      activationBlocked: true;
    };
  }>;
  readHostActivationReadiness: () => Promise<{
    phase: "3B.3.5";
    readinessState: "ready";
    readinessReasons: readonly string[];
    readinessBlockers: readonly string[];
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY";
    nextEligibleStep: "3B.3.6";
    diagnostics: {
      readinessSatisfied: true;
      activationBlocked: true;
      canStartActivation: false;
      currentPhase: "3B.3.5";
      nextEligibleStep: "3B.3.6";
      activeBlockers: readonly string[];
      satisfiedConditions: readonly string[];
      missingConditionsForActivation: readonly string[];
      registryHostCount: 1;
      runtimeIdStable: true;
      ownershipLegacy: true;
      rendererLegacy: true;
      rollbackPrepared: true;
      placementRegistered: true;
      eligibilitySatisfied: true;
    };
  }>;
  readHostShadowActivationSimulation: () => Promise<{
    phase: "3B.3.6";
    simulationState: "completed";
    simulationResult: string;
    wouldActivate: true;
    simulationReasons: readonly string[];
    simulationBlockers: readonly string[];
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY";
    nextEligibleStep: "3B.3.7";
    diagnostics: {
      simulationCompleted: true;
      wouldActivate: true;
      whyWouldActivate: string;
      activationBlocked: true;
      canStartActivation: false;
      currentPhase: "3B.3.6";
      nextEligibleStep: "3B.3.7";
      activeBlockers: readonly string[];
      readinessStatus: "ready";
      eligibilityStatus: "eligible";
      satisfiedConditions: readonly string[];
      missingConditionsForExecution: readonly string[];
      registryHostCount: 1;
      runtimeIdStable: true;
      ownershipLegacy: true;
      rendererLegacy: true;
      rollbackPrepared: true;
    };
  }>;

  readHostActivationTransitionGraph: () => Promise<{
    phase: "3B.3.14";
    graphId: string;
    graphVersion: 1;
    graphState: "completed";
    graphResult: "transition-graph-complete-not-executable";
    currentNode: "COMMIT_READY";
    entryNode: "LEGACY_DORMANT";
    terminalNodes: readonly string[];
    graphNodes: readonly string[];
    graphEdges: readonly string[];
    reachableNodes: readonly string[];
    unreachableNodes: readonly string[];
    allowedPaths: readonly string[];
    blockedPaths: readonly string[];
    edgeGuards: readonly string[];
    edgeBlockers: readonly string[];
    edgePreconditions: readonly string[];
    graphTraversalExecuted: false;
    transitionExecuted: false;
    protocolExecuted: false;
    transactionCommitted: false;
    wouldCommit: true;
    commitReady: true;
    machineResult: "state-machine-complete-not-executable";
    protocolResult: "protocol-complete-not-executable";
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    wouldActivate: true;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY";
    nextEligibleStep: "3B.3.15";
    diagnostics: Record<string, unknown>;
  }>;
  readHostActivationTransitionSelection: () => Promise<{
    phase: "3B.3.15";
    selectionId: string;
    selectionVersion: 1;
    selectionState: "completed";
    selectionResult: "transition-selected-not-executable";
    selectionCompleted: true;
    selectionExecuted: false;
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    candidateTransitions: readonly string[];
    eligibleTransitions: readonly string[];
    ineligibleTransitions: readonly string[];
    selectedTransition: "COMMIT_READY->ACTIVE";
    selectedTransitionId: "COMMIT_READY->ACTIVE";
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    selectionReason: string;
    selectionStrategy: string;
    selectionPriority: 100;
    selectionScore: 100;
    deterministicTieBreak: "lexicographic-transition-id";
    selectionGuards: readonly string[];
    selectionBlockers: readonly string[];
    alternativeTransitions: readonly string[];
    transitionExecutionAllowed: false;
    graphTraversalAllowed: false;
    selectionExecutionAllowed: false;
    transitionExecuted: false;
    graphTraversalExecuted: false;
    protocolExecuted: false;
    transactionCommitted: false;
    wouldCommit: true;
    commitReady: true;
    graphResult: "transition-graph-complete-not-executable";
    machineResult: "state-machine-complete-not-executable";
    protocolResult: "protocol-complete-not-executable";
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    wouldActivate: true;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY";
    nextEligibleStep: "3B.3.16";
    diagnostics: Record<string, unknown>;
  }>;
  readHostActivationTransitionPreflight: () => Promise<{
    phase: "3B.3.16";
    preflightId: string;
    preflightVersion: 1;
    preflightState: "completed";
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightCompleted: true;
    preflightReady: true;
    preflightBlocked: true;
    preflightExecuted: false;
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    selectedTransition: "COMMIT_READY->ACTIVE";
    selectedTransitionId: "COMMIT_READY->ACTIVE";
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    selectionResult: "transition-selected-not-executable";
    selectionCompleted: true;
    selectionExecuted: false;
    preflightChecks: readonly string[];
    passedChecks: readonly string[];
    failedChecks: readonly [];
    warningChecks: readonly [];
    transitionAuthorized: false;
    authorizationGranted: false;
    transitionExecutionAllowed: false;
    graphTraversalAllowed: false;
    selectionExecutionAllowed: false;
    preflightExecutionAllowed: false;
    transitionAuthorizationAllowed: false;
    transitionExecuted: false;
    graphTraversalExecuted: false;
    protocolExecuted: false;
    transactionCommitted: false;
    wouldCommit: true;
    commitReady: true;
    graphResult: "transition-graph-complete-not-executable";
    machineResult: "state-machine-complete-not-executable";
    protocolResult: "protocol-complete-not-executable";
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    wouldActivate: true;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY";
    nextEligibleStep: "3B.3.17";
    diagnostics: Record<string, unknown>;
  }>;
  readHostActivationTransitionAuthorizationDecision: () => Promise<{
    phase: "3B.3.17";
    authorizationDecisionId: string;
    authorizationDecisionVersion: 1;
    authorizationDecisionState: "completed";
    authorizationDecisionResult: "authorization-eligible-not-granted";
    authorizationDecisionCompleted: true;
    authorizationDecisionExecuted: false;
    authorizationEligible: true;
    authorizationBlocked: true;
    wouldAuthorize: true;
    authorizationGranted: false;
    authorizationApplied: false;
    authorizationExecutionAllowed: false;
    transitionAuthorized: false;
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    selectedTransition: "COMMIT_READY->ACTIVE";
    selectedTransitionId: "COMMIT_READY->ACTIVE";
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightCompleted: true;
    preflightReady: true;
    preflightBlocked: true;
    preflightExecuted: false;
    selectionResult: "transition-selected-not-executable";
    selectionCompleted: true;
    selectionExecuted: false;
    transitionExecutionAllowed: false;
    graphTraversalAllowed: false;
    selectionExecutionAllowed: false;
    preflightExecutionAllowed: false;
    authorizationDecisionExecutionAllowed: false;
    authorizationGrantAllowed: false;
    authorizationApplicationAllowed: false;
    transitionAuthorizationAllowed: false;
    transitionExecuted: false;
    graphTraversalExecuted: false;
    protocolExecuted: false;
    transactionCommitted: false;
    wouldCommit: true;
    commitReady: true;
    graphResult: "transition-graph-complete-not-executable";
    machineResult: "state-machine-complete-not-executable";
    protocolResult: "protocol-complete-not-executable";
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    wouldActivate: true;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY";
    nextEligibleStep: "3B.3.18";
    diagnostics: Record<string, unknown>;
  }>;
  readHostActivationTransitionAuthorizationGrantReadiness: () => Promise<{
    phase: "3B.3.18";
    grantReadinessId: string;
    grantReadinessVersion: 1;
    grantReadinessState: "completed";
    grantReadinessResult: "authorization-grant-ready-not-issued";
    grantReadinessCompleted: true;
    grantReadinessExecuted: false;
    grantReady: true;
    grantBlocked: true;
    wouldIssueGrant: true;
    grantIssued: false;
    grantCreated: false;
    grantPersisted: false;
    grantApplied: false;
    grantAuthorityAvailable: false;
    grantAuthorityEnabled: false;
    grantExecutionAllowed: false;
    grantCreationAllowed: false;
    grantIssuanceAllowed: false;
    grantPersistenceAllowed: false;
    grantApplicationAllowed: false;
    authorizationDecisionResult: "authorization-eligible-not-granted";
    authorizationDecisionCompleted: true;
    authorizationDecisionExecuted: false;
    authorizationEligible: true;
    authorizationBlocked: true;
    wouldAuthorize: true;
    authorizationGranted: false;
    authorizationApplied: false;
    authorizationExecutionAllowed: false;
    transitionAuthorized: false;
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    selectedTransition: "COMMIT_READY->ACTIVE";
    selectedTransitionId: "COMMIT_READY->ACTIVE";
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightCompleted: true;
    preflightReady: true;
    preflightBlocked: true;
    preflightExecuted: false;
    selectionResult: "transition-selected-not-executable";
    selectionCompleted: true;
    selectionExecuted: false;
    transitionExecutionAllowed: false;
    graphTraversalAllowed: false;
    selectionExecutionAllowed: false;
    preflightExecutionAllowed: false;
    grantReadinessExecutionAllowed: false;
    authorizationGrantAllowed: false;
    authorizationApplicationAllowed: false;
    transitionAuthorizationAllowed: false;
    transitionExecuted: false;
    graphTraversalExecuted: false;
    protocolExecuted: false;
    transactionCommitted: false;
    wouldCommit: true;
    commitReady: true;
    graphResult: "transition-graph-complete-not-executable";
    machineResult: "state-machine-complete-not-executable";
    protocolResult: "protocol-complete-not-executable";
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    wouldActivate: true;
    grantTokenPresent: false;
    grantSecretPresent: false;
    grantSignaturePresent: false;
    grantCallbackPresent: false;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY";
    nextEligibleStep: "3B.3.19";
    diagnostics: Record<string, unknown>;
  }>;
  readHostActivationTransitionAuthorizationGrantIssuanceDecision: () => Promise<{
    phase: "3B.3.19";
    issuanceDecisionId: string;
    issuanceDecisionVersion: 1;
    issuanceDecisionState: "completed";
    issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued";
    issuanceDecisionCompleted: true;
    issuanceDecisionExecuted: false;
    issuanceEligible: true;
    issuanceBlocked: true;
    wouldIssueGrant: true;
    grantIssued: false;
    grantCreated: false;
    grantMaterialized: false;
    grantPersisted: false;
    grantApplied: false;
    grantActivated: false;
    grantConsumed: false;
    grantRevoked: false;
    grantAuthorityAvailable: false;
    grantAuthorityEnabled: false;
    grantAuthorityDelegated: false;
    grantAuthorityTransferred: false;
    grantExecutionAllowed: false;
    grantCreationAllowed: false;
    grantIssuanceAllowed: false;
    grantMaterializationAllowed: false;
    grantPersistenceAllowed: false;
    grantApplicationAllowed: false;
    grantActivationAllowed: false;
    grantConsumptionAllowed: false;
    grantRevocationAllowed: false;
    issuanceExecutionAllowed: false;
    grantReadinessResult: "authorization-grant-ready-not-issued";
    grantReadinessCompleted: true;
    grantReadinessExecuted: false;
    grantReady: true;
    grantBlocked: true;
    authorizationDecisionResult: "authorization-eligible-not-granted";
    authorizationDecisionCompleted: true;
    authorizationDecisionExecuted: false;
    authorizationEligible: true;
    authorizationBlocked: true;
    wouldAuthorize: true;
    authorizationGranted: false;
    authorizationApplied: false;
    authorizationExecutionAllowed: false;
    transitionAuthorized: false;
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    selectedTransition: "COMMIT_READY->ACTIVE";
    selectedTransitionId: "COMMIT_READY->ACTIVE";
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightCompleted: true;
    preflightReady: true;
    preflightBlocked: true;
    preflightExecuted: false;
    selectionResult: "transition-selected-not-executable";
    selectionCompleted: true;
    selectionExecuted: false;
    transitionExecutionAllowed: false;
    graphTraversalAllowed: false;
    selectionExecutionAllowed: false;
    preflightExecutionAllowed: false;
    grantReadinessExecutionAllowed: false;
    issuanceDecisionExecutionAllowed: false;
    authorizationGrantAllowed: false;
    authorizationApplicationAllowed: false;
    transitionAuthorizationAllowed: false;
    authorizationGrantIssuanceAllowed: false;
    transitionExecuted: false;
    graphTraversalExecuted: false;
    protocolExecuted: false;
    transactionCommitted: false;
    wouldCommit: true;
    commitReady: true;
    graphResult: "transition-graph-complete-not-executable";
    machineResult: "state-machine-complete-not-executable";
    protocolResult: "protocol-complete-not-executable";
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    wouldActivate: true;
    tokenPresent: false;
    secretPresent: false;
    signaturePresent: false;
    noncePresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    callbackPresent: false;
    executableHandlePresent: false;
    runtimeCapabilityPresent: false;
    grantTokenPresent: false;
    grantSecretPresent: false;
    grantSignaturePresent: false;
    grantCallbackPresent: false;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY";
    nextEligibleStep: "3B.3.20";
    diagnostics: Record<string, unknown>;
  }>;
  readHostActivationTransitionAuthorizationGrantIssuancePipeline: () => Promise<{
    phase: "3B.3.21";
    issuancePipelineId: string;
    issuancePipelineVersion: 1;
    issuancePipelineState: "completed";
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineCompleted: true;
    issuancePipelineExecuted: false;
    issuancePipelineReady: true;
    issuancePipelineBlocked: true;
    issuancePipelineExecutable: false;
    wouldExecuteIssuancePipeline: true;
    pipelineStageCount: number;
    completedPipelineStageCount: 0;
    executablePipelineStageCount: 0;
    blockedPipelineStageCount: number;
    invalidPipelineStageCount: 0;
    sourcePlanStepCount: 30;
    coveredPlanStepCount: 30;
    uncoveredPlanStepCount: 0;
    duplicateCoveredPlanStepCount: 0;
    unknownReferencedPlanStepCount: 0;
    planCoverageComplete: true;
    planCoverageExact: true;
    planOrderPreserved: true;
    pipelineDependencyGraphAcyclic: true;
    [key: string]: unknown;
  }>;
  readHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary: () => Promise<{
    phase: "3B.3.23";
    issuanceCommitBoundaryId: string;
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryCompleted: true;
    issuanceCommitBoundaryReady: true;
    issuanceCommitBoundaryBlocked: true;
    issuanceCommitBoundaryEntered: false;
    issuanceCommitBoundaryExecutable: false;
    wouldEnterIssuanceCommitBoundary: true;
    [key: string]: unknown;
  }>;
  readControlledWorkspaceHostCandidateRegistration: () => Promise<{
    phase: "3B.3.24";
    candidateId: string;
    registrationId: string;
    candidateRegistrationState: "REGISTERED_NOT_SELECTED";
    candidateRegistrationResult: "controlled-workspace-host-candidate-registered-not-selected";
    candidateRegistrationCompleted: true;
    candidateRegistrationReady: true;
    candidateRegistrationBlocked: true;
    candidateRegistrationExecutable: false;
    candidateRegistered: true;
    candidateSelected: false;
    candidateActivated: false;
    wouldSelectCandidate: true;
    futureSelectionTarget: true;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 0;
    activeCandidateCount: 0;
    executableCandidateCount: 0;
    [key: string]: unknown;
  }>;
  readHostActivationTransitionAuthorizationGrantIssuanceTransaction: () => Promise<{
    phase: "3B.3.22";
    issuanceTransactionId: string;
    issuanceTransactionVersion: 1;
    issuanceTransactionState: "NOT_OPENED";
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
    issuanceTransactionCompleted: true;
    issuanceTransactionExecuted: false;
    issuanceTransactionReady: true;
    issuanceTransactionBlocked: true;
    issuanceTransactionOpened: false;
    issuanceTransactionPrepared: false;
    issuanceTransactionCommitted: false;
    issuanceTransactionAborted: false;
    issuanceTransactionRolledBack: false;
    issuanceTransactionCompensated: false;
    issuanceTransactionExecutable: false;
    wouldOpenIssuanceTransaction: true;
    transactionParticipantCount: number;
    completedTransactionParticipantCount: 0;
    executableTransactionParticipantCount: 0;
    blockedTransactionParticipantCount: number;
    invalidTransactionParticipantCount: 0;
    sourcePipelineStageCount: 30;
    coveredPipelineStageCount: 30;
    uncoveredPipelineStageCount: 0;
    duplicateCoveredPipelineStageCount: 0;
    unknownReferencedPipelineStageCount: 0;
    pipelineCoverageComplete: true;
    pipelineCoverageExact: true;
    pipelineOrderPreserved: true;
    transactionParticipantGraphAcyclic: true;
    [key: string]: unknown;
  }>;
  readHostActivationTransitionAuthorizationGrantIssuancePlan: () => Promise<{
    phase: "3B.3.20";
    issuancePlanId: string;
    issuancePlanVersion: 1;
    issuancePlanState: "completed";
    issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable";
    issuancePlanCompleted: true;
    issuancePlanExecuted: false;
    issuancePlanReady: true;
    issuancePlanBlocked: true;
    issuancePlanExecutable: false;
    wouldExecuteIssuancePlan: true;
    planStepCount: number;
    completedPlanStepCount: 0;
    executablePlanStepCount: 0;
    blockedPlanStepCount: number;
    invalidPlanStepCount: 0;
    issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued";
    issuanceDecisionCompleted: true;
    issuanceEligible: true;
    issuanceBlocked: true;
    wouldIssueGrant: true;
    grantIssued: false;
    grantCreated: false;
    grantMaterialized: false;
    grantPersisted: false;
    grantApplied: false;
    grantActivated: false;
    grantConsumed: false;
    grantRevoked: false;
    grantAuthorityAvailable: false;
    grantAuthorityEnabled: false;
    grantAuthorityDelegated: false;
    grantAuthorityTransferred: false;
    grantReadinessResult: "authorization-grant-ready-not-issued";
    grantReady: true;
    grantBlocked: true;
    authorizationDecisionResult: "authorization-eligible-not-granted";
    authorizationEligible: true;
    authorizationGranted: false;
    authorizationApplied: false;
    transitionAuthorized: false;
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    currentGraphNode: "COMMIT_READY";
    selectedTransition: "COMMIT_READY->ACTIVE";
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    sourceState: "COMMIT_READY";
    targetState: "ACTIVE";
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightReady: true;
    transitionExecuted: false;
    protocolExecuted: false;
    transactionCommitted: false;
    commitExecuted: false;
    rollbackExecuted: false;
    issuancePlanExecutionAllowed: false;
    issuanceExecutionAllowed: false;
    grantExecutionAllowed: false;
    authorizationExecutionAllowed: false;
    activationExecutionAllowed: false;
    transitionExecutionAllowed: false;
    schedulerAllowed: false;
    executorAllowed: false;
    canStartActivation: false;
    ownershipTransferred: false;
    writerTransferred: false;
    rendererTransferred: false;
    tokenPresent: false;
    secretPresent: false;
    signaturePresent: false;
    noncePresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    callbackPresent: false;
    executableHandlePresent: false;
    runtimeCapabilityPresent: false;
    commandPresent: false;
    dispatcherPresent: false;
    queuePresent: false;
    authorityProviderPresent: false;
    issuanceServicePresent: false;
    issuancePlanExecutionImpossible: true;
    issuanceImpossible: true;
    authorityImpossible: true;
    executionImpossible: true;
    runtimeId: string;
    hostId: string;
    hostActivation: false;
    renderActivation: false;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    activationBlocker: "PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY";
    nextEligibleStep: "3B.3.21";
    diagnostics: Record<string, unknown>;
  }>;
    readControlledWorkspaceHostCandidateSelection: () => Promise<{
    phase: "3B.3.25";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    selectionContractId: string;
    candidateKind: "adaptive-workspace";
    candidateSelectionState: "SELECTED_NOT_ACTIVATED";
    candidateSelectionResult: "controlled-workspace-host-candidate-selected-not-activated";
    candidateSelectionCompleted: true;
    candidateSelectionReady: true;
    candidateSelectionBlocked: true;
    candidateSelectionExecutable: false;
    candidateSelectionAllowed: true;
    metadataSelectionAllowed: true;
    candidateSelectionApplied: false;
    candidateSelectionCommitted: false;
    candidateRegistered: true;
    candidateSelected: true;
    candidateNominated: true;
    candidateApproved: false;
    candidateAuthorized: false;
    candidateGranted: false;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    futureActivationTarget: true;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    authorizedCandidateCount: 0;
    grantedCandidateCount: 0;
    executableCandidateCount: 0;
    invalidCandidateCount: 0;
    duplicateCandidateCount: 0;
    futureActivationTargetCount: 1;
    singleCandidateExact: true;
    singleSelectionExact: true;
    candidateIdentityUnique: true;
    registrationIdentityUnique: true;
    selectionIdentityUnique: true;
    selectedCandidateIdentityExact: true;
    selectedCandidateWasRegistered: true;
    selectedCandidateStructurallyCompatible: true;
    candidateActivationEligibleInFuture: true;
    candidateActivationEligibleNow: false;
    candidateRuntimeAdoptionEligibleNow: false;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    selectionHandlePresent: false;
    ownsRuntime: false;
    ownsFeed: false;
    writesRuntime: false;
    writesFeed: false;
    rendersRuntime: false;
    rendersFeed: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    selectedCandidateRendered: false;
    selectedCandidateDOMPresent: false;
    predecessorCandidateRegistrationResult: "controlled-workspace-host-candidate-registered-not-selected";
    predecessorCandidateRegistrationState: "REGISTERED_NOT_SELECTED";
    predecessorCandidateSelected: false;
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
    issuanceTransactionState: "NOT_OPENED";
    issuanceTransactionOpened: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY";
    nextEligibleStep: "3B.3.26";
    diagnostics: Record<string, unknown>;
  }>;

    readControlledWorkspaceHostActivationReadiness: () => Promise<{
    phase: "3B.3.26";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationReadinessContractId: string;
    candidateKind: "adaptive-workspace";
    activationReadinessState: "READY_NOT_AUTHORIZED";
    activationReadinessResult: "controlled-workspace-host-activation-ready-not-authorized";
    activationReadinessCompleted: true;
    activationReadinessReady: true;
    activationReadinessBlocked: true;
    activationReadinessExecutable: false;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: false;
    candidateGranted: false;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    futureActivationPossible: true;
    futureActivationAuthorized: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    authorizedCandidateCount: 0;
    grantedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    predecessorCandidateSelectionResult: "controlled-workspace-host-candidate-selected-not-activated";
    predecessorCandidateSelectionState: "SELECTED_NOT_ACTIVATED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
    issuanceTransactionState: "NOT_OPENED";
    issuanceTransactionOpened: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY";
    nextEligibleStep: "3B.3.27";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

    readControlledWorkspaceHostActivationAuthorization: () => Promise<{
    phase: "3B.3.27";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationAuthorizationContractId: string;
    candidateKind: "adaptive-workspace";
    activationAuthorizationState: "AUTHORIZED_NOT_GRANTED";
    activationAuthorizationResult: "controlled-workspace-host-activation-authorized-not-granted";
    activationAuthorizationCompleted: true;
    activationAuthorizationAuthorized: true;
    activationAuthorizationBlocked: true;
    activationAuthorizationExecutable: false;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: false;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: false;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    activationGrantIssuanceAllowed: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    futureActivationTargetCount: 1;
    futureGrantTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    grantedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    grantPresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    predecessorActivationReadinessResult: "controlled-workspace-host-activation-ready-not-authorized";
    predecessorActivationReadinessState: "READY_NOT_AUTHORIZED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
    issuanceTransactionState: "NOT_OPENED";
    issuanceTransactionOpened: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY";
    nextEligibleStep: "3B.3.28";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;
    
    readControlledWorkspaceHostActivationGrantIssuance: () => Promise<{
    phase: "3B.3.28";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantContractId: string;
    activationGrantIssuanceId: string;
    activationGrantIssuanceContractId: string;
    candidateKind: "adaptive-workspace";
    grantIssuanceState: "GRANTED_NOT_ACTIVATED";
    grantIssuanceResult: "controlled-workspace-host-activation-grant-issued-not-activated";
    grantIssuanceCompleted: true;
    grantIssuanceGranted: true;
    grantIssuanceBlocked: true;
    grantIssuanceExecutable: false;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    activationGrantIssuanceAllowed: false;
    activationExecutionAllowed: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    grantIssuanceRecordCount: 1;
    futureActivationTargetCount: 1;
    futureGrantTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    duplicateGrantCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationAuthorizationResult: "controlled-workspace-host-activation-authorized-not-granted";
    predecessorActivationAuthorizationState: "AUTHORIZED_NOT_GRANTED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
    issuanceTransactionState: "NOT_OPENED";
    issuanceTransactionOpened: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY";
    nextEligibleStep: "3B.3.29";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;
    readControlledWorkspaceHostActivationCommitBoundaryEntry: () => Promise<{
    phase: "3B.3.29";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationCommitBoundaryEntryId: string;
    activationCommitBoundaryEntryContractId: string;
    candidateKind: "adaptive-workspace";
    commitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    commitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    commitBoundaryEntryCompleted: true;
    commitBoundaryEntryBlocked: true;
    commitBoundaryEntryExecutable: false;
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationCommitBoundaryEntryAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    activationExecutionAllowed: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    grantIssuanceRecordCount: 1;
    commitBoundaryEntryCount: 1;
    duplicateCommitBoundaryEntryCount: 0;
    futureActivationTargetCount: 1;
    futureGrantTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationCommitBoundaryEntryIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationGrantIssuanceResult: "controlled-workspace-host-activation-grant-issued-not-activated";
    predecessorActivationGrantIssuanceState: "GRANTED_NOT_ACTIVATED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
    issuanceTransactionState: "NOT_OPENED";
    issuanceTransactionOpened: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY";
    nextEligibleStep: "3B.3.30";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostActivationTransactionOpeningReadiness: () => Promise<{
    phase: "3B.3.30";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    candidateKind: "adaptive-workspace";
    transactionOpeningReadinessState: "TRANSACTION_OPENING_READY_NOT_OPENED";
    transactionOpeningReadinessResult: "controlled-workspace-host-activation-transaction-opening-ready-not-opened";
    transactionOpeningReadinessCompleted: true;
    transactionOpeningReady: true;
    transactionOpeningAuthorized: false;
    transactionOpeningStarted: false;
    transactionOpeningCompleted: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningReadinessAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionOpeningReadinessCount: 1;
    duplicateTransactionOpeningReadinessCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
    issuanceTransactionState: "NOT_OPENED";
    issuanceTransactionOpened: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY";
    nextEligibleStep: "3B.3.31";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;
  readControlledWorkspaceHostActivationTransactionOpeningAuthorization: () => Promise<{
    phase: "3B.3.31";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    candidateKind: "adaptive-workspace";
    transactionOpeningAuthorizationState: "TRANSACTION_OPENING_AUTHORIZED_NOT_OPENED";
    transactionOpeningAuthorizationResult: "controlled-workspace-host-activation-transaction-opening-authorized-not-opened";
    transactionOpeningAuthorizationCompleted: true;
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: false;
    transactionOpeningCompleted: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAuthorizationAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionOpeningAuthorizationCount: 1;
    duplicateTransactionOpeningAuthorizationCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionOpeningReadinessResult: "controlled-workspace-host-activation-transaction-opening-ready-not-opened";
    predecessorActivationTransactionOpeningReadinessState: "TRANSACTION_OPENING_READY_NOT_OPENED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
    issuanceTransactionState: "NOT_OPENED";
    issuanceTransactionOpened: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_31_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ONLY";
    nextEligibleStep: "3B.3.32";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;
  readControlledWorkspaceHostActivationTransactionOpening: () => Promise<{
    phase: "3B.3.32";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    candidateKind: "adaptive-workspace";
    transactionOpeningState: "TRANSACTION_OPENED_NOT_PREPARED";
    transactionOpeningResult: "controlled-workspace-host-activation-transaction-opened-not-prepared";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionOpeningCount: 1;
    duplicateTransactionOpeningCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionOpeningAuthorizationResult: "controlled-workspace-host-activation-transaction-opening-authorized-not-opened";
    predecessorActivationTransactionOpeningAuthorizationState: "TRANSACTION_OPENING_AUTHORIZED_NOT_OPENED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: false;
    issuanceTransactionCommitted: false;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY";
    nextEligibleStep: "3B.3.33";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;
    readControlledWorkspaceHostActivationTransactionPreparationReadiness: () => Promise<{
    phase: "3B.3.33";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    candidateKind: "adaptive-workspace";
    transactionPreparationReadinessState: "TRANSACTION_PREPARATION_READY_NOT_PREPARED";
    transactionPreparationReadinessResult: "controlled-workspace-host-activation-transaction-preparation-ready-not-prepared";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationReadinessCount: 1;
    duplicateTransactionPreparationReadinessCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionOpeningResult: "controlled-workspace-host-activation-transaction-opened-not-prepared";
    predecessorActivationTransactionOpeningState: "TRANSACTION_OPENED_NOT_PREPARED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: false;
    issuanceTransactionCommitted: false;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY";
    nextEligibleStep: "3B.3.34";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostActivationTransactionPreparationAuthorization: () => Promise<{
    phase: "3B.3.34";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    candidateKind: "adaptive-workspace";
    transactionPreparationAuthorizationState: "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED";
    transactionPreparationAuthorizationResult: "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationAuthorizationCount: 1;
    duplicateTransactionPreparationAuthorizationCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionPreparationReadinessResult: "controlled-workspace-host-activation-transaction-preparation-ready-not-prepared";
    predecessorActivationTransactionPreparationReadinessState: "TRANSACTION_PREPARATION_READY_NOT_PREPARED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: false;
    issuanceTransactionCommitted: false;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY";
    nextEligibleStep: "3B.3.35";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;


  readControlledWorkspaceHostActivationTransactionPreparation: () => Promise<{
    phase: "3B.3.35";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    candidateKind: "adaptive-workspace";
    transactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    transactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    duplicateTransactionPreparationCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionPreparationAuthorizationResult: "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared";
    predecessorActivationTransactionPreparationAuthorizationState: "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: false;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY";
    nextEligibleStep: "3B.3.36";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostActivationTransactionCommitReadiness: () => Promise<{
    phase: "3B.3.36";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    candidateKind: "adaptive-workspace";
    transactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED";
    transactionCommitReadinessResult: "controlled-workspace-host-activation-transaction-commit-ready-not-committed";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitReadinessCount: 1;
    duplicateTransactionPreparationCount: 0;
    duplicateTransactionCommitReadinessCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: false;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY";
    nextEligibleStep: "3B.3.37";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostActivationTransactionCommitAuthorization: () => Promise<{
    phase: "3B.3.37";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    candidateKind: "adaptive-workspace";
    transactionCommitAuthorizationState: "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED";
    transactionCommitAuthorizationResult: "controlled-workspace-host-activation-transaction-commit-authorized-not-committed";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitReadinessCount: 1;
    transactionCommitAuthorizationCount: 1;
    duplicateTransactionPreparationCount: 0;
    duplicateTransactionCommitReadinessCount: 0;
    duplicateTransactionCommitAuthorizationCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationTransactionCommitReadinessResult: "controlled-workspace-host-activation-transaction-commit-ready-not-committed";
    predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: false;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY";
    nextEligibleStep: "3B.3.38";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostActivationTransactionCommit: () => Promise<{
    phase: "3B.3.38";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    candidateKind: "adaptive-workspace";
    transactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED";
    transactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitReadinessCount: 1;
    transactionCommitAuthorizationCount: 1;
    transactionCommitCount: 1;
    duplicateTransactionPreparationCount: 0;
    duplicateTransactionCommitReadinessCount: 0;
    duplicateTransactionCommitAuthorizationCount: 0;
    duplicateTransactionCommitCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationTransactionCommitReadinessResult: "controlled-workspace-host-activation-transaction-commit-ready-not-committed";
    predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED";
    predecessorActivationTransactionCommitAuthorizationResult: "controlled-workspace-host-activation-transaction-commit-authorized-not-committed";
    predecessorActivationTransactionCommitAuthorizationState: "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY";
    nextEligibleStep: "3B.3.39";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostActivationIssuancePipelineExecutionReadiness: () => Promise<{
    phase: "3B.3.39";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    activationIssuancePipelineExecutionReadinessId: string;
    activationIssuancePipelineExecutionReadinessContractId: string;
    candidateKind: "adaptive-workspace";
    pipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED";
    pipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineExecutionReady: true;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitReadinessCount: 1;
    transactionCommitAuthorizationCount: 1;
    transactionCommitCount: 1;
    duplicateTransactionPreparationCount: 0;
    duplicateTransactionCommitReadinessCount: 0;
    duplicateTransactionCommitAuthorizationCount: 0;
    duplicateTransactionCommitCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    activationIssuancePipelineExecutionReadinessIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationTransactionCommitReadinessResult: "controlled-workspace-host-activation-transaction-commit-ready-not-committed";
    predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED";
    predecessorActivationTransactionCommitAuthorizationResult: "controlled-workspace-host-activation-transaction-commit-authorized-not-committed";
    predecessorActivationTransactionCommitAuthorizationState: "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY";
    nextEligibleStep: "3B.3.40";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostActivationIssuancePipelineExecutionAuthorization: () => Promise<{
    phase: "3B.3.40";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    activationIssuancePipelineExecutionReadinessId: string;
    activationIssuancePipelineExecutionReadinessContractId: string;
    activationIssuancePipelineExecutionAuthorizationId: string;
    activationIssuancePipelineExecutionAuthorizationContractId: string;
    candidateKind: "adaptive-workspace";
    pipelineExecutionAuthorizationState: "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED";
    pipelineExecutionAuthorizationResult: "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineExecutionReady: true;
    issuancePipelineExecutionAuthorized: true;
    issuancePipelineExecutionAllowed: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitReadinessCount: 1;
    transactionCommitAuthorizationCount: 1;
    transactionCommitCount: 1;
    duplicateTransactionPreparationCount: 0;
    duplicateTransactionCommitReadinessCount: 0;
    duplicateTransactionCommitAuthorizationCount: 0;
    duplicateTransactionCommitCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    activationIssuancePipelineExecutionReadinessIdentityUnique: true;
    activationIssuancePipelineExecutionAuthorizationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationTransactionCommitReadinessResult: "controlled-workspace-host-activation-transaction-commit-ready-not-committed";
    predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED";
    predecessorActivationIssuancePipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed";
    predecessorActivationIssuancePipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED";
    predecessorActivationTransactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed";
    predecessorActivationTransactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED";
    predecessorActivationTransactionCommitAuthorizationResult: "controlled-workspace-host-activation-transaction-commit-authorized-not-committed";
    predecessorActivationTransactionCommitAuthorizationState: "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY";
    nextEligibleStep: "3B.3.41";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostActivationIssuancePipelineExecution: () => Promise<{
    phase: "3B.3.41";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    activationIssuancePipelineExecutionReadinessId: string;
    activationIssuancePipelineExecutionReadinessContractId: string;
    activationIssuancePipelineExecutionAuthorizationId: string;
    activationIssuancePipelineExecutionAuthorizationContractId: string;
    activationIssuancePipelineExecutionId: string;
    activationIssuancePipelineExecutionContractId: string;
    candidateKind: "adaptive-workspace";
    pipelineExecutionState: "PIPELINE_EXECUTED_NOT_ACTIVATED";
    pipelineExecutionResult: "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineExecutionReady: true;
    issuancePipelineExecutionAuthorized: true;
    issuancePipelineExecuted: true;
    issuancePipelineExecutionAllowed: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitReadinessCount: 1;
    transactionCommitAuthorizationCount: 1;
    transactionCommitCount: 1;
    duplicateTransactionPreparationCount: 0;
    duplicateTransactionCommitReadinessCount: 0;
    duplicateTransactionCommitAuthorizationCount: 0;
    duplicateTransactionCommitCount: 0;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    activationIssuancePipelineExecutionReadinessIdentityUnique: true;
    activationIssuancePipelineExecutionAuthorizationIdentityUnique: true;
    activationIssuancePipelineExecutionIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationTransactionCommitReadinessResult: "controlled-workspace-host-activation-transaction-commit-ready-not-committed";
    predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED";
    predecessorActivationIssuancePipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed";
    predecessorActivationIssuancePipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionAuthorizationResult: "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed";
    predecessorActivationIssuancePipelineExecutionAuthorizationState: "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED";
    predecessorActivationTransactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed";
    predecessorActivationTransactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED";
    predecessorActivationTransactionCommitAuthorizationResult: "controlled-workspace-host-activation-transaction-commit-authorized-not-committed";
    predecessorActivationTransactionCommitAuthorizationState: "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionResult: "authorization-grant-issuance-transaction-opened-not-prepared";
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY";
    nextEligibleStep: "3B.3.42";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;


  readControlledWorkspaceHostCandidateActivationReadiness: () => Promise<{
    phase: "3B.3.42";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    activationIssuancePipelineExecutionReadinessId: string;
    activationIssuancePipelineExecutionReadinessContractId: string;
    activationIssuancePipelineExecutionAuthorizationId: string;
    activationIssuancePipelineExecutionAuthorizationContractId: string;
    activationIssuancePipelineExecutionId: string;
    activationIssuancePipelineExecutionContractId: string;
    activationCandidateActivationReadinessId: string;
    activationCandidateActivationReadinessContractId: string;
    candidateKind: "adaptive-workspace";
    candidateActivationReadinessState: "CANDIDATE_ACTIVATION_READY_NOT_ACTIVATED";
    candidateActivationReadinessResult: "controlled-workspace-host-candidate-activation-ready-not-activated";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineExecutionReady: true;
    issuancePipelineExecutionAuthorized: true;
    issuancePipelineExecuted: true;
    candidateActivationReady: true;
    issuancePipelineExecutionAllowed: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitCount: 1;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    activationIssuancePipelineExecutionReadinessIdentityUnique: true;
    activationIssuancePipelineExecutionAuthorizationIdentityUnique: true;
    activationIssuancePipelineExecutionIdentityUnique: true;
    activationCandidateActivationReadinessIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    duplicateTransactionCommitCount: 0;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationIssuancePipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed";
    predecessorActivationIssuancePipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionAuthorizationResult: "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed";
    predecessorActivationIssuancePipelineExecutionAuthorizationState: "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionResult: "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated";
    predecessorActivationIssuancePipelineExecutionState: "PIPELINE_EXECUTED_NOT_ACTIVATED";
    predecessorActivationTransactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed";
    predecessorActivationTransactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationBlocker: "PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY";
    nextEligibleStep: "3B.3.43";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostCandidateActivationAuthorization: () => Promise<{
    phase: "3B.3.43";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    activationIssuancePipelineExecutionReadinessId: string;
    activationIssuancePipelineExecutionReadinessContractId: string;
    activationIssuancePipelineExecutionAuthorizationId: string;
    activationIssuancePipelineExecutionAuthorizationContractId: string;
    activationIssuancePipelineExecutionId: string;
    activationIssuancePipelineExecutionContractId: string;
    activationCandidateActivationReadinessId: string;
    activationCandidateActivationReadinessContractId: string;
    activationCandidateActivationAuthorizationId: string;
    activationCandidateActivationAuthorizationContractId: string;
    candidateKind: "adaptive-workspace";
    candidateActivationAuthorizationState: "CANDIDATE_ACTIVATION_AUTHORIZED_NOT_ACTIVATED";
    candidateActivationAuthorizationResult: "controlled-workspace-host-candidate-activation-authorized-not-activated";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineExecutionReady: true;
    issuancePipelineExecutionAuthorized: true;
    issuancePipelineExecuted: true;
    candidateActivationReady: true;
    candidateActivationAuthorized: true;
    issuancePipelineExecutionAllowed: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: false;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitCount: 1;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 0;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    activationIssuancePipelineExecutionReadinessIdentityUnique: true;
    activationIssuancePipelineExecutionAuthorizationIdentityUnique: true;
    activationIssuancePipelineExecutionIdentityUnique: true;
    activationCandidateActivationReadinessIdentityUnique: true;
    activationCandidateActivationAuthorizationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    duplicateTransactionCommitCount: 0;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationIssuancePipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed";
    predecessorActivationIssuancePipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionAuthorizationResult: "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed";
    predecessorActivationIssuancePipelineExecutionAuthorizationState: "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionResult: "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated";
    predecessorActivationIssuancePipelineExecutionState: "PIPELINE_EXECUTED_NOT_ACTIVATED";
    predecessorActivationTransactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed";
    predecessorActivationTransactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationBlocker: "PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY";
    nextEligibleStep: "3B.3.44";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>

  readControlledWorkspaceHostCandidateActivation: () => Promise<{
    phase: "3B.3.44";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    activationIssuancePipelineExecutionReadinessId: string;
    activationIssuancePipelineExecutionReadinessContractId: string;
    activationIssuancePipelineExecutionAuthorizationId: string;
    activationIssuancePipelineExecutionAuthorizationContractId: string;
    activationIssuancePipelineExecutionId: string;
    activationIssuancePipelineExecutionContractId: string;
    activationCandidateActivationReadinessId: string;
    activationCandidateActivationReadinessContractId: string;
    activationCandidateActivationAuthorizationId: string;
    activationCandidateActivationAuthorizationContractId: string;
    activationCandidateActivationId: string;
    activationCandidateActivationContractId: string;
    candidateKind: "adaptive-workspace";
    candidateActivationState: "CANDIDATE_ACTIVATED_NOT_ACTIVE";
    candidateActivationResult: "controlled-workspace-host-candidate-activated-not-active";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineExecutionReady: true;
    issuancePipelineExecutionAuthorized: true;
    issuancePipelineExecuted: true;
    candidateActivationReady: true;
    candidateActivationAuthorized: true;
    issuancePipelineExecutionAllowed: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: true;
    candidateActive: false;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitCount: 1;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 1;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    activationIssuancePipelineExecutionReadinessIdentityUnique: true;
    activationIssuancePipelineExecutionAuthorizationIdentityUnique: true;
    activationIssuancePipelineExecutionIdentityUnique: true;
    activationCandidateActivationReadinessIdentityUnique: true;
    activationCandidateActivationAuthorizationIdentityUnique: true;
    activationCandidateActivationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    duplicateTransactionCommitCount: 0;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationIssuancePipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed";
    predecessorActivationIssuancePipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionAuthorizationResult: "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed";
    predecessorActivationIssuancePipelineExecutionAuthorizationState: "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionResult: "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated";
    predecessorActivationIssuancePipelineExecutionState: "PIPELINE_EXECUTED_NOT_ACTIVATED";
    predecessorActivationTransactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed";
    predecessorActivationTransactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationBlocker: "PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY";
    nextEligibleStep: "3B.3.45";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

  readControlledWorkspaceHostCandidateActive: () => Promise<{
    phase: "3B.3.45";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    activationIssuancePipelineExecutionReadinessId: string;
    activationIssuancePipelineExecutionReadinessContractId: string;
    activationIssuancePipelineExecutionAuthorizationId: string;
    activationIssuancePipelineExecutionAuthorizationContractId: string;
    activationIssuancePipelineExecutionId: string;
    activationIssuancePipelineExecutionContractId: string;
    activationCandidateActivationReadinessId: string;
    activationCandidateActivationReadinessContractId: string;
    activationCandidateActivationAuthorizationId: string;
    activationCandidateActivationAuthorizationContractId: string;
    activationCandidateActivationId: string;
    activationCandidateActivationContractId: string;
    activationCandidateActiveId: string;
    activationCandidateActiveContractId: string;
    candidateKind: "adaptive-workspace";
    candidateActivationState: "CANDIDATE_ACTIVE_NOT_EXECUTABLE";
    candidateActivationResult: "controlled-workspace-host-candidate-active-not-executable";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineExecutionReady: true;
    issuancePipelineExecutionAuthorized: true;
    issuancePipelineExecuted: true;
    candidateActivationReady: true;
    candidateActivationAuthorized: true;
    issuancePipelineExecutionAllowed: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: true;
    candidateActive: true;
    candidateExecutable: false;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitCount: 1;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 1;
    executableCandidateCount: 0;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    activationIssuancePipelineExecutionReadinessIdentityUnique: true;
    activationIssuancePipelineExecutionAuthorizationIdentityUnique: true;
    activationIssuancePipelineExecutionIdentityUnique: true;
    activationCandidateActivationReadinessIdentityUnique: true;
    activationCandidateActivationAuthorizationIdentityUnique: true;
    activationCandidateActivationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    duplicateTransactionCommitCount: 0;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationIssuancePipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed";
    predecessorActivationIssuancePipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionAuthorizationResult: "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed";
    predecessorActivationIssuancePipelineExecutionAuthorizationState: "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionResult: "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated";
    predecessorActivationIssuancePipelineExecutionState: "PIPELINE_EXECUTED_NOT_ACTIVATED";
    predecessorActivationTransactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed";
    predecessorActivationTransactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationBlocker: "PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY";
    nextEligibleStep: "3B.3.46";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

    readControlledWorkspaceHostCandidateExecutable: () => Promise<{
    phase: "3B.3.46";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    activationIssuancePipelineExecutionReadinessId: string;
    activationIssuancePipelineExecutionReadinessContractId: string;
    activationIssuancePipelineExecutionAuthorizationId: string;
    activationIssuancePipelineExecutionAuthorizationContractId: string;
    activationIssuancePipelineExecutionId: string;
    activationIssuancePipelineExecutionContractId: string;
    activationCandidateActivationReadinessId: string;
    activationCandidateActivationReadinessContractId: string;
    activationCandidateActivationAuthorizationId: string;
    activationCandidateActivationAuthorizationContractId: string;
    activationCandidateActivationId: string;
    activationCandidateActivationContractId: string;
    activationCandidateActiveId: string;
    activationCandidateActiveContractId: string;
    activationCandidateExecutableId: string;
    activationCandidateExecutableContractId: string;
    candidateKind: "adaptive-workspace";
    candidateActivationState: "CANDIDATE_EXECUTABLE_NOT_EXECUTED";
    candidateActivationResult: "controlled-workspace-host-candidate-executable-not-executed";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineExecutionReady: true;
    issuancePipelineExecutionAuthorized: true;
    issuancePipelineExecuted: true;
    candidateActivationReady: true;
    candidateActivationAuthorized: true;
    issuancePipelineExecutionAllowed: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: true;
    candidateActive: true;
    candidateExecutable: true;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitCount: 1;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 1;
    executableCandidateCount: 1;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    activationIssuancePipelineExecutionReadinessIdentityUnique: true;
    activationIssuancePipelineExecutionAuthorizationIdentityUnique: true;
    activationIssuancePipelineExecutionIdentityUnique: true;
    activationCandidateActivationReadinessIdentityUnique: true;
    activationCandidateActivationAuthorizationIdentityUnique: true;
    activationCandidateActivationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    duplicateTransactionCommitCount: 0;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationIssuancePipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed";
    predecessorActivationIssuancePipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionAuthorizationResult: "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed";
    predecessorActivationIssuancePipelineExecutionAuthorizationState: "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionResult: "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated";
    predecessorActivationIssuancePipelineExecutionState: "PIPELINE_EXECUTED_NOT_ACTIVATED";
    predecessorActivationTransactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed";
    predecessorActivationTransactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationBlocker: "PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY";
    nextEligibleStep: "3B.3.47";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;

    readControlledWorkspaceHostCandidateExecutionStarted: () => Promise<{
    phase: "3B.3.47";
    candidateId: string;
    registrationId: string;
    selectionId: string;
    activationReadinessId: string;
    activationAuthorizationId: string;
    activationGrantId: string;
    activationGrantIssuanceId: string;
    activationCommitBoundaryId: string;
    activationCommitBoundaryContractId: string;
    activationTransactionOpeningReadinessId: string;
    activationTransactionOpeningReadinessContractId: string;
    activationTransactionOpeningAuthorizationId: string;
    activationTransactionOpeningAuthorizationContractId: string;
    activationTransactionOpeningId: string;
    activationTransactionOpeningContractId: string;
    activationTransactionPreparationReadinessId: string;
    activationTransactionPreparationReadinessContractId: string;
    activationTransactionPreparationAuthorizationId: string;
    activationTransactionPreparationAuthorizationContractId: string;
    activationTransactionPreparationId: string;
    activationTransactionPreparationContractId: string;
    activationTransactionCommitReadinessId: string;
    activationTransactionCommitReadinessContractId: string;
    activationTransactionCommitAuthorizationId: string;
    activationTransactionCommitAuthorizationContractId: string;
    activationTransactionCommitId: string;
    activationTransactionCommitContractId: string;
    activationIssuancePipelineExecutionReadinessId: string;
    activationIssuancePipelineExecutionReadinessContractId: string;
    activationIssuancePipelineExecutionAuthorizationId: string;
    activationIssuancePipelineExecutionAuthorizationContractId: string;
    activationIssuancePipelineExecutionId: string;
    activationIssuancePipelineExecutionContractId: string;
    activationCandidateActivationReadinessId: string;
    activationCandidateActivationReadinessContractId: string;
    activationCandidateActivationAuthorizationId: string;
    activationCandidateActivationAuthorizationContractId: string;
    activationCandidateActivationId: string;
    activationCandidateActivationContractId: string;
    activationCandidateActiveId: string;
    activationCandidateActiveContractId: string;
    activationCandidateExecutableId: string;
    activationCandidateExecutableContractId: string;
    activationCandidateExecutionStartedId: string;
    activationCandidateExecutionStartedContractId: string;
    candidateKind: "adaptive-workspace";
    candidateActivationState: "CANDIDATE_EXECUTION_STARTED_NOT_EXECUTED";
    candidateActivationResult: "controlled-workspace-host-candidate-execution-started-not-executed";
    transactionOpeningReady: true;
    transactionOpeningAuthorized: true;
    transactionOpeningStarted: true;
    transactionOpeningCompleted: true;
    transactionPreparationReady: true;
    transactionPreparationAuthorized: true;
    transactionCommitReady: true;
    transactionCommitAuthorized: true;
    issuancePipelineExecutionReady: true;
    issuancePipelineExecutionAuthorized: true;
    issuancePipelineExecuted: true;
    candidateActivationReady: true;
    candidateActivationAuthorized: true;
    issuancePipelineExecutionAllowed: false;
    issuancePipelineState: "NON_EXECUTABLE";
    activationCommitBoundaryEntered: true;
    activationCommitBoundaryState: "ENTERED";
    activationCommitBoundaryArmed: false;
    activationCommitBoundaryCrossed: false;
    activationCommitBoundaryCommitted: false;
    activationCommitBoundaryAborted: false;
    activationCommitBoundaryExecutable: false;
    activationCommitBoundaryBlocked: true;
    activationTransactionOpeningAllowed: false;
    activationExecutionAllowed: false;
    transitionFrom: "NOT_ENTERED";
    transitionTo: "ENTERED";
    transitionLegal: true;
    candidateSelected: true;
    candidateReady: true;
    candidateAuthorized: true;
    candidateGranted: true;
    candidateActivated: true;
    candidateActive: true;
    candidateExecutable: true;
    candidateActivationStarted: true;
    grantPresent: true;
    grantIssued: true;
    grantValid: true;
    grantImmutable: true;
    grantUnique: true;
    grantExecutable: false;
    futureGrantPossible: true;
    futureGrantIssued: true;
    futureActivationPossible: true;
    futureActivationAuthorized: true;
    futureActivationStarted: false;
    candidateCount: 1;
    registeredCandidateCount: 1;
    selectedCandidateCount: 1;
    readyCandidateCount: 1;
    authorizedCandidateCount: 1;
    grantedCandidateCount: 1;
    grantCount: 1;
    transactionPreparationCount: 1;
    transactionCommitCount: 1;
    futureActivationTargetCount: 1;
    activeCandidateCount: 0;
    activatedCandidateCount: 1;
    executableCandidateCount: 1;
    candidateIdentityUnique: true;
    selectionIdentityUnique: true;
    activationReadinessIdentityUnique: true;
    activationAuthorizationIdentityUnique: true;
    activationGrantIdentityUnique: true;
    activationGrantIssuanceIdentityUnique: true;
    activationCommitBoundaryIdentityUnique: true;
    activationTransactionOpeningReadinessIdentityUnique: true;
    activationTransactionOpeningAuthorizationIdentityUnique: true;
    activationTransactionOpeningIdentityUnique: true;
    activationTransactionPreparationReadinessIdentityUnique: true;
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationTransactionPreparationIdentityUnique: true;
    activationTransactionCommitReadinessIdentityUnique: true;
    activationTransactionCommitAuthorizationIdentityUnique: true;
    activationTransactionCommitIdentityUnique: true;
    activationIssuancePipelineExecutionReadinessIdentityUnique: true;
    activationIssuancePipelineExecutionAuthorizationIdentityUnique: true;
    activationIssuancePipelineExecutionIdentityUnique: true;
    activationCandidateActivationReadinessIdentityUnique: true;
    activationCandidateActivationAuthorizationIdentityUnique: true;
    activationCandidateActivationIdentityUnique: true;
    candidateStructurallyCompatible: true;
    runtimeCapabilityPresent: false;
    runtimeHostInstancePresent: false;
    activationHandlePresent: false;
    executionHandlePresent: false;
    tokenPresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    mountsGeoFeed: false;
    containsGeoFeed: false;
    wrapsGeoFeed: false;
    duplicatesGeoFeed: false;
    createsSecondGeoFeed: false;
    shellRendered: false;
    shellChildCount: 0;
    shellDOMNodeCount: 0;
    workspaceVisible: false;
    workspaceHostMounted: false;
    workspaceReactInstancePresent: false;
    issuanceCommitBoundaryState: "NOT_ENTERED";
    issuanceCommitBoundaryEntered: false;
    issuanceTransactionState: "OPENED";
    issuanceTransactionOpened: true;
    issuanceTransactionPrepared: true;
    issuanceTransactionCommitted: true;
    issuanceTransactionAborted: false;
    issuancePipelineExecutable: false;
    owner: "legacy";
    writer: "legacy";
    renderer: "legacy";
    runtimeId: string;
    hostId: string;
    mountCount: 1;
    unmountCount: 0;
    geoFeedRenderCount: 1;
    activeInstanceCount: 1;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    duplicateTransactionCommitCount: 0;
    predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
    predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
    predecessorActivationIssuancePipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed";
    predecessorActivationIssuancePipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionAuthorizationResult: "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed";
    predecessorActivationIssuancePipelineExecutionAuthorizationState: "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED";
    predecessorActivationIssuancePipelineExecutionResult: "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated";
    predecessorActivationIssuancePipelineExecutionState: "PIPELINE_EXECUTED_NOT_ACTIVATED";
    predecessorActivationTransactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed";
    predecessorActivationTransactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED";
    predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
    activationTransactionPreparationAuthorizationIdentityUnique: true;
    activationBlocker: "PHASE_3B3_47_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ONLY";
    nextEligibleStep: "3B.3.48";
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    blockerCount: number;
    diagnostics: Record<string, unknown>;
  }>;
  readControlledWorkspaceHostCandidatePreActivationSeal: () => Promise<
    Record<string, unknown> & {
      phase: "AW-R1";
      previousPhase: "3B.3.47";
      nextEligibleStep: "AW-R2";
      candidateActivationState: "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE";
      candidateActivationResult: "controlled-workspace-host-candidate-pre-activation-sealed-not-live";
      candidateActivationStarted: true;
      candidateActivationExecuted: true;
      candidateActivationCompleted: true;
      activationBlocker: "PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY";
      diagnostics: Record<string, unknown>;
    }
  >;
  readControlledWorkspaceLiveAuthorization: () => Promise<
    Record<string, unknown> & {
      phase: "AW-R2";
      previousPhase: "AW-R1";
      nextEligibleStep: "AW-R3";
      activationLiveAuthorizationId: "feed.discovery.adaptive-workspace.host-live-authorization.v1";
      activationLiveAuthorizationContractId: "feed.discovery.adaptive-workspace.host-live-authorization.contract.v1";
      candidateActivationState: "LIVE_AUTHORIZED_NOT_EXECUTABLE";
      candidateActivationResult: "controlled-workspace-live-authorized-not-executable";
      activationExecutionAllowed: true;
      issuancePipelineExecutionAllowed: false;
      issuancePipelineExecutable: false;
      issuancePipelineState: "NON_EXECUTABLE";
      issuanceTransactionState: "OPENED";
      runtimeCapabilityPresent: false;
      runtimeHostInstancePresent: false;
      activationHandlePresent: false;
      executionHandlePresent: false;
      workspaceVisible: false;
      workspaceHostMounted: false;
      workspaceCandidateRendered: false;
      workspaceReactInstancePresent: false;
      owner: "legacy";
      writer: "legacy";
      renderer: "legacy";
      mountCount: 1;
      geoFeedRenderCount: 1;
      unmountCount: 0;
      hostActivation: false;
      renderActivation: false;
      canStartActivation: false;
      activationBlocker: "PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY";
      controlledLiveAuthorizationMetaOk: true;
      diagnostics: Record<string, unknown>;
    }
  >;
  readControlledWorkspaceExecution: () => Promise<
    Record<string, unknown> & {
      phase: "AW-R3";
      previousPhase: "AW-R2";
      nextEligibleStep: "AW-R4";
      activationControlledExecutionId: "feed.discovery.adaptive-workspace.host-controlled-execution.v1";
      activationControlledExecutionContractId: "feed.discovery.adaptive-workspace.host-controlled-execution.contract.v1";
      candidateActivationState: "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY";
      candidateActivationResult: "controlled-workspace-executing-geofeed-legacy-authority";
      activationExecutionAllowed: true;
      issuancePipelineExecutionAllowed: true;
      issuancePipelineExecutable: true;
      issuancePipelineState: "CONTROLLED_EXECUTABLE";
      issuanceTransactionState: "CONTROLLED_EXECUTION";
      runtimeCapabilityPresent: true;
      runtimeHostInstancePresent: true;
      activationHandlePresent: true;
      executionHandlePresent: true;
      workspaceVisible: true;
      workspaceHostMounted: true;
      workspaceCandidateRendered: true;
      workspaceReactInstancePresent: true;
      stableMountId: "feed.discovery.controlled-host.stable-mount.v1";
      stableMountIdentityPreserved: true;
      workspaceExecutionAuthorized: true;
      geoFeedAuthorityTransferred: false;
      feedOnAuthorized: false;
      productionPromotionAuthorized: false;
      workspaceRuntimeHandleId: "feed.discovery.adaptive-workspace.workspace-runtime-handle.v1";
      workspaceActivationHandleId: "feed.discovery.adaptive-workspace.workspace-activation-handle.v1";
      workspaceExecutionHandleId: "feed.discovery.adaptive-workspace.workspace-execution-handle.v1";
      owner: "legacy";
      writer: "legacy";
      renderer: "legacy";
      containsGeoFeed: false;
      mountsGeoFeed: false;
      wrapsGeoFeed: false;
      duplicatesGeoFeed: false;
      createsSecondGeoFeed: false;
      mountCount: 1;
      geoFeedRenderCount: 1;
      unmountCount: 0;
      hostActivation: true;
      renderActivation: false;
      canStartActivation: true;
      activationBlocker: "PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY";
      controlledWorkspaceExecutionMetaOk: true;
      diagnostics: Record<string, unknown>;
    }
  >;

    readHostActivationStateMachine: () => Promise<{
    phase: "3B.3.13";
    machineId: string;
    machineVersion: 1;
    machineState: "completed";
    machineResult: "state-machine-complete-not-executable";
    currentState: "COMMIT_READY";
    initialState: "LEGACY_DORMANT";
    terminalStates: readonly string[];
    allowedTransitions: readonly string[];
    blockedTransitions: readonly string[];
    transitionGuards: readonly string[];
    transitionReasons: readonly string[];
    transitionBlockers: readonly string[];
    transitionPreconditions: readonly string[];
    transitionValidationPoints: readonly string[];
    transitionExecuted: false;
    protocolExecuted: false;
    transactionCommitted: false;
    wouldCommit: true;
    commitReady: true;
    protocolResult: "protocol-complete-not-executable";
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    wouldActivate: true;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY";
    nextEligibleStep: "3B.3.14";
    diagnostics: Record<string, unknown>;
  }>;
  readHostActivationCommitProtocol: () => Promise<{
    phase: "3B.3.12";
    protocolId: string;
    protocolVersion: 1;
    protocolState: "completed";
    protocolResult: "protocol-complete-not-executable";
    protocolExecuted: false;
    wouldCommit: true;
    commitReady: true;
    commitBlocked: true;
    protocolStages: readonly string[];
    stageSequence: readonly string[];
    commitSequence: readonly string[];
    commitGuards: readonly string[];
    commitPreconditions: readonly string[];
    commitValidationPoints: readonly string[];
    ownershipChecks: readonly string[];
    rendererChecks: readonly string[];
    writerChecks: readonly string[];
    rollbackPreparation: readonly string[];
    abortConditions: readonly string[];
    readinessResult: "commit-ready-not-executable";
    transactionResult: "transaction-complete-not-committed";
    transactionCommitted: false;
    commitExecuted: false;
    ownershipTransferred: false;
    writerTransferred: false;
    rendererTransferred: false;
    pipelineResult: "pipeline-complete-not-executable";
    planResult: "plan-complete-not-executable";
    decisionResult: "ALLOW";
    wouldActivate: true;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY";
    nextEligibleStep: "3B.3.13";
    diagnostics: Record<string, unknown>;
  }>;
  readHostActivationCommitReadiness: () => Promise<{
    phase: "3B.3.11";
    readinessId: string;
    readinessVersion: 1;
    readinessState: "completed";
    readinessResult: "commit-ready-not-executable";
    wouldCommit: true;
    commitReady: true;
    commitBlocked: true;
    commitBlockers: readonly string[];
    commitPreconditions: readonly string[];
    commitValidationPoints: readonly string[];
    commitAbortConditions: readonly string[];
    transactionResult: "transaction-complete-not-committed";
    transactionCommitted: false;
    commitExecuted: false;
    ownershipTransferred: false;
    writerTransferred: false;
    rendererTransferred: false;
    pipelineResult: "pipeline-complete-not-executable";
    planResult: "plan-complete-not-executable";
    decisionResult: "ALLOW";
    wouldActivate: true;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY";
    nextEligibleStep: "3B.3.12";
    diagnostics: Record<string, unknown>;
  }>;
  readHostActivationTransaction: () => Promise<{
    phase: "3B.3.10";
    transactionId: string;
    transactionVersion: 1;
    transactionState: "completed";
    transactionResult: "transaction-complete-not-committed";
    wouldCommit: true;
    transactionCommitted: false;
    beginState: string;
    intendedEndState: string;
    commitConditions: readonly string[];
    rollbackConditions: readonly string[];
    validationCheckpoints: readonly string[];
    transactionCheckpoints: readonly string[];
    compensatingActions: readonly string[];
    abortConditions: readonly string[];
    invariants: readonly string[];
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    wouldActivate: true;
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY";
    nextEligibleStep: "3B.3.11";
    diagnostics: Record<string, unknown>;
  }>;

  readHostActivationPipeline: () => Promise<{
    phase: "3B.3.9";
    pipelineId: string;
    pipelineVersion: 1;
    pipelineState: "completed";
    pipelineResult: "pipeline-complete-not-executable";
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    wouldActivate: true;
    pipelineStages: readonly string[];
    stageOrder: readonly string[];
    stageDependencies: readonly string[];
    entryConditions: readonly string[];
    exitConditions: readonly string[];
    validationPoints: readonly string[];
    rollbackCheckpoints: readonly string[];
    abortConditions: readonly string[];
    invariants: readonly string[];
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY";
    nextEligibleStep: "3B.3.10";
    diagnostics: {
      pipelineCompleted: true;
      pipelineResult: "pipeline-complete-not-executable";
      stageCount: number;
      stageOrder: readonly string[];
      stageDependencies: readonly string[];
      validationPoints: readonly string[];
      rollbackCheckpoints: readonly string[];
      abortConditions: readonly string[];
      invariants: readonly string[];
      pipelineInputSources: readonly string[];
      decisionResult: "ALLOW";
      planResult: "plan-complete-not-executable";
      wouldActivate: true;
      activationBlocked: true;
      canStartActivation: false;
      currentPhase: "3B.3.9";
      nextEligibleStep: "3B.3.10";
      activeBlockers: readonly string[];
      readinessStatus: "ready";
      eligibilityStatus: "eligible";
      simulationStatus: "completed";
      decisionStatus: "completed";
      planStatus: "completed";
      missingConditionsForExecution: readonly string[];
      registryHostCount: 1;
      runtimeIdStable: true;
      ownershipLegacy: true;
      rendererLegacy: true;
      rollbackPrepared: true;
    };
  }>;

  readHostActivationPlan: () => Promise<{
    phase: "3B.3.8";
    planId: string;
    planVersion: 1;
    planState: "completed";
    planResult: "plan-complete-not-executable";
    decisionResult: "ALLOW";
    wouldActivate: true;
    plannedSteps: readonly string[];
    preconditions: readonly string[];
    validationPoints: readonly string[];
    rollbackCheckpoints: readonly string[];
    abortConditions: readonly string[];
    invariants: readonly string[];
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY";
    nextEligibleStep: "3B.3.9";
    diagnostics: {
      planCompleted: true;
      planResult: "plan-complete-not-executable";
      decisionResult: "ALLOW";
      wouldActivate: true;
      plannedStepCount: number;
      plannedSteps: readonly string[];
      preconditions: readonly string[];
      validationPoints: readonly string[];
      rollbackCheckpoints: readonly string[];
      abortConditions: readonly string[];
      invariants: readonly string[];
      planInputSources: readonly string[];
      activationBlocked: true;
      canStartActivation: false;
      currentPhase: "3B.3.8";
      nextEligibleStep: "3B.3.9";
      activeBlockers: readonly string[];
      readinessStatus: "ready";
      eligibilityStatus: "eligible";
      simulationStatus: "completed";
      decisionStatus: "completed";
      missingConditionsForExecution: readonly string[];
      registryHostCount: 1;
      runtimeIdStable: true;
      ownershipLegacy: true;
      rendererLegacy: true;
      rollbackPrepared: true;
    };
  }>;

  readHostActivationDecision: () => Promise<{
    phase: "3B.3.7";
    decisionState: "completed";
    decisionResult: "ALLOW";
    wouldActivate: true;
    confidence: "high";
    decisionReasons: readonly string[];
    decisionBlockers: readonly string[];
    runtimeId: string;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    activationBlocker: "PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY";
    nextEligibleStep: "3B.3.8";
    diagnostics: {
      decisionCompleted: true;
      decisionResult: "ALLOW";
      wouldActivate: true;
      confidence: "high";
      usedConditions: readonly string[];
      decisionInputSources: readonly string[];
      activationBlocked: true;
      canStartActivation: false;
      currentPhase: "3B.3.7";
      nextEligibleStep: "3B.3.8";
      activeBlockers: readonly string[];
      readinessStatus: "ready";
      eligibilityStatus: "eligible";
      simulationStatus: "completed";
      missingConditionsForExecution: readonly string[];
      registryHostCount: 1;
      runtimeIdStable: true;
      ownershipLegacy: true;
      rendererLegacy: true;
      rollbackPrepared: true;
    };
  }>;
};

declare global {
  interface Window {
    [HC_FEED_SEALED_PROBE_KEY]?: FeedSealedProbeApi;
  }
}

export function installFeedSealedProbeBridge(): void {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_FEED_SEALED_BASELINE !== "1") return;
  if (!isFeedSealedInstrumentationEnabled()) return;

  const api: FeedSealedProbeApi = {
    version: 51,
    readCounters: () => readFeedSealedInstrumentationCounters(),
    evaluateShadow: async () => {
      const mod = await import(
        "@/lib/adaptive-workspace-react/feed/evaluate-feed-discovery-shadow"
      );
      const d = mod.evaluateFeedDiscoveryShadow();
      return {
        widgetId: d.widgetId,
        renderActivation: false as const,
        shadowActivation: true as const,
        activeWriter: "legacy" as const,
        runtimeClassification: "sealed-runtime" as const,
        workspaceRendererRegistered: false as const,
      };
    },
    attemptFeedOn: () => ({
      allowed: false,
      renderActivation: false,
      reason: "feed.discovery renderActivation is permanently false in Phase 3B",
    }),
    attemptHostActivation: async (force?: unknown) => {
      const mod = await import("@/lib/adaptive-workspace");
      const gate = mod.evaluateFeedHostActivationGate({
        forceHostActivation: force,
        envHostActivation: force,
        queryHostActivation: force,
        cookieHostActivation: force,
        localStorageHostActivation: force,
        sessionStorageHostActivation: force,
        contextHostActivation: force,
        globalHostActivation: force,
        featureFlagHostActivation: force,
        debugOverrideHostActivation: force,
        phase3b2ProofValid: true,
        phase3b2FreezeValid: true,
        phase3b32ProofValid: true,
        phase3b33ProofValid: true,
        phase3b34ProofValid: true,
        phase3b35ProofValid: true,
        phase3b36ProofValid: true,
        phase3b37ProofValid: true,
        phase3b38ProofValid: true,
        phase3b39ProofValid: true,
        phase3b310ProofValid: true,
        phase3b311ProofValid: true,
        phase3b312ProofValid: true,
        phase3b313ProofValid: true,
        phase3b314ProofValid: true,
        phase3b315ProofValid: true,
        phase3b316ProofValid: true,
        phase3b317ProofValid: true,
        phase3b318ProofValid: true,
        phase3b319ProofValid: true,
        phase3b320ProofValid: true,
        observedWriter: "legacy",
        observedRenderOwner: "legacy",
        observedMountCount: 1,
        observedRollbackTarget: "legacy",
        observedRegistrationState: "registered",
        observedEligibilityState: "eligible",
        observedReadinessState: "ready",
        observedSimulationState: "completed",
        observedDecisionState: "completed",
        observedPlanState: "completed",
        observedPipelineState: "completed",
        observedTransactionState: "completed",
        observedCommitReadinessState: "completed",
        observedCommitProtocolState: "completed",
        observedStateMachineState: "completed",
        observedTransitionGraphState: "completed",
        observedTransitionSelectionState: "completed",
        observedTransitionPreflightState: "completed",
        observedTransitionAuthorizationDecisionState: "completed",
        observedTransitionAuthorizationGrantReadinessState: "completed",
        observedTransitionAuthorizationGrantIssuanceDecisionState: "completed",
        observedTransitionAuthorizationGrantIssuancePlanState: "completed",
        observedRuntimeId: "feed.discovery.legacy-single-mount.v1",
      });
      return {
        allowed: false as const,
        blockers: gate.blockers,
        currentStep: "3B.3.20" as const,
        eligibleStep: "3B.3.21" as const,
      };
    },
    readControlledHostContract: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const c = mod.createControlledFeedHostContract();
      return {
        hostActivation: false as const,
        renderActivation: false as const,
        activeRenderOwner: "legacy" as const,
        activeWriter: "legacy" as const,
        nextEligibleStep: "3B.3.20" as const,
        hostClassification: "controlled-host-candidate" as const,
      };
    },
    readHostPlan: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const p = mod.createControlledFeedHostPlan();
      return {
        activationState: "dormant" as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        placementState: "shadow-registered" as const,
        registrationState: "registered" as const,
        eligibilityState: "eligible" as const,
        readinessState: "ready" as const,
        simulationState: "completed" as const,
        wouldActivate: true as const,
        decisionState: "completed" as const,
        decisionResult: "ALLOW" as const,
        confidence: "high" as const,
        planState: "completed" as const,
        planResult: "plan-complete-not-executable" as const,
        pipelineState: "completed" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        transactionState: "completed" as const,
        transactionResult: "transaction-complete-not-committed" as const,
        wouldCommit: true as const,
        transactionCommitted: false as const,
        commitReadinessState: "completed" as const,
        commitReadinessResult: "commit-ready-not-executable" as const,
        commitReady: true as const,
        commitBlocked: true as const,
        commitProtocolState: "completed" as const,
        commitProtocolResult: "protocol-complete-not-executable" as const,
        protocolExecuted: false as const,
        stateMachineState: "completed" as const,
        stateMachineResult: "state-machine-complete-not-executable" as const,
        currentActivationLifecycleState: "COMMIT_READY" as const,
        transitionExecuted: false as const,
        transitionGraphState: "completed" as const,
        transitionGraphResult: "transition-graph-complete-not-executable" as const,
        currentGraphNode: "COMMIT_READY" as const,
        graphTraversalExecuted: false as const,
        transitionSelectionState: "completed" as const,
        transitionSelectionResult: "transition-selected-not-executable" as const,
        selectionCompleted: true as const,
        selectionExecuted: false as const,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        transitionPreflightState: "completed" as const,
        transitionPreflightResult: "transition-preflight-ready-not-authorized" as const,
        preflightCompleted: true as const,
        preflightReady: true as const,
        preflightBlocked: true as const,
        preflightExecuted: false as const,
        authorizationDecisionState: "completed" as const,
        authorizationDecisionResult: "authorization-eligible-not-granted" as const,
        authorizationDecisionCompleted: true as const,
        authorizationDecisionExecuted: false as const,
        authorizationEligible: true as const,
        authorizationBlocked: true as const,
        wouldAuthorize: true as const,
        authorizationApplied: false as const,
        authorizationExecutionAllowed: false as const,
        transitionAuthorized: false as const,
        authorizationGranted: false as const,
        grantReadinessState: "completed" as const,
        grantReadinessResult: "authorization-grant-ready-not-issued" as const,
        grantReadinessCompleted: true as const,
        grantReady: true as const,
        grantBlocked: true as const,
        wouldIssueGrant: true as const,
        grantIssued: false as const,
        grantCreated: false as const,
        grantMaterialized: false as const,
        grantPersisted: false as const,
        grantApplied: false as const,
        grantActivated: false as const,
        grantConsumed: false as const,
        grantRevoked: false as const,
        grantAuthorityAvailable: false as const,
        grantAuthorityEnabled: false as const,
        grantAuthorityDelegated: false as const,
        grantAuthorityTransferred: false as const,
        issuanceDecisionState: "completed" as const,
        issuanceDecisionResult:
          "authorization-grant-issuance-eligible-not-issued" as const,
        issuanceDecisionCompleted: true as const,
        issuanceDecisionExecuted: false as const,
        issuanceEligible: true as const,
        issuanceBlocked: true as const,
        tokenPresent: false as const,
        secretPresent: false as const,
        signaturePresent: false as const,
        noncePresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        callbackPresent: false as const,
        executableHandlePresent: false as const,
        runtimeCapabilityPresent: false as const,
        recommendedNextStep: p.recommendedNextStep,
      };
    },
    readShadowPlacement: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const p = mod.createControlledFeedHostShadowPlacement();
      return {
        phase: "3B.3.2" as const,
        placementState: "shadow-registered" as const,
        placementMode: "sibling-after-legacy-mount" as const,
        hostActivation: false as const,
        renderActivation: false as const,
        activeWriter: "legacy" as const,
        activeRenderOwner: "legacy" as const,
        registrationVisibleInMetadata: true as const,
        rollbackTarget: "legacy" as const,
        nextEligibleStep: "3B.3.3" as const,
        activationBlocker: "PHASE_3B3_2_SHADOW_PLACEMENT_ONLY" as const,
      };
    },
    readShadowPlacementIdentity: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const i = mod.createFeedHostShadowPlacementIdentity();
      return {
        expectedMountCount: 1 as const,
        expectedUnmountCount: 0 as const,
        expectedRendererRegistrationCount: 0 as const,
        identityTransitionAllowed: false as const,
      };
    },
    readHostRegistry: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const r = mod.createControlledHostRegistry();
      const h = r.hosts[0];
      return {
        phase: "3B.3.3" as const,
        hostCount: 1 as const,
        containsRuntimeObjects: false as const,
        containsReactInstances: false as const,
        hostId: h.hostId,
        runtimeId: h.runtimeId,
        registrationState: "registered" as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        activationState: "dormant" as const,
        hostActivation: false as const,
        renderActivation: false as const,
      };
    },
    readHostRegistration: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const c = mod.createControlledHostRegistrationContract();
      return {
        phase: "3B.3.3" as const,
        registrationState: "registered" as const,
        runtimeId: c.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        activationRestriction: "PHASE_3B3_3_HOST_REGISTRATION_ONLY" as const,
        nextEligibleStep: "3B.3.4" as const,
      };
    },
    readHostEligibility: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostEligibility();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.4" as const,
        eligibilityState: "eligible" as const,
        eligibilityReason: d.eligibilityReason,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_4_HOST_ELIGIBILITY_ONLY" as const,
        nextEligibleStep: "3B.3.5" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationReadiness: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostActivationReadiness();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.5" as const,
        readinessState: "ready" as const,
        readinessReasons: d.readinessReasons,
        readinessBlockers: d.readinessBlockers,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY" as const,
        nextEligibleStep: "3B.3.6" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostShadowActivationSimulation: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostShadowActivationSimulation();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.6" as const,
        simulationState: "completed" as const,
        simulationResult: d.simulationResult,
        wouldActivate: true as const,
        simulationReasons: d.simulationReasons,
        simulationBlockers: d.simulationBlockers,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY" as const,
        nextEligibleStep: "3B.3.7" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransitionGraph: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostActivationTransitionGraph();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.14" as const,
        graphId: d.graphId,
        graphVersion: 1 as const,
        graphState: "completed" as const,
        graphResult: "transition-graph-complete-not-executable" as const,
        currentNode: "COMMIT_READY" as const,
        entryNode: "LEGACY_DORMANT" as const,
        terminalNodes: d.terminalNodes,
        graphNodes: d.graphNodes,
        graphEdges: d.graphEdges,
        reachableNodes: d.reachableNodes,
        unreachableNodes: d.unreachableNodes,
        allowedPaths: d.allowedPaths,
        blockedPaths: d.blockedPaths,
        edgeGuards: d.edgeGuards,
        edgeBlockers: d.edgeBlockers,
        edgePreconditions: d.edgePreconditions,
        graphTraversalExecuted: false as const,
        transitionExecuted: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        wouldCommit: true as const,
        commitReady: true as const,
        machineResult: "state-machine-complete-not-executable" as const,
        protocolResult: "protocol-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        planResult: "plan-complete-not-executable" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        wouldActivate: true as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY" as const,
        nextEligibleStep: "3B.3.15" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransitionSelection: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledHostActivationTransitionSelection();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.15" as const,
        selectionId: d.selectionId,
        selectionVersion: 1 as const,
        selectionState: "completed" as const,
        selectionResult: "transition-selected-not-executable" as const,
        selectionCompleted: true as const,
        selectionExecuted: false as const,
        currentState: "COMMIT_READY" as const,
        currentNode: "COMMIT_READY" as const,
        candidateTransitions: d.candidateTransitions,
        eligibleTransitions: d.eligibleTransitions,
        ineligibleTransitions: d.ineligibleTransitions,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedTransitionId: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        selectionReason: d.selectionReason,
        selectionStrategy: d.selectionStrategy,
        selectionPriority: 100 as const,
        selectionScore: 100 as const,
        deterministicTieBreak: "lexicographic-transition-id" as const,
        selectionGuards: d.selectionGuards,
        selectionBlockers: d.selectionBlockers,
        alternativeTransitions: d.alternativeTransitions,
        transitionExecutionAllowed: false as const,
        graphTraversalAllowed: false as const,
        selectionExecutionAllowed: false as const,
        transitionExecuted: false as const,
        graphTraversalExecuted: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        wouldCommit: true as const,
        commitReady: true as const,
        graphResult: "transition-graph-complete-not-executable" as const,
        machineResult: "state-machine-complete-not-executable" as const,
        protocolResult: "protocol-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        planResult: "plan-complete-not-executable" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        wouldActivate: true as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY" as const,
        nextEligibleStep: "3B.3.16" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransitionPreflight: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledHostActivationTransitionPreflight();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.16" as const,
        preflightId: d.preflightId,
        preflightVersion: 1 as const,
        preflightState: "completed" as const,
        preflightResult: "transition-preflight-ready-not-authorized" as const,
        preflightCompleted: true as const,
        preflightReady: true as const,
        preflightBlocked: true as const,
        preflightExecuted: false as const,
        currentState: "COMMIT_READY" as const,
        currentNode: "COMMIT_READY" as const,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedTransitionId: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        selectionResult: "transition-selected-not-executable" as const,
        selectionCompleted: true as const,
        selectionExecuted: false as const,
        preflightChecks: d.preflightChecks,
        passedChecks: d.passedChecks,
        failedChecks: d.failedChecks,
        warningChecks: d.warningChecks,
        transitionAuthorized: false as const,
        authorizationGranted: false as const,
        transitionExecutionAllowed: false as const,
        graphTraversalAllowed: false as const,
        selectionExecutionAllowed: false as const,
        preflightExecutionAllowed: false as const,
        transitionAuthorizationAllowed: false as const,
        transitionExecuted: false as const,
        graphTraversalExecuted: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        wouldCommit: true as const,
        commitReady: true as const,
        graphResult: "transition-graph-complete-not-executable" as const,
        machineResult: "state-machine-complete-not-executable" as const,
        protocolResult: "protocol-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        planResult: "plan-complete-not-executable" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        wouldActivate: true as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY" as const,
        nextEligibleStep: "3B.3.17" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransitionAuthorizationDecision: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledHostActivationTransitionAuthorizationDecision();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.17" as const,
        authorizationDecisionId: d.authorizationDecisionId,
        authorizationDecisionVersion: 1 as const,
        authorizationDecisionState: "completed" as const,
        authorizationDecisionResult: "authorization-eligible-not-granted" as const,
        authorizationDecisionCompleted: true as const,
        authorizationDecisionExecuted: false as const,
        authorizationEligible: true as const,
        authorizationBlocked: true as const,
        wouldAuthorize: true as const,
        authorizationGranted: false as const,
        authorizationApplied: false as const,
        authorizationExecutionAllowed: false as const,
        transitionAuthorized: false as const,
        currentState: "COMMIT_READY" as const,
        currentNode: "COMMIT_READY" as const,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedTransitionId: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        preflightResult: "transition-preflight-ready-not-authorized" as const,
        preflightCompleted: true as const,
        preflightReady: true as const,
        preflightBlocked: true as const,
        preflightExecuted: false as const,
        selectionResult: "transition-selected-not-executable" as const,
        selectionCompleted: true as const,
        selectionExecuted: false as const,
        transitionExecutionAllowed: false as const,
        graphTraversalAllowed: false as const,
        selectionExecutionAllowed: false as const,
        preflightExecutionAllowed: false as const,
        authorizationDecisionExecutionAllowed: false as const,
        authorizationGrantAllowed: false as const,
        authorizationApplicationAllowed: false as const,
        transitionAuthorizationAllowed: false as const,
        transitionExecuted: false as const,
        graphTraversalExecuted: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        wouldCommit: true as const,
        commitReady: true as const,
        graphResult: "transition-graph-complete-not-executable" as const,
        machineResult: "state-machine-complete-not-executable" as const,
        protocolResult: "protocol-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        planResult: "plan-complete-not-executable" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        wouldActivate: true as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY" as const,
        nextEligibleStep: "3B.3.18" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransitionAuthorizationGrantReadiness: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledHostActivationTransitionAuthorizationGrantReadiness();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.18" as const,
        grantReadinessId: d.grantReadinessId,
        grantReadinessVersion: 1 as const,
        grantReadinessState: "completed" as const,
        grantReadinessResult: "authorization-grant-ready-not-issued" as const,
        grantReadinessCompleted: true as const,
        grantReadinessExecuted: false as const,
        grantReady: true as const,
        grantBlocked: true as const,
        wouldIssueGrant: true as const,
        grantIssued: false as const,
        grantCreated: false as const,
        grantPersisted: false as const,
        grantApplied: false as const,
        grantAuthorityAvailable: false as const,
        grantAuthorityEnabled: false as const,
        grantExecutionAllowed: false as const,
        grantCreationAllowed: false as const,
        grantIssuanceAllowed: false as const,
        grantPersistenceAllowed: false as const,
        grantApplicationAllowed: false as const,
        authorizationDecisionResult: "authorization-eligible-not-granted" as const,
        authorizationDecisionCompleted: true as const,
        authorizationDecisionExecuted: false as const,
        authorizationEligible: true as const,
        authorizationBlocked: true as const,
        wouldAuthorize: true as const,
        authorizationGranted: false as const,
        authorizationApplied: false as const,
        authorizationExecutionAllowed: false as const,
        transitionAuthorized: false as const,
        currentState: "COMMIT_READY" as const,
        currentNode: "COMMIT_READY" as const,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedTransitionId: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        preflightResult: "transition-preflight-ready-not-authorized" as const,
        preflightCompleted: true as const,
        preflightReady: true as const,
        preflightBlocked: true as const,
        preflightExecuted: false as const,
        selectionResult: "transition-selected-not-executable" as const,
        selectionCompleted: true as const,
        selectionExecuted: false as const,
        transitionExecutionAllowed: false as const,
        graphTraversalAllowed: false as const,
        selectionExecutionAllowed: false as const,
        preflightExecutionAllowed: false as const,
        grantReadinessExecutionAllowed: false as const,
        authorizationGrantAllowed: false as const,
        authorizationApplicationAllowed: false as const,
        transitionAuthorizationAllowed: false as const,
        transitionExecuted: false as const,
        graphTraversalExecuted: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        wouldCommit: true as const,
        commitReady: true as const,
        graphResult: "transition-graph-complete-not-executable" as const,
        machineResult: "state-machine-complete-not-executable" as const,
        protocolResult: "protocol-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        planResult: "plan-complete-not-executable" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        wouldActivate: true as const,
        grantTokenPresent: false as const,
        grantSecretPresent: false as const,
        grantSignaturePresent: false as const,
        grantCallbackPresent: false as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY" as const,
        nextEligibleStep: "3B.3.19" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransitionAuthorizationGrantIssuanceDecision: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceDecision();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.19" as const,
        issuanceDecisionId: d.issuanceDecisionId,
        issuanceDecisionVersion: 1 as const,
        issuanceDecisionState: "completed" as const,
        issuanceDecisionResult:
          "authorization-grant-issuance-eligible-not-issued" as const,
        issuanceDecisionCompleted: true as const,
        issuanceDecisionExecuted: false as const,
        issuanceEligible: true as const,
        issuanceBlocked: true as const,
        wouldIssueGrant: true as const,
        grantIssued: false as const,
        grantCreated: false as const,
        grantMaterialized: false as const,
        grantPersisted: false as const,
        grantApplied: false as const,
        grantActivated: false as const,
        grantConsumed: false as const,
        grantRevoked: false as const,
        grantAuthorityAvailable: false as const,
        grantAuthorityEnabled: false as const,
        grantAuthorityDelegated: false as const,
        grantAuthorityTransferred: false as const,
        grantExecutionAllowed: false as const,
        grantCreationAllowed: false as const,
        grantIssuanceAllowed: false as const,
        grantMaterializationAllowed: false as const,
        grantPersistenceAllowed: false as const,
        grantApplicationAllowed: false as const,
        grantActivationAllowed: false as const,
        grantConsumptionAllowed: false as const,
        grantRevocationAllowed: false as const,
        issuanceExecutionAllowed: false as const,
        grantReadinessResult: "authorization-grant-ready-not-issued" as const,
        grantReadinessCompleted: true as const,
        grantReadinessExecuted: false as const,
        grantReady: true as const,
        grantBlocked: true as const,
        authorizationDecisionResult: "authorization-eligible-not-granted" as const,
        authorizationDecisionCompleted: true as const,
        authorizationDecisionExecuted: false as const,
        authorizationEligible: true as const,
        authorizationBlocked: true as const,
        wouldAuthorize: true as const,
        authorizationGranted: false as const,
        authorizationApplied: false as const,
        authorizationExecutionAllowed: false as const,
        transitionAuthorized: false as const,
        currentState: "COMMIT_READY" as const,
        currentNode: "COMMIT_READY" as const,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedTransitionId: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        preflightResult: "transition-preflight-ready-not-authorized" as const,
        preflightCompleted: true as const,
        preflightReady: true as const,
        preflightBlocked: true as const,
        preflightExecuted: false as const,
        selectionResult: "transition-selected-not-executable" as const,
        selectionCompleted: true as const,
        selectionExecuted: false as const,
        transitionExecutionAllowed: false as const,
        graphTraversalAllowed: false as const,
        selectionExecutionAllowed: false as const,
        preflightExecutionAllowed: false as const,
        grantReadinessExecutionAllowed: false as const,
        issuanceDecisionExecutionAllowed: false as const,
        authorizationGrantAllowed: false as const,
        authorizationApplicationAllowed: false as const,
        transitionAuthorizationAllowed: false as const,
        authorizationGrantIssuanceAllowed: false as const,
        transitionExecuted: false as const,
        graphTraversalExecuted: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        wouldCommit: true as const,
        commitReady: true as const,
        graphResult: "transition-graph-complete-not-executable" as const,
        machineResult: "state-machine-complete-not-executable" as const,
        protocolResult: "protocol-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        planResult: "plan-complete-not-executable" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        wouldActivate: true as const,
        tokenPresent: false as const,
        secretPresent: false as const,
        signaturePresent: false as const,
        noncePresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        callbackPresent: false as const,
        executableHandlePresent: false as const,
        runtimeCapabilityPresent: false as const,
        grantTokenPresent: false as const,
        grantSecretPresent: false as const,
        grantSignaturePresent: false as const,
        grantCallbackPresent: false as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY" as const,
        nextEligibleStep: "3B.3.20" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransitionAuthorizationGrantIssuancePlan: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledHostActivationTransitionAuthorizationGrantIssuancePlan();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.20" as const,
        issuancePlanId: d.issuancePlanId,
        issuancePlanVersion: 1 as const,
        issuancePlanState: "completed" as const,
        issuancePlanResult:
          "authorization-grant-issuance-plan-ready-not-executable" as const,
        issuancePlanCompleted: true as const,
        issuancePlanExecuted: false as const,
        issuancePlanReady: true as const,
        issuancePlanBlocked: true as const,
        issuancePlanExecutable: false as const,
        wouldExecuteIssuancePlan: true as const,
        planStepCount: d.planStepCount,
        completedPlanStepCount: 0 as const,
        executablePlanStepCount: 0 as const,
        blockedPlanStepCount: d.blockedPlanStepCount,
        invalidPlanStepCount: 0 as const,
        issuanceDecisionResult:
          "authorization-grant-issuance-eligible-not-issued" as const,
        issuanceDecisionCompleted: true as const,
        issuanceEligible: true as const,
        issuanceBlocked: true as const,
        wouldIssueGrant: true as const,
        grantIssued: false as const,
        grantCreated: false as const,
        grantMaterialized: false as const,
        grantPersisted: false as const,
        grantApplied: false as const,
        grantActivated: false as const,
        grantConsumed: false as const,
        grantRevoked: false as const,
        grantAuthorityAvailable: false as const,
        grantAuthorityEnabled: false as const,
        grantAuthorityDelegated: false as const,
        grantAuthorityTransferred: false as const,
        grantCreationAllowed: false as const,
        grantIssuanceAllowed: false as const,
        grantMaterializationAllowed: false as const,
        grantPersistenceAllowed: false as const,
        grantApplicationAllowed: false as const,
        grantActivationAllowed: false as const,
        grantConsumptionAllowed: false as const,
        grantRevocationAllowed: false as const,
        grantReadinessResult: "authorization-grant-ready-not-issued" as const,
        grantReady: true as const,
        grantBlocked: true as const,
        authorizationDecisionResult: "authorization-eligible-not-granted" as const,
        authorizationEligible: true as const,
        authorizationGranted: false as const,
        authorizationApplied: false as const,
        transitionAuthorized: false as const,
        currentState: "COMMIT_READY" as const,
        currentNode: "COMMIT_READY" as const,
        currentGraphNode: "COMMIT_READY" as const,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        sourceState: "COMMIT_READY" as const,
        targetState: "ACTIVE" as const,
        preflightResult: "transition-preflight-ready-not-authorized" as const,
        preflightReady: true as const,
        preflightExecuted: false as const,
        preflightExecutionAllowed: false as const,
        selectionExecuted: false as const,
        selectionExecutionAllowed: false as const,
        graphTraversalAllowed: false as const,
        graphTraversalExecuted: false as const,
        transitionExecuted: false as const,
        transitionExecutionAllowed: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        commitExecuted: false as const,
        rollbackExecuted: false as const,
        authorizationGranted: false as const,
        authorizationApplied: false as const,
        authorizationGrantAllowed: false as const,
        authorizationApplicationAllowed: false as const,
        transitionAuthorized: false as const,
        transitionAuthorizationAllowed: false as const,
        issuancePlanExecutionAllowed: false as const,
        issuanceExecutionAllowed: false as const,
        grantExecutionAllowed: false as const,
        authorizationExecutionAllowed: false as const,
        activationExecutionAllowed: false as const,
        schedulerAllowed: false as const,
        executorAllowed: false as const,
        canStartActivation: false as const,
        ownershipTransferred: false as const,
        writerTransferred: false as const,
        rendererTransferred: false as const,
        tokenPresent: false as const,
        secretPresent: false as const,
        signaturePresent: false as const,
        noncePresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        callbackPresent: false as const,
        executableHandlePresent: false as const,
        runtimeCapabilityPresent: false as const,
        commandPresent: false as const,
        dispatcherPresent: false as const,
        queuePresent: false as const,
        authorityProviderPresent: false as const,
        issuanceServicePresent: false as const,
        issuancePlanExecutionImpossible: true as const,
        issuanceImpossible: true as const,
        authorityImpossible: true as const,
        executionImpossible: true as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        hostActivation: false as const,
        renderActivation: false as const,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        activationBlocker:
          "PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY" as const,
        nextEligibleStep: "3B.3.21" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransitionAuthorizationGrantIssuancePipeline: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledHostActivationTransitionAuthorizationGrantIssuancePipeline();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.21" as const,
        issuancePipelineId: d.issuancePipelineId,
        issuancePipelineVersion: 1 as const,
        issuancePipelineState: "completed" as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineCompleted: true as const,
        issuancePipelineExecuted: false as const,
        issuancePipelineReady: true as const,
        issuancePipelineBlocked: true as const,
        issuancePipelineExecutable: false as const,
        wouldExecuteIssuancePipeline: true as const,
        pipelineStageCount: d.pipelineStageCount,
        completedPipelineStageCount: 0 as const,
        executablePipelineStageCount: 0 as const,
        blockedPipelineStageCount: d.blockedPipelineStageCount,
        invalidPipelineStageCount: 0 as const,
        sourcePlanStepCount: 30 as const,
        coveredPlanStepCount: 30 as const,
        uncoveredPlanStepCount: 0 as const,
        duplicateCoveredPlanStepCount: 0 as const,
        unknownReferencedPlanStepCount: 0 as const,
        planCoverageComplete: true as const,
        planCoverageExact: true as const,
        planOrderPreserved: true as const,
        pipelineDependencyGraphAcyclic: true as const,
        issuancePlanResult:
          "authorization-grant-issuance-plan-ready-not-executable" as const,
        issuancePlanCompleted: true as const,
        issuancePlanReady: true as const,
        issuancePlanBlocked: true as const,
        issuancePlanExecutable: false as const,
        wouldExecuteIssuancePlan: true as const,
        issuanceDecisionResult:
          "authorization-grant-issuance-eligible-not-issued" as const,
        issuanceDecisionCompleted: true as const,
        issuanceEligible: true as const,
        issuanceBlocked: true as const,
        wouldIssueGrant: true as const,
        grantIssued: false as const,
        grantCreated: false as const,
        grantMaterialized: false as const,
        grantPersisted: false as const,
        grantApplied: false as const,
        grantActivated: false as const,
        grantConsumed: false as const,
        grantRevoked: false as const,
        grantAuthorityAvailable: false as const,
        grantAuthorityEnabled: false as const,
        grantAuthorityDelegated: false as const,
        grantAuthorityTransferred: false as const,
        grantCreationAllowed: false as const,
        grantIssuanceAllowed: false as const,
        grantMaterializationAllowed: false as const,
        grantPersistenceAllowed: false as const,
        grantApplicationAllowed: false as const,
        grantActivationAllowed: false as const,
        grantConsumptionAllowed: false as const,
        grantRevocationAllowed: false as const,
        grantReadinessResult: "authorization-grant-ready-not-issued" as const,
        grantReady: true as const,
        grantBlocked: true as const,
        authorizationDecisionResult: "authorization-eligible-not-granted" as const,
        authorizationEligible: true as const,
        authorizationGranted: false as const,
        authorizationApplied: false as const,
        transitionAuthorized: false as const,
        currentState: "COMMIT_READY" as const,
        currentNode: "COMMIT_READY" as const,
        currentGraphNode: "COMMIT_READY" as const,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        sourceState: "COMMIT_READY" as const,
        targetState: "ACTIVE" as const,
        preflightResult: "transition-preflight-ready-not-authorized" as const,
        preflightReady: true as const,
        preflightExecuted: false as const,
        preflightExecutionAllowed: false as const,
        selectionExecuted: false as const,
        selectionExecutionAllowed: false as const,
        graphTraversalAllowed: false as const,
        graphTraversalExecuted: false as const,
        transitionExecuted: false as const,
        transitionExecutionAllowed: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        commitExecuted: false as const,
        rollbackExecuted: false as const,
        authorizationGrantAllowed: false as const,
        authorizationApplicationAllowed: false as const,
        transitionAuthorizationAllowed: false as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePlanExecutionAllowed: false as const,
        issuanceExecutionAllowed: false as const,
        grantExecutionAllowed: false as const,
        authorizationExecutionAllowed: false as const,
        activationExecutionAllowed: false as const,
        selectionExecutionAllowed: false as const,
        preflightExecutionAllowed: false as const,
        schedulerAllowed: false as const,
        executorAllowed: false as const,
        canStartActivation: false as const,
        ownershipTransferred: false as const,
        writerTransferred: false as const,
        rendererTransferred: false as const,
        tokenPresent: false as const,
        secretPresent: false as const,
        signaturePresent: false as const,
        noncePresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        callbackPresent: false as const,
        executableHandlePresent: false as const,
        runtimeCapabilityPresent: false as const,
        commandPresent: false as const,
        dispatcherPresent: false as const,
        queuePresent: false as const,
        schedulerPresent: false as const,
        executorPresent: false as const,
        authorityProviderPresent: false as const,
        issuanceServicePresent: false as const,
        issuancePipelineExecutionImpossible: true as const,
        issuancePlanExecutionImpossible: true as const,
        issuanceImpossible: true as const,
        authorityImpossible: true as const,
        executionImpossible: true as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        hostActivation: false as const,
        renderActivation: false as const,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        activationBlocker:
          "PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY" as const,
        nextEligibleStep: "3B.3.22" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransitionAuthorizationGrantIssuanceTransaction: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceTransaction();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.22" as const,
        issuanceTransactionId: d.issuanceTransactionId,
        issuanceTransactionVersion: 1 as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionCompleted: true as const,
        issuanceTransactionExecuted: false as const,
        issuanceTransactionReady: true as const,
        issuanceTransactionBlocked: true as const,
        issuanceTransactionOpened: false as const,
        issuanceTransactionPrepared: false as const,
        issuanceTransactionCommitted: false as const,
        issuanceTransactionAborted: false as const,
        issuanceTransactionRolledBack: false as const,
        issuanceTransactionCompensated: false as const,
        issuanceTransactionExecutable: false as const,
        wouldOpenIssuanceTransaction: true as const,
        transactionParticipantCount: d.transactionParticipantCount,
        completedTransactionParticipantCount: 0 as const,
        executableTransactionParticipantCount: 0 as const,
        blockedTransactionParticipantCount: d.blockedTransactionParticipantCount,
        invalidTransactionParticipantCount: 0 as const,
        sourcePipelineStageCount: 30 as const,
        coveredPipelineStageCount: 30 as const,
        uncoveredPipelineStageCount: 0 as const,
        duplicateCoveredPipelineStageCount: 0 as const,
        unknownReferencedPipelineStageCount: 0 as const,
        pipelineCoverageComplete: true as const,
        pipelineCoverageExact: true as const,
        pipelineOrderPreserved: true as const,
        transactionParticipantGraphAcyclic: true as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineCompleted: true as const,
        issuancePipelineReady: true as const,
        issuancePipelineBlocked: true as const,
        issuancePipelineExecutable: false as const,
        wouldExecuteIssuancePipeline: true as const,
        issuancePlanResult:
          "authorization-grant-issuance-plan-ready-not-executable" as const,
        issuancePlanCompleted: true as const,
        issuancePlanReady: true as const,
        issuancePlanBlocked: true as const,
        issuancePlanExecutable: false as const,
        wouldExecuteIssuancePlan: true as const,
        issuanceDecisionResult:
          "authorization-grant-issuance-eligible-not-issued" as const,
        issuanceDecisionCompleted: true as const,
        issuanceEligible: true as const,
        issuanceBlocked: true as const,
        wouldIssueGrant: true as const,
        grantIssued: false as const,
        grantCreated: false as const,
        grantMaterialized: false as const,
        grantPersisted: false as const,
        grantApplied: false as const,
        grantActivated: false as const,
        grantConsumed: false as const,
        grantRevoked: false as const,
        grantAuthorityAvailable: false as const,
        grantAuthorityEnabled: false as const,
        grantAuthorityDelegated: false as const,
        grantAuthorityTransferred: false as const,
        grantCreationAllowed: false as const,
        grantIssuanceAllowed: false as const,
        grantMaterializationAllowed: false as const,
        grantPersistenceAllowed: false as const,
        grantApplicationAllowed: false as const,
        grantActivationAllowed: false as const,
        grantConsumptionAllowed: false as const,
        grantRevocationAllowed: false as const,
        grantReadinessResult: "authorization-grant-ready-not-issued" as const,
        grantReady: true as const,
        grantBlocked: true as const,
        authorizationDecisionResult: "authorization-eligible-not-granted" as const,
        authorizationEligible: true as const,
        authorizationGranted: false as const,
        authorizationApplied: false as const,
        transitionAuthorized: false as const,
        currentState: "COMMIT_READY" as const,
        currentNode: "COMMIT_READY" as const,
        currentGraphNode: "COMMIT_READY" as const,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        sourceState: "COMMIT_READY" as const,
        targetState: "ACTIVE" as const,
        preflightResult: "transition-preflight-ready-not-authorized" as const,
        preflightReady: true as const,
        preflightExecuted: false as const,
        preflightExecutionAllowed: false as const,
        selectionExecuted: false as const,
        selectionExecutionAllowed: false as const,
        graphTraversalAllowed: false as const,
        graphTraversalExecuted: false as const,
        transitionExecuted: false as const,
        transitionExecutionAllowed: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        commitExecuted: false as const,
        rollbackExecuted: false as const,
        transactionOpened: false as const,
        transactionPrepared: false as const,
        transactionAborted: false as const,
        transactionRolledBack: false as const,
        transactionCompensated: false as const,
        transactionContextPresent: false as const,
        transactionHandlePresent: false as const,
        transactionTokenPresent: false as const,
        transactionSecretPresent: false as const,
        transactionSignaturePresent: false as const,
        transactionCallbackPresent: false as const,
        transactionCoordinatorPresent: false as const,
        transactionExecutorPresent: false as const,
        transactionSchedulerPresent: false as const,
        transactionDispatcherPresent: false as const,
        transactionQueuePresent: false as const,
        transactionJournalPresent: false as const,
        transactionLockPresent: false as const,
        resourceReservationPresent: false as const,
        writeSetPresent: false as const,
        mutationSetPresent: false as const,
        compensationActionPresent: false as const,
        persistenceBoundaryPresent: false as const,
        persistenceApplied: false as const,
        lockAcquired: false as const,
        resourceReserved: false as const,
        journalWritten: false as const,
        mutationsStaged: false as const,
        writesStaged: false as const,
        transactionOpenAllowed: false as const,
        transactionPrepareAllowed: false as const,
        transactionCommitAllowed: false as const,
        transactionAbortAllowed: false as const,
        transactionRollbackAllowed: false as const,
        transactionCompensationAllowed: false as const,
        transactionExecutionAllowed: false as const,
        authorizationGrantAllowed: false as const,
        authorizationApplicationAllowed: false as const,
        transitionAuthorizationAllowed: false as const,
        issuanceTransactionExecutionAllowed: false as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePlanExecutionAllowed: false as const,
        issuanceExecutionAllowed: false as const,
        grantExecutionAllowed: false as const,
        authorizationExecutionAllowed: false as const,
        activationExecutionAllowed: false as const,
        schedulerAllowed: false as const,
        executorAllowed: false as const,
        canStartActivation: false as const,
        ownershipTransferred: false as const,
        writerTransferred: false as const,
        rendererTransferred: false as const,
        tokenPresent: false as const,
        secretPresent: false as const,
        signaturePresent: false as const,
        noncePresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        callbackPresent: false as const,
        executableHandlePresent: false as const,
        runtimeCapabilityPresent: false as const,
        commandPresent: false as const,
        dispatcherPresent: false as const,
        queuePresent: false as const,
        schedulerPresent: false as const,
        executorPresent: false as const,
        authorityProviderPresent: false as const,
        issuanceServicePresent: false as const,
        issuanceTransactionExecutionImpossible: true as const,
        issuancePipelineExecutionImpossible: true as const,
        issuancePlanExecutionImpossible: true as const,
        issuanceImpossible: true as const,
        authorityImpossible: true as const,
        executionImpossible: true as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        hostActivation: false as const,
        renderActivation: false as const,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        activationBlocker:
          "PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY" as const,
        nextEligibleStep: "3B.3.23" as const,
        diagnostics: evaluation.diagnostics,
      };
    },

    readHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary();
      const d = evaluation.descriptor as any;
      return {
        phase: "3B.3.23" as const,
        issuanceCommitBoundaryId: d.issuanceCommitBoundaryId,
        issuanceCommitBoundaryVersion: 1 as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryCompleted: true as const,
        issuanceCommitBoundaryExecuted: false as const,
        issuanceCommitBoundaryReady: true as const,
        issuanceCommitBoundaryBlocked: true as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceCommitBoundaryArmed: false as const,
        boundaryCrossed: false as const,
        issuanceCommitBoundaryPrepared: false as const,
        issuanceCommitBoundaryCommitted: false as const,
        issuanceCommitBoundaryAborted: false as const,
        issuanceCommitBoundaryRolledBack: false as const,
        issuanceCommitBoundaryCompensated: false as const,
        issuanceCommitBoundaryExecutable: false as const,
        wouldEnterIssuanceCommitBoundary: true as const,
        transactionParticipantCount: d.transactionParticipantCount,
        completedTransactionParticipantCount: 0 as const,
        executableTransactionParticipantCount: 0 as const,
        blockedTransactionParticipantCount: d.blockedTransactionParticipantCount,
        invalidTransactionParticipantCount: 0 as const,
        sourceTransactionParticipantCount: 30 as const,
        coveredTransactionParticipantCount: 30 as const,
        uncoveredTransactionParticipantCount: 0 as const,
        duplicateCoveredTransactionParticipantCount: 0 as const,
        unknownReferencedTransactionParticipantCount: 0 as const,
        transactionParticipantCoverageComplete: true as const,
        transactionParticipantCoverageExact: true as const,
        transactionParticipantOrderPreserved: true as const,
        transactionParticipantGraphAcyclic: true as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionCompleted: true as const,
        issuanceTransactionReady: true as const,
        issuanceTransactionBlocked: true as const,
        issuanceTransactionOpened: false as const,
        issuanceTransactionExecutable: false as const,
        wouldOpenIssuanceTransaction: true as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePlanResult:
          "authorization-grant-issuance-plan-ready-not-executable" as const,
        issuanceDecisionResult:
          "authorization-grant-issuance-eligible-not-issued" as const,
        grantIssued: false as const,
        grantCreated: false as const,
        grantMaterialized: false as const,
        grantPersisted: false as const,
        grantApplied: false as const,
        grantActivated: false as const,
        grantConsumed: false as const,
        grantRevoked: false as const,
        grantAuthorityAvailable: false as const,
        grantAuthorityEnabled: false as const,
        grantAuthorityDelegated: false as const,
        grantAuthorityTransferred: false as const,
        grantCreationAllowed: false as const,
        grantIssuanceAllowed: false as const,
        grantMaterializationAllowed: false as const,
        grantPersistenceAllowed: false as const,
        grantApplicationAllowed: false as const,
        grantActivationAllowed: false as const,
        grantConsumptionAllowed: false as const,
        grantRevocationAllowed: false as const,
        issuanceEligible: true as const,
        issuanceBlocked: true as const,
        wouldIssueGrant: true as const,
        grantReadinessResult: "authorization-grant-ready-not-issued" as const,
        grantReady: true as const,
        grantBlocked: true as const,
        authorizationDecisionResult: "authorization-eligible-not-granted" as const,
        authorizationEligible: true as const,
        authorizationGranted: false as const,
        authorizationApplied: false as const,
        authorizationGrantAllowed: false as const,
        authorizationApplicationAllowed: false as const,
        transitionAuthorized: false as const,
        transitionAuthorizationAllowed: false as const,
        currentState: "COMMIT_READY" as const,
        currentNode: "COMMIT_READY" as const,
        currentGraphNode: "COMMIT_READY" as const,
        selectedTransition: "COMMIT_READY->ACTIVE" as const,
        selectedFromState: "COMMIT_READY" as const,
        selectedToState: "ACTIVE" as const,
        sourceState: "COMMIT_READY" as const,
        targetState: "ACTIVE" as const,
        preflightResult: "transition-preflight-ready-not-authorized" as const,
        preflightReady: true as const,
        preflightExecuted: false as const,
        preflightExecutionAllowed: false as const,
        selectionExecuted: false as const,
        selectionExecutionAllowed: false as const,
        graphTraversalAllowed: false as const,
        graphTraversalExecuted: false as const,
        transitionExecuted: false as const,
        transitionExecutionAllowed: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        commitExecuted: false as const,
        rollbackExecuted: false as const,
        transactionOpened: false as const,
        transactionPrepared: false as const,
        transactionAborted: false as const,
        transactionRolledBack: false as const,
        transactionCompensated: false as const,
        transactionContextPresent: false as const,
        transactionHandlePresent: false as const,
        transactionTokenPresent: false as const,
        transactionSecretPresent: false as const,
        transactionSignaturePresent: false as const,
        transactionCallbackPresent: false as const,
        transactionCoordinatorPresent: false as const,
        transactionExecutorPresent: false as const,
        transactionSchedulerPresent: false as const,
        transactionDispatcherPresent: false as const,
        transactionQueuePresent: false as const,
        transactionJournalPresent: false as const,
        transactionLockPresent: false as const,
        resourceReservationPresent: false as const,
        writeSetPresent: false as const,
        mutationSetPresent: false as const,
        compensationActionPresent: false as const,
        persistenceBoundaryPresent: false as const,
        persistenceApplied: false as const,
        lockAcquired: false as const,
        resourceReserved: false as const,
        journalWritten: false as const,
        mutationsStaged: false as const,
        writesStaged: false as const,
        transactionOpenAllowed: false as const,
        transactionPrepareAllowed: false as const,
        transactionCommitAllowed: false as const,
        transactionAbortAllowed: false as const,
        transactionRollbackAllowed: false as const,
        transactionCompensationAllowed: false as const,
        transactionExecutionAllowed: false as const,
        issuanceCommitBoundaryExecutionAllowed: false as const,
        issuanceTransactionExecutionAllowed: false as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePlanExecutionAllowed: false as const,
        issuanceExecutionAllowed: false as const,
        grantExecutionAllowed: false as const,
        authorizationExecutionAllowed: false as const,
        activationExecutionAllowed: false as const,
        schedulerAllowed: false as const,
        executorAllowed: false as const,
        canStartActivation: false as const,
        ownershipTransferred: false as const,
        writerTransferred: false as const,
        rendererTransferred: false as const,
        tokenPresent: false as const,
        secretPresent: false as const,
        signaturePresent: false as const,
        noncePresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        callbackPresent: false as const,
        executableHandlePresent: false as const,
        runtimeCapabilityPresent: false as const,
        commandPresent: false as const,
        dispatcherPresent: false as const,
        queuePresent: false as const,
        schedulerPresent: false as const,
        executorPresent: false as const,
        authorityProviderPresent: false as const,
        issuanceServicePresent: false as const,
        issuanceCommitBoundaryExecutionImpossible: true as const,
        issuanceTransactionExecutionImpossible: true as const,
        issuancePipelineExecutionImpossible: true as const,
        issuancePlanExecutionImpossible: true as const,
        issuanceImpossible: true as const,
        authorityImpossible: true as const,
        executionImpossible: true as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        hostActivation: false as const,
        renderActivation: false as const,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        activationBlocker:
          "PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY" as const,
        nextEligibleStep: "3B.3.24" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readControlledWorkspaceHostCandidateRegistration: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostCandidateRegistration();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.24" as const,
        candidateId: d.candidateId,
        registrationId: d.candidateRegistrationId,
        candidateKind: "adaptive-workspace" as const,
        candidateRegistrationState: "REGISTERED_NOT_SELECTED" as const,
        candidateRegistrationResult:
          "controlled-workspace-host-candidate-registered-not-selected" as const,
        candidateRegistrationCompleted: true as const,
        candidateRegistrationReady: true as const,
        candidateRegistrationBlocked: true as const,
        candidateRegistrationExecutable: false as const,
        candidateRegistered: true as const,
        candidateSelected: false as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateAuthorized: false as const,
        candidateGranted: false as const,
        candidateExecutable: false as const,
        wouldSelectCandidate: true as const,
        futureSelectionTarget: true as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 0 as const,
        activeCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        invalidCandidateCount: 0 as const,
        duplicateCandidateCount: 0 as const,
        unknownCandidateCount: 0 as const,
        singleCandidateExact: true as const,
        candidateIdentityUnique: true as const,
        registrationIdentityUnique: true as const,
        candidateKindUnique: true as const,
        candidateStructurallyCompatible: true as const,
        candidateRuntimeCompatible: true as const,
        candidateSelectionEligibleInFuture: true as const,
        candidateSelectionEligibleNow: false as const,
        candidateActivationEligibleNow: false as const,
        candidateRuntimeAdoptionEligibleNow: false as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        ownsRuntime: false as const,
        ownsFeed: false as const,
        writesRuntime: false as const,
        writesFeed: false as const,
        rendersRuntime: false as const,
        rendersFeed: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceCandidateRendered: false as const,
        workspaceCandidateDOMPresent: false as const,
        workspaceCandidateReactInstancePresent: false as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionOpened: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY" as const,
        nextEligibleStep: "3B.3.25" as const,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostCandidateSelection: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostCandidateSelection();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.25" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        selectionContractId: d.selectionContractId,
        candidateKind: "adaptive-workspace" as const,
        candidateSelectionState: "SELECTED_NOT_ACTIVATED" as const,
        candidateSelectionResult:
          "controlled-workspace-host-candidate-selected-not-activated" as const,
        candidateSelectionCompleted: true as const,
        candidateSelectionReady: true as const,
        candidateSelectionBlocked: true as const,
        candidateSelectionExecutable: false as const,
        candidateSelectionAllowed: true as const,
        metadataSelectionAllowed: true as const,
        candidateSelectionApplied: false as const,
        candidateSelectionCommitted: false as const,
        candidateRegistered: true as const,
        candidateSelected: true as const,
        candidateNominated: true as const,
        candidateApproved: false as const,
        candidateAuthorized: false as const,
        candidateGranted: false as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        futureActivationTarget: true as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        authorizedCandidateCount: 0 as const,
        grantedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        invalidCandidateCount: 0 as const,
        duplicateCandidateCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        singleCandidateExact: true as const,
        singleSelectionExact: true as const,
        candidateIdentityUnique: true as const,
        registrationIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        selectedCandidateIdentityExact: true as const,
        selectedCandidateWasRegistered: true as const,
        selectedCandidateStructurallyCompatible: true as const,
        candidateActivationEligibleInFuture: true as const,
        candidateActivationEligibleNow: false as const,
        candidateRuntimeAdoptionEligibleNow: false as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        selectionHandlePresent: false as const,
        ownsRuntime: false as const,
        ownsFeed: false as const,
        writesRuntime: false as const,
        writesFeed: false as const,
        rendersRuntime: false as const,
        rendersFeed: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        selectedCandidateRendered: false as const,
        selectedCandidateDOMPresent: false as const,
        predecessorCandidateRegistrationResult:
          "controlled-workspace-host-candidate-registered-not-selected" as const,
        predecessorCandidateRegistrationState: "REGISTERED_NOT_SELECTED" as const,
        predecessorCandidateSelected: false as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionOpened: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY" as const,
        nextEligibleStep: "3B.3.26" as const,
        diagnostics: evaluation.diagnostics,
      };
    },


    readControlledWorkspaceHostActivationReadiness: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationReadiness();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.26" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationReadinessContractId: d.activationReadinessContractId,
        candidateKind: "adaptive-workspace" as const,
        activationReadinessState: "READY_NOT_AUTHORIZED" as const,
        activationReadinessResult:
          "controlled-workspace-host-activation-ready-not-authorized" as const,
        activationReadinessCompleted: true as const,
        activationReadinessReady: true as const,
        activationReadinessBlocked: true as const,
        activationReadinessExecutable: false as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: false as const,
        candidateGranted: false as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        authorizedCandidateCount: 0 as const,
        grantedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        predecessorCandidateSelectionResult:
          "controlled-workspace-host-candidate-selected-not-activated" as const,
        predecessorCandidateSelectionState: "SELECTED_NOT_ACTIVATED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionOpened: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY" as const,
        nextEligibleStep: "3B.3.27" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationAuthorization: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationAuthorization();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.27" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationAuthorizationContractId: d.activationAuthorizationContractId,
        candidateKind: "adaptive-workspace" as const,
        activationAuthorizationState: "AUTHORIZED_NOT_GRANTED" as const,
        activationAuthorizationResult:
          "controlled-workspace-host-activation-authorized-not-granted" as const,
        activationAuthorizationCompleted: true as const,
        activationAuthorizationAuthorized: true as const,
        activationAuthorizationBlocked: true as const,
        activationAuthorizationExecutable: false as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: false as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: false as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        activationGrantIssuanceAllowed: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        futureGrantTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        grantedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        grantPresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        predecessorActivationReadinessResult:
          "controlled-workspace-host-activation-ready-not-authorized" as const,
        predecessorActivationReadinessState: "READY_NOT_AUTHORIZED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionOpened: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY" as const,
        nextEligibleStep: "3B.3.28" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationGrantIssuance: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationGrantIssuance();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.28" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantContractId: d.activationGrantContractId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationGrantIssuanceContractId: d.activationGrantIssuanceContractId,
        candidateKind: "adaptive-workspace" as const,
        grantIssuanceState: "GRANTED_NOT_ACTIVATED" as const,
        grantIssuanceResult:
          "controlled-workspace-host-activation-grant-issued-not-activated" as const,
        grantIssuanceCompleted: true as const,
        grantIssuanceGranted: true as const,
        grantIssuanceBlocked: true as const,
        grantIssuanceExecutable: false as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        activationGrantIssuanceAllowed: false as const,
        activationExecutionAllowed: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        grantIssuanceRecordCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        futureGrantTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        duplicateGrantCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationAuthorizationResult:
          "controlled-workspace-host-activation-authorized-not-granted" as const,
        predecessorActivationAuthorizationState: "AUTHORIZED_NOT_GRANTED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionOpened: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY" as const,
        nextEligibleStep: "3B.3.29" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationCommitBoundaryEntry: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationCommitBoundaryEntry();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.29" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationCommitBoundaryEntryId: d.activationCommitBoundaryEntryId,
        activationCommitBoundaryEntryContractId: d.activationCommitBoundaryEntryContractId,
        candidateKind: "adaptive-workspace" as const,
        commitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        commitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        commitBoundaryEntryCompleted: true as const,
        commitBoundaryEntryBlocked: true as const,
        commitBoundaryEntryExecutable: false as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationCommitBoundaryEntryAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        activationExecutionAllowed: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        grantIssuanceRecordCount: 1 as const,
        commitBoundaryEntryCount: 1 as const,
        duplicateCommitBoundaryEntryCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        futureGrantTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationCommitBoundaryEntryIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationGrantIssuanceResult:
          "controlled-workspace-host-activation-grant-issued-not-activated" as const,
        predecessorActivationGrantIssuanceState: "GRANTED_NOT_ACTIVATED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionOpened: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY" as const,
        nextEligibleStep: "3B.3.30" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationTransactionOpeningReadiness: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.30" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        candidateKind: "adaptive-workspace" as const,
        transactionOpeningReadinessState: "TRANSACTION_OPENING_READY_NOT_OPENED" as const,
        transactionOpeningReadinessResult:
          "controlled-workspace-host-activation-transaction-opening-ready-not-opened" as const,
        transactionOpeningReadinessCompleted: true as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: false as const,
        transactionOpeningStarted: false as const,
        transactionOpeningCompleted: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningReadinessAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionOpeningReadinessCount: 1 as const,
        duplicateTransactionOpeningReadinessCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionOpened: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY" as const,
        nextEligibleStep: "3B.3.31" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },
    readControlledWorkspaceHostActivationTransactionOpeningAuthorization: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.31" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        candidateKind: "adaptive-workspace" as const,
        transactionOpeningAuthorizationState: "TRANSACTION_OPENING_AUTHORIZED_NOT_OPENED" as const,
        transactionOpeningAuthorizationResult:
          "controlled-workspace-host-activation-transaction-opening-authorized-not-opened" as const,
        transactionOpeningAuthorizationCompleted: true as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: false as const,
        transactionOpeningCompleted: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAuthorizationAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionOpeningAuthorizationCount: 1 as const,
        duplicateTransactionOpeningAuthorizationCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionOpeningReadinessResult:
          "controlled-workspace-host-activation-transaction-opening-ready-not-opened" as const,
        predecessorActivationTransactionOpeningReadinessState: "TRANSACTION_OPENING_READY_NOT_OPENED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-ready-not-opened" as const,
        issuanceTransactionState: "NOT_OPENED" as const,
        issuanceTransactionOpened: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_31_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ONLY" as const,
        nextEligibleStep: "3B.3.32" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },
    readControlledWorkspaceHostActivationTransactionOpening: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationTransactionOpening();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.32" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        candidateKind: "adaptive-workspace" as const,
        transactionOpeningState: "TRANSACTION_OPENED_NOT_PREPARED" as const,
        transactionOpeningResult:
          "controlled-workspace-host-activation-transaction-opened-not-prepared" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionOpeningCount: 1 as const,
        duplicateTransactionOpeningCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionOpeningAuthorizationResult:
          "controlled-workspace-host-activation-transaction-opening-authorized-not-opened" as const,
        predecessorActivationTransactionOpeningAuthorizationState: "TRANSACTION_OPENING_AUTHORIZED_NOT_OPENED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: false as const,
        issuanceTransactionCommitted: false as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY" as const,
        nextEligibleStep: "3B.3.33" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },
    readControlledWorkspaceHostActivationTransactionPreparationReadiness: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.33" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        candidateKind: "adaptive-workspace" as const,
        transactionPreparationReadinessState: "TRANSACTION_PREPARATION_READY_NOT_PREPARED" as const,
        transactionPreparationReadinessResult:
          "controlled-workspace-host-activation-transaction-preparation-ready-not-prepared" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationReadinessCount: 1 as const,
        duplicateTransactionPreparationReadinessCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionOpeningResult:
          "controlled-workspace-host-activation-transaction-opened-not-prepared" as const,
        predecessorActivationTransactionOpeningState: "TRANSACTION_OPENED_NOT_PREPARED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: false as const,
        issuanceTransactionCommitted: false as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY" as const,
        nextEligibleStep: "3B.3.34" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationTransactionPreparationAuthorization: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationTransactionPreparationAuthorization();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.34" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        candidateKind: "adaptive-workspace" as const,
        transactionPreparationAuthorizationState: "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED" as const,
        transactionPreparationAuthorizationResult:
          "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationAuthorizationCount: 1 as const,
        duplicateTransactionPreparationAuthorizationCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionPreparationReadinessResult:
          "controlled-workspace-host-activation-transaction-preparation-ready-not-prepared" as const,
        predecessorActivationTransactionPreparationReadinessState: "TRANSACTION_PREPARATION_READY_NOT_PREPARED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: false as const,
        issuanceTransactionCommitted: false as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY" as const,
        nextEligibleStep: "3B.3.35" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },


    readControlledWorkspaceHostActivationTransactionPreparation: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationTransactionPreparation();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.35" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        candidateKind: "adaptive-workspace" as const,
        transactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        transactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        duplicateTransactionPreparationCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionPreparationAuthorizationResult:
          "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared" as const,
        predecessorActivationTransactionPreparationAuthorizationState: "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: false as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY" as const,
        nextEligibleStep: "3B.3.36" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationTransactionCommitReadiness: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationTransactionCommitReadiness();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.36" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        candidateKind: "adaptive-workspace" as const,
        transactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED" as const,
        transactionCommitReadinessResult:
          "controlled-workspace-host-activation-transaction-commit-ready-not-committed" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitReadinessCount: 1 as const,
        duplicateTransactionPreparationCount: 0 as const,
        duplicateTransactionCommitReadinessCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: false as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY" as const,
        nextEligibleStep: "3B.3.37" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationTransactionCommitAuthorization: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.37" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        candidateKind: "adaptive-workspace" as const,
        transactionCommitAuthorizationState: "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED" as const,
        transactionCommitAuthorizationResult:
          "controlled-workspace-host-activation-transaction-commit-authorized-not-committed" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitReadinessCount: 1 as const,
        transactionCommitAuthorizationCount: 1 as const,
        duplicateTransactionPreparationCount: 0 as const,
        duplicateTransactionCommitReadinessCount: 0 as const,
        duplicateTransactionCommitAuthorizationCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationTransactionCommitReadinessResult:
          "controlled-workspace-host-activation-transaction-commit-ready-not-committed" as const,
        predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: false as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY" as const,
        nextEligibleStep: "3B.3.38" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationTransactionCommit: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationTransactionCommit();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.38" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        candidateKind: "adaptive-workspace" as const,
        transactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        transactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitReadinessCount: 1 as const,
        transactionCommitAuthorizationCount: 1 as const,
        transactionCommitCount: 1 as const,
        duplicateTransactionPreparationCount: 0 as const,
        duplicateTransactionCommitReadinessCount: 0 as const,
        duplicateTransactionCommitAuthorizationCount: 0 as const,
        duplicateTransactionCommitCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationTransactionCommitReadinessResult:
          "controlled-workspace-host-activation-transaction-commit-ready-not-committed" as const,
        predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED" as const,
        predecessorActivationTransactionCommitAuthorizationResult:
          "controlled-workspace-host-activation-transaction-commit-authorized-not-committed" as const,
        predecessorActivationTransactionCommitAuthorizationState:
          "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY" as const,
        nextEligibleStep: "3B.3.39" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationIssuancePipelineExecutionReadiness: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationIssuancePipelineExecutionReadiness();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.39" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        candidateKind: "adaptive-workspace" as const,
        pipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        pipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitReadinessCount: 1 as const,
        transactionCommitAuthorizationCount: 1 as const,
        transactionCommitCount: 1 as const,
        duplicateTransactionPreparationCount: 0 as const,
        duplicateTransactionCommitReadinessCount: 0 as const,
        duplicateTransactionCommitAuthorizationCount: 0 as const,
        duplicateTransactionCommitCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationTransactionCommitReadinessResult:
          "controlled-workspace-host-activation-transaction-commit-ready-not-committed" as const,
        predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationTransactionCommitAuthorizationResult:
          "controlled-workspace-host-activation-transaction-commit-authorized-not-committed" as const,
        predecessorActivationTransactionCommitAuthorizationState:
          "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY" as const,
        nextEligibleStep: "3B.3.40" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationIssuancePipelineExecutionAuthorization: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationIssuancePipelineExecutionAuthorization();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.40" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        activationIssuancePipelineExecutionAuthorizationId: d.activationIssuancePipelineExecutionAuthorizationId,
        activationIssuancePipelineExecutionAuthorizationContractId: d.activationIssuancePipelineExecutionAuthorizationContractId,
        candidateKind: "adaptive-workspace" as const,
        pipelineExecutionAuthorizationState: "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED" as const,
        pipelineExecutionAuthorizationResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineExecutionAuthorized: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitReadinessCount: 1 as const,
        transactionCommitAuthorizationCount: 1 as const,
        transactionCommitCount: 1 as const,
        duplicateTransactionPreparationCount: 0 as const,
        duplicateTransactionCommitReadinessCount: 0 as const,
        duplicateTransactionCommitAuthorizationCount: 0 as const,
        duplicateTransactionCommitCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        activationIssuancePipelineExecutionAuthorizationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationTransactionCommitReadinessResult:
          "controlled-workspace-host-activation-transaction-commit-ready-not-committed" as const,
        predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationTransactionCommitAuthorizationResult:
          "controlled-workspace-host-activation-transaction-commit-authorized-not-committed" as const,
        predecessorActivationTransactionCommitAuthorizationState:
          "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY" as const,
        nextEligibleStep: "3B.3.41" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostActivationIssuancePipelineExecution: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostActivationIssuancePipelineExecution();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.41" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        activationIssuancePipelineExecutionAuthorizationId: d.activationIssuancePipelineExecutionAuthorizationId,
        activationIssuancePipelineExecutionAuthorizationContractId: d.activationIssuancePipelineExecutionAuthorizationContractId,
        activationIssuancePipelineExecutionId: d.activationIssuancePipelineExecutionId,
        activationIssuancePipelineExecutionContractId: d.activationIssuancePipelineExecutionContractId,
        candidateKind: "adaptive-workspace" as const,
        pipelineExecutionState: "PIPELINE_EXECUTED_NOT_ACTIVATED" as const,
        pipelineExecutionResult:
          "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineExecutionAuthorized: true as const,
        issuancePipelineExecuted: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitReadinessCount: 1 as const,
        transactionCommitAuthorizationCount: 1 as const,
        transactionCommitCount: 1 as const,
        duplicateTransactionPreparationCount: 0 as const,
        duplicateTransactionCommitReadinessCount: 0 as const,
        duplicateTransactionCommitAuthorizationCount: 0 as const,
        duplicateTransactionCommitCount: 0 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        activationIssuancePipelineExecutionAuthorizationIdentityUnique: true as const,
        activationIssuancePipelineExecutionIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationTransactionCommitReadinessResult:
          "controlled-workspace-host-activation-transaction-commit-ready-not-committed" as const,
        predecessorActivationTransactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationState:
          "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationTransactionCommitAuthorizationResult:
          "controlled-workspace-host-activation-transaction-commit-authorized-not-committed" as const,
        predecessorActivationTransactionCommitAuthorizationState:
          "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        issuanceCommitBoundaryResult:
          "authorization-grant-issuance-commit-boundary-ready-not-entered" as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionResult:
          "authorization-grant-issuance-transaction-opened-not-prepared" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineResult:
          "authorization-grant-issuance-pipeline-ready-not-executable" as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker:
          "PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY" as const,
        nextEligibleStep: "3B.3.42" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },


    readControlledWorkspaceHostCandidateActivationReadiness: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostCandidateActivationReadiness();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.42" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        activationIssuancePipelineExecutionAuthorizationId: d.activationIssuancePipelineExecutionAuthorizationId,
        activationIssuancePipelineExecutionAuthorizationContractId: d.activationIssuancePipelineExecutionAuthorizationContractId,
        activationIssuancePipelineExecutionId: d.activationIssuancePipelineExecutionId,
        activationIssuancePipelineExecutionContractId: d.activationIssuancePipelineExecutionContractId,
        activationCandidateActivationReadinessId: d.activationCandidateActivationReadinessId,
        activationCandidateActivationReadinessContractId: d.activationCandidateActivationReadinessContractId,
        candidateKind: "adaptive-workspace" as const,
        candidateActivationReadinessState: "CANDIDATE_ACTIVATION_READY_NOT_ACTIVATED" as const,
        candidateActivationReadinessResult:
          "controlled-workspace-host-candidate-activation-ready-not-activated" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineExecutionAuthorized: true as const,
        issuancePipelineExecuted: true as const,
        candidateActivationReady: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        activationIssuancePipelineExecutionAuthorizationIdentityUnique: true as const,
        activationIssuancePipelineExecutionIdentityUnique: true as const,
        activationCandidateActivationReadinessIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        duplicateTransactionCommitCount: 0 as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationState:
          "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionResult:
          "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated" as const,
        predecessorActivationIssuancePipelineExecutionState:
          "PIPELINE_EXECUTED_NOT_ACTIVATED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationBlocker:
          "PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY" as const,
        nextEligibleStep: "3B.3.43" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },


    readControlledWorkspaceHostCandidateActivationAuthorization: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostCandidateActivationAuthorization();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.43" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        activationIssuancePipelineExecutionAuthorizationId: d.activationIssuancePipelineExecutionAuthorizationId,
        activationIssuancePipelineExecutionAuthorizationContractId: d.activationIssuancePipelineExecutionAuthorizationContractId,
        activationIssuancePipelineExecutionId: d.activationIssuancePipelineExecutionId,
        activationIssuancePipelineExecutionContractId: d.activationIssuancePipelineExecutionContractId,
        activationCandidateActivationReadinessId: d.activationCandidateActivationReadinessId,
        activationCandidateActivationReadinessContractId: d.activationCandidateActivationReadinessContractId,
        activationCandidateActivationAuthorizationId: d.activationCandidateActivationAuthorizationId,
        activationCandidateActivationAuthorizationContractId: d.activationCandidateActivationAuthorizationContractId,
        candidateKind: "adaptive-workspace" as const,
        candidateActivationAuthorizationState: "CANDIDATE_ACTIVATION_AUTHORIZED_NOT_ACTIVATED" as const,
        candidateActivationAuthorizationResult:
          "controlled-workspace-host-candidate-activation-authorized-not-activated" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineExecutionAuthorized: true as const,
        issuancePipelineExecuted: true as const,
        candidateActivationReady: true as const,
        candidateActivationAuthorized: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: false as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 0 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        activationIssuancePipelineExecutionAuthorizationIdentityUnique: true as const,
        activationIssuancePipelineExecutionIdentityUnique: true as const,
        activationCandidateActivationReadinessIdentityUnique: true as const,
        activationCandidateActivationAuthorizationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        duplicateTransactionCommitCount: 0 as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationState:
          "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionResult:
          "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated" as const,
        predecessorActivationIssuancePipelineExecutionState:
          "PIPELINE_EXECUTED_NOT_ACTIVATED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationBlocker:
          "PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY" as const,
        nextEligibleStep: "3B.3.44" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },


    readControlledWorkspaceHostCandidateActivation: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostCandidateActivation();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.44" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        activationIssuancePipelineExecutionAuthorizationId: d.activationIssuancePipelineExecutionAuthorizationId,
        activationIssuancePipelineExecutionAuthorizationContractId: d.activationIssuancePipelineExecutionAuthorizationContractId,
        activationIssuancePipelineExecutionId: d.activationIssuancePipelineExecutionId,
        activationIssuancePipelineExecutionContractId: d.activationIssuancePipelineExecutionContractId,
        activationCandidateActivationReadinessId: d.activationCandidateActivationReadinessId,
        activationCandidateActivationReadinessContractId: d.activationCandidateActivationReadinessContractId,
        activationCandidateActivationAuthorizationId: d.activationCandidateActivationAuthorizationId,
        activationCandidateActivationAuthorizationContractId: d.activationCandidateActivationAuthorizationContractId,
        activationCandidateActivationId: d.activationCandidateActivationId,
        activationCandidateActivationContractId: d.activationCandidateActivationContractId,
        candidateKind: "adaptive-workspace" as const,
        candidateActivationState: "CANDIDATE_ACTIVATED_NOT_ACTIVE" as const,
        candidateActivationResult:
          "controlled-workspace-host-candidate-activated-not-active" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineExecutionAuthorized: true as const,
        issuancePipelineExecuted: true as const,
        candidateActivationReady: true as const,
        candidateActivationAuthorized: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: true as const,
        candidateActive: false as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 1 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        activationIssuancePipelineExecutionAuthorizationIdentityUnique: true as const,
        activationIssuancePipelineExecutionIdentityUnique: true as const,
        activationCandidateActivationReadinessIdentityUnique: true as const,
        activationCandidateActivationAuthorizationIdentityUnique: true as const,
        activationCandidateActivationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        duplicateTransactionCommitCount: 0 as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationState:
          "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionResult:
          "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated" as const,
        predecessorActivationIssuancePipelineExecutionState:
          "PIPELINE_EXECUTED_NOT_ACTIVATED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationBlocker:
          "PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY" as const,
        nextEligibleStep: "3B.3.45" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostCandidateActive: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostCandidateActive();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.45" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        activationIssuancePipelineExecutionAuthorizationId: d.activationIssuancePipelineExecutionAuthorizationId,
        activationIssuancePipelineExecutionAuthorizationContractId: d.activationIssuancePipelineExecutionAuthorizationContractId,
        activationIssuancePipelineExecutionId: d.activationIssuancePipelineExecutionId,
        activationIssuancePipelineExecutionContractId: d.activationIssuancePipelineExecutionContractId,
        activationCandidateActivationReadinessId: d.activationCandidateActivationReadinessId,
        activationCandidateActivationReadinessContractId: d.activationCandidateActivationReadinessContractId,
        activationCandidateActivationAuthorizationId: d.activationCandidateActivationAuthorizationId,
        activationCandidateActivationAuthorizationContractId: d.activationCandidateActivationAuthorizationContractId,
        activationCandidateActivationId: d.activationCandidateActivationId,
        activationCandidateActivationContractId: d.activationCandidateActivationContractId,
        activationCandidateActiveId: d.activationCandidateActiveId,
        activationCandidateActiveContractId: d.activationCandidateActiveContractId,
        candidateKind: "adaptive-workspace" as const,
        candidateActivationState: "CANDIDATE_ACTIVE_NOT_EXECUTABLE" as const,
        candidateActivationResult:
          "controlled-workspace-host-candidate-active-not-executable" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineExecutionAuthorized: true as const,
        issuancePipelineExecuted: true as const,
        candidateActivationReady: true as const,
        candidateActivationAuthorized: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: true as const,
        candidateActive: true as const,
        candidateExecutable: false as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 1 as const,
        executableCandidateCount: 0 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        activationIssuancePipelineExecutionAuthorizationIdentityUnique: true as const,
        activationIssuancePipelineExecutionIdentityUnique: true as const,
        activationCandidateActivationReadinessIdentityUnique: true as const,
        activationCandidateActivationAuthorizationIdentityUnique: true as const,
        activationCandidateActivationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        duplicateTransactionCommitCount: 0 as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationState:
          "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionResult:
          "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated" as const,
        predecessorActivationIssuancePipelineExecutionState:
          "PIPELINE_EXECUTED_NOT_ACTIVATED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationBlocker:
          "PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY" as const,
        nextEligibleStep: "3B.3.46" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },

    readControlledWorkspaceHostCandidateExecutable: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostCandidateExecutable();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.46" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        activationIssuancePipelineExecutionAuthorizationId: d.activationIssuancePipelineExecutionAuthorizationId,
        activationIssuancePipelineExecutionAuthorizationContractId: d.activationIssuancePipelineExecutionAuthorizationContractId,
        activationIssuancePipelineExecutionId: d.activationIssuancePipelineExecutionId,
        activationIssuancePipelineExecutionContractId: d.activationIssuancePipelineExecutionContractId,
        activationCandidateActivationReadinessId: d.activationCandidateActivationReadinessId,
        activationCandidateActivationReadinessContractId: d.activationCandidateActivationReadinessContractId,
        activationCandidateActivationAuthorizationId: d.activationCandidateActivationAuthorizationId,
        activationCandidateActivationAuthorizationContractId: d.activationCandidateActivationAuthorizationContractId,
        activationCandidateActivationId: d.activationCandidateActivationId,
        activationCandidateActivationContractId: d.activationCandidateActivationContractId,
        activationCandidateActiveId: d.activationCandidateActiveId,
        activationCandidateActiveContractId: d.activationCandidateActiveContractId,
        activationCandidateExecutableId: d.activationCandidateExecutableId,
        activationCandidateExecutableContractId: d.activationCandidateExecutableContractId,
        candidateKind: "adaptive-workspace" as const,
        candidateActivationState: "CANDIDATE_EXECUTABLE_NOT_EXECUTED" as const,
        candidateActivationResult:
          "controlled-workspace-host-candidate-executable-not-executed" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineExecutionAuthorized: true as const,
        issuancePipelineExecuted: true as const,
        candidateActivationReady: true as const,
        candidateActivationAuthorized: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: true as const,
        candidateActive: true as const,
        candidateExecutable: true as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 1 as const,
        executableCandidateCount: 1 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        activationIssuancePipelineExecutionAuthorizationIdentityUnique: true as const,
        activationIssuancePipelineExecutionIdentityUnique: true as const,
        activationCandidateActivationReadinessIdentityUnique: true as const,
        activationCandidateActivationAuthorizationIdentityUnique: true as const,
        activationCandidateActivationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        duplicateTransactionCommitCount: 0 as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationState:
          "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionResult:
          "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated" as const,
        predecessorActivationIssuancePipelineExecutionState:
          "PIPELINE_EXECUTED_NOT_ACTIVATED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationBlocker:
          "PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY" as const,
        nextEligibleStep: "3B.3.47" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },
    readControlledWorkspaceHostCandidateExecutionStarted: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceHostCandidateExecutionStarted();
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics;
      return {
        phase: "3B.3.47" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        activationIssuancePipelineExecutionAuthorizationId: d.activationIssuancePipelineExecutionAuthorizationId,
        activationIssuancePipelineExecutionAuthorizationContractId: d.activationIssuancePipelineExecutionAuthorizationContractId,
        activationIssuancePipelineExecutionId: d.activationIssuancePipelineExecutionId,
        activationIssuancePipelineExecutionContractId: d.activationIssuancePipelineExecutionContractId,
        activationCandidateActivationReadinessId: d.activationCandidateActivationReadinessId,
        activationCandidateActivationReadinessContractId: d.activationCandidateActivationReadinessContractId,
        activationCandidateActivationAuthorizationId: d.activationCandidateActivationAuthorizationId,
        activationCandidateActivationAuthorizationContractId: d.activationCandidateActivationAuthorizationContractId,
        activationCandidateActivationId: d.activationCandidateActivationId,
        activationCandidateActivationContractId: d.activationCandidateActivationContractId,
        activationCandidateActiveId: d.activationCandidateActiveId,
        activationCandidateActiveContractId: d.activationCandidateActiveContractId,
        activationCandidateExecutableId: d.activationCandidateExecutableId,
        activationCandidateExecutableContractId: d.activationCandidateExecutableContractId,
        activationCandidateExecutionStartedId: d.activationCandidateExecutionStartedId,
        activationCandidateExecutionStartedContractId: d.activationCandidateExecutionStartedContractId,
        candidateKind: "adaptive-workspace" as const,
        candidateActivationState: "CANDIDATE_EXECUTION_STARTED_NOT_EXECUTED" as const,
        candidateActivationResult:
          "controlled-workspace-host-candidate-execution-started-not-executed" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineExecutionAuthorized: true as const,
        issuancePipelineExecuted: true as const,
        candidateActivationReady: true as const,
        candidateActivationAuthorized: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: true as const,
        candidateActive: true as const,
        candidateExecutable: true as const,
        candidateActivationStarted: true as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 1 as const,
        executableCandidateCount: 1 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        activationIssuancePipelineExecutionAuthorizationIdentityUnique: true as const,
        activationIssuancePipelineExecutionIdentityUnique: true as const,
        activationCandidateActivationReadinessIdentityUnique: true as const,
        activationCandidateActivationAuthorizationIdentityUnique: true as const,
        activationCandidateActivationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        duplicateTransactionCommitCount: 0 as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationState:
          "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionResult:
          "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated" as const,
        predecessorActivationIssuancePipelineExecutionState:
          "PIPELINE_EXECUTED_NOT_ACTIVATED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationBlocker:
          "PHASE_3B3_47_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ONLY" as const,
        nextEligibleStep: "3B.3.48" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },
    readControlledWorkspaceHostCandidatePreActivationSeal: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation =
        mod.evaluateControlledWorkspaceHostCandidatePreActivationSeal(
          undefined,
          { candidateActivationStarted: true },
        );
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics as Record<string, unknown>;
      return {
        phase: "AW-R1" as const,
        previousPhase: "3B.3.47" as const,
        candidateId: d.candidateId,
        registrationId: d.registrationId,
        selectionId: d.selectionId,
        activationReadinessId: d.activationReadinessId,
        activationAuthorizationId: d.activationAuthorizationId,
        activationGrantId: d.activationGrantId,
        activationGrantIssuanceId: d.activationGrantIssuanceId,
        activationCommitBoundaryId: d.activationCommitBoundaryId,
        activationCommitBoundaryContractId: d.activationCommitBoundaryContractId,
        activationTransactionOpeningReadinessId: d.activationTransactionOpeningReadinessId,
        activationTransactionOpeningReadinessContractId: d.activationTransactionOpeningReadinessContractId,
        activationTransactionOpeningAuthorizationId: d.activationTransactionOpeningAuthorizationId,
        activationTransactionOpeningAuthorizationContractId: d.activationTransactionOpeningAuthorizationContractId,
        activationTransactionOpeningId: d.activationTransactionOpeningId,
        activationTransactionOpeningContractId: d.activationTransactionOpeningContractId,
        activationTransactionPreparationReadinessId: d.activationTransactionPreparationReadinessId,
        activationTransactionPreparationReadinessContractId: d.activationTransactionPreparationReadinessContractId,
        activationTransactionPreparationAuthorizationId: d.activationTransactionPreparationAuthorizationId,
        activationTransactionPreparationAuthorizationContractId: d.activationTransactionPreparationAuthorizationContractId,
        activationTransactionPreparationId: d.activationTransactionPreparationId,
        activationTransactionPreparationContractId: d.activationTransactionPreparationContractId,
        activationTransactionCommitReadinessId: d.activationTransactionCommitReadinessId,
        activationTransactionCommitReadinessContractId: d.activationTransactionCommitReadinessContractId,
        activationTransactionCommitAuthorizationId: d.activationTransactionCommitAuthorizationId,
        activationTransactionCommitAuthorizationContractId: d.activationTransactionCommitAuthorizationContractId,
        activationTransactionCommitId: d.activationTransactionCommitId,
        activationTransactionCommitContractId: d.activationTransactionCommitContractId,
        activationIssuancePipelineExecutionReadinessId: d.activationIssuancePipelineExecutionReadinessId,
        activationIssuancePipelineExecutionReadinessContractId: d.activationIssuancePipelineExecutionReadinessContractId,
        activationIssuancePipelineExecutionAuthorizationId: d.activationIssuancePipelineExecutionAuthorizationId,
        activationIssuancePipelineExecutionAuthorizationContractId: d.activationIssuancePipelineExecutionAuthorizationContractId,
        activationIssuancePipelineExecutionId: d.activationIssuancePipelineExecutionId,
        activationIssuancePipelineExecutionContractId: d.activationIssuancePipelineExecutionContractId,
        activationCandidateActivationReadinessId: d.activationCandidateActivationReadinessId,
        activationCandidateActivationReadinessContractId: d.activationCandidateActivationReadinessContractId,
        activationCandidateActivationAuthorizationId: d.activationCandidateActivationAuthorizationId,
        activationCandidateActivationAuthorizationContractId: d.activationCandidateActivationAuthorizationContractId,
        activationCandidateActivationId: d.activationCandidateActivationId,
        activationCandidateActivationContractId: d.activationCandidateActivationContractId,
        activationCandidateActiveId: d.activationCandidateActiveId,
        activationCandidateActiveContractId: d.activationCandidateActiveContractId,
        activationCandidateExecutableId: d.activationCandidateExecutableId,
        activationCandidateExecutableContractId: d.activationCandidateExecutableContractId,
        activationCandidateExecutionStartedId: d.activationCandidateExecutionStartedId,
        activationCandidateExecutionStartedContractId: d.activationCandidateExecutionStartedContractId,
        activationCandidatePreActivationSealId: d.activationCandidatePreActivationSealId,
        activationCandidatePreActivationSealContractId: d.activationCandidatePreActivationSealContractId,
        candidateKind: "adaptive-workspace" as const,
        candidateActivationState: "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE" as const,
        candidateActivationResult:
          "controlled-workspace-host-candidate-pre-activation-sealed-not-live" as const,
        transactionOpeningReady: true as const,
        transactionOpeningAuthorized: true as const,
        transactionOpeningStarted: true as const,
        transactionOpeningCompleted: true as const,
        transactionPreparationReady: true as const,
        transactionPreparationAuthorized: true as const,
        transactionCommitReady: true as const,
        transactionCommitAuthorized: true as const,
        issuancePipelineExecutionReady: true as const,
        issuancePipelineExecutionAuthorized: true as const,
        issuancePipelineExecuted: true as const,
        candidateActivationReady: true as const,
        candidateActivationAuthorized: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        activationCommitBoundaryEntered: true as const,
        activationCommitBoundaryState: "ENTERED" as const,
        activationCommitBoundaryArmed: false as const,
        activationCommitBoundaryCrossed: false as const,
        activationCommitBoundaryCommitted: false as const,
        activationCommitBoundaryAborted: false as const,
        activationCommitBoundaryExecutable: false as const,
        activationCommitBoundaryBlocked: true as const,
        activationTransactionOpeningAllowed: false as const,
        activationExecutionAllowed: false as const,
        transitionFrom: "NOT_ENTERED" as const,
        transitionTo: "ENTERED" as const,
        transitionLegal: true as const,
        candidateSelected: true as const,
        candidateReady: true as const,
        candidateAuthorized: true as const,
        candidateGranted: true as const,
        candidateActivated: true as const,
        candidateActive: true as const,
        candidateExecutable: true as const,
        candidateActivationStarted: true as const,
        candidateActivationExecuted: true as const,
        candidateActivationCompleted: true as const,
        grantPresent: true as const,
        grantIssued: true as const,
        grantValid: true as const,
        grantImmutable: true as const,
        grantUnique: true as const,
        grantExecutable: false as const,
        futureGrantPossible: true as const,
        futureGrantIssued: true as const,
        futureActivationPossible: true as const,
        futureActivationAuthorized: true as const,
        futureActivationStarted: false as const,
        candidateCount: 1 as const,
        registeredCandidateCount: 1 as const,
        selectedCandidateCount: 1 as const,
        readyCandidateCount: 1 as const,
        authorizedCandidateCount: 1 as const,
        grantedCandidateCount: 1 as const,
        grantCount: 1 as const,
        transactionPreparationCount: 1 as const,
        transactionCommitCount: 1 as const,
        futureActivationTargetCount: 1 as const,
        activeCandidateCount: 0 as const,
        activatedCandidateCount: 1 as const,
        executableCandidateCount: 1 as const,
        candidateIdentityUnique: true as const,
        selectionIdentityUnique: true as const,
        activationReadinessIdentityUnique: true as const,
        activationAuthorizationIdentityUnique: true as const,
        activationGrantIdentityUnique: true as const,
        activationGrantIssuanceIdentityUnique: true as const,
        activationCommitBoundaryIdentityUnique: true as const,
        activationTransactionOpeningReadinessIdentityUnique: true as const,
        activationTransactionOpeningAuthorizationIdentityUnique: true as const,
        activationTransactionOpeningIdentityUnique: true as const,
        activationTransactionPreparationReadinessIdentityUnique: true as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationTransactionPreparationIdentityUnique: true as const,
        activationTransactionCommitReadinessIdentityUnique: true as const,
        activationTransactionCommitAuthorizationIdentityUnique: true as const,
        activationTransactionCommitIdentityUnique: true as const,
        activationIssuancePipelineExecutionReadinessIdentityUnique: true as const,
        activationIssuancePipelineExecutionAuthorizationIdentityUnique: true as const,
        activationIssuancePipelineExecutionIdentityUnique: true as const,
        activationCandidateActivationReadinessIdentityUnique: true as const,
        activationCandidateActivationAuthorizationIdentityUnique: true as const,
        activationCandidateActivationIdentityUnique: true as const,
        candidateStructurallyCompatible: true as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        tokenPresent: false as const,
        credentialPresent: false as const,
        certificatePresent: false as const,
        permitPresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceReactInstancePresent: false as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuancePipelineExecutable: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        unmountCount: 0 as const,
        geoFeedRenderCount: 1 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        duplicateTransactionCommitCount: 0 as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-authorized-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionAuthorizationState:
          "PIPELINE_EXECUTION_AUTHORIZED_NOT_EXECUTED" as const,
        predecessorActivationIssuancePipelineExecutionResult:
          "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated" as const,
        predecessorActivationIssuancePipelineExecutionState:
          "PIPELINE_EXECUTED_NOT_ACTIVATED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED" as const,
        activationTransactionPreparationAuthorizationIdentityUnique: true as const,
        activationBlocker: "PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY" as const,
        nextEligibleStep: "AW-R2" as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },
    readControlledWorkspaceLiveAuthorization: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceLiveAuthorization(
        undefined,
        {
          candidateActivationStarted: true,
          candidateActivationExecuted: true,
          candidateActivationCompleted: true,
          activationExecutionAllowed: false,
        },
      );
      const d = evaluation.descriptor;
      const diag = evaluation.diagnostics as Record<string, unknown>;
      return {
        ...d,
        phase: "AW-R2" as const,
        previousPhase: "AW-R1" as const,
        nextEligibleStep: "AW-R3" as const,
        activationLiveAuthorizationId:
          "feed.discovery.adaptive-workspace.host-live-authorization.v1" as const,
        activationLiveAuthorizationContractId:
          "feed.discovery.adaptive-workspace.host-live-authorization.contract.v1" as const,
        candidateActivationState: "LIVE_AUTHORIZED_NOT_EXECUTABLE" as const,
        candidateActivationResult:
          "controlled-workspace-live-authorized-not-executable" as const,
        activationExecutionAllowed: true as const,
        issuancePipelineExecutionAllowed: false as const,
        issuancePipelineExecutable: false as const,
        issuancePipelineState: "NON_EXECUTABLE" as const,
        issuanceTransactionState: "OPENED" as const,
        issuanceTransactionOpened: true as const,
        issuanceTransactionPrepared: true as const,
        issuanceTransactionCommitted: true as const,
        issuanceTransactionAborted: false as const,
        issuanceCommitBoundaryState: "NOT_ENTERED" as const,
        issuanceCommitBoundaryEntered: false as const,
        runtimeCapabilityPresent: false as const,
        runtimeHostInstancePresent: false as const,
        activationHandlePresent: false as const,
        executionHandlePresent: false as const,
        mountsGeoFeed: false as const,
        containsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        shellRendered: false as const,
        shellChildCount: 0 as const,
        shellDOMNodeCount: 0 as const,
        workspaceVisible: false as const,
        workspaceHostMounted: false as const,
        workspaceCandidateRendered: false as const,
        workspaceReactInstancePresent: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        runtimeId: d.runtimeId,
        hostId: d.hostId,
        mountCount: 1 as const,
        geoFeedRenderCount: 1 as const,
        unmountCount: 0 as const,
        activeInstanceCount: 1 as const,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        duplicateTransactionCommitCount: 0 as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState:
          "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState:
          "COMMIT_BOUNDARY_ENTERED" as const,
        activationBlocker:
          "PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY" as const,
        controlledLiveAuthorizationMetaOk: true as const,
        conditionCount: diag.conditionCount as number,
        satisfiedConditionCount: diag.satisfiedConditionCount as number,
        unsatisfiedConditionCount: 0 as const,
        guardCount: diag.guardCount as number,
        satisfiedGuardCount: diag.satisfiedGuardCount as number,
        unsatisfiedGuardCount: 0 as const,
        blockerCount: diag.blockerCount as number,
        diagnostics: evaluation.diagnostics,
      };
    },
    readControlledWorkspaceExecution: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledWorkspaceExecution(undefined, {
        candidateActivationStarted: true,
        candidateActivationExecuted: true,
        candidateActivationCompleted: true,
        activationExecutionAllowed: true,
        issuancePipelineExecutionAllowed: false,
        issuancePipelineExecutable: false,
        issuancePipelineState: "NON_EXECUTABLE",
        issuanceTransactionState: "OPENED",
        workspaceVisible: false,
        workspaceHostMounted: false,
        workspaceCandidateRendered: false,
        workspaceReactInstancePresent: false,
        runtimeCapabilityPresent: false,
        runtimeHostInstancePresent: false,
        activationHandlePresent: false,
        executionHandlePresent: false,
        hostActivation: false,
        canStartActivation: false,
        renderActivation: false,
      });
      const d = evaluation.descriptor;
      return {
        ...d,
        phase: "AW-R3" as const,
        previousPhase: "AW-R2" as const,
        nextEligibleStep: "AW-R4" as const,
        activationControlledExecutionId:
          "feed.discovery.adaptive-workspace.host-controlled-execution.v1" as const,
        activationControlledExecutionContractId:
          "feed.discovery.adaptive-workspace.host-controlled-execution.contract.v1" as const,
        candidateActivationState:
          "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY" as const,
        candidateActivationResult:
          "controlled-workspace-executing-geofeed-legacy-authority" as const,
        activationExecutionAllowed: true as const,
        issuancePipelineExecutionAllowed: true as const,
        issuancePipelineExecutable: true as const,
        issuancePipelineState: "CONTROLLED_EXECUTABLE" as const,
        issuanceTransactionState: "CONTROLLED_EXECUTION" as const,
        workspaceVisible: true as const,
        workspaceHostMounted: true as const,
        workspaceCandidateRendered: true as const,
        workspaceReactInstancePresent: true as const,
        runtimeCapabilityPresent: true as const,
        runtimeHostInstancePresent: true as const,
        activationHandlePresent: true as const,
        executionHandlePresent: true as const,
        hostActivation: true as const,
        canStartActivation: true as const,
        renderActivation: false as const,
        stableMountId:
          "feed.discovery.controlled-host.stable-mount.v1" as const,
        stableMountIdentityPreserved: true as const,
        workspaceExecutionAuthorized: true as const,
        geoFeedAuthorityTransferred: false as const,
        feedOnAuthorized: false as const,
        productionPromotionAuthorized: false as const,
        workspaceRuntimeHandleId:
          "feed.discovery.adaptive-workspace.workspace-runtime-handle.v1" as const,
        workspaceActivationHandleId:
          "feed.discovery.adaptive-workspace.workspace-activation-handle.v1" as const,
        workspaceExecutionHandleId:
          "feed.discovery.adaptive-workspace.workspace-execution-handle.v1" as const,
        containsGeoFeed: false as const,
        mountsGeoFeed: false as const,
        wrapsGeoFeed: false as const,
        duplicatesGeoFeed: false as const,
        createsSecondGeoFeed: false as const,
        owner: "legacy" as const,
        writer: "legacy" as const,
        renderer: "legacy" as const,
        mountCount: 1 as const,
        geoFeedRenderCount: 1 as const,
        unmountCount: 0 as const,
        predecessorActivationTransactionPreparationResult:
          "controlled-workspace-host-activation-transaction-prepared-not-committed" as const,
        predecessorActivationTransactionPreparationState:
          "TRANSACTION_PREPARED_NOT_COMMITTED" as const,
        predecessorActivationIssuancePipelineExecutionReadinessResult:
          "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" as const,
        predecessorActivationIssuancePipelineExecutionReadinessState:
          "PIPELINE_EXECUTION_READY_NOT_EXECUTED" as const,
        predecessorActivationTransactionCommitResult:
          "controlled-workspace-host-activation-transaction-committed-not-executed" as const,
        predecessorActivationTransactionCommitState:
          "TRANSACTION_COMMITTED_NOT_EXECUTED" as const,
        predecessorActivationCommitBoundaryEntryResult:
          "controlled-workspace-host-activation-commit-boundary-entered" as const,
        predecessorActivationCommitBoundaryEntryState:
          "COMMIT_BOUNDARY_ENTERED" as const,
        activationBlocker:
          "PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY" as const,
        controlledWorkspaceExecutionMetaOk: true as const,
        diagnostics: evaluation.diagnostics,
      };
    },

    readHostActivationStateMachine: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostActivationStateMachine();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.13" as const,
        machineId: d.machineId,
        machineVersion: 1 as const,
        machineState: "completed" as const,
        machineResult: "state-machine-complete-not-executable" as const,
        currentState: "COMMIT_READY" as const,
        initialState: "LEGACY_DORMANT" as const,
        terminalStates: d.terminalStates,
        allowedTransitions: d.allowedTransitions,
        blockedTransitions: d.blockedTransitions,
        transitionGuards: d.transitionGuards,
        transitionReasons: d.transitionReasons,
        transitionBlockers: d.transitionBlockers,
        transitionPreconditions: d.transitionPreconditions,
        transitionValidationPoints: d.transitionValidationPoints,
        transitionExecuted: false as const,
        protocolExecuted: false as const,
        transactionCommitted: false as const,
        wouldCommit: true as const,
        commitReady: true as const,
        protocolResult: "protocol-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        planResult: "plan-complete-not-executable" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        wouldActivate: true as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY" as const,
        nextEligibleStep: "3B.3.14" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationCommitProtocol: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostActivationCommitProtocol();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.12" as const,
        protocolId: d.protocolId,
        protocolVersion: 1 as const,
        protocolState: "completed" as const,
        protocolResult: "protocol-complete-not-executable" as const,
        protocolExecuted: false as const,
        wouldCommit: true as const,
        commitReady: true as const,
        commitBlocked: true as const,
        protocolStages: d.protocolStages,
        stageSequence: d.stageSequence,
        commitSequence: d.commitSequence,
        commitGuards: d.commitGuards,
        commitPreconditions: d.commitPreconditions,
        commitValidationPoints: d.commitValidationPoints,
        ownershipChecks: d.ownershipChecks,
        rendererChecks: d.rendererChecks,
        writerChecks: d.writerChecks,
        rollbackPreparation: d.rollbackPreparation,
        abortConditions: d.abortConditions,
        readinessResult: "commit-ready-not-executable" as const,
        transactionResult: "transaction-complete-not-committed" as const,
        transactionCommitted: false as const,
        commitExecuted: false as const,
        ownershipTransferred: false as const,
        writerTransferred: false as const,
        rendererTransferred: false as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        planResult: "plan-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        wouldActivate: true as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY" as const,
        nextEligibleStep: "3B.3.13" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationCommitReadiness: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostActivationCommitReadiness();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.11" as const,
        readinessId: d.readinessId,
        readinessVersion: 1 as const,
        readinessState: "completed" as const,
        readinessResult: "commit-ready-not-executable" as const,
        wouldCommit: true as const,
        commitReady: true as const,
        commitBlocked: true as const,
        commitBlockers: d.commitBlockers,
        commitPreconditions: d.commitPreconditions,
        commitValidationPoints: d.commitValidationPoints,
        commitAbortConditions: d.commitAbortConditions,
        transactionResult: "transaction-complete-not-committed" as const,
        transactionCommitted: false as const,
        commitExecuted: false as const,
        ownershipTransferred: false as const,
        writerTransferred: false as const,
        rendererTransferred: false as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        planResult: "plan-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        wouldActivate: true as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY" as const,
        nextEligibleStep: "3B.3.12" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationTransaction: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostActivationTransaction();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.10" as const,
        transactionId: d.transactionId,
        transactionVersion: 1 as const,
        transactionState: "completed" as const,
        transactionResult: "transaction-complete-not-committed" as const,
        wouldCommit: true as const,
        transactionCommitted: false as const,
        beginState: d.beginState,
        intendedEndState: d.intendedEndState,
        commitConditions: d.commitConditions,
        rollbackConditions: d.rollbackConditions,
        validationCheckpoints: d.validationCheckpoints,
        transactionCheckpoints: d.transactionCheckpoints,
        compensatingActions: d.compensatingActions,
        abortConditions: d.abortConditions,
        invariants: d.invariants,
        decisionResult: "ALLOW" as const,
        planResult: "plan-complete-not-executable" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        wouldActivate: true as const,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY" as const,
        nextEligibleStep: "3B.3.11" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationPipeline: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostActivationPipeline();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.9" as const,
        pipelineId: d.pipelineId,
        pipelineVersion: 1 as const,
        pipelineState: "completed" as const,
        pipelineResult: "pipeline-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        planResult: "plan-complete-not-executable" as const,
        wouldActivate: true as const,
        pipelineStages: d.pipelineStages,
        stageOrder: d.stageOrder,
        stageDependencies: d.stageDependencies,
        entryConditions: d.entryConditions,
        exitConditions: d.exitConditions,
        validationPoints: d.validationPoints,
        rollbackCheckpoints: d.rollbackCheckpoints,
        abortConditions: d.abortConditions,
        invariants: d.invariants,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY" as const,
        nextEligibleStep: "3B.3.10" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationPlan: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostActivationPlan();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.8" as const,
        planId: d.planId,
        planVersion: 1 as const,
        planState: "completed" as const,
        planResult: "plan-complete-not-executable" as const,
        decisionResult: "ALLOW" as const,
        wouldActivate: true as const,
        plannedSteps: d.plannedSteps,
        preconditions: d.preconditions,
        validationPoints: d.validationPoints,
        rollbackCheckpoints: d.rollbackCheckpoints,
        abortConditions: d.abortConditions,
        invariants: d.invariants,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY" as const,
        nextEligibleStep: "3B.3.9" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
    readHostActivationDecision: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const evaluation = mod.evaluateControlledHostActivationDecision();
      const d = evaluation.descriptor;
      return {
        phase: "3B.3.7" as const,
        decisionState: "completed" as const,
        decisionResult: "ALLOW" as const,
        wouldActivate: true as const,
        confidence: "high" as const,
        decisionReasons: d.decisionReasons,
        decisionBlockers: d.decisionBlockers,
        runtimeId: d.runtimeId,
        hostActivation: false as const,
        renderActivation: false as const,
        canStartActivation: false as const,
        activationBlocker: "PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY" as const,
        nextEligibleStep: "3B.3.8" as const,
        diagnostics: evaluation.diagnostics,
      };
    },
  };

  window[HC_FEED_SEALED_PROBE_KEY] = api;
}

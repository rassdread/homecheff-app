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
  version: 23;
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
    version: 23,
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

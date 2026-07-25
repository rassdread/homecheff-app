/**
 * Phase 3B.2/3B.3.12 — namespaced browser probe bridge for sealed Feed instrumentation.
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
  version: 13;
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
    currentStep: "3B.3.12";
    eligibleStep: "3B.3.13";
  }>;
  readControlledHostContract: () => Promise<{
    hostActivation: false;
    renderActivation: false;
    activeRenderOwner: "legacy";
    activeWriter: "legacy";
    nextEligibleStep: "3B.3.13";
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
    version: 13,
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
        observedRuntimeId: "feed.discovery.legacy-single-mount.v1",
      });
      return {
        allowed: false as const,
        blockers: gate.blockers,
        currentStep: "3B.3.12" as const,
        eligibleStep: "3B.3.13" as const,
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
        nextEligibleStep: "3B.3.13" as const,
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

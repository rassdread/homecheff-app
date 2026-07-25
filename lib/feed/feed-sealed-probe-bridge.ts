/**
 * Phase 3B.2/3B.3.3 — namespaced browser probe bridge for sealed Feed instrumentation.
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
  version: 4;
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
    currentStep: "3B.3.3";
    eligibleStep: "3B.3.4";
  }>;
  readControlledHostContract: () => Promise<{
    hostActivation: false;
    renderActivation: false;
    activeRenderOwner: "legacy";
    activeWriter: "legacy";
    nextEligibleStep: "3B.3.4";
    hostClassification: "controlled-host-candidate";
  }>;
  readHostPlan: () => Promise<{
    activationState: "dormant";
    hostActivation: false;
    renderActivation: false;
    placementState: "shadow-registered";
    registrationState: "registered";
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
    version: 4,
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
        observedWriter: "legacy",
        observedRenderOwner: "legacy",
        observedMountCount: 1,
        observedRollbackTarget: "legacy",
        observedRegistrationState: "registered",
        observedRuntimeId: "feed.discovery.legacy-single-mount.v1",
      });
      return {
        allowed: false as const,
        blockers: gate.blockers,
        currentStep: "3B.3.3" as const,
        eligibleStep: "3B.3.4" as const,
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
        nextEligibleStep: "3B.3.4" as const,
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
        placementState: "shadow-registered" as const,
        registrationState: "registered" as const,
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
  };

  window[HC_FEED_SEALED_PROBE_KEY] = api;
}

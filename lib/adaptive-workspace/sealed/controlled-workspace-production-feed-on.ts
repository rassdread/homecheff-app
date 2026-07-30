/**
 * AW-R6 — Production Freeze & Feed ON.
 *
 * Final activation stage. Atomically authorizes Feed ON and production
 * promotion together with the pipeline/transaction/lifecycle advancing to
 * their terminal production values. The condensed roadmap is complete after
 * this stage: there is no further eligible implementation step.
 */
import { HardContractViolation } from "../schema/validation-error";
import {
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  evaluateControlledWorkspaceProductionReadiness,
  type ControlledWorkspaceProductionReadinessDescriptor,
} from "./controlled-workspace-production-readiness";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_SCHEMA_VERSION =
  1 as const;
export const ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE =
  "ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE" as const;
export const CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID =
  "feed.discovery.adaptive-workspace.host-production-feed-on.v1" as const;
export const CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-production-feed-on.contract.v1" as const;

export const CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONDITIONS =
  Object.freeze([
    "predecessor-aw-r5-production-readiness-exact",
    "workspace-authority-committed",
    "production-pipeline-on",
    "production-transaction-committed",
    "production-readiness-certified",
    "release-blockers-clear",
    "feed-on-authorized",
    "production-promotion-authorized",
    "atomic-feed-on-and-promotion",
    "stable-mount-identity-preserved",
    "condensed-roadmap-complete",
  ] as const);

export const CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_GUARDS = Object.freeze([
  "atomic-commit-only",
  "authority-dimensions-unchanged",
  "mount-topology-unchanged",
  "feed-on-requires-promotion",
  "promotion-requires-feed-on",
  "metadata-gate-only",
  "fail-closed",
  "terminal-stage-no-further-activation",
] as const);

export const CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_BLOCKERS =
  Object.freeze([ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE] as const);

export type ControlledWorkspaceProductionFeedOnInput = {
  readonly activationExecutionAllowed: true;
  readonly issuancePipelineExecutionAllowed: true;
  readonly issuancePipelineExecutable: true;
  readonly issuancePipelineState: "AUTHORITY_TRANSITIONED";
  readonly issuanceTransactionState: "AUTHORITY_COMMITTED";
  readonly workspaceVisible: true;
  readonly workspaceHostMounted: true;
  readonly workspaceCandidateRendered: true;
  readonly workspaceReactInstancePresent: true;
  readonly runtimeCapabilityPresent: true;
  readonly runtimeHostInstancePresent: true;
  readonly activationHandlePresent: true;
  readonly executionHandlePresent: true;
  readonly owner: "workspace";
  readonly writer: "workspace";
  readonly renderer: "workspace";
  readonly requestAuthority: "workspace";
  readonly paginationAuthority: "workspace";
  readonly cacheAuthority: "workspace";
  readonly observerAuthority: "workspace";
  readonly lifecycleAuthority: "workspace";
  readonly geoFeedAuthorityTransferred: true;
  readonly renderActivation: true;
  readonly feedOnAuthorized: false;
  readonly productionPromotionAuthorized: false;
  readonly productionReadinessCertified: true;
  readonly releaseBlockersRemain: false;
};

export type ControlledWorkspaceProductionFeedOnDescriptor = Omit<
  ControlledWorkspaceProductionReadinessDescriptor,
  | "schemaVersion"
  | "phase"
  | "previousPhase"
  | "currentPhase"
  | "nextEligibleStep"
  | "title"
  | "candidateActivationState"
  | "candidateActivationResult"
  | "activationBlocker"
  | "conditions"
  | "satisfiedConditions"
  | "guards"
  | "satisfiedGuards"
  | "blockers"
  | "rollbackTargetPhase"
  | "rollbackMode"
  | "rollbackRestoresWorkspaceAuthority"
  | "issuancePipelineState"
  | "issuanceTransactionState"
  | "feedOnAuthorized"
  | "productionPromotionAuthorized"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R6";
  readonly previousPhase: "AW-R5";
  readonly currentPhase: "AW-R6";
  readonly nextEligibleStep: "none";
  readonly title: "Production Freeze & Feed ON";
  readonly activationProductionFeedOnId: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID;
  readonly activationProductionFeedOnContractId: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID;
  readonly issuancePipelineState: "PRODUCTION_ON";
  readonly issuanceTransactionState: "PRODUCTION_COMMITTED";
  readonly candidateActivationState: "PRODUCTION_LIVE_FEED_ON";
  readonly candidateActivationResult: "controlled-workspace-production-live-feed-on";
  readonly feedOnAuthorized: true;
  readonly productionPromotionAuthorized: true;
  readonly roadmapComplete: true;
  readonly terminalMarker: typeof ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE;
  readonly rollbackTargetPhase: "AW-R5";
  readonly rollbackMode: "metadata-gate-only";
  readonly rollbackRestoresProductionReadiness: true;
  readonly activationBlocker: typeof ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE;
  readonly conditions: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONDITIONS;
  readonly guards: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_GUARDS;
  readonly blockers: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_BLOCKERS;
};

export type ControlledWorkspaceProductionFeedOnEvaluation = {
  readonly descriptor: Readonly<ControlledWorkspaceProductionFeedOnDescriptor>;
  readonly diagnostics: Readonly<Record<string, unknown>>;
};

function validateProductionFeedOnInput(
  input?: ControlledWorkspaceProductionFeedOnInput,
): void {
  if (!input || typeof input !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_INPUT",
      "The complete sealed AW-R5 input is required",
    );
  }
  if (
    input.activationExecutionAllowed !== true ||
    input.issuancePipelineExecutionAllowed !== true ||
    input.issuancePipelineExecutable !== true ||
    input.issuancePipelineState !== "AUTHORITY_TRANSITIONED" ||
    input.issuanceTransactionState !== "AUTHORITY_COMMITTED" ||
    input.workspaceVisible !== true ||
    input.workspaceHostMounted !== true ||
    input.workspaceCandidateRendered !== true ||
    input.workspaceReactInstancePresent !== true ||
    input.runtimeCapabilityPresent !== true ||
    input.runtimeHostInstancePresent !== true ||
    input.activationHandlePresent !== true ||
    input.executionHandlePresent !== true ||
    input.owner !== "workspace" ||
    input.writer !== "workspace" ||
    input.renderer !== "workspace" ||
    input.requestAuthority !== "workspace" ||
    input.paginationAuthority !== "workspace" ||
    input.cacheAuthority !== "workspace" ||
    input.observerAuthority !== "workspace" ||
    input.lifecycleAuthority !== "workspace" ||
    input.geoFeedAuthorityTransferred !== true ||
    input.renderActivation !== true ||
    input.feedOnAuthorized !== false ||
    input.productionPromotionAuthorized !== false ||
    input.productionReadinessCertified !== true ||
    input.releaseBlockersRemain !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_DUPLICATE_OR_PARTIAL",
      "AW-R6 requires the exact sealed AW-R5 production-readiness state",
    );
  }
}

export function validateControlledWorkspaceProductionFeedOnDescriptor(
  d: ControlledWorkspaceProductionFeedOnDescriptor,
): ControlledWorkspaceProductionFeedOnDescriptor {
  if (
    d.phase !== "AW-R6" ||
    d.previousPhase !== "AW-R5" ||
    d.currentPhase !== "AW-R6" ||
    d.nextEligibleStep !== "none" ||
    d.title !== "Production Freeze & Feed ON" ||
    d.candidateActivationState !== "PRODUCTION_LIVE_FEED_ON" ||
    d.candidateActivationResult !==
      "controlled-workspace-production-live-feed-on"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_PHASE",
      "AW-R6 phase chain and lifecycle must be exact",
    );
  }
  if (
    d.activationExecutionAllowed !== true ||
    d.issuancePipelineExecutionAllowed !== true ||
    d.issuancePipelineExecutable !== true ||
    d.issuancePipelineState !== "PRODUCTION_ON" ||
    d.issuanceTransactionState !== "PRODUCTION_COMMITTED" ||
    d.workspaceVisible !== true ||
    d.workspaceHostMounted !== true ||
    d.workspaceCandidateRendered !== true ||
    d.workspaceReactInstancePresent !== true ||
    d.runtimeCapabilityPresent !== true ||
    d.runtimeHostInstancePresent !== true ||
    d.activationHandlePresent !== true ||
    d.executionHandlePresent !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_CAPABILITY_FLAGS",
      "AW-R6 pipeline/transaction and capability fields must be exact production values",
    );
  }
  if (
    d.owner !== "workspace" ||
    d.writer !== "workspace" ||
    d.renderer !== "workspace" ||
    d.requestAuthority !== "workspace" ||
    d.paginationAuthority !== "workspace" ||
    d.cacheAuthority !== "workspace" ||
    d.observerAuthority !== "workspace" ||
    d.lifecycleAuthority !== "workspace" ||
    d.geoFeedAuthorityTransferred !== true ||
    d.renderActivation !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_AUTHORITY",
      "Authority dimensions must remain committed to Workspace at AW-R6",
    );
  }
  if (d.feedOnAuthorized !== true || d.productionPromotionAuthorized !== true) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_ATOMIC",
      "Feed ON and production promotion must be authorized together, atomically",
    );
  }
  if (
    d.productionReadinessCertified !== true ||
    d.architectureProductionReady !== true ||
    d.releaseBlockersRemain !== false ||
    d.readyForFinalActivation !== true ||
    d.roadmapComplete !== true ||
    d.terminalMarker !== ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_CERTIFICATION",
      "Production Feed ON certification fields must be exact",
    );
  }
  if (
    d.mountCount !== 1 ||
    d.geoFeedRenderCount !== 1 ||
    d.unmountCount !== 0 ||
    d.geoFeedInstanceCount !== 1 ||
    d.containsGeoFeed !== false ||
    d.mountsGeoFeed !== false ||
    d.wrapsGeoFeed !== false ||
    d.duplicatesGeoFeed !== false ||
    d.createsSecondGeoFeed !== false ||
    d.stableMountId !== "feed.discovery.controlled-host.stable-mount.v1" ||
    d.stableMountIdentityPreserved !== true ||
    d.requestIdentityPreserved !== true ||
    d.feedStatePreserved !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_IDENTITY",
      "GeoFeed, request and feed-state identity must remain stable through Feed ON",
    );
  }
  if (
    d.legacyAuthorityActive !== false ||
    d.targetAuthorityActive !== true ||
    d.authorityCommitBoundary !== "COMMITTED" ||
    d.dualOwnerForbidden !== true ||
    d.dualWriterForbidden !== true ||
    d.dualRendererForbidden !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_DUAL_AUTHORITY",
      "The committed state must make dual authority impossible",
    );
  }
  if (
    d.rollbackTargetPhase !== "AW-R5" ||
    d.rollbackMode !== "metadata-gate-only" ||
    d.rollbackPreservesGeoFeedIdentity !== true ||
    d.rollbackPreservesRequestIdentity !== true ||
    d.rollbackRestoresProductionReadiness !== true ||
    d.activationBlocker !== ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_METADATA",
      "Rollback and terminal gate metadata must be exact",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceProductionFeedOn(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceProductionFeedOnInput,
): ControlledWorkspaceProductionFeedOnEvaluation {
  validateProductionFeedOnInput(input);
  const predecessor = evaluateControlledWorkspaceProductionReadiness(
    registry,
    {
      activationExecutionAllowed: true,
      issuancePipelineExecutionAllowed: true,
      issuancePipelineExecutable: true,
      issuancePipelineState: "AUTHORITY_TRANSITIONED",
      issuanceTransactionState: "AUTHORITY_COMMITTED",
      workspaceVisible: true,
      workspaceHostMounted: true,
      workspaceCandidateRendered: true,
      workspaceReactInstancePresent: true,
      runtimeCapabilityPresent: true,
      runtimeHostInstancePresent: true,
      activationHandlePresent: true,
      executionHandlePresent: true,
      owner: "workspace",
      writer: "workspace",
      renderer: "workspace",
      requestAuthority: "workspace",
      paginationAuthority: "workspace",
      cacheAuthority: "workspace",
      observerAuthority: "workspace",
      lifecycleAuthority: "workspace",
      geoFeedAuthorityTransferred: true,
      renderActivation: true,
      feedOnAuthorized: false,
      productionPromotionAuthorized: false,
    },
  );
  const pred = predecessor.descriptor;
  if (
    pred.phase !== "AW-R5" ||
    pred.previousPhase !== "AW-R4" ||
    pred.candidateActivationState !== "PRODUCTION_READY_NOT_RELEASED" ||
    pred.owner !== "workspace" ||
    pred.writer !== "workspace" ||
    pred.renderer !== "workspace" ||
    pred.requestAuthority !== "workspace" ||
    pred.paginationAuthority !== "workspace" ||
    pred.cacheAuthority !== "workspace" ||
    pred.observerAuthority !== "workspace" ||
    pred.lifecycleAuthority !== "workspace" ||
    pred.geoFeedAuthorityTransferred !== true ||
    pred.renderActivation !== true ||
    pred.feedOnAuthorized !== false ||
    pred.productionPromotionAuthorized !== false ||
    pred.productionReadinessCertified !== true ||
    pred.architectureProductionReady !== true ||
    pred.releaseBlockersRemain !== false ||
    pred.readyForFinalActivation !== true ||
    pred.issuancePipelineState !== "AUTHORITY_TRANSITIONED" ||
    pred.issuanceTransactionState !== "AUTHORITY_COMMITTED" ||
    pred.workspaceVisible !== true ||
    pred.runtimeCapabilityPresent !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_PREDECESSOR",
      "Predecessor must be the complete sealed AW-R5 state",
    );
  }

  const descriptor = Object.freeze({
    ...pred,
    schemaVersion: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_SCHEMA_VERSION,
    phase: "AW-R6",
    previousPhase: "AW-R5",
    currentPhase: "AW-R6",
    nextEligibleStep: "none",
    title: "Production Freeze & Feed ON",
    activationProductionFeedOnId: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID,
    activationProductionFeedOnContractId:
      CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID,
    issuancePipelineState: "PRODUCTION_ON",
    issuanceTransactionState: "PRODUCTION_COMMITTED",
    candidateActivationState: "PRODUCTION_LIVE_FEED_ON",
    candidateActivationResult: "controlled-workspace-production-live-feed-on",
    productionReadinessCertified: true,
    architectureProductionReady: true,
    releaseBlockersRemain: false,
    readyForFinalActivation: true,
    feedOnAuthorized: true,
    productionPromotionAuthorized: true,
    roadmapComplete: true,
    terminalMarker: ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE,
    containsGeoFeed: false,
    mountsGeoFeed: false,
    wrapsGeoFeed: false,
    duplicatesGeoFeed: false,
    createsSecondGeoFeed: false,
    mountCount: 1,
    geoFeedRenderCount: 1,
    unmountCount: 0,
    stableMountId: "feed.discovery.controlled-host.stable-mount.v1",
    stableMountIdentityPreserved: true,
    rollbackTargetPhase: "AW-R5",
    rollbackMode: "metadata-gate-only",
    rollbackPreservesGeoFeedIdentity: true,
    rollbackPreservesRequestIdentity: true,
    rollbackRestoresProductionReadiness: true,
    activationBlocker: ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE,
    conditions: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONDITIONS,
    satisfiedConditions: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONDITIONS,
    guards: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_GUARDS,
    satisfiedGuards: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_GUARDS,
    blockers: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  } as const) as ControlledWorkspaceProductionFeedOnDescriptor;
  validateControlledWorkspaceProductionFeedOnDescriptor(descriptor);
  return Object.freeze({
    descriptor,
    diagnostics: Object.freeze({
      ...predecessor.diagnostics,
      currentPhase: "AW-R6",
      previousPhase: "AW-R5",
      nextEligibleStep: "none",
      productionFeedOnMetaOk: true,
      predecessorIssuancePipelineState: "AUTHORITY_TRANSITIONED",
      predecessorIssuanceTransactionState: "AUTHORITY_COMMITTED",
      productionReadinessCertified: true,
      architectureProductionReady: true,
      releaseBlockersRemain: false,
      readyForFinalActivation: true,
      feedOnAuthorized: true,
      productionPromotionAuthorized: true,
      roadmapComplete: true,
      activationBlocker: ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE,
    }),
  });
}

const AW_R5_PRODUCTION_FEED_ON_INPUT = Object.freeze({
  activationExecutionAllowed: true,
  issuancePipelineExecutionAllowed: true,
  issuancePipelineExecutable: true,
  issuancePipelineState: "AUTHORITY_TRANSITIONED",
  issuanceTransactionState: "AUTHORITY_COMMITTED",
  workspaceVisible: true,
  workspaceHostMounted: true,
  workspaceCandidateRendered: true,
  workspaceReactInstancePresent: true,
  runtimeCapabilityPresent: true,
  runtimeHostInstancePresent: true,
  activationHandlePresent: true,
  executionHandlePresent: true,
  owner: "workspace",
  writer: "workspace",
  renderer: "workspace",
  requestAuthority: "workspace",
  paginationAuthority: "workspace",
  cacheAuthority: "workspace",
  observerAuthority: "workspace",
  lifecycleAuthority: "workspace",
  geoFeedAuthorityTransferred: true,
  renderActivation: true,
  feedOnAuthorized: false,
  productionPromotionAuthorized: false,
  productionReadinessCertified: true,
  releaseBlockersRemain: false,
} as const);

export function createControlledWorkspaceProductionFeedOnDescriptor(): ControlledWorkspaceProductionFeedOnDescriptor {
  return evaluateControlledWorkspaceProductionFeedOn(
    createControlledHostRegistry(),
    AW_R5_PRODUCTION_FEED_ON_INPUT,
  ).descriptor;
}

export type ControlledWorkspaceProductionFeedOnRollbackContract = {
  readonly phase: "AW-R5";
  readonly nextEligibleStep: "AW-R6";
  readonly candidateActivationState: "PRODUCTION_READY_NOT_RELEASED";
  readonly candidateActivationResult: "controlled-workspace-production-ready-feed-off";
  readonly activationExecutionAllowed: true;
  readonly issuancePipelineExecutionAllowed: true;
  readonly issuancePipelineExecutable: true;
  readonly issuancePipelineState: "AUTHORITY_TRANSITIONED";
  readonly issuanceTransactionState: "AUTHORITY_COMMITTED";
  readonly workspaceVisible: true;
  readonly runtimeCapabilityPresent: true;
  readonly owner: "workspace";
  readonly writer: "workspace";
  readonly renderer: "workspace";
  readonly renderActivation: true;
  readonly geoFeedAuthorityTransferred: true;
  readonly feedOnAuthorized: false;
  readonly productionPromotionAuthorized: false;
  readonly mountCount: 1;
  readonly geoFeedRenderCount: 1;
  readonly unmountCount: 0;
};

export function createControlledWorkspaceProductionFeedOnRollbackContract(): ControlledWorkspaceProductionFeedOnRollbackContract {
  const d = evaluateControlledWorkspaceProductionReadiness(
    createControlledHostRegistry(),
    {
      activationExecutionAllowed: true,
      issuancePipelineExecutionAllowed: true,
      issuancePipelineExecutable: true,
      issuancePipelineState: "AUTHORITY_TRANSITIONED",
      issuanceTransactionState: "AUTHORITY_COMMITTED",
      workspaceVisible: true,
      workspaceHostMounted: true,
      workspaceCandidateRendered: true,
      workspaceReactInstancePresent: true,
      runtimeCapabilityPresent: true,
      runtimeHostInstancePresent: true,
      activationHandlePresent: true,
      executionHandlePresent: true,
      owner: "workspace",
      writer: "workspace",
      renderer: "workspace",
      requestAuthority: "workspace",
      paginationAuthority: "workspace",
      cacheAuthority: "workspace",
      observerAuthority: "workspace",
      lifecycleAuthority: "workspace",
      geoFeedAuthorityTransferred: true,
      renderActivation: true,
      feedOnAuthorized: false,
      productionPromotionAuthorized: false,
    },
  ).descriptor;
  return Object.freeze({
    phase: d.phase,
    nextEligibleStep: d.nextEligibleStep,
    candidateActivationState: d.candidateActivationState,
    candidateActivationResult: d.candidateActivationResult,
    activationExecutionAllowed: d.activationExecutionAllowed,
    issuancePipelineExecutionAllowed: d.issuancePipelineExecutionAllowed,
    issuancePipelineExecutable: d.issuancePipelineExecutable,
    issuancePipelineState: d.issuancePipelineState,
    issuanceTransactionState: d.issuanceTransactionState,
    workspaceVisible: d.workspaceVisible,
    runtimeCapabilityPresent: d.runtimeCapabilityPresent,
    owner: d.owner,
    writer: d.writer,
    renderer: d.renderer,
    renderActivation: d.renderActivation,
    geoFeedAuthorityTransferred: d.geoFeedAuthorityTransferred,
    feedOnAuthorized: d.feedOnAuthorized,
    productionPromotionAuthorized: d.productionPromotionAuthorized,
    mountCount: d.mountCount,
    geoFeedRenderCount: d.geoFeedRenderCount,
    unmountCount: d.unmountCount,
  });
}

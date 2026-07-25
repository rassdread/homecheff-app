/**
 * Phase 3B.3.23 — Controlled Host Activation Transition Authorization Grant Issuance Pipeline Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary,
} from "./controlled-host-activation-transition-authorization-grant-issuance-commit-boundary";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_REQUIREMENTS = [
  "exactly-one-registered-host",
  "stable-runtime-id",
  "preserve-react-identity",
  "owner-legacy",
  "writer-legacy",
  "renderer-legacy",
  "host-activation-false",
  "render-activation-false",
  "can-start-activation-false",
  "transaction-committed-false",
  "protocol-executed-false",
  "transition-executed-false",
  "graph-traversal-executed-false",
  "selection-executed-false",
  "preflight-executed-false",
  "authorization-decision-executed-false",
  "grant-readiness-executed-false",
  "issuance-commit-boundary-executed-false",
  "authorization-granted-false",
  "authorization-applied-false",
  "transition-authorized-false",
  "grant-issued-false",
  "grant-created-false",
  "grant-materialized-false",
  "grant-persisted-false",
  "grant-applied-false",
  "grant-activated-false",
  "grant-consumed-false",
  "grant-revoked-false",
  "grant-authority-unavailable",
  "grant-authority-disabled",
  "grant-authority-not-delegated",
  "grant-authority-not-transferred",
  "current-state-commit-ready",
  "current-node-commit-ready",
  "selected-transition-commit-ready-to-active",
  "preflight-ready-not-authorized",
  "selection-completed-not-executable",
  "transition-graph-complete-not-executable",
  "state-machine-complete-not-executable",
  "authorization-decision-eligible-not-granted",
  "grant-readiness-ready-not-issued",
  "activation-transition-authorization-grant-issuance-commit-boundary-metadata-only",
  "activation-transition-authorization-grant-issuance-commit-boundary-diagnostics-readable",
  "deterministic-pure-issuance-commit-boundary-engine",
  "issuance-commit-boundary-only-no-executor-no-scheduler",
  "authorization-grant-not-authorized",
  "authorization-application-not-authorized",
  "transition-authorization-not-granted",
  "transition-execution-not-authorized",
  "preflight-execution-not-authorized",
  "graph-traversal-not-authorized",
  "selection-execution-not-authorized",
  "commit-not-authorized",
  "ownership-transfer-not-authorized",
  "writer-transfer-not-authorized",
  "renderer-transfer-not-authorized",
  "grant-creation-not-authorized",
  "grant-issuance-not-authorized",
  "grant-materialization-not-authorized",
  "grant-persistence-not-authorized",
  "grant-application-not-authorized",
  "grant-activation-not-authorized",
  "grant-consumption-not-authorized",
  "grant-revocation-not-authorized",
  "authority-creation-not-authorized",
  "authority-enablement-not-authorized",
  "authority-delegation-not-authorized",
  "authority-transfer-not-authorized",
  "token-not-present",
  "secret-not-present",
  "signature-not-present",
  "nonce-not-present",
  "credential-not-present",
  "certificate-not-present",
  "permit-not-present",
  "callback-not-present",
  "executable-handle-not-present",
  "runtime-capability-not-present",
  "runtime-mutation-not-authorized",
  "dom-mutation-not-authorized",
  "react-remount-not-authorized",
  "second-geofeed-not-authorized",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_REQUIREMENTS)[number];

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryContract =
  {
    schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_SCHEMA_VERSION;
    phase: "3B.3.23";
    widgetId: "feed.discovery";
    hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
    runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
    issuanceCommitBoundaryState: "completed";
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
    issuanceCommitBoundaryCompleted: true;
    issuanceCommitBoundaryExecuted: false;
    issuanceCommitBoundaryReady: true;
    issuanceCommitBoundaryBlocked: true;
    issuanceCommitBoundaryExecutable: false;
    wouldEnterIssuanceCommitBoundary: true;
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
    grantExecutionAllowed: false;
    grantCreationAllowed: false;
    grantIssuanceAllowed: false;
    grantMaterializationAllowed: false;
    grantPersistenceAllowed: false;
    grantApplicationAllowed: false;
    grantActivationAllowed: false;
    grantConsumptionAllowed: false;
    grantRevocationAllowed: false;
    grantAuthorityAvailable: false;
    grantAuthorityEnabled: false;
    grantAuthorityDelegated: false;
    grantAuthorityTransferred: false;
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
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightCompleted: true;
    preflightReady: true;
    preflightBlocked: true;
    preflightExecuted: false;
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    selectedTransition: "COMMIT_READY->ACTIVE";
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    selectionResult: "transition-selected-not-executable";
    selectionCompleted: true;
    selectionExecuted: false;
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
    issuanceCommitBoundaryRequirements: readonly ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryRequirement[];
    identityGuarantee: "preserve-existing-react-identity";
    ownershipGuarantee: "legacy-owner-writer-renderer";
    rendererGuarantee: "no-workspace-renderer";
    writerGuarantee: "legacy-writer-unchanged";
    rollbackGuarantee: "prepared-not-active-legacy-fallback";
    activationRestriction: typeof PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    remountAllowed: false;
    secondMountAllowed: false;
    wrapperAllowed: false;
    portalAllowed: false;
    executorAllowed: false;
    schedulerAllowed: false;
    runtimeMutationAllowed: false;
    commitAllowed: false;
    graphTraversalAllowed: false;
    transitionExecutionAllowed: false;
    selectionExecutionAllowed: false;
    preflightExecutionAllowed: false;
    authorizationDecisionExecutionAllowed: false;
    authorizationGrantAllowed: false;
    authorizationApplicationAllowed: false;
    transitionAuthorizationAllowed: false;
    grantReadinessExecutionAllowed: false;
    issuanceCommitBoundaryExecutionAllowed: false;
    protocolExecutionAllowed: false;
    ownershipTransferAllowed: false;
    writerTransferAllowed: false;
    rendererTransferAllowed: false;
    domMutationAllowed: false;
    reactRemountAllowed: false;
    secondGeofeedAllowed: false;
    requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
    nextEligibleStep: "3B.3.24";
  };

export function createControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryContract(): ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryContract {
  void evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary();
  return validateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryContract(
    {
      schemaVersion:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_SCHEMA_VERSION,
      phase: "3B.3.23",
      widgetId: "feed.discovery",
      hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
      runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
      issuanceCommitBoundaryState: "completed",
      issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered",
      issuanceCommitBoundaryCompleted: true,
      issuanceCommitBoundaryExecuted: false,
      issuanceCommitBoundaryReady: true,
      issuanceCommitBoundaryBlocked: true,
      issuanceCommitBoundaryExecutable: false,
      wouldEnterIssuanceCommitBoundary: true,
      issuanceEligible: true,
      issuanceBlocked: true,
      wouldIssueGrant: true,
      grantIssued: false,
      grantCreated: false,
      grantMaterialized: false,
      grantPersisted: false,
      grantApplied: false,
      grantActivated: false,
      grantConsumed: false,
      grantRevoked: false,
      grantExecutionAllowed: false,
      grantCreationAllowed: false,
      grantIssuanceAllowed: false,
      grantMaterializationAllowed: false,
      grantPersistenceAllowed: false,
      grantApplicationAllowed: false,
      grantActivationAllowed: false,
      grantConsumptionAllowed: false,
      grantRevocationAllowed: false,
      grantAuthorityAvailable: false,
      grantAuthorityEnabled: false,
      grantAuthorityDelegated: false,
      grantAuthorityTransferred: false,
      grantReadinessResult: "authorization-grant-ready-not-issued",
      grantReadinessCompleted: true,
      grantReadinessExecuted: false,
      grantReady: true,
      grantBlocked: true,
      authorizationDecisionResult: "authorization-eligible-not-granted",
      authorizationDecisionCompleted: true,
      authorizationDecisionExecuted: false,
      authorizationEligible: true,
      authorizationBlocked: true,
      wouldAuthorize: true,
      authorizationGranted: false,
      authorizationApplied: false,
      authorizationExecutionAllowed: false,
      transitionAuthorized: false,
      preflightResult: "transition-preflight-ready-not-authorized",
      preflightCompleted: true,
      preflightReady: true,
      preflightBlocked: true,
      preflightExecuted: false,
      currentState: "COMMIT_READY",
      currentNode: "COMMIT_READY",
      selectedTransition: "COMMIT_READY->ACTIVE",
      selectedFromState: "COMMIT_READY",
      selectedToState: "ACTIVE",
      selectionResult: "transition-selected-not-executable",
      selectionCompleted: true,
      selectionExecuted: false,
      transitionExecuted: false,
      graphTraversalExecuted: false,
      protocolExecuted: false,
      transactionCommitted: false,
      wouldCommit: true,
      commitReady: true,
      graphResult: "transition-graph-complete-not-executable",
      machineResult: "state-machine-complete-not-executable",
      protocolResult: "protocol-complete-not-executable",
      decisionResult: "ALLOW",
      planResult: "plan-complete-not-executable",
      pipelineResult: "pipeline-complete-not-executable",
      wouldActivate: true,
      issuanceCommitBoundaryRequirements: [
        ...CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_REQUIREMENTS,
      ],
      identityGuarantee: "preserve-existing-react-identity",
      ownershipGuarantee: "legacy-owner-writer-renderer",
      rendererGuarantee: "no-workspace-renderer",
      writerGuarantee: "legacy-writer-unchanged",
      rollbackGuarantee: "prepared-not-active-legacy-fallback",
      activationRestriction:
        PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
      hostActivation: false,
      renderActivation: false,
      canStartActivation: false,
      remountAllowed: false,
      secondMountAllowed: false,
      wrapperAllowed: false,
      portalAllowed: false,
      executorAllowed: false,
      schedulerAllowed: false,
      runtimeMutationAllowed: false,
      commitAllowed: false,
      graphTraversalAllowed: false,
      transitionExecutionAllowed: false,
      selectionExecutionAllowed: false,
      preflightExecutionAllowed: false,
      authorizationDecisionExecutionAllowed: false,
      authorizationGrantAllowed: false,
      authorizationApplicationAllowed: false,
      transitionAuthorizationAllowed: false,
      grantReadinessExecutionAllowed: false,
      issuanceCommitBoundaryExecutionAllowed: false,
      protocolExecutionAllowed: false,
      ownershipTransferAllowed: false,
      writerTransferAllowed: false,
      rendererTransferAllowed: false,
      domMutationAllowed: false,
      reactRemountAllowed: false,
      secondGeofeedAllowed: false,
      requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
      nextEligibleStep: "3B.3.24",
    },
  );
}

export function validateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryContract(
  candidate: unknown,
): ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_INVALID",
      "Grant issuance plan contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_SCHEMA",
      "Unsupported grant issuance plan contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.23" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_PHASE",
      "phase must be 3B.3.22 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.issuanceCommitBoundaryState !== "completed" ||
    c.issuanceCommitBoundaryResult !== "authorization-grant-issuance-commit-boundary-ready-not-entered" ||
    c.issuanceCommitBoundaryCompleted !== true ||
    c.issuanceCommitBoundaryReady !== true ||
    c.issuanceCommitBoundaryBlocked !== true ||
    c.issuanceCommitBoundaryExecutable !== false ||
    c.wouldEnterIssuanceCommitBoundary !== true ||
    c.issuanceEligible !== true ||
    c.issuanceBlocked !== true ||
    c.wouldIssueGrant !== true ||
    c.grantIssued !== false ||
    c.grantCreated !== false ||
    c.grantMaterialized !== false ||
    c.grantPersisted !== false ||
    c.grantApplied !== false ||
    c.grantActivated !== false ||
    c.grantConsumed !== false ||
    c.grantRevoked !== false ||
    c.grantAuthorityAvailable !== false ||
    c.grantAuthorityEnabled !== false ||
    c.grantAuthorityDelegated !== false ||
    c.grantAuthorityTransferred !== false ||
    c.issuanceCommitBoundaryExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_RESULT",
      "issuance plan result/flags mismatch",
    );
  }
  if (
    c.grantReadinessResult !== "authorization-grant-ready-not-issued" ||
    c.grantReadinessCompleted !== true ||
    c.grantReady !== true ||
    c.grantBlocked !== true ||
    c.authorizationDecisionResult !== "authorization-eligible-not-granted" ||
    c.authorizationDecisionCompleted !== true ||
    c.authorizationEligible !== true ||
    c.authorizationBlocked !== true ||
    c.wouldAuthorize !== true ||
    c.authorizationGranted !== false ||
    c.authorizationApplied !== false ||
    c.transitionAuthorized !== false ||
    c.authorizationDecisionExecuted !== false ||
    c.preflightReady !== true ||
    c.preflightResult !== "transition-preflight-ready-not-authorized" ||
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY" ||
    c.selectedTransition !== "COMMIT_READY->ACTIVE"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_LINK",
      "grant readiness/authorization decision/preflight/selection/current mismatch",
    );
  }
  if (
    c.grantCreationAllowed !== false ||
    c.grantIssuanceAllowed !== false ||
    c.grantMaterializationAllowed !== false ||
    c.grantPersistenceAllowed !== false ||
    c.grantApplicationAllowed !== false ||
    c.grantActivationAllowed !== false ||
    c.grantConsumptionAllowed !== false ||
    c.grantRevocationAllowed !== false ||
    c.grantExecutionAllowed !== false ||
    c.grantReadinessExecutionAllowed !== false ||
    c.issuanceCommitBoundaryExecutionAllowed !== false ||
    c.authorizationGrantAllowed !== false ||
    c.authorizationApplicationAllowed !== false ||
    c.transitionAuthorizationAllowed !== false ||
    c.authorizationExecutionAllowed !== false ||
    c.authorizationDecisionExecutionAllowed !== false ||
    c.transitionExecutionAllowed !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_FLAGS",
      "grant/authorization/execution/activation flags must be false",
    );
  }
  if (
    c.activationRestriction !==
    PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_RESTRICTION",
      "activationRestriction must be PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY",
    );
  }
  for (const key of [
    "remountAllowed",
    "secondMountAllowed",
    "wrapperAllowed",
    "portalAllowed",
    "executorAllowed",
    "schedulerAllowed",
    "runtimeMutationAllowed",
    "commitAllowed",
    "graphTraversalAllowed",
    "transitionExecutionAllowed",
    "selectionExecutionAllowed",
    "preflightExecutionAllowed",
    "protocolExecutionAllowed",
    "ownershipTransferAllowed",
    "writerTransferAllowed",
    "rendererTransferAllowed",
    "domMutationAllowed",
    "reactRemountAllowed",
    "secondGeofeedAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  if (c.nextEligibleStep !== "3B.3.24") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.24",
    );
  }
  return c as ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryContract;
}

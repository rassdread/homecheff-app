/**
 * Phase 3B.3.18 readiness / freeze-for-next-step after authorization grant readiness.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract =
  {
    schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_SCHEMA_VERSION;
    phase: "3B.3.18";
    status: "host-activation-transition-authorization-grant-readiness-prepared";
    grantReadinessContract: "valid";
    identityContract: "valid";
    diagnosticsReadable: true;
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
    grantTokenPresent: false;
    grantSecretPresent: false;
    grantSignaturePresent: false;
    grantCallbackPresent: false;
    authorizationDecisionState: "completed";
    authorizationDecisionResult: "authorization-eligible-not-granted";
    authorizationDecisionCompleted: true;
    authorizationDecisionExecuted: false;
    authorizationEligible: true;
    authorizationBlocked: true;
    wouldAuthorize: true;
    authorizationGranted: false;
    authorizationApplied: false;
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
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    graphResult: "transition-graph-complete-not-executable";
    machineResult: "state-machine-complete-not-executable";
    protocolResult: "protocol-complete-not-executable";
    decisionResult: "ALLOW";
    planResult: "plan-complete-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    wouldActivate: true;
    hostActivation: false;
    renderActivation: false;
    canStartActivation: false;
    writer: "legacy";
    owner: "legacy";
    renderer: "legacy";
    rollbackFoundation: "prepared-not-active";
    browserProof: "pass";
    existing20Invariants: "pass";
    nextEligibleStep: "3B.3.19";
    activeHostMigration: false;
    activeRendererMigration: false;
    executorAuthorized: false;
    schedulerAuthorized: false;
    runtimeMutationAuthorized: false;
    commitAuthorized: false;
    graphTraversalAuthorized: false;
    transitionExecutionAuthorized: false;
    selectionExecutionAuthorized: false;
    preflightExecutionAuthorized: false;
    authorizationDecisionExecutionAuthorized: false;
    authorizationGrantAuthorized: false;
    authorizationApplicationAuthorized: false;
    transitionAuthorizationAuthorized: false;
    grantReadinessExecutionAuthorized: false;
    grantCreationAuthorized: false;
    grantIssuanceAuthorized: false;
    grantPersistenceAuthorized: false;
    grantApplicationAuthorized: false;
    grantAuthorityAuthorized: false;
    protocolExecutionAuthorized: false;
    ownershipTransferAuthorized: false;
    writerTransferAuthorized: false;
    rendererTransferAuthorized: false;
    evidenceCommit: string;
    evidenceArtifactPath: string;
  };

export function createFeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
}): FeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract {
  return validateFeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract(
    {
      schemaVersion:
        FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_SCHEMA_VERSION,
      phase: "3B.3.18",
      status:
        "host-activation-transition-authorization-grant-readiness-prepared",
      grantReadinessContract: "valid",
      identityContract: "valid",
      diagnosticsReadable: true,
      grantReadinessState: "completed",
      grantReadinessResult: "authorization-grant-ready-not-issued",
      grantReadinessCompleted: true,
      grantReadinessExecuted: false,
      grantReady: true,
      grantBlocked: true,
      wouldIssueGrant: true,
      grantIssued: false,
      grantCreated: false,
      grantPersisted: false,
      grantApplied: false,
      grantAuthorityAvailable: false,
      grantAuthorityEnabled: false,
      grantTokenPresent: false,
      grantSecretPresent: false,
      grantSignaturePresent: false,
      grantCallbackPresent: false,
      authorizationDecisionState: "completed",
      authorizationDecisionResult: "authorization-eligible-not-granted",
      authorizationDecisionCompleted: true,
      authorizationDecisionExecuted: false,
      authorizationEligible: true,
      authorizationBlocked: true,
      wouldAuthorize: true,
      authorizationGranted: false,
      authorizationApplied: false,
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
      conditionCount: args.conditionCount,
      satisfiedConditionCount: args.satisfiedConditionCount,
      unsatisfiedConditionCount: 0,
      guardCount: args.guardCount,
      satisfiedGuardCount: args.satisfiedGuardCount,
      unsatisfiedGuardCount: 0,
      graphResult: "transition-graph-complete-not-executable",
      machineResult: "state-machine-complete-not-executable",
      protocolResult: "protocol-complete-not-executable",
      decisionResult: "ALLOW",
      planResult: "plan-complete-not-executable",
      pipelineResult: "pipeline-complete-not-executable",
      wouldActivate: true,
      hostActivation: false,
      renderActivation: false,
      canStartActivation: false,
      writer: "legacy",
      owner: "legacy",
      renderer: "legacy",
      rollbackFoundation: "prepared-not-active",
      browserProof: "pass",
      existing20Invariants: "pass",
      nextEligibleStep: "3B.3.19",
      activeHostMigration: false,
      activeRendererMigration: false,
      executorAuthorized: false,
      schedulerAuthorized: false,
      runtimeMutationAuthorized: false,
      commitAuthorized: false,
      graphTraversalAuthorized: false,
      transitionExecutionAuthorized: false,
      selectionExecutionAuthorized: false,
      preflightExecutionAuthorized: false,
      authorizationDecisionExecutionAuthorized: false,
      authorizationGrantAuthorized: false,
      authorizationApplicationAuthorized: false,
      transitionAuthorizationAuthorized: false,
      grantReadinessExecutionAuthorized: false,
      grantCreationAuthorized: false,
      grantIssuanceAuthorized: false,
      grantPersistenceAuthorized: false,
      grantApplicationAuthorized: false,
      grantAuthorityAuthorized: false,
      protocolExecutionAuthorized: false,
      ownershipTransferAuthorized: false,
      writerTransferAuthorized: false,
      rendererTransferAuthorized: false,
      evidenceCommit: args.evidenceCommit,
      evidenceArtifactPath: args.evidenceArtifactPath,
    },
  );
}

export function validateFeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract(
  candidate: unknown,
): FeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.18" ||
    c.status !==
      "host-activation-transition-authorization-grant-readiness-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.18",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.transactionCommitted !== false ||
    c.protocolExecuted !== false ||
    c.transitionExecuted !== false ||
    c.graphTraversalExecuted !== false ||
    c.selectionExecuted !== false ||
    c.preflightExecuted !== false ||
    c.authorizationDecisionExecuted !== false ||
    c.grantReadinessExecuted !== false ||
    c.authorizationGranted !== false ||
    c.authorizationApplied !== false ||
    c.transitionAuthorized !== false ||
    c.grantIssued !== false ||
    c.grantCreated !== false ||
    c.grantPersisted !== false ||
    c.grantApplied !== false ||
    c.grantAuthorityAvailable !== false ||
    c.grantAuthorityEnabled !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_ACTIVATION",
      "activation/grant/authorization/execution flags must be false",
    );
  }
  if (
    c.grantTokenPresent !== false ||
    c.grantSecretPresent !== false ||
    c.grantSignaturePresent !== false ||
    c.grantCallbackPresent !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_TOKEN",
      "grant token/secret/signature/callback must be absent",
    );
  }
  if (
    c.grantReadinessState !== "completed" ||
    c.grantReadinessResult !== "authorization-grant-ready-not-issued" ||
    c.grantReady !== true ||
    c.grantBlocked !== true ||
    c.wouldIssueGrant !== true ||
    c.authorizationDecisionState !== "completed" ||
    c.authorizationDecisionResult !== "authorization-eligible-not-granted" ||
    c.authorizationEligible !== true ||
    c.authorizationBlocked !== true ||
    c.wouldAuthorize !== true ||
    c.preflightReady !== true ||
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY" ||
    c.selectedTransition !== "COMMIT_READY->ACTIVE"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_RESULT",
      "grant readiness/authorization decision/preflight/selection/current mismatch",
    );
  }
  if (
    typeof c.conditionCount !== "number" ||
    c.conditionCount < 1 ||
    typeof c.satisfiedConditionCount !== "number" ||
    c.satisfiedConditionCount < 1 ||
    c.unsatisfiedConditionCount !== 0 ||
    typeof c.guardCount !== "number" ||
    c.guardCount < 1 ||
    typeof c.satisfiedGuardCount !== "number" ||
    c.satisfiedGuardCount < 1 ||
    c.unsatisfiedGuardCount !== 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_COUNTS",
      "condition/guard counts must be valid",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.19") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.19",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false ||
    c.commitAuthorized !== false ||
    c.graphTraversalAuthorized !== false ||
    c.transitionExecutionAuthorized !== false ||
    c.selectionExecutionAuthorized !== false ||
    c.preflightExecutionAuthorized !== false ||
    c.authorizationDecisionExecutionAuthorized !== false ||
    c.authorizationGrantAuthorized !== false ||
    c.authorizationApplicationAuthorized !== false ||
    c.transitionAuthorizationAuthorized !== false ||
    c.grantReadinessExecutionAuthorized !== false ||
    c.grantCreationAuthorized !== false ||
    c.grantIssuanceAuthorized !== false ||
    c.grantPersistenceAuthorized !== false ||
    c.grantApplicationAuthorized !== false ||
    c.grantAuthorityAuthorized !== false ||
    c.protocolExecutionAuthorized !== false ||
    c.ownershipTransferAuthorized !== false ||
    c.writerTransferAuthorized !== false ||
    c.rendererTransferAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_MIGRATION",
      "migration/grant/execution must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract;
}

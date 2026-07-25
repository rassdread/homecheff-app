/**
 * Phase 3B.3.22 readiness / freeze-for-next-step after authorization grant issuance transaction.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract =
  {
    schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_SCHEMA_VERSION;
    phase: "3B.3.22";
    status: "host-activation-transition-authorization-grant-issuance-transaction-prepared";
    issuanceTransactionContract: "valid";
    identityContract: "valid";
    diagnosticsReadable: true;
    issuanceTransactionState: "NOT_OPENED";
    issuanceTransactionLifecycleState: "completed";
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
    issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable";
    issuancePipelineCompleted: true;
    issuancePipelineReady: true;
    issuancePipelineBlocked: true;
    issuancePipelineExecutable: false;
    wouldExecuteIssuancePipeline: true;
    issuanceTransactionCompleted: true;
    issuanceTransactionExecuted: false;
    issuanceTransactionReady: true;
    issuanceTransactionBlocked: true;
    issuanceTransactionExecutable: false;
    issuanceTransactionOpened: false;
    issuanceTransactionPrepared: false;
    issuanceTransactionCommitted: false;
    issuanceTransactionAborted: false;
    issuanceTransactionRolledBack: false;
    issuanceTransactionCompensated: false;
    wouldOpenIssuanceTransaction: true;
    
    issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable";
    issuancePlanCompleted: true;
    issuancePlanExecuted: false;
    issuancePlanReady: true;
    issuancePlanBlocked: true;
    issuancePlanExecutable: false;
    wouldExecuteIssuancePlan: true;
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
    grantReadinessState: "completed";
    grantReadinessResult: "authorization-grant-ready-not-issued";
    grantReadinessCompleted: true;
    grantReadinessExecuted: false;
    grantReady: true;
    grantBlocked: true;
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
    nextEligibleStep: "3B.3.23";
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
    issuanceTransactionExecutionAuthorized: false;
    issuancePlanExecutionAuthorized: false;
    grantCreationAuthorized: false;
    grantIssuanceAuthorized: false;
    grantMaterializationAuthorized: false;
    grantPersistenceAuthorized: false;
    grantApplicationAuthorized: false;
    grantActivationAuthorized: false;
    grantConsumptionAuthorized: false;
    grantRevocationAuthorized: false;
    grantAuthorityAuthorized: false;
    authorityCreationAuthorized: false;
    authorityEnablementAuthorized: false;
    authorityDelegationAuthorized: false;
    authorityTransferAuthorized: false;
    protocolExecutionAuthorized: false;
    ownershipTransferAuthorized: false;
    writerTransferAuthorized: false;
    rendererTransferAuthorized: false;
    domMutationAuthorized: false;
    reactRemountAuthorized: false;
    secondGeofeedAuthorized: false;
    evidenceCommit: string;
    evidenceArtifactPath: string;
  };

export function createFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
}): FeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract {
  return validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract(
    {
      schemaVersion:
        FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_SCHEMA_VERSION,
      phase: "3B.3.22",
      status:
        "host-activation-transition-authorization-grant-issuance-transaction-prepared",
      issuanceTransactionContract: "valid",
      identityContract: "valid",
      diagnosticsReadable: true,
      issuanceTransactionState: "NOT_OPENED",
      issuanceTransactionLifecycleState: "completed",
      issuanceTransactionOpened: false,
      issuanceTransactionPrepared: false,
      issuanceTransactionCommitted: false,
      issuanceTransactionAborted: false,
      issuanceTransactionRolledBack: false,
      issuanceTransactionCompensated: false,
      issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened",
      issuanceTransactionCompleted: true,
      issuanceTransactionExecuted: false,
      issuanceTransactionReady: true,
      issuanceTransactionBlocked: true,
      issuanceTransactionExecutable: false,
      wouldOpenIssuanceTransaction: true,
      issuancePipelineResult: "authorization-grant-issuance-pipeline-ready-not-executable",
      issuancePipelineCompleted: true,
      issuancePipelineReady: true,
      issuancePipelineBlocked: true,
      issuancePipelineExecutable: false,
      wouldExecuteIssuancePipeline: true,
      issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable",
      issuancePlanCompleted: true,
      issuancePlanExecuted: false,
      issuancePlanReady: true,
      issuancePlanBlocked: true,
      issuancePlanExecutable: false,
      wouldExecuteIssuancePlan: true,
      issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued",
      issuanceDecisionCompleted: true,
      issuanceDecisionExecuted: false,
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
      grantAuthorityAvailable: false,
      grantAuthorityEnabled: false,
      grantAuthorityDelegated: false,
      grantAuthorityTransferred: false,
      tokenPresent: false,
      secretPresent: false,
      signaturePresent: false,
      noncePresent: false,
      credentialPresent: false,
      certificatePresent: false,
      permitPresent: false,
      callbackPresent: false,
      executableHandlePresent: false,
      runtimeCapabilityPresent: false,
      grantReadinessState: "completed",
      grantReadinessResult: "authorization-grant-ready-not-issued",
      grantReadinessCompleted: true,
      grantReadinessExecuted: false,
      grantReady: true,
      grantBlocked: true,
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
      nextEligibleStep: "3B.3.23",
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
      issuanceTransactionExecutionAuthorized: false,
      issuancePlanExecutionAuthorized: false,
      grantCreationAuthorized: false,
      grantIssuanceAuthorized: false,
      grantMaterializationAuthorized: false,
      grantPersistenceAuthorized: false,
      grantApplicationAuthorized: false,
      grantActivationAuthorized: false,
      grantConsumptionAuthorized: false,
      grantRevocationAuthorized: false,
      grantAuthorityAuthorized: false,
      authorityCreationAuthorized: false,
      authorityEnablementAuthorized: false,
      authorityDelegationAuthorized: false,
      authorityTransferAuthorized: false,
      protocolExecutionAuthorized: false,
      ownershipTransferAuthorized: false,
      writerTransferAuthorized: false,
      rendererTransferAuthorized: false,
      domMutationAuthorized: false,
      reactRemountAuthorized: false,
      secondGeofeedAuthorized: false,
      evidenceCommit: args.evidenceCommit,
      evidenceArtifactPath: args.evidenceArtifactPath,
    },
  );
}

export function validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract(
  candidate: unknown,
): FeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.22" ||
    c.status !==
      "host-activation-transition-authorization-grant-issuance-transaction-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.22",
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
    c.issuanceTransactionExecuted !== false ||
    c.authorizationGranted !== false ||
    c.authorizationApplied !== false ||
    c.transitionAuthorized !== false ||
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
    c.grantAuthorityTransferred !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_ACTIVATION",
      "activation/grant/authorization/execution flags must be false",
    );
  }
  if (
    c.tokenPresent !== false ||
    c.secretPresent !== false ||
    c.signaturePresent !== false ||
    c.noncePresent !== false ||
    c.credentialPresent !== false ||
    c.certificatePresent !== false ||
    c.permitPresent !== false ||
    c.callbackPresent !== false ||
    c.executableHandlePresent !== false ||
    c.runtimeCapabilityPresent !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_TOKEN",
      "token/secret/signature/nonce/credential/certificate/permit/callback/executable-handle/runtime-capability must be absent",
    );
  }
  if (
    c.grantReadinessState !== "completed" ||
    c.grantReadinessResult !== "authorization-grant-ready-not-issued" ||
    c.grantReady !== true ||
    c.grantBlocked !== true ||
    c.issuanceTransactionState !== "NOT_OPENED" ||
    c.issuanceTransactionResult !== "authorization-grant-issuance-transaction-ready-not-opened" ||
    c.issuanceTransactionReady !== true ||
    c.issuanceTransactionBlocked !== true ||
    c.issuanceTransactionExecutable !== false ||
    c.wouldOpenIssuanceTransaction !== true ||
    c.issuancePlanResult !== "authorization-grant-issuance-plan-ready-not-executable" ||
    c.issuancePlanReady !== true ||
    c.issuancePlanBlocked !== true ||
    c.issuancePlanExecutable !== false ||
    c.wouldExecuteIssuancePlan !== true ||
    c.issuanceDecisionResult !== "authorization-grant-issuance-eligible-not-issued" ||
    c.issuanceDecisionCompleted !== true ||
    c.issuanceDecisionExecuted !== false ||
    c.issuanceEligible !== true ||
    c.issuanceBlocked !== true ||
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
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_RESULT",
      "issuance plan/grant readiness/authorization decision/preflight/selection/current mismatch",
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
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_COUNTS",
      "condition/guard counts must be valid",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.23") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.23",
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
    c.issuanceTransactionExecutionAuthorized !== false ||
    c.grantCreationAuthorized !== false ||
    c.grantIssuanceAuthorized !== false ||
    c.grantMaterializationAuthorized !== false ||
    c.grantPersistenceAuthorized !== false ||
    c.grantApplicationAuthorized !== false ||
    c.grantActivationAuthorized !== false ||
    c.grantConsumptionAuthorized !== false ||
    c.grantRevocationAuthorized !== false ||
    c.grantAuthorityAuthorized !== false ||
    c.authorityCreationAuthorized !== false ||
    c.authorityEnablementAuthorized !== false ||
    c.authorityDelegationAuthorized !== false ||
    c.authorityTransferAuthorized !== false ||
    c.protocolExecutionAuthorized !== false ||
    c.ownershipTransferAuthorized !== false ||
    c.writerTransferAuthorized !== false ||
    c.rendererTransferAuthorized !== false ||
    c.domMutationAuthorized !== false ||
    c.reactRemountAuthorized !== false ||
    c.secondGeofeedAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_MIGRATION",
      "migration/grant/authority/execution must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract;
}

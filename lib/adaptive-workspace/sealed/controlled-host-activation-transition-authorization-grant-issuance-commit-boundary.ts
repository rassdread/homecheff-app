/**
 * Phase 3B.3.23 — Controlled Host Activation Transition Authorization Grant
 * Issuance Commit Boundary (metadata only). Deterministic descriptive commit
 * boundary wrapping the frozen Phase 3B.3.22 issuance transaction. Never enters,
 * arms, prepares, crosses, or commits the boundary. Never opens the issuance
 * transaction. Never issues grants. Never enables authority. Distinct from the
 * activation-transaction and issuance-transaction identities.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
} from "./controlled-host-activation-transition-authorization-decision";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID,
  CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
} from "./controlled-host-activation-transition-authorization-grant-readiness";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
} from "./controlled-host-activation-transition-authorization-grant-issuance-decision";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY,
} from "./controlled-host-activation-transition-authorization-grant-issuance-plan";
import {
  PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ID,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_CONTRACT_ID,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_POLICY,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_PARTICIPANTS,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceTransaction,
} from "./controlled-host-activation-transition-authorization-grant-issuance-transaction";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID,
} from "./controlled-host-activation-transition-preflight";
import {
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
} from "./controlled-host-activation-transition-selection";
import { CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID } from "./controlled-host-activation-transition-graph";
import { CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID } from "./controlled-host-activation-state-machine";
import { CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID } from "./controlled-host-activation-commit-protocol";
import { CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID } from "./controlled-host-activation-transaction";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY =
  "PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ID =
  "feed.discovery.controlled-host.activation-transition-authorization-grant-issuance-commit-boundary.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_ID =
  "feed.discovery.controlled-host.activation-transition-authorization-grant-issuance-commit-boundary.contract.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY =
  "sealed-authorization-grant-issuance-commit-boundary-policy" as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY_VERSION = 1 as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_STRATEGY =
  "issuance-transaction-ready-then-sealed-issuance-commit-boundary" as const;

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryLifecycleState =
  "completed";

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryBoundaryState =
  "NOT_ENTERED";

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryResult =
  | "authorization-grant-issuance-commit-boundary-ready-not-entered" | "authorization-grant-issuance-commit-boundary-blocked-issuance-pipeline-invalid" | "authorization-grant-issuance-commit-boundary-blocked-issuance-plan-invalid" | "authorization-grant-issuance-commit-boundary-blocked-issuance-decision-invalid" | "authorization-grant-issuance-commit-boundary-blocked-grant-readiness-invalid" | "authorization-grant-issuance-commit-boundary-blocked-authorization-decision-invalid" | "authorization-grant-issuance-commit-boundary-blocked-preflight-invalid" | "authorization-grant-issuance-commit-boundary-blocked-transition-selection-invalid" | "authorization-grant-issuance-commit-boundary-blocked-state-graph-mismatch" | "authorization-grant-issuance-commit-boundary-blocked-identity-mismatch" | "authorization-grant-issuance-commit-boundary-blocked-transaction-structure-invalid" | "authorization-grant-issuance-commit-boundary-blocked-duplicate-participant-id" | "authorization-grant-issuance-commit-boundary-blocked-invalid-prerequisite" | "authorization-grant-issuance-commit-boundary-blocked-circular-dependency" | "authorization-grant-issuance-commit-boundary-blocked-incomplete-pipeline-coverage" | "authorization-grant-issuance-commit-boundary-blocked-duplicate-pipeline-coverage" | "authorization-grant-issuance-commit-boundary-blocked-unknown-pipeline-stage-reference" | "authorization-grant-issuance-commit-boundary-blocked-pipeline-order-mismatch" | "authorization-grant-issuance-commit-boundary-blocked-executable-participant-present" | "authorization-grant-issuance-commit-boundary-blocked-transaction-opened" | "authorization-grant-issuance-commit-boundary-blocked-transaction-prepared" | "authorization-grant-issuance-commit-boundary-blocked-transaction-committed" | "authorization-grant-issuance-commit-boundary-blocked-transaction-capability-present" | "authorization-grant-issuance-commit-boundary-blocked-resource-control-present" | "authorization-grant-issuance-commit-boundary-blocked-mutation-state-present" | "authorization-grant-issuance-commit-boundary-blocked-staged-write-present" | "authorization-grant-issuance-commit-boundary-blocked-grant-artifact-present" | "authorization-grant-issuance-commit-boundary-blocked-authority-present" | "authorization-grant-issuance-commit-boundary-blocked-credential-present" | "authorization-grant-issuance-commit-boundary-blocked-executable-path-present" | "authorization-grant-issuance-commit-boundary-blocked-runtime-invariant-mismatch" | "authorization-grant-issuance-commit-boundary-blocked-ownership-invariant-mismatch" | "authorization-grant-issuance-commit-boundary-blocked-invalid-input";

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryParticipant = {
  readonly participantId: string;
  readonly ordinal: number;
  readonly phase: "3B.3.23";
  readonly title: string;
  readonly purpose: string;
  readonly category: string;
  readonly inputTransactionParticipantIds: readonly string[];
  readonly prerequisiteParticipantIds: readonly string[];
  readonly expectedInputMetadataKeys: readonly string[];
  readonly expectedOutputMetadataKeys: readonly string[];
  readonly validationConditionIds: readonly string[];
  readonly guardIds: readonly string[];
  readonly blockerIds: readonly string[];
  readonly blocked: true;
  readonly executable: false;
  readonly executionAllowed: false;
  readonly enlisted: false;
  readonly invoked: false;
  readonly prepared: false;
  readonly committed: false;
  readonly aborted: false;
  readonly rolledBack: false;
  readonly compensated: false;
  readonly completed: false;
  readonly status: "commit-boundary-participant-blocked-not-executable";
  readonly diagnostics: {
    readonly descriptiveOnly: true;
    readonly executionForbidden: true;
    readonly note: string;
  };
};

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS: readonly ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryParticipant[] = Object.freeze([
  Object.freeze({
    participantId: "frozen-predecessor-validation-participant",
    ordinal: 1,
    phase: "3B.3.23" as const,
    title: "Frozen predecessor validation participant",
    purpose: "Covers validation of Phase 3B.3.20 completion and freeze state.",
    category: "predecessor-validation",
    inputTransactionParticipantIds: Object.freeze(["frozen-predecessor-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze([]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers validation of Phase 3B.3.20 completion and freeze state.",
    }),
  }),
  Object.freeze({
    participantId: "issuance-plan-intake-participant",
    ordinal: 2,
    phase: "3B.3.23" as const,
    title: "Issuance-plan intake participant",
    purpose: "Covers plan identity, contract identity, policy identity and plan readiness.",
    category: "plan-intake",
    inputTransactionParticipantIds: Object.freeze(["issuance-plan-intake-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["frozen-predecessor-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers plan identity, contract identity, policy identity and plan readiness.",
    }),
  }),
  Object.freeze({
    participantId: "plan-structure-validation-participant",
    ordinal: 3,
    phase: "3B.3.23" as const,
    title: "Plan-structure validation participant",
    purpose: "Covers step count, contiguous ordinals, unique IDs and valid prerequisites.",
    category: "plan-structure",
    inputTransactionParticipantIds: Object.freeze(["plan-structure-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["issuance-plan-intake-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers step count, contiguous ordinals, unique IDs and valid prerequisites.",
    }),
  }),
  Object.freeze({
    participantId: "plan-dependency-validation-participant",
    ordinal: 4,
    phase: "3B.3.23" as const,
    title: "Plan-dependency validation participant",
    purpose: "Covers acyclicity and stable prerequisite graph.",
    category: "plan-dependency",
    inputTransactionParticipantIds: Object.freeze(["plan-dependency-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["plan-structure-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers acyclicity and stable prerequisite graph.",
    }),
  }),
  Object.freeze({
    participantId: "issuance-decision-validation-participant",
    ordinal: 5,
    phase: "3B.3.23" as const,
    title: "Issuance-decision validation participant",
    purpose: "Covers eligibility, blocked state and exact decision result.",
    category: "issuance-decision",
    inputTransactionParticipantIds: Object.freeze(["issuance-decision-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["plan-dependency-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers eligibility, blocked state and exact decision result.",
    }),
  }),
  Object.freeze({
    participantId: "grant-readiness-validation-participant",
    ordinal: 6,
    phase: "3B.3.23" as const,
    title: "Grant-readiness validation participant",
    purpose: "Covers grant-ready but not-issued metadata.",
    category: "grant-readiness",
    inputTransactionParticipantIds: Object.freeze(["grant-readiness-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["issuance-decision-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers grant-ready but not-issued metadata.",
    }),
  }),
  Object.freeze({
    participantId: "authorization-validation-participant",
    ordinal: 7,
    phase: "3B.3.23" as const,
    title: "Authorization validation participant",
    purpose: "Covers authorization eligibility while authorization remains ungranted and unapplied.",
    category: "authorization",
    inputTransactionParticipantIds: Object.freeze(["authorization-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["grant-readiness-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers authorization eligibility while authorization remains ungranted and unapplied.",
    }),
  }),
  Object.freeze({
    participantId: "preflight-validation-participant",
    ordinal: 8,
    phase: "3B.3.23" as const,
    title: "Preflight validation participant",
    purpose: "Covers preflight-ready while transition remains unauthorized.",
    category: "preflight",
    inputTransactionParticipantIds: Object.freeze(["preflight-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["authorization-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers preflight-ready while transition remains unauthorized.",
    }),
  }),
  Object.freeze({
    participantId: "transition-selection-validation-participant",
    ordinal: 9,
    phase: "3B.3.23" as const,
    title: "Transition-selection validation participant",
    purpose: "Covers COMMIT_READY->ACTIVE metadata.",
    category: "selection",
    inputTransactionParticipantIds: Object.freeze(["transition-selection-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["preflight-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers COMMIT_READY->ACTIVE metadata.",
    }),
  }),
  Object.freeze({
    participantId: "state-and-graph-validation-participant",
    ordinal: 10,
    phase: "3B.3.23" as const,
    title: "State-and-graph validation participant",
    purpose: "Covers current state and graph node remaining COMMIT_READY.",
    category: "state-graph",
    inputTransactionParticipantIds: Object.freeze(["state-and-graph-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["transition-selection-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers current state and graph node remaining COMMIT_READY.",
    }),
  }),
  Object.freeze({
    participantId: "commit-boundary-validation-participant",
    ordinal: 11,
    phase: "3B.3.23" as const,
    title: "Commit-boundary validation participant",
    purpose: "Covers protocol, transaction, commit and rollback remaining unexecuted.",
    category: "commit-boundary",
    inputTransactionParticipantIds: Object.freeze(["commit-boundary-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["state-and-graph-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers protocol, transaction, commit and rollback remaining unexecuted.",
    }),
  }),
  Object.freeze({
    participantId: "runtime-identity-validation-participant",
    ordinal: 12,
    phase: "3B.3.23" as const,
    title: "Runtime-identity validation participant",
    purpose: "Covers stable hostId, runtimeId and linked identities.",
    category: "runtime-identity",
    inputTransactionParticipantIds: Object.freeze(["runtime-identity-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["commit-boundary-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers stable hostId, runtimeId and linked identities.",
    }),
  }),
  Object.freeze({
    participantId: "runtime-mount-validation-participant",
    ordinal: 13,
    phase: "3B.3.23" as const,
    title: "Runtime-mount validation participant",
    purpose: "Covers mount=1 and unmount=0.",
    category: "runtime-mount",
    inputTransactionParticipantIds: Object.freeze(["runtime-mount-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["runtime-identity-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers mount=1 and unmount=0.",
    }),
  }),
  Object.freeze({
    participantId: "geofeed-singularity-validation-participant",
    ordinal: 14,
    phase: "3B.3.23" as const,
    title: "Sealed-feed singularity validation participant",
    purpose: "Covers one active sealed feed instance and one renderer.",
    category: "geofeed-singularity",
    inputTransactionParticipantIds: Object.freeze(["geofeed-singularity-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["runtime-mount-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers one active sealed feed instance and one renderer.",
    }),
  }),
  Object.freeze({
    participantId: "workspace-shell-validation-participant",
    ordinal: 15,
    phase: "3B.3.23" as const,
    title: "Workspace-shell validation participant",
    purpose: "Covers null shell, zero children and zero DOM nodes.",
    category: "workspace-shell",
    inputTransactionParticipantIds: Object.freeze(["workspace-shell-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["geofeed-singularity-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers null shell, zero children and zero DOM nodes.",
    }),
  }),
  Object.freeze({
    participantId: "legacy-ownership-validation-participant",
    ordinal: 16,
    phase: "3B.3.23" as const,
    title: "Legacy-ownership validation participant",
    purpose: "Covers owner, writer and renderer remaining legacy.",
    category: "ownership",
    inputTransactionParticipantIds: Object.freeze(["legacy-ownership-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["workspace-shell-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers owner, writer and renderer remaining legacy.",
    }),
  }),
  Object.freeze({
    participantId: "grant-absence-validation-participant",
    ordinal: 17,
    phase: "3B.3.23" as const,
    title: "Grant-absence validation participant",
    purpose: "Covers the complete grant lifecycle remaining absent.",
    category: "grant-absence",
    inputTransactionParticipantIds: Object.freeze(["grant-absence-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["legacy-ownership-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers the complete grant lifecycle remaining absent.",
    }),
  }),
  Object.freeze({
    participantId: "authority-absence-validation-participant",
    ordinal: 18,
    phase: "3B.3.23" as const,
    title: "Authority-absence validation participant",
    purpose: "Covers authority/provider/service absence.",
    category: "authority-absence",
    inputTransactionParticipantIds: Object.freeze(["authority-absence-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["grant-absence-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers authority/provider/service absence.",
    }),
  }),
  Object.freeze({
    participantId: "credential-absence-validation-participant",
    ordinal: 19,
    phase: "3B.3.23" as const,
    title: "Credential-absence validation participant",
    purpose: "Covers token, secret, signature, nonce, credential, certificate and permit absence.",
    category: "credential-absence",
    inputTransactionParticipantIds: Object.freeze(["credential-absence-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["authority-absence-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers token, secret, signature, nonce, credential, certificate and permit absence.",
    }),
  }),
  Object.freeze({
    participantId: "executable-path-absence-validation-participant",
    ordinal: 20,
    phase: "3B.3.23" as const,
    title: "Executable-path absence validation participant",
    purpose: "Covers callback, handle, capability, command, dispatcher, queue, scheduler and executor absence.",
    category: "executable-path-absence",
    inputTransactionParticipantIds: Object.freeze(["executable-path-absence-validation-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["credential-absence-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Covers callback, handle, capability, command, dispatcher, queue, scheduler and executor absence.",
    }),
  }),
  Object.freeze({
    participantId: "hypothetical-grant-construction-boundary-participant",
    ordinal: 21,
    phase: "3B.3.23" as const,
    title: "Hypothetical grant-construction boundary participant",
    purpose: "Descriptive only. Grant construction remains forbidden.",
    category: "hypothetical-boundary",
    inputTransactionParticipantIds: Object.freeze(["hypothetical-grant-construction-boundary-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["executable-path-absence-validation-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive only. Grant construction remains forbidden.",
    }),
  }),
  Object.freeze({
    participantId: "hypothetical-grant-issuance-boundary-participant",
    ordinal: 22,
    phase: "3B.3.23" as const,
    title: "Hypothetical grant-issuance boundary participant",
    purpose: "Descriptive only. Grant issuance remains forbidden.",
    category: "hypothetical-boundary",
    inputTransactionParticipantIds: Object.freeze(["hypothetical-grant-issuance-boundary-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["hypothetical-grant-construction-boundary-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive only. Grant issuance remains forbidden.",
    }),
  }),
  Object.freeze({
    participantId: "hypothetical-grant-persistence-boundary-participant",
    ordinal: 23,
    phase: "3B.3.23" as const,
    title: "Hypothetical grant-persistence boundary participant",
    purpose: "Descriptive only. Grant persistence remains forbidden.",
    category: "hypothetical-boundary",
    inputTransactionParticipantIds: Object.freeze(["hypothetical-grant-persistence-boundary-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["hypothetical-grant-issuance-boundary-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive only. Grant persistence remains forbidden.",
    }),
  }),
  Object.freeze({
    participantId: "hypothetical-grant-application-boundary-participant",
    ordinal: 24,
    phase: "3B.3.23" as const,
    title: "Hypothetical grant-application boundary participant",
    purpose: "Descriptive only. Grant application remains forbidden.",
    category: "hypothetical-boundary",
    inputTransactionParticipantIds: Object.freeze(["hypothetical-grant-application-boundary-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["hypothetical-grant-persistence-boundary-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive only. Grant application remains forbidden.",
    }),
  }),
  Object.freeze({
    participantId: "hypothetical-authority-boundary-participant",
    ordinal: 25,
    phase: "3B.3.23" as const,
    title: "Hypothetical authority boundary participant",
    purpose: "Descriptive only. Authority creation, enablement, delegation and transfer remain forbidden.",
    category: "hypothetical-boundary",
    inputTransactionParticipantIds: Object.freeze(["hypothetical-authority-boundary-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["hypothetical-grant-application-boundary-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive only. Authority creation, enablement, delegation and transfer remain forbidden.",
    }),
  }),
  Object.freeze({
    participantId: "hypothetical-transition-authorization-boundary-participant",
    ordinal: 26,
    phase: "3B.3.23" as const,
    title: "Hypothetical transition-authorization boundary participant",
    purpose: "Descriptive only. Transition authorization remains forbidden.",
    category: "hypothetical-boundary",
    inputTransactionParticipantIds: Object.freeze(["hypothetical-transition-authorization-boundary-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["hypothetical-authority-boundary-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive only. Transition authorization remains forbidden.",
    }),
  }),
  Object.freeze({
    participantId: "hypothetical-activation-boundary-participant",
    ordinal: 27,
    phase: "3B.3.23" as const,
    title: "Hypothetical activation boundary participant",
    purpose: "Descriptive only. Activation remains forbidden.",
    category: "hypothetical-boundary",
    inputTransactionParticipantIds: Object.freeze(["hypothetical-activation-boundary-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["hypothetical-transition-authorization-boundary-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive only. Activation remains forbidden.",
    }),
  }),
  Object.freeze({
    participantId: "rollback-description-participant",
    ordinal: 28,
    phase: "3B.3.23" as const,
    title: "Rollback-description participant",
    purpose: "Descriptive rollback metadata only. No rollback command or execution path.",
    category: "rollback-description",
    inputTransactionParticipantIds: Object.freeze(["rollback-description-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["hypothetical-activation-boundary-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive rollback metadata only. No rollback command or execution path.",
    }),
  }),
  Object.freeze({
    participantId: "final-fail-closed-verification-participant",
    ordinal: 29,
    phase: "3B.3.23" as const,
    title: "Final fail-closed verification participant",
    purpose: "Reasserts all blocked, absent and false flags.",
    category: "fail-closed",
    inputTransactionParticipantIds: Object.freeze(["final-fail-closed-verification-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["rollback-description-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Reasserts all blocked, absent and false flags.",
    }),
  }),
  Object.freeze({
    participantId: "transaction-readiness-declaration-participant",
    ordinal: 30,
    phase: "3B.3.23" as const,
    title: "Transaction readiness declaration participant",
    purpose: "Declares metadata pipeline completion only. Final result: authorization-grant-issuance-commit-boundary-ready-not-entered",
    category: "pipeline-completion",
    inputTransactionParticipantIds: Object.freeze(["transaction-readiness-declaration-participant"]) as readonly string[],
    prerequisiteParticipantIds: Object.freeze(["final-fail-closed-verification-participant"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceTransactionResult","issuancePlanResult","issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuanceCommitBoundaryResult","issuanceCommitBoundaryState","blocked","executable","transactionParticipantCoverageExact"]) as readonly string[],
    validationConditionIds: Object.freeze(["issuance-transaction-metadata-only"]) as readonly string[],
    guardIds: Object.freeze(["all-participants-blocked-guard"]) as readonly string[],
    blockerIds: Object.freeze(["PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    enlisted: false as const,
    invoked: false as const,
    prepared: false as const,
    committed: false as const,
    aborted: false as const,
    rolledBack: false as const,
    compensated: false as const,
    completed: false as const,
    status: "commit-boundary-participant-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Declares metadata pipeline completion only. Final result: authorization-grant-issuance-commit-boundary-ready-not-entered",
    }),
  })
]);

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS = [
  "phase-3b322-active", "previous-phase-3b321-complete", "next-eligible-step-3b323", "phase-chain-continuous", "predecessor-frozen", "issuance-transaction-metadata-only", "no-phase-skipping", "issuance-pipeline-completed", "issuance-pipeline-ready", "issuance-pipeline-blocked", "issuance-pipeline-non-executable", "would-execute-issuance-pipeline", "issuance-pipeline-result-exact", "pipeline-stage-count-30", "zero-completed-pipeline-stages", "zero-executable-pipeline-stages", "all-pipeline-stages-blocked", "zero-invalid-pipeline-stages", "pipeline-plan-coverage-exact", "pipeline-plan-order-preserved", "pipeline-graph-acyclic", "pipeline-conditions-satisfied", "pipeline-guards-satisfied", "pipeline-blockers-present", "pipeline-identity-stable", "pipeline-contract-identity-stable", "pipeline-policy-identity-stable", "transaction-identity-stable", "transaction-contract-identity-stable", "transaction-policy-identity-stable", "participant-count-exact", "participant-ordinals-contiguous", "participant-ids-unique", "participant-prerequisites-valid", "participant-graph-acyclic", "final-participant-declares-readiness", "all-participants-blocked", "all-participants-non-executable", "all-participants-unenlisted", "all-participants-uninvoked", "all-participants-unprepared", "all-participants-uncommitted", "all-participants-unaborted", "all-participants-unrolled-back", "all-participants-uncompensated", "all-participants-operationally-incomplete", "source-pipeline-stage-count-30", "covered-pipeline-stage-count-30", "uncovered-pipeline-stage-count-0", "duplicate-covered-pipeline-stage-count-0", "unknown-referenced-pipeline-stage-count-0", "pipeline-coverage-complete", "pipeline-coverage-exact", "pipeline-order-preserved", "transaction-participant-graph-acyclic", "transaction-state-not-opened", "transaction-opened-false", "transaction-prepared-false", "transaction-committed-false", "transaction-aborted-false", "transaction-rolled-back-false", "transaction-compensated-false", "no-transaction-context", "no-transaction-handle", "no-transaction-token", "no-transaction-secret", "no-transaction-signature", "no-transaction-callback", "no-transaction-coordinator", "no-transaction-executor", "no-transaction-scheduler", "no-transaction-dispatcher", "no-transaction-queue", "no-transaction-journal", "no-transaction-lock", "no-resource-reservation", "no-write-set", "no-mutation-set", "no-compensation-action", "no-persistence-boundary", "no-persistence-applied", "no-lock-acquired", "no-resource-reserved", "no-journal-written", "no-mutations-staged", "no-writes-staged", "no-participant-enlisted", "no-participant-invoked", "issuance-plan-completed", "issuance-plan-ready", "issuance-plan-blocked", "issuance-plan-non-executable", "issuance-plan-result-exact", "issuance-decision-completed", "issuance-eligible", "issuance-blocked", "would-issue-grant", "issuance-decision-result-exact", "no-grant-issued", "grant-readiness-completed", "grant-ready", "grant-blocked", "grant-readiness-result-exact", "authorization-decision-completed", "authorization-eligible", "authorization-blocked", "authorization-not-granted", "authorization-not-applied", "transition-not-authorized", "preflight-completed", "preflight-ready", "preflight-blocked", "preflight-result-exact", "selected-transition-exact", "source-state-exact", "target-state-exact", "selection-metadata-only", "selection-not-executed", "current-state-commit-ready", "machine-identity-stable", "transition-not-applied", "state-mutation-absent", "current-graph-node-commit-ready", "graph-identity-stable", "graph-traversal-not-executed", "protocol-not-executed", "activation-transaction-not-committed", "commit-not-executed", "rollback-not-executed", "no-transaction-commit-capability", "no-grant-instance", "no-grant-payload", "no-materialized-grant", "no-issued-grant", "no-persisted-grant", "no-applied-grant", "no-activated-grant", "no-consumed-grant", "no-revoked-grant", "authority-unavailable", "authority-disabled", "authority-undelegated", "authority-untransferred", "no-authority-provider", "no-issuance-service", "no-token", "no-secret", "no-signature", "no-nonce", "no-credential", "no-certificate", "no-permit", "no-callback", "no-executable-handle", "no-runtime-capability", "no-command", "no-dispatcher", "no-queue", "no-scheduler", "no-executor", "no-service", "no-provider", "no-function-valued-metadata", "no-promise-valued-metadata", "host-id-stable", "runtime-id-stable", "mount-count-one", "unmount-count-zero", "one-geofeed", "react-identity-stable", "shell-null", "no-runtime-mutation", "owner-legacy", "writer-legacy", "renderer-legacy", "no-ownership-transfer", "no-writer-transfer", "no-renderer-transfer", "browser-proof-20-available", "phase-3b2-regression-valid", "no-browser-behavior-change", "no-dom-mutation", "no-react-remount", "blocker-metadata-only", "blocker-transaction-open", "blocker-transaction-prepare", "blocker-transaction-commit", "blocker-transaction-abort", "blocker-transaction-rollback", "blocker-compensation", "blocker-transaction-context", "blocker-transaction-handle", "blocker-journal", "blocker-lock", "blocker-reservation", "blocker-write-set", "blocker-mutation-set", "blocker-pipeline-execution", "blocker-grant-creation", "blocker-issuance", "blocker-authority", "blocker-credential", "blocker-callback", "blocker-command", "blocker-dispatcher", "blocker-queue", "blocker-scheduler", "blocker-executor", "blocker-transition", "blocker-activation", "blocker-ownership-transfer", "blocker-runtime-mutation", "blocker-dom-mutation", "blocker-react-remount", "blocker-second-geofeed", "blocker-non-null-shell", "would-open-issuance-transaction", "issuance-transaction-ready", "issuance-transaction-blocked", "issuance-transaction-non-executable", "issuance-transaction-result-exact", "issuance-transaction-completed-metadata-only", "issuance-transaction-execution-impossible", "issuance-pipeline-execution-impossible", "issuance-plan-execution-impossible", "issuance-impossible", "authority-impossible", "execution-impossible"
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS = [
  "predecessor-phase-exact-guard", "next-phase-exact-guard", "contract-version-exact-guard", "issuance-pipeline-result-exact-guard", "pipeline-stage-count-exact-guard", "pipeline-blocked-state-guard", "pipeline-non-executable-guard", "pipeline-exact-coverage-guard", "issuance-plan-exact-guard", "issuance-decision-exact-guard", "grant-readiness-exact-guard", "authorization-exact-guard", "preflight-exact-guard", "selected-transition-exact-guard", "source-state-exact-guard", "target-state-exact-guard", "current-state-exact-guard", "current-graph-node-exact-guard", "stable-identity-chain-guard", "participant-ids-unique-guard", "participant-ordinals-contiguous-guard", "participant-prerequisites-valid-guard", "participant-graph-acyclic-guard", "every-pipeline-stage-covered-guard", "no-pipeline-stage-duplicated-guard", "no-unknown-pipeline-stage-guard", "pipeline-order-preserved-guard", "transaction-state-not-opened-guard", "all-participants-blocked-guard", "all-participants-non-executable-guard", "all-participants-unenlisted-guard", "all-participants-uninvoked-guard", "all-participants-unprepared-guard", "all-participants-uncommitted-guard", "all-participants-unaborted-guard", "all-participants-unrolled-back-guard", "all-participants-uncompensated-guard", "no-transaction-context-guard", "no-transaction-handle-guard", "no-transaction-token-guard", "no-transaction-secret-guard", "no-transaction-callback-guard", "no-coordinator-guard", "no-transaction-executor-guard", "no-transaction-scheduler-guard", "no-transaction-dispatcher-guard", "no-transaction-queue-guard", "no-journal-guard", "no-lock-guard", "no-reservation-guard", "no-write-set-guard", "no-mutation-set-guard", "no-compensation-action-guard", "no-staged-mutation-guard", "no-staged-write-guard", "no-grant-guard", "no-authority-guard", "no-token-guard", "no-secret-guard", "no-signature-guard", "no-callback-guard", "no-executable-handle-guard", "no-runtime-capability-guard", "no-command-guard", "no-dispatcher-guard", "no-queue-guard", "no-scheduler-guard", "no-executor-guard", "no-transition-authorization-guard", "no-transition-execution-guard", "no-activation-guard", "no-commit-guard", "no-rollback-execution-guard", "legacy-owner-guard", "legacy-writer-guard", "legacy-renderer-guard", "mount-count-one-guard", "unmount-count-zero-guard", "one-geofeed-guard", "null-shell-guard", "stable-runtime-id-guard", "stable-host-id-guard", "blocker-completeness-guard"
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_BLOCKERS = [
  "PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY", "PHASE_3B3_23_METADATA_ONLY", "PHASE_3B3_23_ISSUANCE_TRANSACTION_OPEN_FORBIDDEN", "PHASE_3B3_23_ISSUANCE_TRANSACTION_PREPARE_FORBIDDEN", "PHASE_3B3_23_ISSUANCE_TRANSACTION_COMMIT_FORBIDDEN", "PHASE_3B3_23_ISSUANCE_TRANSACTION_ABORT_EXECUTION_FORBIDDEN", "PHASE_3B3_23_ISSUANCE_TRANSACTION_ROLLBACK_EXECUTION_FORBIDDEN", "PHASE_3B3_23_ISSUANCE_TRANSACTION_COMPENSATION_EXECUTION_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_CONTEXT_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_HANDLE_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_TOKEN_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_SECRET_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_SIGNATURE_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_CALLBACK_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_COORDINATOR_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_EXECUTOR_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_SCHEDULER_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_DISPATCHER_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_QUEUE_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_JOURNAL_FORBIDDEN", "PHASE_3B3_23_TRANSACTION_LOCK_FORBIDDEN", "PHASE_3B3_23_RESOURCE_RESERVATION_FORBIDDEN", "PHASE_3B3_23_WRITE_SET_FORBIDDEN", "PHASE_3B3_23_MUTATION_SET_FORBIDDEN", "PHASE_3B3_23_MUTATION_STAGING_FORBIDDEN", "PHASE_3B3_23_WRITE_STAGING_FORBIDDEN", "PHASE_3B3_23_COMPENSATION_ACTION_FORBIDDEN", "PHASE_3B3_23_PERSISTENCE_FORBIDDEN", "PHASE_3B3_23_ISSUANCE_PIPELINE_EXECUTION_FORBIDDEN", "PHASE_3B3_23_ISSUANCE_PLAN_EXECUTION_FORBIDDEN", "PHASE_3B3_23_GRANT_CREATION_FORBIDDEN", "PHASE_3B3_23_GRANT_MATERIALIZATION_FORBIDDEN", "PHASE_3B3_23_GRANT_ISSUANCE_FORBIDDEN", "PHASE_3B3_23_GRANT_PERSISTENCE_FORBIDDEN", "PHASE_3B3_23_GRANT_APPLICATION_FORBIDDEN", "PHASE_3B3_23_GRANT_ACTIVATION_FORBIDDEN", "PHASE_3B3_23_GRANT_CONSUMPTION_FORBIDDEN", "PHASE_3B3_23_GRANT_REVOCATION_EXECUTION_FORBIDDEN", "PHASE_3B3_23_AUTHORITY_CREATION_FORBIDDEN", "PHASE_3B3_23_AUTHORITY_ENABLEMENT_FORBIDDEN", "PHASE_3B3_23_AUTHORITY_DELEGATION_FORBIDDEN", "PHASE_3B3_23_AUTHORITY_TRANSFER_FORBIDDEN", "PHASE_3B3_23_TOKEN_FORBIDDEN", "PHASE_3B3_23_SECRET_FORBIDDEN", "PHASE_3B3_23_SIGNATURE_FORBIDDEN", "PHASE_3B3_23_NONCE_FORBIDDEN", "PHASE_3B3_23_CREDENTIAL_FORBIDDEN", "PHASE_3B3_23_CERTIFICATE_FORBIDDEN", "PHASE_3B3_23_PERMIT_FORBIDDEN", "PHASE_3B3_23_CALLBACK_FORBIDDEN", "PHASE_3B3_23_EXECUTABLE_HANDLE_FORBIDDEN", "PHASE_3B3_23_RUNTIME_CAPABILITY_FORBIDDEN", "PHASE_3B3_23_COMMAND_FORBIDDEN", "PHASE_3B3_23_DISPATCHER_FORBIDDEN", "PHASE_3B3_23_QUEUE_FORBIDDEN", "PHASE_3B3_23_SCHEDULER_FORBIDDEN", "PHASE_3B3_23_EXECUTOR_FORBIDDEN", "PHASE_3B3_23_SERVICE_FORBIDDEN", "PHASE_3B3_23_PROVIDER_FORBIDDEN", "PHASE_3B3_23_TRANSITION_AUTHORIZATION_FORBIDDEN", "PHASE_3B3_23_TRANSITION_EXECUTION_FORBIDDEN", "PHASE_3B3_23_ACTIVATION_FORBIDDEN", "PHASE_3B3_23_COMMIT_FORBIDDEN", "PHASE_3B3_23_ROLLBACK_EXECUTION_FORBIDDEN", "PHASE_3B3_23_OWNERSHIP_TRANSFER_FORBIDDEN", "PHASE_3B3_23_WRITER_TRANSFER_FORBIDDEN", "PHASE_3B3_23_RENDERER_TRANSFER_FORBIDDEN", "PHASE_3B3_23_RUNTIME_MUTATION_FORBIDDEN", "PHASE_3B3_23_REQUEST_MUTATION_FORBIDDEN", "PHASE_3B3_23_CACHE_MUTATION_FORBIDDEN", "PHASE_3B3_23_OBSERVER_MUTATION_FORBIDDEN", "PHASE_3B3_23_DOM_MUTATION_FORBIDDEN", "PHASE_3B3_23_REACT_REMOUNT_FORBIDDEN", "PHASE_3B3_23_SECOND_GEOFEED_FORBIDDEN", "PHASE_3B3_23_NON_NULL_SHELL_FORBIDDEN"
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PRECONDITIONS = [
  "issuance-pipeline-ready-not-executable",
  "issuance-plan-ready-not-executable",
  "issuance-eligible-not-issued",
  "grant-ready-not-issued",
  "authorization-eligible-not-granted",
  "transition-preflight-ready-not-authorized",
  "selected-transition-commit-ready-to-active",
  "current-state-commit-ready",
  "current-graph-node-commit-ready",
  "legacy-owner-writer-renderer",
  "single-mount-stable-runtime",
  "null-workspace-shell",
  "pipeline-coverage-exact",
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_VALIDATION_POINTS = [
  "pre-transaction-issuance-pipeline-ready",
  "pre-transaction-pipeline-coverage-exact",
  "pre-transaction-no-grant",
  "pre-transaction-no-authority",
  "pre-transaction-no-credential",
  "pre-transaction-no-executable-path",
  "pre-transaction-no-transaction-capability",
  "pre-transaction-transition-unauthorized",
  "pre-transaction-activation-impossible",
  "post-transaction-metadata-only",
  "post-transaction-participants-blocked",
  "post-transaction-not-opened",
  "post-transaction-coverage-exact",
  "post-transaction-current-state-unchanged",
  "post-transaction-current-node-unchanged",
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_BOUNDARIES = Object.freeze({
  startBoundary: "describe-only-not-opened",
  prepareBoundary: "describe-only-not-prepared",
  commitBoundary: "describe-only-commit-impossible",
  abortBoundary: "describe-only-abort-impossible",
  rollbackBoundary: "describe-only-rollback-execution-impossible",
  compensationBoundary: "describe-only-compensation-impossible",
  atomicityDescription: "hypothetical-all-or-nothing-without-mutation",
  consistencyDescription: "invariant-preservation-without-runtime-enforcement",
  isolationDescription: "no-ownership-or-writer-transfer-permitted",
  durabilityDescription: "no-persistence-in-this-phase",
  mutationSetBoundary: "describe-only-no-mutation-set",
  writeSetBoundary: "describe-only-no-write-set",
  journalBoundary: "describe-only-no-journal",
  lockBoundary: "describe-only-no-lock",
  reservationBoundary: "describe-only-no-reservation",
  grantBoundary: "no-grant-creation-or-issuance",
  authorityBoundary: "no-authority-creation-or-enablement",
  transitionBoundary: "no-transition-authorization-or-execution",
  activationBoundary: "no-activation",
  runtimeBoundary: "geofeed-legacy-owned-unchanged",
});

function assertTransactionStructure(): void {
  const ids = CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS.map((p) => p.participantId);
  if (new Set(ids).size !== ids.length) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_DUPLICATE_PARTICIPANT",
      "Transaction participant IDs must be unique",
    );
  }
  if (new Set(CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_BLOCKERS).size !== CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_BLOCKERS.length) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_DUPLICATE_BLOCKER",
      "Transaction blockers must be unique",
    );
  }
  const byId = new Map(
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS.map((p) => [p.participantId, p]),
  );
  const sourceStageIds = CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_PARTICIPANTS.map((s) => s.participantId);
  if (sourceStageIds.length !== 30) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_SOURCE_PIPELINE",
      "Source issuance pipeline must contain exactly 30 stages",
    );
  }
  const covered: string[] = [];
  for (let i = 0; i < CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS.length; i += 1) {
    const participant = CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS[i];
    if (participant.ordinal !== i + 1) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ORDINAL",
        `Participant ordinal must be contiguous; expected ${i + 1} got ${participant.ordinal}`,
      );
    }
    if (
      participant.executable !== false ||
      participant.executionAllowed !== false ||
      participant.enlisted !== false ||
      participant.invoked !== false ||
      participant.prepared !== false ||
      participant.committed !== false ||
      participant.aborted !== false ||
      participant.rolledBack !== false ||
      participant.compensated !== false ||
      participant.completed !== false ||
      participant.blocked !== true
    ) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PARTICIPANT_FLAGS",
        `Transaction participant ${participant.participantId} must remain blocked and non-executable`,
      );
    }
    for (const prereq of participant.prerequisiteParticipantIds) {
      if (!byId.has(prereq)) {
        throw new HardContractViolation(
          "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREREQ",
          `Unknown prerequisite ${prereq} for ${participant.participantId}`,
        );
      }
      if (byId.get(prereq)!.ordinal >= participant.ordinal) {
        throw new HardContractViolation(
          "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_CYCLE",
          `Prerequisite ${prereq} must precede ${participant.participantId}`,
        );
      }
    }
    if (participant.inputTransactionParticipantIds.length !== 1) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_COVERAGE_SHAPE",
        `Participant ${participant.participantId} must cover exactly one pipeline stage`,
      );
    }
    const stageId = participant.inputTransactionParticipantIds[0];
    if (stageId !== sourceStageIds[i]) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PIPELINE_ORDER",
        `Participant ${participant.participantId} must cover pipeline stage ${sourceStageIds[i]} in order`,
      );
    }
    covered.push(stageId);
  }
  if (covered.length !== 30 || new Set(covered).size !== 30) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_COVERAGE",
      "Transaction must cover every source pipeline stage exactly once",
    );
  }
  const last =
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS[
      CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS.length - 1
    ];
  if (last.participantId !== "transaction-readiness-declaration-participant") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_FINAL_PARTICIPANT",
      "Final transaction participant must declare transaction readiness",
    );
  }
}

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_SCHEMA_VERSION;
  phase: "3B.3.23";
  previousPhase: "3B.3.22";
  currentPhase: "3B.3.23";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  issuanceCommitBoundaryId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ID;
  issuanceCommitBoundaryContractId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_ID;
  issuanceCommitBoundaryPolicyId: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY;
  issuanceCommitBoundaryVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_VERSION;
  issuanceCommitBoundaryState: ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryBoundaryState;
  issuanceTransactionLifecycleState: ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryLifecycleState;
  issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
  issuanceCommitBoundaryCompleted: true;
  issuanceCommitBoundaryExecuted: false;
  issuanceCommitBoundaryReady: true;
  issuanceCommitBoundaryBlocked: true;
  issuanceCommitBoundaryEntered: false;
  issuanceCommitBoundaryArmed: false;
  boundaryCrossed: false;
  commitBoundaryEntered: false;
  commitBoundaryArmed: false;
  commitRequested: false;
  commitInvoked: false;
  commitStarted: false;
  issuanceCommitBoundaryPrepared: false;
  issuanceCommitBoundaryCommitted: false;
  issuanceCommitBoundaryAborted: false;
  issuanceCommitBoundaryRolledBack: false;
  issuanceCommitBoundaryCompensated: false;
  issuanceCommitBoundaryExecutable: false;
  wouldEnterIssuanceCommitBoundary: true;
  transactionOpened: false;
  transactionPrepared: false;
  transactionCommitted: false;
  transactionAborted: false;
  transactionRolledBack: false;
  transactionCompensated: false;
  transactionParticipants: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS;
  transactionParticipantCount: number;
  completedTransactionParticipantCount: 0;
  executableTransactionParticipantCount: 0;
  blockedTransactionParticipantCount: number;
  invalidTransactionParticipantCount: 0;
  sourceTransactionParticipantCount: 30;
  coveredTransactionParticipantCount: 30;
  uncoveredTransactionParticipantCount: 0;
  duplicateCoveredTransactionParticipantCount: 0;
  unknownReferencedTransactionParticipantCount: 0;
  transactionParticipantCoverageComplete: true;
  transactionParticipantCoverageExact: true;
  transactionParticipantOrderPreserved: true;
  transactionParticipantGraphAcyclic: true;
  issuanceCommitBoundaryConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS;
  satisfiedIssuanceCommitBoundaryConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS;
  unsatisfiedIssuanceCommitBoundaryConditions: readonly [];
  issuanceCommitBoundaryGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS;
  satisfiedIssuanceCommitBoundaryGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS;
  unsatisfiedIssuanceCommitBoundaryGuards: readonly [];
  issuanceCommitBoundaryBlockers: typeof CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_BLOCKERS;
  issuanceCommitBoundaryPreconditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PRECONDITIONS;
  issuanceCommitBoundaryValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_VALIDATION_POINTS;
  issuanceCommitBoundaryBoundaries: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_BOUNDARIES;
  issuanceCommitBoundaryReason: string;
  issuanceCommitBoundaryStrategy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_STRATEGY;
  issuanceCommitBoundaryPolicy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY;
  issuanceCommitBoundaryPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY_VERSION;
  issuanceTransactionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ID;
  issuanceTransactionCompleted: true;
  issuanceTransactionReady: true;
  issuanceTransactionBlocked: true;
  issuanceTransactionExecutable: false;
  wouldOpenIssuanceTransaction: true;
  issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened";
  issuanceTransactionState: "NOT_OPENED";
  issuanceTransactionOpened: false;
  issuanceTransactionPrepared: false;
  issuanceTransactionCommitted: false;
  issuanceTransactionAborted: false;
  issuanceTransactionRolledBack: false;
  issuanceTransactionCompensated: false;
  issuanceTransactionExecuted: false;
  issuancePlanCompleted: true;
  issuancePlanReady: true;
  issuancePlanBlocked: true;
  issuancePlanExecutable: false;
  wouldExecuteIssuancePlan: true;
  issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable";
  issuancePlanExecuted: false;
  issuanceDecisionCompleted: true;
  issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued";
  issuanceDecisionExecuted: false;
  issuanceEligible: true;
  issuanceBlocked: true;
  wouldIssueGrant: true;
  grantReadinessCompleted: true;
  grantReadinessResult: "authorization-grant-ready-not-issued";
  grantReadinessExecuted: false;
  grantReady: true;
  grantBlocked: true;
  authorizationDecisionCompleted: true;
  authorizationDecisionResult: "authorization-eligible-not-granted";
  authorizationDecisionExecuted: false;
  authorizationEligible: true;
  authorizationBlocked: true;
  wouldAuthorize: true;
  authorizationGranted: false;
  authorizationApplied: false;
  transitionAuthorized: false;
  preflightCompleted: true;
  preflightReady: true;
  preflightBlocked: true;
  preflightResult: "transition-preflight-ready-not-authorized";
  preflightExecuted: false;
  selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID;
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  sourceState: "COMMIT_READY";
  targetState: "ACTIVE";
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  currentGraphNode: "COMMIT_READY";
  selectionExecuted: false;
  graphTraversalExecuted: false;
  transactionContextPresent: false;
  transactionHandlePresent: false;
  transactionTokenPresent: false;
  transactionSecretPresent: false;
  transactionSignaturePresent: false;
  transactionCallbackPresent: false;
  transactionCoordinatorPresent: false;
  transactionExecutorPresent: false;
  transactionSchedulerPresent: false;
  transactionDispatcherPresent: false;
  transactionQueuePresent: false;
  transactionJournalPresent: false;
  transactionLockPresent: false;
  resourceReservationPresent: false;
  writeSetPresent: false;
  mutationSetPresent: false;
  compensationActionPresent: false;
  persistenceBoundaryPresent: false;
  persistenceApplied: false;
  lockAcquired: false;
  resourceReserved: false;
  journalWritten: false;
  mutationsStaged: false;
  writesStaged: false;
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
  commandPresent: false;
  dispatcherPresent: false;
  queuePresent: false;
  schedulerPresent: false;
  executorPresent: false;
  authorityProviderPresent: false;
  issuanceServicePresent: false;
  transactionExecutionAllowed: false;
  transactionOpenAllowed: false;
  transactionPrepareAllowed: false;
  transactionCommitAllowed: false;
  transactionAbortAllowed: false;
  transactionRollbackAllowed: false;
  transactionCompensationAllowed: false;
  issuanceCommitBoundaryExecutionAllowed: false;
  issuanceTransactionExecutionAllowed: false;
  issuancePlanExecutionAllowed: false;
  issuanceExecutionAllowed: false;
  grantExecutionAllowed: false;
  authorizationExecutionAllowed: false;
  activationExecutionAllowed: false;
  transitionExecutionAllowed: false;
  executorAllowed: false;
  schedulerAllowed: false;
  canStartActivation: false;
  hostActivation: false;
  renderActivation: false;
  transitionExecuted: false;
  protocolExecuted: false;
  commitExecuted: false;
  rollbackExecuted: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  issuanceCommitBoundaryExecutionImpossible: true;
  issuanceTransactionExecutionImpossible: true;
  issuancePlanExecutionImpossible: true;
  issuanceImpossible: true;
  authorityImpossible: true;
  executionImpossible: true;
  nextEligibleStep: "3B.3.24";
  activationBlocker: typeof PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY;
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  mountCount: 1;
  unmountCount: 0;
  geoFeedRenderCount: 1;
  activeInstanceCount: 1;
  shellRendered: false;
  shellChildCount: 0;
  shellDOMNodeCount: 0;
  machineId: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID;
  graphId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID;
  selectionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID;
  preflightId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID;
  authorizationDecisionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID;
  grantReadinessId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID;
  grantIssuanceDecisionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID;
  grantIssuancePlanId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID;
  grantIssuanceTransactionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ID;
  grantIssuanceCommitBoundaryId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ID;
  authorizationPolicyId: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY;
  grantPolicyId: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY;
  issuancePolicyId: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY;
  issuancePlanPolicyId: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY;
  issuanceTransactionPolicyId: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_POLICY;
  issuanceCommitBoundaryPolicyId: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY;
  protocolId: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID;
  transactionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID;
  browserInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
};

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDiagnostics = {
  [key: string]: unknown;
};

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryEvaluation = {
  descriptor: ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor;
  diagnostics: ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDiagnostics;
};

export function validateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor(
  d: ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor,
): ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor {
  assertTransactionStructure();
  if (
    d.phase !== "3B.3.23" ||
    d.previousPhase !== "3B.3.22" ||
    d.currentPhase !== "3B.3.23" ||
    d.nextEligibleStep !== "3B.3.24" ||
    d.issuanceCommitBoundaryState !== "NOT_ENTERED" ||
    d.issuanceCommitBoundaryResult !== "authorization-grant-issuance-commit-boundary-ready-not-entered" ||
    d.issuanceCommitBoundaryCompleted !== true ||
    d.issuanceCommitBoundaryReady !== true ||
    d.issuanceCommitBoundaryBlocked !== true ||
    d.issuanceCommitBoundaryEntered !== false ||
    d.issuanceCommitBoundaryPrepared !== false ||
    d.issuanceCommitBoundaryCommitted !== false ||
    d.issuanceCommitBoundaryAborted !== false ||
    d.issuanceCommitBoundaryRolledBack !== false ||
    d.issuanceCommitBoundaryCompensated !== false ||
    d.issuanceCommitBoundaryExecutable !== false ||
    d.wouldEnterIssuanceCommitBoundary !== true ||
    d.transactionParticipantCount !== 30 ||
    d.blockedTransactionParticipantCount !== 30 ||
    d.sourceTransactionParticipantCount !== 30 ||
    d.coveredTransactionParticipantCount !== 30 ||
    d.transactionParticipantCoverageExact !== true ||
    d.transactionParticipantOrderPreserved !== true ||
    d.transactionParticipantGraphAcyclic !== true ||
    d.grantIssued !== false ||
    d.grantCreated !== false ||
    d.grantMaterialized !== false ||
    d.grantPersisted !== false ||
    d.grantApplied !== false ||
    d.grantActivated !== false ||
    d.grantAuthorityAvailable !== false ||
    d.grantAuthorityEnabled !== false ||
    d.tokenPresent !== false ||
    d.secretPresent !== false ||
    d.signaturePresent !== false ||
    d.callbackPresent !== false ||
    d.executableHandlePresent !== false ||
    d.runtimeCapabilityPresent !== false ||
    d.commandPresent !== false ||
    d.dispatcherPresent !== false ||
    d.queuePresent !== false ||
    d.schedulerPresent !== false ||
    d.executorPresent !== false ||
    d.authorityProviderPresent !== false ||
    d.issuanceServicePresent !== false ||
    d.authorizationGranted !== false ||
    d.authorizationApplied !== false ||
    d.transitionAuthorized !== false ||
    d.transitionExecuted !== false ||
    d.transactionContextPresent !== false ||
    d.transactionHandlePresent !== false ||
    d.transactionTokenPresent !== false ||
    d.transactionSecretPresent !== false ||
    d.transactionCallbackPresent !== false ||
    d.transactionCoordinatorPresent !== false ||
    d.transactionExecutorPresent !== false ||
    d.writeSetPresent !== false ||
    d.mutationSetPresent !== false ||
    d.compensationActionPresent !== false ||
    d.transactionJournalPresent !== false ||
    d.transactionLockPresent !== false ||
    d.resourceReservationPresent !== false ||
    d.mutationsStaged !== false ||
    d.writesStaged !== false ||
    d.lockAcquired !== false ||
    d.owner !== "legacy" ||
    d.writer !== "legacy" ||
    d.renderer !== "legacy" ||
    d.mountCount !== 1 ||
    d.unmountCount !== 0 ||
    d.canStartActivation !== false ||
    d.hostActivation !== false ||
    d.renderActivation !== false ||
    d.currentState !== "COMMIT_READY" ||
    d.currentNode !== "COMMIT_READY" ||
    d.currentGraphNode !== "COMMIT_READY" ||
    d.selectedTransition !== CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION ||
    d.issuanceCommitBoundaryExecutionAllowed !== false ||
    d.transactionOpenAllowed !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_DESCRIPTOR",
      "Issuance transaction descriptor failed sealed validation",
    );
  }
  return Object.freeze(d) as ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor;
}

/**
 * Pure issuance-transaction engine — deterministic, no side effects.
 * Transaction may be ready; opening/prepare/commit remain permanently false.
 */
export function evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryEvaluation {
  void createFeedHostRollbackContract();
  const pipeline =
    evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceTransaction(
      registry,
    );
  assertTransactionStructure();

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_HOST_COUNT",
      "Grant issuance transaction requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDS",
      "Grant issuance transaction requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_OWNERSHIP",
      "Grant issuance transaction requires legacy owner/writer/renderer",
    );
  }
  const d = pipeline.descriptor;
  if (
    d.issuanceTransactionCompleted !== true ||
    d.issuanceTransactionReady !== true ||
    d.issuanceTransactionBlocked !== true ||
    d.issuanceTransactionExecutable !== false ||
    d.wouldOpenIssuanceTransaction !== true ||
    d.issuanceTransactionResult !==
      "authorization-grant-issuance-transaction-ready-not-opened" ||
    d.issuanceTransactionState !== "NOT_OPENED" ||
    d.issuanceTransactionOpened !== false ||
    d.issuanceTransactionExecuted !== false ||
    d.transactionParticipantCount !== 30 ||
    d.completedTransactionParticipantCount !== 0 ||
    d.executableTransactionParticipantCount !== 0 ||
    d.invalidTransactionParticipantCount !== 0 ||
    d.blockedTransactionParticipantCount !== 30 ||
    d.sourcePipelineStageCount !== 30 ||
    d.coveredPipelineStageCount !== 30 ||
    d.pipelineCoverageExact !== true ||
    d.pipelineOrderPreserved !== true ||
    d.transactionParticipantGraphAcyclic !== true ||
    d.issuanceEligible !== true ||
    d.issuanceBlocked !== true ||
    d.wouldIssueGrant !== true ||
    d.grantIssued !== false ||
    d.grantReady !== true ||
    d.grantBlocked !== true ||
    d.authorizationEligible !== true ||
    d.authorizationGranted !== false ||
    d.transitionAuthorized !== false ||
    d.selectedTransition !== CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION ||
    d.currentState !== "COMMIT_READY" ||
    d.currentNode !== "COMMIT_READY" ||
    d.preflightReady !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_PREDECESSOR",
      "Grant issuance transaction requires sealed issuance-pipeline-ready-not-executable",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ACTIVATION",
      "Grant issuance transaction forbids host/render activation",
    );
  }

  const descriptor =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor();
  return {
    descriptor,
    diagnostics: buildDiagnostics(descriptor),
  };
}

function buildDiagnostics(
  descriptor: ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor,
): ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDiagnostics {
  return {
    issuanceCommitBoundaryCompleted: true,
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered",
    issuanceCommitBoundaryExecuted: false,
    issuanceCommitBoundaryReady: true,
    issuanceCommitBoundaryBlocked: true,
    issuanceCommitBoundaryEntered: false,
    issuanceCommitBoundaryArmed: false,
    boundaryCrossed: false,
    commitBoundaryEntered: false,
    commitBoundaryArmed: false,
    commitRequested: false,
    commitInvoked: false,
    commitStarted: false,
    issuanceCommitBoundaryPrepared: false,
    issuanceCommitBoundaryCommitted: false,
    issuanceCommitBoundaryAborted: false,
    issuanceCommitBoundaryRolledBack: false,
    issuanceCommitBoundaryCompensated: false,
    issuanceCommitBoundaryExecutable: false,
    wouldEnterIssuanceCommitBoundary: true,
    issuanceCommitBoundaryState: "NOT_ENTERED",
    issuanceCommitBoundaryLifecycleState: "completed",
    transactionParticipantCount: descriptor.transactionParticipantCount,
    completedTransactionParticipantCount: 0,
    executableTransactionParticipantCount: 0,
    blockedTransactionParticipantCount: descriptor.blockedTransactionParticipantCount,
    invalidTransactionParticipantCount: 0,
    transactionParticipants: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS,
    sourceTransactionParticipantCount: 30,
    coveredTransactionParticipantCount: 30,
    uncoveredTransactionParticipantCount: 0,
    duplicateCoveredTransactionParticipantCount: 0,
    unknownReferencedTransactionParticipantCount: 0,
    transactionParticipantCoverageComplete: true,
    transactionParticipantCoverageExact: true,
    transactionParticipantOrderPreserved: true,
    transactionParticipantGraphAcyclic: true,
    issuanceCommitBoundaryConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS,
    satisfiedIssuanceCommitBoundaryConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS,
    unsatisfiedIssuanceCommitBoundaryConditions: [],
    issuanceCommitBoundaryGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS,
    satisfiedIssuanceCommitBoundaryGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS,
    unsatisfiedIssuanceCommitBoundaryGuards: [],
    issuanceCommitBoundaryBlockers: CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_BLOCKERS,
    issuanceCommitBoundaryPreconditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PRECONDITIONS,
    issuanceCommitBoundaryValidationPoints: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_VALIDATION_POINTS,
    issuanceCommitBoundaryBoundaries: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_BOUNDARIES,
    issuanceCommitBoundaryReason:
      "issuance-transaction-ready-and-all-commit-boundary-prerequisites-satisfied-but-commit-boundary-entry-disabled-by-phase-contract",
    issuanceCommitBoundaryStrategy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_STRATEGY,
    issuanceCommitBoundaryPolicy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY,
    issuanceCommitBoundaryPolicyVersion: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY_VERSION,
    issuanceTransactionCompleted: true,
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened",
    issuanceTransactionState: "NOT_OPENED",
    issuanceTransactionOpened: false,
    issuanceTransactionPrepared: false,
    issuanceTransactionCommitted: false,
    issuanceTransactionAborted: false,
    issuanceTransactionRolledBack: false,
    issuanceTransactionCompensated: false,
    issuanceTransactionExecuted: false,
    issuanceTransactionReady: true,
    issuanceTransactionBlocked: true,
    issuanceTransactionExecutable: false,
    wouldOpenIssuanceTransaction: true,
    issuancePlanCompleted: true,
    issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable",
    issuancePlanExecuted: false,
    issuancePlanReady: true,
    issuancePlanBlocked: true,
    issuancePlanExecutable: false,
    wouldExecuteIssuancePlan: true,
    issuanceDecisionCompleted: true,
    issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued",
    issuanceDecisionExecuted: false,
    issuanceEligible: true,
    issuanceBlocked: true,
    wouldIssueGrant: true,
    grantReadinessCompleted: true,
    grantReadinessResult: "authorization-grant-ready-not-issued",
    grantReady: true,
    grantBlocked: true,
    authorizationDecisionCompleted: true,
    authorizationDecisionResult: "authorization-eligible-not-granted",
    authorizationEligible: true,
    authorizationBlocked: true,
    authorizationGranted: false,
    authorizationApplied: false,
    transitionAuthorized: false,
    selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
    selectedFromState: "COMMIT_READY",
    selectedToState: "ACTIVE",
    sourceState: "COMMIT_READY",
    targetState: "ACTIVE",
    preflightCompleted: true,
    preflightReady: true,
    preflightBlocked: true,
    preflightResult: "transition-preflight-ready-not-authorized",
    currentState: "COMMIT_READY",
    currentNode: "COMMIT_READY",
    currentGraphNode: "COMMIT_READY",
    transactionOpened: false,
    transactionPrepared: false,
    transactionCommitted: false,
    transactionAborted: false,
    transactionRolledBack: false,
    transactionCompensated: false,
    transactionContextPresent: false,
    transactionHandlePresent: false,
    transactionTokenPresent: false,
    transactionSecretPresent: false,
    transactionSignaturePresent: false,
    transactionCallbackPresent: false,
    transactionCoordinatorPresent: false,
    transactionExecutorPresent: false,
    transactionSchedulerPresent: false,
    transactionDispatcherPresent: false,
    transactionQueuePresent: false,
    transactionJournalPresent: false,
    transactionLockPresent: false,
    resourceReservationPresent: false,
    writeSetPresent: false,
    mutationSetPresent: false,
    compensationActionPresent: false,
    persistenceBoundaryPresent: false,
    persistenceApplied: false,
    lockAcquired: false,
    resourceReserved: false,
    journalWritten: false,
    mutationsStaged: false,
    writesStaged: false,
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
    commandPresent: false,
    dispatcherPresent: false,
    queuePresent: false,
    schedulerPresent: false,
    executorPresent: false,
    authorityProviderPresent: false,
    issuanceServicePresent: false,
    transactionExecutionAllowed: false,
    transactionOpenAllowed: false,
    transactionPrepareAllowed: false,
    transactionCommitAllowed: false,
    transactionAbortAllowed: false,
    transactionRollbackAllowed: false,
    transactionCompensationAllowed: false,
    issuanceCommitBoundaryExecutionAllowed: false,
    issuanceTransactionExecutionAllowed: false,
    issuancePlanExecutionAllowed: false,
    issuanceExecutionAllowed: false,
    grantExecutionAllowed: false,
    authorizationExecutionAllowed: false,
    activationExecutionAllowed: false,
    transitionExecutionAllowed: false,
    executorAllowed: false,
    schedulerAllowed: false,
    canStartActivation: false,
    hostActivation: false,
    renderActivation: false,
    transitionExecuted: false,
    protocolExecuted: false,
    commitExecuted: false,
    rollbackExecuted: false,
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    issuanceCommitBoundaryExecutionImpossible: true,
    issuanceTransactionExecutionImpossible: true,
    issuancePlanExecutionImpossible: true,
    issuanceImpossible: true,
    authorityImpossible: true,
    executionImpossible: true,
    currentPhase: "3B.3.23",
    previousPhase: "3B.3.22",
    nextEligibleStep: "3B.3.24",
    activeBlockers: [
      PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
    ],
    conditionCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS.length,
    satisfiedConditionCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS.length,
    unsatisfiedConditionCount: 0,
    guardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS.length,
    unsatisfiedGuardCount: 0,
    registryHostCount: 1,
    runtimeIdStable: true,
    ownershipLegacy: true,
    writerLegacy: true,
    rendererLegacy: true,
    currentStateUnchanged: true,
    currentNodeUnchanged: true,
    mountCount: 1,
    unmountCount: 0,
    geoFeedRenderCount: 1,
    activeInstanceCount: 1,
    shellRendered: false,
    shellChildCount: 0,
    shellDOMNodeCount: 0,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    machineId: CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID,
    graphId: CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID,
    selectionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
    preflightId: CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID,
    authorizationDecisionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID,
    grantReadinessId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID,
    grantIssuanceDecisionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID,
    grantIssuancePlanId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID,
    grantIssuanceTransactionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ID,
    grantIssuanceCommitBoundaryId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ID,
    authorizationPolicyId: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
    grantPolicyId: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
    issuancePolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
    issuancePlanPolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY,
    issuanceTransactionPolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_POLICY,
    issuanceCommitBoundaryPolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY,
    protocolId: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID,
    transactionId: CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID,
  };
}

export function createControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor(): ControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor {
  assertTransactionStructure();
  const participantCount = CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS.length;
  return validateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_SCHEMA_VERSION,
    phase: "3B.3.23",
    previousPhase: "3B.3.22",
    currentPhase: "3B.3.23",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    issuanceCommitBoundaryId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ID,
    issuanceCommitBoundaryContractId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_CONTRACT_ID,
    issuanceCommitBoundaryPolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY,
    issuanceCommitBoundaryVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_VERSION,
    issuanceCommitBoundaryState: "NOT_ENTERED",
    issuanceCommitBoundaryLifecycleState: "completed",
    issuanceTransactionLifecycleState: "completed",
    issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered",
    issuanceCommitBoundaryCompleted: true,
    issuanceCommitBoundaryExecuted: false,
    issuanceCommitBoundaryReady: true,
    issuanceCommitBoundaryBlocked: true,
    issuanceCommitBoundaryEntered: false,
    issuanceCommitBoundaryArmed: false,
    boundaryCrossed: false,
    commitBoundaryEntered: false,
    commitBoundaryArmed: false,
    commitRequested: false,
    commitInvoked: false,
    commitStarted: false,
    issuanceCommitBoundaryPrepared: false,
    issuanceCommitBoundaryCommitted: false,
    issuanceCommitBoundaryAborted: false,
    issuanceCommitBoundaryRolledBack: false,
    issuanceCommitBoundaryCompensated: false,
    issuanceCommitBoundaryExecutable: false,
    wouldEnterIssuanceCommitBoundary: true,
    transactionOpened: false,
    transactionPrepared: false,
    transactionCommitted: false,
    transactionAborted: false,
    transactionRolledBack: false,
    transactionCompensated: false,
    transactionParticipants: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PARTICIPANTS,
    transactionParticipantCount: participantCount,
    completedTransactionParticipantCount: 0,
    executableTransactionParticipantCount: 0,
    blockedTransactionParticipantCount: participantCount,
    invalidTransactionParticipantCount: 0,
    sourceTransactionParticipantCount: 30,
    coveredTransactionParticipantCount: 30,
    uncoveredTransactionParticipantCount: 0,
    duplicateCoveredTransactionParticipantCount: 0,
    unknownReferencedTransactionParticipantCount: 0,
    transactionParticipantCoverageComplete: true,
    transactionParticipantCoverageExact: true,
    transactionParticipantOrderPreserved: true,
    transactionParticipantGraphAcyclic: true,
    issuanceCommitBoundaryConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS,
    satisfiedIssuanceCommitBoundaryConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS,
    unsatisfiedIssuanceCommitBoundaryConditions: [],
    issuanceCommitBoundaryGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS,
    satisfiedIssuanceCommitBoundaryGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS,
    unsatisfiedIssuanceCommitBoundaryGuards: [],
    issuanceCommitBoundaryBlockers: CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_BLOCKERS,
    issuanceCommitBoundaryPreconditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_PRECONDITIONS,
    issuanceCommitBoundaryValidationPoints: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_VALIDATION_POINTS,
    issuanceCommitBoundaryBoundaries: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_BOUNDARIES,
    issuanceCommitBoundaryReason:
      "issuance-transaction-ready-and-all-commit-boundary-prerequisites-satisfied-but-commit-boundary-entry-disabled-by-phase-contract",
    issuanceCommitBoundaryStrategy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_STRATEGY,
    issuanceCommitBoundaryPolicy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY,
    issuanceCommitBoundaryPolicyVersion: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY_VERSION,
    issuanceTransactionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ID,
    issuanceTransactionCompleted: true,
    issuanceTransactionReady: true,
    issuanceTransactionBlocked: true,
    issuanceTransactionExecutable: false,
    wouldOpenIssuanceTransaction: true,
    issuanceTransactionResult: "authorization-grant-issuance-transaction-ready-not-opened",
    issuanceTransactionState: "NOT_OPENED",
    issuanceTransactionOpened: false,
    issuanceTransactionPrepared: false,
    issuanceTransactionCommitted: false,
    issuanceTransactionAborted: false,
    issuanceTransactionRolledBack: false,
    issuanceTransactionCompensated: false,
    issuanceTransactionExecuted: false,
    issuancePlanCompleted: true,
    issuancePlanReady: true,
    issuancePlanBlocked: true,
    issuancePlanExecutable: false,
    wouldExecuteIssuancePlan: true,
    issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable",
    issuancePlanExecuted: false,
    issuanceDecisionCompleted: true,
    issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued",
    issuanceDecisionExecuted: false,
    issuanceEligible: true,
    issuanceBlocked: true,
    wouldIssueGrant: true,
    grantReadinessCompleted: true,
    grantReadinessResult: "authorization-grant-ready-not-issued",
    grantReadinessExecuted: false,
    grantReady: true,
    grantBlocked: true,
    authorizationDecisionCompleted: true,
    authorizationDecisionResult: "authorization-eligible-not-granted",
    authorizationDecisionExecuted: false,
    authorizationEligible: true,
    authorizationBlocked: true,
    wouldAuthorize: true,
    authorizationGranted: false,
    authorizationApplied: false,
    transitionAuthorized: false,
    preflightCompleted: true,
    preflightReady: true,
    preflightBlocked: true,
    preflightResult: "transition-preflight-ready-not-authorized",
    preflightExecuted: false,
    selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
    selectedTransitionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
    selectedFromState: "COMMIT_READY",
    selectedToState: "ACTIVE",
    sourceState: "COMMIT_READY",
    targetState: "ACTIVE",
    currentState: "COMMIT_READY",
    currentNode: "COMMIT_READY",
    currentGraphNode: "COMMIT_READY",
    selectionExecuted: false,
    graphTraversalExecuted: false,
    transactionContextPresent: false,
    transactionHandlePresent: false,
    transactionTokenPresent: false,
    transactionSecretPresent: false,
    transactionSignaturePresent: false,
    transactionCallbackPresent: false,
    transactionCoordinatorPresent: false,
    transactionExecutorPresent: false,
    transactionSchedulerPresent: false,
    transactionDispatcherPresent: false,
    transactionQueuePresent: false,
    transactionJournalPresent: false,
    transactionLockPresent: false,
    resourceReservationPresent: false,
    writeSetPresent: false,
    mutationSetPresent: false,
    compensationActionPresent: false,
    persistenceBoundaryPresent: false,
    persistenceApplied: false,
    lockAcquired: false,
    resourceReserved: false,
    journalWritten: false,
    mutationsStaged: false,
    writesStaged: false,
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
    commandPresent: false,
    dispatcherPresent: false,
    queuePresent: false,
    schedulerPresent: false,
    executorPresent: false,
    authorityProviderPresent: false,
    issuanceServicePresent: false,
    transactionExecutionAllowed: false,
    transactionOpenAllowed: false,
    transactionPrepareAllowed: false,
    transactionCommitAllowed: false,
    transactionAbortAllowed: false,
    transactionRollbackAllowed: false,
    transactionCompensationAllowed: false,
    issuanceCommitBoundaryExecutionAllowed: false,
    issuanceTransactionExecutionAllowed: false,
    issuancePlanExecutionAllowed: false,
    issuanceExecutionAllowed: false,
    grantExecutionAllowed: false,
    authorizationExecutionAllowed: false,
    activationExecutionAllowed: false,
    transitionExecutionAllowed: false,
    executorAllowed: false,
    schedulerAllowed: false,
    canStartActivation: false,
    hostActivation: false,
    renderActivation: false,
    transitionExecuted: false,
    protocolExecuted: false,
    commitExecuted: false,
    rollbackExecuted: false,
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    issuanceCommitBoundaryExecutionImpossible: true,
    issuanceTransactionExecutionImpossible: true,
    issuancePlanExecutionImpossible: true,
    issuanceImpossible: true,
    authorityImpossible: true,
    executionImpossible: true,
    nextEligibleStep: "3B.3.24",
    activationBlocker: PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    mountCount: 1,
    unmountCount: 0,
    geoFeedRenderCount: 1,
    activeInstanceCount: 1,
    shellRendered: false,
    shellChildCount: 0,
    shellDOMNodeCount: 0,
    machineId: CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID,
    graphId: CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID,
    selectionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
    preflightId: CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID,
    authorizationDecisionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID,
    grantReadinessId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID,
    grantIssuanceDecisionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID,
    grantIssuancePlanId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID,
    grantIssuanceTransactionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ID,
    grantIssuanceCommitBoundaryId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ID,
    authorizationPolicyId: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
    grantPolicyId: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
    issuancePolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
    issuancePlanPolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY,
    issuanceTransactionPolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_POLICY,
    issuanceCommitBoundaryPolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY,
    protocolId: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID,
    transactionId: CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  });
}

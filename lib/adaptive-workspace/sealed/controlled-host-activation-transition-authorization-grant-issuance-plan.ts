/**
 * Phase 3B.3.20 — Controlled Host Activation Transition Authorization Grant
 * Issuance Plan (metadata only). Deterministic descriptive plan of how a
 * hypothetical authorization grant issuance would be ordered if a future
 * phase were ever permitted to issue it. Never executes the plan. Never
 * issues/creates/materializes/persists/applies a grant. Never enables
 * authority. No tokens/secrets/signatures/commands/callbacks/handles.
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
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION,
} from "./controlled-host-activation-transition-authorization-decision";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID,
  CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
  CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION,
} from "./controlled-host-activation-transition-authorization-grant-readiness";
import {
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY_VERSION,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceDecision,
} from "./controlled-host-activation-transition-authorization-grant-issuance-decision";
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

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY =
  "PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID =
  "feed.discovery.controlled-host.activation-transition-authorization-grant-issuance-plan.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_CONTRACT_ID =
  "feed.discovery.controlled-host.activation-transition-authorization-grant-issuance-plan.contract.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY =
  "sealed-authorization-grant-issuance-plan-policy" as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY_VERSION = 1 as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STRATEGY =
  "issuance-eligible-then-sealed-issuance-plan" as const;

export type ControlledHostActivationTransitionAuthorizationGrantIssuancePlanState =
  "completed";

export type ControlledHostActivationTransitionAuthorizationGrantIssuancePlanResult =
  | "authorization-grant-issuance-plan-ready-not-executable"
  | "authorization-grant-issuance-plan-blocked-issuance-decision-invalid"
  | "authorization-grant-issuance-plan-blocked-grant-readiness-invalid"
  | "authorization-grant-issuance-plan-blocked-authorization-decision-invalid"
  | "authorization-grant-issuance-plan-blocked-preflight-invalid"
  | "authorization-grant-issuance-plan-blocked-transition-selection-invalid"
  | "authorization-grant-issuance-plan-blocked-state-graph-mismatch"
  | "authorization-grant-issuance-plan-blocked-identity-mismatch"
  | "authorization-grant-issuance-plan-blocked-plan-structure-invalid"
  | "authorization-grant-issuance-plan-blocked-duplicate-step-id"
  | "authorization-grant-issuance-plan-blocked-invalid-prerequisite"
  | "authorization-grant-issuance-plan-blocked-circular-dependency"
  | "authorization-grant-issuance-plan-blocked-executable-step-present"
  | "authorization-grant-issuance-plan-blocked-grant-artifact-present"
  | "authorization-grant-issuance-plan-blocked-authority-present"
  | "authorization-grant-issuance-plan-blocked-credential-present"
  | "authorization-grant-issuance-plan-blocked-executable-path-present"
  | "authorization-grant-issuance-plan-blocked-runtime-invariant-mismatch"
  | "authorization-grant-issuance-plan-blocked-ownership-invariant-mismatch"
  | "authorization-grant-issuance-plan-blocked-invalid-input";

export type ControlledHostActivationTransitionAuthorizationGrantIssuancePlanStep = {
  readonly stepId: string;
  readonly ordinal: number;
  readonly phase: "3B.3.20";
  readonly title: string;
  readonly purpose: string;
  readonly prerequisiteIds: readonly string[];
  readonly expectedInputMetadataKeys: readonly string[];
  readonly expectedOutputMetadataKeys: readonly string[];
  readonly requiredConditions: readonly string[];
  readonly requiredGuards: readonly string[];
  readonly requiredBlockers: readonly string[];
  readonly blocked: true;
  readonly executable: false;
  readonly executionAllowed: false;
  readonly applied: false;
  readonly completed: false;
  readonly status: "planned-blocked-not-executable";
  readonly diagnostics: {
    readonly descriptiveOnly: true;
    readonly executionForbidden: true;
    readonly note: string;
  };
};

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS: readonly ControlledHostActivationTransitionAuthorizationGrantIssuancePlanStep[] = Object.freeze([
  Object.freeze({
    stepId: "validate-frozen-predecessor",
    ordinal: 1,
    phase: "3B.3.20" as const,
    title: "Validate frozen predecessor",
    purpose: "Proves Phase 3B.3.19 is complete and frozen.",
    prerequisiteIds: Object.freeze([]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves Phase 3B.3.19 is complete and frozen.",
    }),
  }),
  Object.freeze({
    stepId: "validate-issuance-decision",
    ordinal: 2,
    phase: "3B.3.20" as const,
    title: "Validate issuance decision",
    purpose: "Proves issuanceEligible=true while issuanceBlocked=true.",
    prerequisiteIds: Object.freeze(["validate-frozen-predecessor"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves issuanceEligible=true while issuanceBlocked=true.",
    }),
  }),
  Object.freeze({
    stepId: "validate-grant-readiness",
    ordinal: 3,
    phase: "3B.3.20" as const,
    title: "Validate grant readiness",
    purpose: "Proves grantReady=true while grantBlocked=true.",
    prerequisiteIds: Object.freeze(["validate-issuance-decision"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves grantReady=true while grantBlocked=true.",
    }),
  }),
  Object.freeze({
    stepId: "validate-authorization-decision",
    ordinal: 4,
    phase: "3B.3.20" as const,
    title: "Validate authorization decision",
    purpose: "Proves authorizationEligible=true while authorizationGranted=false.",
    prerequisiteIds: Object.freeze(["validate-grant-readiness"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves authorizationEligible=true while authorizationGranted=false.",
    }),
  }),
  Object.freeze({
    stepId: "validate-transition-preflight",
    ordinal: 5,
    phase: "3B.3.20" as const,
    title: "Validate transition preflight",
    purpose: "Proves preflightReady=true while transitionAuthorized=false.",
    prerequisiteIds: Object.freeze(["validate-authorization-decision"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves preflightReady=true while transitionAuthorized=false.",
    }),
  }),
  Object.freeze({
    stepId: "validate-selected-transition",
    ordinal: 6,
    phase: "3B.3.20" as const,
    title: "Validate selected transition",
    purpose: "Proves COMMIT_READY->ACTIVE remains selected metadata only.",
    prerequisiteIds: Object.freeze(["validate-transition-preflight"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves COMMIT_READY->ACTIVE remains selected metadata only.",
    }),
  }),
  Object.freeze({
    stepId: "validate-state-and-graph-position",
    ordinal: 7,
    phase: "3B.3.20" as const,
    title: "Validate state and graph position",
    purpose: "Proves state and graph node remain COMMIT_READY.",
    prerequisiteIds: Object.freeze(["validate-selected-transition"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves state and graph node remain COMMIT_READY.",
    }),
  }),
  Object.freeze({
    stepId: "validate-commit-boundary",
    ordinal: 8,
    phase: "3B.3.20" as const,
    title: "Validate commit boundary",
    purpose: "Proves commitReady metadata may exist while commit remains blocked and unexecuted.",
    prerequisiteIds: Object.freeze(["validate-state-and-graph-position"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves commitReady metadata may exist while commit remains blocked and unexecuted.",
    }),
  }),
  Object.freeze({
    stepId: "validate-runtime-ownership",
    ordinal: 9,
    phase: "3B.3.20" as const,
    title: "Validate runtime ownership",
    purpose: "Proves owner, writer and renderer remain legacy.",
    prerequisiteIds: Object.freeze(["validate-commit-boundary"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves owner, writer and renderer remain legacy.",
    }),
  }),
  Object.freeze({
    stepId: "validate-stable-runtime-identity",
    ordinal: 10,
    phase: "3B.3.20" as const,
    title: "Validate stable runtime identity",
    purpose: "Proves hostId, runtimeId and linked identities remain stable.",
    prerequisiteIds: Object.freeze(["validate-runtime-ownership"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves hostId, runtimeId and linked identities remain stable.",
    }),
  }),
  Object.freeze({
    stepId: "validate-stable-mount",
    ordinal: 11,
    phase: "3B.3.20" as const,
    title: "Validate stable mount",
    purpose: "Proves mount=1 and unmount=0.",
    prerequisiteIds: Object.freeze(["validate-stable-runtime-identity"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves mount=1 and unmount=0.",
    }),
  }),
  Object.freeze({
    stepId: "validate-single-geofeed",
    ordinal: 12,
    phase: "3B.3.20" as const,
    title: "Validate single sealed feed instance",
    purpose: "Proves exactly one active sealed feed instance.",
    prerequisiteIds: Object.freeze(["validate-stable-mount"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves exactly one active sealed feed instance.",
    }),
  }),
  Object.freeze({
    stepId: "validate-null-workspace-shell",
    ordinal: 13,
    phase: "3B.3.20" as const,
    title: "Validate null Workspace shell",
    purpose: "Proves shell remains null and has no DOM children or nodes.",
    prerequisiteIds: Object.freeze(["validate-single-geofeed"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves shell remains null and has no DOM children or nodes.",
    }),
  }),
  Object.freeze({
    stepId: "validate-grant-absence",
    ordinal: 14,
    phase: "3B.3.20" as const,
    title: "Validate grant absence",
    purpose: "Proves no grant object, payload, instance or materialized artifact exists.",
    prerequisiteIds: Object.freeze(["validate-null-workspace-shell"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves no grant object, payload, instance or materialized artifact exists.",
    }),
  }),
  Object.freeze({
    stepId: "validate-authority-absence",
    ordinal: 15,
    phase: "3B.3.20" as const,
    title: "Validate authority absence",
    purpose: "Proves authority is unavailable, disabled, undelegated and untransferred.",
    prerequisiteIds: Object.freeze(["validate-grant-absence"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves authority is unavailable, disabled, undelegated and untransferred.",
    }),
  }),
  Object.freeze({
    stepId: "validate-credential-absence",
    ordinal: 16,
    phase: "3B.3.20" as const,
    title: "Validate credential absence",
    purpose: "Proves no token, secret, signature, nonce, credential, certificate or permit exists.",
    prerequisiteIds: Object.freeze(["validate-authority-absence"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves no token, secret, signature, nonce, credential, certificate or permit exists.",
    }),
  }),
  Object.freeze({
    stepId: "validate-executable-path-absence",
    ordinal: 17,
    phase: "3B.3.20" as const,
    title: "Validate executable-path absence",
    purpose: "Proves no callback, executable handle, runtime capability, scheduler, executor, queue, dispatcher or command exists.",
    prerequisiteIds: Object.freeze(["validate-credential-absence"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves no callback, executable handle, runtime capability, scheduler, executor, queue, dispatcher or command exists.",
    }),
  }),
  Object.freeze({
    stepId: "validate-transition-remains-unauthorized",
    ordinal: 18,
    phase: "3B.3.20" as const,
    title: "Validate transition remains unauthorized",
    purpose: "Proves authorizationGranted=false, authorizationApplied=false and transitionAuthorized=false.",
    prerequisiteIds: Object.freeze(["validate-executable-path-absence"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves authorizationGranted=false, authorizationApplied=false and transitionAuthorized=false.",
    }),
  }),
  Object.freeze({
    stepId: "validate-activation-remains-impossible",
    ordinal: 19,
    phase: "3B.3.20" as const,
    title: "Validate activation remains impossible",
    purpose: "Proves hostActivation=false, renderActivation=false and canStartActivation=false.",
    prerequisiteIds: Object.freeze(["validate-transition-remains-unauthorized"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves hostActivation=false, renderActivation=false and canStartActivation=false.",
    }),
  }),
  Object.freeze({
    stepId: "validate-commit-and-rollback-unexecuted",
    ordinal: 20,
    phase: "3B.3.20" as const,
    title: "Validate commit and rollback remain unexecuted",
    purpose: "Proves commitExecuted=false and rollbackExecuted=false.",
    prerequisiteIds: Object.freeze(["validate-activation-remains-impossible"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Proves commitExecuted=false and rollbackExecuted=false.",
    }),
  }),
  Object.freeze({
    stepId: "describe-hypothetical-grant-construction-boundary",
    ordinal: 21,
    phase: "3B.3.20" as const,
    title: "Describe hypothetical grant construction boundary",
    purpose: "Descriptive metadata only. Grant construction is forbidden in this phase.",
    prerequisiteIds: Object.freeze(["validate-commit-and-rollback-unexecuted"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive metadata only. Grant construction is forbidden in this phase.",
    }),
  }),
  Object.freeze({
    stepId: "describe-hypothetical-grant-issuance-boundary",
    ordinal: 22,
    phase: "3B.3.20" as const,
    title: "Describe hypothetical grant issuance boundary",
    purpose: "Descriptive metadata only. Issuance is forbidden in this phase.",
    prerequisiteIds: Object.freeze(["describe-hypothetical-grant-construction-boundary"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive metadata only. Issuance is forbidden in this phase.",
    }),
  }),
  Object.freeze({
    stepId: "describe-hypothetical-grant-persistence-boundary",
    ordinal: 23,
    phase: "3B.3.20" as const,
    title: "Describe hypothetical grant persistence boundary",
    purpose: "Descriptive metadata only. Persistence is forbidden in this phase.",
    prerequisiteIds: Object.freeze(["describe-hypothetical-grant-issuance-boundary"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive metadata only. Persistence is forbidden in this phase.",
    }),
  }),
  Object.freeze({
    stepId: "describe-hypothetical-grant-application-boundary",
    ordinal: 24,
    phase: "3B.3.20" as const,
    title: "Describe hypothetical grant application boundary",
    purpose: "Descriptive metadata only. Application is forbidden in this phase.",
    prerequisiteIds: Object.freeze(["describe-hypothetical-grant-persistence-boundary"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive metadata only. Application is forbidden in this phase.",
    }),
  }),
  Object.freeze({
    stepId: "describe-hypothetical-authority-boundary",
    ordinal: 25,
    phase: "3B.3.20" as const,
    title: "Describe hypothetical authority boundary",
    purpose: "Descriptive metadata only. Authority creation and enablement are forbidden.",
    prerequisiteIds: Object.freeze(["describe-hypothetical-grant-application-boundary"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive metadata only. Authority creation and enablement are forbidden.",
    }),
  }),
  Object.freeze({
    stepId: "describe-hypothetical-transition-authorization-boundary",
    ordinal: 26,
    phase: "3B.3.20" as const,
    title: "Describe hypothetical transition-authorization boundary",
    purpose: "Descriptive metadata only. Transition authorization is forbidden.",
    prerequisiteIds: Object.freeze(["describe-hypothetical-authority-boundary"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive metadata only. Transition authorization is forbidden.",
    }),
  }),
  Object.freeze({
    stepId: "describe-hypothetical-activation-boundary",
    ordinal: 27,
    phase: "3B.3.20" as const,
    title: "Describe hypothetical activation boundary",
    purpose: "Descriptive metadata only. Activation is forbidden.",
    prerequisiteIds: Object.freeze(["describe-hypothetical-transition-authorization-boundary"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive metadata only. Activation is forbidden.",
    }),
  }),
  Object.freeze({
    stepId: "describe-rollback-boundary",
    ordinal: 28,
    phase: "3B.3.20" as const,
    title: "Describe rollback boundary",
    purpose: "Descriptive rollback metadata only. No rollback execution function or command may exist.",
    prerequisiteIds: Object.freeze(["describe-hypothetical-activation-boundary"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Descriptive rollback metadata only. No rollback execution function or command may exist.",
    }),
  }),
  Object.freeze({
    stepId: "reassert-final-fail-closed-state",
    ordinal: 29,
    phase: "3B.3.20" as const,
    title: "Reassert final fail-closed state",
    purpose: "All execution, issuance, authority and transfer flags remain false.",
    prerequisiteIds: Object.freeze(["describe-rollback-boundary"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "All execution, issuance, authority and transfer flags remain false.",
    }),
  }),
  Object.freeze({
    stepId: "declare-plan-complete-but-non-executable",
    ordinal: 30,
    phase: "3B.3.20" as const,
    title: "Declare plan complete but non-executable",
    purpose: "Final status: authorization-grant-issuance-plan-ready-not-executable",
    prerequisiteIds: Object.freeze(["reassert-final-fail-closed-state"]) as readonly string[],
    expectedInputMetadataKeys: Object.freeze(["issuanceDecisionResult","grantReadinessResult","authorizationDecisionResult","selectedTransition","currentState","currentNode"]) as readonly string[],
    expectedOutputMetadataKeys: Object.freeze(["issuancePlanResult","blocked","executable"]) as readonly string[],
    requiredConditions: Object.freeze(["issuance-plan-metadata-only"]) as readonly string[],
    requiredGuards: Object.freeze(["all-steps-blocked-guard"]) as readonly string[],
    requiredBlockers: Object.freeze(["PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN"]) as readonly string[],
    blocked: true as const,
    executable: false as const,
    executionAllowed: false as const,
    applied: false as const,
    completed: false as const,
    status: "planned-blocked-not-executable" as const,
    diagnostics: Object.freeze({
      descriptiveOnly: true as const,
      executionForbidden: true as const,
      note: "Final status: authorization-grant-issuance-plan-ready-not-executable",
    }),
  }),
]);

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS = [
  "phase-3b320-active",
  "previous-phase-3b319-complete",
  "next-eligible-step-3b321",
  "phase-chain-continuous",
  "predecessor-frozen",
  "issuance-plan-metadata-only",
  "no-phase-skipping",
  "issuance-decision-completed",
  "issuance-decision-result-valid",
  "issuance-decision-executed-false",
  "issuance-eligible",
  "issuance-blocked",
  "would-issue-grant",
  "issuance-decision-conditions-complete",
  "issuance-decision-conditions-satisfied",
  "issuance-decision-guards-complete",
  "issuance-decision-guards-satisfied",
  "issuance-decision-blockers-present",
  "issuance-decision-identity-stable",
  "grant-readiness-completed",
  "grant-readiness-result-valid",
  "grant-ready",
  "grant-blocked",
  "grant-not-issued",
  "authorization-decision-completed",
  "authorization-decision-result-valid",
  "authorization-eligible",
  "authorization-blocked",
  "authorization-granted-false",
  "authorization-applied-false",
  "transition-authorized-false",
  "preflight-completed",
  "preflight-ready",
  "preflight-blocked",
  "preflight-result-valid",
  "preflight-executed-false",
  "preflight-failed-checks-empty",
  "preflight-warning-policy-satisfied",
  "selected-transition-present",
  "selected-transition-is-commit-ready-to-active",
  "selected-from-state-is-commit-ready",
  "selected-to-state-is-active",
  "selection-metadata-only",
  "selection-executed-false",
  "current-state-is-commit-ready",
  "machine-identity-stable",
  "transition-not-applied",
  "state-mutation-absent",
  "current-graph-node-is-commit-ready",
  "graph-identity-stable",
  "graph-traversal-executed-false",
  "commit-ready-metadata-inherited",
  "commit-blocked",
  "protocol-executed-false",
  "transaction-committed-false",
  "commit-executed-false",
  "rollback-executed-false",
  "issuance-plan-identity-valid",
  "issuance-plan-contract-identity-valid",
  "issuance-plan-policy-identity-valid",
  "plan-step-count-exact",
  "ordinals-contiguous",
  "step-ids-unique",
  "prerequisite-ids-valid",
  "no-circular-dependency",
  "no-missing-prerequisite",
  "final-step-is-plan-completion",
  "each-step-blocked",
  "each-step-non-executable",
  "each-step-unapplied",
  "each-step-operationally-uncompleted",
  "grant-instance-absent",
  "grant-payload-absent",
  "grant-materialized-false",
  "grant-issued-false",
  "grant-created-false",
  "grant-persisted-false",
  "grant-applied-false",
  "grant-activated-false",
  "grant-consumed-false",
  "grant-revoked-false",
  "grant-authority-available-false",
  "grant-authority-enabled-false",
  "grant-authority-delegated-false",
  "grant-authority-transferred-false",
  "authority-provider-absent",
  "authority-resolver-non-executable",
  "issuance-service-absent",
  "token-absent",
  "secret-absent",
  "signature-absent",
  "nonce-absent",
  "credential-absent",
  "certificate-absent",
  "permit-absent",
  "callback-absent",
  "executable-handle-absent",
  "runtime-capability-absent",
  "command-absent",
  "dispatcher-absent",
  "queue-absent",
  "scheduler-allowed-false",
  "executor-allowed-false",
  "action-absent",
  "function-valued-metadata-absent",
  "host-id-match",
  "runtime-id-match",
  "mount-count-one",
  "unmount-count-zero",
  "single-geofeed-instance",
  "react-identity-stable",
  "shell-null",
  "shell-child-count-zero",
  "shell-dom-node-count-zero",
  "runtime-mutation-absent",
  "owner-is-legacy",
  "writer-is-legacy",
  "renderer-is-legacy",
  "ownership-transferred-false",
  "writer-transferred-false",
  "renderer-transferred-false",
  "frozen-20-invariants-available",
  "phase-3b2-regression-proof-valid",
  "no-browser-visible-behavior-change",
  "dom-mutation-absent",
  "react-remount-absent",
  "metadata-only-blocker-present",
  "plan-execution-blocker-present",
  "grant-creation-blocker-present",
  "issuance-blocker-present",
  "authority-blocker-present",
  "credential-blocker-present",
  "callback-blocker-present",
  "scheduler-blocker-present",
  "executor-blocker-present",
  "transition-blocker-present",
  "activation-blocker-present",
  "commit-blocker-present",
  "rollback-execution-blocker-present",
  "ownership-transfer-blocker-present",
  "runtime-mutation-blocker-present",
  "dom-mutation-blocker-present",
  "remount-blocker-present",
  "second-geofeed-blocker-present",
  "issuance-plan-completed",
  "issuance-plan-result-valid",
  "issuance-plan-executed-false",
  "issuance-plan-ready",
  "issuance-plan-blocked",
  "issuance-plan-executable-false",
  "would-execute-issuance-plan",
  "issuance-plan-conditions-complete",
  "issuance-plan-conditions-satisfied",
  "issuance-plan-guards-complete",
  "issuance-plan-guards-satisfied",
  "issuance-plan-integrity-blockers-clear",
  "deterministic-pure-issuance-plan-engine",
  "issuance-decision-id-match",
  "grant-readiness-id-match",
  "authorization-decision-id-match",
  "authorization-policy-id-match",
  "grant-policy-id-match",
  "issuance-policy-id-match",
  "preflight-id-match",
  "selection-id-match",
  "graph-id-match",
  "machine-id-match",
  "protocol-id-match",
  "transaction-id-match",
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS = [
  "predecessor-phase-exact-guard",
  "next-phase-exact-guard",
  "contract-version-exact-guard",
  "issuance-decision-exact-guard",
  "grant-readiness-exact-guard",
  "authorization-decision-exact-guard",
  "preflight-exact-guard",
  "selected-transition-exact-guard",
  "source-state-exact-guard",
  "target-state-exact-guard",
  "current-state-exact-guard",
  "current-graph-node-exact-guard",
  "stable-identity-chain-guard",
  "unique-plan-step-ids-guard",
  "contiguous-ordinals-guard",
  "valid-prerequisites-guard",
  "acyclic-metadata-dependency-guard",
  "all-steps-blocked-guard",
  "all-steps-non-executable-guard",
  "all-steps-unapplied-guard",
  "no-grant-guard",
  "no-authority-guard",
  "no-token-guard",
  "no-secret-guard",
  "no-signature-guard",
  "no-callback-guard",
  "no-executable-handle-guard",
  "no-runtime-capability-guard",
  "no-command-guard",
  "no-dispatcher-guard",
  "no-queue-guard",
  "no-scheduler-guard",
  "no-executor-guard",
  "no-transition-authorization-guard",
  "no-transition-execution-guard",
  "no-activation-guard",
  "no-commit-guard",
  "no-rollback-execution-guard",
  "legacy-owner-guard",
  "legacy-writer-guard",
  "legacy-renderer-guard",
  "mount-count-one-guard",
  "unmount-count-zero-guard",
  "one-geofeed-guard",
  "null-shell-guard",
  "stable-runtime-id-guard",
  "stable-host-id-guard",
  "blocker-completeness-guard",
  "issuance-plan-ready-not-executable-guard",
  "plan-execution-impossible-guard",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_PLAN_BLOCKERS = [
  "PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY",
  "PHASE_3B3_20_METADATA_ONLY",
  "PHASE_3B3_20_ISSUANCE_PLAN_EXECUTION_FORBIDDEN",
  "PHASE_3B3_20_ISSUANCE_STAGE_EXECUTION_FORBIDDEN",
  "PHASE_3B3_20_GRANT_CREATION_FORBIDDEN",
  "PHASE_3B3_20_GRANT_MATERIALIZATION_FORBIDDEN",
  "PHASE_3B3_20_GRANT_ISSUANCE_FORBIDDEN",
  "PHASE_3B3_20_GRANT_PERSISTENCE_FORBIDDEN",
  "PHASE_3B3_20_GRANT_APPLICATION_FORBIDDEN",
  "PHASE_3B3_20_GRANT_ACTIVATION_FORBIDDEN",
  "PHASE_3B3_20_GRANT_CONSUMPTION_FORBIDDEN",
  "PHASE_3B3_20_GRANT_REVOCATION_EXECUTION_FORBIDDEN",
  "PHASE_3B3_20_AUTHORITY_CREATION_FORBIDDEN",
  "PHASE_3B3_20_AUTHORITY_ENABLEMENT_FORBIDDEN",
  "PHASE_3B3_20_AUTHORITY_DELEGATION_FORBIDDEN",
  "PHASE_3B3_20_AUTHORITY_TRANSFER_FORBIDDEN",
  "PHASE_3B3_20_TOKEN_FORBIDDEN",
  "PHASE_3B3_20_SECRET_FORBIDDEN",
  "PHASE_3B3_20_SIGNATURE_FORBIDDEN",
  "PHASE_3B3_20_NONCE_FORBIDDEN",
  "PHASE_3B3_20_CREDENTIAL_FORBIDDEN",
  "PHASE_3B3_20_CERTIFICATE_FORBIDDEN",
  "PHASE_3B3_20_PERMIT_FORBIDDEN",
  "PHASE_3B3_20_CALLBACK_FORBIDDEN",
  "PHASE_3B3_20_EXECUTABLE_HANDLE_FORBIDDEN",
  "PHASE_3B3_20_RUNTIME_CAPABILITY_FORBIDDEN",
  "PHASE_3B3_20_COMMAND_FORBIDDEN",
  "PHASE_3B3_20_DISPATCHER_FORBIDDEN",
  "PHASE_3B3_20_QUEUE_FORBIDDEN",
  "PHASE_3B3_20_SCHEDULER_FORBIDDEN",
  "PHASE_3B3_20_EXECUTOR_FORBIDDEN",
  "PHASE_3B3_20_TRANSITION_AUTHORIZATION_FORBIDDEN",
  "PHASE_3B3_20_TRANSITION_EXECUTION_FORBIDDEN",
  "PHASE_3B3_20_ACTIVATION_FORBIDDEN",
  "PHASE_3B3_20_COMMIT_FORBIDDEN",
  "PHASE_3B3_20_ROLLBACK_EXECUTION_FORBIDDEN",
  "PHASE_3B3_20_OWNERSHIP_TRANSFER_FORBIDDEN",
  "PHASE_3B3_20_WRITER_TRANSFER_FORBIDDEN",
  "PHASE_3B3_20_RENDERER_TRANSFER_FORBIDDEN",
  "PHASE_3B3_20_RUNTIME_MUTATION_FORBIDDEN",
  "PHASE_3B3_20_REQUEST_MUTATION_FORBIDDEN",
  "PHASE_3B3_20_CACHE_MUTATION_FORBIDDEN",
  "PHASE_3B3_20_OBSERVER_MUTATION_FORBIDDEN",
  "PHASE_3B3_20_DOM_MUTATION_FORBIDDEN",
  "PHASE_3B3_20_REACT_REMOUNT_FORBIDDEN",
  "PHASE_3B3_20_SECOND_GEOFEED_FORBIDDEN",
  "PHASE_3B3_20_NON_NULL_SHELL_FORBIDDEN",
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_PRECONDITIONS = [
  "exactly-one-registered-host",
  "issuance-decision-eligible-not-issued",
  "grant-readiness-ready-not-issued",
  "authorization-eligible-not-granted",
  "transition-preflight-ready-not-authorized",
  "transition-selected-not-executable",
  "selected-transition-commit-ready-to-active",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "issuance-plan-disabled-by-phase-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_VALIDATION_POINTS = [
  "pre-plan-issuance-decision-complete",
  "pre-plan-issuance-eligible",
  "pre-plan-grant-ready",
  "pre-plan-authorization-eligible",
  "pre-plan-preflight-ready",
  "pre-plan-identity-stable",
  "pre-plan-ownership-legacy",
  "post-plan-ready-not-executable",
  "post-plan-executable-false",
  "post-plan-grant-issued-false",
  "post-plan-authority-unavailable",
  "post-plan-authorized-false",
  "post-plan-executed-false",
  "post-plan-current-state-unchanged",
  "post-plan-current-node-unchanged",
] as const;

export type ControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_SCHEMA_VERSION;
  phase: "3B.3.20";
  previousPhase: "3B.3.19";
  currentPhase: "3B.3.20";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  issuancePlanId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID;
  issuancePlanContractId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_CONTRACT_ID;
  issuancePlanPolicyId: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY;
  issuancePlanVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_VERSION;
  issuancePlanState: ControlledHostActivationTransitionAuthorizationGrantIssuancePlanState;
  issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable";
  issuancePlanCompleted: true;
  issuancePlanExecuted: false;
  issuancePlanReady: true;
  issuancePlanBlocked: true;
  issuancePlanExecutable: false;
  wouldExecuteIssuancePlan: true;
  planSteps: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS;
  planStepCount: number;
  completedPlanStepCount: 0;
  executablePlanStepCount: 0;
  blockedPlanStepCount: number;
  invalidPlanStepCount: 0;
  issuancePlanConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS;
  satisfiedIssuancePlanConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS;
  unsatisfiedIssuancePlanConditions: readonly [];
  issuancePlanGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS;
  satisfiedIssuancePlanGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS;
  unsatisfiedIssuancePlanGuards: readonly [];
  issuancePlanBlockers: typeof CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_PLAN_BLOCKERS;
  issuancePlanPreconditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_PRECONDITIONS;
  issuancePlanValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_VALIDATION_POINTS;
  issuancePlanInvariants: typeof FEED_SEALED_INVARIANT_IDS;
  issuancePlanReason: "issuance-eligible-and-all-plan-prerequisites-satisfied-but-plan-execution-disabled-by-phase-contract";
  issuancePlanStrategy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STRATEGY;
  issuancePlanPolicy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY;
  issuancePlanPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY_VERSION;
  grantIssuanceDecisionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID;
  issuanceDecisionCompleted: true;
  issuanceDecisionExecuted: false;
  issuanceEligible: true;
  issuanceBlocked: true;
  wouldIssueGrant: true;
  issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued";
  issuancePolicy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY;
  issuancePolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY_VERSION;
  issuanceConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS;
  issuanceGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS;
  grantReadinessId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID;
  grantReadinessResult: "authorization-grant-ready-not-issued";
  grantReadinessCompleted: true;
  grantReadinessExecuted: false;
  grantReady: true;
  grantBlocked: true;
  grantPolicy: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY;
  grantPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION;
  authorizationDecisionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID;
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
  authorizationPolicy: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY;
  authorizationPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION;
  selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  sourceState: "COMMIT_READY";
  targetState: "ACTIVE";
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  preflightResult: "transition-preflight-ready-not-authorized";
  preflightCompleted: true;
  preflightReady: true;
  preflightBlocked: true;
  preflightExecuted: false;
  failedPreflightChecks: readonly [];
  warningPreflightChecks: readonly [];
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  currentGraphNode: "COMMIT_READY";
  sourceStateValid: true;
  targetStateValid: true;
  edgeValid: true;
  transitionIdentityValid: true;
  authorizationDecisionIdentityValid: true;
  grantReadinessIdentityValid: true;
  issuanceDecisionIdentityValid: true;
  issuancePlanIdentityValid: true;
  preflightIdentityValid: true;
  selectionIdentityValid: true;
  graphIdentityValid: true;
  machineIdentityValid: true;
  protocolIdentityValid: true;
  transactionIdentityValid: true;
  hostIdentityValid: true;
  runtimeIdentityValid: true;
  authorizationPolicyIdentityValid: true;
  grantPolicyIdentityValid: true;
  issuancePolicyIdentityValid: true;
  issuancePlanPolicyIdentityValid: true;
  ownershipInvariantValid: true;
  writerInvariantValid: true;
  rendererInvariantValid: true;
  lifecycleInvariantValid: true;
  sealedRuntimeInvariantValid: true;
  rollbackPrepared: true;
  rollbackAvailable: true;
  transitionExecutionAllowed: false;
  graphTraversalAllowed: false;
  selectionExecutionAllowed: false;
  preflightExecutionAllowed: false;
  grantReadinessExecutionAllowed: false;
  issuanceDecisionExecutionAllowed: false;
  issuancePlanExecutionAllowed: false;
  issuanceExecutionAllowed: false;
  grantExecutionAllowed: false;
  activationExecutionAllowed: false;
  authorizationGrantAllowed: false;
  authorizationApplicationAllowed: false;
  transitionAuthorizationAllowed: false;
  commitAllowed: false;
  rollbackAllowed: false;
  executorAllowed: false;
  schedulerAllowed: false;
  canStartActivation: false;
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  ownershipTransferAllowed: false;
  writerTransferAllowed: false;
  rendererTransferAllowed: false;
  runtimeMutationAllowed: false;
  domMutationAllowed: false;
  reactRemountAllowed: false;
  secondGeofeedAllowed: false;
  activationState: "dormant";
  transitionExecuted: false;
  graphTraversalExecuted: false;
  selectionExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  commitExecuted: false;
  rollbackExecuted: false;
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  selectionResult: "transition-selected-not-executable";
  graphResult: "transition-graph-complete-not-executable";
  machineResult: "state-machine-complete-not-executable";
  protocolResult: "protocol-complete-not-executable";
  readinessResult: "commit-ready-not-executable";
  transactionResult: "transaction-complete-not-committed";
  pipelineResult: "pipeline-complete-not-executable";
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  wouldActivate: true;
  wouldCommit: true;
  commitReady: true;
  preflightId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID;
  selectionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID;
  graphId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID;
  machineId: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID;
  protocolId: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID;
  transactionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID;
  grantIssuancePlanId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID;
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
  authorityProviderPresent: false;
  issuanceServicePresent: false;
  issuancePlanExecutionImpossible: true;
  issuanceImpossible: true;
  authorityImpossible: true;
  executionImpossible: true;
  mountCount: 1;
  unmountCount: 0;
  geoFeedRenderCount: 1;
  activeInstanceCount: 1;
  shellRendered: false;
  shellChildCount: 0;
  shellDOMNodeCount: 0;
  nextEligibleStep: "3B.3.21";
  activationBlocker: typeof PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY;
};

export type ControlledHostActivationTransitionAuthorizationGrantIssuancePlanDiagnostics = {
  issuancePlanCompleted: true;
  issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable";
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
  planSteps: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS;
  issuancePlanConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS;
  satisfiedIssuancePlanConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS;
  unsatisfiedIssuancePlanConditions: readonly [];
  issuancePlanGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS;
  satisfiedIssuancePlanGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS;
  unsatisfiedIssuancePlanGuards: readonly [];
  issuancePlanBlockers: typeof CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_PLAN_BLOCKERS;
  issuancePlanPreconditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_PRECONDITIONS;
  issuancePlanValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_VALIDATION_POINTS;
  issuancePlanReason: "issuance-eligible-and-all-plan-prerequisites-satisfied-but-plan-execution-disabled-by-phase-contract";
  issuancePlanStrategy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STRATEGY;
  issuancePlanPolicy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY;
  issuancePlanPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY_VERSION;
  issuanceDecisionCompleted: true;
  issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued";
  issuanceDecisionExecuted: false;
  issuanceEligible: true;
  issuanceBlocked: true;
  wouldIssueGrant: true;
  grantReadinessCompleted: true;
  grantReadinessResult: "authorization-grant-ready-not-issued";
  grantReady: true;
  grantBlocked: true;
  authorizationDecisionCompleted: true;
  authorizationDecisionResult: "authorization-eligible-not-granted";
  authorizationEligible: true;
  authorizationBlocked: true;
  authorizationGranted: false;
  authorizationApplied: false;
  transitionAuthorized: false;
  selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  sourceState: "COMMIT_READY";
  targetState: "ACTIVE";
  preflightCompleted: true;
  preflightReady: true;
  preflightBlocked: true;
  preflightResult: "transition-preflight-ready-not-authorized";
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  currentGraphNode: "COMMIT_READY";
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
  authorityProviderPresent: false;
  issuanceServicePresent: false;
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
  transactionCommitted: false;
  commitExecuted: false;
  rollbackExecuted: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  issuancePlanExecutionImpossible: true;
  issuanceImpossible: true;
  authorityImpossible: true;
  executionImpossible: true;
  currentPhase: "3B.3.20";
  previousPhase: "3B.3.19";
  nextEligibleStep: "3B.3.21";
  activeBlockers: readonly [
    typeof PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY,
  ];
  conditionCount: number;
  satisfiedConditionCount: number;
  unsatisfiedConditionCount: 0;
  guardCount: number;
  satisfiedGuardCount: number;
  unsatisfiedGuardCount: 0;
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  writerLegacy: true;
  rendererLegacy: true;
  currentStateUnchanged: true;
  currentNodeUnchanged: true;
  mountCount: 1;
  unmountCount: 0;
  geoFeedRenderCount: 1;
  activeInstanceCount: 1;
  shellRendered: false;
  shellChildCount: 0;
  shellDOMNodeCount: 0;
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  machineId: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID;
  graphId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID;
  selectionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID;
  preflightId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID;
  authorizationDecisionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID;
  grantReadinessId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID;
  grantIssuanceDecisionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID;
  grantIssuancePlanId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID;
  authorizationPolicyId: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY;
  grantPolicyId: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY;
  issuancePolicyId: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY;
  issuancePlanPolicyId: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY;
  protocolId: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID;
  transactionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID;
};

export type ControlledHostActivationTransitionAuthorizationGrantIssuancePlanEvaluation = {
  descriptor: ControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor;
  diagnostics: ControlledHostActivationTransitionAuthorizationGrantIssuancePlanDiagnostics;
};

function assertUnique(ids: readonly string[], code: string) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new HardContractViolation(code, `Duplicate id: ${id}`);
    }
    seen.add(id);
  }
}

function assertPlanStructure() {
  assertUnique(
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS.map((s) => s.stepId),
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DUPLICATE_STEP",
  );
  assertUnique(
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DUPLICATE_CONDITION",
  );
  assertUnique(
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DUPLICATE_GUARD",
  );
  assertUnique(
    CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_PLAN_BLOCKERS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DUPLICATE_BLOCKER",
  );
  const byId = new Map(
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS.map((s) => [s.stepId, s]),
  );
  for (let i = 0; i < CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS.length; i += 1) {
    const step = CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS[i];
    if (step.ordinal !== i + 1) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ORDINAL",
        `Plan ordinal must be contiguous; expected ${i + 1} got ${step.ordinal}`,
      );
    }
    if (
      step.executable !== false ||
      step.executionAllowed !== false ||
      step.applied !== false ||
      step.completed !== false ||
      step.blocked !== true
    ) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_STEP_FLAGS",
        `Plan step ${step.stepId} must remain blocked and non-executable`,
      );
    }
    for (const prereq of step.prerequisiteIds) {
      if (!byId.has(prereq)) {
        throw new HardContractViolation(
          "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_PREREQ",
          `Unknown prerequisite ${prereq} for ${step.stepId}`,
        );
      }
      if (byId.get(prereq)!.ordinal >= step.ordinal) {
        throw new HardContractViolation(
          "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_CYCLE",
          `Prerequisite ${prereq} must precede ${step.stepId}`,
        );
      }
    }
  }
  const last =
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS[
      CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS.length - 1
    ];
  if (last.stepId !== "declare-plan-complete-but-non-executable") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_FINAL_STEP",
      "Final plan step must declare plan complete but non-executable",
    );
  }
}

/**
 * Pure issuance-plan engine — deterministic, no side effects.
 * Plan may be ready; plan execution and grant issuance remain permanently false.
 */
export function evaluateControlledHostActivationTransitionAuthorizationGrantIssuancePlan(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationTransitionAuthorizationGrantIssuancePlanEvaluation {
  void createFeedHostRollbackContract();
  const issuance =
    evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceDecision(
      registry,
    );
  assertPlanStructure();

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_HOST_COUNT",
      "Grant issuance plan requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_IDS",
      "Grant issuance plan requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_OWNERSHIP",
      "Grant issuance plan requires legacy owner/writer/renderer",
    );
  }
  const d = issuance.descriptor;
  if (
    d.issuanceDecisionCompleted !== true ||
    d.issuanceEligible !== true ||
    d.issuanceBlocked !== true ||
    d.wouldIssueGrant !== true ||
    d.issuanceDecisionResult !==
      "authorization-grant-issuance-eligible-not-issued" ||
    d.issuanceDecisionExecuted !== false ||
    d.grantIssued !== false ||
    d.grantCreated !== false ||
    d.grantMaterialized !== false ||
    d.grantPersisted !== false ||
    d.grantApplied !== false ||
    d.grantAuthorityAvailable !== false ||
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
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_PREDECESSOR",
      "Grant issuance plan requires sealed issuance-eligible-not-issued decision",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ACTIVATION",
      "Grant issuance plan forbids host/render activation",
    );
  }

  const descriptor =
    createControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor();
  return {
    descriptor,
    diagnostics: buildDiagnostics(descriptor),
  };
}

function buildDiagnostics(
  descriptor: ControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor,
): ControlledHostActivationTransitionAuthorizationGrantIssuancePlanDiagnostics {
  return {
    issuancePlanCompleted: true,
    issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable",
    issuancePlanExecuted: false,
    issuancePlanReady: true,
    issuancePlanBlocked: true,
    issuancePlanExecutable: false,
    wouldExecuteIssuancePlan: true,
    planStepCount: descriptor.planStepCount,
    completedPlanStepCount: 0,
    executablePlanStepCount: 0,
    blockedPlanStepCount: descriptor.blockedPlanStepCount,
    invalidPlanStepCount: 0,
    planSteps: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS,
    issuancePlanConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS,
    satisfiedIssuancePlanConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS,
    unsatisfiedIssuancePlanConditions: [],
    issuancePlanGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS,
    satisfiedIssuancePlanGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS,
    unsatisfiedIssuancePlanGuards: [],
    issuancePlanBlockers: CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_PLAN_BLOCKERS,
    issuancePlanPreconditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_PRECONDITIONS,
    issuancePlanValidationPoints: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_VALIDATION_POINTS,
    issuancePlanReason:
      "issuance-eligible-and-all-plan-prerequisites-satisfied-but-plan-execution-disabled-by-phase-contract",
    issuancePlanStrategy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STRATEGY,
    issuancePlanPolicy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY,
    issuancePlanPolicyVersion: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY_VERSION,
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
    authorityProviderPresent: false,
    issuanceServicePresent: false,
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
    transactionCommitted: false,
    commitExecuted: false,
    rollbackExecuted: false,
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    issuancePlanExecutionImpossible: true,
    issuanceImpossible: true,
    authorityImpossible: true,
    executionImpossible: true,
    currentPhase: "3B.3.20",
    previousPhase: "3B.3.19",
    nextEligibleStep: "3B.3.21",
    activeBlockers: [
      PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY,
    ],
    conditionCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS.length,
    satisfiedConditionCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS.length,
    unsatisfiedConditionCount: 0,
    guardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS.length,
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
    authorizationPolicyId: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
    grantPolicyId: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
    issuancePolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
    issuancePlanPolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY,
    protocolId: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID,
    transactionId: CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID,
  };
}

export function createControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor(): ControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor {
  assertPlanStructure();
  const stepCount = CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS.length;
  return validateControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_SCHEMA_VERSION,
    phase: "3B.3.20",
    previousPhase: "3B.3.19",
    currentPhase: "3B.3.20",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    issuancePlanId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID,
    issuancePlanContractId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_CONTRACT_ID,
    issuancePlanPolicyId: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY,
    issuancePlanVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_VERSION,
    issuancePlanState: "completed",
    issuancePlanResult: "authorization-grant-issuance-plan-ready-not-executable",
    issuancePlanCompleted: true,
    issuancePlanExecuted: false,
    issuancePlanReady: true,
    issuancePlanBlocked: true,
    issuancePlanExecutable: false,
    wouldExecuteIssuancePlan: true,
    planSteps: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STEPS,
    planStepCount: stepCount,
    completedPlanStepCount: 0,
    executablePlanStepCount: 0,
    blockedPlanStepCount: stepCount,
    invalidPlanStepCount: 0,
    issuancePlanConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS,
    satisfiedIssuancePlanConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_CONDITIONS,
    unsatisfiedIssuancePlanConditions: [],
    issuancePlanGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS,
    satisfiedIssuancePlanGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_GUARDS,
    unsatisfiedIssuancePlanGuards: [],
    issuancePlanBlockers: CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_PLAN_BLOCKERS,
    issuancePlanPreconditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_PRECONDITIONS,
    issuancePlanValidationPoints: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_VALIDATION_POINTS,
    issuancePlanInvariants: FEED_SEALED_INVARIANT_IDS,
    issuancePlanReason: "issuance-eligible-and-all-plan-prerequisites-satisfied-but-plan-execution-disabled-by-phase-contract",
    issuancePlanStrategy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_STRATEGY,
    issuancePlanPolicy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY,
    issuancePlanPolicyVersion: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PLAN_POLICY_VERSION,
    grantIssuanceDecisionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID,
    issuanceDecisionCompleted: true,
    issuanceDecisionExecuted: false,
    issuanceEligible: true,
    issuanceBlocked: true,
    wouldIssueGrant: true,
    issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued",
    issuancePolicy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
    issuancePolicyVersion: CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY_VERSION,
    issuanceConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS,
    issuanceGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS,
    grantReadinessId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID,
    grantReadinessResult: "authorization-grant-ready-not-issued",
    grantReadinessCompleted: true,
    grantReadinessExecuted: false,
    grantReady: true,
    grantBlocked: true,
    grantPolicy: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
    grantPolicyVersion: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION,
    authorizationDecisionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID,
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
    authorizationPolicy: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
    authorizationPolicyVersion: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION,
    selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
    selectedTransitionId: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
    sourceState: "COMMIT_READY",
    targetState: "ACTIVE",
    selectedFromState: "COMMIT_READY",
    selectedToState: "ACTIVE",
    preflightResult: "transition-preflight-ready-not-authorized",
    preflightCompleted: true,
    preflightReady: true,
    preflightBlocked: true,
    preflightExecuted: false,
    failedPreflightChecks: [],
    warningPreflightChecks: [],
    currentState: "COMMIT_READY",
    currentNode: "COMMIT_READY",
    currentGraphNode: "COMMIT_READY",
    sourceStateValid: true,
    targetStateValid: true,
    edgeValid: true,
    transitionIdentityValid: true,
    authorizationDecisionIdentityValid: true,
    grantReadinessIdentityValid: true,
    issuanceDecisionIdentityValid: true,
    issuancePlanIdentityValid: true,
    preflightIdentityValid: true,
    selectionIdentityValid: true,
    graphIdentityValid: true,
    machineIdentityValid: true,
    protocolIdentityValid: true,
    transactionIdentityValid: true,
    hostIdentityValid: true,
    runtimeIdentityValid: true,
    authorizationPolicyIdentityValid: true,
    grantPolicyIdentityValid: true,
    issuancePolicyIdentityValid: true,
    issuancePlanPolicyIdentityValid: true,
    ownershipInvariantValid: true,
    writerInvariantValid: true,
    rendererInvariantValid: true,
    lifecycleInvariantValid: true,
    sealedRuntimeInvariantValid: true,
    rollbackPrepared: true,
    rollbackAvailable: true,
    transitionExecutionAllowed: false,
    graphTraversalAllowed: false,
    selectionExecutionAllowed: false,
    preflightExecutionAllowed: false,
    grantReadinessExecutionAllowed: false,
    issuanceDecisionExecutionAllowed: false,
    issuancePlanExecutionAllowed: false,
    issuanceExecutionAllowed: false,
    grantExecutionAllowed: false,
    activationExecutionAllowed: false,
    authorizationGrantAllowed: false,
    authorizationApplicationAllowed: false,
    transitionAuthorizationAllowed: false,
    commitAllowed: false,
    rollbackAllowed: false,
    executorAllowed: false,
    schedulerAllowed: false,
    canStartActivation: false,
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    runtimeMutationAllowed: false,
    domMutationAllowed: false,
    reactRemountAllowed: false,
    secondGeofeedAllowed: false,
    activationState: "dormant",
    transitionExecuted: false,
    graphTraversalExecuted: false,
    selectionExecuted: false,
    protocolExecuted: false,
    transactionCommitted: false,
    commitExecuted: false,
    rollbackExecuted: false,
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    selectionResult: "transition-selected-not-executable",
    graphResult: "transition-graph-complete-not-executable",
    machineResult: "state-machine-complete-not-executable",
    protocolResult: "protocol-complete-not-executable",
    readinessResult: "commit-ready-not-executable",
    transactionResult: "transaction-complete-not-committed",
    pipelineResult: "pipeline-complete-not-executable",
    planResult: "plan-complete-not-executable",
    decisionResult: "ALLOW",
    wouldActivate: true,
    wouldCommit: true,
    commitReady: true,
    preflightId: CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID,
    selectionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
    graphId: CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID,
    machineId: CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID,
    protocolId: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID,
    transactionId: CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID,
    grantIssuancePlanId: CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ID,
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
    authorityProviderPresent: false,
    issuanceServicePresent: false,
    issuancePlanExecutionImpossible: true,
    issuanceImpossible: true,
    authorityImpossible: true,
    executionImpossible: true,
    mountCount: 1,
    unmountCount: 0,
    geoFeedRenderCount: 1,
    activeInstanceCount: 1,
    shellRendered: false,
    shellChildCount: 0,
    shellDOMNodeCount: 0,
    nextEligibleStep: "3B.3.21",
    activationBlocker: PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY,
  });
}

export function validateControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor(
  candidate: unknown,
): ControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_INVALID",
      "Grant issuance plan descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_SCHEMA",
      "Unsupported issuance plan schemaVersion",
    );
  }
  if (c.phase !== "3B.3.20" || c.previousPhase !== "3B.3.19" || c.currentPhase !== "3B.3.20") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_PHASE",
      "phase chain must be 3B.3.19 -> 3B.3.20",
    );
  }
  if (c.issuancePlanResult !== "authorization-grant-issuance-plan-ready-not-executable") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_RESULT",
      "issuancePlanResult must be authorization-grant-issuance-plan-ready-not-executable",
    );
  }
  if (
    c.issuancePlanCompleted !== true ||
    c.issuancePlanReady !== true ||
    c.issuancePlanBlocked !== true ||
    c.issuancePlanExecutable !== false ||
    c.wouldExecuteIssuancePlan !== true ||
    c.issuancePlanExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_FLAGS",
      "Issuance plan must be ready-blocked-not-executable",
    );
  }
  if (c.nextEligibleStep !== "3B.3.21") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_NEXT",
      "nextEligibleStep must be 3B.3.21",
    );
  }
  for (const key of [
    "grantIssued","grantCreated","grantMaterialized","grantPersisted","grantApplied","grantActivated","grantConsumed","grantRevoked",
    "grantAuthorityAvailable","grantAuthorityEnabled","grantAuthorityDelegated","grantAuthorityTransferred",
    "authorizationGranted","authorizationApplied","transitionAuthorized","transitionExecuted",
    "issuancePlanExecutionAllowed","issuanceExecutionAllowed","grantExecutionAllowed","authorizationExecutionAllowed","activationExecutionAllowed","transitionExecutionAllowed",
    "protocolExecuted","transactionCommitted","commitExecuted","rollbackExecuted","schedulerAllowed","executorAllowed","canStartActivation",
    "ownershipTransferred","writerTransferred","rendererTransferred",
    "tokenPresent","secretPresent","signaturePresent","noncePresent","credentialPresent","certificatePresent","permitPresent",
    "callbackPresent","executableHandlePresent","runtimeCapabilityPresent","commandPresent","dispatcherPresent","queuePresent",
    "authorityProviderPresent","issuanceServicePresent","hostActivation","renderActivation","shellRendered",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_ABSENCE",
        `${key} must be false`,
      );
    }
  }
  for (const key of [
    "issuancePlanExecutionImpossible","issuanceImpossible","authorityImpossible","executionImpossible",
  ] as const) {
    if (c[key] !== true) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_IMPOSSIBLE",
        `${key} must be true`,
      );
    }
  }
  if (c.owner !== "legacy" || c.writer !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_OWNER",
      "owner/writer/renderer must be legacy",
    );
  }
  if (
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY" ||
    c.currentGraphNode !== "COMMIT_READY" ||
    c.selectedTransition !== "COMMIT_READY->ACTIVE" ||
    c.sourceState !== "COMMIT_READY" ||
    c.targetState !== "ACTIVE"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_STATE",
      "state/graph/selection must remain COMMIT_READY metadata",
    );
  }
  if (c.mountCount !== 1 || c.unmountCount !== 0 || c.activeInstanceCount !== 1 || c.geoFeedRenderCount !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_MOUNT",
      "mount/unmount/instance counts must stay sealed",
    );
  }
  if (c.shellChildCount !== 0 || c.shellDOMNodeCount !== 0) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_SHELL",
      "shell must remain null with zero children/nodes",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_DESCRIPTOR_BLOCKER",
      "activationBlocker must be PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY",
    );
  }
  return c as ControlledHostActivationTransitionAuthorizationGrantIssuancePlanDescriptor;
}

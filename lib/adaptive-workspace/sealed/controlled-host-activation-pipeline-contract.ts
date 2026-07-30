/**
 * Phase 3B.3.9 — Controlled Host Activation Pipeline Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES,
  evaluateControlledHostActivationPipeline,
} from "./controlled-host-activation-pipeline";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_REQUIREMENTS = [
  "exactly-one-registered-host",
  "stable-runtime-id",
  "preserve-react-identity",
  "owner-legacy",
  "writer-legacy",
  "renderer-legacy",
  "host-activation-false",
  "render-activation-false",
  "can-start-activation-false",
  "rollback-prepared-not-active",
  "registration-registered",
  "placement-shadow-registered",
  "eligibility-eligible",
  "readiness-ready",
  "simulation-completed",
  "decision-allow",
  "plan-complete-not-executable",
  "activation-pipeline-metadata-only",
  "activation-pipeline-diagnostics-readable",
  "deterministic-pure-pipeline-engine",
  "pipeline-only-no-executor-no-scheduler",
  "no-pipeline-stage-may-execute",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationPipelineRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_REQUIREMENTS)[number];

export type ControlledHostActivationPipelineContract = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.9";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  pipelineState: "completed";
  pipelineResult: "pipeline-complete-not-executable";
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  wouldActivate: true;
  stageCount: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length;
  pipelineRequirements: readonly ControlledHostActivationPipelineRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY;
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
  stageExecutionAllowed: false;
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.10";
};

export function createControlledHostActivationPipelineContract(): ControlledHostActivationPipelineContract {
  void evaluateControlledHostActivationPipeline();
  return validateControlledHostActivationPipelineContract({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_PIPELINE_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.9",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    pipelineState: "completed",
    pipelineResult: "pipeline-complete-not-executable",
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    wouldActivate: true,
    stageCount: CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length,
    pipelineRequirements: [
      ...CONTROLLED_HOST_ACTIVATION_PIPELINE_REQUIREMENTS,
    ],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction: PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
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
    stageExecutionAllowed: false,
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.10",
  });
}

export function validateControlledHostActivationPipelineContract(
  candidate: unknown,
): ControlledHostActivationPipelineContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_INVALID",
      "Activation pipeline contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_PIPELINE_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_SCHEMA",
      "Unsupported activation pipeline contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.9" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_PHASE",
      "phase must be 3B.3.9 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_IDS",
      "hostId/runtimeId must match stable legacy descriptors",
    );
  }
  if (
    c.pipelineState !== "completed" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.wouldActivate !== true ||
    c.stageCount !== CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_STATE",
      "pipeline/decision/plan/wouldActivate/stageCount mismatch",
    );
  }
  if (!Array.isArray(c.pipelineRequirements)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_REQUIREMENTS",
      "pipelineRequirements must be an array",
    );
  }
  for (const req of CONTROLLED_HOST_ACTIVATION_PIPELINE_REQUIREMENTS) {
    if (!(c.pipelineRequirements as string[]).includes(req)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_REQUIREMENT_MISSING",
        `Missing requirement: ${req}`,
      );
    }
  }
  if (c.identityGuarantee !== "preserve-existing-react-identity") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_IDENTITY",
      "identityGuarantee must preserve existing React identity",
    );
  }
  if (c.ownershipGuarantee !== "legacy-owner-writer-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_OWNERSHIP",
      "ownershipGuarantee must keep legacy owner/writer/renderer",
    );
  }
  if (c.rendererGuarantee !== "no-workspace-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_RENDERER",
      "rendererGuarantee must forbid workspace renderer",
    );
  }
  if (c.rollbackGuarantee !== "prepared-not-active-legacy-fallback") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_ROLLBACK",
      "rollbackGuarantee must remain prepared-not-active legacy fallback",
    );
  }
  if (c.activationRestriction !== PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_ACTIVATION",
      "activationRestriction must be PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_FLAGS",
      "activation flags must remain false",
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
    "stageExecutionAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  if (
    !Array.isArray(c.requiredInvariantIds) ||
    (c.requiredInvariantIds as string[]).length !==
      FEED_SEALED_INVARIANT_IDS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_INVARIANTS",
      "requiredInvariantIds must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.10") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.10",
    );
  }
  return c as ControlledHostActivationPipelineContract;
}

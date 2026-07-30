/**
 * Phase 3B.3.6 readiness / freeze-for-next-step contract after shadow simulation.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_SHADOW_ACTIVATION_SIMULATION_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostShadowActivationSimulationPreparedContract = {
  schemaVersion: typeof FEED_HOST_SHADOW_ACTIVATION_SIMULATION_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.6";
  status: "host-shadow-activation-simulation-prepared";
  simulationContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
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
  nextEligibleStep: "3B.3.7";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostShadowActivationSimulationPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
}): FeedHostShadowActivationSimulationPreparedContract {
  return validateFeedHostShadowActivationSimulationPreparedContract({
    schemaVersion:
      FEED_HOST_SHADOW_ACTIVATION_SIMULATION_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.6",
    status: "host-shadow-activation-simulation-prepared",
    simulationContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
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
    nextEligibleStep: "3B.3.7",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostShadowActivationSimulationPreparedContract(
  candidate: unknown,
): FeedHostShadowActivationSimulationPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_SHADOW_ACTIVATION_SIMULATION_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.6" ||
    c.status !== "host-shadow-activation-simulation-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.6",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_ACTIVATION",
      "activation flags must be false",
    );
  }
  if (c.wouldActivate !== true) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_WOULD",
      "wouldActivate must be true for satisfied dry-run intent",
    );
  }
  if (
    c.writer !== "legacy" ||
    c.owner !== "legacy" ||
    c.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.7") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.7",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_MIGRATION",
      "migration/executor/scheduler/runtime mutation must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostShadowActivationSimulationPreparedContract;
}

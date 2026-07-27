/**
 * Phase 3B.3.1 — controlled host contract / gate / rollback / plan unit tests.
 */
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createControlledFeedHostContract,
  validateControlledFeedHostContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_1_DORMANT_HOST_ONLY,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY,
  createFeedHostRollbackContract,
  validateFeedHostRollbackContract,
  createControlledFeedHostPlan,
  createFeedDormantHostReadinessContract,
  validateFeedDormantHostReadinessContract,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
  FEED_HOST_ROLLBACK_TRIGGER_TYPES,
} from "../index";
import FeedControlledHostShell from "@/components/adaptive-workspace/FeedControlledHostShell";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b31] controlled host contract");

{
  const a = createControlledFeedHostContract();
  const b = createControlledFeedHostContract();
  assert.equal(a.hostActivation, false);
  assert.equal(a.renderActivation, false);
  assert.equal(a.shadowActivation, true);
  assert.equal(a.activeRenderOwner, "legacy");
  assert.equal(a.activeWriter, "legacy");
  assert.equal(a.nextEligibleStep, "3B.3.40");
  assert.equal(a.hostClassification, "controlled-host-candidate");
  assert.equal(a.runtimeClassification, "sealed-runtime");
  assert.equal(stableStringify(a), stableStringify(b));
  assert.equal(
    Object.values(a).some((v) => typeof v === "function"),
    false,
  );
  ok("valid dormant contract deterministic + serializable");
}

{
  const base = createControlledFeedHostContract();
  assert.throws(
    () => validateControlledFeedHostContract({ ...base, hostActivation: true }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({ ...base, renderActivation: true }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({
        ...base,
        activeWriter: "workspace",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({
        ...base,
        activeRenderOwner: "workspace",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({
        ...base,
        fallbackOwner: "workspace",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({
        ...base,
        mountingStrategy: "remount-allowed",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({
        ...base,
        identityStrategy: "new-host-key-allowed",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({
        ...base,
        wrapperPolicy: "visible-wrapper-allowed",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({
        ...base,
        childPolicy: "dormant-child-allowed",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({
        ...base,
        nextEligibleStep: "3B.3.7",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostContract({
        ...base,
        requiredInvariantIds: [],
      }),
    HardContractViolation,
  );
  ok("invalid contracts fail closed");
}

console.log("\n[phase3b31] activation gate");

{
  const gate = evaluateFeedHostActivationGate({
    phase3b2ProofValid: true,
    phase3b2FreezeValid: true,
    forceHostActivation: true,
    envHostActivation: "1",
    queryHostActivation: "on",
    cookieHostActivation: "1",
    localStorageHostActivation: "true",
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
  });
  assert.equal(gate.allowed, false);
  assert.ok(gate.blockers.includes(PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY));
  assert.ok(gate.blockers.includes(PHASE_3B3_1_DORMANT_HOST_ONLY) === false);
  assert.equal(gate.currentStep, "3B.3.39");
  assert.equal(gate.eligibleStep, "3B.3.40");
  ok("gate always denied; force/env/query/cookie/storage ignored");
}

{
  const bad = evaluateFeedHostActivationGate({
    phase3b2ProofValid: false,
    phase3b2FreezeValid: false,
    observedWriter: "workspace",
    observedRenderOwner: "workspace",
    observedMountCount: 2,
    observedRollbackTarget: "workspace",
  });
  assert.equal(bad.allowed, false);
  assert.ok(bad.blockers.includes(PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY));
  assert.ok(bad.blockers.includes("active-workspace-writer"));
  assert.ok(bad.blockers.includes("active-workspace-renderer"));
  assert.ok(bad.blockers.includes("second-geofeed-mount"));
  assert.ok(bad.blockers.includes("missing-rollback-route"));
  ok("mismatches add blockers; still denied");
}

console.log("\n[phase3b31] rollback + plan + readiness");

{
  const r = createFeedHostRollbackContract();
  assert.equal(r.rollbackTarget, "legacy");
  assert.equal(r.fallbackWriter, "legacy");
  assert.equal(r.fallbackMountOwner, "legacy");
  assert.equal(r.rollbackReadiness, "prepared-not-active");
  assert.equal(r.rollbackTriggerTypes.length, FEED_HOST_ROLLBACK_TRIGGER_TYPES.length);
  assert.throws(
    () =>
      validateFeedHostRollbackContract({
        ...r,
        fallbackWriter: "workspace",
      }),
    HardContractViolation,
  );
  ok("rollback foundation prepared-not-active + fail-closed");
}

{
  const plan = createControlledFeedHostPlan();
  assert.equal(plan.activationState, "dormant");
  assert.equal(plan.currentOwner, "legacy");
  assert.equal(plan.hostActivation, false);
  assert.equal(
    plan.recommendedNextStep,
    "3B.3.40-controlled-workspace-host-activation",
  );
  assert.equal(plan.placementState, "shadow-registered");
  assert.equal(plan.registrationState, "registered");
  assert.equal(plan.eligibilityState, "eligible");
  assert.equal(typeof plan, "object");
  assert.equal("$$typeof" in plan, false);
  ok("host plan metadata only");
}

{
  const ready = createFeedDormantHostReadinessContract({
    evidenceCommit: "ab66dbeabcdef",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b3/phase3b3-1-feed-dormant-host-proof.json",
  });
  assert.equal(ready.status, "dormant-host-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.2");
  assert.throws(
    () =>
      validateFeedDormantHostReadinessContract({
        ...ready,
        hostActivation: true,
      }),
    HardContractViolation,
  );
  ok("readiness contract valid + fail-closed");
}

console.log("\n[phase3b31] dormant shell + manifest metadata");

{
  const contract = createControlledFeedHostContract();
  const html = renderToStaticMarkup(
    createElement(FeedControlledHostShell, { contract }),
  );
  assert.equal(html, "");
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.hostActivation, false);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.rendererRegistered, false);
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.childFactoryRegistered,
    false,
  );
  ok("shell renders null; metadata has no renderer/child factory");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.1 dormant host: ${passed} assertions ok\n`,
);

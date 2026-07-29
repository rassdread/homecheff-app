import { PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY } from "../sealed/controlled-workspace-host-candidate-active";
import { PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY,
  PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY } from "../sealed/controlled-workspace-host-candidate-activation";
/**
 * Phase 3B.3.26 — controlled workspace host activation readiness unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostActivationReadinessDescriptor,
  evaluateControlledWorkspaceHostActivationReadiness,
  validateControlledWorkspaceHostActivationReadinessDescriptor,
  createControlledWorkspaceHostActivationReadinessContract,
  validateControlledWorkspaceHostActivationReadinessContract,
  createFeedWorkspaceHostActivationReadinessIdentity,
  validateFeedWorkspaceHostActivationReadinessIdentity,
  createFeedWorkspaceHostActivationReadinessPreparedContract,
  validateFeedWorkspaceHostActivationReadinessPreparedContract,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKERS,
  PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";

import {
  PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY,
} from "../sealed/controlled-workspace-host-candidate-activation-readiness";
import {
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
} from "../sealed/controlled-workspace-host-candidate-activation-authorization";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b326] activation readiness descriptor + engine");

{
  const a = createControlledWorkspaceHostActivationReadinessDescriptor();
  const b = createControlledWorkspaceHostActivationReadinessDescriptor();
  assert.equal(a.currentPhase, "3B.3.26");
  assert.equal(a.previousPhase, "3B.3.25");
  assert.equal(a.nextEligibleStep, "3B.3.27");
  assert.equal(
    a.activationReadinessResult,
    "controlled-workspace-host-activation-ready-not-authorized",
  );
  assert.equal(a.activationReadinessState, "READY_NOT_AUTHORIZED");
  assert.equal(a.candidateId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID);
  assert.equal(a.registrationId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID);
  assert.equal(a.selectionId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID);
  assert.equal(a.activationReadinessId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID);
  assert.equal(
    a.activationReadinessContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
  );
  assert.equal(a.candidateCount, 1);
  assert.equal(a.registeredCandidateCount, 1);
  assert.equal(a.selectedCandidateCount, 1);
  assert.equal(a.futureActivationTargetCount, 1);
  assert.equal(a.activeCandidateCount, 0);
  assert.equal(a.candidateSelected, true);
  assert.equal(a.candidateReady, true);
  assert.equal(a.candidateAuthorized, false);
  assert.equal(a.candidateGranted, false);
  assert.equal(a.candidateActivated, false);
  assert.equal(a.candidateActive, false);
  assert.equal(a.candidateExecutable, false);
  assert.equal(a.activationReadinessExecutable, false);
  assert.equal(a.futureActivationPossible, true);
  assert.equal(a.futureActivationAuthorized, false);
  assert.equal(a.predecessorCandidateSelectionState, "SELECTED_NOT_ACTIVATED");
  assert.equal(a.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(a.issuanceTransactionState, "NOT_OPENED");
  assert.equal(a.issuancePipelineExecutable, false);
  assert.equal(a.owner, "legacy");
  assert.equal(a.writer, "legacy");
  assert.equal(a.renderer, "legacy");
  assert.equal(a.mountCount, 1);
  assert.equal(a.shellRendered, false);
  assert.equal(a.runtimeCapabilityPresent, false);
  assert.equal(a.runtimeHostInstancePresent, false);
  assert.equal(a.activationHandlePresent, false);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic readiness descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationReadiness();
  const d = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.26");
  assert.equal(d.candidateSelected, true);
  assert.equal(d.candidateReady, true);
  assert.equal(d.candidateAuthorized, false);
  assert.equal(d.candidateActivated, false);
  assert.equal(d.selectedCandidateCount, 1);
  assert.equal(d.futureActivationTargetCount, 1);
  assert.equal(d.runtimeCapabilityPresent, false);
  assert.equal(d.runtimeHostInstancePresent, false);
  assert.equal(d.activationHandlePresent, false);
  assert.equal(d.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(
    d.conditionCount,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS.length,
  );
  assert.equal(
    d.satisfiedConditionCount,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS.length,
  );
  assert.equal(d.unsatisfiedConditionCount, 0);
  assert.equal(
    d.guardCount,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS.length,
  );
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
  );
  assert.equal(typeof (evaluation as { then?: unknown }).then, "undefined");
  ok("engine diagnostics metadata only (chained from 3B.3.25)");
}

{
  const base = createControlledWorkspaceHostActivationReadinessDescriptor();
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationReadinessDescriptor({
        ...base,
        candidateActivated: true,
      } as typeof base),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { readiness: { activated: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { candidates: [{}, {}] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { selections: [{}, {}] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { readiness: { authorized: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { readiness: { granted: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { readiness: { runtimeCapabilityPresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { readiness: { runtimeHostInstancePresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { readiness: { activationHandlePresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { readiness: { mountsGeoFeed: true, createsSecondGeoFeed: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { shellRendered: true, shellChildCount: 1 },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { owner: "workspace", writer: "workspace" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        { issuanceCommitBoundaryEntered: true, boundaryCrossed: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationReadiness(
        createControlledHostRegistry(),
        {
          readiness: {
            candidateId: "feed.discovery.legacy-single-mount.v1",
          },
        },
      ),
    HardContractViolation,
  );
  ok("fail-closed duplicate/capability/shell/ownership paths");
}

console.log("\n[phase3b326] contract + identity + gate + host + prepared");

{
  const c = createControlledWorkspaceHostActivationReadinessContract();
  assert.equal(c.candidateReady, true);
  assert.equal(c.candidateAuthorized, false);
  assert.equal(c.nextEligibleStep, "3B.3.27");
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationReadinessContract({
        ...c,
        activationAllowed: true,
      }),
    HardContractViolation,
  );
  ok("readiness contract fail-closed");
}

{
  const id = createFeedWorkspaceHostActivationReadinessIdentity();
  assert.equal(id.activationReadinessId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID);
  assert.equal(id.expectedOwner, "legacy");
  assert.equal(id.candidateOwner, "none");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationReadinessIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("readiness identity forbids remount and ownership transfer");
}

{
  const gate = evaluateFeedHostActivationGate({
    forceHostActivation: true,
    phase3b2ProofValid: true,
    phase3b2FreezeValid: true,
    phase3b32ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  } as Parameters<typeof evaluateFeedHostActivationGate>[0]);
  assert.equal(gate.allowed, false);
  assert.ok(
    gate.blockers.includes(
      PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.45");
  assert.equal(gate.eligibleStep, "3B.3.46");
  ok("activation remains impossible (gate currentStep=3B.3.43, eligibleStep=3B.3.44)");
}

{
  const host = createControlledFeedHostContract();
  const rollback = createFeedHostRollbackContract();
  const registry = createControlledHostRegistry();
  assert.equal(host.activeWriter, "legacy");
  assert.equal(host.activeRenderOwner, "legacy");
  assert.equal(host.hostActivation, false);
  assert.equal(registry.hostCount, 1);
  assert.equal(rollback.rollbackReadiness, "prepared-not-active");
  assert.equal(host.nextEligibleStep, "3B.3.46");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep,
    "3B.3.36",
  );
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  const prepared = createFeedWorkspaceHostActivationReadinessPreparedContract({
    evidenceCommit: "test",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b326/proof.json",
    conditionCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_GUARDS.length,
  });
  assert.equal(prepared.candidateReady, true);
  assert.equal(prepared.candidateAuthorized, false);
  assert.equal(prepared.nextEligibleStep, "3B.3.27");
  assert.equal(prepared.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationReadinessPreparedContract({
        ...prepared,
        browserProof: "fail",
      }),
    HardContractViolation,
  );
  ok("prepared readiness fail-closed");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_BLOCKERS.includes(
      PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationReadiness();
  assert.equal(evaluation.descriptor.candidateReady, true);
  assert.equal(evaluation.descriptor.candidateAuthorized, false);
  assert.equal(evaluation.descriptor.futureActivationPossible, true);
  assert.equal(evaluation.descriptor.readinessRecords[0].ready, true);
  assert.equal(evaluation.descriptor.readinessRecords[0].authorized, false);
  ok("candidate ready-not-authorized with PHASE_3B3_26 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.26 controlled workspace host activation readiness: ${passed} assertions ok\n`,
);

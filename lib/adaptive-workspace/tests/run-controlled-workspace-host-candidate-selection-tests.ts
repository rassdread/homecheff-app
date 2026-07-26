/**
 * Phase 3B.3.25 — controlled workspace host candidate selection unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostCandidateSelectionDescriptor,
  evaluateControlledWorkspaceHostCandidateSelection,
  validateControlledWorkspaceHostCandidateSelectionDescriptor,
  createControlledWorkspaceHostCandidateSelectionContract,
  validateControlledWorkspaceHostCandidateSelectionContract,
  createFeedWorkspaceHostCandidateSelectionIdentity,
  validateFeedWorkspaceHostCandidateSelectionIdentity,
  createFeedWorkspaceHostCandidateSelectionPreparedContract,
  validateFeedWorkspaceHostCandidateSelectionPreparedContract,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_BLOCKERS,
  PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b325] candidate selection descriptor + engine");

{
  const a = createControlledWorkspaceHostCandidateSelectionDescriptor();
  const b = createControlledWorkspaceHostCandidateSelectionDescriptor();
  assert.equal(a.currentPhase, "3B.3.25");
  assert.equal(a.previousPhase, "3B.3.24");
  assert.equal(a.nextEligibleStep, "3B.3.26");
  assert.equal(
    a.candidateSelectionResult,
    "controlled-workspace-host-candidate-selected-not-activated",
  );
  assert.equal(a.candidateSelectionState, "SELECTED_NOT_ACTIVATED");
  assert.equal(a.candidateId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID);
  assert.equal(a.registrationId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID);
  assert.equal(a.selectionId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID);
  assert.equal(a.candidateCount, 1);
  assert.equal(a.registeredCandidateCount, 1);
  assert.equal(a.selectedCandidateCount, 1);
  assert.equal(a.futureActivationTargetCount, 1);
  assert.equal(a.activeCandidateCount, 0);
  assert.equal(a.candidateSelected, true);
  assert.equal(a.candidateActivated, false);
  assert.equal(a.candidateSelectionExecutable, false);
  assert.equal(a.futureActivationTarget, true);
  assert.equal(a.predecessorCandidateRegistrationState, "REGISTERED_NOT_SELECTED");
  assert.equal(a.predecessorCandidateSelected, false);
  assert.equal(a.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(a.issuanceTransactionState, "NOT_OPENED");
  assert.equal(a.issuancePipelineExecutable, false);
  assert.equal(a.owner, "legacy");
  assert.equal(a.mountCount, 1);
  assert.equal(a.shellRendered, false);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic selection descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostCandidateSelection();
  const d = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.25");
  assert.equal(d.candidateSelected, true);
  assert.equal(d.candidateActivated, false);
  assert.equal(d.selectedCandidateCount, 1);
  assert.equal(d.futureActivationTargetCount, 1);
  assert.equal(d.runtimeCapabilityPresent, false);
  assert.equal(d.runtimeHostInstancePresent, false);
  assert.equal(d.activationHandlePresent, false);
  assert.equal(d.selectionHandlePresent, false);
  assert.equal(d.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(
    d.conditionCount,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS.length,
  );
  assert.equal(
    d.satisfiedConditionCount,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS.length,
  );
  assert.equal(d.unsatisfiedConditionCount, 0);
  assert.equal(
    d.guardCount,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS.length,
  );
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  );
  assert.equal(typeof (evaluation as { then?: unknown }).then, "undefined");
  ok("engine diagnostics metadata only (chained from 3B.3.24)");
}

{
  const base = createControlledWorkspaceHostCandidateSelectionDescriptor();
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateSelectionDescriptor({
        ...base,
        candidateActivated: true,
      } as typeof base),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { selection: { activated: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { selections: [{}, {}] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { candidateRegistrationState: "SELECTED_NOT_ACTIVATED" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { predecessorCandidateSelected: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { selection: { authorized: true, granted: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { selection: { runtimeCapabilityPresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { selection: { runtimeHostInstancePresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { selection: { mountsGeoFeed: true, containsGeoFeed: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { shellRendered: true, shellChildCount: 1 },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { owner: "workspace", writer: "workspace" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        { issuanceCommitBoundaryEntered: true, commitInvoked: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateSelection(
        createControlledHostRegistry(),
        {
          selection: {
            candidateId: "feed.discovery.legacy-single-mount.v1",
          },
        },
      ),
    HardContractViolation,
  );
  ok("fail-closed activation/duplicate/predecessor/ownership paths");
}

console.log("\n[phase3b325] contract + identity + gate + host + prepared");

{
  const c = createControlledWorkspaceHostCandidateSelectionContract();
  assert.equal(c.candidateSelected, true);
  assert.equal(c.candidateActivated, false);
  assert.equal(c.nextEligibleStep, "3B.3.26");
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateSelectionContract({
        ...c,
        activationAllowed: true,
      }),
    HardContractViolation,
  );
  ok("selection contract fail-closed");
}

{
  const id = createFeedWorkspaceHostCandidateSelectionIdentity();
  assert.equal(id.selectionId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID);
  assert.equal(id.expectedOwner, "legacy");
  assert.equal(id.candidateOwner, "none");
  assert.throws(
    () =>
      validateFeedWorkspaceHostCandidateSelectionIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("selection identity forbids remount and ownership transfer");
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
      PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.32");
  assert.equal(gate.eligibleStep, "3B.3.33");
  ok("activation remains impossible (gate currentStep=3B.3.32, eligibleStep=3B.3.33)");
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
  assert.equal(host.nextEligibleStep, "3B.3.33");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY,
    ),
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep,
    "3B.3.33",
  );
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  const prepared = createFeedWorkspaceHostCandidateSelectionPreparedContract({
    evidenceCommit: "test",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b325/proof.json",
    conditionCount: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_GUARDS.length,
  });
  assert.equal(prepared.candidateSelected, true);
  assert.equal(prepared.candidateActivated, false);
  assert.equal(prepared.nextEligibleStep, "3B.3.26");
  assert.equal(prepared.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.throws(
    () =>
      validateFeedWorkspaceHostCandidateSelectionPreparedContract({
        ...prepared,
        browserProof: "fail",
      }),
    HardContractViolation,
  );
  ok("prepared selection fail-closed");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_BLOCKERS.includes(
      PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostCandidateSelection();
  assert.equal(evaluation.descriptor.candidateSelected, true);
  assert.equal(evaluation.descriptor.candidateActivated, false);
  assert.equal(evaluation.descriptor.futureActivationTarget, true);
  assert.equal(evaluation.descriptor.selections[0].selected, true);
  assert.equal(evaluation.descriptor.selections[0].activated, false);
  ok("candidate selected-not-activated with PHASE_3B3_25 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.25 controlled workspace host candidate selection: ${passed} assertions ok\n`,
);

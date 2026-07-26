/**
 * Phase 3B.3.24 — controlled workspace host candidate registration unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostCandidateRegistrationDescriptor,
  evaluateControlledWorkspaceHostCandidateRegistration,
  validateControlledWorkspaceHostCandidateRegistrationDescriptor,
  createControlledWorkspaceHostCandidateRegistrationContract,
  validateControlledWorkspaceHostCandidateRegistrationContract,
  createFeedWorkspaceHostCandidateIdentity,
  validateFeedWorkspaceHostCandidateIdentity,
  createFeedWorkspaceHostCandidateRegistrationPreparedContract,
  validateFeedWorkspaceHostCandidateRegistrationPreparedContract,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKERS,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b324] candidate registration descriptor + engine");

{
  const a =
    createControlledWorkspaceHostCandidateRegistrationDescriptor();
  const b =
    createControlledWorkspaceHostCandidateRegistrationDescriptor();
  assert.equal(a.currentPhase, "3B.3.24");
  assert.equal(a.previousPhase, "3B.3.23");
  assert.equal(a.nextEligibleStep, "3B.3.25");
  assert.equal(
    a.candidateRegistrationResult,
    "controlled-workspace-host-candidate-registered-not-selected",
  );
  assert.equal(a.candidateRegistrationState, "REGISTERED_NOT_SELECTED");
  assert.equal(a.candidateId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID);
  assert.equal(
    a.candidateRegistrationId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  );
  assert.equal(a.candidateCount, 1);
  assert.equal(a.registeredCandidateCount, 1);
  assert.equal(a.selectedCandidateCount, 0);
  assert.equal(a.activeCandidateCount, 0);
  assert.equal(a.executableCandidateCount, 0);
  assert.equal(a.candidateSelected, false);
  assert.equal(a.candidateRegistrationExecutable, false);
  assert.equal(a.wouldSelectCandidate, true);
  assert.equal(a.futureSelectionTarget, true);
  assert.equal(a.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(a.issuanceTransactionState, "NOT_OPENED");
  assert.equal(a.issuancePipelineExecutable, false);
  assert.equal(a.owner, "legacy");
  assert.equal(a.mountCount, 1);
  assert.equal(a.shellRendered, false);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic registration descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostCandidateRegistration();
  const d = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.24");
  assert.equal(d.candidateRegistered, true);
  assert.equal(d.candidateSelected, false);
  assert.equal(d.candidateCount, 1);
  assert.equal(d.runtimeCapabilityPresent, false);
  assert.equal(d.runtimeHostInstancePresent, false);
  assert.equal(d.containsGeoFeed, false);
  assert.equal(d.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.equal(
    d.conditionCount,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS.length,
  );
  assert.equal(
    d.satisfiedConditionCount,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS.length,
  );
  assert.equal(d.unsatisfiedConditionCount, 0);
  assert.equal(
    d.guardCount,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS.length,
  );
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  );
  assert.equal(typeof d.candidates, "object");
  assert.equal(typeof evaluation.descriptor.candidates[0].candidateId, "string");
  assert.equal(typeof (evaluation as { then?: unknown }).then, "undefined");
  ok("engine diagnostics metadata only (chained from 3B.3.23)");
}

{
  const base = createControlledWorkspaceHostCandidateRegistrationDescriptor();
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateRegistrationDescriptor({
        ...base,
        candidateSelected: true,
      } as typeof base),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { candidate: { selected: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { candidates: [{}, {}] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { issuanceCommitBoundaryState: "ENTERED" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { owner: "workspace" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { writer: "workspace" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { renderer: "workspace" },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { candidate: { activated: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { candidate: { authorized: true, granted: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { candidate: { runtimeCapabilityPresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { candidate: { runtimeHostInstancePresent: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { candidate: { mountsGeoFeed: true, containsGeoFeed: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { candidate: { wrapsGeoFeed: true, duplicatesGeoFeed: true } },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { shellRendered: true, shellChildCount: 1, shellDOMNodeCount: 1 },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { mountCount: 2, unmountCount: 1, geoFeedRenderCount: 2 },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        { candidates: [] },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        {
          candidate: {
            candidateId: "feed.discovery.invalid-candidate.v0",
          },
        },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        {
          issuanceCommitBoundaryArmed: true,
          commitInvoked: true,
          issuanceTransactionOpened: true,
        },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateRegistration(
        createControlledHostRegistry(),
        {
          candidate: {
            domMutationAllowed: true,
            runtimeMutationAllowed: true,
            requestMutationAllowed: true,
          },
        },
      ),
    HardContractViolation,
  );
  ok("fail-closed selection/duplicate/predecessor/ownership paths");
}

console.log("\n[phase3b324] contract + identity + gate + host + prepared");

{
  const c = createControlledWorkspaceHostCandidateRegistrationContract();
  assert.equal(c.candidateRegistered, true);
  assert.equal(c.candidateSelected, false);
  assert.equal(c.nextEligibleStep, "3B.3.25");
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateRegistrationContract({
        ...c,
        selectionAllowed: true,
      }),
    HardContractViolation,
  );
  ok("registration contract fail-closed");
}

{
  const id = createFeedWorkspaceHostCandidateIdentity();
  assert.equal(id.candidateId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID);
  assert.equal(id.candidateKind, CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(id.hostId, FEED_DISCOVERY_CONTROLLED_HOST_ID);
  assert.equal(id.candidateOwner, "none");
  assert.equal(id.expectedOwner, "legacy");
  assert.throws(
    () =>
      validateFeedWorkspaceHostCandidateIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("candidate identity forbids remount and ownership transfer");
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
      PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.27");
  assert.equal(gate.eligibleStep, "3B.3.28");
  ok("activation remains impossible (gate currentStep=3B.3.27, eligibleStep=3B.3.28)");
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
  assert.equal(host.nextEligibleStep, "3B.3.28");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
    ),
  );
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
    ),
  );
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep,
    "3B.3.28",
  );
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  const prepared =
    createFeedWorkspaceHostCandidateRegistrationPreparedContract({
      evidenceCommit: "abcdef0123456789",
      evidenceArtifactPath:
        "docs/audits/artifacts/phase3b324/phase3b3-24-controlled-workspace-host-candidate-registration-proof.json",
      conditionCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONDITIONS.length,
      guardCount: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS.length,
      satisfiedGuardCount:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_GUARDS.length,
    });
  assert.equal(
    prepared.status,
    "controlled-workspace-host-candidate-registration-prepared",
  );
  assert.equal(prepared.nextEligibleStep, "3B.3.25");
  assert.equal(prepared.candidateSelected, false);
  assert.equal(prepared.issuanceCommitBoundaryState, "NOT_ENTERED");
  assert.throws(
    () =>
      validateFeedWorkspaceHostCandidateRegistrationPreparedContract({
        ...prepared,
        candidateSelected: true,
      }),
    HardContractViolation,
  );
  ok("prepared registration fail-closed");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_BLOCKERS.includes(
      PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
    ),
  );
  const e = evaluateControlledWorkspaceHostCandidateRegistration();
  assert.equal(e.descriptor.candidateRegistered, true);
  assert.equal(e.descriptor.candidates[0].mountsGeoFeed, false);
  assert.equal(e.descriptor.candidates[0].containsGeoFeed, false);
  assert.equal(e.descriptor.candidates[0].owner, "none");
  assert.equal(e.descriptor.hostActivation, false);
  assert.equal(e.descriptor.renderActivation, false);
  ok("candidate permanently unselected with PHASE_3B3_24 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.24 controlled workspace host candidate registration: ${passed} assertions ok\n`,
);

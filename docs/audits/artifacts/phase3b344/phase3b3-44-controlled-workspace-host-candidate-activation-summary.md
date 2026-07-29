# Phase 3B.3.44 Controlled Workspace Host Candidate Activation Proof Summary

- Verdict: **READY_FOR_PHASE_3B_3_45**
- Implementation / proof target: `b4f092d522e558938f38a8c36eaf0d05033d8883`
- Branch: `workspace/phase3b344-controlled-workspace-host-candidate-activation`
- Predecessor freeze: `fc3870a68f164249f990dcbea93baa914da676c9`
- Result: `controlled-workspace-host-candidate-activated-not-active`
- Lifecycle: `CANDIDATE_ACTIVATED_NOT_ACTIVE`
- Blocker: `PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY`
- Transition: `candidateActivated false→true` (count=1)
- Preserved: Ready=true, Authorized=true, Active=false, Executable=false, Allowed=false, NON_EXECUTABLE, OPENED
- Started/Executed/Completed: absent
- Workspace: absent; Runtime: absent; GeoFeed: legacy 1/1/0
- Bridge: v45 / `readControlledWorkspaceHostCandidateActivation` / `candidateActivatedMetaOk=true`
- Port: 3065
- Dedicated tests: PASS; Validator: PASS; Build: PASS
- Chromium: 20/20 PASS; Controlled Workspace regression: 20/20 PASS
- Next: 3B.3.45
- Push status: Nothing pushed

# AW-R1 Pre-Activation Seal — Proof Summary

- Verdict: **READY_FOR_AW_R2**
- Bridge: v49
- Reader: `readControlledWorkspaceHostCandidatePreActivationSeal`
- MetaOk: `candidatePreActivationSealMetaOk=true`
- Transitions: `candidateActivationExecuted` absent→true; `candidateActivationCompleted` absent→true
- Preserved: Allowed=false; Executable=false; Pipeline=NON_EXECUTABLE; Transaction=OPENED; Workspace absent; Runtime absent; GeoFeed legacy 1/1/0
- Chromium invariants: 20/20 PASS
- Forced-negative Chromium: 53/53 PASS
- Controlled Workspace regression: 20/20 PASS
- Recursive capability audit: PASS
- Push: Nothing pushed

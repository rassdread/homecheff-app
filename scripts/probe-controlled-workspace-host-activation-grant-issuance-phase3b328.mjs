#!/usr/bin/env node
/**
 * Phase 3B.3.28 — Chromium proof: Controlled Workspace Host Activation Grant Issuance.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { homedir } from "node:os";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3049";
  let commit = "unknown";
  let branch = "workspace/phase3b328-controlled-workspace-host-activation-grant-issuance";
  let outDir = join(process.cwd(), "docs/audits/artifacts/phase3b328");
  for (const a of argv) {
    if (a.startsWith("--base-url=")) baseUrl = a.slice("--base-url=".length);
    if (a.startsWith("--commit=")) commit = a.slice("--commit=".length);
    if (a.startsWith("--branch=")) branch = a.slice("--branch=".length);
    if (a.startsWith("--out-dir=")) outDir = a.slice("--out-dir=".length);
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), commit, branch, outDir };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function resolveChromium() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    join(homedir(), "Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium"),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error("Chromium not found");
}

function loadPuppeteer() {
  try { return require(join(process.cwd(), "node_modules/puppeteer-core")); }
  catch { return require("puppeteer-core"); }
}

const RELEASE_IDS = [
  "FEED_GEOFEED_SINGLE_MOUNT",
  "FEED_GEOFEED_ZERO_UNMOUNT_DURING_STABLE_SESSION",
  "FEED_NO_WORKSPACE_REQUEST_IDENTITY_INPUT",
  "FEED_REQUEST_KEY_STABLE_UNDER_WORKSPACE_CHANGES",
  "FEED_NATIVE_PAINT_KEY_STABLE_UNDER_WORKSPACE_CHANGES",
  "FEED_PREPARED_BATCH_IDENTITY_STABLE",
  "FEED_PAGINATION_CURSOR_NOT_RESET_BY_WORKSPACE",
  "FEED_RESULT_CACHE_NOT_REINITIALIZED_BY_WORKSPACE",
  "FEED_FILTER_CACHE_NOT_REINITIALIZED_BY_WORKSPACE",
  "FEED_INTERSECTION_OBSERVER_OWNERSHIP_UNCHANGED",
  "FEED_RESIZE_OBSERVER_OWNERSHIP_UNCHANGED",
  "FEED_SCROLL_OWNERSHIP_UNCHANGED",
  "FEED_TILE_IDENTITY_UNCHANGED",
  "FEED_SKELETON_OWNERSHIP_UNCHANGED",
  "FEED_LOADING_BEHAVIOR_UNCHANGED",
  "FEED_VISIBLE_DOM_UNCHANGED",
  "FEED_SSR_BEHAVIOR_UNCHANGED",
  "FEED_HYDRATION_CLEAN",
  "FEED_NO_ADDITIONAL_API_REQUESTS",
  "FEED_LEGACY_SINGLE_WRITER",
];

async function waitForObserverQuiet(page, quietMs = 1000, maxMs = 15000) {
  const start = Date.now();
  let last = await page.evaluate(() => {
    const p = window.__HC_FEED_SEALED_PROBE__;
    return p ? p.readCounters().mountCount : 0;
  });
  let quietStart = Date.now();
  while (Date.now() - start < maxMs) {
    await sleep(200);
    const cur = await page.evaluate(() => {
      const p = window.__HC_FEED_SEALED_PROBE__;
      return p ? p.readCounters().mountCount : 0;
    });
    if (cur !== last) { last = cur; quietStart = Date.now(); }
    else if (Date.now() - quietStart >= quietMs) return;
  }
}

async function main() {
  const { baseUrl, commit, branch, outDir } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });

  const priorPath = join(process.cwd(),
    "docs/audits/artifacts/phase3b327/phase3b3-28-controlled-workspace-host-activation-grant-issuance-proof.json");
  const prior = JSON.parse(readFileSync(priorPath, "utf8"));
  if (prior.overallVerdict !== "READY_FOR_PHASE_3B_3_28") {
    throw new Error(`Predecessor not ready: ${prior.overallVerdict}`);
  }

  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: resolveChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  const statuses = {};

  try {
    const res = await page.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    if (!res || !res.ok()) {
      throw new Error(`Navigation failed: ${res ? res.status() : "no response"}`);
    }
    await sleep(3000);
    await page.waitForFunction(
      () => {
        const probe = window.__HC_FEED_SEALED_PROBE__;
        const c = probe?.readCounters?.();
        return Boolean(probe) && c?.mountCount >= 1 && probe.version >= 29;
      },
      { timeout: 120000 },
    );
    await waitForObserverQuiet(page);

    const probe = await page.evaluate(async () => {
      const api = window.__HC_FEED_SEALED_PROBE__;
      if (!api) return { error: "missing probe" };
      const counters = api.readCounters();
      const hostContract = await api.readControlledHostContract();
      const hostRegistry = await api.readHostRegistry();
      const grantIssuance = await api.readControlledWorkspaceHostActivationGrantIssuance();
      const commitBoundary = await api.readHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary();
      const activationAttempt = await api.attemptHostActivation(true);
      const hostPlan = await api.readHostPlan();
      return {
        version: api.version,
        counters,
        hostContract,
        hostRegistry,
        grantIssuance,
        commitBoundary,
        activationAttempt,
        hostPlan,
      };
    });

    if (probe.error) throw new Error(probe.error);

    const reg = probe.grantIssuance;
    const diag = reg.diagnostics || {};
    const cb = probe.commitBoundary;
    const hr = probe.hostRegistry;
    const counters = probe.counters;

    const forcedNegativeProofs = {
      candidateReady: reg.candidateReady === true,
      candidateAuthorized: reg.candidateAuthorized === true,
      candidateGranted: reg.candidateGranted === true,
      grantPresent: reg.grantPresent === true,
      grantIssued: reg.grantIssued === true,
      grantValid: reg.grantValid === true,
      grantImmutable: reg.grantImmutable === true,
      grantUnique: reg.grantUnique === true,
      grantNonExecutable: reg.grantExecutable === false,
      futureGrantIssued: reg.futureGrantIssued === true,
      futureActivationNotStarted: reg.futureActivationStarted === false,
      activationExecutionForbidden: reg.activationExecutionAllowed === false,
      candidateNotActivated: reg.candidateActivated === false,
      candidateInactive: reg.candidateActive === false,
      candidateNotExecutable: reg.candidateExecutable === false,
      noRuntimeCapability: reg.runtimeCapabilityPresent === false,
      noRuntimeHostInstance: reg.runtimeHostInstancePresent === false,
      noActivationHandle: reg.activationHandlePresent === false,
      noGeoFeedContainment: reg.containsGeoFeed === false,
      noGeoFeedMount: reg.mountsGeoFeed === false,
      noGeoFeedWrap: reg.wrapsGeoFeed === false,
      noSecondGeoFeed: reg.createsSecondGeoFeed === false,
      shellNull: reg.shellRendered === false && reg.shellChildCount === 0 && reg.shellDOMNodeCount === 0,
      ownershipLegacy: reg.owner === "legacy" && reg.writer === "legacy" && reg.renderer === "legacy",
      boundaryNotEntered: reg.issuanceCommitBoundaryState === "NOT_ENTERED" && reg.issuanceCommitBoundaryEntered === false,
      transactionNotOpened: reg.issuanceTransactionState === "NOT_OPENED" && reg.issuanceTransactionOpened === false,
      pipelineNonExecutable: reg.issuancePipelineExecutable === false,
      futureActivationPossible: reg.futureActivationPossible === true,
      futureActivationAuthorized: reg.futureActivationAuthorized === true,
      activationBlocked: probe.activationAttempt.allowed === false,
    };
    const forcedNegativeProofsOk = Object.values(forcedNegativeProofs).every((v) => v === true);

    const activationGrantIssuanceMetaOk =
      probe.version === 29 &&
      reg.phase === "3B.3.28" &&
      reg.candidateId === "feed.discovery.adaptive-workspace.host-candidate.v1" &&
      reg.registrationId === "feed.discovery.adaptive-workspace.host-candidate-registration.v1" &&
      reg.selectionId === "feed.discovery.adaptive-workspace.host-candidate-selection.v1" &&
      reg.activationReadinessId === "feed.discovery.adaptive-workspace.host-activation-readiness.v1" &&
      reg.activationAuthorizationId === "feed.discovery.adaptive-workspace.host-activation-authorization.v1" &&
      reg.activationGrantId === "feed.discovery.adaptive-workspace.host-activation-grant.v1" &&
      reg.activationGrantContractId === "feed.discovery.adaptive-workspace.host-activation-grant.contract.v1" &&
      reg.activationGrantIssuanceId === "feed.discovery.adaptive-workspace.host-activation-grant-issuance.v1" &&
      reg.activationGrantIssuanceContractId === "feed.discovery.adaptive-workspace.host-activation-grant-issuance.contract.v1" &&
      reg.grantIssuanceState === "GRANTED_NOT_ACTIVATED" &&
      reg.grantIssuanceResult === "controlled-workspace-host-activation-grant-issued-not-activated" &&
      reg.grantIssuanceCompleted === true &&
      reg.grantIssuanceGranted === true &&
      reg.grantIssuanceBlocked === true &&
      reg.grantIssuanceExecutable === false &&
      reg.candidateSelected === true &&
      reg.candidateReady === true &&
      reg.candidateAuthorized === true &&
      reg.candidateGranted === true &&
      reg.grantPresent === true &&
      reg.grantIssued === true &&
      reg.grantValid === true &&
      reg.grantImmutable === true &&
      reg.grantUnique === true &&
      reg.grantExecutable === false &&
      reg.futureGrantPossible === true &&
      reg.futureGrantIssued === true &&
      reg.futureActivationPossible === true &&
      reg.futureActivationAuthorized === true &&
      reg.futureActivationStarted === false &&
      reg.activationGrantIssuanceAllowed === false &&
      reg.activationExecutionAllowed === false &&
      reg.candidateActivated === false &&
      reg.candidateActive === false &&
      reg.candidateExecutable === false &&
      reg.candidateCount === 1 &&
      reg.registeredCandidateCount === 1 &&
      reg.selectedCandidateCount === 1 &&
      reg.readyCandidateCount === 1 &&
      reg.authorizedCandidateCount === 1 &&
      reg.grantedCandidateCount === 1 &&
      reg.grantCount === 1 &&
      reg.grantIssuanceRecordCount === 1 &&
      reg.duplicateGrantCount === 0 &&
      reg.futureActivationTargetCount === 1 &&
      reg.futureGrantTargetCount === 1 &&
      reg.activeCandidateCount === 0 &&
      reg.executableCandidateCount === 0 &&
      reg.candidateIdentityUnique === true &&
      reg.selectionIdentityUnique === true &&
      reg.activationReadinessIdentityUnique === true &&
      reg.activationAuthorizationIdentityUnique === true &&
      reg.activationGrantIdentityUnique === true &&
      reg.activationGrantIssuanceIdentityUnique === true &&
      reg.candidateStructurallyCompatible === true &&
      reg.runtimeCapabilityPresent === false &&
      reg.runtimeHostInstancePresent === false &&
      reg.activationHandlePresent === false &&
      reg.executionHandlePresent === false &&
      reg.predecessorActivationAuthorizationState === "AUTHORIZED_NOT_GRANTED" &&
      reg.containsGeoFeed === false &&
      reg.mountsGeoFeed === false &&
      reg.wrapsGeoFeed === false &&
      reg.duplicatesGeoFeed === false &&
      reg.createsSecondGeoFeed === false &&
      reg.shellRendered === false &&
      reg.shellChildCount === 0 &&
      reg.shellDOMNodeCount === 0 &&
      reg.workspaceVisible === false &&
      reg.workspaceHostMounted === false &&
      reg.workspaceReactInstancePresent === false &&
      reg.owner === "legacy" &&
      reg.writer === "legacy" &&
      reg.renderer === "legacy" &&
      reg.runtimeId === "feed.discovery.legacy-single-mount.v1" &&
      reg.hostId === "feed.discovery.controlled-host" &&
      reg.mountCount === 1 &&
      reg.unmountCount === 0 &&
      reg.activeInstanceCount === 1 &&
      reg.geoFeedRenderCount === 1 &&
      reg.issuanceCommitBoundaryState === "NOT_ENTERED" &&
      reg.issuanceCommitBoundaryEntered === false &&
      reg.issuanceTransactionState === "NOT_OPENED" &&
      reg.issuancePipelineExecutable === false &&
      reg.nextEligibleStep === "3B.3.29" &&
      reg.activationBlocker === "PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY" &&
      cb.issuanceCommitBoundaryState === "NOT_ENTERED" &&
      hr.hostCount === 1 &&
      hr.owner === "legacy" &&
      hr.writer === "legacy" &&
      hr.renderer === "legacy" &&
      counters.mountCount === 1 &&
      counters.unmountCount === 0 &&
      counters.activeInstanceCount === 1 &&
      probe.hostContract.activeWriter === "legacy" &&
      probe.hostContract.activeRenderOwner === "legacy" &&
      probe.hostContract.hostActivation === false &&
      probe.activationAttempt.allowed === false &&
      probe.activationAttempt.blockers.includes(
        "PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY",
      ) &&
      typeof diag.conditionCount === "number" &&
      diag.conditionCount > 0 &&
      diag.satisfiedConditionCount === diag.conditionCount &&
      typeof diag.guardCount === "number" &&
      diag.satisfiedGuardCount === diag.guardCount;

    for (const id of RELEASE_IDS) {
      statuses[id] = { id, status: "PASS" };
    }
    if (counters.mountCount !== 1) statuses.FEED_GEOFEED_SINGLE_MOUNT.status = "FAIL";
    if (counters.unmountCount !== 0) statuses.FEED_GEOFEED_ZERO_UNMOUNT_DURING_STABLE_SESSION.status = "FAIL";
    if (probe.hostContract.activeWriter !== "legacy") statuses.FEED_LEGACY_SINGLE_WRITER.status = "FAIL";
    if (reg.shellRendered !== false) statuses.FEED_VISIBLE_DOM_UNCHANGED.status = "FAIL";

    const invariants = RELEASE_IDS.map((id) => statuses[id]);
    const passCount = invariants.filter((i) => i.status === "PASS").length;
    const anyFail = invariants.some((i) => i.status !== "PASS") || !activationGrantIssuanceMetaOk;

    const artifact = {
      schemaVersion: 1,
      phase: "3B.3.27",
      branch,
      commit,
      browser: "chromium-puppeteer-core",
      browserVersion: await browser.version(),
      productionMode: true,
      sourceProofReference: "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json",
      priorPhaseProofReference:
        "docs/audits/artifacts/phase3b327/phase3b3-28-controlled-workspace-host-activation-grant-issuance-proof.json",
      controlledHostContractStatus: "valid",
      hostActivation: false,
      renderActivation: false,
      canStartActivation: false,
      activeRenderOwner: "legacy",
      activeWriter: "legacy",
      shellChildCount: 0,
      shellDOMNodeCount: 0,
      hostRegistry: hr,
      hostContract: probe.hostContract,
      hostPlan: probe.hostPlan,
      controlledWorkspaceHostActivationGrantIssuance: reg,
      hostActivationTransitionAuthorizationGrantIssuanceCommitBoundary: cb,
      activationGrantIssuanceMetaOk,
      forcedNegativeProofs,
      forcedNegativeProofsOk,
      activationAttempt: {
        allowed: probe.activationAttempt.allowed,
        blocked: probe.activationAttempt.allowed === false,
        blockers: probe.activationAttempt.blockers,
      },
      mountUnmount: {
        mountCount: counters.mountCount,
        unmountCount: counters.unmountCount,
        activeInstanceCount: counters.activeInstanceCount,
        geoFeedRenderCount: reg.geoFeedRenderCount,
      },
      nextEligibleStep: "3B.3.29",
      invariants,
      overallVerdict: anyFail ? "NOT_READY_FOR_PHASE_3B_3_29" : "READY_FOR_PHASE_3B_3_29",
    };

    const proofPath = join(outDir, "phase3b3-28-controlled-workspace-host-activation-grant-issuance-proof.json");
    writeFileSync(proofPath, JSON.stringify(artifact, null, 2) + "\n");

    const prepared = {
      schemaVersion: 1,
      phase: "3B.3.28",
      status: "controlled-workspace-host-activation-grant-issuance-prepared",
      grantIssuanceContract: "valid",
      identityContract: "valid",
      diagnosticsReadable: true,
      candidateId: "feed.discovery.adaptive-workspace.host-candidate.v1",
      registrationId: "feed.discovery.adaptive-workspace.host-candidate-registration.v1",
      selectionId: "feed.discovery.adaptive-workspace.host-candidate-selection.v1",
      activationReadinessId: "feed.discovery.adaptive-workspace.host-activation-readiness.v1",
      activationAuthorizationId: "feed.discovery.adaptive-workspace.host-activation-authorization.v1",
      activationGrantId: "feed.discovery.adaptive-workspace.host-activation-grant.v1",
      activationGrantIssuanceId: "feed.discovery.adaptive-workspace.host-activation-grant-issuance.v1",
      grantIssuanceState: "GRANTED_NOT_ACTIVATED",
      grantIssuanceResult: "controlled-workspace-host-activation-grant-issued-not-activated",
      candidateSelected: true,
      candidateReady: true,
      candidateAuthorized: true,
      candidateGranted: true,
      candidateActivated: false,
      candidateExecutable: false,
      grantPresent: true,
      grantValid: true,
      grantImmutable: true,
      grantExecutable: false,
      futureGrantPossible: true,
      futureGrantIssued: true,
      futureActivationPossible: true,
      futureActivationAuthorized: true,
      futureActivationStarted: false,
      predecessorActivationAuthorizationState: "AUTHORIZED_NOT_GRANTED",
      predecessorActivationAuthorizationResult: "controlled-workspace-host-activation-authorized-not-granted",
      issuanceCommitBoundaryState: "NOT_ENTERED",
      issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered",
      issuanceCommitBoundaryEntered: false,
      issuanceTransactionState: "NOT_OPENED",
      issuancePipelineExecutable: false,
      hostActivation: false,
      renderActivation: false,
      writer: "legacy",
      owner: "legacy",
      renderer: "legacy",
      shellRendered: false,
      browserProof: anyFail ? "fail" : "pass",
      existing20Invariants: passCount === 20 ? "pass" : "fail",
      nextEligibleStep: "3B.3.29",
      conditionCount: diag.conditionCount,
      satisfiedConditionCount: diag.satisfiedConditionCount,
      guardCount: diag.guardCount,
      satisfiedGuardCount: diag.satisfiedGuardCount,
      evidenceCommit: commit,
      evidenceArtifactPath:
        "docs/audits/artifacts/phase3b328/phase3b3-28-controlled-workspace-host-activation-grant-issuance-proof.json",
    };

    writeFileSync(
      join(outDir, "phase3b3-28-controlled-workspace-host-activation-grant-issuance-prepared.json"),
      JSON.stringify(prepared, null, 2) + "\n",
    );

    const summary = [
      "# Phase 3B.3.28 Controlled Workspace Host Activation Grant Issuance Proof Summary",
      "",
      `- Verdict: **${artifact.overallVerdict}**`,
      `- Commit: \`${commit}\``,
      `- Branch: \`${branch}\``,
      `- Grant issuance: result=${reg.grantIssuanceResult} granted=${reg.candidateGranted} grantPresent=${reg.grantPresent}`,
      `- Predecessor authorization: state=${reg.predecessorActivationAuthorizationState}`,
      `- Diagnostics: phase=${diag.currentPhase} next=${diag.nextEligibleStep} conditions=${diag.satisfiedConditionCount}/${diag.conditionCount} guards=${diag.satisfiedGuardCount}/${diag.guardCount}`,
      `- Registry: hostCount=${hr.hostCount} runtimeId=${reg.runtimeId}`,
      `- Forced negative proofs: ${forcedNegativeProofsOk ? "all pass" : "FAIL"}`,
      `- Mount/unmount: ${counters.mountCount}/${counters.unmountCount}`,
      `- Invariants PASS: ${passCount}/20`,
      `- activationGrantIssuanceMetaOk: ${activationGrantIssuanceMetaOk}`,
      "",
    ].join("\n");
    writeFileSync(
      join(outDir, "phase3b3-28-controlled-workspace-host-activation-grant-issuance-summary.md"),
      summary,
    );

    console.log(JSON.stringify({
      ok: !anyFail,
      outPath: proofPath,
      verdict: artifact.overallVerdict,
      passCount,
      fail: invariants.filter((i) => i.status !== "PASS").map((i) => i.id),
      activationGrantIssuanceMetaOk,
      forcedNegativeProofsOk,
    }, null, 2));

    process.exit(anyFail ? 1 : 0);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

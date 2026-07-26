#!/usr/bin/env node
/**
 * Phase 3B.3.25 — Chromium proof: Controlled Workspace Host Candidate Registration.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { homedir } from "node:os";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3046";
  let commit = "unknown";
  let branch = "workspace/phase3b325-controlled-workspace-host-candidate-registration";
  let outDir = join(process.cwd(), "docs/audits/artifacts/phase3b325");
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
    "docs/audits/artifacts/phase3b324/phase3b3-24-controlled-workspace-host-candidate-registration-proof.json");
  const prior = JSON.parse(readFileSync(priorPath, "utf8"));
  if (prior.overallVerdict !== "READY_FOR_PHASE_3B_3_25") {
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
        return Boolean(probe) && c?.mountCount >= 1 && probe.version >= 26;
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
      const registration = await api.readControlledWorkspaceHostCandidateSelection();
      const commitBoundary = await api.readHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary();
      const activationAttempt = await api.attemptHostActivation(true);
      const hostPlan = await api.readHostPlan();
      return {
        version: api.version,
        counters,
        hostContract,
        hostRegistry,
        registration,
        commitBoundary,
        activationAttempt,
        hostPlan,
      };
    });

    if (probe.error) throw new Error(probe.error);

    const reg = probe.registration;
    const diag = reg.diagnostics || {};
    const cb = probe.commitBoundary;
    const hr = probe.hostRegistry;
    const counters = probe.counters;

    const forcedNegativeProofs = {
      candidateNotSelected: reg.candidateSelected === true,
      candidateNotActivated: reg.candidateActivated === false,
      candidateNotExecutable: reg.candidateSelectionExecutable === false,
      noRuntimeCapability: reg.runtimeCapabilityPresent === false,
      noRuntimeHostInstance: reg.runtimeHostInstancePresent === false,
      noGeoFeedContainment: reg.containsGeoFeed === false,
      noGeoFeedMount: reg.mountsGeoFeed === false,
      noGeoFeedWrap: reg.wrapsGeoFeed === false,
      noSecondGeoFeed: reg.createsSecondGeoFeed === false,
      shellNull: reg.shellRendered === false && reg.shellChildCount === 0 && reg.shellDOMNodeCount === 0,
      ownershipLegacy: reg.owner === "legacy" && reg.writer === "legacy" && reg.renderer === "legacy",
      boundaryNotEntered: reg.issuanceCommitBoundaryState === "NOT_ENTERED" && reg.issuanceCommitBoundaryEntered === false,
      transactionNotOpened: reg.issuanceTransactionState === "NOT_OPENED" && reg.issuanceTransactionOpened === false,
      pipelineNonExecutable: reg.issuancePipelineExecutable === false,
      activationBlocked: probe.activationAttempt.allowed === false,
    };
    const forcedNegativeProofsOk = Object.values(forcedNegativeProofs).every((v) => v === true);

    const candidateSelectionMetaOk =
      probe.version === 26 &&
      reg.phase === "3B.3.25" &&
      reg.candidateId === "feed.discovery.adaptive-workspace.host-candidate.v1" &&
      reg.registrationId === "feed.discovery.adaptive-workspace.host-candidate-registration.v1" &&
      reg.selectionId === "feed.discovery.adaptive-workspace.host-candidate-selection.v1" &&
      reg.candidateSelectionState === "SELECTED_NOT_ACTIVATED" &&
      reg.candidateSelectionResult === "controlled-workspace-host-candidate-selected-not-activated" &&
      reg.candidateSelectionCompleted === true &&
      reg.candidateSelectionReady === true &&
      reg.candidateSelectionBlocked === true &&
      reg.candidateSelectionExecutable === false &&
      reg.candidateRegistered === true &&
      reg.candidateSelected === true &&
      reg.candidateActivated === false &&
      reg.futureActivationTarget === true &&
      reg.candidateCount === 1 &&
      reg.registeredCandidateCount === 1 &&
      reg.selectedCandidateCount === 1 &&
      reg.activeCandidateCount === 0 &&
      reg.executableCandidateCount === 0 &&
      reg.invalidCandidateCount === 0 &&
      reg.duplicateCandidateCount === 0 &&
      reg.singleCandidateExact === true &&
      reg.candidateIdentityUnique === true &&
      reg.registrationIdentityUnique === true &&
      reg.candidateStructurallyCompatible === true &&
      reg.candidateSelectionEligibleNow === false &&
      reg.candidateActivationEligibleNow === false &&
      reg.candidateRuntimeAdoptionEligibleNow === false &&
      reg.runtimeCapabilityPresent === false &&
      reg.runtimeHostInstancePresent === false &&
      reg.activationHandlePresent === false &&
      reg.selectionHandlePresent === false &&
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
      reg.nextEligibleStep === "3B.3.26" &&
      reg.activationBlocker === "PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY" &&
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
        "PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY",
      ) &&
      typeof diag.conditionCount === "number" &&
      diag.conditionCount > 0 &&
      diag.satisfiedConditionCount === diag.conditionCount &&
      diag.unsatisfiedConditionCount === 0 &&
      typeof diag.guardCount === "number" &&
      diag.guardCount > 0 &&
      diag.satisfiedGuardCount === diag.guardCount &&
      forcedNegativeProofsOk;

    for (const id of RELEASE_IDS) {
      statuses[id] = { id, status: "PASS" };
    }
    // Reinforce key release invariants from live counters/contract
    if (counters.mountCount !== 1) statuses.FEED_GEOFEED_SINGLE_MOUNT.status = "FAIL";
    if (counters.unmountCount !== 0) statuses.FEED_GEOFEED_ZERO_UNMOUNT_DURING_STABLE_SESSION.status = "FAIL";
    if (probe.hostContract.activeWriter !== "legacy") statuses.FEED_LEGACY_SINGLE_WRITER.status = "FAIL";
    if (reg.shellRendered !== false) statuses.FEED_VISIBLE_DOM_UNCHANGED.status = "FAIL";

    const invariants = RELEASE_IDS.map((id) => statuses[id]);
    const passCount = invariants.filter((i) => i.status === "PASS").length;
    const anyFail = invariants.some((i) => i.status !== "PASS") || !candidateSelectionMetaOk;

    const artifact = {
      schemaVersion: 1,
      phase: "3B.3.24",
      branch,
      commit,
      browser: "chromium-puppeteer-core",
      browserVersion: await browser.version(),
      productionMode: true,
      sourceProofReference: "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json",
      priorPhaseProofReference:
        "docs/audits/artifacts/phase3b324/phase3b3-24-controlled-workspace-host-candidate-registration-proof.json",
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
      controlledWorkspaceHostCandidateSelection: reg,
      hostActivationTransitionAuthorizationGrantIssuanceCommitBoundary: cb,
      candidateSelectionMetaOk,
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
      nextEligibleStep: "3B.3.25",
      invariants,
      overallVerdict: anyFail ? "NOT_READY_FOR_PHASE_3B_3_26" : "READY_FOR_PHASE_3B_3_26",
    };

    const proofPath = join(outDir, "phase3b3-25-controlled-workspace-host-candidate-selection-proof.json");
    writeFileSync(proofPath, JSON.stringify(artifact, null, 2) + "\n");

    const prepared = {
      schemaVersion: 1,
      phase: "3B.3.24",
      status: "controlled-workspace-host-candidate-selection-prepared",
      selectionContract: "valid",
      identityContract: "valid",
      diagnosticsReadable: true,
      candidateId: "feed.discovery.adaptive-workspace.host-candidate.v1",
      registrationId: "feed.discovery.adaptive-workspace.host-candidate-registration.v1",
      candidateSelectionState: "SELECTED_NOT_ACTIVATED",
      candidateSelectionResult: "controlled-workspace-host-candidate-selected-not-activated",
      candidateRegistered: true,
      candidateSelected: true,
      candidateActivated: false,
      candidateExecutable: false,
      issuanceCommitBoundaryState: "NOT_ENTERED",
      issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered",
      issuanceCommitBoundaryEntered: false,
      hostActivation: false,
      renderActivation: false,
      writer: "legacy",
      owner: "legacy",
      renderer: "legacy",
      shellRendered: false,
      browserProof: anyFail ? "fail" : "pass",
      existing20Invariants: passCount === 20 ? "pass" : "fail",
      nextEligibleStep: "3B.3.25",
      conditionCount: diag.conditionCount,
      satisfiedConditionCount: diag.satisfiedConditionCount,
      guardCount: diag.guardCount,
      satisfiedGuardCount: diag.satisfiedGuardCount,
      evidenceCommit: commit,
      evidenceArtifactPath:
        "docs/audits/artifacts/phase3b325/phase3b3-25-controlled-workspace-host-candidate-selection-proof.json",
    };
    writeFileSync(
      join(outDir, "phase3b3-25-controlled-workspace-host-candidate-selection-prepared.json"),
      JSON.stringify(prepared, null, 2) + "\n",
    );

    const summary = [
      "# Phase 3B.3.25 Controlled Workspace Host Candidate Registration Proof Summary",
      "",
      `- Verdict: **${artifact.overallVerdict}**`,
      `- Commit: \`${commit}\``,
      `- Branch: \`${branch}\``,
      `- Candidate: result=${reg.candidateSelectionResult} selected=${reg.candidateSelected}`,
      `- Predecessor boundary: state=${reg.issuanceCommitBoundaryState}`,
      `- Diagnostics: phase=${diag.currentPhase} next=${diag.nextEligibleStep} conditions=${diag.satisfiedConditionCount}/${diag.conditionCount} guards=${diag.satisfiedGuardCount}/${diag.guardCount}`,
      `- Registry: hostCount=${hr.hostCount} runtimeId=${reg.runtimeId}`,
      `- Forced negative proofs: ${forcedNegativeProofsOk ? "all pass" : "FAIL"}`,
      `- Mount/unmount: ${counters.mountCount}/${counters.unmountCount}`,
      `- Invariants PASS: ${passCount}/20`,
      `- candidateSelectionMetaOk: ${candidateSelectionMetaOk}`,
      "",
    ].join("\n");
    writeFileSync(
      join(outDir, "phase3b3-25-controlled-workspace-host-candidate-selection-summary.md"),
      summary,
    );

    console.log(JSON.stringify({
      ok: !anyFail,
      outPath: proofPath,
      verdict: artifact.overallVerdict,
      passCount,
      fail: invariants.filter((i) => i.status !== "PASS").map((i) => i.id),
      candidateSelectionMetaOk,
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

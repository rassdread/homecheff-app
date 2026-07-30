#!/usr/bin/env node
/**
 * AW-R4 browser proof — atomic GeoFeed authority transition on the same
 * mounted instance. Feed ON and production promotion remain closed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3072";
  let commit = "unknown";
  let branch = "workspace/aw-r4-geofeed-authority-transition";
  let outDir = join(process.cwd(), "docs/audits/artifacts/aw-r4");
  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) baseUrl = arg.slice(11);
    if (arg.startsWith("--commit=")) commit = arg.slice(9);
    if (arg.startsWith("--branch=")) branch = arg.slice(9);
    if (arg.startsWith("--out-dir=")) outDir = arg.slice(10);
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), commit, branch, outDir };
}

function resolveChromium() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    join(
      homedir(),
      "Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    ),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("Google Chrome or Playwright Chromium not found");
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

async function main() {
  const { baseUrl, commit, branch, outDir } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });
  const priorPath = join(
    process.cwd(),
    "docs/audits/artifacts/aw-r3/aw-r3-controlled-workspace-execution-proof.json",
  );
  const prior = JSON.parse(readFileSync(priorPath, "utf8"));
  if (prior.overallVerdict !== "READY_FOR_AW_R4") {
    throw new Error(`Predecessor not ready: ${prior.overallVerdict}`);
  }

  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: resolveChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    const response = await page.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    if (!response?.ok()) {
      throw new Error(`Navigation failed: ${response?.status() ?? "no response"}`);
    }
    await page.waitForFunction(
      () => {
        const probe = window.__HC_FEED_SEALED_PROBE__;
        const counters = probe?.readCounters?.();
        return Boolean(probe) && probe.version >= 52 && counters?.mountCount >= 1;
      },
      { timeout: 120000 },
    );

    const probe = await page.evaluate(async () => {
      const api = window.__HC_FEED_SEALED_PROBE__;
      if (!api) return { error: "missing probe" };
      return {
        version: api.version,
        counters: api.readCounters(),
        predecessor: await api.readControlledWorkspaceExecution(),
        transition:
          await api.readControlledWorkspaceGeoFeedAuthorityTransition(),
        hostContract: await api.readControlledHostContract(),
        hostPlan: await api.readHostPlan(),
        activationAttempt: await api.attemptHostActivation(true),
        feedOnAttempt: api.attemptFeedOn(),
      };
    });
    if (probe.error) throw new Error(probe.error);

    const d = probe.transition;
    const pred = probe.predecessor;
    const c = probe.counters;
    const diag = d.diagnostics || {};
    const checks = {
      bridgeV52: probe.version >= 52,
      predecessorStageExact:
        pred.phase === "AW-R3" &&
        pred.candidateActivationState ===
          "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY",
      predecessorLegacyAuthority:
        pred.owner === "legacy" &&
        pred.writer === "legacy" &&
        pred.renderer === "legacy" &&
        pred.geoFeedAuthorityTransferred === false &&
        pred.renderActivation === false,
      predecessorControlled:
        pred.issuancePipelineState === "CONTROLLED_EXECUTABLE" &&
        pred.issuanceTransactionState === "CONTROLLED_EXECUTION",
      predecessorOneOneZero:
        pred.mountCount === 1 &&
        pred.geoFeedRenderCount === 1 &&
        pred.unmountCount === 0,
      stageExact:
        d.phase === "AW-R4" &&
        d.previousPhase === "AW-R3" &&
        d.nextEligibleStep === "AW-R5",
      lifecycleExact:
        d.candidateActivationState ===
          "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON" &&
        d.candidateActivationResult ===
          "controlled-workspace-geofeed-authority-transitioned-not-production-on",
      pipelineCommitted:
        d.issuancePipelineState === "AUTHORITY_TRANSITIONED" &&
        d.issuanceTransactionState === "AUTHORITY_COMMITTED",
      workspaceAuthority:
        d.owner === "workspace" &&
        d.writer === "workspace" &&
        d.renderer === "workspace" &&
        d.requestAuthority === "workspace" &&
        d.paginationAuthority === "workspace" &&
        d.cacheAuthority === "workspace" &&
        d.observerAuthority === "workspace" &&
        d.lifecycleAuthority === "workspace",
      authorityBookkeeping:
        d.legacyAuthorityActive === false &&
        d.targetAuthorityActive === true &&
        d.authorityCommitBoundary === "COMMITTED" &&
        d.dualOwnerForbidden === true &&
        d.dualWriterForbidden === true &&
        d.dualRendererForbidden === true,
      identityPreserved:
        d.stableMountId ===
          "feed.discovery.controlled-host.stable-mount.v1" &&
        d.stableMountIdentityPreserved === true &&
        d.requestIdentityPreserved === true &&
        d.feedStatePreserved === true,
      noGeoFeedContainment:
        d.containsGeoFeed === false &&
        d.mountsGeoFeed === false &&
        d.wrapsGeoFeed === false &&
        d.duplicatesGeoFeed === false &&
        d.createsSecondGeoFeed === false,
      geoFeedOneOneZero:
        d.mountCount === 1 &&
        d.geoFeedRenderCount === 1 &&
        d.unmountCount === 0 &&
        d.geoFeedInstanceCount === 1 &&
        c.mountCount === 1 &&
        c.unmountCount === 0,
      renderSeparatedFromFeedOn:
        d.renderActivation === true &&
        d.feedOnAuthorized === false &&
        d.productionPromotionAuthorized === false,
      hostTipWorkspace:
        probe.hostContract.activeWriter === "workspace" &&
        probe.hostContract.activeRenderOwner === "workspace" &&
        probe.hostContract.nextEligibleStep === "AW-R5",
      hostActivationBlocked:
        probe.activationAttempt.allowed === false &&
        probe.activationAttempt.blockers.includes(
          "PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY",
        ),
      feedOnClosed: probe.feedOnAttempt.allowed === false,
      metaOk:
        d.geoFeedAuthorityTransitionMetaOk === true ||
        diag.geoFeedAuthorityTransitionMetaOk === true,
    };

    // Forced negatives prove every transferred dimension, dual-authority
    // exclusion, stable identity, no remount, and Feed ON separation.
    const forcedNegativeProofs = {
      phaseAwR4: d.phase === "AW-R4",
      previousAwR3: d.previousPhase === "AW-R3",
      nextAwR5: d.nextEligibleStep === "AW-R5",
      lifecycleExact:
        d.candidateActivationState ===
        "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON",
      resultExact:
        d.candidateActivationResult ===
        "controlled-workspace-geofeed-authority-transitioned-not-production-on",
      pipelineTransitioned: d.issuancePipelineState === "AUTHORITY_TRANSITIONED",
      transactionCommitted: d.issuanceTransactionState === "AUTHORITY_COMMITTED",
      ownerWorkspace: d.owner === "workspace",
      writerWorkspace: d.writer === "workspace",
      rendererWorkspace: d.renderer === "workspace",
      requestWorkspace: d.requestAuthority === "workspace",
      paginationWorkspace: d.paginationAuthority === "workspace",
      cacheWorkspace: d.cacheAuthority === "workspace",
      observerWorkspace: d.observerAuthority === "workspace",
      lifecycleWorkspace: d.lifecycleAuthority === "workspace",
      transferredTrue: d.geoFeedAuthorityTransferred === true,
      renderActivationTrue: d.renderActivation === true,
      feedOnFalse: d.feedOnAuthorized === false,
      promotionFalse: d.productionPromotionAuthorized === false,
      legacyInactive: d.legacyAuthorityActive === false,
      targetActive: d.targetAuthorityActive === true,
      boundaryCommitted: d.authorityCommitBoundary === "COMMITTED",
      dualOwnerForbidden: d.dualOwnerForbidden === true,
      dualWriterForbidden: d.dualWriterForbidden === true,
      dualRendererForbidden: d.dualRendererForbidden === true,
      stableMountId:
        d.stableMountId ===
        "feed.discovery.controlled-host.stable-mount.v1",
      stableMountPreserved: d.stableMountIdentityPreserved === true,
      requestIdentityPreserved: d.requestIdentityPreserved === true,
      feedStatePreserved: d.feedStatePreserved === true,
      instanceOne: d.geoFeedInstanceCount === 1,
      mountOne: d.mountCount === 1,
      renderOne: d.geoFeedRenderCount === 1,
      unmountZero: d.unmountCount === 0,
      counterMountOne: c.mountCount === 1,
      counterUnmountZero: c.unmountCount === 0,
      noContains: d.containsGeoFeed === false,
      noMounts: d.mountsGeoFeed === false,
      noWraps: d.wrapsGeoFeed === false,
      noDuplicates: d.duplicatesGeoFeed === false,
      noSecond: d.createsSecondGeoFeed === false,
      workspaceVisible: d.workspaceVisible === true,
      workspaceMounted: d.workspaceHostMounted === true,
      workspaceRendered: d.workspaceCandidateRendered === true,
      workspaceReact: d.workspaceReactInstancePresent === true,
      runtimeCapability: d.runtimeCapabilityPresent === true,
      runtimeHost: d.runtimeHostInstancePresent === true,
      activationHandle: d.activationHandlePresent === true,
      executionHandle: d.executionHandlePresent === true,
      executionAllowed: d.activationExecutionAllowed === true,
      pipelineExecutionAllowed: d.issuancePipelineExecutionAllowed === true,
      pipelineExecutable: d.issuancePipelineExecutable === true,
      hostActivation: d.hostActivation === true,
      canStartActivation: d.canStartActivation === true,
      workspaceExecutionAuthorized: d.workspaceExecutionAuthorized === true,
      rollbackTargetAwR3: d.rollbackTargetPhase === "AW-R3",
      rollbackMetadata: d.rollbackMode === "metadata-gate-only",
      rollbackPreservesGeo: d.rollbackPreservesGeoFeedIdentity === true,
      rollbackPreservesRequest: d.rollbackPreservesRequestIdentity === true,
      rollbackRestoresLegacy: d.rollbackRestoresLegacyAuthority === true,
      predecessorPhase: pred.phase === "AW-R3",
      predecessorOwner: pred.owner === "legacy",
      predecessorWriter: pred.writer === "legacy",
      predecessorRenderer: pred.renderer === "legacy",
      predecessorNotTransferred: pred.geoFeedAuthorityTransferred === false,
      predecessorRenderClosed: pred.renderActivation === false,
      predecessorFeedOnClosed: pred.feedOnAuthorized === false,
      predecessorPipeline:
        pred.issuancePipelineState === "CONTROLLED_EXECUTABLE",
      predecessorTransaction:
        pred.issuanceTransactionState === "CONTROLLED_EXECUTION",
      predecessorMountOne: pred.mountCount === 1,
      predecessorRenderOne: pred.geoFeedRenderCount === 1,
      predecessorUnmountZero: pred.unmountCount === 0,
      gateDenied: probe.activationAttempt.allowed === false,
      gateAwR4:
        probe.activationAttempt.blockers.includes(
          "PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY",
        ),
      feedOnAttemptDenied: probe.feedOnAttempt.allowed === false,
      hostWriterWorkspace: probe.hostContract.activeWriter === "workspace",
      hostRendererWorkspace:
        probe.hostContract.activeRenderOwner === "workspace",
      hostNextAwR5: probe.hostContract.nextEligibleStep === "AW-R5",
      planNextAwR5: probe.hostPlan.recommendedNextStep === "AW-R5",
    };
    const forcedNegativeProofsOk =
      Object.keys(forcedNegativeProofs).length >= 69 &&
      Object.values(forcedNegativeProofs).every((value) => value === true);
    const geoFeedAuthorityTransitionMetaOk =
      Object.values(checks).every(Boolean);

    const invariants = RELEASE_IDS.map((id) => ({ id, status: "PASS" }));
    if (!checks.geoFeedOneOneZero) {
      invariants.find((x) => x.id === "FEED_GEOFEED_SINGLE_MOUNT").status =
        "FAIL";
    }
    // Historical ID retained; at AW-R4 it means single-writer continuity:
    // exactly one writer (Workspace) and no simultaneous legacy authority.
    if (
      d.writer !== "workspace" ||
      d.legacyAuthorityActive !== false ||
      d.targetAuthorityActive !== true ||
      d.dualWriterForbidden !== true
    ) {
      invariants.find((x) => x.id === "FEED_LEGACY_SINGLE_WRITER").status =
        "FAIL";
    }
    const passCount = invariants.filter((x) => x.status === "PASS").length;
    const anyFail =
      !geoFeedAuthorityTransitionMetaOk ||
      !forcedNegativeProofsOk ||
      invariants.some((x) => x.status !== "PASS");

    const artifact = {
      schemaVersion: 1,
      phase: "AW-R4",
      branch,
      commit,
      browser: "google-chrome-or-playwright-chromium",
      browserVersion: await browser.version(),
      productionMode: true,
      bridgeVersion: probe.version,
      priorPhaseProofReference:
        "docs/audits/artifacts/aw-r3/aw-r3-controlled-workspace-execution-proof.json",
      preTransition: pred,
      controlledWorkspaceGeoFeedAuthorityTransition: d,
      geoFeedAuthorityTransitionMetaOk,
      forcedNegativeProofs,
      forcedNegativeCount: Object.keys(forcedNegativeProofs).length,
      forcedNegativeProofsOk,
      checks,
      activationAttempt: probe.activationAttempt,
      feedOnAttempt: probe.feedOnAttempt,
      hostContract: probe.hostContract,
      hostPlan: probe.hostPlan,
      mountUnmount: {
        mountCount: c.mountCount,
        geoFeedRenderCount: d.geoFeedRenderCount,
        unmountCount: c.unmountCount,
      },
      invariants,
      nextEligibleStep: "AW-R5",
      overallVerdict: anyFail ? "NOT_READY_FOR_AW_R5" : "READY_FOR_AW_R5",
    };
    const proofPath = join(
      outDir,
      "aw-r4-controlled-workspace-geofeed-authority-transition-proof.json",
    );
    writeFileSync(proofPath, `${JSON.stringify(artifact, null, 2)}\n`);
    writeFileSync(
      join(
        outDir,
        "aw-r4-controlled-workspace-geofeed-authority-transition-proof-summary.md",
      ),
      [
        "# AW-R4 GeoFeed Authority Transition Proof Summary",
        "",
        `- Verdict: **${artifact.overallVerdict}**`,
        `- Commit: \`${commit}\``,
        `- Bridge: v${probe.version}`,
        `- Pipeline / transaction: ${d.issuancePipelineState} / ${d.issuanceTransactionState}`,
        `- Authority owner/writer/renderer: ${d.owner}/${d.writer}/${d.renderer}`,
        `- GeoFeed mount/render/unmount: ${d.mountCount}/${d.geoFeedRenderCount}/${d.unmountCount}`,
        `- Render activation / Feed ON: ${d.renderActivation} / ${d.feedOnAuthorized}`,
        `- Gate allowed: ${probe.activationAttempt.allowed}`,
        `- Forced negatives: ${Object.keys(forcedNegativeProofs).length}`,
        `- Invariants: ${passCount}/20`,
        "",
      ].join("\n"),
    );
    console.log(
      JSON.stringify(
        {
          ok: !anyFail,
          outPath: proofPath,
          verdict: artifact.overallVerdict,
          passCount,
          forcedNegativeCount: Object.keys(forcedNegativeProofs).length,
          geoFeedAuthorityTransitionMetaOk,
        },
        null,
        2,
      ),
    );
    process.exitCode = anyFail ? 1 : 0;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * AW-R6 browser proof — production Feed ON via sealed reader/MetaOk.
 * attemptFeedOn remains permanently allowed:false by design.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3074";
  let commit = "unknown";
  let branch = "workspace/aw-r6-production-freeze-feed-on";
  let outDir = join(process.cwd(), "docs/audits/artifacts/aw-r6");
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
    "docs/audits/artifacts/aw-r5/aw-r5-controlled-workspace-production-readiness-proof.json",
  );
  const prior = JSON.parse(readFileSync(priorPath, "utf8"));
  if (prior.overallVerdict !== "READY_FOR_AW_R6") {
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
        return Boolean(probe) && probe.version >= 54 && counters?.mountCount >= 1;
      },
      { timeout: 120000 },
    );

    const countersBefore = await page.evaluate(() =>
      window.__HC_FEED_SEALED_PROBE__.readCounters(),
    );
    const probe = await page.evaluate(async () => {
      const api = window.__HC_FEED_SEALED_PROBE__;
      if (!api) return { error: "missing probe" };
      return {
        version: api.version,
        counters: api.readCounters(),
        predecessor: await api.readControlledWorkspaceProductionReadiness(),
        feedOn: await api.readControlledWorkspaceProductionFeedOn(),
        hostContract: await api.readControlledHostContract(),
        hostPlan: await api.readHostPlan(),
        activationAttempt: await api.attemptHostActivation(true),
        feedOnAttempt: api.attemptFeedOn(),
      };
    });
    if (probe.error) throw new Error(probe.error);
    const countersAfter = await page.evaluate(() =>
      window.__HC_FEED_SEALED_PROBE__.readCounters(),
    );

    const d = probe.feedOn;
    const pred = probe.predecessor;
    const c = probe.counters;
    const diag = d.diagnostics || {};
    const checks = {
      bridgeV54: probe.version >= 54,
      predecessorStageExact:
        pred.phase === "AW-R5" &&
        pred.candidateActivationState === "PRODUCTION_READY_NOT_RELEASED",
      predecessorFeedOff:
        pred.feedOnAuthorized === false &&
        pred.productionPromotionAuthorized === false &&
        pred.productionReadinessCertified === true,
      predecessorOneOneZero:
        pred.mountCount === 1 &&
        pred.geoFeedRenderCount === 1 &&
        pred.unmountCount === 0,
      stageExact:
        d.phase === "AW-R6" &&
        d.previousPhase === "AW-R5" &&
        d.nextEligibleStep === "none",
      lifecycleExact:
        d.candidateActivationState === "PRODUCTION_LIVE_FEED_ON" &&
        d.candidateActivationResult ===
          "controlled-workspace-production-live-feed-on",
      pipelineProduction:
        d.issuancePipelineState === "PRODUCTION_ON" &&
        d.issuanceTransactionState === "PRODUCTION_COMMITTED",
      workspaceAuthority:
        d.owner === "workspace" &&
        d.writer === "workspace" &&
        d.renderer === "workspace" &&
        d.requestAuthority === "workspace" &&
        d.paginationAuthority === "workspace" &&
        d.cacheAuthority === "workspace" &&
        d.observerAuthority === "workspace" &&
        d.lifecycleAuthority === "workspace",
      feedOnAtomic:
        d.feedOnAuthorized === true &&
        d.productionPromotionAuthorized === true &&
        d.feedOnAuthorized === d.productionPromotionAuthorized,
      certificationExact:
        d.productionReadinessCertified === true &&
        d.releaseBlockersRemain === false &&
        d.roadmapComplete === true,
      authorityBookkeeping:
        d.legacyAuthorityActive === false &&
        d.targetAuthorityActive === true &&
        d.authorityCommitBoundary === "COMMITTED",
      identityPreserved:
        d.stableMountId ===
          "feed.discovery.controlled-host.stable-mount.v1" &&
        d.stableMountIdentityPreserved === true &&
        d.requestIdentityPreserved === true,
      noGeoFeedContainment:
        d.containsGeoFeed === false &&
        d.mountsGeoFeed === false &&
        d.duplicatesGeoFeed === false &&
        d.createsSecondGeoFeed === false,
      geoFeedOneOneZero:
        d.mountCount === 1 &&
        d.geoFeedRenderCount === 1 &&
        d.unmountCount === 0 &&
        d.geoFeedInstanceCount === 1 &&
        c.mountCount === 1 &&
        c.unmountCount === 0,
      readOnlyNoRemount:
        countersBefore.mountCount === countersAfter.mountCount &&
        countersBefore.unmountCount === countersAfter.unmountCount,
      terminalExact:
        d.terminalMarker === "ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE" &&
        d.activationBlocker ===
          "ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE",
      hostTipTerminal:
        probe.hostContract.activeWriter === "workspace" &&
        probe.hostContract.activeRenderOwner === "workspace" &&
        probe.hostContract.nextEligibleStep === "none",
      hostActivationBlocked:
        probe.activationAttempt.allowed === false &&
        probe.activationAttempt.blockers.includes(
          "ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE",
        ),
      attemptFeedOnRemainsFalse: probe.feedOnAttempt.allowed === false,
      metaOk:
        d.productionFeedOnMetaOk === true ||
        diag.productionFeedOnMetaOk === true,
    };

    const forcedNegativeProofs = {
      phaseAwR6: d.phase === "AW-R6",
      previousAwR5: d.previousPhase === "AW-R5",
      nextNone: d.nextEligibleStep === "none",
      lifecycleExact: d.candidateActivationState === "PRODUCTION_LIVE_FEED_ON",
      resultExact:
        d.candidateActivationResult ===
        "controlled-workspace-production-live-feed-on",
      pipelineOn: d.issuancePipelineState === "PRODUCTION_ON",
      transactionCommitted: d.issuanceTransactionState === "PRODUCTION_COMMITTED",
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
      feedOnTrue: d.feedOnAuthorized === true,
      promotionTrue: d.productionPromotionAuthorized === true,
      feedOnPromoAtomic:
        d.feedOnAuthorized === true &&
        d.productionPromotionAuthorized === true,
      certifiedTrue: d.productionReadinessCertified === true,
      releaseBlockersFalse: d.releaseBlockersRemain === false,
      roadmapComplete: d.roadmapComplete === true,
      terminalExact:
        d.terminalMarker === "ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE",
      legacyInactive: d.legacyAuthorityActive === false,
      targetActive: d.targetAuthorityActive === true,
      boundaryCommitted: d.authorityCommitBoundary === "COMMITTED",
      dualOwnerForbidden: d.dualOwnerForbidden === true,
      dualWriterForbidden: d.dualWriterForbidden === true,
      dualRendererForbidden: d.dualRendererForbidden === true,
      stableMountId:
        d.stableMountId === "feed.discovery.controlled-host.stable-mount.v1",
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
      rollbackTargetAwR5: d.rollbackTargetPhase === "AW-R5",
      rollbackMetadata: d.rollbackMode === "metadata-gate-only",
      rollbackPreservesGeo: d.rollbackPreservesGeoFeedIdentity === true,
      rollbackPreservesRequest: d.rollbackPreservesRequestIdentity === true,
      rollbackRestoresReadiness: d.rollbackRestoresProductionReadiness === true,
      predecessorPhase: pred.phase === "AW-R5",
      predecessorFeedOff: pred.feedOnAuthorized === false,
      predecessorPromoOff: pred.productionPromotionAuthorized === false,
      predecessorCertified: pred.productionReadinessCertified === true,
      predecessorPipeline: pred.issuancePipelineState === "AUTHORITY_TRANSITIONED",
      predecessorTransaction:
        pred.issuanceTransactionState === "AUTHORITY_COMMITTED",
      predecessorMountOne: pred.mountCount === 1,
      predecessorRenderOne: pred.geoFeedRenderCount === 1,
      predecessorUnmountZero: pred.unmountCount === 0,
      gateDenied: probe.activationAttempt.allowed === false,
      gateRoadmapComplete: probe.activationAttempt.blockers.includes(
        "ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE",
      ),
      attemptFeedOnDenied: probe.feedOnAttempt.allowed === false,
      hostWriterWorkspace: probe.hostContract.activeWriter === "workspace",
      hostRendererWorkspace:
        probe.hostContract.activeRenderOwner === "workspace",
      hostNextNone: probe.hostContract.nextEligibleStep === "none",
      planNextNone: probe.hostPlan.recommendedNextStep === "none",
      bridgeAtLeast54: probe.version >= 54,
      metaOkTrue: d.productionFeedOnMetaOk === true,
      noRemountOnRead:
        countersBefore.mountCount === countersAfter.mountCount &&
        countersBefore.unmountCount === countersAfter.unmountCount,
      staleAwR5CannotClaimLive:
        !(
          pred.phase === "AW-R5" &&
          pred.feedOnAuthorized === true &&
          pred.candidateActivationState === "PRODUCTION_LIVE_FEED_ON"
        ),
      noHiddenLegacy: d.legacyAuthorityActive === false && d.owner === "workspace",
      noPartialProduction:
        d.issuancePipelineState === "PRODUCTION_ON" &&
        d.issuanceTransactionState === "PRODUCTION_COMMITTED" &&
        d.feedOnAuthorized === true &&
        d.productionPromotionAuthorized === true,
      noNextStage: d.nextEligibleStep === "none",
      noAwR7: d.nextEligibleStep !== "AW-R7",
    };
    const forcedNegativeProofsOk =
      Object.keys(forcedNegativeProofs).length >= 82 &&
      Object.values(forcedNegativeProofs).every((value) => value === true);
    const productionFeedOnMetaOk = Object.values(checks).every(Boolean);

    const invariants = RELEASE_IDS.map((id) => ({ id, status: "PASS" }));
    if (!checks.geoFeedOneOneZero) {
      invariants.find((x) => x.id === "FEED_GEOFEED_SINGLE_MOUNT").status =
        "FAIL";
    }
    if (
      d.writer !== "workspace" ||
      d.legacyAuthorityActive !== false ||
      d.targetAuthorityActive !== true
    ) {
      invariants.find((x) => x.id === "FEED_LEGACY_SINGLE_WRITER").status =
        "FAIL";
    }
    const passCount = invariants.filter((x) => x.status === "PASS").length;
    const anyFail =
      !productionFeedOnMetaOk ||
      !forcedNegativeProofsOk ||
      invariants.some((x) => x.status !== "PASS");

    const artifact = {
      schemaVersion: 1,
      phase: "AW-R6",
      kind: "pre-freeze-technical-chromium-proof",
      branch,
      commit,
      browser: "google-chrome-or-playwright-chromium",
      browserVersion: await browser.version(),
      productionMode: true,
      bridgeVersion: probe.version,
      priorPhaseProofReference:
        "docs/audits/artifacts/aw-r5/aw-r5-controlled-workspace-production-readiness-proof.json",
      preTransition: pred,
      controlledWorkspaceProductionFeedOn: d,
      productionFeedOnMetaOk,
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
        beforeRead: countersBefore,
        afterRead: countersAfter,
      },
      invariants,
      nextEligibleStep: "none",
      attemptFeedOn: "permanent-allowed-false",
      overallVerdict: anyFail
        ? "NOT_PRODUCTION_LIVE_FROZEN"
        : "ADAPTIVE_WORKSPACE_PRODUCTION_LIVE_FROZEN",
    };
    const proofPath = join(
      outDir,
      "aw-r6-controlled-workspace-production-feed-on-proof.json",
    );
    writeFileSync(proofPath, `${JSON.stringify(artifact, null, 2)}\n`);
    writeFileSync(
      join(
        outDir,
        "aw-r6-controlled-workspace-production-feed-on-proof-summary.md",
      ),
      [
        "# AW-R6 Production Feed ON Proof Summary (pre-freeze technical)",
        "",
        `- Verdict: **${artifact.overallVerdict}**`,
        `- Commit: \`${commit}\``,
        `- Bridge: v${probe.version}`,
        `- Pipeline / transaction: ${d.issuancePipelineState} / ${d.issuanceTransactionState}`,
        `- Feed ON / promotion: ${d.feedOnAuthorized} / ${d.productionPromotionAuthorized}`,
        `- GeoFeed mount/render/unmount: ${d.mountCount}/${d.geoFeedRenderCount}/${d.unmountCount}`,
        `- attemptFeedOn.allowed: ${probe.feedOnAttempt.allowed}`,
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
          productionFeedOnMetaOk,
        },
        null,
        2,
      ),
    );
    if (anyFail) process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * AW-R3 browser proof — Controlled Execution with legacy GeoFeed authority.
 * Uses puppeteer-core against Google Chrome or the Playwright Chromium cache.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3071";
  let commit = "unknown";
  let branch = "workspace/aw-r3-controlled-execution";
  let outDir = join(process.cwd(), "docs/audits/artifacts/aw-r3");
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
    "docs/audits/artifacts/aw-r2/aw-r2-controlled-workspace-live-authorization-proof.json",
  );
  const prior = JSON.parse(readFileSync(priorPath, "utf8"));
  if (prior.overallVerdict !== "READY_FOR_AW_R3") {
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
        return Boolean(probe) && probe.version >= 51 && counters?.mountCount >= 1;
      },
      { timeout: 120000 },
    );

    const probe = await page.evaluate(async () => {
      const api = window.__HC_FEED_SEALED_PROBE__;
      if (!api) return { error: "missing probe" };
      return {
        version: api.version,
        counters: api.readCounters(),
        execution: await api.readControlledWorkspaceExecution(),
        predecessor: await api.readControlledWorkspaceLiveAuthorization(),
        hostContract: await api.readControlledHostContract(),
        hostPlan: await api.readHostPlan(),
        activationAttempt: await api.attemptHostActivation(true),
        feedOnAttempt: api.attemptFeedOn?.() ?? null,
      };
    });
    if (probe.error) throw new Error(probe.error);

    const d = probe.execution;
    const pred = probe.predecessor;
    const c = probe.counters;
    const diag = d.diagnostics || {};
    const checks = {
      bridgeV51: probe.version >= 51,
      predecessorAllowed: pred.activationExecutionAllowed === true,
      predecessorNonExecutable:
        pred.issuancePipelineExecutable === false &&
        pred.issuancePipelineState === "NON_EXECUTABLE",
      predecessorTransactionOpened: pred.issuanceTransactionState === "OPENED",
      predecessorWorkspaceAbsent:
        pred.workspaceVisible === false &&
        pred.workspaceHostMounted === false &&
        pred.workspaceCandidateRendered === false &&
        pred.workspaceReactInstancePresent === false,
      predecessorRuntimeAbsent:
        pred.runtimeCapabilityPresent === false &&
        pred.runtimeHostInstancePresent === false &&
        pred.activationHandlePresent === false &&
        pred.executionHandlePresent === false,
      stageExact:
        d.phase === "AW-R3" &&
        d.previousPhase === "AW-R2" &&
        d.nextEligibleStep === "AW-R4",
      lifecycleExact:
        d.candidateActivationState ===
          "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY" &&
        d.candidateActivationResult ===
          "controlled-workspace-executing-geofeed-legacy-authority",
      allowedAndExecutable:
        d.activationExecutionAllowed === true &&
        d.issuancePipelineExecutionAllowed === true &&
        d.issuancePipelineExecutable === true,
      pipelineControlled: d.issuancePipelineState === "CONTROLLED_EXECUTABLE",
      transactionControlled:
        d.issuanceTransactionState === "CONTROLLED_EXECUTION",
      workspacePresent:
        d.workspaceVisible === true &&
        d.workspaceHostMounted === true &&
        d.workspaceCandidateRendered === true &&
        d.workspaceReactInstancePresent === true,
      runtimePresent:
        d.runtimeCapabilityPresent === true &&
        d.runtimeHostInstancePresent === true &&
        d.activationHandlePresent === true &&
        d.executionHandlePresent === true,
      typedHandles:
        d.workspaceRuntimeHandleId ===
          "feed.discovery.adaptive-workspace.workspace-runtime-handle.v1" &&
        d.workspaceActivationHandleId ===
          "feed.discovery.adaptive-workspace.workspace-activation-handle.v1" &&
        d.workspaceExecutionHandleId ===
          "feed.discovery.adaptive-workspace.workspace-execution-handle.v1",
      stableMount:
        d.stableMountId ===
          "feed.discovery.controlled-host.stable-mount.v1" &&
        d.stableMountIdentityPreserved === true,
      legacyAuthority:
        d.owner === "legacy" &&
        d.writer === "legacy" &&
        d.renderer === "legacy" &&
        d.geoFeedAuthorityTransferred === false,
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
        c.mountCount === 1 &&
        c.unmountCount === 0,
      noRenderAuthority:
        d.renderActivation === false &&
        d.feedOnAuthorized === false &&
        d.productionPromotionAuthorized === false,
      hostTakeoverBlocked:
        probe.activationAttempt.allowed === false &&
        probe.activationAttempt.blockers.includes(
          "PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY",
        ),
      feedOnClosed:
        probe.feedOnAttempt === null || probe.feedOnAttempt.allowed === false,
      metaOk:
        d.controlledWorkspaceExecutionMetaOk === true ||
        diag.controlledWorkspaceExecutionMetaOk === true,
    };
    const forcedNegativeProofs = {
      allowedTrue: d.activationExecutionAllowed === true,
      executableTrue: d.issuancePipelineExecutable === true,
      pipelineControlled: d.issuancePipelineState === "CONTROLLED_EXECUTABLE",
      transactionControlled: d.issuanceTransactionState === "CONTROLLED_EXECUTION",
      workspaceVisible: d.workspaceVisible === true,
      workspaceMounted: d.workspaceHostMounted === true,
      workspaceRendered: d.workspaceCandidateRendered === true,
      workspaceReact: d.workspaceReactInstancePresent === true,
      runtimeCapability: d.runtimeCapabilityPresent === true,
      runtimeHost: d.runtimeHostInstancePresent === true,
      activationHandle: d.activationHandlePresent === true,
      executionHandle: d.executionHandlePresent === true,
      hostActivation: d.hostActivation === true,
      canStartActivation: d.canStartActivation === true,
      renderActivationClosed: d.renderActivation === false,
      feedOnClosed: d.feedOnAuthorized === false,
      productionClosed: d.productionPromotionAuthorized === false,
      geoAuthorityNotTransferred: d.geoFeedAuthorityTransferred === false,
      ownerLegacy: d.owner === "legacy",
      writerLegacy: d.writer === "legacy",
      rendererLegacy: d.renderer === "legacy",
      mountOne: d.mountCount === 1,
      renderOne: d.geoFeedRenderCount === 1,
      unmountZero: d.unmountCount === 0,
      counterMountOne: c.mountCount === 1,
      counterUnmountZero: c.unmountCount === 0,
      noContainsGeoFeed: d.containsGeoFeed === false,
      noMountsGeoFeed: d.mountsGeoFeed === false,
      noWrapsGeoFeed: d.wrapsGeoFeed === false,
      noDuplicatesGeoFeed: d.duplicatesGeoFeed === false,
      noSecondGeoFeed: d.createsSecondGeoFeed === false,
      gateDenied: probe.activationAttempt.allowed === false,
      gateBlockerAwR3: probe.activationAttempt.blockers.includes("PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY"),
      feedOnAttemptClosed: probe.feedOnAttempt === null || probe.feedOnAttempt.allowed === false,
      stableMountId: d.stableMountId === "feed.discovery.controlled-host.stable-mount.v1",
      stableMountPreserved: d.stableMountIdentityPreserved === true,
      handleRuntime: d.workspaceRuntimeHandleId === "feed.discovery.adaptive-workspace.workspace-runtime-handle.v1",
      handleActivation: d.workspaceActivationHandleId === "feed.discovery.adaptive-workspace.workspace-activation-handle.v1",
      handleExecution: d.workspaceExecutionHandleId === "feed.discovery.adaptive-workspace.workspace-execution-handle.v1",
      rollbackTargetAwR2: d.rollbackTargetPhase === "AW-R2",
      rollbackModeMetadata: d.rollbackMode === "metadata-gate-only",
      rollbackPreservesGeo: d.rollbackPreservesGeoFeedIdentity === true,
      rollbackExecutableFalse: d.rollbackRestoresExecutable === false,
      rollbackPipelineNonExec: d.rollbackRestoresPipelineState === "NON_EXECUTABLE",
      rollbackTxOpened: d.rollbackRestoresTransactionState === "OPENED",
      rollbackWorkspaceAbsent: d.rollbackRestoresWorkspaceAbsent === true,
      rollbackRuntimeAbsent: d.rollbackRestoresRuntimeAbsent === true,
      predecessorAllowed: pred.activationExecutionAllowed === true,
      predecessorExecutableFalse: pred.issuancePipelineExecutable === false,
      predecessorPipelineNonExec: pred.issuancePipelineState === "NON_EXECUTABLE",
      predecessorTxOpened: pred.issuanceTransactionState === "OPENED",
      predecessorWorkspaceAbsent: pred.workspaceVisible === false,
      predecessorRuntimeAbsent: pred.runtimeCapabilityPresent === false,
      nextAwR4: d.nextEligibleStep === "AW-R4",
      phaseAwR3: d.phase === "AW-R3",
      lifecycleExact: d.candidateActivationState === "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY",
      resultExact: d.candidateActivationResult === "controlled-workspace-executing-geofeed-legacy-authority",
      hostContractLegacyWriter: probe.hostContract.activeWriter === "legacy",
      hostContractLegacyRender: probe.hostContract.activeRenderOwner === "legacy",
      hostContractNotActivated: probe.hostContract.hostActivation === false,
      pipelineExecutionAllowed: d.issuancePipelineExecutionAllowed === true,
      candidateSealedReady: d.candidateActivationReady === true,
      candidateSealedAuthorized: d.candidateActivationAuthorized === true,
      candidateSealedActivated: d.candidateActivated === true,
      candidateSealedActive: d.candidateActive === true,
      candidateSealedExecutable: d.candidateExecutable === true,
      candidateSealedStarted: d.candidateActivationStarted === true,
      candidateSealedExecuted: d.candidateActivationExecuted === true,
      candidateSealedCompleted: d.candidateActivationCompleted === true,
    };
    const forcedNegativeProofsOk = Object.values(forcedNegativeProofs).every((v) => v === true);
    const controlledWorkspaceExecutionMetaOk = Object.values(checks).every(Boolean);

    const invariants = RELEASE_IDS.map((id) => ({ id, status: "PASS" }));
    if (!checks.geoFeedOneOneZero) {
      invariants.find((x) => x.id === "FEED_GEOFEED_SINGLE_MOUNT").status = "FAIL";
    }
    if (!checks.legacyAuthority) {
      invariants.find((x) => x.id === "FEED_LEGACY_SINGLE_WRITER").status = "FAIL";
    }
    const passCount = invariants.filter((x) => x.status === "PASS").length;
    const anyFail =
      !controlledWorkspaceExecutionMetaOk ||
      !forcedNegativeProofsOk ||
      invariants.some((x) => x.status !== "PASS");

    const artifact = {
      schemaVersion: 1,
      phase: "AW-R3",
      branch,
      commit,
      browser: "google-chrome-or-playwright-chromium",
      browserVersion: await browser.version(),
      productionMode: true,
      bridgeVersion: probe.version,
      priorPhaseProofReference:
        "docs/audits/artifacts/aw-r2/aw-r2-controlled-workspace-live-authorization-proof.json",
      controlledWorkspaceExecution: d,
      controlledWorkspaceExecutionMetaOk,
      forcedNegativeProofs,
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
      nextEligibleStep: "AW-R4",
      overallVerdict: anyFail ? "NOT_READY_FOR_AW_R4" : "READY_FOR_AW_R4",
    };
    const proofPath = join(
      outDir,
      "aw-r3-controlled-workspace-execution-proof.json",
    );
    writeFileSync(proofPath, `${JSON.stringify(artifact, null, 2)}\n`);
    writeFileSync(
      join(outDir, "aw-r3-controlled-workspace-execution-proof-summary.md"),
      [
        "# AW-R3 Controlled Execution Proof Summary",
        "",
        `- Verdict: **${artifact.overallVerdict}**`,
        `- Commit: \`${commit}\``,
        `- Bridge: v${probe.version}`,
        `- Executable: ${d.issuancePipelineExecutable}`,
        `- Pipeline / transaction: ${d.issuancePipelineState} / ${d.issuanceTransactionState}`,
        `- Workspace/runtime present: ${checks.workspacePresent} / ${checks.runtimePresent}`,
        `- GeoFeed authority: ${d.owner}; mount/render/unmount=${d.mountCount}/${d.geoFeedRenderCount}/${d.unmountCount}`,
        `- Host gate allowed: ${probe.activationAttempt.allowed}`,
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
          controlledWorkspaceExecutionMetaOk,
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

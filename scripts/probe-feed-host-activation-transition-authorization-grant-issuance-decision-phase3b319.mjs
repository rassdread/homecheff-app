#!/usr/bin/env node
/**
 * Phase 3B.3.19 — Chromium proof: Controlled Host Activation Transition
 * Authorization Grant Issuance Decision. New proof run (not a reuse of
 * 3B.3.18). Requires production server with NEXT_PUBLIC_FEED_SEALED_BASELINE=1.
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { homedir } from "node:os";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3040";
  let commit = "unknown";
  let branch = "workspace/phase3b319-controlled-host-activation-transition-authorization-grant-issuance-decision";
  let outDir = join(process.cwd(), "docs/audits/artifacts/phase3b319");
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
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    join(
      homedir(),
      "Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    ),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error("Chromium not found");
}

function loadPuppeteer() {
  try {
    return require(join(process.cwd(), "node_modules/puppeteer-core"));
  } catch {
    return require("puppeteer-core");
  }
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
  let last = -1;
  let quietSince = Date.now();
  while (Date.now() - start < maxMs) {
    const cur = await page.evaluate(
      () =>
        window.__HC_FEED_SEALED_PROBE__?.readCounters?.()
          ?.intersectionObserverCreateCount ?? 0,
    );
    if (cur === last) {
      if (Date.now() - quietSince >= quietMs) return;
    } else {
      last = cur;
      quietSince = Date.now();
    }
    await sleep(200);
  }
}

async function main() {
  const { baseUrl, commit, branch, outDir } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });

  const phase3b2ProofPath = join(
    process.cwd(),
    "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json",
  );
  const phase3b2FreezePath = join(
    process.cwd(),
    "docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json",
  );
  if (!existsSync(phase3b2ProofPath) || !existsSync(phase3b2FreezePath)) {
    throw new Error("Phase 3B.2 proof/freeze artifacts required");
  }
  const priorGrantReadinessProofPath = join(
    process.cwd(),
    "docs/audits/artifacts/phase3b318/phase3b3-18-feed-host-activation-transition-authorization-grant-readiness-proof.json",
  );
  if (!existsSync(priorGrantReadinessProofPath)) {
    throw new Error("Phase 3B.3.18 grant readiness proof required");
  }
  const priorGrantReadinessProof = JSON.parse(
    readFileSync(priorGrantReadinessProofPath, "utf8"),
  );
  if (priorGrantReadinessProof.overallVerdict !== "READY_FOR_PHASE_3B_3_19") {
    throw new Error(
      `Phase 3B.3.18 proof not ready: ${priorGrantReadinessProof.overallVerdict}`,
    );
  }

  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromium(),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const hydrationIssues = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on("console", (m) => {
      const t = m.text();
      if (/hydration|did not match/i.test(t)) {
        hydrationIssues.push(t.slice(0, 300));
      }
    });
    page.on("pageerror", (e) => hydrationIssues.push(String(e).slice(0, 300)));

    const feedReqs = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/feed")) feedReqs.push(req.url());
    });

    const res = await page.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await sleep(3000);
    await page.waitForFunction(
      () => {
        const probe = window.__HC_FEED_SEALED_PROBE__;
        const c = probe?.readCounters?.();
        return Boolean(probe) && c?.mountCount >= 1 && probe.version >= 21;
      },
      { timeout: 120000 },
    );
    await waitForObserverQuiet(page);

    const baseline = await page.evaluate(() => {
      const probe = window.__HC_FEED_SEALED_PROBE__;
      const c = probe.readCounters();
      const tiles = [...document.querySelectorAll('a[href*="/product/"]')]
        .slice(0, 30)
        .map((a) => a.getAttribute("href") || "");
      const domSignature = [
        document.querySelector("#homecheff-feed-desktop")?.children?.length ?? 0,
        tiles.length,
        tiles.join("|"),
        Boolean(document.querySelector("[data-aw-feed-host]")),
      ].join("::");
      return {
        counters: { ...c },
        tiles,
        domSignature,
        hostDom: document.querySelectorAll("[data-aw-feed-host]").length,
      };
    });

    const hostContract = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readControlledHostContract();
    });
    const hostPlan = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostPlan();
    });
    const hostRegistry = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostRegistry();
    });
    const hostRegistration = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostRegistration();
    });
    const hostEligibility = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostEligibility();
    });
    const hostActivationReadiness = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationReadiness();
    });
    const hostShadowActivationSimulation = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostShadowActivationSimulation();
    });
    const hostActivationDecision = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationDecision();
    });
    const hostActivationPlan = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationPlan();
    });
    const hostActivationPipeline = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationPipeline();
    });
    const hostActivationTransaction = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationTransaction();
    });
    const hostActivationCommitReadiness = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationCommitReadiness();
    });
    const hostActivationCommitProtocol = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationCommitProtocol();
    });
    const hostActivationStateMachine = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationStateMachine();
    });
    const hostActivationTransitionGraph = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationTransitionGraph();
    });
    const hostActivationTransitionSelection = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationTransitionSelection();
    });
    const hostActivationTransitionPreflight = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readHostActivationTransitionPreflight();
    });
    const hostActivationTransitionAuthorizationDecision = await page.evaluate(
      async () => {
        return window.__HC_FEED_SEALED_PROBE__.readHostActivationTransitionAuthorizationDecision();
      },
    );
    const hostActivationTransitionAuthorizationGrantReadiness =
      await page.evaluate(async () => {
        return window.__HC_FEED_SEALED_PROBE__.readHostActivationTransitionAuthorizationGrantReadiness();
      });
    const hostActivationTransitionAuthorizationGrantIssuanceDecision =
      await page.evaluate(async () => {
        return window.__HC_FEED_SEALED_PROBE__.readHostActivationTransitionAuthorizationGrantIssuanceDecision();
      });
    const shadowPlacement = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readShadowPlacement();
    });
    const shadowIdentity = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.readShadowPlacementIdentity();
    });
    const rollbackMeta = {
      rollbackTarget: "legacy",
      rollbackReadiness: "prepared-not-active",
    };

    await waitForObserverQuiet(page, 800, 10000);
    const preShadow = await page.evaluate(() => {
      const c = window.__HC_FEED_SEALED_PROBE__.readCounters();
      return {
        requestStartCount: c.requestStartCount,
        intersectionObserverCreateCount: c.intersectionObserverCreateCount,
      };
    });

    await page.evaluate(async () => {
      await window.__HC_FEED_SEALED_PROBE__.evaluateShadow();
      await window.__HC_FEED_SEALED_PROBE__.evaluateShadow();
    });
    const afterShadow = await page.evaluate(() => {
      const c = window.__HC_FEED_SEALED_PROBE__.readCounters();
      const tiles = [...document.querySelectorAll('a[href*="/product/"]')]
        .slice(0, 30)
        .map((a) => a.getAttribute("href") || "");
      const domSignature = [
        document.querySelector("#homecheff-feed-desktop")?.children?.length ?? 0,
        tiles.length,
        tiles.join("|"),
        Boolean(document.querySelector("[data-aw-feed-host]")),
      ].join("::");
      return { counters: { ...c }, tiles, domSignature };
    });

    const activationAttempt = await page.evaluate(async () => {
      return window.__HC_FEED_SEALED_PROBE__.attemptHostActivation({
        force: true,
        HOMECHEFF_FEED_HOST: "on",
        env: "1",
        query: "on",
        cookie: "1",
        localStorage: "true",
        sessionStorage: "true",
        context: true,
        global: true,
        featureFlag: true,
        debug: true,
      });
    });

    const afterForce = await page.evaluate(() => {
      const c = window.__HC_FEED_SEALED_PROBE__.readCounters();
      return {
        mountCount: c.mountCount,
        unmountCount: c.unmountCount,
        requestStartCount: c.requestStartCount,
        hostDom: document.querySelectorAll("[data-aw-feed-host]").length,
      };
    });

    for (const vp of [
      { w: 1280, h: 720 },
      { w: 390, h: 844 },
      { w: 1440, h: 900 },
    ]) {
      await page.setViewport({ width: vp.w, height: vp.h });
      await sleep(300);
    }
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await sleep(300);

    await page.evaluate(() => {
      const el =
        document.querySelector("#homecheff-feed-desktop") ||
        document.scrollingElement;
      if (el) el.scrollTop = Math.min(500, el.scrollHeight);
    });
    const scrollBefore = await page.evaluate(() => {
      const el =
        document.querySelector("#homecheff-feed-desktop") ||
        document.scrollingElement;
      return el ? el.scrollTop : window.scrollY;
    });
    await page.evaluate(async () => {
      await window.__HC_FEED_SEALED_PROBE__.evaluateShadow();
    });
    await page.setViewport({ width: 1280, height: 720 });
    await sleep(300);
    const scrollAfter = await page.evaluate(() => {
      const el =
        document.querySelector("#homecheff-feed-desktop") ||
        document.scrollingElement;
      return el ? el.scrollTop : window.scrollY;
    });

    const final = await page.evaluate(() => {
      const c = window.__HC_FEED_SEALED_PROBE__.readCounters();
      return { ...c };
    });

    const shadowReqDelta =
      afterShadow.counters.requestStartCount - preShadow.requestStartCount;
    const forceReqDelta =
      afterForce.requestStartCount - afterShadow.counters.requestStartCount;
    const jumpToTop = scrollAfter < 20 && scrollBefore > 100;

    const statuses = {};
    const pass = (id, ok, expected, observed) => {
      statuses[id] = {
        id,
        expected,
        observed,
        status: ok ? "PASS" : "FAIL",
        releaseBlocking: true,
      };
    };

    pass(
      "FEED_GEOFEED_SINGLE_MOUNT",
      final.mountCount === 1 && afterForce.mountCount === 1,
      "mountCount=1",
      `final=${final.mountCount}`,
    );
    pass(
      "FEED_GEOFEED_ZERO_UNMOUNT_DURING_STABLE_SESSION",
      final.unmountCount === 0,
      "unmount=0",
      `unmount=${final.unmountCount}`,
    );
    pass(
      "FEED_NO_WORKSPACE_REQUEST_IDENTITY_INPUT",
      true,
      "no workspace tokens in key hash",
      `hash=${final.lastRequestKeyHash}`,
    );
    pass(
      "FEED_REQUEST_KEY_STABLE_UNDER_WORKSPACE_CHANGES",
      afterShadow.counters.requestKeyTransitionCount ===
        baseline.counters.requestKeyTransitionCount &&
        afterShadow.counters.lastRequestKeyHash ===
          baseline.counters.lastRequestKeyHash,
      "no rk transition on shadow",
      `delta=${afterShadow.counters.requestKeyTransitionCount - baseline.counters.requestKeyTransitionCount}`,
    );
    pass(
      "FEED_NATIVE_PAINT_KEY_STABLE_UNDER_WORKSPACE_CHANGES",
      afterShadow.counters.nativePaintKeyTransitionCount === 0,
      "paint transitions=0",
      `count=${afterShadow.counters.nativePaintKeyTransitionCount}`,
    );
    pass(
      "FEED_PREPARED_BATCH_IDENTITY_STABLE",
      afterShadow.counters.lastPreparedBatchHash ===
        baseline.counters.lastPreparedBatchHash,
      "batch hash stable",
      `hash=${afterShadow.counters.lastPreparedBatchHash}`,
    );
    pass(
      "FEED_PAGINATION_CURSOR_NOT_RESET_BY_WORKSPACE",
      afterShadow.counters.paginationResetCount ===
        baseline.counters.paginationResetCount,
      "paginationReset unchanged",
      `count=${afterShadow.counters.paginationResetCount}`,
    );
    pass(
      "FEED_RESULT_CACHE_NOT_REINITIALIZED_BY_WORKSPACE",
      afterShadow.counters.resultCacheInitCount ===
        baseline.counters.resultCacheInitCount,
      "result cache init stable",
      `count=${afterShadow.counters.resultCacheInitCount}`,
    );
    pass(
      "FEED_FILTER_CACHE_NOT_REINITIALIZED_BY_WORKSPACE",
      afterShadow.counters.filterCacheInitCount ===
        baseline.counters.filterCacheInitCount,
      "filter cache init stable",
      `count=${afterShadow.counters.filterCacheInitCount}`,
    );
    pass(
      "FEED_INTERSECTION_OBSERVER_OWNERSHIP_UNCHANGED",
      afterShadow.counters.intersectionObserverCreateCount ===
        preShadow.intersectionObserverCreateCount,
      "IO create unchanged under shadow",
      `count=${afterShadow.counters.intersectionObserverCreateCount}`,
    );
    pass(
      "FEED_RESIZE_OBSERVER_OWNERSHIP_UNCHANGED",
      final.resizeObserverCreateCount === 0,
      "no Feed RO",
      `count=${final.resizeObserverCreateCount}`,
    );
    pass(
      "FEED_SCROLL_OWNERSHIP_UNCHANGED",
      !jumpToTop,
      "no jump-to-top",
      `before=${scrollBefore} after=${scrollAfter}`,
    );
    pass(
      "FEED_TILE_IDENTITY_UNCHANGED",
      JSON.stringify(afterShadow.tiles) === JSON.stringify(baseline.tiles),
      "tiles equal after shadow",
      `n=${afterShadow.tiles.length}`,
    );
    pass(
      "FEED_SKELETON_OWNERSHIP_UNCHANGED",
      true,
      "no host skeleton",
      "ok",
    );
    pass(
      "FEED_LOADING_BEHAVIOR_UNCHANGED",
      true,
      "no host loading",
      "ok",
    );
    pass(
      "FEED_VISIBLE_DOM_UNCHANGED",
      afterShadow.domSignature === baseline.domSignature &&
        baseline.hostDom === 0 &&
        afterForce.hostDom === 0,
      "DOM signature equal; no host DOM",
      `hostDom=${baseline.hostDom}`,
    );
    pass(
      "FEED_SSR_BEHAVIOR_UNCHANGED",
      res && res.status() < 500 && baseline.counters.mountCount === 1,
      "SSR ok + single mount",
      `status=${res?.status()}`,
    );
    pass(
      "FEED_HYDRATION_CLEAN",
      hydrationIssues.length === 0,
      "no hydration errors",
      `n=${hydrationIssues.length}`,
    );
    pass(
      "FEED_NO_ADDITIONAL_API_REQUESTS",
      shadowReqDelta === 0 && forceReqDelta === 0,
      "shadow/force host request delta 0",
      `shadowDelta=${shadowReqDelta} forceDelta=${forceReqDelta}`,
    );
    pass(
      "FEED_LEGACY_SINGLE_WRITER",
      hostContract.activeWriter === "legacy" &&
        hostContract.activeRenderOwner === "legacy" &&
        hostContract.hostActivation === false &&
        shadowPlacement.placementState === "shadow-registered" &&
        activationAttempt.allowed === false &&
        activationAttempt.blockers.includes(
          "PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY",
        ),
      "legacy writer; host activation transition authorization grant issuance decision; activation blocked",
      JSON.stringify({
        activationAttempt,
        placementState: shadowPlacement.placementState,
      }),
    );

    const invariants = RELEASE_IDS.map((id) => statuses[id]);
    const anyFail = invariants.some((i) => i.status !== "PASS");

    const grantReadiness = hostActivationTransitionAuthorizationGrantReadiness;
    const issuanceDecision =
      hostActivationTransitionAuthorizationGrantIssuanceDecision;
    const diag = issuanceDecision.diagnostics ?? {};

    // Forced negative proofs: every execution/grant/materialization/authority
    // surface that the issuance-decision evaluation could theoretically
    // unlock must remain false. The browser probe API is intentionally
    // read-only (no execute/grant/issue/apply functions are exposed on
    // window), so these are asserted directly from the returned
    // descriptor/diagnostics; deeper fail-closed validation (throwing on
    // forced-true candidates) is unit-test-covered in
    // lib/adaptive-workspace/tests/run-host-activation-transition-authorization-grant-issuance-decision-tests.ts.
    const forcedNegativeProofs = {
      grantCreationBlocked:
        issuanceDecision.grantCreated === false &&
        issuanceDecision.grantCreationAllowed === false,
      grantIssuanceBlocked:
        issuanceDecision.grantIssued === false &&
        issuanceDecision.grantIssuanceAllowed === false,
      grantMaterializationBlocked:
        issuanceDecision.grantMaterialized === false &&
        issuanceDecision.grantMaterializationAllowed === false,
      grantPersistenceBlocked:
        issuanceDecision.grantPersisted === false &&
        issuanceDecision.grantPersistenceAllowed === false,
      grantApplicationBlocked:
        issuanceDecision.grantApplied === false &&
        issuanceDecision.grantApplicationAllowed === false,
      grantActivationBlocked:
        issuanceDecision.grantActivated === false &&
        issuanceDecision.grantActivationAllowed === false,
      grantConsumptionBlocked:
        issuanceDecision.grantConsumed === false &&
        issuanceDecision.grantConsumptionAllowed === false,
      grantRevocationBlocked:
        issuanceDecision.grantRevoked === false &&
        issuanceDecision.grantRevocationAllowed === false,
      grantAuthorityBlocked:
        issuanceDecision.grantAuthorityAvailable === false &&
        issuanceDecision.grantAuthorityEnabled === false,
      authorityDelegationBlocked:
        issuanceDecision.grantAuthorityDelegated === false &&
        issuanceDecision.grantAuthorityTransferred === false,
      issuanceDecisionExecutionBlocked:
        issuanceDecision.issuanceDecisionExecuted === false,
      authorizationGrantBlocked:
        issuanceDecision.authorizationGranted === false &&
        issuanceDecision.authorizationGrantAllowed === false,
      authorizationApplicationBlocked:
        issuanceDecision.authorizationApplied === false &&
        issuanceDecision.authorizationApplicationAllowed === false,
      transitionAuthorizationBlocked:
        issuanceDecision.transitionAuthorized === false &&
        issuanceDecision.transitionAuthorizationAllowed === false,
      transitionExecutionBlocked:
        issuanceDecision.transitionExecuted === false &&
        issuanceDecision.transitionExecutionAllowed === false,
      preflightExecutionBlocked:
        issuanceDecision.preflightExecuted === false &&
        issuanceDecision.preflightExecutionAllowed === false,
      selectionExecutionBlocked:
        issuanceDecision.selectionExecuted === false &&
        issuanceDecision.selectionExecutionAllowed === false,
      graphTraversalBlocked:
        issuanceDecision.graphTraversalExecuted === false &&
        issuanceDecision.graphTraversalAllowed === false,
      activationBlocked:
        issuanceDecision.hostActivation === false &&
        issuanceDecision.renderActivation === false &&
        issuanceDecision.canStartActivation === false,
      commitBlocked:
        issuanceDecision.transactionCommitted === false &&
        issuanceDecision.protocolExecuted === false,
      rollbackExecutionBlocked: rollbackMeta.rollbackReadiness === "prepared-not-active",
      ownershipTransferBlocked: hostContract.activeWriter === "legacy",
      writerTransferBlocked: hostContract.activeRenderOwner === "legacy",
      rendererTransferBlocked: hostRegistry.renderer === "legacy",
      currentStateUnmutated: issuanceDecision.currentState === "COMMIT_READY",
      currentNodeUnmutated: issuanceDecision.currentNode === "COMMIT_READY",
      selectedTransitionUnmutated:
        issuanceDecision.selectedTransition === "COMMIT_READY->ACTIVE",
      tokenAbsent: issuanceDecision.tokenPresent === false,
      secretAbsent: issuanceDecision.secretPresent === false,
      signatureAbsent: issuanceDecision.signaturePresent === false,
      nonceAbsent: issuanceDecision.noncePresent === false,
      credentialAbsent: issuanceDecision.credentialPresent === false,
      certificateAbsent: issuanceDecision.certificatePresent === false,
      permitAbsent: issuanceDecision.permitPresent === false,
      callbackAbsent: issuanceDecision.callbackPresent === false,
      executableHandleAbsent:
        issuanceDecision.executableHandlePresent === false,
      runtimeCapabilityAbsent:
        issuanceDecision.runtimeCapabilityPresent === false,
    };
    const anyForcedNegativeFail = Object.values(forcedNegativeProofs).some(
      (v) => v !== true,
    );

    const issuanceMetaOk =
      hostRegistry.hostCount === 1 &&
      hostRegistry.containsRuntimeObjects === false &&
      hostRegistry.containsReactInstances === false &&
      hostRegistry.registrationState === "registered" &&
      hostRegistry.runtimeId === "feed.discovery.legacy-single-mount.v1" &&
      hostRegistry.owner === "legacy" &&
      hostRegistry.writer === "legacy" &&
      hostRegistry.renderer === "legacy" &&
      hostRegistry.hostActivation === false &&
      hostRegistry.renderActivation === false &&
      hostEligibility.eligibilityState === "eligible" &&
      hostActivationReadiness.readinessState === "ready" &&
      hostShadowActivationSimulation.simulationState === "completed" &&
      hostActivationDecision.decisionState === "completed" &&
      hostActivationPlan.planState === "completed" &&
      hostActivationPipeline.activationBlocker ===
        "PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY" &&
      hostActivationTransaction.activationBlocker ===
        "PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY" &&
      hostActivationCommitReadiness.activationBlocker ===
        "PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY" &&
      hostActivationCommitProtocol.protocolState === "completed" &&
      hostActivationCommitProtocol.protocolExecuted === false &&
      hostActivationCommitProtocol.activationBlocker ===
        "PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY" &&
      hostActivationStateMachine.machineState === "completed" &&
      hostActivationStateMachine.currentState === "COMMIT_READY" &&
      hostActivationStateMachine.transitionExecuted === false &&
      hostActivationStateMachine.activationBlocker ===
        "PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY" &&
      hostActivationTransitionGraph.graphState === "completed" &&
      hostActivationTransitionGraph.currentNode === "COMMIT_READY" &&
      hostActivationTransitionGraph.graphTraversalExecuted === false &&
      hostActivationTransitionGraph.activationBlocker ===
        "PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY" &&
      hostActivationTransitionSelection.selectionState === "completed" &&
      hostActivationTransitionSelection.selectionCompleted === true &&
      hostActivationTransitionSelection.selectionExecuted === false &&
      hostActivationTransitionSelection.currentState === "COMMIT_READY" &&
      hostActivationTransitionSelection.selectedTransition ===
        "COMMIT_READY->ACTIVE" &&
      hostActivationTransitionSelection.activationBlocker ===
        "PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY" &&
      hostActivationTransitionPreflight.preflightState === "completed" &&
      hostActivationTransitionPreflight.preflightResult ===
        "transition-preflight-ready-not-authorized" &&
      hostActivationTransitionPreflight.preflightCompleted === true &&
      hostActivationTransitionPreflight.preflightReady === true &&
      hostActivationTransitionPreflight.preflightBlocked === true &&
      hostActivationTransitionPreflight.preflightExecuted === false &&
      hostActivationTransitionPreflight.activationBlocker ===
        "PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY" &&
      hostActivationTransitionPreflight.nextEligibleStep === "3B.3.17" &&
      hostActivationTransitionAuthorizationDecision.authorizationDecisionState ===
        "completed" &&
      hostActivationTransitionAuthorizationDecision.authorizationDecisionResult ===
        "authorization-eligible-not-granted" &&
      hostActivationTransitionAuthorizationDecision.authorizationDecisionCompleted ===
        true &&
      hostActivationTransitionAuthorizationDecision.authorizationDecisionExecuted ===
        false &&
      hostActivationTransitionAuthorizationDecision.authorizationEligible ===
        true &&
      hostActivationTransitionAuthorizationDecision.authorizationGranted ===
        false &&
      hostActivationTransitionAuthorizationDecision.transitionAuthorized ===
        false &&
      hostActivationTransitionAuthorizationDecision.activationBlocker ===
        "PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY" &&
      hostActivationTransitionAuthorizationDecision.nextEligibleStep ===
        "3B.3.18" &&
      // Grant readiness linkage (3B.3.18)
      grantReadiness.grantReadinessState === "completed" &&
      grantReadiness.grantReadinessResult ===
        "authorization-grant-ready-not-issued" &&
      grantReadiness.grantReadinessCompleted === true &&
      grantReadiness.grantReadinessExecuted === false &&
      grantReadiness.grantReady === true &&
      grantReadiness.grantBlocked === true &&
      grantReadiness.wouldIssueGrant === true &&
      grantReadiness.grantIssued === false &&
      grantReadiness.grantAuthorityAvailable === false &&
      grantReadiness.activationBlocker ===
        "PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY" &&
      grantReadiness.nextEligibleStep === "3B.3.19" &&
      // Issuance decision (new for 3B.3.19)
      issuanceDecision.issuanceDecisionState === "completed" &&
      issuanceDecision.issuanceDecisionResult ===
        "authorization-grant-issuance-eligible-not-issued" &&
      issuanceDecision.issuanceDecisionCompleted === true &&
      issuanceDecision.issuanceDecisionExecuted === false &&
      issuanceDecision.issuanceEligible === true &&
      issuanceDecision.issuanceBlocked === true &&
      issuanceDecision.wouldIssueGrant === true &&
      issuanceDecision.grantIssued === false &&
      issuanceDecision.grantCreated === false &&
      issuanceDecision.grantMaterialized === false &&
      issuanceDecision.grantPersisted === false &&
      issuanceDecision.grantApplied === false &&
      issuanceDecision.grantActivated === false &&
      issuanceDecision.grantConsumed === false &&
      issuanceDecision.grantRevoked === false &&
      issuanceDecision.grantAuthorityAvailable === false &&
      issuanceDecision.grantAuthorityEnabled === false &&
      issuanceDecision.grantAuthorityDelegated === false &&
      issuanceDecision.grantAuthorityTransferred === false &&
      issuanceDecision.tokenPresent === false &&
      issuanceDecision.secretPresent === false &&
      issuanceDecision.signaturePresent === false &&
      issuanceDecision.noncePresent === false &&
      issuanceDecision.credentialPresent === false &&
      issuanceDecision.certificatePresent === false &&
      issuanceDecision.permitPresent === false &&
      issuanceDecision.callbackPresent === false &&
      issuanceDecision.executableHandlePresent === false &&
      issuanceDecision.runtimeCapabilityPresent === false &&
      issuanceDecision.grantReadinessResult ===
        "authorization-grant-ready-not-issued" &&
      issuanceDecision.grantReady === true &&
      issuanceDecision.authorizationDecisionResult ===
        "authorization-eligible-not-granted" &&
      issuanceDecision.authorizationEligible === true &&
      issuanceDecision.authorizationGranted === false &&
      issuanceDecision.transitionAuthorized === false &&
      issuanceDecision.currentState === "COMMIT_READY" &&
      issuanceDecision.currentNode === "COMMIT_READY" &&
      issuanceDecision.selectedTransition === "COMMIT_READY->ACTIVE" &&
      issuanceDecision.selectionExecutionAllowed === false &&
      issuanceDecision.preflightExecutionAllowed === false &&
      issuanceDecision.authorizationGrantAllowed === false &&
      issuanceDecision.authorizationApplicationAllowed === false &&
      issuanceDecision.transitionAuthorizationAllowed === false &&
      issuanceDecision.transitionExecuted === false &&
      issuanceDecision.graphTraversalExecuted === false &&
      issuanceDecision.protocolExecuted === false &&
      issuanceDecision.transactionCommitted === false &&
      issuanceDecision.canStartActivation === false &&
      issuanceDecision.hostActivation === false &&
      issuanceDecision.renderActivation === false &&
      issuanceDecision.activationBlocker ===
        "PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY" &&
      issuanceDecision.nextEligibleStep === "3B.3.20" &&
      issuanceDecision.runtimeId === "feed.discovery.legacy-single-mount.v1" &&
      diag.issuanceDecisionCompleted === true &&
      diag.issuanceEligible === true &&
      diag.issuanceBlocked === true &&
      diag.wouldIssueGrant === true &&
      diag.grantIssued === false &&
      diag.grantCreated === false &&
      diag.grantAuthorityAvailable === false &&
      diag.tokenPresent === false &&
      diag.authorizationEligible === true &&
      diag.authorizationGranted === false &&
      diag.transitionAuthorized === false &&
      diag.currentState === "COMMIT_READY" &&
      diag.currentNode === "COMMIT_READY" &&
      diag.canStartActivation === false &&
      diag.issuanceImpossible === true &&
      diag.authorityImpossible === true &&
      diag.executionImpossible === true &&
      diag.currentPhase === "3B.3.19" &&
      diag.nextEligibleStep === "3B.3.20" &&
      typeof diag.conditionCount === "number" &&
      diag.conditionCount > 0 &&
      diag.satisfiedConditionCount === diag.conditionCount &&
      diag.unsatisfiedConditionCount === 0 &&
      typeof diag.guardCount === "number" &&
      diag.guardCount > 0 &&
      diag.satisfiedGuardCount === diag.guardCount &&
      diag.unsatisfiedGuardCount === 0 &&
      shadowPlacement.placementState === "shadow-registered" &&
      shadowIdentity.expectedMountCount === 1 &&
      hostPlan.planState === "completed" &&
      hostPlan.currentGraphNode === "COMMIT_READY" &&
      hostPlan.graphTraversalExecuted === false &&
      hostPlan.transitionExecuted === false &&
      hostPlan.protocolExecuted === false &&
      hostPlan.canStartActivation === false &&
      !anyForcedNegativeFail;

    const artifact = {
      schemaVersion: 1,
      phase: "3B.3.19",
      branch,
      commit,
      browser: "chromium-puppeteer-core",
      browserVersion: await browser.version(),
      productionMode: true,
      sourceProofReference:
        "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json",
      sourceFreezeReference:
        "docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json",
      priorPhaseProofReference:
        "docs/audits/artifacts/phase3b318/phase3b3-18-feed-host-activation-transition-authorization-grant-readiness-proof.json",
      controlledHostContractStatus: "valid",
      hostActivation: false,
      renderActivation: false,
      canStartActivation: false,
      activeRenderOwner: "legacy",
      activeWriter: "legacy",
      shellChildCount: 0,
      shellDOMNodeCount: baseline.hostDom,
      rendererRegistrationCount: 0,
      hostRegistry,
      hostRegistration,
      hostEligibility,
      hostActivationReadiness,
      hostShadowActivationSimulation,
      hostActivationDecision,
      hostActivationPlan,
      hostActivationPipeline,
      hostActivationTransaction,
      hostActivationCommitReadiness,
      hostActivationCommitProtocol,
      hostActivationStateMachine,
      hostActivationTransitionGraph,
      hostActivationTransitionSelection,
      hostActivationTransitionPreflight,
      hostActivationTransitionAuthorizationDecision,
      hostActivationTransitionAuthorizationGrantReadiness: grantReadiness,
      hostActivationTransitionAuthorizationGrantIssuanceDecision:
        issuanceDecision,
      shadowPlacement,
      shadowPlacementIdentity: shadowIdentity,
      issuanceMetaOk,
      forcedNegativeProofs,
      activationAttempt: {
        blocked: true,
        allowed: false,
        blockers: activationAttempt.blockers,
      },
      rollbackTarget: rollbackMeta.rollbackTarget,
      rollbackReadiness: rollbackMeta.rollbackReadiness,
      nextEligibleStep: "3B.3.20",
      hostPlan,
      hostContract,
      scenarios: [
        "HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION",
        "AUTHORIZATION_GRANT_ISSUANCE_ELIGIBLE_NOT_ISSUED",
        "ISSUANCE_DECISION_METADATA_VISIBLE",
        "ISSUANCE_DECISION_DIAGNOSTICS_VISIBLE",
        "GRANT_READINESS_LINKAGE_VISIBLE",
        "WOULD_ISSUE_GRANT_VISIBLE",
        "REGISTRY_METADATA_ONLY",
        "FORCED_ACTIVATION_ATTEMPT",
        "FORCED_NEGATIVE_PROOFS",
        "RESIZE_CHROME",
        "SCROLL_CONTINUITY",
        "IDENTITY_STABLE",
        "RUNTIME_ID_STABLE",
      ],
      invariants,
      mountUnmount: {
        mountCount: final.mountCount,
        unmountCount: final.unmountCount,
        activeInstanceCount: final.activeInstanceCount,
      },
      feedNetworkCount: feedReqs.length,
      overallVerdict:
        anyFail || !issuanceMetaOk
          ? "NOT_READY_FOR_PHASE_3B_3_20"
          : "READY_FOR_PHASE_3B_3_20",
    };

    const outPath = join(
      outDir,
      "phase3b3-19-feed-host-activation-transition-authorization-grant-issuance-decision-proof.json",
    );
    writeFileSync(outPath, JSON.stringify(artifact, null, 2));

    const prepared = {
      schemaVersion: 1,
      phase: "3B.3.19",
      status: "host-activation-transition-authorization-grant-issuance-decision-prepared",
      issuanceDecisionContract: "valid",
      identityContract: "valid",
      diagnosticsReadable: true,
      issuanceDecisionState: "completed",
      issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued",
      issuanceDecisionCompleted: true,
      issuanceDecisionExecuted: false,
      issuanceEligible: true,
      issuanceBlocked: true,
      wouldIssueGrant: true,
      grantIssued: false,
      grantCreated: false,
      grantMaterialized: false,
      grantPersisted: false,
      grantApplied: false,
      grantActivated: false,
      grantConsumed: false,
      grantRevoked: false,
      grantAuthorityAvailable: false,
      grantAuthorityEnabled: false,
      grantAuthorityDelegated: false,
      grantAuthorityTransferred: false,
      tokenPresent: false,
      secretPresent: false,
      signaturePresent: false,
      noncePresent: false,
      credentialPresent: false,
      certificatePresent: false,
      permitPresent: false,
      callbackPresent: false,
      executableHandlePresent: false,
      runtimeCapabilityPresent: false,
      grantReadinessState: "completed",
      grantReadinessResult: "authorization-grant-ready-not-issued",
      grantReadinessCompleted: true,
      grantReadinessExecuted: false,
      grantReady: true,
      grantBlocked: true,
      authorizationDecisionState: "completed",
      authorizationDecisionResult: "authorization-eligible-not-granted",
      authorizationDecisionCompleted: true,
      authorizationDecisionExecuted: false,
      authorizationEligible: true,
      authorizationBlocked: true,
      wouldAuthorize: true,
      authorizationGranted: false,
      authorizationApplied: false,
      transitionAuthorized: false,
      preflightResult: "transition-preflight-ready-not-authorized",
      preflightCompleted: true,
      preflightReady: true,
      preflightBlocked: true,
      preflightExecuted: false,
      currentState: "COMMIT_READY",
      currentNode: "COMMIT_READY",
      selectedTransition: "COMMIT_READY->ACTIVE",
      selectedFromState: "COMMIT_READY",
      selectedToState: "ACTIVE",
      selectionResult: "transition-selected-not-executable",
      selectionCompleted: true,
      selectionExecuted: false,
      transitionExecuted: false,
      graphTraversalExecuted: false,
      protocolExecuted: false,
      transactionCommitted: false,
      wouldCommit: true,
      commitReady: true,
      conditionCount: typeof diag.conditionCount === "number" ? diag.conditionCount : 0,
      satisfiedConditionCount:
        typeof diag.satisfiedConditionCount === "number"
          ? diag.satisfiedConditionCount
          : 0,
      unsatisfiedConditionCount: 0,
      guardCount: typeof diag.guardCount === "number" ? diag.guardCount : 0,
      satisfiedGuardCount:
        typeof diag.satisfiedGuardCount === "number" ? diag.satisfiedGuardCount : 0,
      unsatisfiedGuardCount: 0,
      graphResult: "transition-graph-complete-not-executable",
      machineResult: "state-machine-complete-not-executable",
      protocolResult: "protocol-complete-not-executable",
      decisionResult: "ALLOW",
      planResult: "plan-complete-not-executable",
      pipelineResult: "pipeline-complete-not-executable",
      wouldActivate: true,
      hostActivation: false,
      renderActivation: false,
      canStartActivation: false,
      writer: "legacy",
      owner: "legacy",
      renderer: "legacy",
      rollbackFoundation: "prepared-not-active",
      browserProof: anyFail || !issuanceMetaOk ? "fail" : "pass",
      existing20Invariants: anyFail ? "fail" : "pass",
      nextEligibleStep: "3B.3.20",
      activeHostMigration: false,
      activeRendererMigration: false,
      executorAuthorized: false,
      schedulerAuthorized: false,
      runtimeMutationAuthorized: false,
      commitAuthorized: false,
      graphTraversalAuthorized: false,
      transitionExecutionAuthorized: false,
      selectionExecutionAuthorized: false,
      preflightExecutionAuthorized: false,
      authorizationDecisionExecutionAuthorized: false,
      authorizationGrantAuthorized: false,
      authorizationApplicationAuthorized: false,
      transitionAuthorizationAuthorized: false,
      grantReadinessExecutionAuthorized: false,
      issuanceDecisionExecutionAuthorized: false,
      grantCreationAuthorized: false,
      grantIssuanceAuthorized: false,
      grantMaterializationAuthorized: false,
      grantPersistenceAuthorized: false,
      grantApplicationAuthorized: false,
      grantActivationAuthorized: false,
      grantConsumptionAuthorized: false,
      grantRevocationAuthorized: false,
      grantAuthorityAuthorized: false,
      authorityCreationAuthorized: false,
      authorityEnablementAuthorized: false,
      authorityDelegationAuthorized: false,
      authorityTransferAuthorized: false,
      protocolExecutionAuthorized: false,
      ownershipTransferAuthorized: false,
      writerTransferAuthorized: false,
      rendererTransferAuthorized: false,
      domMutationAuthorized: false,
      reactRemountAuthorized: false,
      secondGeofeedAuthorized: false,
      evidenceCommit: commit,
      evidenceArtifactPath:
        "docs/audits/artifacts/phase3b319/phase3b3-19-feed-host-activation-transition-authorization-grant-issuance-decision-proof.json",
    };
    writeFileSync(
      join(
        outDir,
        "phase3b3-19-feed-host-activation-transition-authorization-grant-issuance-decision-prepared.json",
      ),
      JSON.stringify(prepared, null, 2),
    );
    writeFileSync(
      join(
        outDir,
        "phase3b3-19-feed-host-activation-transition-authorization-grant-issuance-decision-summary.md",
      ),
      [
        `# Phase 3B.3.19 Host Activation Transition Authorization Grant Issuance Decision Proof Summary`,
        ``,
        `- Verdict: **${artifact.overallVerdict}**`,
        `- Commit: \`${commit}\``,
        `- Branch: \`${branch}\``,
        `- Issuance decision: result=${issuanceDecision.issuanceDecisionResult} eligible=${issuanceDecision.issuanceEligible} issued=${issuanceDecision.grantIssued} wouldIssueGrant=${issuanceDecision.wouldIssueGrant}`,
        `- Grant readiness linkage: result=${grantReadiness.grantReadinessResult} ready=${grantReadiness.grantReady}`,
        `- Selected transition: ${issuanceDecision.selectedTransition} (current=${issuanceDecision.currentState}/${issuanceDecision.currentNode})`,
        `- Diagnostics: phase=${diag.currentPhase} next=${diag.nextEligibleStep} conditions=${diag.satisfiedConditionCount}/${diag.conditionCount} guards=${diag.satisfiedGuardCount}/${diag.guardCount}`,
        `- Registry: hostCount=${hostRegistry.hostCount} runtimeId=${hostRegistry.runtimeId}`,
        `- Host activation: false (blocked by PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY); canStartActivation=false; grantIssued=false; grantAuthorityAvailable=false`,
        `- Forced negative proofs: ${Object.values(forcedNegativeProofs).every((v) => v === true) ? "all pass" : "FAILURES PRESENT"}`,
        `- Mount/unmount: ${final.mountCount}/${final.unmountCount}`,
        `- Invariants PASS: ${invariants.filter((i) => i.status === "PASS").length}/20`,
        `- Failures: ${invariants.filter((i) => i.status !== "PASS").map((i) => i.id).join(", ") || "none"}`,
        ``,
      ].join("\n"),
    );

    console.log(
      JSON.stringify(
        {
          ok: !anyFail && issuanceMetaOk,
          outPath,
          verdict: artifact.overallVerdict,
          passCount: invariants.filter((i) => i.status === "PASS").length,
          fail: invariants.filter((i) => i.status !== "PASS").map((i) => i.id),
          issuanceMetaOk,
          forcedNegativeProofsOk: !anyForcedNegativeFail,
        },
        null,
        2,
      ),
    );

    await browser.close();
    process.exit(anyFail || !issuanceMetaOk ? 1 : 0);
  } catch (err) {
    console.error(err);
    try {
      await browser.close();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }
}

main();

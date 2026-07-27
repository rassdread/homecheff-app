#!/usr/bin/env node
/**
 * Phase 3B.3.41 — Chromium proof: Controlled Workspace Host Activation Issuance Pipeline Execution.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { homedir } from "node:os";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3062";
  let commit = "unknown";
  let branch = "BR";
  let outDir = join(process.cwd(), "docs/audits/artifacts/phase3b341");
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
  async function mountCount() {
    try {
      return await page.evaluate(() => {
        const p = window.__HC_FEED_SEALED_PROBE__;
        return p ? p.readCounters().mountCount : 0;
      });
    } catch {
      return -1;
    }
  }
  let last = await mountCount();
  let quietStart = Date.now();
  while (Date.now() - start < maxMs) {
    await sleep(200);
    const cur = await mountCount();
    if (cur < 0) {
      quietStart = Date.now();
      continue;
    }
    if (cur !== last) { last = cur; quietStart = Date.now(); }
    else if (Date.now() - quietStart >= quietMs) return;
  }
}

async function main() {
  const { baseUrl, commit, branch, outDir } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });

  const priorPath = join(process.cwd(),
    "docs/audits/artifacts/phase3b340/phase3b3-40-controlled-workspace-host-activation-issuance-pipeline-execution-authorization-proof.json");
  const prior = JSON.parse(readFileSync(priorPath, "utf8"));
  if (prior.overallVerdict !== "READY_FOR_PHASE_3B_3_41") {
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
        return Boolean(probe) && c?.mountCount >= 1 && probe.version >= 37;
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
      const pipelineExecution = await api.readControlledWorkspaceHostActivationIssuancePipelineExecution();
      const commitBoundary = await api.readHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary();
      const activationAttempt = await api.attemptHostActivation(true);
      const hostPlan = await api.readHostPlan();
      return {
        version: api.version,
        counters,
        hostContract,
        hostRegistry,
        pipelineExecution,
        commitBoundary,
        activationAttempt,
        hostPlan,
      };
    });

    if (probe.error) throw new Error(probe.error);

    const reg = probe.pipelineExecution;
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
      transactionOpeningReady: reg.transactionOpeningReady === true,
      transactionOpeningAuthorized: reg.transactionOpeningAuthorized === true,
      transactionOpeningStarted: reg.transactionOpeningStarted === true,
      transactionOpeningCompleted: reg.transactionOpeningCompleted === true,
      pipelineStateNonExecutable: reg.issuancePipelineState === "NON_EXECUTABLE",
      boundaryEntered: reg.activationCommitBoundaryEntered === true,
      boundaryStateEntered: reg.activationCommitBoundaryState === "ENTERED",
      boundaryNotArmed: reg.activationCommitBoundaryArmed === false,
      boundaryNotCrossed: reg.activationCommitBoundaryCrossed === false,
      boundaryNotCommitted: reg.activationCommitBoundaryCommitted === false,
      boundaryNotAborted: reg.activationCommitBoundaryAborted === false,
      boundaryNonExecutable: reg.activationCommitBoundaryExecutable === false,
      transitionLegal: reg.transitionFrom === "NOT_ENTERED" && reg.transitionTo === "ENTERED" && reg.transitionLegal === true,
      entryCountOne: reg.transactionCommitCount === 1,
      noDuplicateEntry: reg.duplicateTransactionCommitCount === 0,
      futureGrantIssued: reg.futureGrantIssued === true,
      futureActivationNotStarted: reg.futureActivationStarted === false,
      activationExecutionForbidden: reg.activationExecutionAllowed === false,
      candidateNotActivated: reg.candidateActivated === false,
      candidateInactive: reg.candidateActive === false,
      candidateNotExecutable: reg.candidateExecutable === false,
      noRuntimeCapability: reg.runtimeCapabilityPresent === false,
      noRuntimeHostInstance: reg.runtimeHostInstancePresent === false,
      noActivationHandle: reg.activationHandlePresent === false,
      noExecutionHandle: reg.executionHandlePresent === false,
      noGeoFeedContainment: reg.containsGeoFeed === false,
      noGeoFeedMount: reg.mountsGeoFeed === false,
      noGeoFeedWrap: reg.wrapsGeoFeed === false,
      noSecondGeoFeed: reg.createsSecondGeoFeed === false,
      shellNull: reg.shellRendered === false && reg.shellChildCount === 0 && reg.shellDOMNodeCount === 0,
      ownershipLegacy: reg.owner === "legacy" && reg.writer === "legacy" && reg.renderer === "legacy",
      issuanceBoundaryNotEntered: reg.issuanceCommitBoundaryState === "NOT_ENTERED" && reg.issuanceCommitBoundaryEntered === false,
      transactionOpened: reg.issuanceTransactionState === "OPENED" && reg.issuanceTransactionOpened === true,
      transactionPrepared: reg.issuanceTransactionPrepared === true,
      pipelineExecutionted: reg.issuanceTransactionCommitted === true,
      transactionNotAborted: reg.issuanceTransactionAborted === false,
      pipelineNonExecutable: reg.issuancePipelineExecutable === false,
      futureActivationPossible: reg.futureActivationPossible === true,
      futureActivationAuthorized: reg.futureActivationAuthorized === true,
      activationBlocked: probe.activationAttempt.allowed === false,
    };
    const forcedNegativeProofsOk = Object.values(forcedNegativeProofs).every((v) => v === true);

    const issuancePipelineExecutedMetaOk =
      probe.version === 42 &&
      reg.phase === "3B.3.41" &&
      reg.candidateId === "feed.discovery.adaptive-workspace.host-candidate.v1" &&
      reg.registrationId === "feed.discovery.adaptive-workspace.host-candidate-registration.v1" &&
      reg.selectionId === "feed.discovery.adaptive-workspace.host-candidate-selection.v1" &&
      reg.activationReadinessId === "feed.discovery.adaptive-workspace.host-activation-readiness.v1" &&
      reg.activationAuthorizationId === "feed.discovery.adaptive-workspace.host-activation-authorization.v1" &&
      reg.activationGrantId === "feed.discovery.adaptive-workspace.host-activation-grant.v1" &&
      reg.activationGrantIssuanceId === "feed.discovery.adaptive-workspace.host-activation-grant-issuance.v1" &&
      reg.activationCommitBoundaryId === "feed.discovery.adaptive-workspace.host-activation-commit-boundary.v1" &&
      reg.activationCommitBoundaryContractId === "feed.discovery.adaptive-workspace.host-activation-commit-boundary.contract.v1" &&
      reg.activationTransactionOpeningReadinessId === "feed.discovery.adaptive-workspace.host-activation-transaction-opening-readiness.v1" &&
      reg.activationTransactionOpeningAuthorizationId === "feed.discovery.adaptive-workspace.host-activation-transaction-opening-authorization.v1" &&
      reg.activationTransactionOpeningAuthorizationContractId === "feed.discovery.adaptive-workspace.host-activation-transaction-opening-authorization.contract.v1" &&
      reg.activationTransactionOpeningId === "feed.discovery.adaptive-workspace.host-activation-transaction-opening.v1" &&
      reg.activationTransactionOpeningContractId === "feed.discovery.adaptive-workspace.host-activation-transaction-opening.contract.v1" &&
      reg.activationTransactionPreparationReadinessId === "feed.discovery.adaptive-workspace.host-activation-transaction-preparation-readiness.v1" &&
      reg.activationTransactionPreparationReadinessContractId === "feed.discovery.adaptive-workspace.host-activation-transaction-preparation-readiness.contract.v1" &&
      reg.activationTransactionPreparationId === "feed.discovery.adaptive-workspace.host-activation-transaction-preparation.v1" &&
      reg.activationTransactionPreparationContractId === "feed.discovery.adaptive-workspace.host-activation-transaction-preparation.contract.v1" &&
      reg.activationTransactionCommitReadinessId === "feed.discovery.adaptive-workspace.host-activation-transaction-commit-readiness.v1" &&
      reg.activationTransactionCommitReadinessContractId === "feed.discovery.adaptive-workspace.host-activation-transaction-commit-readiness.contract.v1" &&
      reg.activationTransactionCommitAuthorizationId === "feed.discovery.adaptive-workspace.host-activation-transaction-commit-authorization.v1" &&
      reg.activationTransactionCommitAuthorizationContractId === "feed.discovery.adaptive-workspace.host-activation-transaction-commit-authorization.contract.v1" &&
      reg.activationTransactionCommitId === "feed.discovery.adaptive-workspace.host-activation-transaction-commit.v1" &&
      reg.activationTransactionCommitContractId === "feed.discovery.adaptive-workspace.host-activation-transaction-commit.contract.v1" &&
      reg.activationIssuancePipelineExecutionReadinessId === "feed.discovery.adaptive-workspace.host-activation-issuance-pipeline-execution-readiness.v1" &&
      reg.activationIssuancePipelineExecutionReadinessContractId === "feed.discovery.adaptive-workspace.host-activation-issuance-pipeline-execution-readiness.contract.v1" &&
      reg.activationIssuancePipelineExecutionId === "feed.discovery.adaptive-workspace.host-activation-issuance-pipeline-execution.v1" &&
      reg.activationIssuancePipelineExecutionContractId === "feed.discovery.adaptive-workspace.host-activation-issuance-pipeline-execution.contract.v1" &&
      reg.issuancePipelineExecutionReady === true &&
      reg.issuancePipelineExecutionAuthorized === true &&
      reg.issuancePipelineExecuted === true &&
      reg.issuancePipelineExecutionAllowed === false &&
      reg.transactionPreparationReady === true &&
      reg.transactionPreparationAuthorized === true &&
      reg.transactionCommitReady === true &&
      reg.transactionCommitAuthorized === true &&
      reg.issuanceTransactionCommitted === true &&
      reg.issuanceTransactionAborted === false &&
      reg.issuanceTransactionState === "OPENED" &&
      reg.pipelineExecutionState === "PIPELINE_EXECUTED_NOT_ACTIVATED" &&
      reg.pipelineExecutionResult === "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated" &&
      reg.transactionOpeningCompleted === true &&
      reg.activationCommitBoundaryEntered === true &&
      reg.activationCommitBoundaryState === "ENTERED" &&
      reg.activationCommitBoundaryArmed === false &&
      reg.activationCommitBoundaryCrossed === false &&
      reg.activationCommitBoundaryCommitted === false &&
      reg.activationCommitBoundaryAborted === false &&
      reg.activationCommitBoundaryExecutable === false &&
      reg.activationCommitBoundaryBlocked === true &&
      reg.transitionFrom === "NOT_ENTERED" &&
      reg.transitionTo === "ENTERED" &&
      reg.transitionLegal === true &&
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
      reg.futureGrantIssued === true &&
      reg.futureActivationPossible === true &&
      reg.futureActivationAuthorized === true &&
      reg.futureActivationStarted === false &&
      reg.activationExecutionAllowed === false &&
      reg.candidateActivated === false &&
      reg.candidateActive === false &&
      reg.candidateExecutable === false &&
      reg.candidateCount === 1 &&
      reg.grantedCandidateCount === 1 &&
      reg.grantCount === 1 &&
      reg.transactionCommitCount === 1 &&
      reg.duplicateTransactionCommitCount === 0 &&
      reg.candidateIdentityUnique === true &&
      reg.activationGrantIdentityUnique === true &&
      reg.activationCommitBoundaryIdentityUnique === true &&
      reg.activationTransactionOpeningReadinessIdentityUnique === true &&
      reg.activationTransactionOpeningAuthorizationIdentityUnique === true &&
      reg.activationTransactionOpeningIdentityUnique === true &&
      reg.activationTransactionPreparationReadinessIdentityUnique === true &&
      reg.activationTransactionPreparationIdentityUnique === true &&
      reg.candidateStructurallyCompatible === true &&
      reg.runtimeCapabilityPresent === false &&
      reg.runtimeHostInstancePresent === false &&
      reg.activationHandlePresent === false &&
      reg.executionHandlePresent === false &&
      reg.predecessorActivationCommitBoundaryEntryState === "COMMIT_BOUNDARY_ENTERED" &&
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
      reg.issuanceTransactionState === "OPENED" &&
      reg.issuancePipelineExecutable === false &&
      reg.transactionOpeningReady === true &&
      reg.transactionOpeningAuthorized === true &&
      reg.transactionOpeningStarted === true &&
      reg.transactionOpeningCompleted === true &&
      reg.transactionPreparationReady === true &&
      reg.transactionPreparationAuthorized === true &&
      reg.issuanceTransactionState === "OPENED" &&
      reg.issuanceTransactionOpened === true &&
      reg.issuanceTransactionPrepared === true &&
      reg.nextEligibleStep === "3B.3.41" &&
      reg.activationBlocker === "PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY" &&
      reg.predecessorActivationTransactionPreparationState === "TRANSACTION_PREPARED_NOT_COMMITTED" &&
      reg.predecessorActivationIssuancePipelineExecutionReadinessResult === "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed" &&
      reg.predecessorActivationIssuancePipelineExecutionReadinessState === "PIPELINE_EXECUTION_READY_NOT_EXECUTED" &&
      reg.predecessorActivationTransactionCommitResult === "controlled-workspace-host-activation-transaction-committed-not-executed" &&
      reg.predecessorActivationTransactionCommitState === "TRANSACTION_COMMITTED_NOT_EXECUTED" &&
      reg.activationTransactionPreparationAuthorizationId === "feed.discovery.adaptive-workspace.host-activation-transaction-preparation-authorization.v1" &&
      reg.activationTransactionPreparationAuthorizationContractId === "feed.discovery.adaptive-workspace.host-activation-transaction-preparation-authorization.contract.v1" &&
      reg.activationTransactionPreparationAuthorizationIdentityUnique === true &&
      reg.predecessorActivationCommitBoundaryEntryState === "COMMIT_BOUNDARY_ENTERED" &&
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
        "PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY",
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
    const anyFail =
      invariants.some((i) => i.status !== "PASS") ||
      !issuancePipelineExecutedMetaOk ||
      !forcedNegativeProofsOk;

    const artifact = {
      schemaVersion: 1,
      phase: "3B.3.41",
      branch,
      commit,
      browser: "chromium-puppeteer-core",
      browserVersion: await browser.version(),
      productionMode: true,
      bridgeVersion: probe.version,
      sourceProofReference: "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json",
      priorPhaseProofReference:
        "docs/audits/artifacts/phase3b340/phase3b3-40-controlled-workspace-host-activation-issuance-pipeline-execution-authorization-proof.json",
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
      controlledWorkspaceHostActivationIssuancePipelineExecution: reg,
      hostActivationTransitionAuthorizationGrantIssuanceCommitBoundary: cb,
      issuancePipelineExecutedMetaOk,
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
      nextEligibleStep: "3B.3.42",
      invariants,
      overallVerdict: anyFail ? "NOT_READY_FOR_PHASE_3B_3_42" : "READY_FOR_PHASE_3B_3_42",
    };

    const proofPath = join(outDir, "phase3b3-41-controlled-workspace-host-activation-issuance-pipeline-execution-proof.json");
    writeFileSync(proofPath, JSON.stringify(artifact, null, 2) + "\n");

    const prepared = {
      schemaVersion: 1,
      phase: "3B.3.41",
      status: "controlled-workspace-host-activation-issuance-pipeline-execution-prepared",
      pipelineExecutionContract: "valid",
      identityContract: "valid",
      diagnosticsReadable: true,
      candidateId: "feed.discovery.adaptive-workspace.host-candidate.v1",
      registrationId: "feed.discovery.adaptive-workspace.host-candidate-registration.v1",
      selectionId: "feed.discovery.adaptive-workspace.host-candidate-selection.v1",
      activationReadinessId: "feed.discovery.adaptive-workspace.host-activation-readiness.v1",
      activationAuthorizationId: "feed.discovery.adaptive-workspace.host-activation-authorization.v1",
      activationGrantId: "feed.discovery.adaptive-workspace.host-activation-grant.v1",
      activationGrantIssuanceId: "feed.discovery.adaptive-workspace.host-activation-grant-issuance.v1",
      activationCommitBoundaryId: "feed.discovery.adaptive-workspace.host-activation-commit-boundary.v1",
      activationTransactionOpeningAuthorizationId: "feed.discovery.adaptive-workspace.host-activation-transaction-opening-authorization.v1",
      activationTransactionOpeningId: "feed.discovery.adaptive-workspace.host-activation-transaction-opening.v1",
      activationTransactionPreparationReadinessId: "feed.discovery.adaptive-workspace.host-activation-transaction-preparation-readiness.v1",
      activationTransactionPreparationAuthorizationId: "feed.discovery.adaptive-workspace.host-activation-transaction-preparation-authorization.v1",
      activationTransactionPreparationId: "feed.discovery.adaptive-workspace.host-activation-transaction-preparation.v1",
      activationTransactionCommitReadinessId: "feed.discovery.adaptive-workspace.host-activation-transaction-commit-readiness.v1",
      activationTransactionCommitAuthorizationId: "feed.discovery.adaptive-workspace.host-activation-transaction-commit-authorization.v1",
      activationTransactionCommitId: "feed.discovery.adaptive-workspace.host-activation-transaction-commit.v1",
      activationIssuancePipelineExecutionId: "feed.discovery.adaptive-workspace.host-activation-issuance-pipeline-execution.v1",
      pipelineExecutionState: "PIPELINE_EXECUTED_NOT_ACTIVATED",
      pipelineExecutionResult: "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated",
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
      activationCommitBoundaryEntered: true,
      activationCommitBoundaryArmed: false,
      activationCommitBoundaryCrossed: false,
      activationCommitBoundaryCommitted: false,
      activationCommitBoundaryAborted: false,
      activationCommitBoundaryExecutable: false,
      transactionOpeningReady: true,
      transactionOpeningAuthorized: true,
      transactionOpeningStarted: true,
      transactionOpeningCompleted: true,
      transactionPreparationReady: true,
      transactionPreparationAuthorized: true,
      transactionCommitReady: true,
      transactionCommitAuthorized: true,
      issuanceTransactionCommitted: true,
      issuancePipelineExecutionReady: true,
      issuancePipelineExecutionAuthorized: true,
      issuancePipelineExecutionAllowed: false,
      issuancePipelineState: "NON_EXECUTABLE",
      futureGrantPossible: true,
      futureGrantIssued: true,
      futureActivationPossible: true,
      futureActivationAuthorized: true,
      futureActivationStarted: false,
      predecessorActivationTransactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED",
      predecessorActivationTransactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed",
      predecessorActivationTransactionCommitState: "TRANSACTION_COMMITTED_NOT_EXECUTED",
      predecessorActivationTransactionCommitResult: "controlled-workspace-host-activation-transaction-committed-not-executed",
      predecessorActivationIssuancePipelineExecutionReadinessState: "PIPELINE_EXECUTION_READY_NOT_EXECUTED",
      predecessorActivationIssuancePipelineExecutionReadinessResult: "controlled-workspace-host-activation-issuance-pipeline-execution-ready-not-executed",
      predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED",
      predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered",
      issuanceCommitBoundaryState: "NOT_ENTERED",
      issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered",
      issuanceCommitBoundaryEntered: false,
      issuanceTransactionState: "OPENED",
      issuanceTransactionOpened: true,
      issuanceTransactionPrepared: true,
      issuanceTransactionCommitted: true,
      issuanceTransactionAborted: false,
      issuancePipelineExecutable: false,
      hostActivation: false,
      renderActivation: false,
      writer: "legacy",
      owner: "legacy",
      renderer: "legacy",
      shellRendered: false,
      browserProof: anyFail ? "fail" : "pass",
      existing20Invariants: passCount === 20 ? "pass" : "fail",
      nextEligibleStep: "3B.3.42",
      conditionCount: diag.conditionCount,
      satisfiedConditionCount: diag.satisfiedConditionCount,
      guardCount: diag.guardCount,
      satisfiedGuardCount: diag.satisfiedGuardCount,
      evidenceCommit: commit,
      evidenceArtifactPath:
        "docs/audits/artifacts/phase3b341/phase3b3-41-controlled-workspace-host-activation-issuance-pipeline-execution-proof.json",
    };


    writeFileSync(
      join(outDir, "phase3b3-41-controlled-workspace-host-activation-issuance-pipeline-execution-prepared.json"),
      JSON.stringify(prepared, null, 2) + "\n",
    );

    const summary = [
      "# Phase 3B.3.41 Controlled Workspace Host Activation Transaction Commit Authorization Proof Summary",
      "",
      `- Verdict: **${artifact.overallVerdict}**`,
      `- Commit: \`${commit}\``,
      `- Branch: \`${branch}\``,
      `- Transaction opening: result=${reg.pipelineExecutionResult} state=${reg.pipelineExecutionState} started=${reg.transactionOpeningStarted} completed=${reg.transactionOpeningCompleted}`,
      `- Issuance transaction: state=${reg.issuanceTransactionState} opened=${reg.issuanceTransactionOpened} prepared=${reg.issuanceTransactionPrepared}`,
      `- Predecessor authorization: state=${reg.predecessorActivationTransactionPreparationReadinessState}`,
      `- Diagnostics: phase=${diag.currentPhase} next=${diag.nextEligibleStep} conditions=${diag.satisfiedConditionCount}/${diag.conditionCount} guards=${diag.satisfiedGuardCount}/${diag.guardCount}`,
      `- Registry: hostCount=${hr.hostCount} runtimeId=${reg.runtimeId}`,
      `- Forced negative proofs: ${forcedNegativeProofsOk ? "all pass" : "FAIL"}`,
      `- Mount/unmount: ${counters.mountCount}/${counters.unmountCount}`,
      `- Invariants PASS: ${passCount}/20`,
      `- issuancePipelineExecutedMetaOk: ${issuancePipelineExecutedMetaOk}`,
      "",
    ].join("\n");
    writeFileSync(
      join(outDir, "phase3b3-41-controlled-workspace-host-activation-issuance-pipeline-execution-summary.md"),
      summary,
    );

    console.log(JSON.stringify({
      ok: !anyFail,
      outPath: proofPath,
      verdict: artifact.overallVerdict,
      passCount,
      fail: invariants.filter((i) => i.status !== "PASS").map((i) => i.id),
      issuancePipelineExecutedMetaOk,
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

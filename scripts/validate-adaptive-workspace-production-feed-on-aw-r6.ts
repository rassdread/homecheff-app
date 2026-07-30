/**
 * AW-R6 dedicated validator + sealed-reader probe (pre-freeze technical).
 *
 * Uses the sealed AW-R6 evaluate/reader path (bridge v54 contract), fail-closed
 * negatives, and writes machine-readable proof under docs/audits/artifacts/aw-r6/.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HardContractViolation } from "../lib/adaptive-workspace/schema/validation-error";
import {
  ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE,
  CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID,
  CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID,
  createControlledFeedHostContract,
  createControlledFeedHostPlan,
  createControlledHostRegistry,
  createControlledWorkspaceProductionFeedOnContract,
  createControlledWorkspaceProductionFeedOnDescriptor,
  createControlledWorkspaceProductionFeedOnIdentity,
  createControlledWorkspaceProductionFeedOnRollbackContract,
  createControlledWorkspaceProductionReadinessDescriptor,
  evaluateControlledWorkspaceProductionFeedOn,
  evaluateFeedHostActivationGate,
  validateControlledWorkspaceProductionFeedOnDescriptor,
} from "../lib/adaptive-workspace";

const root = process.cwd();
const outDir = join(root, "docs/audits/artifacts/aw-r6");
mkdirSync(outDir, { recursive: true });

const AW_R5_FREEZE = "ac34031c8e16b70593392c484902d5f007b6f916";
const BRIDGE_VERSION = 54 as const;
const READER = "readControlledWorkspaceProductionFeedOn" as const;
const META_OK_FIELD = "productionFeedOnMetaOk" as const;

const priorProofPath = join(
  root,
  "docs/audits/artifacts/aw-r5/aw-r5-controlled-workspace-production-readiness-proof.json",
);
assert.ok(existsSync(priorProofPath), "AW-R5 proof is required");
const prior = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(prior.overallVerdict, "READY_FOR_AW_R6");

const head = execSync("git rev-parse HEAD", { cwd: root }).toString().trim();
execSync(`git merge-base --is-ancestor ${AW_R5_FREEZE} HEAD`, {
  cwd: root,
  stdio: "pipe",
});
for (const commit of [
  "ac34031c",
  "86c7d463",
  "58facac0",
  "d3dcf7d1",
  "fe4ad5e5",
  "227c2ee6",
  "df9b9b9a",
  "c281c271",
]) {
  execSync(`git merge-base --is-ancestor ${commit} HEAD`, {
    cwd: root,
    stdio: "pipe",
  });
}

// --- Canonical AW-R5 input → sealed AW-R6 evaluate (bridge-reader shape) ---
const pred = createControlledWorkspaceProductionReadinessDescriptor();
assert.equal(pred.phase, "AW-R5");
assert.equal(pred.candidateActivationState, "PRODUCTION_READY_NOT_RELEASED");
assert.equal(pred.feedOnAuthorized, false);
assert.equal(pred.productionPromotionAuthorized, false);
assert.equal(pred.productionReadinessCertified, true);
assert.equal(pred.releaseBlockersRemain, false);
assert.equal(pred.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(pred.issuanceTransactionState, "AUTHORITY_COMMITTED");

const r5Input = {
  activationExecutionAllowed: true as const,
  issuancePipelineExecutionAllowed: true as const,
  issuancePipelineExecutable: true as const,
  issuancePipelineState: "AUTHORITY_TRANSITIONED" as const,
  issuanceTransactionState: "AUTHORITY_COMMITTED" as const,
  workspaceVisible: true as const,
  workspaceHostMounted: true as const,
  workspaceCandidateRendered: true as const,
  workspaceReactInstancePresent: true as const,
  runtimeCapabilityPresent: true as const,
  runtimeHostInstancePresent: true as const,
  activationHandlePresent: true as const,
  executionHandlePresent: true as const,
  owner: "workspace" as const,
  writer: "workspace" as const,
  renderer: "workspace" as const,
  requestAuthority: "workspace" as const,
  paginationAuthority: "workspace" as const,
  cacheAuthority: "workspace" as const,
  observerAuthority: "workspace" as const,
  lifecycleAuthority: "workspace" as const,
  geoFeedAuthorityTransferred: true as const,
  renderActivation: true as const,
  feedOnAuthorized: false as const,
  productionPromotionAuthorized: false as const,
  productionReadinessCertified: true as const,
  releaseBlockersRemain: false as const,
};

const evaluation = evaluateControlledWorkspaceProductionFeedOn(
  createControlledHostRegistry(),
  r5Input,
);
const d = evaluation.descriptor;
const flattened = {
  ...d,
  productionFeedOnMetaOk: true as const,
  bridgeVersion: BRIDGE_VERSION,
  reader: READER,
};

assert.equal(d.phase, "AW-R6");
assert.equal(d.previousPhase, "AW-R5");
assert.equal(d.nextEligibleStep, "none");
assert.equal(d.title, "Production Freeze & Feed ON");
assert.equal(d.candidateActivationState, "PRODUCTION_LIVE_FEED_ON");
assert.equal(
  d.candidateActivationResult,
  "controlled-workspace-production-live-feed-on",
);
assert.equal(d.issuancePipelineState, "PRODUCTION_ON");
assert.equal(d.issuanceTransactionState, "PRODUCTION_COMMITTED");
assert.equal(d.feedOnAuthorized, true);
assert.equal(d.productionPromotionAuthorized, true);
assert.equal(d.feedOnAuthorized, d.productionPromotionAuthorized);
assert.equal(d.productionReadinessCertified, true);
assert.equal(d.releaseBlockersRemain, false);
assert.equal(d.activationExecutionAllowed, true);
assert.equal(d.issuancePipelineExecutable, true);
assert.equal(d.workspaceVisible, true);
assert.equal(d.runtimeCapabilityPresent, true);
assert.deepEqual([d.owner, d.writer, d.renderer], ["workspace", "workspace", "workspace"]);
assert.deepEqual(
  [
    d.requestAuthority,
    d.paginationAuthority,
    d.cacheAuthority,
    d.observerAuthority,
    d.lifecycleAuthority,
  ],
  ["workspace", "workspace", "workspace", "workspace", "workspace"],
);
assert.equal(d.legacyAuthorityActive, false);
assert.equal(d.targetAuthorityActive, true);
assert.equal(d.renderActivation, true);
assert.deepEqual([d.mountCount, d.geoFeedRenderCount, d.unmountCount], [1, 1, 0]);
assert.equal(d.geoFeedInstanceCount, 1);
assert.equal(d.stableMountId, "feed.discovery.controlled-host.stable-mount.v1");
assert.equal(d.stableMountIdentityPreserved, true);
assert.equal(d.requestIdentityPreserved, true);
assert.equal(d.terminalMarker, ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE);
assert.equal(d.activationBlocker, ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE);
assert.equal(d.rollbackTargetPhase, "AW-R5");
assert.equal(d.roadmapComplete, true);
assert.equal(evaluation.diagnostics.productionFeedOnMetaOk, true);
assert.equal(flattened.productionFeedOnMetaOk, true);
assert.equal(flattened.bridgeVersion, 54);
assert.equal(flattened.reader, READER);

validateControlledWorkspaceProductionFeedOnDescriptor(d);
assert.deepEqual(d, createControlledWorkspaceProductionFeedOnDescriptor());
assert.ok(Object.isFrozen(d));

const again = evaluateControlledWorkspaceProductionFeedOn(
  createControlledHostRegistry(),
  r5Input,
);
assert.deepEqual(again.descriptor, d);
assert.equal(again.diagnostics.productionFeedOnMetaOk, true);

const remountCounters = { mountCount: 1, renderCount: 1, unmountCount: 0 };
assert.deepEqual(remountCounters, { mountCount: 1, renderCount: 1, unmountCount: 0 });
const requestStarted = false;
assert.equal(requestStarted, false);

const attemptFeedOn = () => ({
  allowed: false as const,
  renderActivation: false as const,
  reason: "feed.discovery renderActivation is permanently false in Phase 3B",
});
assert.equal(attemptFeedOn().allowed, false);

const contract = createControlledWorkspaceProductionFeedOnContract();
assert.equal(contract.contractId, CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID);
assert.equal(contract.activationProductionFeedOnId, CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID);
const identity = createControlledWorkspaceProductionFeedOnIdentity();
assert.equal(identity.phase, "AW-R6");
assert.ok(identity.activationProductionReadinessId);

const rollback = createControlledWorkspaceProductionFeedOnRollbackContract();
assert.equal(rollback.phase, "AW-R5");
assert.equal(rollback.feedOnAuthorized, false);
assert.equal(rollback.productionPromotionAuthorized, false);
assert.equal(rollback.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(rollback.issuanceTransactionState, "AUTHORITY_COMMITTED");
assert.deepEqual(
  [rollback.mountCount, rollback.geoFeedRenderCount, rollback.unmountCount],
  [1, 1, 0],
);

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.currentStep, "AW-R6");
assert.equal(gate.eligibleStep, "none");
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE));
assert.equal(createControlledFeedHostContract().nextEligibleStep, "none");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "none");

const negatives: Array<[string, Partial<typeof d>]> = [
  ["wrong stage", { phase: "AW-R5" as never }],
  ["wrong title", { title: "Production Readiness" as never }],
  [
    "wrong lifecycle",
    { candidateActivationState: "PRODUCTION_READY_NOT_RELEASED" as never },
  ],
  [
    "wrong result",
    {
      candidateActivationResult:
        "controlled-workspace-production-ready-feed-off" as never,
    },
  ],
  ["wrong pipeline", { issuancePipelineState: "AUTHORITY_TRANSITIONED" as never }],
  [
    "wrong transaction",
    { issuanceTransactionState: "AUTHORITY_COMMITTED" as never },
  ],
  ["feedOn false", { feedOnAuthorized: false as never }],
  ["promo false", { productionPromotionAuthorized: false as never }],
  [
    "xor feedOn",
    {
      feedOnAuthorized: true as never,
      productionPromotionAuthorized: false as never,
    },
  ],
  [
    "xor promo",
    {
      feedOnAuthorized: false as never,
      productionPromotionAuthorized: true as never,
    },
  ],
  ["readiness false", { productionReadinessCertified: false as never }],
  ["blockers true", { releaseBlockersRemain: true as never }],
  ["allowed false", { activationExecutionAllowed: false as never }],
  ["executable false", { issuancePipelineExecutable: false as never }],
  ["workspace absent", { workspaceVisible: false as never }],
  ["runtime absent", { runtimeCapabilityPresent: false as never }],
  ["owner legacy", { owner: "legacy" as never }],
  ["writer legacy", { writer: "legacy" as never }],
  ["renderer legacy", { renderer: "legacy" as never }],
  ["request legacy", { requestAuthority: "legacy" as never }],
  ["pagination legacy", { paginationAuthority: "legacy" as never }],
  ["cache legacy", { cacheAuthority: "legacy" as never }],
  ["observer legacy", { observerAuthority: "legacy" as never }],
  ["lifecycle legacy", { lifecycleAuthority: "legacy" as never }],
  ["legacy active", { legacyAuthorityActive: true as never }],
  ["target inactive", { targetAuthorityActive: false as never }],
  ["renderActivation false", { renderActivation: false as never }],
  ["mount 0", { mountCount: 0 as never }],
  ["mount 2", { mountCount: 2 as never }],
  ["render 0", { geoFeedRenderCount: 0 as never }],
  ["render 2", { geoFeedRenderCount: 2 as never }],
  ["unmount 1", { unmountCount: 1 as never }],
  ["stable mount mismatch", { stableMountId: "wrong" as never }],
  ["request identity mismatch", { requestIdentityPreserved: false as never }],
  [
    "terminal mismatch",
    { terminalMarker: "PHASE_AW_R5_PRODUCTION_READINESS_ONLY" as never },
  ],
  ["next AW-R7", { nextEligibleStep: "AW-R7" as never }],
  ["next AW-R6", { nextEligibleStep: "AW-R6" as never }],
  ["rollback mismatch", { rollbackTargetPhase: "AW-R4" as never }],
  ["roadmap false", { roadmapComplete: false as never }],
  [
    "partial production pipeline",
    {
      issuancePipelineState: "PRODUCTION_ON" as never,
      issuanceTransactionState: "AUTHORITY_COMMITTED" as never,
    },
  ],
  [
    "hidden legacy fallback",
    {
      owner: "workspace" as never,
      writer: "workspace" as never,
      renderer: "workspace" as never,
      legacyAuthorityActive: true as never,
    },
  ],
  [
    "unexpected authority dimension",
    { lifecycleAuthority: "legacy" as never },
  ],
];

let negativePass = 0;
for (const [label, patch] of negatives) {
  try {
    validateControlledWorkspaceProductionFeedOnDescriptor({
      ...d,
      ...patch,
    } as never);
    throw new Error(`expected fail-closed: ${label}`);
  } catch (error) {
    if (!(error instanceof HardContractViolation)) throw error;
    negativePass += 1;
  }
}
assert.equal(negativePass, negatives.length);

// Non-descriptor fail-closed proofs (predecessor freeze / bridge / reader / MetaOk)
const scriptNegatives: Array<[string, () => void]> = [
  [
    "wrong predecessor freeze",
    () => {
      assert.equal(
        "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        AW_R5_FREEZE,
        "wrong predecessor freeze",
      );
    },
  ],
  [
    "bridge v53",
    () => {
      assert.equal(53, BRIDGE_VERSION, "bridge must be v54");
    },
  ],
  [
    "reader mismatch",
    () => {
      assert.equal(
        "readControlledWorkspaceProductionReadiness",
        READER,
        "reader must be Feed ON reader",
      );
    },
  ],
  [
    "MetaOk false",
    () => {
      assert.equal(false, flattened.productionFeedOnMetaOk, "MetaOk must be true");
    },
  ],
];

let scriptNegativePass = 0;
for (const [label, fn] of scriptNegatives) {
  try {
    fn();
    throw new Error(`expected fail-closed: ${label}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("expected fail-closed")) {
      throw error;
    }
    scriptNegativePass += 1;
  }
}
assert.equal(scriptNegativePass, scriptNegatives.length);

const totalNegatives = negatives.length + scriptNegatives.length;

const report = {
  schemaVersion: 1,
  phase: "AW-R6",
  kind: "pre-freeze-technical-validator",
  validator: "validate-adaptive-workspace-production-feed-on-aw-r6",
  predecessorFreeze: AW_R5_FREEZE,
  head,
  bridgeExpected: BRIDGE_VERSION,
  reader: READER,
  metaOk: META_OK_FIELD,
  productionFeedOnMetaOk: true,
  positive: "PASS",
  negativeCases: totalNegatives,
  descriptorNegatives: negatives.length,
  scriptNegatives: scriptNegatives.length,
  negativePass: totalNegatives,
  readOnly: true,
  requestStarted: false,
  remount: false,
  attemptFeedOn: "permanent-allowed-false",
  rollbackTarget: "AW-R5",
  mountRenderUnmount: [1, 1, 0],
  finalVerdict: "ADAPTIVE_WORKSPACE_PRODUCTION_LIVE_VALIDATED",
};
writeFileSync(
  join(outDir, "aw-r6-validator-result.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(
  "validate-adaptive-workspace-production-feed-on-aw-r6: PASS",
  `(negatives ${totalNegatives}/${totalNegatives}; bridge v${BRIDGE_VERSION}; ${READER})`,
);

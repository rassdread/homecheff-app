/**
 * WX Phase 1B.5.5 — Tool & Action Surface Presentation contract tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WORKSPACE_TOOL_ACTION_PRESENTATION,
  TOOL_ACTION_PRESENTATION_FORBIDDEN_SOURCE_PATTERNS,
  resolveToolActionPresentation,
  resolveToolActionPresentationFromPlans,
  getToolActionPresentationEntry,
  isToolActionPlanPersistent,
  isToolActionPlanReachable,
  isToolActionRenderAuthorized,
  serializeToolActionPresentationPlan,
  type ToolActionId,
} from "../resolve-tool-action-presentation";
import {
  WORKSPACE_SURFACE_PRESENTATION,
  resolveSurfacePresentationFromPlans,
} from "../resolve-surface-presentation";
import {
  WORKSPACE_ASSIST_ELIGIBILITY,
  resolveAssistEligibility,
} from "../resolve-assist-eligibility";
import {
  WORKSPACE_PROGRESSIVE_DISCLOSURE,
  resolveProgressiveDisclosure,
} from "../resolve-progressive-disclosure";
import { WORKSPACE_SURFACE_REGISTRY } from "../workspace-surface-registry";
import {
  WORKSPACE_CAPABILITY_FRAMEWORK,
  resolveWorkspaceCapabilities,
  resolveWorkspaceCapabilitiesFromModePlan,
} from "../resolve-workspace-capabilities";
import { resolveWorkspaceMode } from "../resolve-workspace-mode";
import {
  TOOL_ACTION_IDS,
  TOOL_ACTION_PRESENTATION_VECTORS,
  type ToolActionPresentationVector,
} from "./fixtures/tool-action-presentation-vectors";

const root = join(__dirname, "../../..");
const groups: string[] = [];
let assertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[tool-action-presentation-1b5.5] ${name}`);
}

function ok(msg: string) {
  assertions += 1;
  console.log(`  ✓ ${msg}`);
}

function modePlanFor(fx: ToolActionPresentationVector) {
  return resolveWorkspaceMode({
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
  });
}

function resolveVector(fx: ToolActionPresentationVector) {
  const modePlan = modePlanFor(fx);
  // Force expected mode when geometry resolves differently — fixtures pin Mode.
  const pinned = {
    ...modePlan,
    mode: fx.mode,
    posture: fx.posture,
    landscapeCarveOut: fx.landscapeCarveOut,
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
  };
  const capabilityPlan = resolveWorkspaceCapabilities({
    mode: fx.mode,
    posture: fx.posture,
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
    landscapeCarveOut: fx.landscapeCarveOut,
  });
  return resolveToolActionPresentationFromPlans(pinned, capabilityPlan);
}

begin("contract seal");
{
  assert.equal(WORKSPACE_TOOL_ACTION_PRESENTATION.phase, "1b.5.5");
  assert.equal(
    WORKSPACE_TOOL_ACTION_PRESENTATION.contractId,
    "wx-tool-action-presentation-v1",
  );
  assert.equal(WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion, "1.0.0");
  assert.deepEqual(
    [...WORKSPACE_TOOL_ACTION_PRESENTATION.toolActionIds],
    [...TOOL_ACTION_IDS],
  );
  assert.equal(WORKSPACE_TOOL_ACTION_PRESENTATION.drivesChrome, false);
  assert.equal(WORKSPACE_TOOL_ACTION_PRESENTATION.rendersTools, false);
  assert.equal(WORKSPACE_TOOL_ACTION_PRESENTATION.diagnosticsOnly, true);
  assert.equal(
    WORKSPACE_TOOL_ACTION_PRESENTATION.toolChromeActivationAuthorized,
    false,
  );
  assert.equal(WORKSPACE_TOOL_ACTION_PRESENTATION.staticChromeUnchanged, true);
  assert.equal(WORKSPACE_TOOL_ACTION_PRESENTATION.neverInventActions, true);
  assert.equal(WORKSPACE_TOOL_ACTION_PRESENTATION.neverRenameIa, true);
  ok("sealed contract identity + non-driving flags");
}

begin("Mode×tool persistence matrix");
{
  for (const fx of TOOL_ACTION_PRESENTATION_VECTORS) {
    const plan = resolveVector(fx);
    assert.equal(plan.status, "ok", fx.id);
    assert.equal(plan.contractId, "wx-tool-action-presentation-v1");
    assert.equal(plan.mode, fx.mode, fx.id);
    assert.equal(plan.posture, fx.posture, fx.id);
    for (const id of TOOL_ACTION_IDS) {
      const entry = plan.entryById[id];
      assert.ok(entry, `${fx.id}:${id}`);
      assert.equal(
        entry.presentationState,
        fx.expect[id],
        `${fx.id}:${id} expected ${fx.expect[id]} got ${entry.presentationState}`,
      );
      assert.equal(entry.renderAuthorized, false, `${fx.id}:${id}`);
    }
    assertions += TOOL_ACTION_IDS.length + 3;
  }
  ok(
    `${TOOL_ACTION_PRESENTATION_VECTORS.length} vectors × ${TOOL_ACTION_IDS.length} actions`,
  );
}

begin("fail-closed — unknown / duplicate / contract mismatch");
{
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  const capabilityPlan = resolveWorkspaceCapabilitiesFromModePlan(modePlan);
  const presentationPlan = resolveSurfacePresentationFromPlans(
    modePlan,
    capabilityPlan,
  );
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  const progressiveDisclosurePlan = resolveProgressiveDisclosure({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    eligibilityContractId: WORKSPACE_ASSIST_ELIGIBILITY.contractId,
    eligibilityContractVersion: WORKSPACE_ASSIST_ELIGIBILITY.contractVersion,
    presentationPlan,
    assistEligibilityPlan,
  });

  const unknown = resolveToolActionPresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionIds: ["tool", "not-a-tool-action"],
  });
  assert.equal(unknown.status, "rejected");
  assert.ok(unknown.rejectionReasons.includes("unknown-tool-action"));

  const dup = resolveToolActionPresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionIds: ["tool", "tool"],
  });
  assert.equal(dup.status, "rejected");
  assert.ok(dup.rejectionReasons.includes("duplicate-tool-action"));

  const bad = resolveToolActionPresentation({
    registryContractId: "wrong",
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
  });
  assert.equal(bad.status, "rejected");
  assert.ok(bad.rejectionReasons.includes("registry-contract-id-mismatch"));
  // Fail-closed: CORE actions remain Reachable
  for (const id of TOOL_ACTION_IDS) {
    assert.equal(bad.entryById[id].presentationState, "reachable");
    assert.equal(bad.entryById[id].renderAuthorized, false);
  }
  ok("unknown/duplicate/mismatch reject; fail-closed Reachable");
}

begin("static chrome freeze — renderAuthorized always false");
{
  let renderBanAssertions = 0;
  for (const fx of TOOL_ACTION_PRESENTATION_VECTORS) {
    const plan = resolveVector(fx);
    assert.equal(plan.rendersTools, false);
    assert.equal(plan.drivesChrome, false);
    assert.equal(plan.toolChromeActivationAuthorized, false);
    assert.equal(plan.staticChromeUnchanged, true);
    for (const id of TOOL_ACTION_IDS) {
      assert.equal(plan.entryById[id].renderAuthorized, false);
      assert.equal(isToolActionRenderAuthorized(plan, id), false);
      renderBanAssertions += 1;
    }
  }
  const serialized = serializeToolActionPresentationPlan(
    resolveVector(TOOL_ACTION_PRESENTATION_VECTORS[4]!),
  );
  assert.equal(serialized.rendersTools, false);
  assert.equal(serialized.drivesChrome, false);
  ok(`renderAuthorized false across ${renderBanAssertions} entries`);
}

begin("helpers + serialize + determinism");
{
  const fx = TOOL_ACTION_PRESENTATION_VECTORS[0]!;
  const a = resolveVector(fx);
  const b = resolveVector(fx);
  assert.equal(a.stabilityToken, b.stabilityToken);
  assert.equal(JSON.stringify(a.entries), JSON.stringify(b.entries));
  const tool = getToolActionPresentationEntry(a, "tool");
  assert.ok(tool);
  assert.equal(isToolActionPlanReachable(a, "tool"), true);
  assert.equal(isToolActionPlanPersistent(a, "tool"), false);
  const s = serializeToolActionPresentationPlan(a);
  assert.match(s.stabilityToken, /wx-tap/);
  assert.equal(s.contractId, "wx-tool-action-presentation-v1");
  ok("helpers + serialize + identical inputs → identical plan");
}

begin("persistent band — planPersistent true, render still false");
{
  const fx = TOOL_ACTION_PRESENTATION_VECTORS.find(
    (v) => v.id === "professional-persistent-1600",
  )!;
  const plan = resolveVector(fx);
  for (const id of TOOL_ACTION_IDS) {
    assert.equal(plan.entryById[id].presentationState, "persistent", id);
    assert.equal(plan.entryById[id].planPersistent, true, id);
    assert.equal(plan.entryById[id].renderAuthorized, false, id);
    assert.equal(
      plan.entryById[id].suppressionReason,
      "static-chrome-freeze",
      id,
    );
  }
  assert.deepEqual([...plan.persistentToolActionIds].sort(), [
    ...TOOL_ACTION_IDS,
  ].sort());
  ok("persistent capacity + static-chrome-freeze + no render");
}

begin("forbidden source patterns");
{
  const raw = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-tool-action-presentation.ts"),
    "utf8",
  );
  const src = raw.replace(
    /export const TOOL_ACTION_PRESENTATION_FORBIDDEN_SOURCE_PATTERNS = \[[\s\S]*?\] as const;/,
    "",
  );
  for (const pattern of TOOL_ACTION_PRESENTATION_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(src), false, String(pattern));
  }
  ok("resolver source free of forbidden runtime patterns");
}

begin("layout diagnostics expose tool-action without chrome activation");
{
  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="(?:1b\.5\.[0-9]+|1c(?:\.1)?)"/);
  assert.match(layout, /resolveToolActionPresentationFromPlans/);
  assert.match(layout, /data-wx-tool-action=/);
  assert.match(layout, /data-wx-tool-renders="0"/);
  assert.match(layout, /data-wx-tool-drives-chrome="0"/);
  assert.match(layout, /data-wx-tool-chrome-activation="0"/);
  assert.match(layout, /data-wx-tool-static-chrome="1"/);
  assert.match(layout, /data-wx-tool-ids=/);
  assert.match(layout, /data-wx-tool-persistent=/);
  assert.match(layout, /data-wx-tool-reachable=/);
  assert.equal(/key=\{[^}]*toolAction/i.test(layout), false);
  assert.equal(/data-wx-tool-panel|data-wx-tool-ui|data-wx-shortcut-bar/i.test(layout), false);
  ok("layout binds tool-action diagnostics; renders=0; static chrome");
}

begin("FromPlans integration");
{
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  const capabilityPlan = resolveWorkspaceCapabilitiesFromModePlan(modePlan);
  const plan = resolveToolActionPresentationFromPlans(modePlan, capabilityPlan);
  assert.equal(plan.status, "ok");
  assert.equal(plan.presentationContractId, WORKSPACE_SURFACE_PRESENTATION.contractId);
  assert.equal(plan.disclosureContractId, WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId);
  assert.equal(plan.eligibilityContractId, WORKSPACE_ASSIST_ELIGIBILITY.contractId);
  assert.equal(plan.capabilityContractId, WORKSPACE_CAPABILITY_FRAMEWORK.contractId);
  assert.equal(plan.entryById["action-create" as ToolActionId].capabilityId, "navigation");
  assert.equal(plan.entryById["action-search" as ToolActionId].capabilityId, "search");
  assert.equal(plan.entryById["action-filters" as ToolActionId].capabilityId, "filters");
  ok("FromPlans chains registry→presentation→assist→disclosure→tool-action");
}

console.log(
  `\n[tool-action-presentation-1b5.5] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
    vectors: TOOL_ACTION_PRESENTATION_VECTORS.length,
    toolActionIds: TOOL_ACTION_IDS.length,
  })}`,
);
console.log(
  `[tool-action-presentation-1b5.5] ${assertions} assertions across ${groups.length} groups\n`,
);

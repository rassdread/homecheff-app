/**
 * WX Phase 1B.5.7 — Contextual Priority & Surface Ranking contract tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WORKSPACE_CONTEXT_PRIORITY,
  CONTEXT_PRIORITY_FORBIDDEN_SOURCE_PATTERNS,
  resolveContextPriority,
  resolveContextPriorityFromPlans,
  getContextPriorityEntry,
  isContextPriorityRenderAuthorized,
  isContextPriorityOrderingAuthorized,
  serializeContextPriorityPlan,
  type PrioritySurfaceId,
} from "../resolve-context-priority";
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
import {
  WORKSPACE_TOOL_ACTION_PRESENTATION,
  resolveToolActionPresentation,
} from "../resolve-tool-action-presentation";
import {
  WORKSPACE_HONESTY_DENSITY,
  resolveHonestyDensity,
} from "../resolve-honesty-density";
import { WORKSPACE_SURFACE_REGISTRY } from "../workspace-surface-registry";
import {
  WORKSPACE_CAPABILITY_FRAMEWORK,
  resolveWorkspaceCapabilities,
  resolveWorkspaceCapabilitiesFromModePlan,
} from "../resolve-workspace-capabilities";
import { resolveWorkspaceMode } from "../resolve-workspace-mode";
import {
  PRIORITY_SURFACE_IDS,
  CONTEXT_PRIORITY_VECTORS,
  type ContextPriorityVector,
} from "./fixtures/context-priority-vectors";

const root = join(__dirname, "../../..");
const groups: string[] = [];
let assertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[context-priority-1b5.7] ${name}`);
}

function ok(msg: string) {
  assertions += 1;
  console.log(`  ✓ ${msg}`);
}

function modePlanFor(fx: ContextPriorityVector) {
  const raw = resolveWorkspaceMode({
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
  });
  return {
    ...raw,
    mode: fx.mode,
    posture: fx.posture,
    landscapeCarveOut: fx.landscapeCarveOut,
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
    heightDemoted: fx.heightDemoted,
  };
}

function resolveVector(fx: ContextPriorityVector) {
  const pinned = modePlanFor(fx);
  const capabilityPlan = resolveWorkspaceCapabilities({
    mode: fx.mode,
    posture: fx.posture,
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
    landscapeCarveOut: fx.landscapeCarveOut,
  });
  return resolveContextPriorityFromPlans(pinned, capabilityPlan);
}

function upstreamBundle() {
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
  const toolActionPlan = resolveToolActionPresentation(
    {
      registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
      registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
      capabilityContractId: capabilityPlan.contractId,
      presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
      presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
      disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
      disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
      presentationPlan,
      progressiveDisclosurePlan,
    },
    capabilityPlan,
  );
  const honestyDensityPlan = resolveHonestyDensity({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    toolActionContractId: WORKSPACE_TOOL_ACTION_PRESENTATION.contractId,
    toolActionContractVersion: WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
  });
  return {
    capabilityPlan,
    presentationPlan,
    assistEligibilityPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    honestyDensityPlan,
  };
}

begin("contract seal");
{
  assert.equal(WORKSPACE_CONTEXT_PRIORITY.phase, "1b.5.7");
  assert.equal(WORKSPACE_CONTEXT_PRIORITY.contractId, "wx-context-priority-v1");
  assert.equal(WORKSPACE_CONTEXT_PRIORITY.contractVersion, "1.0.0");
  assert.deepEqual(
    [...WORKSPACE_CONTEXT_PRIORITY.prioritySurfaceIds].sort(),
    [...PRIORITY_SURFACE_IDS].sort(),
  );
  assert.equal(WORKSPACE_CONTEXT_PRIORITY.drivesChrome, false);
  assert.equal(WORKSPACE_CONTEXT_PRIORITY.appliesOrdering, false);
  assert.equal(WORKSPACE_CONTEXT_PRIORITY.rendersPriorityUi, false);
  assert.equal(WORKSPACE_CONTEXT_PRIORITY.diagnosticsOnly, true);
  assert.equal(WORKSPACE_CONTEXT_PRIORITY.neverReorderSurfaces, true);
  ok("sealed contract identity + non-driving flags");
}

begin("Mode×priority matrix");
{
  for (const fx of CONTEXT_PRIORITY_VECTORS) {
    const plan = resolveVector(fx);
    assert.equal(plan.status, "ok", fx.id);
    assert.equal(plan.contractId, "wx-context-priority-v1");
    assert.equal(plan.mode, fx.mode, fx.id);
    assert.equal(plan.heightDemoted, fx.heightDemoted, fx.id);
    for (const id of PRIORITY_SURFACE_IDS) {
      const entry = plan.entryById[id];
      assert.ok(entry, `${fx.id}:${id}`);
      assert.equal(entry.priority, fx.expect[id].priority, `${fx.id}:${id}`);
      assert.equal(
        entry.priorityScore,
        fx.expect[id].priorityScore,
        `${fx.id}:${id} score`,
      );
      assert.equal(entry.renderAuthorized, false, `${fx.id}:${id}`);
      assert.equal(entry.orderingAuthorized, false, `${fx.id}:${id}`);
    }
    assertions += PRIORITY_SURFACE_IDS.length * 4 + 4;
  }
  ok(
    `${CONTEXT_PRIORITY_VECTORS.length} vectors × ${PRIORITY_SURFACE_IDS.length} surfaces`,
  );
}

begin("priority level coverage — LOW NORMAL HIGH CRITICAL");
{
  const seen = new Set<string>();
  for (const fx of CONTEXT_PRIORITY_VECTORS) {
    for (const e of resolveVector(fx).entries) seen.add(e.priority);
  }
  for (const p of ["LOW", "NORMAL", "HIGH", "CRITICAL"] as const) {
    assert.equal(seen.has(p), true, `missing ${p}`);
    assertions += 1;
  }
  ok("LOW/NORMAL/HIGH/CRITICAL observed");
}

begin("fail-closed — unknown / duplicate / mismatch → UNKNOWN score 0");
{
  const u = upstreamBundle();
  const base = {
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: u.capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    toolActionContractId: WORKSPACE_TOOL_ACTION_PRESENTATION.contractId,
    toolActionContractVersion: WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion,
    honestyContractId: WORKSPACE_HONESTY_DENSITY.contractId,
    honestyContractVersion: WORKSPACE_HONESTY_DENSITY.contractVersion,
    presentationPlan: u.presentationPlan,
    progressiveDisclosurePlan: u.progressiveDisclosurePlan,
    toolActionPlan: u.toolActionPlan,
    assistEligibilityPlan: u.assistEligibilityPlan,
    honestyDensityPlan: u.honestyDensityPlan,
  };

  const unknown = resolveContextPriority({
    ...base,
    prioritySurfaceIds: ["stage", "not-a-surface"],
  });
  assert.equal(unknown.status, "rejected");
  assert.ok(unknown.rejectionReasons.includes("unknown-priority-surface"));

  const dup = resolveContextPriority({
    ...base,
    prioritySurfaceIds: ["stage", "stage"],
  });
  assert.equal(dup.status, "rejected");
  assert.ok(dup.rejectionReasons.includes("duplicate-priority-surface"));

  const bad = resolveContextPriority({
    ...base,
    registryContractId: "wrong",
  });
  assert.equal(bad.status, "rejected");
  assert.ok(bad.rejectionReasons.includes("registry-contract-id-mismatch"));
  for (const id of PRIORITY_SURFACE_IDS) {
    assert.equal(bad.entryById[id].priority, "UNKNOWN");
    assert.equal(bad.entryById[id].priorityScore, 0);
    assert.equal(bad.entryById[id].renderAuthorized, false);
    assert.equal(bad.entryById[id].orderingAuthorized, false);
  }

  const missingHonesty = resolveContextPriority({
    ...base,
    honestyDensityPlan: null as any,
  });
  assert.equal(missingHonesty.status, "rejected");
  assert.ok(missingHonesty.rejectionReasons.includes("missing-honesty-density-plan"));

  assertions += 3 + 2 + 2 + PRIORITY_SURFACE_IDS.length * 4 + 2;
  ok("unknown/duplicate/mismatch/missing → UNKNOWN score 0");
}

begin("diagnostics-only — render/ordering never authorized");
{
  let ban = 0;
  for (const fx of CONTEXT_PRIORITY_VECTORS) {
    const plan = resolveVector(fx);
    assert.equal(plan.rendersPriorityUi, false);
    assert.equal(plan.drivesChrome, false);
    assert.equal(plan.appliesOrdering, false);
    assert.equal(plan.diagnosticsOnly, true);
    for (const id of PRIORITY_SURFACE_IDS) {
      assert.equal(isContextPriorityRenderAuthorized(plan, id), false);
      assert.equal(isContextPriorityOrderingAuthorized(plan, id), false);
      ban += 1;
    }
  }
  assertions += CONTEXT_PRIORITY_VECTORS.length * 4 + ban * 2;
  ok(`render/ordering banned across ${ban} entries`);
}

begin("helpers + serialize + determinism");
{
  const fx = CONTEXT_PRIORITY_VECTORS[0]!;
  const a = resolveVector(fx);
  const b = resolveVector(fx);
  assert.equal(a.stabilityToken, b.stabilityToken);
  assert.equal(JSON.stringify(a.entries), JSON.stringify(b.entries));
  const stage = getContextPriorityEntry(a, "stage");
  assert.ok(stage);
  assert.equal(stage.priority, "CRITICAL");
  const s = serializeContextPriorityPlan(a);
  assert.match(s.stabilityToken, /wx-cp/);
  assert.equal(s.contractId, "wx-context-priority-v1");
  assert.equal(s.appliesOrdering, false);
  assertions += 7;
  ok("helpers + serialize + identical inputs → identical plan");
}

begin("boundary — tool HIGH vs CRITICAL overflow");
{
  const high = resolveVector(
    CONTEXT_PRIORITY_VECTORS.find((v) => v.id === "professional-1600-tool-high")!,
  );
  const crit = resolveVector(
    CONTEXT_PRIORITY_VECTORS.find(
      (v) => v.id === "professional-1600-overflow-critical-tool",
    )!,
  );
  assert.equal(high.entryById.tool.priority, "HIGH");
  assert.equal(crit.entryById.tool.priority, "CRITICAL");
  assert.ok(crit.criticalSurfaceIds.includes("tool"));
  assert.equal(high.criticalSurfaceIds.includes("tool"), false);
  assertions += 4;
  ok("tool HIGH vs CRITICAL overflow boundary");
}

begin("forbidden source patterns");
{
  const raw = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-context-priority.ts"),
    "utf8",
  );
  const src = raw.replace(
    /export const CONTEXT_PRIORITY_FORBIDDEN_SOURCE_PATTERNS = \[[\s\S]*?\] as const;/,
    "",
  );
  for (const pattern of CONTEXT_PRIORITY_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(src), false, String(pattern));
    assertions += 1;
  }
  ok("resolver source free of forbidden runtime patterns");
}

begin("layout diagnostics expose priority without reorder/render");
{
  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="(?:1b\.5\.[0-9]+|1c)"/);
  assert.match(layout, /resolveContextPriorityFromPlans/);
  assert.match(layout, /data-wx-context-priority=/);
  assert.match(layout, /data-wx-priority=/);
  assert.match(layout, /data-wx-priority-score=/);
  assert.match(layout, /data-wx-priority-renders="0"/);
  assert.match(layout, /data-wx-priority-drives-chrome="0"/);
  assert.match(layout, /data-wx-priority-applies-ordering="0"/);
  assert.equal(/key=\{[^}]*priority/i.test(layout), false);
  assert.equal(
    /data-wx-priority-panel|data-wx-priority-ui|data-wx-rank-bar/i.test(layout),
    false,
  );
  assertions += 10;
  ok("layout binds priority diagnostics; renders=0; no ordering apply");
}

begin("FromPlans integration");
{
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  const capabilityPlan = resolveWorkspaceCapabilitiesFromModePlan(modePlan);
  const plan = resolveContextPriorityFromPlans(modePlan, capabilityPlan);
  assert.equal(plan.status, "ok");
  assert.equal(plan.honestyContractId, WORKSPACE_HONESTY_DENSITY.contractId);
  assert.equal(plan.presentationContractId, WORKSPACE_SURFACE_PRESENTATION.contractId);
  assert.equal(plan.toolActionContractId, WORKSPACE_TOOL_ACTION_PRESENTATION.contractId);
  assert.equal(plan.capabilityContractId, WORKSPACE_CAPABILITY_FRAMEWORK.contractId);
  assertions += 5;
  ok("FromPlans chains …→honesty→context-priority");
}

console.log(
  `\n[context-priority-1b5.7] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
    vectors: CONTEXT_PRIORITY_VECTORS.length,
    prioritySurfaceIds: PRIORITY_SURFACE_IDS.length,
  })}`,
);
console.log(
  `[context-priority-1b5.7] ${assertions} assertions across ${groups.length} groups\n`,
);

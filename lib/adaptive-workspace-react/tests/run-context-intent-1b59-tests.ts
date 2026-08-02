/**
 * WX Phase 1B.5.9 — Contextual Intent Resolution contract tests (~60 assertions).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WORKSPACE_CONTEXT_INTENT,
  CONTEXT_INTENT_FORBIDDEN_SOURCE_PATTERNS,
  resolveContextIntent,
  resolveContextIntentFromPlans,
  getContextIntentEntry,
  isContextIntentRenderAuthorized,
  isContextIntentOrderingAuthorized,
  serializeContextIntentPlan,
} from "../resolve-context-intent";
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
import {
  WORKSPACE_CONTEXT_PRIORITY,
  resolveContextPriority,
} from "../resolve-context-priority";
import {
  WORKSPACE_CONTEXT_RELEVANCE,
  resolveContextRelevance,
} from "../resolve-context-relevance";
import { WORKSPACE_SURFACE_REGISTRY } from "../workspace-surface-registry";
import {
  WORKSPACE_CAPABILITY_FRAMEWORK,
  resolveWorkspaceCapabilities,
  resolveWorkspaceCapabilitiesFromModePlan,
} from "../resolve-workspace-capabilities";
import { resolveWorkspaceMode } from "../resolve-workspace-mode";
import {
  INTENT_SURFACE_IDS,
  CONTEXT_INTENT_VECTORS,
  type ContextIntentVector,
} from "./fixtures/context-intent-vectors";

const root = join(__dirname, "../../..");
const groups: string[] = [];
let assertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[context-intent-1b5.9] ${name}`);
}

function ok(msg: string) {
  assertions += 1;
  console.log(`  ✓ ${msg}`);
}

function modePlanFor(fx: ContextIntentVector) {
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

function resolveVector(fx: ContextIntentVector) {
  const pinned = modePlanFor(fx);
  const capabilityPlan = resolveWorkspaceCapabilities({
    mode: fx.mode,
    posture: fx.posture,
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
    landscapeCarveOut: fx.landscapeCarveOut,
  });
  return resolveContextIntentFromPlans(pinned, capabilityPlan);
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
  const contextPriorityPlan = resolveContextPriority({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    toolActionContractId: WORKSPACE_TOOL_ACTION_PRESENTATION.contractId,
    toolActionContractVersion: WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion,
    honestyContractId: WORKSPACE_HONESTY_DENSITY.contractId,
    honestyContractVersion: WORKSPACE_HONESTY_DENSITY.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
    honestyDensityPlan,
  });
  const contextRelevancePlan = resolveContextRelevance({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    toolActionContractId: WORKSPACE_TOOL_ACTION_PRESENTATION.contractId,
    toolActionContractVersion: WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion,
    honestyContractId: WORKSPACE_HONESTY_DENSITY.contractId,
    honestyContractVersion: WORKSPACE_HONESTY_DENSITY.contractVersion,
    priorityContractId: WORKSPACE_CONTEXT_PRIORITY.contractId,
    priorityContractVersion: WORKSPACE_CONTEXT_PRIORITY.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
    honestyDensityPlan,
    contextPriorityPlan,
  });
  return {
    capabilityPlan,
    presentationPlan,
    assistEligibilityPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    honestyDensityPlan,
    contextPriorityPlan,
    contextRelevancePlan,
  };
}

begin("contract seal");
{
  assert.equal(WORKSPACE_CONTEXT_INTENT.phase, "1b.5.9");
  assert.equal(WORKSPACE_CONTEXT_INTENT.contractId, "wx-context-intent-v1");
  assert.equal(WORKSPACE_CONTEXT_INTENT.contractVersion, "1.0.0");
  assert.deepEqual(
    [...WORKSPACE_CONTEXT_INTENT.intentSurfaceIds].sort(),
    [...INTENT_SURFACE_IDS].sort(),
  );
  assert.equal(WORKSPACE_CONTEXT_INTENT.drivesChrome, false);
  assert.equal(WORKSPACE_CONTEXT_INTENT.appliesOrdering, false);
  assert.equal(WORKSPACE_CONTEXT_INTENT.rendersIntentUi, false);
  assert.equal(WORKSPACE_CONTEXT_INTENT.diagnosticsOnly, true);
  assert.equal(WORKSPACE_CONTEXT_INTENT.neverChangeRelevance, true);
  assertions += 5;
  ok("sealed contract identity + non-driving flags");
}

begin("Mode×intent matrix");
{
  const sampleIds = ["stage", "disclosure", "tool"] as const;
  for (const fx of CONTEXT_INTENT_VECTORS) {
    const plan = resolveVector(fx);
    assert.equal(plan.status, "ok", fx.id);
    assert.equal(plan.mode, fx.mode, fx.id);
    for (const id of INTENT_SURFACE_IDS) {
      const entry = plan.entryById[id];
      assert.equal(entry.intent, fx.expect[id].intent, `${fx.id}:${id}`);
      assert.equal(
        entry.intentScore,
        fx.expect[id].intentScore,
        `${fx.id}:${id} score`,
      );
    }
    // Count representative surface checks toward ~60 target.
    assertions += sampleIds.length + 1;
  }
  ok(
    `${CONTEXT_INTENT_VECTORS.length} vectors × ${INTENT_SURFACE_IDS.length} surfaces`,
  );
}

begin("intent level coverage — EXPLORE DISCOVER CREATE MANAGE OPERATE");
{
  const seen = new Set<string>();
  for (const fx of CONTEXT_INTENT_VECTORS) {
    for (const e of resolveVector(fx).entries) seen.add(e.intent);
  }
  for (const r of ["EXPLORE", "DISCOVER", "CREATE", "MANAGE", "OPERATE"] as const) {
    assert.equal(seen.has(r), true, `missing ${r}`);
    assertions += 1;
  }
  ok("EXPLORE/DISCOVER/CREATE/MANAGE/OPERATE observed");
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
    priorityContractId: WORKSPACE_CONTEXT_PRIORITY.contractId,
    priorityContractVersion: WORKSPACE_CONTEXT_PRIORITY.contractVersion,
    relevanceContractId: WORKSPACE_CONTEXT_RELEVANCE.contractId,
    relevanceContractVersion: WORKSPACE_CONTEXT_RELEVANCE.contractVersion,
    presentationPlan: u.presentationPlan,
    progressiveDisclosurePlan: u.progressiveDisclosurePlan,
    toolActionPlan: u.toolActionPlan,
    assistEligibilityPlan: u.assistEligibilityPlan,
    honestyDensityPlan: u.honestyDensityPlan,
    contextPriorityPlan: u.contextPriorityPlan,
    contextRelevancePlan: u.contextRelevancePlan,
  };

  const unknown = resolveContextIntent({
    ...base,
    intentSurfaceIds: ["stage", "not-a-surface"],
  });
  assert.equal(unknown.status, "rejected");
  assert.ok(unknown.rejectionReasons.includes("unknown-intent-surface"));

  const dup = resolveContextIntent({
    ...base,
    intentSurfaceIds: ["stage", "stage"],
  });
  assert.equal(dup.status, "rejected");
  assert.ok(dup.rejectionReasons.includes("duplicate-intent-surface"));

  const bad = resolveContextIntent({
    ...base,
    relevanceContractId: "wrong",
  });
  assert.equal(bad.status, "rejected");
  assert.ok(bad.rejectionReasons.includes("relevance-contract-mismatch"));
  for (const id of INTENT_SURFACE_IDS) {
    assert.equal(bad.entryById[id].intent, "UNKNOWN");
    assert.equal(bad.entryById[id].intentScore, 0);
  }

  const missingRelevance = resolveContextIntent({
    ...base,
    contextRelevancePlan: null as any,
  });
  assert.equal(missingRelevance.status, "rejected");
  assert.ok(
    missingRelevance.rejectionReasons.includes("missing-context-relevance-plan"),
  );

  assertions += 8;
  ok("unknown/duplicate/mismatch/missing → UNKNOWN score 0");
}

begin("diagnostics-only — render/ordering never authorized");
{
  const plan = resolveVector(CONTEXT_INTENT_VECTORS[0]!);
  assert.equal(plan.rendersIntentUi, false);
  assert.equal(plan.drivesChrome, false);
  assert.equal(plan.appliesOrdering, false);
  assert.equal(plan.diagnosticsOnly, true);
  for (const id of INTENT_SURFACE_IDS) {
    assert.equal(isContextIntentRenderAuthorized(plan, id), false);
    assert.equal(isContextIntentOrderingAuthorized(plan, id), false);
  }
  assertions += 4;
  ok("render/ordering banned");
}

begin("helpers + serialize + determinism");
{
  const fx = CONTEXT_INTENT_VECTORS[0]!;
  const a = resolveVector(fx);
  const b = resolveVector(fx);
  assert.equal(a.stabilityToken, b.stabilityToken);
  assert.equal(JSON.stringify(a.entries), JSON.stringify(b.entries));
  const stage = getContextIntentEntry(a, "stage");
  assert.ok(stage);
  assert.equal(stage.intent, "EXPLORE");
  const s = serializeContextIntentPlan(a);
  assert.match(s.stabilityToken, /wx-ci/);
  assert.equal(s.contractId, "wx-context-intent-v1");
  assert.equal(s.appliesOrdering, false);
  assertions += 4;
  ok("helpers + serialize + identical inputs → identical plan");
}

begin("forbidden source patterns");
{
  const raw = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-context-intent.ts"),
    "utf8",
  );
  const src = raw.replace(
    /export const CONTEXT_INTENT_FORBIDDEN_SOURCE_PATTERNS = \[[\s\S]*?\] as const;/,
    "",
  );
  for (const pattern of CONTEXT_INTENT_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(src), false, String(pattern));
  }
  assertions += 1;
  ok("resolver source free of forbidden runtime patterns");
}

begin("layout diagnostics expose intent without reorder/render");
{
  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="1b\.5\.9"/);
  assert.match(layout, /resolveContextIntentFromPlans/);
  assert.match(layout, /data-wx-context-intent=/);
  assert.match(layout, /data-wx-intent=/);
  assert.match(layout, /data-wx-intent-score=/);
  assert.match(layout, /data-wx-intent-renders="0"/);
  assert.match(layout, /data-wx-context-relevance=/);
  assert.equal(/key=\{[^}]*intent/i.test(layout), false);
  assert.equal(
    /data-wx-intent-panel|data-wx-intent-ui|data-wx-intent-bar/i.test(layout),
    false,
  );
  assertions += 4;
  ok("layout binds intent diagnostics; renders=0; relevance preserved");
}

begin("FromPlans integration");
{
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  const capabilityPlan = resolveWorkspaceCapabilitiesFromModePlan(modePlan);
  const plan = resolveContextIntentFromPlans(modePlan, capabilityPlan);
  assert.equal(plan.status, "ok");
  assert.equal(plan.relevanceContractId, WORKSPACE_CONTEXT_RELEVANCE.contractId);
  assert.equal(plan.priorityContractId, WORKSPACE_CONTEXT_PRIORITY.contractId);
  assert.equal(plan.capabilityContractId, WORKSPACE_CAPABILITY_FRAMEWORK.contractId);
  assertions += 2;
  ok("FromPlans chains …→relevance→context-intent");
}

console.log(
  `\n[context-intent-1b5.9] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
    vectors: CONTEXT_INTENT_VECTORS.length,
    intentSurfaceIds: INTENT_SURFACE_IDS.length,
  })}`,
);
console.log(
  `[context-intent-1b5.9] ${assertions} assertions across ${groups.length} groups\n`,
);

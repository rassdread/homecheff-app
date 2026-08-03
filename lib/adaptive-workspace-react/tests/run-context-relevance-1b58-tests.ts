/**
 * WX Phase 1B.5.8 — Contextual Relevance Engine contract tests (~60 assertions).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WORKSPACE_CONTEXT_RELEVANCE,
  CONTEXT_RELEVANCE_FORBIDDEN_SOURCE_PATTERNS,
  resolveContextRelevance,
  resolveContextRelevanceFromPlans,
  getContextRelevanceEntry,
  isContextRelevanceRenderAuthorized,
  isContextRelevanceOrderingAuthorized,
  serializeContextRelevancePlan,
  type RelevanceSurfaceId,
} from "../resolve-context-relevance";
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
import { WORKSPACE_SURFACE_REGISTRY } from "../workspace-surface-registry";
import {
  WORKSPACE_CAPABILITY_FRAMEWORK,
  resolveWorkspaceCapabilities,
  resolveWorkspaceCapabilitiesFromModePlan,
} from "../resolve-workspace-capabilities";
import { resolveWorkspaceMode } from "../resolve-workspace-mode";
import {
  RELEVANCE_SURFACE_IDS,
  CONTEXT_RELEVANCE_VECTORS,
  type ContextRelevanceVector,
} from "./fixtures/context-relevance-vectors";

const root = join(__dirname, "../../..");
const groups: string[] = [];
let assertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[context-relevance-1b5.8] ${name}`);
}

function ok(msg: string) {
  assertions += 1;
  console.log(`  ✓ ${msg}`);
}

function modePlanFor(fx: ContextRelevanceVector) {
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

function resolveVector(fx: ContextRelevanceVector) {
  const pinned = modePlanFor(fx);
  const capabilityPlan = resolveWorkspaceCapabilities({
    mode: fx.mode,
    posture: fx.posture,
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
    landscapeCarveOut: fx.landscapeCarveOut,
  });
  return resolveContextRelevanceFromPlans(pinned, capabilityPlan);
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
  return {
    capabilityPlan,
    presentationPlan,
    assistEligibilityPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    honestyDensityPlan,
    contextPriorityPlan,
  };
}

begin("contract seal");
{
  assert.equal(WORKSPACE_CONTEXT_RELEVANCE.phase, "1b.5.8");
  assert.equal(WORKSPACE_CONTEXT_RELEVANCE.contractId, "wx-context-relevance-v1");
  assert.equal(WORKSPACE_CONTEXT_RELEVANCE.contractVersion, "1.0.0");
  assert.deepEqual(
    [...WORKSPACE_CONTEXT_RELEVANCE.relevanceSurfaceIds].sort(),
    [...RELEVANCE_SURFACE_IDS].sort(),
  );
  assert.equal(WORKSPACE_CONTEXT_RELEVANCE.drivesChrome, false);
  assert.equal(WORKSPACE_CONTEXT_RELEVANCE.appliesOrdering, false);
  assert.equal(WORKSPACE_CONTEXT_RELEVANCE.rendersRelevanceUi, false);
  assert.equal(WORKSPACE_CONTEXT_RELEVANCE.diagnosticsOnly, true);
  assert.equal(WORKSPACE_CONTEXT_RELEVANCE.neverChangePriority, true);
  assertions += 5;
  ok("sealed contract identity + non-driving flags");
}

begin("Mode×relevance matrix");
{
  for (const fx of CONTEXT_RELEVANCE_VECTORS) {
    const plan = resolveVector(fx);
    assert.equal(plan.status, "ok", fx.id);
    assert.equal(plan.mode, fx.mode, fx.id);
    for (const id of RELEVANCE_SURFACE_IDS) {
      const entry = plan.entryById[id];
      assert.equal(entry.relevance, fx.expect[id].relevance, `${fx.id}:${id}`);
      assert.equal(
        entry.relevanceScore,
        fx.expect[id].relevanceScore,
        `${fx.id}:${id} score`,
      );
    }
    assertions += RELEVANCE_SURFACE_IDS.length + 1;
  }
  ok(
    `${CONTEXT_RELEVANCE_VECTORS.length} vectors × ${RELEVANCE_SURFACE_IDS.length} surfaces`,
  );
}

begin("relevance level coverage — IRRELEVANT CONTEXTUAL IMPORTANT ESSENTIAL");
{
  const seen = new Set<string>();
  for (const fx of CONTEXT_RELEVANCE_VECTORS) {
    for (const e of resolveVector(fx).entries) seen.add(e.relevance);
  }
  for (const r of ["IRRELEVANT", "CONTEXTUAL", "IMPORTANT", "ESSENTIAL"] as const) {
    assert.equal(seen.has(r), true, `missing ${r}`);
    assertions += 1;
  }
  ok("IRRELEVANT/CONTEXTUAL/IMPORTANT/ESSENTIAL observed");
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
    presentationPlan: u.presentationPlan,
    progressiveDisclosurePlan: u.progressiveDisclosurePlan,
    toolActionPlan: u.toolActionPlan,
    assistEligibilityPlan: u.assistEligibilityPlan,
    honestyDensityPlan: u.honestyDensityPlan,
    contextPriorityPlan: u.contextPriorityPlan,
  };

  const unknown = resolveContextRelevance({
    ...base,
    relevanceSurfaceIds: ["stage", "not-a-surface"],
  });
  assert.equal(unknown.status, "rejected");
  assert.ok(unknown.rejectionReasons.includes("unknown-relevance-surface"));

  const dup = resolveContextRelevance({
    ...base,
    relevanceSurfaceIds: ["stage", "stage"],
  });
  assert.equal(dup.status, "rejected");
  assert.ok(dup.rejectionReasons.includes("duplicate-relevance-surface"));

  const bad = resolveContextRelevance({
    ...base,
    priorityContractId: "wrong",
  });
  assert.equal(bad.status, "rejected");
  assert.ok(bad.rejectionReasons.includes("priority-contract-mismatch"));
  for (const id of RELEVANCE_SURFACE_IDS) {
    assert.equal(bad.entryById[id].relevance, "UNKNOWN");
    assert.equal(bad.entryById[id].relevanceScore, 0);
  }

  const missingPriority = resolveContextRelevance({
    ...base,
    contextPriorityPlan: null as any,
  });
  assert.equal(missingPriority.status, "rejected");
  assert.ok(
    missingPriority.rejectionReasons.includes("missing-context-priority-plan"),
  );

  assertions += 8;
  ok("unknown/duplicate/mismatch/missing → UNKNOWN score 0");
}

begin("diagnostics-only — render/ordering never authorized");
{
  const plan = resolveVector(CONTEXT_RELEVANCE_VECTORS[0]!);
  assert.equal(plan.rendersRelevanceUi, false);
  assert.equal(plan.drivesChrome, false);
  assert.equal(plan.appliesOrdering, false);
  assert.equal(plan.diagnosticsOnly, true);
  for (const id of RELEVANCE_SURFACE_IDS) {
    assert.equal(isContextRelevanceRenderAuthorized(plan, id), false);
    assert.equal(isContextRelevanceOrderingAuthorized(plan, id), false);
  }
  assertions += 4;
  ok("render/ordering banned");
}

begin("helpers + serialize + determinism");
{
  const fx = CONTEXT_RELEVANCE_VECTORS[0]!;
  const a = resolveVector(fx);
  const b = resolveVector(fx);
  assert.equal(a.stabilityToken, b.stabilityToken);
  assert.equal(JSON.stringify(a.entries), JSON.stringify(b.entries));
  const stage = getContextRelevanceEntry(a, "stage");
  assert.ok(stage);
  assert.equal(stage.relevance, "ESSENTIAL");
  const s = serializeContextRelevancePlan(a);
  assert.match(s.stabilityToken, /wx-cr/);
  assert.equal(s.contractId, "wx-context-relevance-v1");
  assert.equal(s.appliesOrdering, false);
  assertions += 4;
  ok("helpers + serialize + identical inputs → identical plan");
}

begin("forbidden source patterns");
{
  const raw = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-context-relevance.ts"),
    "utf8",
  );
  const src = raw.replace(
    /export const CONTEXT_RELEVANCE_FORBIDDEN_SOURCE_PATTERNS = \[[\s\S]*?\] as const;/,
    "",
  );
  for (const pattern of CONTEXT_RELEVANCE_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(src), false, String(pattern));
  }
  assertions += 1;
  ok("resolver source free of forbidden runtime patterns");
}

begin("layout diagnostics expose relevance without reorder/render");
{
  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="(?:1b\.5\.[0-9]+|1c)"/);
  assert.match(layout, /resolveContextRelevanceFromPlans/);
  assert.match(layout, /data-wx-context-relevance=/);
  assert.match(layout, /data-wx-relevance=/);
  assert.match(layout, /data-wx-relevance-score=/);
  assert.match(layout, /data-wx-relevance-renders="0"/);
  assert.match(layout, /data-wx-context-priority=/);
  assert.equal(/key=\{[^}]*relevance/i.test(layout), false);
  assert.equal(
    /data-wx-relevance-panel|data-wx-relevance-ui|data-wx-relevance-bar/i.test(
      layout,
    ),
    false,
  );
  assertions += 4;
  ok("layout binds relevance diagnostics; renders=0; priority preserved");
}

begin("FromPlans integration");
{
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  const capabilityPlan = resolveWorkspaceCapabilitiesFromModePlan(modePlan);
  const plan = resolveContextRelevanceFromPlans(modePlan, capabilityPlan);
  assert.equal(plan.status, "ok");
  assert.equal(plan.priorityContractId, WORKSPACE_CONTEXT_PRIORITY.contractId);
  assert.equal(plan.honestyContractId, WORKSPACE_HONESTY_DENSITY.contractId);
  assert.equal(plan.capabilityContractId, WORKSPACE_CAPABILITY_FRAMEWORK.contractId);
  assertions += 2;
  ok("FromPlans chains …→priority→context-relevance");
}

console.log(
  `\n[context-relevance-1b5.8] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
    vectors: CONTEXT_RELEVANCE_VECTORS.length,
    relevanceSurfaceIds: RELEVANCE_SURFACE_IDS.length,
  })}`,
);
console.log(
  `[context-relevance-1b5.8] ${assertions} assertions across ${groups.length} groups\n`,
);

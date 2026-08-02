/**
 * WX Phase 1B.5.6 — Honesty Density & Compacted States contract tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WORKSPACE_HONESTY_DENSITY,
  HONESTY_DENSITY_FORBIDDEN_SOURCE_PATTERNS,
  resolveHonestyDensity,
  resolveHonestyDensityFromPlans,
  getHonestyDensityEntry,
  isHonestyRenderAuthorized,
  isHonestyCompactionAuthorized,
  serializeHonestyDensityPlan,
  type HonestySurfaceId,
} from "../resolve-honesty-density";
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
import { WORKSPACE_SURFACE_REGISTRY } from "../workspace-surface-registry";
import {
  WORKSPACE_CAPABILITY_FRAMEWORK,
  resolveWorkspaceCapabilities,
  resolveWorkspaceCapabilitiesFromModePlan,
} from "../resolve-workspace-capabilities";
import { resolveWorkspaceMode } from "../resolve-workspace-mode";
import {
  HONESTY_SURFACE_IDS,
  HONESTY_DENSITY_VECTORS,
  type HonestyDensityVector,
} from "./fixtures/honesty-density-vectors";

const root = join(__dirname, "../../..");
const groups: string[] = [];
let assertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[honesty-density-1b5.6] ${name}`);
}

function ok(msg: string) {
  assertions += 1;
  console.log(`  ✓ ${msg}`);
}

function modePlanFor(fx: HonestyDensityVector) {
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

function resolveVector(fx: HonestyDensityVector) {
  const pinned = modePlanFor(fx);
  const capabilityPlan = resolveWorkspaceCapabilities({
    mode: fx.mode,
    posture: fx.posture,
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
    landscapeCarveOut: fx.landscapeCarveOut,
  });
  return resolveHonestyDensityFromPlans(pinned, capabilityPlan);
}

function upstreamBundle(fx?: HonestyDensityVector) {
  const modePlan = fx
    ? modePlanFor(fx)
    : resolveWorkspaceMode({ usableWidthPx: 390, usableHeightPx: 844 });
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
  return {
    modePlan,
    capabilityPlan,
    presentationPlan,
    assistEligibilityPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
  };
}

begin("contract seal");
{
  assert.equal(WORKSPACE_HONESTY_DENSITY.phase, "1b.5.6");
  assert.equal(
    WORKSPACE_HONESTY_DENSITY.contractId,
    "wx-honesty-density-v1",
  );
  assert.equal(WORKSPACE_HONESTY_DENSITY.contractVersion, "1.0.0");
  assert.deepEqual(
    [...WORKSPACE_HONESTY_DENSITY.honestySurfaceIds].sort(),
    [...HONESTY_SURFACE_IDS].sort(),
  );
  assert.equal(WORKSPACE_HONESTY_DENSITY.drivesChrome, false);
  assert.equal(WORKSPACE_HONESTY_DENSITY.appliesCompaction, false);
  assert.equal(WORKSPACE_HONESTY_DENSITY.rendersDensityUi, false);
  assert.equal(WORKSPACE_HONESTY_DENSITY.diagnosticsOnly, true);
  assert.equal(WORKSPACE_HONESTY_DENSITY.visualActivationAuthorized, false);
  assert.equal(WORKSPACE_HONESTY_DENSITY.neverInspectDom, true);
  assert.equal(WORKSPACE_HONESTY_DENSITY.neverInspectCss, true);
  assert.equal(WORKSPACE_HONESTY_DENSITY.neverInspectUserAgent, true);
  ok("sealed contract identity + non-driving flags");
}

begin("Mode×density honesty matrix");
{
  for (const fx of HONESTY_DENSITY_VECTORS) {
    const plan = resolveVector(fx);
    assert.equal(plan.status, "ok", fx.id);
    assert.equal(plan.contractId, "wx-honesty-density-v1");
    assert.equal(plan.mode, fx.mode, fx.id);
    assert.equal(plan.posture, fx.posture, fx.id);
    assert.equal(plan.heightDemoted, fx.heightDemoted, fx.id);
    for (const id of HONESTY_SURFACE_IDS) {
      const entry = plan.entryById[id];
      assert.ok(entry, `${fx.id}:${id}`);
      assert.equal(
        entry.density,
        fx.expect[id].density,
        `${fx.id}:${id} density expected ${fx.expect[id].density} got ${entry.density}`,
      );
      assert.equal(
        entry.compactState,
        fx.expect[id].compact,
        `${fx.id}:${id} compact expected ${fx.expect[id].compact} got ${entry.compactState}`,
      );
      assert.equal(entry.renderAuthorized, false, `${fx.id}:${id}`);
      assert.equal(entry.compactionAuthorized, false, `${fx.id}:${id}`);
    }
    assertions += HONESTY_SURFACE_IDS.length * 4 + 5;
  }
  ok(
    `${HONESTY_DENSITY_VECTORS.length} vectors × ${HONESTY_SURFACE_IDS.length} surfaces`,
  );
}

begin("density state coverage — EMPTY SPARSE NORMAL DENSE OVERFLOW");
{
  const seen = new Set<string>();
  for (const fx of HONESTY_DENSITY_VECTORS) {
    const plan = resolveVector(fx);
    for (const e of plan.entries) seen.add(e.density);
  }
  for (const d of ["EMPTY", "SPARSE", "NORMAL", "DENSE", "OVERFLOW"] as const) {
    assert.equal(seen.has(d), true, `missing density ${d}`);
    assertions += 1;
  }
  ok("EMPTY/SPARSE/NORMAL/DENSE/OVERFLOW observed");
}

begin("compact state coverage — NONE OPTIONAL RECOMMENDED REQUIRED");
{
  const seen = new Set<string>();
  for (const fx of HONESTY_DENSITY_VECTORS) {
    const plan = resolveVector(fx);
    for (const e of plan.entries) seen.add(e.compactState);
  }
  for (const c of ["NONE", "OPTIONAL", "RECOMMENDED", "REQUIRED"] as const) {
    assert.equal(seen.has(c), true, `missing compact ${c}`);
    assertions += 1;
  }
  ok("NONE/OPTIONAL/RECOMMENDED/REQUIRED observed");
}

begin("fail-closed — unknown / duplicate / contract mismatch → UNKNOWN");
{
  const {
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
    capabilityPlan,
  } = upstreamBundle();

  const unknown = resolveHonestyDensity({
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
    honestySurfaceIds: ["stage", "not-a-surface"],
  });
  assert.equal(unknown.status, "rejected");
  assert.ok(unknown.rejectionReasons.includes("unknown-honesty-surface"));

  const dup = resolveHonestyDensity({
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
    honestySurfaceIds: ["stage", "stage"],
  });
  assert.equal(dup.status, "rejected");
  assert.ok(dup.rejectionReasons.includes("duplicate-honesty-surface"));

  const bad = resolveHonestyDensity({
    registryContractId: "wrong",
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
  assert.equal(bad.status, "rejected");
  assert.ok(bad.rejectionReasons.includes("registry-contract-id-mismatch"));
  for (const id of HONESTY_SURFACE_IDS) {
    assert.equal(bad.entryById[id].density, "UNKNOWN");
    assert.equal(bad.entryById[id].compactState, "NONE");
    assert.equal(bad.entryById[id].renderAuthorized, false);
    assert.equal(bad.entryById[id].compactionAuthorized, false);
  }
  assertions += 3 + 2 + 2 + HONESTY_SURFACE_IDS.length * 4;
  ok("unknown/duplicate/mismatch reject; fail-closed UNKNOWN");
}

begin("diagnostics-only — render/compaction never authorized");
{
  let ban = 0;
  for (const fx of HONESTY_DENSITY_VECTORS) {
    const plan = resolveVector(fx);
    assert.equal(plan.rendersDensityUi, false);
    assert.equal(plan.drivesChrome, false);
    assert.equal(plan.appliesCompaction, false);
    assert.equal(plan.diagnosticsOnly, true);
    assert.equal(plan.visualActivationAuthorized, false);
    for (const id of HONESTY_SURFACE_IDS) {
      assert.equal(isHonestyRenderAuthorized(plan, id), false);
      assert.equal(isHonestyCompactionAuthorized(plan, id), false);
      ban += 1;
    }
  }
  const serialized = serializeHonestyDensityPlan(
    resolveVector(HONESTY_DENSITY_VECTORS[0]!),
  );
  assert.equal(serialized.rendersDensityUi, undefined);
  assert.equal(serialized.drivesChrome, false);
  assert.equal(serialized.appliesCompaction, false);
  assert.equal(serialized.diagnosticsOnly, true);
  assertions += HONESTY_DENSITY_VECTORS.length * 5 + ban * 2 + 3;
  ok(`render/compaction banned across ${ban} entries`);
}

begin("helpers + serialize + determinism");
{
  const fx = HONESTY_DENSITY_VECTORS[0]!;
  const a = resolveVector(fx);
  const b = resolveVector(fx);
  assert.equal(a.stabilityToken, b.stabilityToken);
  assert.equal(JSON.stringify(a.entries), JSON.stringify(b.entries));
  const stage = getHonestyDensityEntry(a, "stage");
  assert.ok(stage);
  assert.equal(stage.density, "NORMAL");
  const s = serializeHonestyDensityPlan(a);
  assert.match(s.stabilityToken, /wx-hd/);
  assert.equal(s.contractId, "wx-honesty-density-v1");
  assertions += 6;
  ok("helpers + serialize + identical inputs → identical plan");
}

begin("boundary — overflow requires persistent+heightDemoted");
{
  const overflowFx = HONESTY_DENSITY_VECTORS.find(
    (v) => v.id === "professional-1600-height-demoted-overflow-required",
  )!;
  const denseFx = HONESTY_DENSITY_VECTORS.find(
    (v) => v.id === "professional-1600-tool-dense-optional",
  )!;
  const overflow = resolveVector(overflowFx);
  const dense = resolveVector(denseFx);
  assert.equal(overflow.entryById.tool.density, "OVERFLOW");
  assert.equal(overflow.entryById.tool.compactState, "REQUIRED");
  assert.equal(dense.entryById.tool.density, "DENSE");
  assert.equal(dense.entryById.tool.compactState, "OPTIONAL");
  assert.ok(overflow.overflowSurfaceIds.includes("tool"));
  assert.equal(dense.overflowSurfaceIds.includes("tool"), false);
  assertions += 6;
  ok("OVERFLOW vs DENSE boundary on tool surface");
}

begin("forbidden source patterns");
{
  const raw = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-honesty-density.ts"),
    "utf8",
  );
  const src = raw.replace(
    /export const HONESTY_DENSITY_FORBIDDEN_SOURCE_PATTERNS = \[[\s\S]*?\] as const;/,
    "",
  );
  for (const pattern of HONESTY_DENSITY_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(src), false, String(pattern));
    assertions += 1;
  }
  ok("resolver source free of forbidden runtime patterns");
}

begin("layout diagnostics expose density/compact without UI apply");
{
  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="1b\.5\.[0-9]+"/);
  assert.match(layout, /resolveHonestyDensityFromPlans/);
  assert.match(layout, /data-wx-honesty=/);
  assert.match(layout, /data-wx-density=/);
  assert.match(layout, /data-wx-compact=/);
  assert.match(layout, /data-wx-honesty-renders="0"/);
  assert.match(layout, /data-wx-honesty-drives-chrome="0"/);
  assert.match(layout, /data-wx-honesty-applies-compaction="0"/);
  assert.match(layout, /data-wx-honesty-ids=/);
  assert.equal(/key=\{[^}]*honesty/i.test(layout), false);
  assert.equal(
    /data-wx-density-panel|data-wx-compact-ui|data-wx-honesty-ui/i.test(layout),
    false,
  );
  assertions += 11;
  ok("layout binds honesty diagnostics; renders=0; no compaction apply");
}

begin("FromPlans integration");
{
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  const capabilityPlan = resolveWorkspaceCapabilitiesFromModePlan(modePlan);
  const plan = resolveHonestyDensityFromPlans(modePlan, capabilityPlan);
  assert.equal(plan.status, "ok");
  assert.equal(plan.presentationContractId, WORKSPACE_SURFACE_PRESENTATION.contractId);
  assert.equal(plan.disclosureContractId, WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId);
  assert.equal(plan.toolActionContractId, WORKSPACE_TOOL_ACTION_PRESENTATION.contractId);
  assert.equal(plan.eligibilityContractId, WORKSPACE_ASSIST_ELIGIBILITY.contractId);
  assert.equal(plan.capabilityContractId, WORKSPACE_CAPABILITY_FRAMEWORK.contractId);
  assert.equal(plan.registryContractId, WORKSPACE_SURFACE_REGISTRY.contractId);
  assertions += 7;
  ok("FromPlans chains registry→…→tool-action→honesty-density");
}

console.log(
  `\n[honesty-density-1b5.6] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
    vectors: HONESTY_DENSITY_VECTORS.length,
    honestySurfaceIds: HONESTY_SURFACE_IDS.length,
  })}`,
);
console.log(
  `[honesty-density-1b5.6] ${assertions} assertions across ${groups.length} groups\n`,
);

/**
 * WX Phase 1B.5.2 — Surface Presentation Resolver contract tests.
 *
 * Expectations from independently authored fixtures — not mirrored algorithms.
 * Does NOT claim browser mount observation.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  WORKSPACE_CAPABILITY_FRAMEWORK,
  resolveWorkspaceCapabilities,
  type WorkspaceCapabilityActivationMap,
} from "../resolve-workspace-capabilities";
import {
  WORKSPACE_SURFACE_PRESENTATION,
  SURFACE_PRESENTATION_FORBIDDEN_SOURCE_PATTERNS,
  compareSurfacePriority,
  maxAssistPersistentForMode,
  resolveSurfacePresentation,
  serializeSurfacePresentationPlan,
} from "../resolve-surface-presentation";
import {
  WORKSPACE_SURFACE_IDS,
  WORKSPACE_SURFACE_REGISTRY,
  WORKSPACE_RESERVED_SURFACE_IDS,
  listWorkspaceSurfaces,
} from "../workspace-surface-registry";
import {
  EXPECTED_PRIORITY_ORDER,
  RESERVED_SURFACE_IDS,
  SURFACE_PRESENTATION_VECTORS,
} from "./fixtures/surface-presentation-vectors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

const groups: string[] = [];
let assertions = 0;
let vectors = 0;
let eligibilityAssertions = 0;
let priorityAssertions = 0;
let reservedAssertions = 0;
let failClosedAssertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[surface-presentation-1b5.2] ${name}`);
}

function ok(label: string) {
  assertions += 1;
  console.log(`  ✓ ${label}`);
}

function baseCapabilities(
  panels: "available" | "unavailable" | "reserved",
): WorkspaceCapabilityActivationMap {
  return {
    navigation: "available",
    discovery: "available",
    search: "available",
    filters: "available",
    panels,
    "workspace-density": "unavailable",
    inspector: "unavailable",
    selection: "unavailable",
    "workspace-memory": "reserved",
    "contextual-assistance": "reserved",
    "professional-workspace": "reserved",
    "ai-collaboration": "reserved",
    extensions: "reserved",
  };
}

function resolveVector(
  fx: (typeof SURFACE_PRESENTATION_VECTORS)[number],
) {
  return resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: fx.mode,
    posture: fx.posture,
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
    landscapeCarveOut: fx.landscapeCarveOut,
    heightDemoted: fx.heightDemoted,
    capabilities: baseCapabilities(fx.panels),
  });
}

begin("resolver contract constants");
{
  assert.equal(WORKSPACE_SURFACE_PRESENTATION.phase, "1b.5.2");
  assert.equal(
    WORKSPACE_SURFACE_PRESENTATION.contractId,
    "wx-surface-presentation-resolver-v1",
  );
  assert.equal(WORKSPACE_SURFACE_PRESENTATION.contractVersion, "1.0.0");
  assert.equal(WORKSPACE_SURFACE_PRESENTATION.drivesChrome, false);
  assert.equal(WORKSPACE_SURFACE_PRESENTATION.visualActivationAuthorized, false);
  assert.equal(WORKSPACE_SURFACE_PRESENTATION.diagnosticsOnly, true);
  assert.equal(WORKSPACE_SURFACE_PRESENTATION.neverRemount, true);
  assert.equal(WORKSPACE_SURFACE_PRESENTATION.neverTransferOwnership, true);
  ok("sealed resolver contract + non-driving flags");
}

begin("every registered surface covered by priority order fixture");
{
  assert.deepEqual([...EXPECTED_PRIORITY_ORDER].sort(), [...WORKSPACE_SURFACE_IDS].sort());
  assert.equal(EXPECTED_PRIORITY_ORDER.length, 12);
  ok("12 sealed surfaces in explicit priority fixture");
}

begin("Mode × posture presentation vectors");
{
  for (const fx of SURFACE_PRESENTATION_VECTORS) {
    vectors += 1;
    const plan = resolveVector(fx);
    assert.equal(plan.status, "ok", fx.id);
    assert.equal(plan.mode, fx.mode, fx.id);
    assert.equal(plan.posture, fx.posture, fx.id);
    assert.equal(plan.maxAssistPersistent, fx.maxAssistPersistent, fx.id);
    assert.deepEqual([...plan.orderedSurfaceIds], [...EXPECTED_PRIORITY_ORDER], fx.id);
    priorityAssertions += 1;
    for (const id of WORKSPACE_SURFACE_IDS) {
      assert.equal(
        plan.entryById[id].presentationState,
        fx.states[id],
        `${fx.id}:${id}`,
      );
      eligibilityAssertions += 1;
    }
    assert.deepEqual([...plan.eligibleSurfaceIds], [...fx.eligibleOrdered], fx.id);
    for (const id of RESERVED_SURFACE_IDS) {
      assert.equal(plan.entryById[id].presentationState, "reserved-blocked", fx.id);
      assert.equal(plan.entryById[id].eligible, false, fx.id);
      reservedAssertions += 1;
    }
  }
  ok(
    `${SURFACE_PRESENTATION_VECTORS.length} vectors × 12 surfaces + reserved seals`,
  );
}

begin("capability states — available / unavailable / reserved for panels");
{
  const modes = [
    "browse",
    "compact-workspace",
    "hybrid-workspace",
    "full-workspace",
    "professional-workspace",
  ] as const;
  for (const mode of modes) {
    for (const panels of ["available", "unavailable", "reserved"] as const) {
      vectors += 1;
      const carve = mode === "compact-workspace" && panels === "available";
      const plan = resolveSurfacePresentation({
        registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
        registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
        capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
        mode,
        posture: carve ? "landscape" : "portrait",
        usableWidthPx: mode === "browse" ? 390 : 1280,
        usableHeightPx: 800,
        landscapeCarveOut: carve,
        capabilities: baseCapabilities(panels),
      });
      const max = maxAssistPersistentForMode(mode, panels === "available", carve);
      assert.equal(plan.maxAssistPersistent, max, `${mode}:${panels}`);
      if (panels !== "available") {
        assert.equal(plan.entryById["assist-primary"].eligible, false);
        assert.equal(plan.entryById["assist-secondary"].eligible, false);
        eligibilityAssertions += 2;
      }
    }
  }
  ok("panels capability × Mode assist caps");
}

begin("stable prioritised ordering + explicit tie-break");
{
  assert.equal(compareSurfacePriority({ priorityRank: 1, registryIndex: 0 }, { priorityRank: 2, registryIndex: 0 }), -1);
  assert.equal(compareSurfacePriority({ priorityRank: 2, registryIndex: 1 }, { priorityRank: 2, registryIndex: 2 }), -1);
  assert.equal(compareSurfacePriority({ priorityRank: 2, registryIndex: 2 }, { priorityRank: 2, registryIndex: 1 }), 1);
  // orientation before command at same rank
  assert.ok(
    EXPECTED_PRIORITY_ORDER.indexOf("orientation") <
      EXPECTED_PRIORITY_ORDER.indexOf("command"),
  );
  priorityAssertions += 3;
  ok("tie-break: priorityRank then registry index");
}

begin("identical-input repeatability");
{
  const a = resolveVector(SURFACE_PRESENTATION_VECTORS[0]!);
  const b = resolveVector(SURFACE_PRESENTATION_VECTORS[0]!);
  assert.equal(a.stabilityToken, b.stabilityToken);
  assert.deepEqual(
    serializeSurfacePresentationPlan(a),
    serializeSurfacePresentationPlan(b),
  );
  ok("identical input → identical token + serialization");
}

begin("input immutability");
{
  const caps = baseCapabilities("available");
  const frozenCaps = Object.freeze({ ...caps });
  const input = Object.freeze({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: "full-workspace" as const,
    posture: "landscape" as const,
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    capabilities: frozenCaps,
  });
  const before = JSON.stringify(input);
  resolveSurfacePresentation(input);
  assert.equal(JSON.stringify(input), before);
  ok("resolver does not mutate input");
}

begin("output immutability");
{
  const plan = resolveVector(SURFACE_PRESENTATION_VECTORS[6]!);
  assert.ok(Object.isFrozen(plan));
  assert.ok(Object.isFrozen(plan.entries[0]));
  const before = plan.mode;
  try {
    (plan as { mode: string }).mode = "browse";
  } catch {
    /* strict freeze may throw */
  }
  assert.equal(plan.mode, before);
  ok("plan and entries frozen");
}

begin("serialization stability");
{
  const plan = resolveVector(SURFACE_PRESENTATION_VECTORS[6]!);
  const s1 = JSON.stringify(serializeSurfacePresentationPlan(plan));
  const s2 = JSON.stringify(serializeSurfacePresentationPlan(plan));
  assert.equal(s1, s2);
  assert.match(s1, /wx-surface-presentation-resolver-v1/);
  ok("serializeSurfacePresentationPlan deterministic JSON");
}

begin("fail-closed — unknown surface");
{
  const surfaces = [
    ...listWorkspaceSurfaces(),
    {
      ...listWorkspaceSurfaces()[0]!,
      id: "not-a-surface" as never,
    },
  ];
  const plan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: "full-workspace",
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    capabilities: baseCapabilities("available"),
    surfaces: surfaces as never,
  });
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("unknown-surface"));
  assert.equal(plan.entryById["assist-primary"].eligible, false);
  failClosedAssertions += 1;
  ok("unknown surface → rejected fail-closed");
}

begin("fail-closed — duplicate surface");
{
  const base = listWorkspaceSurfaces();
  const surfaces = [...base, base[0]!];
  const plan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: "full-workspace",
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    capabilities: baseCapabilities("available"),
    surfaces,
  });
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("duplicate-surface"));
  failClosedAssertions += 1;
  ok("duplicate surface → rejected");
}

begin("fail-closed — registry-version mismatch");
{
  const plan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: "9.9.9",
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: "full-workspace",
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    capabilities: baseCapabilities("available"),
  });
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("registry-version-mismatch"));
  assert.equal(plan.entryById.stage.presentationState, "persistent");
  assert.equal(plan.entryById["assist-primary"].eligible, false);
  failClosedAssertions += 1;
  ok("registry version mismatch fail-closed");
}

begin("fail-closed — capability-contract mismatch");
{
  const plan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: "not-a-capability-contract",
    mode: "full-workspace",
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    capabilities: baseCapabilities("available"),
  });
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("capability-contract-mismatch"));
  failClosedAssertions += 1;
  ok("capability contract mismatch fail-closed");
}

begin("fail-closed — invalid Mode / posture / missing capability");
{
  const badMode = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: "not-a-mode" as never,
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    capabilities: baseCapabilities("available"),
  });
  assert.equal(badMode.status, "rejected");
  assert.ok(badMode.rejectionReasons.includes("invalid-mode"));

  const badPosture = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: "full-workspace",
    posture: "diagonal" as never,
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    capabilities: baseCapabilities("available"),
  });
  assert.equal(badPosture.status, "rejected");
  assert.ok(badPosture.rejectionReasons.includes("invalid-posture"));

  const missing = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: "full-workspace",
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    capabilities: null as never,
  });
  assert.equal(missing.status, "rejected");
  assert.ok(missing.rejectionReasons.includes("missing-capability-input"));
  failClosedAssertions += 3;
  ok("invalid mode/posture/missing capability fail-closed");
}

begin("reserved registry truth overrides malformed available capability");
{
  const caps = baseCapabilities("available");
  // Malformed: pretend reserved capabilities are available
  caps["workspace-memory"] = "available";
  caps["ai-collaboration"] = "available";
  caps.extensions = "available";
  const plan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: "professional-workspace",
    posture: "landscape",
    usableWidthPx: 1920,
    usableHeightPx: 1080,
    landscapeCarveOut: false,
    capabilities: caps,
  });
  for (const id of WORKSPACE_RESERVED_SURFACE_IDS) {
    assert.equal(plan.entryById[id].presentationState, "reserved-blocked");
    assert.equal(plan.entryById[id].eligible, false);
    reservedAssertions += 1;
  }
  ok("reserved surfaces stay blocked despite available capability spoof");
}

begin("progressive growth invariants");
{
  const browse = resolveVector(SURFACE_PRESENTATION_VECTORS[0]!);
  const compact = resolveVector(SURFACE_PRESENTATION_VECTORS[2]!);
  const hybrid = resolveVector(SURFACE_PRESENTATION_VECTORS[4]!);
  const full = resolveVector(SURFACE_PRESENTATION_VECTORS[6]!);
  const pro = resolveVector(SURFACE_PRESENTATION_VECTORS[8]!);
  assert.ok(browse.eligibleSurfaceIds.length <= compact.eligibleSurfaceIds.length);
  assert.ok(compact.maxAssistPersistent <= hybrid.maxAssistPersistent);
  assert.ok(hybrid.maxAssistPersistent <= full.maxAssistPersistent);
  assert.equal(full.maxAssistPersistent, pro.maxAssistPersistent);
  assert.equal(browse.entryById["assist-primary"].eligible, false);
  assert.equal(compact.entryById["assist-secondary"].eligible, false);
  assert.equal(hybrid.entryById["assist-secondary"].eligible, false);
  assert.equal(full.entryById["assist-secondary"].eligible, true);
  ok("Browse⊆Compact assists; Hybrid≤1; Full/Pro≤2");
}

begin("no visual-activation / ownership / remount authorization");
{
  const plan = resolveVector(SURFACE_PRESENTATION_VECTORS[8]!);
  assert.equal(plan.visualActivationAuthorized, false);
  assert.equal(plan.drivesChrome, false);
  assert.equal(plan.diagnosticsOnly, true);
  assert.equal(WORKSPACE_SURFACE_PRESENTATION.neverRemount, true);
  assert.equal(WORKSPACE_SURFACE_PRESENTATION.neverTransferOwnership, true);
  ok("plan never authorizes render / remount / ownership transfer");
}

begin("empty/minimal valid plan (browse)");
{
  const plan = resolveVector(SURFACE_PRESENTATION_VECTORS[0]!);
  assert.equal(plan.status, "ok");
  assert.deepEqual([...plan.eligibleSurfaceIds], ["stage", "orientation", "command"]);
  assert.ok(plan.reachableSurfaceIds.includes("tool"));
  assert.ok(plan.reachableSurfaceIds.includes("disclosure"));
  ok("minimal browse plan = core only");
}

begin("sealed registry size is supported contract size (12)");
{
  const plan = resolveVector(SURFACE_PRESENTATION_VECTORS[6]!);
  assert.equal(plan.entries.length, 12);
  assert.equal(listWorkspaceSurfaces().length, 12);
  ok("full sealed registry resolves (n=12)");
}

begin("module purity — no browser / React / timers");
{
  const src = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-surface-presentation.ts"),
    "utf8",
  );
  for (const pattern of SURFACE_PRESENTATION_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(src), false, String(pattern));
  }
  ok("resolver source free of forbidden runtime patterns");
}

begin("layout diagnostics expose plan without visual activation");
{
  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="1b\.5\.2"/);
  assert.match(layout, /resolveSurfacePresentationFromPlans/);
  assert.match(layout, /data-wx-presentation=/);
  assert.match(layout, /data-wx-presentation-version=/);
  assert.match(layout, /data-wx-presentation-token=/);
  assert.match(layout, /data-wx-presentation-drives-chrome="0"/);
  assert.match(layout, /data-wx-presentation-eligible=/);
  assert.match(layout, /data-wx-cap-visual-activation="0"/);
  assert.equal(/key=\{[^}]*presentation/i.test(layout), false);
  ok("layout binds plan diagnostics; drives-chrome=0; no presentation keys");
}

begin("capability framework still resolvable alongside presentation");
{
  const cap = resolveWorkspaceCapabilities({
    mode: "full-workspace",
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
  });
  const plan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: cap.contractId,
    mode: cap.mode,
    posture: cap.posture,
    usableWidthPx: cap.usableWidthPx,
    usableHeightPx: cap.usableHeightPx,
    landscapeCarveOut: cap.landscapeCarveOut,
    capabilities: cap.capabilities,
  });
  assert.equal(plan.status, "ok");
  assert.equal(plan.capabilityContractId, "wx-capability-activation-v1");
  ok("consumes capability plan without mutating framework");
}

console.log(
  `\n[surface-presentation-1b5.2] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
    vectors,
    eligibilityAssertions,
    priorityAssertions,
    reservedAssertions,
    failClosedAssertions,
    surfaces: WORKSPACE_SURFACE_IDS.length,
    fixtureVectors: SURFACE_PRESENTATION_VECTORS.length,
  })}`,
);
console.log(
  `[surface-presentation-1b5.2] ${assertions} assertions across ${groups.length} groups`,
);

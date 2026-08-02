/**
 * WX Phase 1B.5.3 — Assist Surface Eligibility Resolver contract tests.
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
  WORKSPACE_ASSIST_ELIGIBILITY,
  ASSIST_ELIGIBILITY_FORBIDDEN_SOURCE_PATTERNS,
  isAssistRenderAuthorized,
  resolveAssistEligibility,
  resolveAssistEligibilityFromPlans,
  serializeAssistEligibilityPlan,
  type AssistSurfaceId,
} from "../resolve-assist-eligibility";
import { resolveWorkspaceMode } from "../resolve-workspace-mode";
import {
  WORKSPACE_SURFACE_PRESENTATION,
  resolveSurfacePresentation,
  resolveSurfacePresentationFromPlans,
} from "../resolve-surface-presentation";
import { WORKSPACE_SURFACE_REGISTRY } from "../workspace-surface-registry";
import {
  ASSIST_ELIGIBILITY_VECTORS,
  ASSIST_IDS,
} from "./fixtures/assist-eligibility-vectors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

const groups: string[] = [];
let assertions = 0;
let vectors = 0;
let eligibilityAssertions = 0;
let failClosedAssertions = 0;
let hollowBanAssertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[assist-eligibility-1b5.3] ${name}`);
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

function resolveVector(fx: (typeof ASSIST_ELIGIBILITY_VECTORS)[number]) {
  const presentationPlan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: fx.mode,
    posture: fx.posture,
    usableWidthPx: fx.usableWidthPx,
    usableHeightPx: fx.usableHeightPx,
    landscapeCarveOut: fx.landscapeCarveOut,
    capabilities: baseCapabilities(fx.panels),
  });
  return resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
}

begin("resolver contract constants");
{
  assert.equal(WORKSPACE_ASSIST_ELIGIBILITY.phase, "1b.5.3");
  assert.equal(
    WORKSPACE_ASSIST_ELIGIBILITY.contractId,
    "wx-assist-surface-eligibility-v1",
  );
  assert.equal(WORKSPACE_ASSIST_ELIGIBILITY.contractVersion, "1.0.0");
  assert.deepEqual(
    [...WORKSPACE_ASSIST_ELIGIBILITY.assistSurfaceIds],
    [...ASSIST_IDS],
  );
  assert.equal(WORKSPACE_ASSIST_ELIGIBILITY.drivesChrome, false);
  assert.equal(WORKSPACE_ASSIST_ELIGIBILITY.rendersAssist, false);
  assert.equal(WORKSPACE_ASSIST_ELIGIBILITY.visualActivationAuthorized, false);
  assert.equal(WORKSPACE_ASSIST_ELIGIBILITY.diagnosticsOnly, true);
  assert.equal(WORKSPACE_ASSIST_ELIGIBILITY.hollowPermanentAssistsForbidden, true);
  assert.equal(WORKSPACE_ASSIST_ELIGIBILITY.neverRemount, true);
  assert.equal(WORKSPACE_ASSIST_ELIGIBILITY.neverTransferOwnership, true);
  ok("sealed resolver contract + non-driving flags");
}

begin("Mode × posture eligibility vectors");
{
  for (const fx of ASSIST_ELIGIBILITY_VECTORS) {
    vectors += 1;
    const plan = resolveVector(fx);
    assert.equal(plan.status, "ok", fx.id);
    assert.equal(plan.mode, fx.mode, fx.id);
    assert.equal(plan.posture, fx.posture, fx.id);
    for (const id of ASSIST_IDS) {
      assert.equal(
        plan.entryById[id].eligibilityState,
        fx.expect[id],
        `${fx.id}:${id}`,
      );
      eligibilityAssertions += 1;
    }
  }
  ok(
    `${ASSIST_ELIGIBILITY_VECTORS.length} vectors × ${ASSIST_IDS.length} assists`,
  );
}

begin("fail-closed — unknown assist surface");
{
  const presentationPlan = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  const plan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
    assistSurfaceIds: ["assist-primary", "assist-secondary", "not-an-assist"],
  });
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("unknown-assist-surface"));
  for (const id of ASSIST_IDS) {
    assert.equal(plan.entryById[id].eligibilityState, "ineligible");
  }
  failClosedAssertions += 1;
  ok("unknown assist → rejected fail-closed");
}

begin("fail-closed — duplicate assist surface");
{
  const presentationPlan = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  const plan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
    assistSurfaceIds: ["assist-primary", "assist-primary"],
  });
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("duplicate-assist-surface"));
  failClosedAssertions += 1;
  ok("duplicate assist → rejected");
}

begin("fail-closed — registry-version mismatch");
{
  const presentationPlan = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  const plan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: "9.9.9",
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("registry-version-mismatch"));
  assert.equal(plan.entryById["assist-primary"].eligibilityState, "ineligible");
  failClosedAssertions += 1;
  ok("registry version mismatch fail-closed");
}

begin("fail-closed — capability-contract mismatch");
{
  const presentationPlan = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  const plan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: "not-a-capability-contract",
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("capability-contract-mismatch"));
  failClosedAssertions += 1;
  ok("capability contract mismatch fail-closed");
}

begin("fail-closed — presentation contract / version mismatch");
{
  const presentationPlan = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  const badContract = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: "not-a-presentation-contract",
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  assert.equal(badContract.status, "rejected");
  assert.ok(badContract.rejectionReasons.includes("presentation-contract-mismatch"));

  const badVersion = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: "9.9.9",
    presentationPlan,
  });
  assert.equal(badVersion.status, "rejected");
  assert.ok(badVersion.rejectionReasons.includes("presentation-version-mismatch"));
  failClosedAssertions += 2;
  ok("presentation contract/version mismatch fail-closed");
}

begin("fail-closed — presentation plan rejected");
{
  const rejectedPresentation = resolveSurfacePresentation({
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
  assert.equal(rejectedPresentation.status, "rejected");
  const plan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan: rejectedPresentation,
  });
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("presentation-plan-rejected"));
  for (const id of ASSIST_IDS) {
    assert.equal(plan.entryById[id].eligibilityState, "ineligible");
    assert.equal(plan.entryById[id].eligibilityReason, "presentation-plan-rejected");
  }
  failClosedAssertions += 1;
  ok("rejected presentation plan → ineligible assists");
}

begin("identical-input repeatability");
{
  const a = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  const b = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  assert.equal(a.stabilityToken, b.stabilityToken);
  assert.deepEqual(
    serializeAssistEligibilityPlan(a),
    serializeAssistEligibilityPlan(b),
  );
  ok("identical input → identical token + serialization");
}

begin("input immutability");
{
  const presentationPlan = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  const frozenPresentation = Object.freeze({ ...presentationPlan });
  const input = Object.freeze({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan: frozenPresentation,
  });
  const before = JSON.stringify(input);
  resolveAssistEligibility(input);
  assert.equal(JSON.stringify(input), before);
  ok("resolver does not mutate input");
}

begin("output immutability");
{
  const plan = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
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
  const plan = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  const s1 = JSON.stringify(serializeAssistEligibilityPlan(plan));
  const s2 = JSON.stringify(serializeAssistEligibilityPlan(plan));
  assert.equal(s1, s2);
  assert.match(s1, /wx-assist-surface-eligibility-v1/);
  ok("serializeAssistEligibilityPlan deterministic JSON");
}

begin("no renderAuthorized true ever — hollow ban seals");
{
  for (const fx of ASSIST_ELIGIBILITY_VECTORS) {
    const plan = resolveVector(fx);
    for (const id of ASSIST_IDS) {
      assert.equal(plan.entryById[id].renderAuthorized, false, `${fx.id}:${id}`);
      assert.equal(isAssistRenderAuthorized(plan, id), false, `${fx.id}:${id}`);
      hollowBanAssertions += 1;
    }
    assert.equal(plan.rendersAssist, false);
    assert.equal(plan.visualActivationAuthorized, false);
    assert.equal(plan.drivesChrome, false);
  }
  const serialized = serializeAssistEligibilityPlan(
    resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!),
  );
  for (const entry of serialized.entries) {
    assert.equal(entry.renderAuthorized, false);
    hollowBanAssertions += 1;
  }
  ok("renderAuthorized always false; hollow ban holds");
}

begin("capacity-allowed assists are eligible not renderAuthorized");
{
  const full = resolveVector(ASSIST_ELIGIBILITY_VECTORS[4]!);
  for (const id of ASSIST_IDS) {
    assert.equal(full.entryById[id].eligibilityState, "eligible");
    assert.equal(full.entryById[id].planEligible, true);
    assert.equal(full.entryById[id].renderAuthorized, false);
    assert.equal(full.entryById[id].suppressionReason, "hollow-ban");
    hollowBanAssertions += 1;
  }
  ok("eligible capacity with hollow-ban suppression, not render auth");
}

begin("future-eligible secondary under Mode forbids");
{
  const hybrid = resolveVector(ASSIST_ELIGIBILITY_VECTORS[3]!);
  assert.equal(hybrid.entryById["assist-primary"].eligibilityState, "eligible");
  assert.equal(
    hybrid.entryById["assist-secondary"].eligibilityState,
    "future-eligible",
  );
  assert.equal(
    hybrid.entryById["assist-secondary"].eligibilityReason,
    "higher-mode-capacity",
  );
  ok("Hybrid secondary future-eligible when Mode caps at 1");
}

begin("module purity — no browser / React / timers");
{
  const src = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-assist-eligibility.ts"),
    "utf8",
  );
  for (const pattern of ASSIST_ELIGIBILITY_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(src), false, String(pattern));
  }
  ok("resolver source free of forbidden runtime patterns");
}

begin("layout diagnostics expose eligibility without visual activation");
{
  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="1b\.5\.3"/);
  assert.match(layout, /resolveAssistEligibilityFromPlans/);
  assert.match(layout, /data-wx-assist-eligibility=/);
  assert.match(layout, /data-wx-assist-eligibility-version=/);
  assert.match(layout, /data-wx-assist-eligibility-token=/);
  assert.match(layout, /data-wx-assist-drives-chrome="0"/);
  assert.match(layout, /data-wx-assist-renders="0"/);
  assert.match(layout, /data-wx-cap-visual-activation="0"/);
  assert.match(layout, /data-wx-assist-ids=/);
  assert.match(layout, /data-wx-assist-eligible=/);
  assert.equal(/key=\{[^}]*assist/i.test(layout), false);
  assert.equal(/key=\{[^}]*eligibility/i.test(layout), false);
  assert.equal(/key=\{[^}]*presentation/i.test(layout), false);
  ok("layout binds eligibility diagnostics; drives-chrome=0; no assist keys");
}

begin("resolveAssistEligibilityFromPlans integration");
{
  const modePlan = resolveWorkspaceMode({
    widthPx: 1280,
    heightPx: 800,
  });
  const capabilityPlan = resolveWorkspaceCapabilities({
    mode: modePlan.mode,
    posture: modePlan.posture,
    usableWidthPx: modePlan.usableWidthPx,
    usableHeightPx: modePlan.usableHeightPx,
  });
  const presentationPlan = resolveSurfacePresentationFromPlans(
    modePlan,
    capabilityPlan,
  );
  const plan = resolveAssistEligibilityFromPlans(modePlan, capabilityPlan);
  assert.equal(plan.status, "ok");
  assert.equal(presentationPlan.status, "ok");
  assert.equal(plan.presentationContractId, WORKSPACE_SURFACE_PRESENTATION.contractId);
  assert.equal(plan.capabilityContractId, WORKSPACE_CAPABILITY_FRAMEWORK.contractId);
  assert.deepEqual([...plan.orderedAssistIds], [...ASSIST_IDS] as AssistSurfaceId[]);
  ok("consumes mode+capability+presentation plans without mutation");
}

console.log(
  `\n[assist-eligibility-1b5.3] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
    vectors,
    eligibilityAssertions,
    failClosedAssertions,
    hollowBanAssertions,
    assists: ASSIST_IDS.length,
    fixtureVectors: ASSIST_ELIGIBILITY_VECTORS.length,
  })}`,
);
console.log(
  `[assist-eligibility-1b5.3] ${assertions} assertions across ${groups.length} groups`,
);

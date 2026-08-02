/**
 * WX Phase 1B.5.4 — Progressive Disclosure Continuity contract tests.
 *
 * Expectations from independently authored fixtures — not mirrored algorithms.
 * Does NOT claim browser mount observation.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  WORKSPACE_ASSIST_ELIGIBILITY,
  resolveAssistEligibility,
} from "../resolve-assist-eligibility";
import {
  WORKSPACE_PROGRESSIVE_DISCLOSURE,
  PROGRESSIVE_DISCLOSURE_FORBIDDEN_SOURCE_PATTERNS,
  isProgressiveRenderAuthorized,
  resolveProgressiveDisclosure,
  resolveProgressiveDisclosureFromPlans,
  serializeProgressiveDisclosurePlan,
} from "../resolve-progressive-disclosure";
import {
  WORKSPACE_SURFACE_PRESENTATION,
  resolveSurfacePresentation,
} from "../resolve-surface-presentation";
import {
  WORKSPACE_CAPABILITY_FRAMEWORK,
  resolveWorkspaceCapabilities,
  type WorkspaceCapabilityActivationMap,
} from "../resolve-workspace-capabilities";
import { resolveWorkspaceMode } from "../resolve-workspace-mode";
import { WORKSPACE_SURFACE_REGISTRY } from "../workspace-surface-registry";
import {
  PROGRESSIVE_DISCLOSURE_VECTORS,
  PROGRESSIVE_IDS,
} from "./fixtures/progressive-disclosure-vectors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

const groups: string[] = [];
let assertions = 0;
let vectors = 0;
let disclosureAssertions = 0;
let failClosedAssertions = 0;
let renderBanAssertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[progressive-disclosure-1b5.4] ${name}`);
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

function resolveVector(fx: (typeof PROGRESSIVE_DISCLOSURE_VECTORS)[number]) {
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
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  return resolveProgressiveDisclosure({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    eligibilityContractId: WORKSPACE_ASSIST_ELIGIBILITY.contractId,
    eligibilityContractVersion: WORKSPACE_ASSIST_ELIGIBILITY.contractVersion,
    presentationPlan,
    assistEligibilityPlan,
  });
}

function progressiveInput(
  presentationPlan: ReturnType<typeof resolveSurfacePresentation>,
  assistEligibilityPlan: ReturnType<typeof resolveAssistEligibility>,
  overrides: Partial<Parameters<typeof resolveProgressiveDisclosure>[0]> = {},
) {
  return {
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    eligibilityContractId: WORKSPACE_ASSIST_ELIGIBILITY.contractId,
    eligibilityContractVersion: WORKSPACE_ASSIST_ELIGIBILITY.contractVersion,
    presentationPlan,
    assistEligibilityPlan,
    ...overrides,
  };
}

begin("resolver contract constants");
{
  assert.equal(WORKSPACE_PROGRESSIVE_DISCLOSURE.phase, "1b.5.4");
  assert.equal(
    WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    "wx-progressive-disclosure-v1",
  );
  assert.equal(WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion, "1.0.0");
  assert.deepEqual(
    [...WORKSPACE_PROGRESSIVE_DISCLOSURE.progressiveSurfaceIds],
    [...PROGRESSIVE_IDS],
  );
  assert.equal(WORKSPACE_PROGRESSIVE_DISCLOSURE.drivesChrome, false);
  assert.equal(WORKSPACE_PROGRESSIVE_DISCLOSURE.rendersDisclosure, false);
  assert.equal(
    WORKSPACE_PROGRESSIVE_DISCLOSURE.visualActivationAuthorized,
    false,
  );
  assert.equal(WORKSPACE_PROGRESSIVE_DISCLOSURE.diagnosticsOnly, true);
  assert.equal(WORKSPACE_PROGRESSIVE_DISCLOSURE.disclosureUiAuthorized, false);
  assert.equal(WORKSPACE_PROGRESSIVE_DISCLOSURE.neverRemount, true);
  assert.equal(WORKSPACE_PROGRESSIVE_DISCLOSURE.neverTransferOwnership, true);
  ok("sealed resolver contract + non-driving flags");
}

begin("Mode × posture disclosure vectors");
{
  for (const fx of PROGRESSIVE_DISCLOSURE_VECTORS) {
    vectors += 1;
    const plan = resolveVector(fx);
    assert.equal(plan.status, "ok", fx.id);
    assert.equal(plan.mode, fx.mode, fx.id);
    assert.equal(plan.posture, fx.posture, fx.id);
    for (const id of PROGRESSIVE_IDS) {
      assert.equal(
        plan.entryById[id].disclosureState,
        fx.expect[id],
        `${fx.id}:${id}`,
      );
      assert.equal(plan.entryById[id].renderAuthorized, false, `${fx.id}:${id}`);
      disclosureAssertions += 1;
    }
    assert.equal(plan.rendersDisclosure, false);
    assert.equal(plan.drivesChrome, false);
  }
  ok(
    `${PROGRESSIVE_DISCLOSURE_VECTORS.length} vectors × ${PROGRESSIVE_IDS.length} surfaces`,
  );
}

begin("serialization round-trip");
{
  const plan = resolveVector(PROGRESSIVE_DISCLOSURE_VECTORS[0]!);
  const serialized = serializeProgressiveDisclosurePlan(plan);
  for (const id of PROGRESSIVE_IDS) {
    const entry = serialized.entries.find((e) => e.surfaceId === id);
    assert.ok(entry);
    assert.equal(entry.disclosureState, plan.entryById[id].disclosureState);
    assert.equal(entry.renderAuthorized, false);
  }
  const s1 = JSON.stringify(serialized);
  const s2 = JSON.stringify(serializeProgressiveDisclosurePlan(plan));
  assert.equal(s1, s2);
  assert.match(s1, /wx-progressive-disclosure-v1/);
  assert.ok(Object.isFrozen(plan));
  assert.ok(Object.isFrozen(plan.entries[0]));
  const before = plan.mode;
  try {
    (plan as { mode: string }).mode = "browse";
  } catch {
    /* strict freeze may throw */
  }
  assert.equal(plan.mode, before);
  ok("serialize keeps states; JSON stable; plan frozen");
}

begin("determinism");
{
  const a = resolveVector(PROGRESSIVE_DISCLOSURE_VECTORS[4]!);
  const b = resolveVector(PROGRESSIVE_DISCLOSURE_VECTORS[4]!);
  assert.equal(a.stabilityToken, b.stabilityToken);
  assert.deepEqual(
    serializeProgressiveDisclosurePlan(a),
    serializeProgressiveDisclosurePlan(b),
  );
  ok("identical input → identical stabilityToken + serialization");
}

begin("ordering");
{
  const plan = resolveVector(PROGRESSIVE_DISCLOSURE_VECTORS[4]!);
  const ranks = plan.orderedSurfaceIds.map(
    (id) => plan.entryById[id].diagnostics.priorityRank,
  );
  for (let i = 1; i < ranks.length; i += 1) {
    assert.ok(ranks[i]! >= ranks[i - 1]!, "priorityRank ascending");
  }
  assert.deepEqual(
    [...plan.orderedSurfaceIds],
    [...plan.entries.map((e) => e.surfaceId)],
  );
  ok("orderedSurfaceIds sorted by priorityRank ascending");
}

begin("fail-closed — unknown progressive surface");
{
  const presentationPlan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.mode,
    posture: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.posture,
    usableWidthPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableWidthPx,
    usableHeightPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableHeightPx,
    landscapeCarveOut: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.landscapeCarveOut,
    capabilities: baseCapabilities(PROGRESSIVE_DISCLOSURE_VECTORS[4]!.panels),
  });
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  const plan = resolveProgressiveDisclosure(
    progressiveInput(presentationPlan, assistEligibilityPlan, {
      progressiveSurfaceIds: [
        "assist-primary",
        "assist-secondary",
        "tool",
        "disclosure",
        "not-progressive",
      ],
    }),
  );
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("unknown-progressive-surface"));
  for (const id of PROGRESSIVE_IDS) {
    assert.equal(plan.entryById[id].disclosureState, "suppressed");
    assert.equal(plan.entryById[id].renderAuthorized, false);
  }
  failClosedAssertions += 1;
  ok("unknown progressive id → rejected fail-closed");
}

begin("fail-closed — duplicate progressive surface");
{
  const presentationPlan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.mode,
    posture: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.posture,
    usableWidthPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableWidthPx,
    usableHeightPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableHeightPx,
    landscapeCarveOut: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.landscapeCarveOut,
    capabilities: baseCapabilities(PROGRESSIVE_DISCLOSURE_VECTORS[4]!.panels),
  });
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  const plan = resolveProgressiveDisclosure(
    progressiveInput(presentationPlan, assistEligibilityPlan, {
      progressiveSurfaceIds: ["assist-primary", "assist-primary"],
    }),
  );
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("duplicate-progressive-surface"));
  for (const id of PROGRESSIVE_IDS) {
    assert.equal(plan.entryById[id].disclosureState, "suppressed");
    assert.equal(plan.entryById[id].renderAuthorized, false);
  }
  failClosedAssertions += 1;
  ok("duplicate progressive id → rejected");
}

begin("fail-closed — registry-version mismatch");
{
  const presentationPlan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.mode,
    posture: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.posture,
    usableWidthPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableWidthPx,
    usableHeightPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableHeightPx,
    landscapeCarveOut: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.landscapeCarveOut,
    capabilities: baseCapabilities(PROGRESSIVE_DISCLOSURE_VECTORS[4]!.panels),
  });
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  const plan = resolveProgressiveDisclosure(
    progressiveInput(presentationPlan, assistEligibilityPlan, {
      registryContractVersion: "9.9.9",
    }),
  );
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("registry-version-mismatch"));
  for (const id of PROGRESSIVE_IDS) {
    assert.equal(plan.entryById[id].disclosureState, "suppressed");
    assert.equal(plan.entryById[id].renderAuthorized, false);
  }
  failClosedAssertions += 1;
  ok("registry version mismatch fail-closed");
}

begin("fail-closed — capability-contract mismatch");
{
  const presentationPlan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.mode,
    posture: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.posture,
    usableWidthPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableWidthPx,
    usableHeightPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableHeightPx,
    landscapeCarveOut: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.landscapeCarveOut,
    capabilities: baseCapabilities(PROGRESSIVE_DISCLOSURE_VECTORS[4]!.panels),
  });
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  const plan = resolveProgressiveDisclosure(
    progressiveInput(presentationPlan, assistEligibilityPlan, {
      capabilityContractId: "not-a-capability-contract",
    }),
  );
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("capability-contract-mismatch"));
  for (const id of PROGRESSIVE_IDS) {
    assert.equal(plan.entryById[id].disclosureState, "suppressed");
    assert.equal(plan.entryById[id].renderAuthorized, false);
  }
  failClosedAssertions += 1;
  ok("capability contract mismatch fail-closed");
}

begin("fail-closed — presentation contract / version mismatch");
{
  const presentationPlan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.mode,
    posture: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.posture,
    usableWidthPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableWidthPx,
    usableHeightPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableHeightPx,
    landscapeCarveOut: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.landscapeCarveOut,
    capabilities: baseCapabilities(PROGRESSIVE_DISCLOSURE_VECTORS[4]!.panels),
  });
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  const badContract = resolveProgressiveDisclosure(
    progressiveInput(presentationPlan, assistEligibilityPlan, {
      presentationContractId: "not-a-presentation-contract",
    }),
  );
  assert.equal(badContract.status, "rejected");
  assert.ok(
    badContract.rejectionReasons.includes("presentation-contract-mismatch"),
  );

  const badVersion = resolveProgressiveDisclosure(
    progressiveInput(presentationPlan, assistEligibilityPlan, {
      presentationContractVersion: "9.9.9",
    }),
  );
  assert.equal(badVersion.status, "rejected");
  assert.ok(badVersion.rejectionReasons.includes("presentation-version-mismatch"));
  for (const id of PROGRESSIVE_IDS) {
    assert.equal(badContract.entryById[id].disclosureState, "suppressed");
    assert.equal(badVersion.entryById[id].renderAuthorized, false);
  }
  failClosedAssertions += 2;
  ok("presentation contract/version mismatch fail-closed");
}

begin("fail-closed — eligibility contract / version mismatch");
{
  const presentationPlan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.mode,
    posture: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.posture,
    usableWidthPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableWidthPx,
    usableHeightPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableHeightPx,
    landscapeCarveOut: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.landscapeCarveOut,
    capabilities: baseCapabilities(PROGRESSIVE_DISCLOSURE_VECTORS[4]!.panels),
  });
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  const badContract = resolveProgressiveDisclosure(
    progressiveInput(presentationPlan, assistEligibilityPlan, {
      eligibilityContractId: "not-an-eligibility-contract",
    }),
  );
  assert.equal(badContract.status, "rejected");
  assert.ok(
    badContract.rejectionReasons.includes("eligibility-contract-mismatch"),
  );

  const badVersion = resolveProgressiveDisclosure(
    progressiveInput(presentationPlan, assistEligibilityPlan, {
      eligibilityContractVersion: "9.9.9",
    }),
  );
  assert.equal(badVersion.status, "rejected");
  assert.ok(badVersion.rejectionReasons.includes("eligibility-version-mismatch"));
  for (const id of PROGRESSIVE_IDS) {
    assert.equal(badContract.entryById[id].disclosureState, "suppressed");
    assert.equal(badVersion.entryById[id].renderAuthorized, false);
  }
  failClosedAssertions += 2;
  ok("eligibility contract/version mismatch fail-closed");
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
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan: rejectedPresentation,
  });
  const plan = resolveProgressiveDisclosure(
    progressiveInput(rejectedPresentation, assistEligibilityPlan),
  );
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("presentation-plan-rejected"));
  for (const id of PROGRESSIVE_IDS) {
    assert.equal(plan.entryById[id].disclosureState, "suppressed");
    assert.equal(plan.entryById[id].renderAuthorized, false);
  }
  failClosedAssertions += 1;
  ok("rejected presentation plan → suppressed disclosures");
}

begin("fail-closed — eligibility plan rejected");
{
  const presentationPlan = resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.mode,
    posture: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.posture,
    usableWidthPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableWidthPx,
    usableHeightPx: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.usableHeightPx,
    landscapeCarveOut: PROGRESSIVE_DISCLOSURE_VECTORS[4]!.landscapeCarveOut,
    capabilities: baseCapabilities(PROGRESSIVE_DISCLOSURE_VECTORS[4]!.panels),
  });
  const rejectedEligibility = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: "9.9.9",
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  assert.equal(rejectedEligibility.status, "rejected");
  const plan = resolveProgressiveDisclosure(
    progressiveInput(presentationPlan, rejectedEligibility),
  );
  assert.equal(plan.status, "rejected");
  assert.ok(plan.rejectionReasons.includes("eligibility-plan-rejected"));
  for (const id of PROGRESSIVE_IDS) {
    assert.equal(plan.entryById[id].disclosureState, "suppressed");
    assert.equal(plan.entryById[id].renderAuthorized, false);
  }
  failClosedAssertions += 1;
  ok("rejected eligibility plan → suppressed disclosures");
}

begin("isProgressiveRenderAuthorized always false for all ids on ok plan");
{
  for (const fx of PROGRESSIVE_DISCLOSURE_VECTORS) {
    const plan = resolveVector(fx);
    assert.equal(plan.status, "ok");
    for (const id of PROGRESSIVE_IDS) {
      assert.equal(plan.entryById[id].renderAuthorized, false, `${fx.id}:${id}`);
      assert.equal(isProgressiveRenderAuthorized(plan, id), false, `${fx.id}:${id}`);
      renderBanAssertions += 1;
    }
    assert.equal(plan.rendersDisclosure, false);
    assert.equal(plan.drivesChrome, false);
  }
  const serialized = serializeProgressiveDisclosurePlan(
    resolveVector(PROGRESSIVE_DISCLOSURE_VECTORS[4]!),
  );
  for (const entry of serialized.entries) {
    assert.equal(entry.renderAuthorized, false);
    renderBanAssertions += 1;
  }
  ok("renderAuthorized always false; disclosure ban holds");
}

begin("forbidden source patterns");
{
  const raw = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-progressive-disclosure.ts"),
    "utf8",
  );
  const src = raw.replace(
    /export const PROGRESSIVE_DISCLOSURE_FORBIDDEN_SOURCE_PATTERNS = \[[\s\S]*?\] as const;/,
    "",
  );
  for (const pattern of PROGRESSIVE_DISCLOSURE_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(src.includes(pattern), false, pattern);
  }
  ok("resolver source free of forbidden runtime patterns");
}

begin("layout diagnostics expose disclosure without visual activation");
{
  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="1b\.5\.4"/);
  assert.match(layout, /resolveProgressiveDisclosureFromPlans/);
  assert.match(layout, /data-wx-disclosure=/);
  assert.match(layout, /data-wx-disclosure-renders="0"/);
  assert.match(layout, /data-wx-disclosure-drives-chrome="0"/);
  assert.match(layout, /data-wx-disclosure-version=/);
  assert.match(layout, /data-wx-disclosure-token=/);
  assert.match(layout, /data-wx-disclosure-ids=/);
  assert.match(layout, /data-wx-disclosure-hidden=/);
  assert.match(layout, /data-wx-disclosure-discoverable=/);
  assert.match(layout, /data-wx-disclosure-disclosed=/);
  assert.equal(/key=\{[^}]*disclosure/i.test(layout), false);
  ok("layout binds disclosure diagnostics; renders=0; drives-chrome=0");
}

begin("resolveProgressiveDisclosureFromPlans integration");
{
  const modePlan = resolveWorkspaceMode({
    widthPx: 390,
    heightPx: 844,
  });
  const capabilityPlan = resolveWorkspaceCapabilities({
    mode: modePlan.mode,
    posture: modePlan.posture,
    usableWidthPx: modePlan.usableWidthPx,
    usableHeightPx: modePlan.usableHeightPx,
  });
  const plan = resolveProgressiveDisclosureFromPlans(modePlan, capabilityPlan);
  assert.equal(plan.status, "ok");
  assert.equal(plan.mode, "browse");
  assert.equal(plan.entryById["tool"].disclosureState, "disclosed");
  assert.equal(plan.entryById["disclosure"].disclosureState, "discoverable");
  assert.equal(plan.presentationContractId, WORKSPACE_SURFACE_PRESENTATION.contractId);
  assert.equal(plan.eligibilityContractId, WORKSPACE_ASSIST_ELIGIBILITY.contractId);
  assert.equal(plan.orderedSurfaceIds.length, PROGRESSIVE_IDS.length);
  ok("390×844 browse → tool disclosed + disclosure discoverable");
}

console.log(
  `\n[progressive-disclosure-1b5.4] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
    vectors,
    disclosureAssertions,
    failClosedAssertions,
    renderBanAssertions,
    progressiveSurfaces: PROGRESSIVE_IDS.length,
    fixtureVectors: PROGRESSIVE_DISCLOSURE_VECTORS.length,
  })}`,
);
console.log(
  `[progressive-disclosure-1b5.4] ${assertions} assertions across ${groups.length} groups`,
);

/**
 * WX Phase 1B.3 — Capability Activation Framework tests.
 *
 * Expectations from independently authored fixtures — not mirrored algorithms.
 * This suite does NOT claim browser mount observation.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CAPABILITY_FORBIDDEN_SOURCE_PATTERNS,
  WORKSPACE_CAPABILITY_FRAMEWORK,
  WORKSPACE_CAPABILITY_IDS,
  WORKSPACE_RESERVED_CAPABILITY_IDS,
  getWorkspaceCapabilityState,
  isWorkspaceCapabilityAvailable,
  resolveWorkspaceCapabilities,
  resolveWorkspaceCapabilitiesFromAvailableSpace,
  resolveWorkspaceCapabilitiesFromModePlan,
} from "../resolve-workspace-capabilities";
import { resolveWorkspaceMode } from "../resolve-workspace-mode";
import {
  CAPABILITY_ACTIVATION_VECTORS,
  CAPABILITY_RESERVED_IDS,
} from "./fixtures/capability-activation-vectors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

const groups: string[] = [];
let assertions = 0;
let vectors = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[capability-framework] ${name}`);
}

function ok(label: string) {
  assertions += 1;
  console.log(`  ✓ ${label}`);
}

begin("framework contract constants");
{
  assert.equal(WORKSPACE_CAPABILITY_FRAMEWORK.phase, "1b.3");
  assert.equal(
    WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    "wx-capability-activation-v1",
  );
  assert.equal(WORKSPACE_CAPABILITY_FRAMEWORK.visualActivationAuthorized, false);
  assert.equal(WORKSPACE_CAPABILITY_FRAMEWORK.diagnosticsOnly, true);
  assert.equal(WORKSPACE_CAPABILITY_FRAMEWORK.neverSelfActivate, true);
  assert.equal(WORKSPACE_CAPABILITY_IDS.length, 13);
  assert.deepEqual(
    [...WORKSPACE_RESERVED_CAPABILITY_IDS],
    [...CAPABILITY_RESERVED_IDS],
  );
  ok("sealed framework constants + 13 capability IDs");
}

begin("Mode × posture capability vectors");
{
  for (const fx of CAPABILITY_ACTIVATION_VECTORS) {
    vectors += 1;
    const plan = resolveWorkspaceCapabilities({
      mode: fx.mode,
      posture: fx.posture,
      usableWidthPx: fx.usableWidthPx,
      usableHeightPx: fx.usableHeightPx,
      landscapeCarveOut: fx.landscapeCarveOut,
    });
    assert.equal(plan.mode, fx.mode, fx.id);
    assert.equal(plan.posture, fx.posture, fx.id);
    assert.equal(plan.phase, "1b.3", fx.id);
    assert.equal(plan.contractId, "wx-capability-activation-v1", fx.id);
    for (const id of WORKSPACE_CAPABILITY_IDS) {
      assert.equal(
        plan.capabilities[id],
        fx.expected[id],
        `${fx.id}:${id}`,
      );
    }
    assert.equal(
      plan.availableCount + plan.unavailableCount + plan.reservedCount,
      WORKSPACE_CAPABILITY_IDS.length,
      fx.id,
    );
  }
  ok(`${CAPABILITY_ACTIVATION_VECTORS.length} Mode vectors match fixtures`);
}

begin("reserved capabilities never available");
{
  for (const fx of CAPABILITY_ACTIVATION_VECTORS) {
    const plan = resolveWorkspaceCapabilities({
      mode: fx.mode,
      posture: fx.posture,
      usableWidthPx: fx.usableWidthPx,
      usableHeightPx: fx.usableHeightPx,
      landscapeCarveOut: fx.landscapeCarveOut,
    });
    for (const id of WORKSPACE_RESERVED_CAPABILITY_IDS) {
      assert.equal(plan.capabilities[id], "reserved", `${fx.id}:${id}`);
      assert.equal(isWorkspaceCapabilityAvailable(plan, id), false);
    }
  }
  ok("all reserved IDs stay reserved across Modes");
}

begin("AvailableSpace → Mode → capabilities path");
{
  const fromSpace = resolveWorkspaceCapabilitiesFromAvailableSpace({
    usableWidthPx: 1280,
    usableHeightPx: 800,
  });
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: 1280,
    usableHeightPx: 800,
  });
  const fromMode = resolveWorkspaceCapabilitiesFromModePlan(modePlan);
  assert.deepEqual(fromSpace.capabilities, fromMode.capabilities);
  assert.equal(fromSpace.mode, "full-workspace");
  assert.equal(fromSpace.capabilities.panels, "available");
  assert.equal(fromSpace.capabilities["ai-collaboration"], "reserved");
  ok("AvailableSpace path matches Mode-plan path");
}

begin("invalid / impossible input fail-closed");
{
  const bad = resolveWorkspaceCapabilities({
    // @ts-expect-error intentional invalid mode for runtime fail-closed
    mode: "not-a-mode",
    posture: "portrait",
    usableWidthPx: Number.NaN,
    usableHeightPx: -10,
  });
  assert.equal(bad.mode, "browse");
  assert.equal(bad.usableWidthPx, 0);
  assert.equal(bad.usableHeightPx, 0);
  assert.equal(bad.capabilities.panels, "unavailable");
  assert.equal(bad.capabilities.navigation, "available");
  ok("invalid Mode → browse fail-closed");
}

begin("determinism + input immutability");
{
  const input = {
    mode: "hybrid-workspace" as const,
    posture: "portrait" as const,
    usableWidthPx: 900,
    usableHeightPx: 700,
    landscapeCarveOut: false,
  };
  const snap = structuredClone(input);
  const a = resolveWorkspaceCapabilities(input);
  const b = resolveWorkspaceCapabilities(input);
  assert.deepEqual(a, b);
  assert.deepEqual(input, snap);
  assert.equal(
    getWorkspaceCapabilityState(a, "inspector"),
    "available",
  );
  ok("repeatable + immutable inputs");
}

begin("no visual activation / ownership side effects in source");
{
  const src = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-workspace-capabilities.ts"),
    "utf8",
  );
  for (const re of CAPABILITY_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(re.test(src), false, String(re));
  }
  assert.equal(/activateCapability\s*\(|visualActivation\s*:\s*true/i.test(src), false);
  assert.equal(/document\.|window\.|localStorage/i.test(src), false);
  ok("capability module has no UA/device/DOM side effects");
}

begin("layout diagnostics only — phase 1b.3 markers");
{
  const layoutSrc = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layoutSrc, /resolveWorkspaceCapabilitiesFromModePlan|resolveWorkspaceCapabilities/);
  assert.match(layoutSrc, /data-wx-phase="1b\.3"/);
  assert.match(layoutSrc, /data-wx-capability/);
  assert.equal(
    /data-wx-cap-[a-z-]+[^\n]*className|\[data-wx-cap-/.test(layoutSrc),
    false,
  );
  // Must not key by capability
  assert.equal(/key=\{[^}]*capabilit/i.test(layoutSrc), false);
  ok("layout exposes capability diagnostics without CSS/key drivers");
}

const summary = {
  layer: "contract",
  groupCount: groups.length,
  groups,
  vectors,
  assertions,
  capabilityIds: WORKSPACE_CAPABILITY_IDS.length,
  reservedIds: WORKSPACE_RESERVED_CAPABILITY_IDS.length,
  browserMountClaimed: false,
  visualActivationClaimed: false,
};

console.log(`\n[capability-framework] SUMMARY ${JSON.stringify(summary)}`);
console.log(
  `[capability-framework] ${assertions} assertions across ${groups.length} groups\n`,
);

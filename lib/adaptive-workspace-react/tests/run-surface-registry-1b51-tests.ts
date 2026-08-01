/**
 * WX Phase 1B.5.1 — Surface Registry & Presentation Contract tests.
 *
 * Explicit fixtures — not mirrored resolver logic (no resolver in this phase).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SURFACE_REGISTRY_FORBIDDEN_SOURCE_PATTERNS,
  WORKSPACE_RESERVED_SURFACE_IDS,
  WORKSPACE_SURFACE_IDS,
  WORKSPACE_SURFACE_REGISTRY,
  getWorkspaceSurface,
  getWorkspaceSurfaceRegistryDiagnostics,
  isWorkspaceSurfaceId,
  isWorkspaceSurfaceReserved,
  listWorkspaceSurfaces,
  serializeWorkspaceSurfaceRegistry,
} from "../workspace-surface-registry";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

const groups: string[] = [];
let assertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[surface-registry-1b5.1] ${name}`);
}

function ok(label: string) {
  assertions += 1;
  console.log(`  ✓ ${label}`);
}

/** Independently authored expected IDs — must match registry exactly. */
const EXPECTED_IDS = [
  "stage",
  "orientation",
  "command",
  "assist-primary",
  "assist-secondary",
  "tool",
  "disclosure",
  "utility",
  "reserved-memory",
  "reserved-ai",
  "reserved-collaboration",
  "reserved-extensions",
] as const;

const EXPECTED_RESERVED = [
  "reserved-memory",
  "reserved-ai",
  "reserved-collaboration",
  "reserved-extensions",
] as const;

begin("contract constants");
{
  assert.equal(WORKSPACE_SURFACE_REGISTRY.phase, "1b.5.1");
  assert.equal(
    WORKSPACE_SURFACE_REGISTRY.contractId,
    "wx-surface-presentation-registry-v1",
  );
  assert.equal(WORKSPACE_SURFACE_REGISTRY.contractVersion, "1.0.0");
  assert.equal(WORKSPACE_SURFACE_REGISTRY.decidesVisibility, false);
  assert.equal(WORKSPACE_SURFACE_REGISTRY.activatesCapabilities, false);
  assert.equal(WORKSPACE_SURFACE_REGISTRY.resolvesPresentation, false);
  assert.equal(WORKSPACE_SURFACE_REGISTRY.diagnosticsOnly, true);
  assert.equal(WORKSPACE_SURFACE_REGISTRY.visualActivationAuthorized, false);
  ok("sealed registry contract constants");
}

begin("stable identifiers + uniqueness");
{
  assert.deepEqual([...WORKSPACE_SURFACE_IDS], [...EXPECTED_IDS]);
  const set = new Set(WORKSPACE_SURFACE_IDS);
  assert.equal(set.size, WORKSPACE_SURFACE_IDS.length);
  for (const id of EXPECTED_IDS) {
    assert.equal(isWorkspaceSurfaceId(id), true, id);
    assert.ok(getWorkspaceSurface(id), id);
  }
  assert.equal(isWorkspaceSurfaceId("not-a-surface"), false);
  assert.equal(isWorkspaceSurfaceId(null), false);
  ok("12 unique stable identifiers");
}

begin("reserved declarations");
{
  assert.deepEqual([...WORKSPACE_RESERVED_SURFACE_IDS], [...EXPECTED_RESERVED]);
  for (const id of EXPECTED_RESERVED) {
    assert.equal(isWorkspaceSurfaceReserved(id), true, id);
    assert.equal(getWorkspaceSurface(id)?.reserved, true, id);
    assert.equal(getWorkspaceSurface(id)?.category, "reserved", id);
    assert.equal(
      getWorkspaceSurface(id)?.availabilityIntent,
      "reserved-blocked",
      id,
    );
  }
  assert.equal(isWorkspaceSurfaceReserved("stage"), false);
  ok("reserved surfaces sealed");
}

begin("registry immutability");
{
  const surfaces = listWorkspaceSurfaces();
  assert.equal(Object.isFrozen(surfaces), true);
  assert.throws(() => {
    (surfaces as { push: (v: unknown) => void }).push({});
  });
  const stage = getWorkspaceSurface("stage");
  assert.ok(stage);
  assert.equal(Object.isFrozen(stage), true);
  assert.equal(getWorkspaceSurface("stage")?.id, "stage");
  ok("registry arrays and entries frozen");
}

begin("ordering stability");
{
  const a = listWorkspaceSurfaces().map((s) => s.id);
  const b = listWorkspaceSurfaces().map((s) => s.id);
  assert.deepEqual(a, b);
  assert.deepEqual(a, [...EXPECTED_IDS]);
  ok("enumeration order stable");
}

begin("priority metadata present (not applied)");
{
  const stage = getWorkspaceSurface("stage");
  const assist2 = getWorkspaceSurface("assist-secondary");
  assert.ok(stage && assist2);
  assert.equal(stage.priorityRank, 1);
  assert.ok(assist2.priorityRank > stage.priorityRank);
  // Registry stores priority metadata only — no contention application here.
  ok("priority metadata present without resolver behaviour");
}

begin("serialization + determinism");
{
  const once = serializeWorkspaceSurfaceRegistry();
  const twice = serializeWorkspaceSurfaceRegistry();
  assert.deepEqual(once, twice);
  const json = JSON.stringify(once);
  const parsed = JSON.parse(json);
  assert.equal(parsed.registry.contractId, "wx-surface-presentation-registry-v1");
  assert.equal(parsed.surfaces.length, 12);
  assert.equal(parsed.registry.surfaceCount, 12);
  ok("serialization deterministic and JSON-safe");
}

begin("diagnostics snapshot");
{
  const d = getWorkspaceSurfaceRegistryDiagnostics();
  assert.equal(d.phase, "1b.5.1");
  assert.equal(d.contractVersion, "1.0.0");
  assert.equal(d.decidesVisibility, false);
  assert.equal(d.activatesCapabilities, false);
  assert.equal(d.visualActivationAuthorized, false);
  assert.deepEqual([...d.surfaceIds], [...EXPECTED_IDS]);
  assert.deepEqual([...d.reservedIds], [...EXPECTED_RESERVED]);
  ok("diagnostics read-only contract");
}

begin("invalid / duplicate detection seals in source definitions");
{
  const src = readFileSync(
    join(root, "lib/adaptive-workspace-react/workspace-surface-registry.ts"),
    "utf8",
  );
  for (const id of EXPECTED_IDS) {
    const matches = src.match(new RegExp(`id: "${id}"`, "g"));
    assert.ok(matches && matches.length === 1, `duplicate id definition: ${id}`);
  }
  ok("each surface id defined exactly once in source");
}

begin("module purity — no browser / React / timers");
{
  const src = readFileSync(
    join(root, "lib/adaptive-workspace-react/workspace-surface-registry.ts"),
    "utf8",
  );
  for (const pattern of SURFACE_REGISTRY_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(pattern.test(src), false, String(pattern));
  }
  ok("registry source free of forbidden runtime patterns");
}

begin("layout diagnostics expose registry without visual activation");
{
  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="1b\.5\.1"/);
  assert.match(layout, /data-wx-surface-registry=/);
  assert.match(layout, /data-wx-surface-registry-version=/);
  assert.match(layout, /data-wx-surface-ids=/);
  assert.match(layout, /data-wx-surface-reserved=/);
  assert.match(layout, /data-wx-cap-visual-activation="0"/);
  // Must not introduce presentation resolver consumers
  assert.equal(/resolveSurfacePresentation|SurfacePresentationPlan/.test(layout), false);
  ok("layout diagnostics bound; visual activation remains 0");
}

begin("future compatibility — contract version on every entry");
{
  for (const surface of listWorkspaceSurfaces()) {
    assert.equal(surface.contractVersion, "1.0.0", surface.id);
    assert.ok(surface.diagnosticToken.startsWith("wx-surface:"), surface.id);
    assert.ok(typeof surface.priorityRank === "number", surface.id);
    assert.ok(surface.availabilityIntent.length > 0, surface.id);
  }
  ok("every entry carries contract version + diagnostic token");
}

console.log(
  `\n[surface-registry-1b5.1] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
    surfaces: WORKSPACE_SURFACE_IDS.length,
    reserved: WORKSPACE_RESERVED_SURFACE_IDS.length,
  })}`,
);
console.log(`[surface-registry-1b5.1] ${assertions} assertions across ${groups.length} groups\n`);

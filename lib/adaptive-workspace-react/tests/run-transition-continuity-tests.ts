/**
 * WX Phase 1B.2 remediation — Transition Continuity contract tests.
 *
 * Layer separation (explicit):
 * - CONTRACT tests: pure continuity API + source guards + fixtures
 * - Browser-observed lifecycle / scroll / filter proof: probe only (not claimed here)
 *
 * Expectations come from independently authored fixtures — not mirrored algorithms.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONTINUITY_FORBIDDEN_SOURCE_PATTERNS,
  WORKSPACE_TRANSITION_CONTINUITY,
  describeWorkspaceModeTransition,
  resolveFailClosedUsableSpace,
  resolveWorkspaceMode,
  simulateModeTransitionAcrossSpace,
} from "../index";
import { normalizeWorkspaceMeasurement } from "../normalize-workspace-measurement";
import {
  CONTINUITY_POLICY_FIXTURES,
  FAIL_CLOSED_FIXTURES,
  OSCILLATION_BOUNDARY_TARGETS,
  OSCILLATIONS_PER_BOUNDARY_MIN,
  TRANSITION_PAIR_FIXTURES,
} from "./fixtures/transition-continuity-vectors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

const groups: { name: string; assertions: number }[] = [];
let assertions = 0;
let vectors = 0;

function begin(name: string) {
  console.log(`\n[transition-continuity] ${name}`);
  groups.push({ name, assertions: 0 });
}

function ok(label: string) {
  assertions += 1;
  groups[groups.length - 1]!.assertions += 1;
  console.log(`  ✓ ${label}`);
}

function note(label: string) {
  console.log(`  · ${label}`);
}

// ---------------------------------------------------------------------------
begin("contract policy fixtures (not browser mount proof)");
{
  for (const [k, v] of Object.entries(CONTINUITY_POLICY_FIXTURES)) {
    assert.equal(
      (WORKSPACE_TRANSITION_CONTINUITY as Record<string, unknown>)[k],
      v,
      k,
    );
  }
  vectors += Object.keys(CONTINUITY_POLICY_FIXTURES).length;
  ok("policy fixtures match sealed continuity contract");
  note(
    "NOTE: remountAuthorized=false is a contract policy assertion — browser probe observes mount identity separately",
  );
}

// ---------------------------------------------------------------------------
begin("Mode-to-Mode transition pair fixtures");
{
  const categories = new Set<string>();
  const pairs: string[] = [];

  for (const fx of TRANSITION_PAIR_FIXTURES) {
    vectors += 1;
    categories.add(fx.category);
    const ev = simulateModeTransitionAcrossSpace({
      fromWidthPx: fx.fromWidthPx,
      fromHeightPx: fx.fromHeightPx,
      toWidthPx: fx.toWidthPx,
      toHeightPx: fx.toHeightPx,
    });
    assert.equal(ev.fromMode, fx.expectedFromMode, fx.id);
    assert.equal(ev.toMode, fx.expectedToMode, fx.id);
    assert.equal(ev.modeChanged, fx.expectedModeChanged, fx.id);
    assert.equal(ev.remountAuthorized, fx.expectedRemountAuthorized, fx.id);
    assert.equal(
      ev.feedIdentityPreserved,
      fx.expectedFeedIdentityPreserved,
      fx.id,
    );
    assert.equal(ev.remountAuthorized, false, `${fx.id} never remount`);
    pairs.push(`${ev.fromMode}→${ev.toMode}`);
  }

  assert.ok(categories.has("mode-boundary"));
  assert.ok(categories.has("same-mode-noop"));
  assert.ok(categories.has("reverse"));
  assert.ok(categories.has("repeated"));
  assert.ok(categories.has("posture-only"));
  ok(
    `${TRANSITION_PAIR_FIXTURES.length} pair fixtures; categories=${[...categories].join(",")}`,
  );
  note(`transition pairs: ${[...new Set(pairs)].join(" | ")}`);
}

// ---------------------------------------------------------------------------
begin("same-Mode no-op + reverse + repeated determinism");
{
  const noop = TRANSITION_PAIR_FIXTURES.filter(
    (f) => f.category === "same-mode-noop",
  );
  assert.ok(noop.length >= 2);
  for (const fx of noop) {
    const a = simulateModeTransitionAcrossSpace({
      fromWidthPx: fx.fromWidthPx,
      fromHeightPx: fx.fromHeightPx,
      toWidthPx: fx.toWidthPx,
      toHeightPx: fx.toHeightPx,
    });
    const b = simulateModeTransitionAcrossSpace({
      fromWidthPx: fx.fromWidthPx,
      fromHeightPx: fx.fromHeightPx,
      toWidthPx: fx.toWidthPx,
      toHeightPx: fx.toHeightPx,
    });
    assert.equal(a.modeChanged, false, fx.id);
    assert.deepEqual(a, b, `${fx.id} deterministic`);
    assert.equal(a.remountAuthorized, false);
  }
  ok("same-Mode no-ops are deterministic and deny remount");

  const reverse = TRANSITION_PAIR_FIXTURES.filter(
    (f) => f.category === "reverse",
  );
  assert.ok(reverse.length >= 3);
  for (const fx of reverse) {
    const ev = simulateModeTransitionAcrossSpace({
      fromWidthPx: fx.fromWidthPx,
      fromHeightPx: fx.fromHeightPx,
      toWidthPx: fx.toWidthPx,
      toHeightPx: fx.toHeightPx,
    });
    assert.equal(ev.modeChanged, true, fx.id);
    assert.equal(ev.remountAuthorized, false, fx.id);
  }
  ok(`${reverse.length} reverse transitions deny remount`);

  // Repeated: apply below/above 720 five times; identity flags stay sealed.
  for (let i = 0; i < 5; i++) {
    const down = simulateModeTransitionAcrossSpace({
      fromWidthPx: 720,
      fromHeightPx: 800,
      toWidthPx: 710,
      toHeightPx: 800,
    });
    const up = simulateModeTransitionAcrossSpace({
      fromWidthPx: 710,
      fromHeightPx: 800,
      toWidthPx: 720,
      toHeightPx: 800,
    });
    assert.equal(down.remountAuthorized, false);
    assert.equal(up.remountAuthorized, false);
    assert.equal(down.feedIdentityPreserved, true);
    assert.equal(up.feedIdentityPreserved, true);
    assert.equal(down.modeChanged, true);
    assert.equal(up.modeChanged, true);
  }
  ok("5× repeated 720 boundary oscillations deny remount (contract layer)");
}

// ---------------------------------------------------------------------------
begin("continuity token preserves stable identity references");
{
  const a = resolveWorkspaceMode({ usableWidthPx: 390, usableHeightPx: 844 });
  const b = resolveWorkspaceMode({ usableWidthPx: 1280, usableHeightPx: 800 });
  const ev = describeWorkspaceModeTransition(a, b);
  assert.match(ev.continuityToken, /^wx-cont:/);
  assert.ok(ev.continuityToken.includes(a.mode));
  assert.ok(ev.continuityToken.includes(b.mode));
  assert.ok(ev.continuityToken.includes(a.posture));
  assert.ok(ev.continuityToken.includes(b.posture));
  assert.equal(ev.fromMode, a.mode);
  assert.equal(ev.toMode, b.mode);
  ok("continuity token references from/to mode+posture");
}

// ---------------------------------------------------------------------------
begin("input immutability");
{
  const previous = resolveWorkspaceMode({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  const next = resolveWorkspaceMode({
    usableWidthPx: 1280,
    usableHeightPx: 800,
  });
  const prevSnap = structuredClone(previous);
  const nextSnap = structuredClone(next);
  describeWorkspaceModeTransition(previous, next);
  assert.deepEqual(previous, prevSnap);
  assert.deepEqual(next, nextSnap);
  ok("describeWorkspaceModeTransition does not mutate inputs");
}

// ---------------------------------------------------------------------------
begin("invalid / impossible measurement fail-closed");
{
  for (const fx of FAIL_CLOSED_FIXTURES) {
    vectors += 1;
    const previous = fx.previous
      ? normalizeWorkspaceMeasurement(fx.previous)
      : null;
    const held = resolveFailClosedUsableSpace({
      previous,
      incomingWidthPx: fx.incomingWidthPx,
      incomingHeightPx: fx.incomingHeightPx,
      fallbackWidthPx: fx.fallbackWidthPx,
      fallbackHeightPx: fx.fallbackHeightPx,
      lastStable: fx.lastStable,
    });
    assert.equal(held.usableWidthPx, fx.expectedWidth, fx.id);
    assert.equal(held.usableHeightPx, fx.expectedHeight, fx.id);
    assert.equal(held.usedLastStable, fx.expectedUsedLastStable, fx.id);
  }
  ok(`${FAIL_CLOSED_FIXTURES.length} fail-closed fixtures`);
}

// ---------------------------------------------------------------------------
begin("no capability / ownership-transfer authorization");
{
  const src = readFileSync(
    join(root, "lib/adaptive-workspace-react/workspace-transition-continuity.ts"),
    "utf8",
  );
  assert.equal(/activateCapability|transferOwner|ownership.?transfer/i.test(src), false);
  assert.equal(/remountAuthorized:\s*true/.test(src), false);
  assert.match(src, /remountAuthorized:\s*false/);
  assert.equal(WORKSPACE_TRANSITION_CONTINUITY.remountOnModeChange, false);
  assert.equal(WORKSPACE_TRANSITION_CONTINUITY.reloadFeedOnModeChange, false);
  ok("continuity module denies remount/reload; no capability activation");
}

// ---------------------------------------------------------------------------
begin("layout source: permanent slots + mount diagnostics + no Mode keys");
{
  const src = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  for (const re of CONTINUITY_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(re.test(src), false, String(re));
  }
  assert.match(src, /data-wx-phase="1b\.4"/);
  assert.match(src, /data-wx-capability/);
  assert.match(src, /data-wx-landscape-work/);
  assert.match(src, /data-wx-landscape-contract/);
  assert.match(src, /WORKSPACE_TRANSITION_CONTINUITY/);
  assert.match(src, /h-full overflow-hidden/);
  // Continuity + 1B.2.1 height chain remain; phase advances with landscape work posture.
  assert.match(src, /data-wx-continuity/);
  assert.match(src, /data-wx-continuity-remount="0"/);
  assert.match(src, /data-aw-stable-feed-slot="1"/);
  assert.match(src, /data-wx-primary-mount-id/);
  assert.match(src, /data-wx-shell-mount-id/);
  assert.match(src, /wx-primary-mount:/);
  assert.match(src, /wx-shell-mount:/);
  assert.match(src, /Never keyed by Mode/);
  assert.equal(/userAgent|navigator\.userAgent|matchMedia/i.test(src), false);
  // Diagnostics must not appear as CSS selectors / class drivers
  assert.equal(
    /data-wx-primary-mount-id[^\n]*className|\[data-wx-primary-mount-id\]/.test(
      src,
    ),
    false,
  );
  ok("layout has mount diagnostics; no Mode keys; no UA; no CSS consumer");
}

// ---------------------------------------------------------------------------
begin("oscillation boundary targets (contract coverage map)");
{
  assert.deepEqual([...OSCILLATION_BOUNDARY_TARGETS], [720, 1024, 1440]);
  assert.equal(OSCILLATIONS_PER_BOUNDARY_MIN, 5);
  for (const boundary of OSCILLATION_BOUNDARY_TARGETS) {
    const below = simulateModeTransitionAcrossSpace({
      fromWidthPx: boundary - 1,
      fromHeightPx: 800,
      toWidthPx: boundary,
      toHeightPx: 800,
    });
    assert.equal(below.remountAuthorized, false);
    assert.equal(below.modeChanged, true, `boundary ${boundary} must change Mode`);
  }
  ok("720/1024/1440 boundary map: Mode changes + remount denied");
  note(
    "Browser oscillation proof (≥5 per boundary, measured AvailableSpace) lives in probe — not claimed as unit mount observation",
  );
}

// ---------------------------------------------------------------------------
const summary = {
  layer: "contract",
  groups: groups.map((g) => g.name),
  groupCount: groups.length,
  vectors,
  assertions,
  transitionPairs: TRANSITION_PAIR_FIXTURES.length,
  boundaries: [...OSCILLATION_BOUNDARY_TARGETS],
  oscillationsPerBoundaryMin: OSCILLATIONS_PER_BOUNDARY_MIN,
  browserMountClaimed: false,
};

console.log(`\n[transition-continuity] SUMMARY ${JSON.stringify(summary)}`);
console.log(`[transition-continuity] ${assertions} assertions across ${groups.length} groups\n`);

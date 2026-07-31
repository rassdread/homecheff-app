/**
 * WX Phase 1B.2 — Transition Continuity tests.
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let checks = 0;
function ok(label: string) {
  checks += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[transition-continuity] contract constants");

{
  assert.equal(WORKSPACE_TRANSITION_CONTINUITY.phase, "1b.2");
  assert.equal(WORKSPACE_TRANSITION_CONTINUITY.remountOnModeChange, false);
  assert.equal(WORKSPACE_TRANSITION_CONTINUITY.reloadFeedOnModeChange, false);
  assert.equal(WORKSPACE_TRANSITION_CONTINUITY.resetScrollOnModeChange, false);
  assert.equal(WORKSPACE_TRANSITION_CONTINUITY.resetFiltersOnModeChange, false);
  assert.equal(WORKSPACE_TRANSITION_CONTINUITY.primarySlotKey, "aw-slot-primary");
  ok("continuity contract sealed");
}

console.log("\n[transition-continuity] Mode boundary transitions deny remount");

{
  const boundaries = [
    { from: [390, 844], to: [844, 390], label: "portrait browse → landscape hybrid" },
    { from: [700, 320], to: [768, 1024], label: "compact carve → hybrid portrait" },
    { from: [768, 1024], to: [1280, 800], label: "hybrid → full" },
    { from: [1280, 800], to: [1920, 1080], label: "full → professional" },
    { from: [1920, 1080], to: [390, 844], label: "professional → browse" },
    { from: [1023, 800], to: [1024, 800], label: "hybrid→full at 1024" },
    { from: [1439, 900], to: [1440, 900], label: "full→professional at 1440" },
    { from: [719, 800], to: [720, 800], label: "browse→hybrid at 720" },
  ] as const;

  let modeChanges = 0;
  for (const b of boundaries) {
    const ev = simulateModeTransitionAcrossSpace({
      fromWidthPx: b.from[0],
      fromHeightPx: b.from[1],
      toWidthPx: b.to[0],
      toHeightPx: b.to[1],
    });
    assert.equal(ev.remountAuthorized, false, b.label);
    assert.equal(ev.feedIdentityPreserved, true, b.label);
    if (ev.modeChanged) modeChanges += 1;
    assert.ok(ev.continuityToken.includes(ev.fromMode), b.label);
  }
  assert.ok(modeChanges >= 5, "expected multiple Mode changes across journey");
  ok(`${boundaries.length} boundary transitions; ${modeChanges} Mode changes; remount never authorized`);
}

console.log("\n[transition-continuity] describe transition purity");

{
  const a = resolveWorkspaceMode({ usableWidthPx: 390, usableHeightPx: 844 });
  const b = resolveWorkspaceMode({ usableWidthPx: 1280, usableHeightPx: 800 });
  const ev = describeWorkspaceModeTransition(a, b);
  assert.equal(ev.fromMode, "browse");
  assert.equal(ev.toMode, "full-workspace");
  assert.equal(ev.modeChanged, true);
  assert.equal(ev.remountAuthorized, false);
  ok("browse → full-workspace transition event");
}

console.log("\n[transition-continuity] fail-closed usable space");

{
  const stable = normalizeWorkspaceMeasurement({ widthPx: 1280, heightPx: 800 });
  assert.ok(stable);
  const held = resolveFailClosedUsableSpace({
    previous: stable,
    incomingWidthPx: 0,
    incomingHeightPx: 0,
    fallbackWidthPx: 320,
    fallbackHeightPx: 568,
    lastStable: { widthPx: 1280, heightPx: 800 },
  });
  assert.equal(held.usableWidthPx, 1280);
  assert.equal(held.usableHeightPx, 800);
  assert.equal(held.usedLastStable, true);
  ok("invalid incoming → last stable dims");
}

console.log("\n[transition-continuity] layout source forbids Mode keys");

{
  const src = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  for (const re of CONTINUITY_FORBIDDEN_SOURCE_PATTERNS) {
    assert.equal(re.test(src), false, String(re));
  }
  assert.match(src, /data-wx-phase="1b\.2"/);
  assert.match(src, /data-wx-continuity/);
  assert.match(src, /data-wx-continuity-remount="0"/);
  assert.match(src, /data-aw-stable-feed-slot="1"/);
  assert.match(src, /Never keyed by Mode/);
  assert.equal(/userAgent|navigator\.userAgent|matchMedia/i.test(src), false);
  ok("layout continuity markers; no Mode keys; no UA");
}

console.log(`\n[transition-continuity] ${checks} checks passed\n`);

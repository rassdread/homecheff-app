/**
 * WX Phase 1B.1 — Workspace Mode Engine tests (pure / deterministic).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  WORKSPACE_MODE_BANDS,
  isSameWorkspaceModePlan,
  resolveWorkspaceMode,
  type WorkspaceModeId,
} from "../resolve-workspace-mode";

const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[workspace-mode-engine] deterministic bands");

{
  assert.equal(WORKSPACE_MODE_BANDS.compactMaxExclusive, 720);
  assert.equal(WORKSPACE_MODE_BANDS.comfortMaxExclusive, 1024);
  assert.equal(WORKSPACE_MODE_BANDS.expandedMaxExclusive, 1440);
  assert.equal(WORKSPACE_MODE_BANDS.landscapePanelMinWidthPx, 640);
  ok("default bands align with feed visible-layout / WMS affinity");
}

console.log("\n[workspace-mode-engine] Mode matrix (AvailableSpace only)");

const cases: Array<{
  w: number;
  h: number;
  mode: WorkspaceModeId;
  posture: "portrait" | "landscape";
  carve?: boolean;
  demoted?: boolean;
}> = [
  { w: 320, h: 568, mode: "browse", posture: "portrait" },
  { w: 360, h: 740, mode: "browse", posture: "portrait" },
  { w: 390, h: 844, mode: "browse", posture: "portrait" },
  { w: 430, h: 932, mode: "browse", posture: "portrait" },
  // Mid landscape (≥720): Hybrid — not Compact carve-out (WMS mid landscape story)
  {
    w: 844,
    h: 390,
    mode: "hybrid-workspace",
    posture: "landscape",
  },
  // Compact landscape carve-out: width < 720 and ≥640
  {
    w: 700,
    h: 320,
    mode: "compact-workspace",
    posture: "landscape",
    carve: true,
  },
  { w: 600, h: 300, mode: "browse", posture: "landscape" },
  { w: 768, h: 1024, mode: "hybrid-workspace", posture: "portrait" },
  { w: 820, h: 1180, mode: "hybrid-workspace", posture: "portrait" },
  { w: 1024, h: 768, mode: "full-workspace", posture: "landscape" },
  { w: 1280, h: 800, mode: "full-workspace", posture: "landscape" },
  { w: 1440, h: 900, mode: "professional-workspace", posture: "landscape" },
  { w: 1920, h: 1080, mode: "professional-workspace", posture: "landscape" },
  { w: 2560, h: 1440, mode: "professional-workspace", posture: "landscape" },
  {
    w: 1600,
    h: 400,
    mode: "full-workspace",
    posture: "landscape",
    demoted: true,
  },
  {
    w: 1200,
    h: 400,
    mode: "hybrid-workspace",
    posture: "landscape",
    demoted: true,
  },
];

for (const c of cases) {
  const plan = resolveWorkspaceMode({
    usableWidthPx: c.w,
    usableHeightPx: c.h,
  });
  assert.equal(plan.mode, c.mode, `${c.w}x${c.h} mode`);
  assert.equal(plan.posture, c.posture, `${c.w}x${c.h} posture`);
  assert.equal(plan.landscapeCarveOut, Boolean(c.carve), `${c.w}x${c.h} carve`);
  assert.equal(plan.heightDemoted, Boolean(c.demoted), `${c.w}x${c.h} demoted`);
  assert.equal(plan.usableWidthPx, c.w);
  assert.equal(plan.usableHeightPx, c.h);
  assert.equal(plan.workingAreaPx, c.w * c.h);
}
ok(`${cases.length} AvailableSpace vectors → deterministic Modes`);

console.log("\n[workspace-mode-engine] purity / no interaction upgrade");

{
  const base = resolveWorkspaceMode({
    usableWidthPx: 390,
    usableHeightPx: 844,
    interactionSpace: "touch",
    workspaceDensity: "low",
  });
  const pointer = resolveWorkspaceMode({
    usableWidthPx: 390,
    usableHeightPx: 844,
    interactionSpace: "pointer",
    workspaceDensity: "high",
  });
  assert.equal(base.mode, "browse");
  assert.equal(pointer.mode, "browse");
  assert.equal(base.stabilityToken, pointer.stabilityToken);
  ok("interactionSpace/density do not change Mode (1B.1)");
}

console.log("\n[workspace-mode-engine] repeatability");

{
  const a = resolveWorkspaceMode({
    usableWidthPx: 1280.9,
    usableHeightPx: 800.2,
  });
  const b = resolveWorkspaceMode({
    usableWidthPx: 1280.1,
    usableHeightPx: 800.9,
  });
  assert.equal(a.mode, b.mode);
  assert.equal(a.usableWidthPx, 1280);
  assert.equal(a.usableHeightPx, 800);
  assert.equal(isSameWorkspaceModePlan(a, b), true);
  ok("floors dimensions; same floors → same plan");
}

console.log("\n[workspace-mode-engine] no UA / device inputs in API");

{
  const src = readFileSync(
    join(__dirname, "../resolve-workspace-mode.ts"),
    "utf8",
  );
  assert.equal(
    /userAgent|navigator|iPhone|iPad|Android|mobile\s*:/i.test(src),
    false,
  );
  ok("source has no device/UA branching");
}

console.log(`\n[workspace-mode-engine] ${passed} checks passed\n`);

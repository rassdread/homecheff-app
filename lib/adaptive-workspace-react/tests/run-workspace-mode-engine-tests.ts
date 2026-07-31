/**
 * WX Phase 1B.1 — Workspace Mode Engine tests (pure / deterministic).
 *
 * Expectations come from independently authored fixtures — not a mirrored
 * threshold algorithm.
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
  type WorkspacePosture,
} from "../resolve-workspace-mode";
import {
  WORKSPACE_MODE_ENGINE_DECLARED_THRESHOLDS,
  WORKSPACE_MODE_ENGINE_VECTORS,
} from "./fixtures/workspace-mode-engine-vectors";

const __dirname = dirname(fileURLToPath(import.meta.url));

let checkGroups = 0;
let assertionCount = 0;

function ok(label: string) {
  checkGroups += 1;
  console.log(`  ✓ ${label}`);
}

function expectEqual(actual: unknown, expected: unknown, message: string) {
  assertionCount += 1;
  assert.equal(actual, expected, message);
}

console.log("\n[workspace-mode-engine] declared threshold documentation");

{
  expectEqual(WORKSPACE_MODE_BANDS.compactMaxExclusive, 720, "band 720");
  expectEqual(WORKSPACE_MODE_BANDS.comfortMaxExclusive, 1024, "band 1024");
  expectEqual(WORKSPACE_MODE_BANDS.expandedMaxExclusive, 1440, "band 1440");
  expectEqual(WORKSPACE_MODE_BANDS.landscapePanelMinWidthPx, 640, "band 640");
  expectEqual(WORKSPACE_MODE_BANDS.shortHeightMaxExclusive, 480, "band 480");
  expectEqual(
    WORKSPACE_MODE_ENGINE_DECLARED_THRESHOLDS.width720,
    720,
    "fixture docs 720",
  );
  expectEqual(
    WORKSPACE_MODE_ENGINE_DECLARED_THRESHOLDS.width1024,
    1024,
    "fixture docs 1024",
  );
  expectEqual(
    WORKSPACE_MODE_ENGINE_DECLARED_THRESHOLDS.width1440,
    1440,
    "fixture docs 1440",
  );
  expectEqual(
    WORKSPACE_MODE_ENGINE_DECLARED_THRESHOLDS.carveOut640,
    640,
    "fixture docs 640",
  );
  expectEqual(
    WORKSPACE_MODE_ENGINE_DECLARED_THRESHOLDS.shortHeight480,
    480,
    "fixture docs 480",
  );
  ok("documented thresholds present (layout bands remain separate owners)");
}

console.log("\n[workspace-mode-engine] fixture vectors (explicit expects)");

{
  const modes = new Set<WorkspaceModeId>();
  const postures = new Set<WorkspacePosture>();

  for (const vector of WORKSPACE_MODE_ENGINE_VECTORS) {
    const plan = resolveWorkspaceMode({
      usableWidthPx: vector.usableWidthPx,
      usableHeightPx: vector.usableHeightPx,
    });
    expectEqual(
      plan.mode,
      vector.expect.mode,
      `${vector.id} mode (${vector.purpose})`,
    );
    expectEqual(
      plan.posture,
      vector.expect.posture,
      `${vector.id} posture`,
    );
    expectEqual(
      plan.landscapeCarveOut,
      vector.expect.landscapeCarveOut,
      `${vector.id} carve`,
    );
    expectEqual(
      plan.heightDemoted,
      vector.expect.heightDemoted,
      `${vector.id} demoted`,
    );
    expectEqual(plan.usableWidthPx, vector.usableWidthPx, `${vector.id} w`);
    expectEqual(plan.usableHeightPx, vector.usableHeightPx, `${vector.id} h`);
    expectEqual(
      plan.workingAreaPx,
      vector.usableWidthPx * vector.usableHeightPx,
      `${vector.id} area`,
    );
    modes.add(plan.mode);
    postures.add(plan.posture);
  }

  expectEqual(modes.has("browse"), true, "covers browse");
  expectEqual(modes.has("compact-workspace"), true, "covers compact");
  expectEqual(modes.has("hybrid-workspace"), true, "covers hybrid");
  expectEqual(modes.has("full-workspace"), true, "covers full");
  expectEqual(modes.has("professional-workspace"), true, "covers professional");
  expectEqual(postures.has("portrait"), true, "covers portrait");
  expectEqual(postures.has("landscape"), true, "covers landscape");

  ok(
    `${WORKSPACE_MODE_ENGINE_VECTORS.length} independent vectors; modes=${[...modes].join(",")}; postures=${[...postures].join(",")}`,
  );
}

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
  expectEqual(base.mode, "browse", "touch stays browse");
  expectEqual(pointer.mode, "browse", "pointer stays browse");
  expectEqual(base.stabilityToken, pointer.stabilityToken, "same token");
  ok("interactionSpace/density do not change Mode (1B.1)");
}

console.log("\n[workspace-mode-engine] repeatability + input immutability");

{
  const input = { usableWidthPx: 1280.9, usableHeightPx: 800.2 };
  const before = JSON.stringify(input);
  const a = resolveWorkspaceMode(input);
  expectEqual(before, JSON.stringify(input), "input object not mutated");
  const b = resolveWorkspaceMode({
    usableWidthPx: 1280.1,
    usableHeightPx: 800.9,
  });
  expectEqual(a.mode, b.mode, "same floored mode");
  expectEqual(a.usableWidthPx, 1280, "floor width");
  expectEqual(a.usableHeightPx, 800, "floor height");
  expectEqual(isSameWorkspaceModePlan(a, b), true, "same plan");
  ok("floors dimensions; immutable input; same floors → same plan");
}

console.log("\n[workspace-mode-engine] measured Workspace vs viewport labels");

{
  // Shell chrome may reduce measured width below a marketing viewport label.
  // Mode must follow measured AvailableSpace fixtures, not "1024 viewport" names.
  const measuredBelowComfort = resolveWorkspaceMode({
    usableWidthPx: 998,
    usableHeightPx: 768,
  });
  expectEqual(
    measuredBelowComfort.mode,
    "hybrid-workspace",
    "998 measured → hybrid (not full by viewport label)",
  );
  const measuredBelowProfessional = resolveWorkspaceMode({
    usableWidthPx: 1414,
    usableHeightPx: 900,
  });
  expectEqual(
    measuredBelowProfessional.mode,
    "full-workspace",
    "1414 measured → full (not professional by 1440 viewport label)",
  );
  ok("measured AvailableSpace fixtures beat viewport naming");
}

console.log("\n[workspace-mode-engine] no UA / device inputs in API");

{
  const src = readFileSync(
    join(__dirname, "../resolve-workspace-mode.ts"),
    "utf8",
  );
  expectEqual(
    /userAgent|navigator|iPhone|iPad|Android|mobile\s*:/i.test(src),
    false,
    "no UA in engine source",
  );
  ok("source has no device/UA branching");
}

console.log("\n[workspace-mode-engine] fixture file has no resolver mirror");

{
  const fixtureSrc = readFileSync(
    join(__dirname, "fixtures/workspace-mode-engine-vectors.ts"),
    "utf8",
  );
  expectEqual(
    /resolveWorkspaceMode\s*\(|function\s+expectMode\b/.test(fixtureSrc),
    false,
    "fixtures must not call or reimplement the resolver",
  );
  expectEqual(
    /if\s*\(\s*widthPx\s*>=|else if\s*\(\s*posture\s*===/.test(fixtureSrc),
    false,
    "fixtures must not contain threshold branching",
  );
  ok("fixtures are explicit constants only");
}

console.log(
  `\n[workspace-mode-engine] summary checkGroups=${checkGroups} vectors=${WORKSPACE_MODE_ENGINE_VECTORS.length} assertions=${assertionCount}\n`,
);

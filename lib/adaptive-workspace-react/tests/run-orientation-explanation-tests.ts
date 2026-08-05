/**
 * WX Phase 1C.2 — Available Space messaging unit tests.
 */
import assert from "node:assert/strict";
import {
  resolveOrientationExplanation,
  toLegacyOrientationExplanationLevel,
} from "../resolve-orientation-explanation";

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

console.log("\n[orientation-explanation] AvailableSpace complete-message matrix");

const matrix: Array<{
  id: string;
  w: number;
  h: number;
  level:
    | "ultra_compact"
    | "compact_complete"
    | "standard_complete"
    | "expanded"
    | "rich";
}> = [
  { id: "320x568", w: 320, h: 568, level: "compact_complete" },
  { id: "360x640", w: 360, h: 640, level: "standard_complete" },
  { id: "375x667", w: 375, h: 667, level: "standard_complete" },
  { id: "390x844", w: 390, h: 844, level: "standard_complete" },
  { id: "412x915", w: 412, h: 915, level: "standard_complete" },
  { id: "430x932", w: 430, h: 932, level: "standard_complete" },
  { id: "phone-landscape", w: 844, h: 390, level: "ultra_compact" },
  { id: "768x1024", w: 768, h: 1024, level: "expanded" },
  { id: "820x1180", w: 820, h: 1180, level: "expanded" },
  { id: "1024x768", w: 1024, h: 768, level: "standard_complete" },
  { id: "1280x720", w: 1280, h: 720, level: "standard_complete" },
  { id: "1440x900", w: 1440, h: 900, level: "expanded" },
  { id: "1920x1080", w: 1920, h: 1080, level: "rich" },
  { id: "900x1280-portrait", w: 900, h: 1280, level: "expanded" },
  { id: "1280x1400", w: 1280, h: 1400, level: "rich" },
];

for (const row of matrix) {
  const plan = resolveOrientationExplanation({
    usableWidthPx: row.w,
    usableHeightPx: row.h,
  });
  assert.equal(plan.level, row.level, `${row.id} got ${plan.level}`);
  assert.equal(plan.showBody, true, `${row.id} body`);
  assert.equal(plan.showActions, true, `${row.id} actions`);
  assert.equal(
    plan.singleLine,
    row.level === "ultra_compact",
    `${row.id} singleLine`,
  );
}
ok("viewport matrix keeps complete meaning + correct density");

const invalid = resolveOrientationExplanation({
  usableWidthPx: Number.NaN,
  usableHeightPx: -1,
});
assert.equal(invalid.level, "compact_complete");
assert.equal(invalid.showBody, true);
assert.equal(invalid.showActions, true);
ok("fail-closed → compact_complete with complete meaning");

const tallPhone = resolveOrientationExplanation({
  usableWidthPx: 390,
  usableHeightPx: 844,
});
const shortPhone = resolveOrientationExplanation({
  usableWidthPx: 320,
  usableHeightPx: 568,
});
assert.notEqual(tallPhone.level, shortPhone.level);
assert.equal(tallPhone.level, "standard_complete");
assert.equal(shortPhone.level, "compact_complete");
ok("portrait expands with available vertical space");

const land = resolveOrientationExplanation({
  usableWidthPx: 844,
  usableHeightPx: 390,
});
assert.equal(land.level, "ultra_compact");
assert.equal(land.chromeBudget, "tight");
ok("short landscape stays compact (1B.4)");

const desktop = resolveOrientationExplanation({
  usableWidthPx: 1920,
  usableHeightPx: 1080,
});
assert.equal(desktop.level, "rich");
ok("ample desktop AvailableSpace → rich");

assert.equal(toLegacyOrientationExplanationLevel("ultra_compact"), "compact");
assert.equal(toLegacyOrientationExplanationLevel("rich"), "full");
ok("legacy probe mapping");

console.log("[orientation-explanation] PASS\n");

/**
 * WX Phase 1C.1+ — Orientation explanation density unit tests.
 */
import assert from "node:assert/strict";
import { resolveOrientationExplanation } from "../resolve-orientation-explanation";

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

console.log("\n[orientation-explanation] AvailableSpace density matrix");

const matrix: Array<{
  w: number;
  h: number;
  level: "short" | "compact" | "medium" | "full";
}> = [
  { w: 390, h: 844, level: "short" },
  { w: 844, h: 390, level: "compact" },
  { w: 768, h: 1024, level: "medium" },
  { w: 900, h: 600, level: "medium" },
  { w: 1024, h: 768, level: "full" },
  { w: 1100, h: 700, level: "full" },
  { w: 1280, h: 800, level: "full" },
  { w: 1440, h: 900, level: "full" },
  { w: 2560, h: 1440, level: "full" },
];

for (const row of matrix) {
  const plan = resolveOrientationExplanation({
    usableWidthPx: row.w,
    usableHeightPx: row.h,
  });
  assert.equal(plan.level, row.level, `${row.w}x${row.h}`);
  assert.equal(plan.singleLine, row.level === "compact");
  assert.equal(plan.showBody, row.level !== "compact");
  assert.equal(
    plan.showActions,
    row.level === "compact" || row.level === "medium" || row.level === "full",
  );
}
ok("phone/tablet/desktop/ultrawide explanation levels");

const invalid = resolveOrientationExplanation({
  usableWidthPx: Number.NaN,
  usableHeightPx: -1,
});
assert.equal(invalid.level, "short");
ok("fail-closed → short");

console.log("[orientation-explanation] PASS\n");

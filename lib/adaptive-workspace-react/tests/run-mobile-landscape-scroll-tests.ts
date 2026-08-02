/**
 * WX Phase 1B.2.1 — Mobile landscape scroll-owner regression (contract layer).
 *
 * Asserts multiCol frame + wrapper chain keep a bounded feed scroll owner.
 * Does NOT claim browser touch proof (that lives in the probe).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveFeedWorkspaceVisibleLayout } from "../resolve-feed-workspace-visible-layout";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let assertions = 0;
function ok(label: string) {
  assertions += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[mobile-landscape-scroll] landscape carve-out enables multiCol");
{
  const plan = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 740,
    usableHeightPx: 360,
  });
  assert.equal(plan.orientation, "landscape");
  assert.ok(plan.supportingPanelCount >= 1);
  assert.match(plan.layoutMode, /landscape/);
  ok("740×360 → landscape + supporting panel (≥1)");
}

console.log("\n[mobile-landscape-scroll] portrait stays single-column");
{
  const plan = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  assert.equal(plan.orientation, "portrait");
  assert.equal(plan.supportingPanelCount, 0);
  ok("390×844 → portrait + 0 panels");
}

console.log("\n[mobile-landscape-scroll] layout source: height propagation for multiCol");
{
  const layoutSrc = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layoutSrc, /h-\[calc\(100dvh-5rem\)\]/);
  assert.match(layoutSrc, /overflow-hidden/);
  // multiCol primary host must bound height into the feed scroll owner
  assert.match(
    layoutSrc,
    /data-wx-continuity-primary[\s\S]{0,220}?h-full overflow-hidden/,
  );
  assert.match(layoutSrc, /homecheff-feed-desktop/);
  assert.match(layoutSrc, /overflow-y-auto/);
  assert.match(layoutSrc, /1B\.2\.1|mobile landscape scroll/i);
  // multiCol gates feed scroll owner; portrait must not trap document scroll
  assert.match(layoutSrc, /data-wx-scroll-owner=\{multiCol \? "feed" : "document"\}/);
  assert.match(
    layoutSrc,
    /multiCol\s*\?\s*"min-h-0 flex-1 overflow-y-auto overscroll-y-contain/,
  );
  // Must not key by Mode
  assert.equal(/key=\{[^}]*modePlan/i.test(layoutSrc), false);
  ok("multiCol primary host uses h-full overflow-hidden; feed scroll owner gated");
}

console.log("\n[mobile-landscape-scroll] wrappers fill height");
{
  for (const file of [
    "components/adaptive-workspace/WorkspaceRegion.tsx",
    "components/adaptive-workspace/WorkspaceSlot.tsx",
    "components/adaptive-workspace/WorkspacePanel.tsx",
  ]) {
    const src = readFileSync(join(root, file), "utf8");
    assert.match(src, /h-full min-h-0/);
  }
  ok("Region/Slot/Panel propagate h-full min-h-0");
}

console.log(
  `\n[mobile-landscape-scroll] SUMMARY ${JSON.stringify({
    layer: "contract",
    assertions,
    browserTouchClaimed: false,
  })}\n`,
);

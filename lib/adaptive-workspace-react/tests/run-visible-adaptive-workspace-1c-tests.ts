/**
 * WX Phase 1C — Visible Adaptive Workspace contract tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  VISIBLE_ADAPTIVE_WORKSPACE,
  resolveVisibleAdaptiveWorkspace,
  refineWorkspaceClass,
  resolveFeedWorkspaceVisibleLayout,
  resolveLandscapeWorkPosture,
} from "../index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let assertions = 0;
function ok(label: string) {
  assertions += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[visible-adaptive-1c] contract constants");
{
  assert.equal(VISIBLE_ADAPTIVE_WORKSPACE.phase, "1c");
  assert.equal(
    VISIBLE_ADAPTIVE_WORKSPACE.contractId,
    "wx-visible-adaptive-workspace-v1",
  );
  assert.equal(VISIBLE_ADAPTIVE_WORKSPACE.neverExtendsPlanners, true);
  assert.equal(VISIBLE_ADAPTIVE_WORKSPACE.presentationOnly, true);
  ok("1C contract metadata sealed");
}

console.log("\n[visible-adaptive-1c] screen class matrix (AvailableSpace)");
{
  const matrix: Array<{
    w: number;
    h: number;
    cls: string;
    rails: [boolean, boolean];
    scroll: string;
    bottom: number;
  }> = [
    { w: 390, h: 844, cls: "phone-portrait", rails: [false, false], scroll: "document", bottom: 5 },
    { w: 700, h: 320, cls: "phone-landscape", rails: [true, false], scroll: "feed", bottom: 0 },
    { w: 768, h: 1024, cls: "tablet-portrait", rails: [true, false], scroll: "feed", bottom: 5 },
    { w: 900, h: 600, cls: "tablet-landscape", rails: [true, false], scroll: "feed", bottom: 0 },
    { w: 1024, h: 768, cls: "laptop", rails: [true, true], scroll: "feed", bottom: 0 },
    { w: 1280, h: 800, cls: "desktop", rails: [true, true], scroll: "feed", bottom: 0 },
    { w: 1440, h: 900, cls: "ultrawide", rails: [true, true], scroll: "feed", bottom: 0 },
    { w: 2560, h: 1440, cls: "ultrawide", rails: [true, true], scroll: "feed", bottom: 0 },
  ];

  for (const row of matrix) {
    const plan = resolveVisibleAdaptiveWorkspace({
      usableWidthPx: row.w,
      usableHeightPx: row.h,
    });
    assert.equal(plan.workspaceClass, row.cls, `${row.w}x${row.h} class`);
    assert.equal(plan.showStartRail, row.rails[0], `${row.w}x${row.h} start`);
    assert.equal(plan.showEndRail, row.rails[1], `${row.w}x${row.h} end`);
    assert.equal(plan.scrollOwner, row.scroll, `${row.w}x${row.h} scroll`);
    assert.equal(
      plan.chromeInset.bottomRem,
      row.bottom,
      `${row.w}x${row.h} bottom inset`,
    );
    assert.equal(plan.railOwnsFilters, row.rails[0]);
    assert.equal(plan.stageOwnsFilters, !row.rails[0]);
  }
  ok("phone/tablet/laptop/desktop/ultrawide matrix");
}

console.log("\n[visible-adaptive-1c] landscape reclaims bottom chrome");
{
  const land = resolveVisibleAdaptiveWorkspace({
    usableWidthPx: 844,
    usableHeightPx: 390,
  });
  assert.equal(land.bottomNavCollapsed, true);
  assert.equal(land.orientationCompact, true);
  assert.equal(land.chromeInset.bottomRem, 0);
  assert.equal(land.chromeInset.topRem, 0);
  assert.equal(land.chromeInset.frameHeightCss, "100dvh");
  ok("landscape frame uses full dvh when navbar suppressed");
}

console.log("\n[visible-adaptive-1c] portrait keeps bottom nav inset");
{
  const port = resolveVisibleAdaptiveWorkspace({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  assert.equal(port.bottomNavCollapsed, false);
  assert.equal(port.chromeInset.bottomRem, 5);
  assert.match(port.chromeInset.frameHeightCss, /8\.5rem|5rem/);
  // top 3.5 + bottom 5 = 8.5
  assert.equal(port.chromeInset.frameHeightCss, "calc(100dvh - 8.5rem)");
  ok("portrait reserves bottom nav");
}

console.log("\n[visible-adaptive-1c] refineWorkspaceClass laptop vs desktop");
{
  assert.equal(refineWorkspaceClass("desktop", 1100), "laptop");
  assert.equal(refineWorkspaceClass("desktop", 1254), "desktop");
  assert.equal(refineWorkspaceClass("desktop-wide", 1920), "ultrawide");
  ok("laptop/desktop/ultrawide refinement");
}

console.log("\n[visible-adaptive-1c] consumes existing plans only");
{
  const layout = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 1280,
    usableHeightPx: 800,
  });
  const posture = resolveLandscapeWorkPosture({
    usableWidthPx: 1280,
    usableHeightPx: 800,
  });
  const plan = resolveVisibleAdaptiveWorkspace({
    usableWidthPx: 1280,
    usableHeightPx: 800,
    layoutPlan: layout,
    posturePlan: posture,
  });
  assert.equal(plan.layoutMode, layout.layoutMode);
  assert.equal(plan.showStartRail, layout.showStartPanel);
  assert.equal(plan.bottomNavCollapsed, posture.bottomNavCollapsed);
  ok("composes layout + posture without new decision bands");
}

console.log("\n[visible-adaptive-1c] source contracts");
{
  const resolver = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-visible-adaptive-workspace.ts"),
    "utf8",
  );
  assert.doesNotMatch(resolver, /navigator\.|userAgent|matchMedia/);
  assert.match(resolver, /neverExtendsPlanners/);

  const layoutSrc = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layoutSrc, /data-wx-phase="1c.1"/);
  assert.match(layoutSrc, /resolveVisibleAdaptiveWorkspace/);
  assert.match(layoutSrc, /railOwnsFilters/);
  assert.equal(/key=\{[^}]*modePlan/i.test(layoutSrc), false);

  const homeSrc = readFileSync(
    join(root, "components/home/HomePageClient.tsx"),
    "utf8",
  );
  assert.match(homeSrc, /WorkspaceFeedPresentationBridge/);

  const geoSrc = readFileSync(
    join(root, "components/feed/GeoFeed.tsx"),
    "utf8",
  );
  assert.match(geoSrc, /createPortal/);
  assert.match(geoSrc, /workspaceRailOwnsFilters/);
  assert.match(geoSrc, /data-wx-rail-owns-filters/);

  ok("shell/bridge/geofeed presentation wiring present; no UA; no mode keys");
}

console.log(
  `\n[visible-adaptive-1c] SUMMARY ${JSON.stringify({ assertions, phase: "1c" })}\n`,
);

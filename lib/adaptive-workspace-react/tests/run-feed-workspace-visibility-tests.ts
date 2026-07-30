/**
 * Feed Workspace visibility + visible-layout resolver tests (Node/tsx).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  coerceFeedWorkspaceVisibilityMode,
  isFeedWorkspaceLayoutVisible,
  parseFeedWorkspacePreviewRequested,
  resolveFeedWorkspaceVisibilityMode,
  resolveFeedWorkspaceVisibleLayout,
} from "../index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[feed-workspace-visibility] mode fail-closed");

{
  assert.equal(coerceFeedWorkspaceVisibilityMode("off"), "off");
  assert.equal(coerceFeedWorkspaceVisibilityMode("shadow"), "shadow");
  assert.equal(coerceFeedWorkspaceVisibilityMode("preview"), "preview");
  assert.equal(coerceFeedWorkspaceVisibilityMode("on"), "on");
  assert.equal(coerceFeedWorkspaceVisibilityMode("weird"), "off");
  assert.equal(coerceFeedWorkspaceVisibilityMode(" ON "), "on");
  const missing = resolveFeedWorkspaceVisibilityMode({ raw: null, isOverride: true });
  assert.equal(missing.mode, "off");
  ok("off/shadow/preview/on; invalid → off");
}

console.log("\n[feed-workspace-visibility] layout visible gate");

{
  assert.equal(
    isFeedWorkspaceLayoutVisible({ mode: "off", previewRequested: true }),
    false,
  );
  assert.equal(
    isFeedWorkspaceLayoutVisible({ mode: "shadow", previewRequested: true }),
    false,
  );
  assert.equal(
    isFeedWorkspaceLayoutVisible({ mode: "preview", previewRequested: false }),
    false,
  );
  assert.equal(
    isFeedWorkspaceLayoutVisible({ mode: "preview", previewRequested: true }),
    true,
  );
  assert.equal(
    isFeedWorkspaceLayoutVisible({ mode: "on", previewRequested: false }),
    true,
  );
  assert.equal(parseFeedWorkspacePreviewRequested("1"), true);
  assert.equal(parseFeedWorkspacePreviewRequested("0"), false);
  assert.equal(parseFeedWorkspacePreviewRequested(undefined), false);
  ok("PREVIEW needs query; ON always; OFF/SHADOW never");
}

console.log("\n[feed-workspace-visibility] AvailableSpace layout matrix");

{
  const mobilePortrait = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  assert.equal(mobilePortrait.layoutMode, "mobile-portrait");
  assert.equal(mobilePortrait.orientation, "portrait");
  assert.equal(mobilePortrait.supportingPanelCount, 0);
  assert.equal(mobilePortrait.showStartPanel, false);
  assert.equal(mobilePortrait.showEndPanel, false);
  ok("390×844 mobile portrait → 0 panels");
}

{
  const mobileLandscape = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 700,
    usableHeightPx: 320,
  });
  assert.equal(mobileLandscape.layoutMode, "mobile-landscape");
  assert.equal(mobileLandscape.orientation, "landscape");
  assert.equal(mobileLandscape.supportingPanelCount, 1);
  assert.equal(mobileLandscape.showStartPanel, false);
  assert.equal(mobileLandscape.showEndPanel, true);
  assert.notEqual(
    mobileLandscape.layoutMode,
    resolveFeedWorkspaceVisibleLayout({
      usableWidthPx: 390,
      usableHeightPx: 844,
    }).layoutMode,
  );
  ok("700×320 mobile landscape → 1 end panel (≠ portrait)");
}

{
  const phoneLandscapeWide = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 844,
    usableHeightPx: 390,
  });
  assert.equal(phoneLandscapeWide.layoutMode, "tablet-landscape");
  assert.equal(phoneLandscapeWide.supportingPanelCount, 1);
  assert.notEqual(
    phoneLandscapeWide.layoutMode,
    resolveFeedWorkspaceVisibleLayout({
      usableWidthPx: 390,
      usableHeightPx: 844,
    }).layoutMode,
  );
  ok("844×390 phone landscape → tablet-landscape 1 panel (≠ portrait)");
}

{
  const largeMobileLandscape = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 932,
    usableHeightPx: 430,
  });
  assert.equal(largeMobileLandscape.layoutMode, "tablet-landscape");
  assert.equal(largeMobileLandscape.supportingPanelCount, 1);
  ok("932×430 large mobile landscape → tablet-landscape, 1 panel");
}

{
  const tabletPortrait = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 768,
    usableHeightPx: 1024,
  });
  assert.equal(tabletPortrait.layoutMode, "tablet-portrait");
  assert.equal(tabletPortrait.supportingPanelCount, 1);
  ok("768×1024 tablet portrait → 1 panel");
}

{
  const tabletLandscape = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 1024,
    usableHeightPx: 768,
  });
  assert.equal(tabletLandscape.layoutMode, "desktop");
  assert.equal(tabletLandscape.supportingPanelCount, 2);
  assert.equal(tabletLandscape.showStartPanel, true);
  assert.equal(tabletLandscape.showEndPanel, true);
  assert.notEqual(
    tabletLandscape.layoutMode,
    resolveFeedWorkspaceVisibleLayout({
      usableWidthPx: 768,
      usableHeightPx: 1024,
    }).layoutMode,
  );
  ok("1024×768 tablet landscape → desktop 2 panels (≠ tablet portrait)");
}

{
  const laptop = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 1280,
    usableHeightPx: 800,
  });
  assert.equal(laptop.layoutMode, "desktop");
  assert.equal(laptop.supportingPanelCount, 2);
  ok("1280×800 laptop → 2 panels");
}

{
  const wide = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 1728,
    usableHeightPx: 1117,
  });
  assert.equal(wide.layoutMode, "desktop-wide");
  assert.equal(wide.supportingPanelCount, 2);
  ok("1728×1117 wide desktop → desktop-wide 2 panels");
}

{
  const constrained = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 900,
    usableHeightPx: 1100,
  });
  assert.equal(constrained.layoutMode, "tablet-portrait");
  assert.equal(constrained.supportingPanelCount, 1);
  ok("900×1100 constrained tablet portrait → 1 panel");
}

{
  const shortLandscape = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 700,
    usableHeightPx: 320,
  });
  assert.equal(shortLandscape.orientation, "landscape");
  assert.equal(shortLandscape.supportingPanelCount, 1);
  ok("700×320 short landscape → 1 panel via landscape carve-out");
}

{
  const a = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 1280.9,
    usableHeightPx: 800.2,
  });
  const b = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: 1280,
    usableHeightPx: 800,
  });
  assert.equal(a.stabilityToken, b.stabilityToken);
  assert.equal(a.stabilityToken.includes("T"), false);
  ok("stability token deterministic; no timestamps");
}

console.log("\n[feed-workspace-visibility] source contracts");

{
  const shellSrc = readFileSync(
    join(root, "components/adaptive-workspace/FeedControlledHostShell.tsx"),
    "utf8",
  );
  assert.match(shellSrc, /visibilityMode/);
  assert.match(shellSrc, /layoutVisible/);
  assert.match(shellSrc, /mode === "off"/);
  assert.equal(/userAgent|navigator\.userAgent/.test(shellSrc), false);
  ok("shell gated by visibility; no UA detection");

  const homeSrc = readFileSync(
    join(root, "components/home/HomePageClient.tsx"),
    "utf8",
  );
  assert.match(homeSrc, /FeedWorkspaceVisibleLayout/);
  assert.match(homeSrc, /isFeedWorkspaceLayoutVisible/);
  assert.match(homeSrc, /legacyFeedTree/);
  assert.match(homeSrc, /visibleWorkspaceTree/);
  assert.equal(/userAgent|navigator\.userAgent/.test(homeSrc), false);
  assert.equal(
    (homeSrc.match(/from "@\/components\/home\/HomeGeoFeedDynamic"/g) || [])
      .length,
    1,
  );
  ok("homepage OFF/ON trees; no UA; single GeoFeed import");

  const pageSrc = readFileSync(join(root, "app/page.tsx"), "utf8");
  assert.match(pageSrc, /resolveFeedWorkspaceVisibilityMode/);
  assert.match(pageSrc, /parseFeedWorkspacePreviewRequested/);
  assert.match(pageSrc, /awFeedWorkspace/);
  ok("homepage SSR resolves visibility + preview query");

  const layoutSrc = readFileSync(
    join(
      root,
      "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx",
    ),
    "utf8",
  );
  assert.match(layoutSrc, /resolveFeedWorkspaceVisibleLayout/);
  assert.match(layoutSrc, /ResizeObserver/);
  assert.equal(/userAgent|navigator\.userAgent/.test(layoutSrc), false);
  assert.equal(/matchMedia/.test(layoutSrc), false);
  ok("visible layout uses AvailableSpace RO; no matchMedia/UA");
}

console.log(`\n[feed-workspace-visibility] ${passed} passed\n`);

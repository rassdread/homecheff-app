/**
 * Feed Workspace visibility + visible-layout resolver tests (Node/tsx).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  WORKSPACE_TRANSITION_CONTINUITY,
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

console.log("\n[feed-workspace-visibility] flag edge cases");

{
  for (const raw of ["", " ", "enabled", "true", "1", "ONN"]) {
    assert.equal(
      resolveFeedWorkspaceVisibilityMode({ raw, isOverride: true }).mode,
      "off",
      `expected off for ${JSON.stringify(raw)}`,
    );
  }
  assert.equal(coerceFeedWorkspaceVisibilityMode("Off"), "off");
  assert.equal(coerceFeedWorkspaceVisibilityMode("SHADOW"), "shadow");
  assert.equal(coerceFeedWorkspaceVisibilityMode("PreView"), "preview");
  // Query cannot force ON when mode is off
  assert.equal(
    isFeedWorkspaceLayoutVisible({ mode: "off", previewRequested: true }),
    false,
  );
  // Query cannot force visibility when mode is on... wait ON doesn't need query
  assert.equal(
    isFeedWorkspaceLayoutVisible({ mode: "on", previewRequested: false }),
    true,
  );
  ok("invalid/empty → off; case-insensitive valid; query cannot force ON from off");
}

console.log("\n[feed-workspace-visibility] ultra-wide feed column cap");

{
  for (const [w, h, mode] of [
    [1280, 800, "desktop"],
    [1440, 900, "desktop-wide"],
    [1728, 1117, "desktop-wide"],
    [1920, 1080, "desktop-wide"],
    [2560, 1440, "desktop-wide"],
  ] as const) {
    const plan = resolveFeedWorkspaceVisibleLayout({
      usableWidthPx: w,
      usableHeightPx: h,
    });
    assert.equal(plan.layoutMode, mode, `${w}x${h}`);
    assert.equal(plan.supportingPanelCount, 2);
    assert.equal(plan.feedColumnMaxWidthPx, 720);
    assert.ok(plan.usableWidthPx >= plan.feedColumnMaxWidthPx);
  }
  ok("wide viewports: desktop-wide + feedColumnMaxWidthPx=720");
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
  assert.match(homeSrc, /hc-aw-full-bleed/);
  assert.match(homeSrc, /max-w-none/);
  assert.equal(/userAgent|navigator\.userAgent/.test(homeSrc), false);
  assert.equal(
    (homeSrc.match(/from "@\/components\/home\/HomeGeoFeedDynamic"/g) || [])
      .length,
    1,
  );
  // Visible tree must not branch GeoFeed on showDesktopComposedLayout
  const visibleBlock = homeSrc.slice(
    homeSrc.indexOf("const visibleWorkspaceTree"),
    homeSrc.indexOf("const pageShellClass"),
  );
  assert.match(visibleBlock, /homeComposedLayout=\{false\}/);
  assert.equal(/showDesktopComposedLayout/.test(visibleBlock), false);
  assert.equal(
    (visibleBlock.match(/<GeoFeed/g) || []).length,
    1,
    "exactly one GeoFeed in visible tree",
  );
  ok("stable visible tree: one GeoFeed; full-bleed; no lg branch");

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
  assert.match(layoutSrc, /data-aw-stable-feed-slot/);
  assert.match(layoutSrc, /feedColumnMaxWidthPx/);
  assert.equal(/userAgent|navigator\.userAgent/.test(layoutSrc), false);
  assert.equal(/matchMedia/.test(layoutSrc), false);

  // Layer 1 — primary slot must use the sealed continuity constant (not a Mode key).
  assert.match(
    layoutSrc,
    /key=\{WORKSPACE_TRANSITION_CONTINUITY\.primarySlotKey\}/,
  );
  assert.equal(
    (layoutSrc.match(/key=\{WORKSPACE_TRANSITION_CONTINUITY\.primarySlotKey\}/g) || [])
      .length,
    1,
    "exactly one primary-slot continuity key usage",
  );
  assert.equal(
    (layoutSrc.match(/data-aw-slot-host="primary"/g) || []).length,
    1,
    "exactly one primary slot host",
  );
  assert.equal(
    /key=\{[^}]*modePlan|key=\{[^}]*\.mode\b|key=\{[^}]*modeToken|key=\{[^}]*posture/.test(
      layoutSrc,
    ),
    false,
    "no Mode/posture React keys",
  );
  assert.equal(
    /key=["']aw-slot-primary["']/.test(layoutSrc),
    false,
    "do not duplicate primary slot literal outside the continuity contract",
  );
  assert.equal(
    /key=\{[^}]*Math\.random|key=\{[^}]*Date\.now|key=\{[^}]*crypto/.test(
      layoutSrc,
    ),
    false,
    "no generated/unstable primary keys",
  );

  // Layer 2 — contract value is the stable permanent-slot identity.
  assert.equal(
    WORKSPACE_TRANSITION_CONTINUITY.primarySlotKey,
    "aw-slot-primary",
  );
  assert.equal(
    WORKSPACE_TRANSITION_CONTINUITY.neverKeyPrimaryByMode,
    true,
  );
  ok(
    "visible layout: continuity primarySlotKey + AvailableSpace; no matchMedia/UA",
  );

  // Negative fixtures — synthetic sources the guard must reject.
  {
    const reject = (label: string, sample: string, re: RegExp) => {
      assert.equal(re.test(sample), false, label);
    };
    const requireMatch = (label: string, sample: string, re: RegExp) => {
      assert.match(sample, re, label);
    };

    // Approved shape still matches Layer 1 expression.
    requireMatch(
      "approved continuity primary key",
      'key={WORKSPACE_TRANSITION_CONTINUITY.primarySlotKey}',
      /key=\{WORKSPACE_TRANSITION_CONTINUITY\.primarySlotKey\}/,
    );

    reject(
      "Mode-dependent key rejected",
      'key={modePlan.mode}',
      /key=\{WORKSPACE_TRANSITION_CONTINUITY\.primarySlotKey\}/,
    );
    reject(
      "random key rejected",
      'key={Math.random()}',
      /key=\{WORKSPACE_TRANSITION_CONTINUITY\.primarySlotKey\}/,
    );
    reject(
      "local unapproved constant rejected",
      'key={LOCAL_PRIMARY_KEY}',
      /key=\{WORKSPACE_TRANSITION_CONTINUITY\.primarySlotKey\}/,
    );
    reject(
      "alternate literal key rejected as continuity expression",
      'key="aw-slot-other"',
      /key=\{WORKSPACE_TRANSITION_CONTINUITY\.primarySlotKey\}/,
    );

    // Changed contract value would fail Layer 2.
    assert.notEqual("aw-slot-other", "aw-slot-primary");
    assert.equal(
      WORKSPACE_TRANSITION_CONTINUITY.primarySlotKey === "aw-slot-other",
      false,
      "primarySlotKey must not drift to alternate literal",
    );

    // Duplicate primary hosts fail the count invariant.
    const dupHosts =
      'data-aw-slot-host="primary"\ndata-aw-slot-host="primary"';
    assert.equal(
      (dupHosts.match(/data-aw-slot-host="primary"/g) || []).length,
      2,
    );
    assert.notEqual(
      (dupHosts.match(/data-aw-slot-host="primary"/g) || []).length,
      1,
      "duplicate primary hosts must not satisfy single-host invariant",
    );

    // Removing continuity constant from primary slot fails Layer 1.
    const withoutContinuity =
      'key="aw-slot-primary"\ndata-aw-slot-host="primary"';
    assert.equal(
      /key=\{WORKSPACE_TRANSITION_CONTINUITY\.primarySlotKey\}/.test(
        withoutContinuity,
      ),
      false,
      "literal-only primary key without continuity constant is rejected",
    );
  }
  ok("primary-slot continuity guard negative fixtures");

  const authDoc = readFileSync(
    join(
      root,
      "docs/architecture/homecheff-adaptive-workspace-presentation-only-authority.md",
    ),
    "utf8",
  );
  assert.match(authDoc, /PRESENTATION-ONLY WORKSPACE ACTIVATION/);
  assert.match(authDoc, /COMMIT_READY/);
  ok("presentation-only authority doc present");
}

console.log(`\n[feed-workspace-visibility] ${passed} passed\n`);

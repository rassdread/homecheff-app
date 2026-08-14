/**
 * WX Phase 1B.4 — Landscape Work Posture contract tests.
 * Pure policy + source seals. Browser mount claimed by probe only.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LANDSCAPE_WORK_POSTURE,
  isSameLandscapeWorkPosturePlan,
  resolveLandscapeWorkPosture,
} from "../resolve-landscape-work-posture";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

const groups: string[] = [];
let assertions = 0;

function begin(name: string) {
  groups.push(name);
  console.log(`\n[landscape-work-posture] ${name}`);
}

function ok(label: string) {
  assertions += 1;
  console.log(`  ✓ ${label}`);
}

begin("contract constants");
{
  assert.equal(LANDSCAPE_WORK_POSTURE.phase, "1b.4");
  assert.equal(
    LANDSCAPE_WORK_POSTURE.contractId,
    "wx-landscape-work-posture-v1",
  );
  assert.equal(LANDSCAPE_WORK_POSTURE.neverInspectUserAgent, true);
  assert.equal(LANDSCAPE_WORK_POSTURE.neverInspectDevice, true);
  assert.equal(LANDSCAPE_WORK_POSTURE.presentationOnly, true);
  ok("sealed landscape work posture constants");
}

begin("AvailableSpace geometry only");
{
  const portrait = resolveLandscapeWorkPosture({
    usableWidthPx: 390,
    usableHeightPx: 844,
  });
  assert.equal(portrait.posture, "portrait");
  assert.equal(portrait.workPostureActive, false);
  assert.equal(portrait.bottomNavCollapsed, false);
  assert.equal(portrait.orientationCompact, false);
  assert.equal(portrait.shortChromeCompact, false);
  assert.equal(portrait.chromeDensity, "standard");

  const landscape = resolveLandscapeWorkPosture({
    usableWidthPx: 844,
    usableHeightPx: 390,
  });
  assert.equal(landscape.posture, "landscape");
  assert.equal(landscape.workPostureActive, true);
  assert.equal(landscape.bottomNavCollapsed, true);
  assert.equal(landscape.orientationCompact, true);
  assert.equal(landscape.shortChromeCompact, true);
  assert.equal(landscape.chromeDensity, "compact");
  assert.equal(landscape.phase, "1b.4");
  assert.equal(landscape.contractId, "wx-landscape-work-posture-v1");
  ok("portrait discovery vs landscape work presentation");
}

begin("tablet / desktop / ultrawide landscape");
{
  for (const [w, h] of [
    [1024, 768],
    [1440, 900],
    [2560, 1080],
  ] as const) {
    const plan = resolveLandscapeWorkPosture({
      usableWidthPx: w,
      usableHeightPx: h,
    });
    assert.equal(plan.workPostureActive, true, `${w}x${h}`);
    assert.equal(plan.bottomNavCollapsed, true, `${w}x${h}`);
    assert.equal(plan.shortChromeCompact, false, `${w}x${h} tall — no short chrome`);
  }
  ok("tablet/desktop/ultrawide landscape collapses bottom nav");
}

begin("fail-closed non-finite");
{
  const bad = resolveLandscapeWorkPosture({
    usableWidthPx: Number.NaN,
    usableHeightPx: -10,
  });
  assert.equal(bad.posture, "portrait");
  assert.equal(bad.workPostureActive, false);
  ok("invalid sizes fail closed to portrait discovery chrome");
}

begin("plan equality");
{
  const a = resolveLandscapeWorkPosture({
    usableWidthPx: 800,
    usableHeightPx: 400,
  });
  const b = resolveLandscapeWorkPosture({
    usableWidthPx: 800,
    usableHeightPx: 400,
  });
  assert.equal(isSameLandscapeWorkPosturePlan(a, b), true);
  const c = resolveLandscapeWorkPosture({
    usableWidthPx: 801,
    usableHeightPx: 400,
  });
  assert.equal(isSameLandscapeWorkPosturePlan(a, c), false);
  ok("isSameLandscapeWorkPosturePlan");
}

begin("source seals — no UA/device branching in policy + chrome");
{
  const policy = readFileSync(
    join(root, "lib/adaptive-workspace-react/resolve-landscape-work-posture.ts"),
    "utf8",
  );
  // Policy must not call browser UA/device APIs (constants may name the prohibition).
  assert.equal(/\bnavigator\.|matchMedia\s*\(/i.test(policy), false);
  assert.equal(
    /if\s*\([^)]*(iPhone|iPad|Android|isTablet|isPhone)/i.test(policy),
    false,
  );

  const provider = readFileSync(
    join(root, "components/adaptive-workspace/WorkspaceChromeProvider.tsx"),
    "utf8",
  );
  assert.equal(/userAgent|navigator\.userAgent/i.test(provider), false);
  assert.match(provider, /visualViewport/);
  assert.match(provider, /resolveLandscapeWorkPosture/);

  const bottomVis = readFileSync(
    join(root, "lib/layout/bottomNavVisibility.ts"),
    "utf8",
  );
  assert.match(bottomVis, /bottomNavBarVisibleClass/);
  assert.match(bottomVis, /Landscape Work Posture/);

  const bottomNav = readFileSync(
    join(root, "components/navigation/BottomNavigation.tsx"),
    "utf8",
  );
  assert.match(bottomNav, /useLandscapeWorkPosture/);
  assert.match(bottomNav, /bottomNavBarVisibleClass/);
  assert.match(bottomNav, /data-wx-bottom-nav-collapsed/);
  assert.match(bottomNav, /data-hc-bottom-nav-shell/);
  assert.match(bottomNav, /aria-hidden/);

  const strip = readFileSync(
    join(root, "components/adaptive-workspace/WorkspaceOrientationStrip.tsx"),
    "utf8",
  );
  assert.match(strip, /orientationCompact/);
  assert.match(strip, /data-wx-orientation-compact/);
  assert.match(strip, /shortChromeCompact|workToolbar|data-wx-work-toolbar/);

  const navBar = readFileSync(join(root, "components/NavBar.tsx"), "utf8");
  assert.match(navBar, /data-wx-mobile-create/);
  assert.match(navBar, /data-wx-mobile-mijn-hcp/);
  assert.match(navBar, /\/mijn-hcp/);
  assert.match(navBar, /shortChromeCompact|shortLandscapeChrome/);
  assert.match(navBar, /data-wx-navbar/);

  const layout = readFileSync(
    join(root, "components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx"),
    "utf8",
  );
  assert.match(layout, /data-wx-phase="(?:1b\.5\.[0-9]+|1c(?:\.1)?)"/);
  assert.match(layout, /h-full overflow-hidden/);
  assert.match(layout, /data-wx-cap-visual-activation="0"/);
  ok("presentation wiring sealed; 1B.2.1 + capability diagnostics + nav preservation retained");
}

begin("module has no timers / polling");
{
  const provider = readFileSync(
    join(root, "components/adaptive-workspace/WorkspaceChromeProvider.tsx"),
    "utf8",
  );
  assert.equal(/setInterval|requestAnimationFrame|setTimeout/i.test(provider), false);
  ok("chrome provider uses resize listeners only");
}

console.log(
  `\n[landscape-work-posture] SUMMARY ${JSON.stringify({
    groups: groups.length,
    assertions,
  })}`,
);
console.log(
  `[landscape-work-posture] ${assertions} assertions across ${groups.length} groups\n`,
);

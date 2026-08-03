#!/usr/bin/env node
/**
 * WX Phase 1C — Visible Adaptive Workspace browser proof.
 *
 * Asserts AvailableSpace-first presentation:
 * - workspace class / density / chrome insets
 * - landscape bottom-nav collapsed + height reclaim
 * - rail-owns-filters when start rail present
 * - continuity remount = 0 across rotation
 * - planners remain diagnostics-only (drives-chrome = 0)
 * - create / search / feed remain reachable
 *
 *   HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on \\
 *     NEXT_PUBLIC_FEED_SEALED_BASELINE=1 npx next start -H 127.0.0.1 -p 3118
 *   node scripts/probe-wx-phase1c-visible-adaptive.mjs --base-url=http://127.0.0.1:3118
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

const VIEWPORTS = [
  { id: "phone-portrait", w: 390, h: 844, expectClass: "phone-portrait", expectRails: [false, false] },
  { id: "phone-landscape", w: 700, h: 320, expectClass: "phone-landscape", expectRails: [false, true] },
  { id: "tablet-portrait", w: 768, h: 1024, expectClass: "tablet-portrait", expectRails: [false, true] },
  { id: "tablet-landscape", w: 900, h: 600, expectClass: "tablet-landscape", expectRails: [false, true] },
  { id: "laptop", w: 1100, h: 700, expectClass: "laptop", expectRails: [true, true] },
  { id: "desktop", w: 1280, h: 800, expectClass: "desktop", expectRails: [true, true] },
  { id: "ultrawide", w: 2560, h: 1440, expectClass: "ultrawide", expectRails: [true, true] },
];

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3118";
  let outDir = join(process.cwd(), "docs/audits/wx-phase1c-visible-adaptive-workspace");
  let journey = false;
  for (const a of argv) {
    if (a.startsWith("--base-url=")) baseUrl = a.slice(11);
    if (a.startsWith("--out-dir=")) outDir = a.slice(10);
    if (a === "--journey") journey = true;
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), outDir, journey };
}

function chromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  for (const p of [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    join(homedir(), "Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium"),
  ]) if (existsSync(p)) return p;
  throw new Error("Chrome not found");
}

async function dismiss(page) {
  try {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) =>
        /accepteer alle|accept all|alleen noodzakelijk/i.test(x.textContent || ""),
      );
      b?.click();
    });
    await new Promise((r) => setTimeout(r, 350));
  } catch { /* */ }
}

async function snap(page) {
  return page.evaluate(() => {
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const feed = document.querySelector("#homecheff-feed-desktop, [data-homecheff-feed], #homecheff-feed");
    const primary = document.querySelector("[data-wx-primary-mount-id]");
    const orient = document.querySelector("[data-wx-orientation-strip]");
    const startHost = document.querySelector("[data-aw-slot-host='start']");
    const endHost = document.querySelector("[data-aw-slot-host='end']");
    const filterHost = document.querySelector("[data-wx-filter-portal-host]");
    const stageCompact = document.querySelector("[data-wx-discovery-chrome='stage-compact']");
    const createBtn = document.querySelector(
      "[data-wx-primary-action], [data-wx-mobile-create], [data-wx-primary-action-mobile], a[href*='sell/new']",
    );
    const search = document.querySelector(
      "input[type='search'], input[name='q'], input[placeholder*='Zoek'], input[placeholder*='Search'], [data-wx-discovery-chrome], [data-wx-filter-portal-host], [data-home-sidebar='discovery-filters'], [data-wx-filters-toggle], [data-mobile-filter-collapsed], button[aria-label*='Filter'], button[aria-label*='filter']",
    );
    const bottomNav = document.querySelector(
      "nav[data-wx-bottom-nav-collapsed='0'], [data-bottom-nav]:not([hidden])",
    );
    const wsRect = ws?.getBoundingClientRect();
    const feedRect = feed?.getBoundingClientRect();
    const overlaps = (() => {
      const collapsed = document.documentElement.dataset.wxBottomNavCollapsed === "1";
      if (collapsed) return false;
      if (!ws || !bottomNav) return false;
      const style = getComputedStyle(bottomNav);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
        return false;
      }
      const a = ws.getBoundingClientRect();
      const b = bottomNav.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) return false;
      return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    })();
    return {
      phase: ws?.getAttribute("data-wx-phase"),
      visibleAdaptive: ws?.getAttribute("data-wx-visible-adaptive"),
      workspaceClass: ws?.getAttribute("data-wx-workspace-class"),
      visibleDensity: ws?.getAttribute("data-wx-visible-density"),
      railOwnsFilters: ws?.getAttribute("data-wx-rail-owns-filters"),
      stageOwnsFilters: ws?.getAttribute("data-wx-stage-owns-filters"),
      chromeBottomRem: ws?.getAttribute("data-wx-chrome-bottom-rem"),
      scrollOwner: document.querySelector("[data-wx-scroll-owner]")?.getAttribute("data-wx-scroll-owner"),
      continuityRemount: ws?.getAttribute("data-wx-continuity-remount"),
      primaryMountId: primary?.getAttribute("data-wx-primary-mount-id"),
      shellMountId: ws?.getAttribute("data-wx-shell-mount-id"),
      layoutMode: ws?.getAttribute("data-aw-layout-mode"),
      supportingPanels: ws?.getAttribute("data-aw-supporting-panels"),
      startHidden: startHost ? startHost.classList.contains("hidden") : true,
      endHidden: endHost ? endHost.classList.contains("hidden") : true,
      filterPortalPresent: Boolean(filterHost),
      stageCompact: Boolean(stageCompact),
      orientationCompact: orient?.getAttribute("data-wx-orientation-compact"),
      bottomNavCollapsed: document.documentElement.dataset.wxBottomNavCollapsed || null,
      presentationDrivesChrome: ws?.getAttribute("data-wx-presentation-drives-chrome"),
      assistDrivesChrome: ws?.getAttribute("data-wx-assist-drives-chrome"),
      honestyAppliesCompaction: ws?.getAttribute("data-wx-honesty-applies-compaction"),
      intentDrivesChrome: ws?.getAttribute("data-wx-intent-drives-chrome"),
      capVisualActivation: ws?.getAttribute("data-wx-cap-visual-activation"),
      createReachable: Boolean(createBtn),
      searchOrFiltersReachable: Boolean(search),
      feedPresent: Boolean(feed),
      workspaceHeight: wsRect ? Math.round(wsRect.height) : 0,
      feedVisibleHeight: feedRect ? Math.round(Math.min(feedRect.bottom, window.innerHeight) - Math.max(feedRect.top, 0)) : 0,
      chromeOverlap: overlaps,
      deadSpaceRatio: wsRect && feedRect && wsRect.width > 0
        ? Number(((wsRect.width - Math.min(feedRect.width, wsRect.width)) / wsRect.width).toFixed(3))
        : null,
    };
  });
}

function evaluateViewport(vp, s) {
  const checks = {
    phase1c: s.phase === "1c",
    visibleContract: s.visibleAdaptive === "wx-visible-adaptive-workspace-v1",
    workspaceClass: s.workspaceClass === vp.expectClass,
    startRail: s.startHidden === !vp.expectRails[0],
    endRail: s.endHidden === !vp.expectRails[1],
    railOwnsFilters: s.railOwnsFilters === (vp.expectRails[0] ? "1" : "0"),
    continuityRemount0: s.continuityRemount === "0",
    plannersNonDriving:
      s.presentationDrivesChrome === "0" &&
      s.assistDrivesChrome === "0" &&
      s.honestyAppliesCompaction === "0" &&
      s.intentDrivesChrome === "0" &&
      s.capVisualActivation === "0",
    feedPresent: s.feedPresent,
    createReachable: s.createReachable,
    searchOrFiltersReachable: s.searchOrFiltersReachable,
    noChromeOverlap: s.chromeOverlap === false,
  };
  if (vp.h < vp.w) {
    checks.landscapeBottomCollapsed = s.bottomNavCollapsed === "1";
    checks.landscapeChromeReclaim = s.chromeBottomRem === "0";
    checks.orientationCompact = s.orientationCompact === "1";
  } else {
    checks.portraitBottomNav = s.bottomNavCollapsed === "0" || s.bottomNavCollapsed == null;
  }
  if (vp.expectRails[0]) {
    checks.filterPortalOrStageCompact = s.filterPortalPresent || s.stageCompact;
  }
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  return { checks, pass: failed.length === 0, failed };
}

async function main() {
  const { baseUrl, outDir, journey } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });
  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1280,800"],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const results = [];
  let primaryMountStable = null;
  let shellMountStable = null;

  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await dismiss(page);
    await page.waitForSelector("[data-aw-feed-workspace]", { timeout: 45000 }).catch(() => null);
    await new Promise((r) => setTimeout(r, 1200));
    const s = await snap(page);
    if (primaryMountStable == null) primaryMountStable = s.primaryMountId;
    if (shellMountStable == null) shellMountStable = s.shellMountId;
    const evalResult = evaluateViewport(vp, s);
    results.push({
      viewport: vp,
      snap: s,
      ...evalResult,
      mountContinuity: {
        primarySame: s.primaryMountId === primaryMountStable,
        shellSame: s.shellMountId === shellMountStable,
      },
    });
    console.log(
      `${vp.id} ${vp.w}x${vp.h} → ${evalResult.pass ? "PASS" : "FAIL"} class=${s.workspaceClass} rails=${!s.startHidden}/${!s.endHidden}`,
    );
    if (!evalResult.pass) console.log("  failed:", evalResult.failed.join(", "));
  }

  let rotation = null;
  if (journey) {
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await dismiss(page);
    await page.waitForSelector("[data-aw-feed-workspace]", { timeout: 45000 }).catch(() => null);
    await new Promise((r) => setTimeout(r, 1200));
    const before = await snap(page);
    await page.setViewport({ width: 844, height: 390 });
    await new Promise((r) => setTimeout(r, 900));
    const after = await snap(page);
    await page.setViewport({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 900));
    const back = await snap(page);
    rotation = {
      before,
      after,
      back,
      primaryStable:
        before.primaryMountId === after.primaryMountId &&
        after.primaryMountId === back.primaryMountId,
      landscapeWorked:
        after.bottomNavCollapsed === "1" && after.chromeBottomRem === "0",
      portraitRestored:
        back.workspaceClass === "phone-portrait" &&
        (back.bottomNavCollapsed === "0" || back.bottomNavCollapsed == null),
    };
    console.log(
      `rotation → primaryStable=${rotation.primaryStable} landscape=${rotation.landscapeWorked} portrait=${rotation.portraitRestored}`,
    );
  }

  const allPass =
    results.every((r) => r.pass) &&
    (rotation
      ? rotation.primaryStable && rotation.landscapeWorked && rotation.portraitRestored
      : true) &&
    consoleErrors.length === 0;

  const proof = {
    phase: "1c",
    contractId: "wx-visible-adaptive-workspace-v1",
    baseUrl,
    generatedAt: new Date().toISOString(),
    verdict: allPass ? "WX_PHASE_1C_PASS" : "WX_PHASE_1C_FAIL",
    viewports: results,
    rotation,
    consoleErrors: consoleErrors.slice(0, 20),
    summary: {
      viewportPass: results.filter((r) => r.pass).length,
      viewportTotal: results.length,
      consoleErrorCount: consoleErrors.length,
    },
  };

  writeFileSync(join(outDir, "browser-proof.json"), JSON.stringify(proof, null, 2));
  writeFileSync(
    join(outDir, "screen-matrix.json"),
    JSON.stringify(
      results.map((r) => ({
        id: r.viewport.id,
        size: `${r.viewport.w}x${r.viewport.h}`,
        workspaceClass: r.snap.workspaceClass,
        density: r.snap.visibleDensity,
        rails: [!r.snap.startHidden, !r.snap.endHidden],
        railOwnsFilters: r.snap.railOwnsFilters,
        scrollOwner: r.snap.scrollOwner,
        pass: r.pass,
      })),
      null,
      2,
    ),
  );
  console.log(`\nWrote ${join(outDir, "browser-proof.json")}`);
  console.log(`Verdict: ${proof.verdict}`);
  await browser.close();
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

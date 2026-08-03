#!/usr/bin/env node
/**
 * WX Phase 1C.1 — Launch Readiness Corrections browser proof.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

const VIEWPORTS = [
  { id: "phone-portrait", w: 390, h: 844, expectClass: "phone-portrait", expectRails: [false, false] },
  { id: "phone-landscape", w: 844, h: 390, expectClass: "tablet-landscape", expectRails: [true, false] },
  { id: "tablet-portrait", w: 768, h: 1024, expectClass: "tablet-portrait", expectRails: [true, false] },
  { id: "tablet-landscape", w: 900, h: 600, expectClass: "tablet-landscape", expectRails: [true, false] },
  { id: "laptop", w: 1100, h: 700, expectClass: "laptop", expectRails: [true, true] },
  { id: "desktop", w: 1280, h: 800, expectClass: "desktop", expectRails: [true, true] },
  { id: "ultrawide", w: 2560, h: 1440, expectClass: "ultrawide", expectRails: [true, true] },
];

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3119";
  let outDir = join(process.cwd(), "docs/audits/wx-phase1c1-launch-readiness-corrections");
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
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      document.querySelectorAll('[role="dialog"], .fixed.inset-0').forEach((el) => {
        if (/privacy|cookie|accepteer/i.test(el.textContent || "")) el.style.display = "none";
      });
    });
  } catch { /* */ }
}

async function snap(page) {
  return page.evaluate(() => {
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const strip = document.querySelector("[data-wx-orientation-strip]");
    const collapsed = document.documentElement.dataset.wxBottomNavCollapsed === "1";
    const primaryCreates = [...document.querySelectorAll("[data-wx-primary-action]")].filter((el) => {
      if (collapsed && el.hasAttribute("data-wx-bottom-create")) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 8 && r.height > 8 && s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0";
    });
    const secondaryCreates = [...document.querySelectorAll("[data-wx-create-secondary]")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 8 && r.height > 8;
    });
    const bottomCreate = document.querySelector("[data-wx-bottom-create]");
    const bottomCreateVisible = (() => {
      if (collapsed || !bottomCreate) return false;
      const r = bottomCreate.getBoundingClientRect();
      const s = getComputedStyle(bottomCreate);
      return r.width > 8 && r.height > 8 && s.display !== "none" && s.visibility !== "hidden";
    })();
    const landscapeCreateEl = document.querySelector("[data-wx-landscape-create]");
    const landscapeCreateVisible = (() => {
      if (!landscapeCreateEl) return false;
      const r = landscapeCreateEl.getBoundingClientRect();
      const s = getComputedStyle(landscapeCreateEl);
      return r.width > 8 && r.height > 8 && s.display !== "none" && s.visibility !== "hidden";
    })();
    const search = document.querySelector("[data-wx-feed-search]");
    const empty = document.querySelector("[data-wx-empty-guidance]");
    const startHost = document.querySelector("[data-aw-slot-host='start']");
    const endHost = document.querySelector("[data-aw-slot-host='end']");
    const stripH = strip ? strip.getBoundingClientRect().height : 0;
    const stripPct = window.innerHeight ? stripH / window.innerHeight : 0;
    const feedSearchVisible = (() => {
      if (!search) return false;
      const r = search.getBoundingClientRect();
      const s = getComputedStyle(search);
      return r.width > 20 && r.height > 10 && s.display !== "none";
    })();
    return {
      phase: ws?.getAttribute("data-wx-phase"),
      workspaceClass: ws?.getAttribute("data-wx-workspace-class"),
      continuityRemount: ws?.getAttribute("data-wx-continuity-remount"),
      primaryMountId: document.querySelector("[data-wx-primary-mount-id]")?.getAttribute("data-wx-primary-mount-id"),
      startHidden: !startHost || startHost.classList.contains("hidden"),
      endHidden: !endHost || endHost.classList.contains("hidden"),
      railOwnsFilters: ws?.getAttribute("data-wx-rail-owns-filters"),
      bottomNavCollapsed: document.documentElement.dataset.wxBottomNavCollapsed || "0",
      primaryCreateCount: primaryCreates.length,
      secondaryCreateCount: secondaryCreates.length,
      bottomCreateVisible,
      landscapeCreateVisible,
      createReachable: primaryCreates.length > 0 || bottomCreateVisible || landscapeCreateVisible,
      landscapeCreate: landscapeCreateVisible,
      searchVisible: feedSearchVisible,
      emptyGuidance: Boolean(empty),
      stripPct: Number(stripPct.toFixed(3)),
      stripOk: stripPct <= 0.14,
      presentationDrivesChrome: ws?.getAttribute("data-wx-presentation-drives-chrome"),
      capVisualActivation: ws?.getAttribute("data-wx-cap-visual-activation"),
    };
  });
}

function evaluate(vp, s) {
  const checks = {
    phase: s.phase === "1c.1",
    workspaceClass: s.workspaceClass === vp.expectClass,
    startRail: s.startHidden === !vp.expectRails[0],
    endRail: s.endHidden === !vp.expectRails[1],
    createReachable: s.createReachable === true,
    searchVisible: s.searchVisible === true,
    stripOk: s.stripOk === true,
    continuity: s.continuityRemount === "0",
    plannersNonDriving: s.presentationDrivesChrome === "0" && s.capVisualActivation === "0",
  };
  if (vp.h < vp.w) {
    checks.landscapeCreatePresent = s.primaryCreateCount >= 1 || s.landscapeCreate === true;
    checks.bottomCollapsed = s.bottomNavCollapsed === "1";
    checks.toolsBeforeCommunity = s.startHidden === false && s.endHidden === true
      || (vp.expectRails[0] && vp.expectRails[1]);
  }
  if (vp.expectRails[0] && vp.expectRails[1]) {
    checks.singlePrimaryCreate = s.primaryCreateCount === 1;
  }
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  return { checks, pass: failed.length === 0, failed };
}

async function main() {
  const { baseUrl, outDir, journey } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, "screenshots"), { recursive: true });
  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  const results = [];
  let mount0 = null;

  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await dismiss(page);
    await page.waitForSelector("[data-aw-feed-workspace]", { timeout: 45000 }).catch(() => null);
    await new Promise((r) => setTimeout(r, 1200));
    const s = await snap(page);
    if (!mount0) mount0 = s.primaryMountId;
    const ev = evaluate(vp, s);
    await page.screenshot({ path: join(outDir, "screenshots", `${vp.id}.png`), fullPage: false });
    results.push({ viewport: vp, snap: s, ...ev });
    console.log(`${vp.id} → ${ev.pass ? "PASS" : "FAIL"} create=${s.primaryCreateCount} search=${s.searchVisible} strip=${s.stripPct} rails=${!s.startHidden}/${!s.endHidden}`);
    if (!ev.pass) console.log("  failed:", ev.failed.join(", "));
  }

  let rotation = null;
  if (journey) {
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await dismiss(page);
    await new Promise((r) => setTimeout(r, 1000));
    const before = await snap(page);
    await page.setViewport({ width: 844, height: 390 });
    await new Promise((r) => setTimeout(r, 900));
    const after = await snap(page);
    await page.screenshot({ path: join(outDir, "screenshots", "rotation-landscape.png"), fullPage: false });
    await page.setViewport({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 900));
    const back = await snap(page);
    rotation = {
      primaryStable: before.primaryMountId === after.primaryMountId && after.primaryMountId === back.primaryMountId,
      landscapeCreate: after.createReachable && after.bottomNavCollapsed === "1",
      portraitCreate: back.createReachable,
      stripPortraitOk: back.stripOk,
    };
    console.log("rotation", rotation);
  }

  const allPass = results.every((r) => r.pass) && (!rotation || (rotation.primaryStable && rotation.landscapeCreate && rotation.portraitCreate));
  const proof = {
    phase: "1c.1",
    generatedAt: new Date().toISOString(),
    baseUrl,
    verdict: allPass ? "WX_PHASE_1C1_PASS" : "WX_PHASE_1C1_FAIL",
    viewports: results,
    rotation,
    summary: {
      pass: results.filter((r) => r.pass).length,
      total: results.length,
    },
  };
  writeFileSync(join(outDir, "browser-proof.json"), JSON.stringify(proof, null, 2));
  writeFileSync(
    join(outDir, "screen-matrix.json"),
    JSON.stringify(
      results.map((r) => ({
        id: r.viewport.id,
        class: r.snap.workspaceClass,
        create: r.snap.primaryCreateCount,
        search: r.snap.searchVisible,
        stripPct: r.snap.stripPct,
        rails: [!r.snap.startHidden, !r.snap.endHidden],
        pass: r.pass,
      })),
      null,
      2,
    ),
  );
  console.log(`\nVerdict: ${proof.verdict}`);
  await browser.close();
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

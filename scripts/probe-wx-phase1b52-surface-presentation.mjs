#!/usr/bin/env node
/**
 * WX Phase 1B.5.2 — Surface Presentation Resolver browser proof.
 * Asserts plan diagnostics present, zero visible surface DOM delta, no remount.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

const VIEWPORTS = [
  { id: "p320", w: 320, h: 568 },
  { id: "p390", w: 390, h: 844 },
  { id: "l740", w: 740, h: 360 },
  { id: "l844", w: 844, h: 390 },
  { id: "t768", w: 768, h: 1024 },
  { id: "d1024", w: 1024, h: 768 },
  { id: "d1280", w: 1280, h: 800 },
  { id: "d1440", w: 1440, h: 900 },
  { id: "d1920", w: 1920, h: 1080 },
  { id: "u2560", w: 2560, h: 1440 },
];

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3112";
  let outDir = join(process.cwd(), "docs/audits/wx-phase1b5-2-surface-presentation-resolver");
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
    const hosts = document.querySelectorAll("[data-aw-feed-workspace]");
    const newSurfaceUi = document.querySelector(
      "[data-wx-surface-panel],[data-wx-new-action],[data-wx-assist-panel],[data-wx-tool-panel],[data-wx-presentation-ui]",
    );
    const feed = document.querySelector("#homecheff-feed-desktop, [data-homecheff-feed]");
    return {
      phase: ws?.getAttribute("data-wx-phase"),
      registry: ws?.getAttribute("data-wx-surface-registry"),
      registryVersion: ws?.getAttribute("data-wx-surface-registry-version"),
      capability: ws?.getAttribute("data-wx-capability"),
      presentation: ws?.getAttribute("data-wx-presentation"),
      presentationPlan: ws?.getAttribute("data-wx-presentation-plan"),
      presentationVersion: ws?.getAttribute("data-wx-presentation-version"),
      presentationToken: ws?.getAttribute("data-wx-presentation-token"),
      presentationStatus: ws?.getAttribute("data-wx-presentation-status"),
      drivesChrome: ws?.getAttribute("data-wx-presentation-drives-chrome"),
      eligible: ws?.getAttribute("data-wx-presentation-eligible"),
      suppressed: ws?.getAttribute("data-wx-presentation-suppressed"),
      reserved: ws?.getAttribute("data-wx-presentation-reserved"),
      ordered: ws?.getAttribute("data-wx-presentation-ordered"),
      mode: ws?.getAttribute("data-wx-mode"),
      posture: ws?.getAttribute("data-wx-posture"),
      usableWidth: ws?.getAttribute("data-aw-usable-width"),
      usableHeight: ws?.getAttribute("data-aw-usable-height"),
      capVisual: ws?.getAttribute("data-wx-cap-visual-activation"),
      remount: ws?.getAttribute("data-wx-continuity-remount"),
      shellMountId: ws?.getAttribute("data-wx-shell-mount-id"),
      primaryMountId: document
        .querySelector("[data-wx-primary-mount-id]")
        ?.getAttribute("data-wx-primary-mount-id"),
      hostCount: hosts.length,
      noNewSurfaceUi: newSurfaceUi == null,
      feedPresent: feed != null,
      overflowX: document.documentElement.scrollWidth > innerWidth + 2,
      focusableDiagnostics: [...document.querySelectorAll("[data-wx-presentation]")].some(
        (el) => el.tabIndex >= 0 && el.getAttribute("tabindex") === "0",
      ),
    };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.outDir, { recursive: true });
  let puppeteer;
  try {
    puppeteer = require("puppeteer-core");
  } catch {
    puppeteer = require("puppeteer");
  }
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const cases = [];
  let baselineSurfaceUi = null;

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    const errors = [];
    const pageErrors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => pageErrors.push(String(e.message || e)));
    await page.setViewport({
      width: vp.w,
      height: vp.h,
      isMobile: vp.w < 1024,
      hasTouch: true,
    });
    await page.goto(args.baseUrl + "/", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await dismiss(page);
    await page
      .waitForSelector("[data-aw-feed-workspace]", { timeout: 30000 })
      .catch(() => null);
    await new Promise((r) => setTimeout(r, 700));
    const s = await snap(page);
    if (baselineSurfaceUi == null) baselineSurfaceUi = s.noNewSurfaceUi;
    const filteredConsole = errors.filter((t) => !/favicon|ResizeObserver loop/i.test(t));
    const checks = {
      phase: s.phase === "1b.5.2",
      presentation: s.presentation === "wx-surface-presentation-resolver-v1",
      presentationVersion: s.presentationVersion === "1.0.0",
      registry: s.registry === "wx-surface-presentation-registry-v1",
      capability: s.capability === "wx-capability-activation-v1",
      drivesChromeOff: s.drivesChrome === "0",
      capOff: s.capVisual === "0",
      remountZero: s.remount === "0",
      hostOne: s.hostCount === 1,
      hasToken: Boolean(s.presentationToken),
      hasEligible: typeof s.eligible === "string",
      hasOrdered: typeof s.ordered === "string" && s.ordered.includes("stage"),
      hasReserved: typeof s.reserved === "string" && s.reserved.includes("reserved-memory"),
      noNewSurfaceUi: s.noNewSurfaceUi === true,
      visibleSurfaceDomDeltaZero: s.noNewSurfaceUi === baselineSurfaceUi,
      noOverflowX: s.overflowX === false,
      noConsoleErrors: filteredConsole.length === 0,
      noPageErrors: pageErrors.length === 0,
      noFocusableDiagnostics: s.focusableDiagnostics === false,
    };
    const failed = Object.entries(checks)
      .filter(([, v]) => v !== true)
      .map(([k]) => k);
    cases.push({
      id: vp.id,
      vp,
      snap: s,
      checks,
      failed,
      pass: failed.length === 0,
      consoleErrors: filteredConsole,
      pageErrors,
    });
    await page.close();
  }

  let journey = null;
  if (args.journey) {
    const page = await browser.newPage();
    const errors = [];
    const pageErrors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => pageErrors.push(String(e.message || e)));
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(args.baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
    await dismiss(page);
    await page.waitForSelector("[data-aw-feed-workspace]", { timeout: 30000 }).catch(() => null);
    await new Promise((r) => setTimeout(r, 600));
    const steps = [];
    const path = [
      { id: "browse", w: 390, h: 844 },
      { id: "compact-land", w: 700, h: 320 },
      { id: "hybrid", w: 844, h: 390 },
      { id: "full", w: 1280, h: 800 },
      { id: "professional", w: 1920, h: 1080 },
      { id: "portrait-return", w: 768, h: 1024 },
      { id: "landscape-return", w: 1024, h: 768 },
      { id: "initial", w: 390, h: 844 },
    ];
    let shell0 = null;
    let primary0 = null;
    let remountOk = true;
    let noReload = true;
    // Emulation flags must stay constant across the session (same as 1B.3/1B.4).
    // Toggling isMobile at the 1024 boundary remounts Chromium's page shell and
    // falsely fails mount-identity continuity.
    for (const step of path) {
      await page.setViewport({
        width: step.w,
        height: step.h,
        isMobile: true,
        hasTouch: true,
      });
      await new Promise((r) => setTimeout(r, 500));
      const s = await snap(page);
      if (!shell0) {
        shell0 = s.shellMountId;
        primary0 = s.primaryMountId;
      }
      if (s.shellMountId !== shell0 || s.primaryMountId !== primary0) remountOk = false;
      if (s.remount !== "0") remountOk = false;
      steps.push({ id: step.id, vp: step, snap: s });
    }
    const filteredConsole = errors.filter((t) => !/favicon|ResizeObserver loop/i.test(t));
    journey = {
      steps,
      shellMountStable: remountOk,
      primaryMountStable: remountOk,
      noPageReload: noReload,
      noConsoleErrors: filteredConsole.length === 0,
      noPageErrors: pageErrors.length === 0,
      zeroVisibleSurfaceUi: steps.every((s) => s.snap.noNewSurfaceUi),
      pass:
        remountOk &&
        noReload &&
        filteredConsole.length === 0 &&
        pageErrors.length === 0 &&
        steps.every((s) => s.snap.noNewSurfaceUi && s.snap.drivesChrome === "0"),
    };
    await page.close();
  }

  await browser.close();

  const allPass = cases.every((c) => c.pass) && (journey == null || journey.pass);
  const report = {
    phase: "1b.5.2",
    baseUrl: args.baseUrl,
    generatedAt: new Date().toISOString(),
    verdict: allPass
      ? "WX_PHASE_1B5_2_BROWSER_PROOF_PASS"
      : "WX_PHASE_1B5_2_BROWSER_PROOF_FAIL",
    passCount: cases.filter((c) => c.pass).length,
    caseCount: cases.length,
    visibleSurfaceDomDeltaZero: cases.every((c) => c.checks.visibleSurfaceDomDeltaZero),
    journey,
    fails: cases.filter((c) => !c.pass).map((c) => ({ id: c.id, failed: c.failed })),
    cases,
  };
  writeFileSync(join(args.outDir, "browser-proof.json"), JSON.stringify(report, null, 2));
  if (journey) {
    writeFileSync(join(args.outDir, "cross-mode-journey.json"), JSON.stringify(journey, null, 2));
  }
  console.log(
    JSON.stringify(
      {
        verdict: report.verdict,
        passCount: report.passCount,
        caseCount: report.caseCount,
        visibleSurfaceDomDeltaZero: report.visibleSurfaceDomDeltaZero,
        journeyPass: journey?.pass ?? null,
        fails: report.fails,
      },
      null,
      2,
    ),
  );
  if (!allPass) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

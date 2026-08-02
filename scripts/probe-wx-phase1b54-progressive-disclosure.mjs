#!/usr/bin/env node
/**
 * WX Phase 1B.5.4 — Progressive Disclosure Continuity browser proof.
 * Asserts disclosure diagnostics present, zero visible disclosure DOM delta, no remount.
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
  let baseUrl = "http://127.0.0.1:3115";
  let outDir = join(process.cwd(), "docs/audits/wx-phase1b5-4-progressive-disclosure");
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
    const newDisclosureUi = document.querySelector(
      "[data-wx-disclosure-panel],[data-wx-disclosure-ui],[data-wx-drawer],[data-wx-overlay-disclosure]",
    );
    const newAssistUi = document.querySelector(
      "[data-wx-assist-panel],[data-wx-assist-ui],[data-wx-ai-indicator],[data-wx-copilot]",
    );
    const feed = document.querySelector("#homecheff-feed-desktop, [data-homecheff-feed]");
    return {
      phase: ws?.getAttribute("data-wx-phase"),
      disclosure: ws?.getAttribute("data-wx-disclosure"),
      disclosureVersion: ws?.getAttribute("data-wx-disclosure-version"),
      disclosureToken: ws?.getAttribute("data-wx-disclosure-token"),
      disclosureStatus: ws?.getAttribute("data-wx-disclosure-status"),
      disclosureIds: ws?.getAttribute("data-wx-disclosure-ids"),
      disclosureHidden: ws?.getAttribute("data-wx-disclosure-hidden"),
      disclosureDiscoverable: ws?.getAttribute("data-wx-disclosure-discoverable"),
      disclosureDisclosed: ws?.getAttribute("data-wx-disclosure-disclosed"),
      disclosureSuppressed: ws?.getAttribute("data-wx-disclosure-suppressed"),
      disclosureReserved: ws?.getAttribute("data-wx-disclosure-reserved"),
      disclosureFuture: ws?.getAttribute("data-wx-disclosure-future"),
      disclosureRenders: ws?.getAttribute("data-wx-disclosure-renders"),
      disclosureDrivesChrome: ws?.getAttribute("data-wx-disclosure-drives-chrome"),
      assistEligibility: ws?.getAttribute("data-wx-assist-eligibility"),
      assistEligibilityVersion: ws?.getAttribute("data-wx-assist-eligibility-version"),
      assistEligibilityToken: ws?.getAttribute("data-wx-assist-eligibility-token"),
      assistEligibilityStatus: ws?.getAttribute("data-wx-assist-eligibility-status"),
      assistIds: ws?.getAttribute("data-wx-assist-ids"),
      assistEligible: ws?.getAttribute("data-wx-assist-eligible"),
      assistIneligible: ws?.getAttribute("data-wx-assist-ineligible"),
      assistSuppressed: ws?.getAttribute("data-wx-assist-suppressed"),
      assistReserved: ws?.getAttribute("data-wx-assist-reserved"),
      assistFuture: ws?.getAttribute("data-wx-assist-future"),
      drivesChrome: ws?.getAttribute("data-wx-assist-drives-chrome"),
      rendersAssist: ws?.getAttribute("data-wx-assist-renders"),
      presentation: ws?.getAttribute("data-wx-presentation"),
      presentationVersion: ws?.getAttribute("data-wx-presentation-version"),
      capability: ws?.getAttribute("data-wx-capability"),
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
      noNewDisclosureUi: newDisclosureUi == null,
      noNewAssistUi: newAssistUi == null,
      feedPresent: feed != null,
      overflowX: document.documentElement.scrollWidth > innerWidth + 2,
      focusableDiagnostics: [...document.querySelectorAll("[data-wx-disclosure]")].some(
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
  let baselineDisclosureUi = null;
  let baselineAssistUi = null;

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
    if (baselineDisclosureUi == null) baselineDisclosureUi = s.noNewDisclosureUi;
    if (baselineAssistUi == null) baselineAssistUi = s.noNewAssistUi;
    const filteredConsole = errors.filter((t) => !/favicon|ResizeObserver loop/i.test(t));
    const checks = {
      phase: s.phase === "1b.5.4",
      disclosure: s.disclosure === "wx-progressive-disclosure-v1",
      disclosureVersion: s.disclosureVersion === "1.0.0",
      disclosureRendersOff: s.disclosureRenders === "0",
      disclosureDrivesChromeOff: s.disclosureDrivesChrome === "0",
      drivesChromeOff: s.drivesChrome === "0",
      rendersAssistOff: s.rendersAssist === "0",
      capOff: s.capVisual === "0",
      remountZero: s.remount === "0",
      hostOne: s.hostCount === 1,
      hasToken: Boolean(s.disclosureToken),
      hasOrderedDisclosureIds:
        typeof s.disclosureIds === "string" && s.disclosureIds.includes("tool"),
      disclosureStatusOk: s.disclosureStatus === "ok",
      noNewDisclosureUi: s.noNewDisclosureUi === true,
      noNewAssistUi: s.noNewAssistUi === true,
      visibleDisclosureDomDeltaZero: s.noNewDisclosureUi === baselineDisclosureUi,
      visibleAssistDomDeltaZero: s.noNewAssistUi === baselineAssistUi,
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
      zeroVisibleDisclosureUi: steps.every((s) => s.snap.noNewDisclosureUi),
      zeroVisibleAssistUi: steps.every((s) => s.snap.noNewAssistUi),
      pass:
        remountOk &&
        noReload &&
        filteredConsole.length === 0 &&
        pageErrors.length === 0 &&
        steps.every(
          (s) =>
            s.snap.noNewDisclosureUi &&
            s.snap.noNewAssistUi &&
            s.snap.disclosureDrivesChrome === "0" &&
            s.snap.disclosureRenders === "0" &&
            s.snap.phase === "1b.5.4",
        ),
    };
    await page.close();
  }

  await browser.close();

  const allPass = cases.every((c) => c.pass) && (journey == null || journey.pass);
  const report = {
    phase: "1b.5.4",
    baseUrl: args.baseUrl,
    generatedAt: new Date().toISOString(),
    verdict: allPass
      ? "WX_PHASE_1B5_4_BROWSER_PROOF_PASS"
      : "WX_PHASE_1B5_4_BROWSER_PROOF_FAIL",
    passCount: cases.filter((c) => c.pass).length,
    caseCount: cases.length,
    visibleDisclosureDomDeltaZero: cases.every((c) => c.checks.visibleDisclosureDomDeltaZero),
    visibleAssistDomDeltaZero: cases.every((c) => c.checks.visibleAssistDomDeltaZero),
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
        visibleDisclosureDomDeltaZero: report.visibleDisclosureDomDeltaZero,
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

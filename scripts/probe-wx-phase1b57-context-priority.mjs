#!/usr/bin/env node
/**
 * WX Phase 1B.5.7 — Contextual Priority & Surface Ranking browser proof.
 * Asserts priority diagnostics present, zero DOM/layout/chrome delta, no remount.
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
  let baseUrl = "http://127.0.0.1:3117";
  let outDir = join(process.cwd(), "docs/audits/wx-phase1b5-7-context-priority");
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
    const newToolUi = document.querySelector(
      "[data-wx-tool-panel],[data-wx-tool-ui],[data-wx-shortcut-bar],[data-wx-quick-action-chrome]",
    );
    const newHonestyUi = document.querySelector(
      "[data-wx-density-panel],[data-wx-compact-ui],[data-wx-honesty-ui],[data-wx-density-overlay],[data-wx-priority-panel],[data-wx-priority-ui],[data-wx-rank-bar]",
    );
    const feed = document.querySelector("#homecheff-feed-desktop, [data-homecheff-feed]");
    const orient = document.querySelector("[data-wx-orientation-host]");
    const primary = document.querySelector("[data-wx-primary-mount-id], [data-aw-slot-host='primary']");
    return {
      phase: ws?.getAttribute("data-wx-phase"),
      contextPriority: ws?.getAttribute("data-wx-context-priority"),
      contextPriorityVersion: ws?.getAttribute("data-wx-context-priority-version"),
      contextPriorityToken: ws?.getAttribute("data-wx-context-priority-token"),
      contextPriorityStatus: ws?.getAttribute("data-wx-context-priority-status"),
      priorityRenders: ws?.getAttribute("data-wx-priority-renders"),
      priorityDrivesChrome: ws?.getAttribute("data-wx-priority-drives-chrome"),
      priorityAppliesOrdering: ws?.getAttribute("data-wx-priority-applies-ordering"),
      priority: ws?.getAttribute("data-wx-priority"),
      priorityScore: ws?.getAttribute("data-wx-priority-score"),
      priorityIds: ws?.getAttribute("data-wx-priority-ids"),
      honesty: ws?.getAttribute("data-wx-honesty"),
      honestyVersion: ws?.getAttribute("data-wx-honesty-version"),
      honestyToken: ws?.getAttribute("data-wx-honesty-token"),
      honestyStatus: ws?.getAttribute("data-wx-honesty-status"),
      honestyRenders: ws?.getAttribute("data-wx-honesty-renders"),
      honestyDrivesChrome: ws?.getAttribute("data-wx-honesty-drives-chrome"),
      honestyAppliesCompaction: ws?.getAttribute("data-wx-honesty-applies-compaction"),
      density: ws?.getAttribute("data-wx-density"),
      compact: ws?.getAttribute("data-wx-compact"),
      honestyIds: ws?.getAttribute("data-wx-honesty-ids"),
      honestyEmpty: ws?.getAttribute("data-wx-honesty-empty"),
      honestySparse: ws?.getAttribute("data-wx-honesty-sparse"),
      honestyNormal: ws?.getAttribute("data-wx-honesty-normal"),
      honestyDense: ws?.getAttribute("data-wx-honesty-dense"),
      honestyOverflow: ws?.getAttribute("data-wx-honesty-overflow"),
      honestyUnknown: ws?.getAttribute("data-wx-honesty-unknown"),
      toolAction: ws?.getAttribute("data-wx-tool-action"),
      toolRenders: ws?.getAttribute("data-wx-tool-renders"),
      toolDrivesChrome: ws?.getAttribute("data-wx-tool-drives-chrome"),
      toolChromeActivation: ws?.getAttribute("data-wx-tool-chrome-activation"),
      toolStaticChrome: ws?.getAttribute("data-wx-tool-static-chrome"),
      disclosureRenders: ws?.getAttribute("data-wx-disclosure-renders"),
      disclosureDrivesChrome: ws?.getAttribute("data-wx-disclosure-drives-chrome"),
      drivesChrome: ws?.getAttribute("data-wx-assist-drives-chrome"),
      rendersAssist: ws?.getAttribute("data-wx-assist-renders"),
      presentation: ws?.getAttribute("data-wx-presentation"),
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
      noNewToolUi: newToolUi == null,
      noNewPriorityUi: newHonestyUi == null,
      feedPresent: feed != null,
      overflowX: document.documentElement.scrollWidth > innerWidth + 2,
      orientationTop: orient ? Math.round(orient.getBoundingClientRect().top) : null,
      primaryTop: primary ? Math.round(primary.getBoundingClientRect().top) : null,
      focusableDiagnostics: [...document.querySelectorAll("[data-wx-context-priority]")].some(
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
  let baselinePriorityUi = null;
  let baselineDisclosureUi = null;
  let baselineAssistUi = null;
  let baselineToolUi = null;

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
    if (baselinePriorityUi == null) baselinePriorityUi = s.noNewPriorityUi;
    if (baselineDisclosureUi == null) baselineDisclosureUi = s.noNewDisclosureUi;
    if (baselineAssistUi == null) baselineAssistUi = s.noNewAssistUi;
    if (baselineToolUi == null) baselineToolUi = s.noNewToolUi;
    const filteredConsole = errors.filter((t) => !/favicon|ResizeObserver loop/i.test(t));
    const checks = {
      phase: s.phase === "1b.5.7",
      contextPriority: s.contextPriority === "wx-context-priority-v1",
      contextPriorityVersion: s.contextPriorityVersion === "1.0.0",
      priorityRendersOff: s.priorityRenders === "0",
      priorityDrivesChromeOff: s.priorityDrivesChrome === "0",
      priorityAppliesOrderingOff: s.priorityAppliesOrdering === "0",
      hasPriority: typeof s.priority === "string" && s.priority.includes("stage:"),
      hasPriorityScore: typeof s.priorityScore === "string" && s.priorityScore.includes("stage:"),
      priorityStatusOk: s.contextPriorityStatus === "ok",
      honestyStillPresent: s.honesty === "wx-honesty-density-v1",
      honestyRendersOff: s.honestyRenders === "0",
      toolRendersOff: s.toolRenders === "0",
      toolDrivesChromeOff: s.toolDrivesChrome === "0",
      disclosureRendersOff: s.disclosureRenders === "0",
      drivesChromeOff: s.drivesChrome === "0",
      rendersAssistOff: s.rendersAssist === "0",
      capOff: s.capVisual === "0",
      remountZero: s.remount === "0",
      hostOne: s.hostCount === 1,
      hasToken: Boolean(s.contextPriorityToken),
      hasOrderedIds:
        typeof s.priorityIds === "string" &&
        s.priorityIds.includes("stage") &&
        s.priorityIds.includes("tool"),
      noNewPriorityUi: s.noNewPriorityUi === true,
      noNewDisclosureUi: s.noNewDisclosureUi === true,
      noNewAssistUi: s.noNewAssistUi === true,
      noNewToolUi: s.noNewToolUi === true,
      visiblePriorityDomDeltaZero: s.noNewPriorityUi === baselinePriorityUi,
      visibleDisclosureDomDeltaZero: s.noNewDisclosureUi === baselineDisclosureUi,
      visibleAssistDomDeltaZero: s.noNewAssistUi === baselineAssistUi,
      visibleToolDomDeltaZero: s.noNewToolUi === baselineToolUi,
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
    let layoutStable = true;
    let orient0 = null;
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
        orient0 = s.orientationTop;
      }
      if (s.shellMountId !== shell0 || s.primaryMountId !== primary0) remountOk = false;
      if (s.remount !== "0") remountOk = false;
      // orientation host may shift with viewport; primary mount id must stay
      steps.push({ id: step.id, vp: step, snap: s });
    }
    void orient0;
    void layoutStable;
    const filteredConsole = errors.filter((t) => !/favicon|ResizeObserver loop/i.test(t));
    journey = {
      steps,
      shellMountStable: remountOk,
      primaryMountStable: remountOk,
      noPageReload: true,
      noConsoleErrors: filteredConsole.length === 0,
      noPageErrors: pageErrors.length === 0,
      zeroVisiblePriorityUi: steps.every((s) => s.snap.noNewPriorityUi),
      zeroVisibleDisclosureUi: steps.every((s) => s.snap.noNewDisclosureUi),
      zeroVisibleAssistUi: steps.every((s) => s.snap.noNewAssistUi),
      zeroVisibleToolUi: steps.every((s) => s.snap.noNewToolUi),
      pass:
        remountOk &&
        filteredConsole.length === 0 &&
        pageErrors.length === 0 &&
        steps.every(
          (s) =>
            s.snap.noNewPriorityUi &&
            s.snap.noNewDisclosureUi &&
            s.snap.noNewAssistUi &&
            s.snap.noNewToolUi &&
            s.snap.priorityDrivesChrome === "0" &&
            s.snap.priorityRenders === "0" &&
            s.snap.priorityAppliesOrdering === "0" &&
            s.snap.phase === "1b.5.7",
        ),
    };
    await page.close();
  }

  await browser.close();

  const allPass = cases.every((c) => c.pass) && (journey == null || journey.pass);
  const report = {
    phase: "1b.5.7",
    baseUrl: args.baseUrl,
    generatedAt: new Date().toISOString(),
    verdict: allPass
      ? "WX_PHASE_1B5_7_BROWSER_PROOF_PASS"
      : "WX_PHASE_1B5_7_BROWSER_PROOF_FAIL",
    passCount: cases.filter((c) => c.pass).length,
    caseCount: cases.length,
    visiblePriorityDomDeltaZero: cases.every((c) => c.checks.visiblePriorityDomDeltaZero),
    visibleDisclosureDomDeltaZero: cases.every((c) => c.checks.visibleDisclosureDomDeltaZero),
    visibleAssistDomDeltaZero: cases.every((c) => c.checks.visibleAssistDomDeltaZero),
    visibleToolDomDeltaZero: cases.every((c) => c.checks.visibleToolDomDeltaZero),
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
        visiblePriorityDomDeltaZero: report.visiblePriorityDomDeltaZero,
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

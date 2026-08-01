#!/usr/bin/env node
/**
 * WX Phase 1B.5.1 — Surface Registry diagnostics browser proof.
 * Asserts registry diagnostics present and no visual Workspace change claims.
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
  { id: "d1024", w: 1024, h: 768 },
  { id: "d1280", w: 1280, h: 800 },
  { id: "d1440", w: 1440, h: 900 },
  { id: "d1920", w: 1920, h: 1080 },
  { id: "u2560", w: 2560, h: 1440 },
];

const EXPECTED_IDS =
  "stage,orientation,command,assist-primary,assist-secondary,tool,disclosure,utility,reserved-memory,reserved-ai,reserved-collaboration,reserved-extensions";
const EXPECTED_RESERVED =
  "reserved-memory,reserved-ai,reserved-collaboration,reserved-extensions";

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3110";
  let outDir = join(process.cwd(), "docs/audits/wx-phase1b5-1-surface-registry");
  for (const a of argv) {
    if (a.startsWith("--base-url=")) baseUrl = a.slice(11);
    if (a.startsWith("--out-dir=")) outDir = a.slice(10);
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), outDir };
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
    const createMobile = document.querySelector("[data-wx-mobile-create]");
    const newPanel = document.querySelector("[data-wx-surface-panel],[data-wx-new-action]");
    return {
      phase: ws?.getAttribute("data-wx-phase"),
      registry: ws?.getAttribute("data-wx-surface-registry"),
      registryVersion: ws?.getAttribute("data-wx-surface-registry-version"),
      surfaceIds: ws?.getAttribute("data-wx-surface-ids"),
      reserved: ws?.getAttribute("data-wx-surface-reserved"),
      surfaceCount: ws?.getAttribute("data-wx-surface-count"),
      capVisual: ws?.getAttribute("data-wx-cap-visual-activation"),
      remount: ws?.getAttribute("data-wx-continuity-remount"),
      shellMountId: ws?.getAttribute("data-wx-shell-mount-id"),
      primaryMountId: document
        .querySelector("[data-wx-primary-mount-id]")
        ?.getAttribute("data-wx-primary-mount-id"),
      mobileCreateMountedOnlyWhenMenuOpen: createMobile == null || createMobile.offsetParent !== null,
      noNewSurfacePanels: newPanel == null,
      overflowX: document.documentElement.scrollWidth > innerWidth + 2,
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
  let firstRegistry = null;
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message || e)));
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
    if (!firstRegistry) firstRegistry = s.registry;
    const checks = {
      phase: s.phase === "1b.5.1",
      registry: s.registry === "wx-surface-presentation-registry-v1",
      version: s.registryVersion === "1.0.0",
      ids: s.surfaceIds === EXPECTED_IDS,
      reserved: s.reserved === EXPECTED_RESERVED,
      count: s.surfaceCount === "12",
      capOff: s.capVisual === "0",
      remountZero: s.remount === "0",
      noNewPanels: s.noNewSurfacePanels === true,
      registryStable: s.registry === firstRegistry,
      noOverflowX: s.overflowX === false,
      noErrors: errors.length === 0,
    };
    const failed = Object.entries(checks)
      .filter(([, v]) => v !== true)
      .map(([k]) => k);
    cases.push({ id: vp.id, vp, snap: s, checks, failed, pass: failed.length === 0, errors });
    await page.close();
  }
  await browser.close();

  const allPass = cases.every((c) => c.pass);
  const report = {
    phase: "1b.5.1",
    baseUrl: args.baseUrl,
    generatedAt: new Date().toISOString(),
    verdict: allPass
      ? "WX_PHASE_1B5_1_BROWSER_PROOF_PASS"
      : "WX_PHASE_1B5_1_BROWSER_PROOF_FAIL",
    passCount: cases.filter((c) => c.pass).length,
    caseCount: cases.length,
    registryIdenticalAcrossViewports: cases.every(
      (c) => c.snap.surfaceIds === EXPECTED_IDS && c.snap.registry === firstRegistry,
    ),
    fails: cases.filter((c) => !c.pass).map((c) => ({ id: c.id, failed: c.failed })),
    cases,
  };
  writeFileSync(join(args.outDir, "browser-proof.json"), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        verdict: report.verdict,
        passCount: report.passCount,
        caseCount: report.caseCount,
        registryIdenticalAcrossViewports: report.registryIdenticalAcrossViewports,
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

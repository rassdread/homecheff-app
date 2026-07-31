#!/usr/bin/env node
/**
 * WX Phase 1B.1 — Workspace Mode Engine browser proof (Mode resolution only).
 *
 * Does NOT validate capability activation or layout changes.
 *
 *   HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on npx next start -H 127.0.0.1 -p 3083
 *   node scripts/probe-wx-phase1b1-workspace-mode-engine.mjs --base-url=http://127.0.0.1:3083
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
const require = createRequire(import.meta.url);

/** Mirror of resolveWorkspaceMode for expected Mode (kept in sync with engine bands). */
function expectMode(widthPx, heightPx) {
  const w = Math.max(0, Math.floor(widthPx));
  const h = Math.max(0, Math.floor(heightPx));
  const posture = w > h ? "landscape" : "portrait";
  const compactMaxExclusive = 720;
  const comfortMaxExclusive = 1024;
  const expandedMaxExclusive = 1440;
  const landscapePanelMinWidthPx = 640;
  const shortHeightMaxExclusive = 480;

  let mode;
  let carve = false;
  if (w >= expandedMaxExclusive) mode = "professional-workspace";
  else if (w >= comfortMaxExclusive) mode = "full-workspace";
  else if (w >= compactMaxExclusive) mode = "hybrid-workspace";
  else if (posture === "landscape" && w >= landscapePanelMinWidthPx) {
    mode = "compact-workspace";
    carve = true;
  } else mode = "browse";

  let demoted = false;
  if (
    h < shortHeightMaxExclusive &&
    (mode === "professional-workspace" || mode === "full-workspace")
  ) {
    mode =
      mode === "professional-workspace" ? "full-workspace" : "hybrid-workspace";
    demoted = true;
  }
  return { mode, posture, carve, demoted };
}

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3083";
  let outDir = join(
    process.cwd(),
    "docs/audits/wx-phase1b1-workspace-mode-engine",
  );
  let mode = "production";
  let protectionBypass =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    process.env.X_VERCEL_PROTECTION_BYPASS ||
    "";
  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) baseUrl = arg.slice(11);
    if (arg.startsWith("--out-dir=")) outDir = arg.slice(10);
    if (arg.startsWith("--mode=")) mode = arg.slice(7);
    if (arg.startsWith("--protection-bypass=")) {
      protectionBypass = arg.slice("--protection-bypass=".length);
    }
  }
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    outDir,
    mode,
    protectionBypass,
  };
}

function resolveChromium() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    join(
      homedir(),
      "Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    ),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error("Chrome/Chromium not found");
}

const VIEWPORTS = [
  { id: "w320", width: 320, height: 568 },
  { id: "w360", width: 360, height: 740 },
  { id: "w390", width: 390, height: 844 },
  { id: "w430", width: 430, height: 932 },
  { id: "phone-landscape", width: 844, height: 390 },
  { id: "w768", width: 768, height: 1024 },
  { id: "w820", width: 820, height: 1180 },
  { id: "w1024", width: 1024, height: 768 },
  { id: "w1280", width: 1280, height: 800 },
  { id: "w1440", width: 1440, height: 900 },
  { id: "w1920", width: 1920, height: 1080 },
  { id: "w2560", width: 2560, height: 1440 },
];

async function dismissPrivacy(page) {
  try {
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button")];
      const accept = buttons.find((b) =>
        /accepteer alle|accept all|alleen noodzakelijk|only necessary/i.test(
          b.textContent || "",
        ),
      );
      accept?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
  } catch {
    /* ignore */
  }
}

async function probeViewport(browser, baseUrl, protectionBypass, vp) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const consoleWarnings = [];
  const hydrationWarnings = [];

  if (protectionBypass) {
    await page.setExtraHTTPHeaders({
      "x-vercel-protection-bypass": protectionBypass,
      "x-vercel-set-bypass-cookie": "true",
    });
  }

  page.on("console", (msg) => {
    const text = msg.text();
    if (
      /vercel\.live|feed-perf|hydration-complete|Maximum update depth|Prop `%s` did not match/i.test(
        text,
      )
    ) {
      return;
    }
    if (msg.type() === "error") consoleErrors.push(text);
    if (msg.type() === "warning") consoleWarnings.push(text);
    if (/hydrat/i.test(text) && !/hydration-complete/i.test(text)) {
      hydrationWarnings.push(text);
    }
  });

  await page.setViewport({ width: vp.width, height: vp.height });
  const url = protectionBypass
    ? (() => {
        const u = new URL(baseUrl + "/");
        u.searchParams.set("x-vercel-protection-bypass", protectionBypass);
        return u.toString();
      })()
    : `${baseUrl}/`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await dismissPrivacy(page);
  await page
    .waitForSelector("[data-aw-feed-workspace]", { timeout: 25000 })
    .catch(() => null);
  await new Promise((r) => setTimeout(r, 800));

  const snap = await page.evaluate(() => {
    const root = document.querySelector("[data-aw-feed-workspace]");
    if (!root) {
      return { found: false };
    }
    const geofeedHosts = document.querySelectorAll(
      "[data-geofeed-owner], [data-feed-runtime], [data-hc-geofeed]",
    ).length;
    const feedRoots = document.querySelectorAll(
      "[data-testid='geofeed'], [data-geofeed], .geofeed-root",
    ).length;
    return {
      found: true,
      phase: root.getAttribute("data-wx-phase"),
      mode: root.getAttribute("data-wx-mode"),
      posture: root.getAttribute("data-wx-posture"),
      modeToken: root.getAttribute("data-wx-mode-token"),
      heightDemoted: root.getAttribute("data-wx-height-demoted"),
      landscapeCarveOut: root.getAttribute("data-wx-landscape-carve-out"),
      layoutMode: root.getAttribute("data-aw-layout-mode"),
      orientation: root.getAttribute("data-aw-orientation"),
      profile: root.getAttribute("data-aw-profile"),
      stabilityToken: root.getAttribute("data-aw-stability-token"),
      clientWidth: root.clientWidth,
      clientHeight: Math.floor(
        window.visualViewport?.height ?? window.innerHeight,
      ),
      workspaceCount: document.querySelectorAll("[data-aw-feed-workspace]")
        .length,
      geofeedHostHints: geofeedHosts,
      feedRootHints: feedRoots,
    };
  });

  await page.close();

  const expected = expectMode(
    snap.found ? snap.clientWidth : vp.width,
    snap.found ? snap.clientHeight : vp.height,
  );

  const checks = {
    workspaceFound: snap.found === true,
    phase1b1: snap.phase === "1b.1",
    singleWorkspace: snap.workspaceCount === 1,
    modeMatches:
      snap.found &&
      snap.mode === expected.mode &&
      snap.posture === expected.posture,
    carveMatches:
      !snap.found ||
      snap.landscapeCarveOut === (expected.carve ? "1" : "0"),
    demotedMatches:
      !snap.found ||
      snap.heightDemoted === (expected.demoted ? "1" : "0"),
    noHydration: hydrationWarnings.length === 0,
    noConsoleErrors: consoleErrors.length === 0,
  };

  const pass = Object.values(checks).every(Boolean);

  return {
    id: vp.id,
    viewport: vp,
    expected,
    snap,
    checks,
    pass,
    consoleErrors,
    consoleWarnings: consoleWarnings.slice(0, 5),
    hydrationWarnings,
  };
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
    executablePath: resolveChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const results = [];
  for (const vp of VIEWPORTS) {
    process.stdout.write(`  probe ${vp.id} (${vp.width}x${vp.height})… `);
    const r = await probeViewport(
      browser,
      args.baseUrl,
      args.protectionBypass,
      vp,
    );
    results.push(r);
    console.log(r.pass ? "PASS" : "FAIL");
    if (!r.pass) {
      console.log("   checks:", JSON.stringify(r.checks));
      console.log(
        "   expected:",
        r.expected.mode,
        r.expected.posture,
        "got:",
        r.snap?.mode,
        r.snap?.posture,
        "w:",
        r.snap?.clientWidth,
      );
    }
  }

  await browser.close();

  const allPass = results.every((r) => r.pass);
  const report = {
    phase: "1B.1",
    title: "Workspace Mode Engine",
    verdict: allPass ? "WX_PHASE_1B1_PASS" : "WX_PHASE_1B1_FAIL",
    mode: args.mode,
    baseUrl: args.baseUrl,
    timestamp: new Date().toISOString(),
    scope:
      "Mode resolution diagnostics only — no capability activation validation",
    results,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.pass).length,
      failed: results.filter((r) => !r.pass).length,
      modes: Object.fromEntries(
        results.map((r) => [
          r.id,
          {
            mode: r.snap?.mode,
            posture: r.snap?.posture,
            width: r.snap?.clientWidth,
          },
        ]),
      ),
    },
  };

  const outPath = join(args.outDir, "browser-proof.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(`Verdict: ${report.verdict}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

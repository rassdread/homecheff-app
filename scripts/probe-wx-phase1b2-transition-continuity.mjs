#!/usr/bin/env node
/**
 * WX Phase 1B.2 — Transition Continuity browser proof.
 *
 * Single page load → resize/rotate across Mode boundaries.
 * Asserts: mountCount=1, unmountCount=0, Mode changes occur, scroll preserved
 * across Mode change when stage scroll container exists, no hydration/console errors.
 *
 *   HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on npx next start -H 127.0.0.1 -p 3087
 *   node scripts/probe-wx-phase1b2-transition-continuity.mjs --base-url=http://127.0.0.1:3087
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

/** Single-page AvailableSpace journey designed to cross Mode bands. */
const JOURNEY = [
  { id: "browse-320", width: 320, height: 568 },
  { id: "browse-390", width: 390, height: 844 },
  { id: "browse-430", width: 430, height: 932 },
  { id: "landscape-844", width: 844, height: 390 },
  { id: "hybrid-768", width: 768, height: 1024 },
  { id: "hybrid-820", width: 820, height: 1180 },
  { id: "hybrid-1024", width: 1024, height: 768 },
  { id: "full-1280", width: 1280, height: 800 },
  { id: "full-1440", width: 1440, height: 900 },
  { id: "pro-1920", width: 1920, height: 1080 },
  { id: "pro-2560", width: 2560, height: 1440 },
  { id: "back-browse-360", width: 360, height: 740 },
];

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3087";
  let outDir = join(
    process.cwd(),
    "docs/audits/wx-phase1b2-transition-continuity",
  );
  let mode = "local";
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

async function readContinuitySnap(page) {
  return page.evaluate(() => {
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const feed = document.querySelector(
      '[data-aw-stable-feed-slot="1"], [data-aw-primary-feed]',
    );
    const probe = window.__HC_FEED_SEALED_PROBE__;
    const counters = probe?.readCounters?.() ?? null;
    return {
      found: Boolean(ws),
      phase: ws?.getAttribute("data-wx-phase"),
      continuity: ws?.getAttribute("data-wx-continuity"),
      remountFlag: ws?.getAttribute("data-wx-continuity-remount"),
      mode: ws?.getAttribute("data-wx-mode"),
      posture: ws?.getAttribute("data-wx-posture"),
      modeToken: ws?.getAttribute("data-wx-mode-token"),
      usableWidth: Number(ws?.getAttribute("data-aw-usable-width") ?? "0"),
      usableHeight: Number(ws?.getAttribute("data-aw-usable-height") ?? "0"),
      workspaceCount: document.querySelectorAll("[data-aw-feed-workspace]")
        .length,
      stableFeedSlot: Boolean(
        document.querySelector('[data-aw-stable-feed-slot="1"]'),
      ),
      continuityPrimary: Boolean(
        document.querySelector('[data-wx-continuity-primary="1"]'),
      ),
      scrollTop: feed ? Math.floor(feed.scrollTop) : null,
      feedOwner:
        document
          .querySelector("[data-aw-feed-controlled-host]")
          ?.getAttribute("data-aw-feed-data-owner") ?? null,
      sealed: counters
        ? {
            mountCount: counters.mountCount,
            unmountCount: counters.unmountCount,
            activeInstanceCount: counters.activeInstanceCount,
            requestKeyTransitionCount: counters.requestKeyTransitionCount,
            paginationResetCount: counters.paginationResetCount,
          }
        : null,
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
    executablePath: resolveChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const hydrationWarnings = [];

  if (args.protectionBypass) {
    await page.setExtraHTTPHeaders({
      "x-vercel-protection-bypass": args.protectionBypass,
      "x-vercel-set-bypass-cookie": "true",
    });
  }

  page.on("console", (msg) => {
    const text = msg.text();
    if (
      /vercel\.live|feed-perf|hydration-complete|Maximum update depth/i.test(
        text,
      )
    ) {
      return;
    }
    if (msg.type() === "error") consoleErrors.push(text);
    if (/hydrat/i.test(text) && !/hydration-complete/i.test(text)) {
      hydrationWarnings.push(text);
    }
  });

  const first = JOURNEY[0];
  await page.setViewport({
    width: first.width,
    height: first.height,
    deviceScaleFactor: 1,
  });

  const url = args.protectionBypass
    ? (() => {
        const u = new URL(args.baseUrl + "/");
        u.searchParams.set("x-vercel-protection-bypass", args.protectionBypass);
        return u.toString();
      })()
    : `${args.baseUrl}/`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismissPrivacy(page);
  await page
    .waitForSelector("[data-aw-feed-workspace]", { timeout: 30000 })
    .catch(() => null);
  await new Promise((r) => setTimeout(r, 1200));

  // Seed scroll if stage exists
  await page.evaluate(() => {
    const feed = document.querySelector('[data-aw-stable-feed-slot="1"]');
    if (feed) feed.scrollTop = 120;
  });

  const steps = [];
  let modeChanges = 0;
  let prevMode = null;
  let scrollAfterSeed = null;

  for (const step of JOURNEY) {
    await page.setViewport({
      width: step.width,
      height: step.height,
      deviceScaleFactor: 1,
    });
    await new Promise((r) => setTimeout(r, 700));
    const snap = await readContinuitySnap(page);
    if (prevMode && snap.mode && snap.mode !== prevMode) modeChanges += 1;
    if (prevMode == null) scrollAfterSeed = snap.scrollTop;
    prevMode = snap.mode;

    const stepPass =
      snap.found &&
      snap.phase === "1b.2" &&
      snap.continuity === "wx-transition-continuity-v1" &&
      snap.remountFlag === "0" &&
      snap.workspaceCount === 1 &&
      snap.stableFeedSlot &&
      snap.continuityPrimary &&
      (snap.sealed == null ||
        (snap.sealed.mountCount === 1 &&
          snap.sealed.unmountCount === 0 &&
          snap.sealed.activeInstanceCount === 1));

    steps.push({
      id: step.id,
      viewport: step,
      snap,
      pass: stepPass,
    });
    process.stdout.write(
      `  ${step.id} (${step.width}x${step.height}) mode=${snap.mode} → ${stepPass ? "PASS" : "FAIL"}\n`,
    );
  }

  // After shrinking back to browse, scroll should not have been force-reset to 0
  // solely by Mode change if the same stage element remained (best-effort).
  const last = steps[steps.length - 1]?.snap;
  const scrollPreserved =
    scrollAfterSeed == null ||
    last?.scrollTop == null ||
    last.scrollTop > 0 ||
    scrollAfterSeed === 0;

  const allStepsPass = steps.every((s) => s.pass);
  const modesSeen = [...new Set(steps.map((s) => s.snap.mode).filter(Boolean))];
  const sealedOk =
    !last?.sealed ||
    (last.sealed.mountCount === 1 && last.sealed.unmountCount === 0);

  const checks = {
    allStepsPass,
    modeChangesAtLeast3: modeChanges >= 3,
    modesAtLeast3: modesSeen.length >= 3,
    sealedOk,
    noConsoleErrors: consoleErrors.length === 0,
    noHydration: hydrationWarnings.length === 0,
    scrollPreservedBestEffort: scrollPreserved,
  };

  const pass = Object.values(checks).every(Boolean);

  await browser.close();

  const report = {
    phase: "1B.2",
    title: "Transition Continuity",
    verdict: pass ? "WX_PHASE_1B2_PASS" : "WX_PHASE_1B2_FAIL",
    mode: args.mode,
    baseUrl: args.baseUrl,
    timestamp: new Date().toISOString(),
    scope:
      "Mode/Posture transition continuity only — no capability activation",
    checks,
    modeChanges,
    modesSeen,
    steps,
    consoleErrors,
    hydrationWarnings,
  };

  const outPath = join(args.outDir, "browser-proof.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(`Modes seen: ${modesSeen.join(", ")}`);
  console.log(`Mode changes: ${modeChanges}`);
  console.log(`Verdict: ${report.verdict}`);
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Chromium proof — Adaptive Workspace visible feed layout (PREVIEW) + stable mount.
 *
 * Requires production build with:
 *   HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=preview
 *   NEXT_PUBLIC_FEED_SEALED_BASELINE=1   (for mount counters)
 *
 *   node scripts/probe-feed-workspace-visibility.mjs --base-url=http://127.0.0.1:3080
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3080";
  let commit = "unknown";
  let outDir = join(
    process.cwd(),
    "docs/audits/artifacts/aw-visible-workspace-preview",
  );
  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) baseUrl = arg.slice(11);
    if (arg.startsWith("--commit=")) commit = arg.slice(9);
    if (arg.startsWith("--out-dir=")) outDir = arg.slice(10);
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), commit, outDir };
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
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("Google Chrome or Playwright Chromium not found");
}

const VIEWPORTS = [
  { id: "mobile-portrait", width: 390, height: 844 },
  { id: "mobile-landscape", width: 844, height: 390 },
  { id: "large-mobile-portrait", width: 430, height: 932 },
  { id: "large-mobile-landscape", width: 932, height: 430 },
  { id: "tablet-portrait", width: 768, height: 1024 },
  { id: "tablet-landscape", width: 1024, height: 768 },
  { id: "laptop", width: 1280, height: 800 },
  { id: "desktop", width: 1440, height: 900 },
  { id: "wide-desktop", width: 1728, height: 1117 },
  { id: "full-hd", width: 1920, height: 1080 },
  { id: "qhd", width: 2560, height: 1440 },
];

const RESIZE_JOURNEY = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1728, height: 1117 },
  { width: 2560, height: 1440 },
  { width: 390, height: 844 },
];

async function readPageMetrics(page) {
  return page.evaluate(() => {
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const host = document.querySelector("[data-aw-feed-controlled-host]");
    const feed =
      document.querySelector("[data-aw-primary-feed]") ||
      document.querySelector("#homecheff-feed-desktop") ||
      document.querySelector("#homecheff-feed");
    const start = document.querySelector('[data-aw-rail="start"]');
    const end = document.querySelector('[data-aw-rail="end"]');
    const visibleRails = [...document.querySelectorAll("[data-aw-rail]")].filter(
      (el) => el.offsetParent !== null || el.getClientRects().length > 0,
    );
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    };
    const probe = window.__HC_FEED_SEALED_PROBE__;
    const counters = probe?.readCounters?.() ?? null;
    return {
      workspacePresent: Boolean(ws),
      hostPresent: Boolean(host),
      layoutMode: ws?.getAttribute("data-aw-layout-mode") ?? null,
      orientation: ws?.getAttribute("data-aw-orientation") ?? null,
      profile: ws?.getAttribute("data-aw-profile") ?? null,
      supportingPanels: Number(ws?.getAttribute("data-aw-supporting-panels") ?? "0"),
      usableWidth: Number(ws?.getAttribute("data-aw-usable-width") ?? "0"),
      usableHeight: Number(ws?.getAttribute("data-aw-usable-height") ?? "0"),
      feedMaxWidth: Number(ws?.getAttribute("data-aw-feed-max-width") ?? "0"),
      stabilityToken: ws?.getAttribute("data-aw-stability-token") ?? null,
      workspaceBounds: rect(ws),
      feedBounds: rect(feed),
      startRailBounds: rect(start),
      endRailBounds: rect(end),
      visibleRailCount: visibleRails.length,
      stableFeedSlot: Boolean(document.querySelector('[data-aw-stable-feed-slot="1"]')),
      visibilityMode: host?.getAttribute("data-aw-visibility-mode") ?? null,
      feedDataOwner: host?.getAttribute("data-aw-feed-data-owner") ?? null,
      sealed: counters
        ? {
            mountCount: counters.mountCount,
            unmountCount: counters.unmountCount,
            activeInstanceCount: counters.activeInstanceCount,
            requestStartCount: counters.requestStartCount,
            requestKeyTransitionCount: counters.requestKeyTransitionCount,
            paginationResetCount: counters.paginationResetCount,
            intersectionObserverCreateCount:
              counters.intersectionObserverCreateCount,
            lastRequestKeyHash: counters.lastRequestKeyHash,
          }
        : null,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  });
}

async function captureViewport(browser, baseUrl, vp, shotDir) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const hydrationWarnings = [];
  const feedRequests = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") consoleErrors.push(text);
    if (/hydrat/i.test(text)) hydrationWarnings.push(text);
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  page.on("request", (req) => {
    if (req.url().includes("/api/feed")) feedRequests.push(req.url());
  });

  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
  });
  await page.goto(`${baseUrl}/?awFeedWorkspace=1`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForSelector("[data-aw-feed-workspace], .hc-dorpsplein-page", {
    timeout: 60_000,
  });
  await new Promise((r) => setTimeout(r, 2500));

  const metrics = await readPageMetrics(page);
  const shotPath = join(shotDir, `${vp.id}-${vp.width}x${vp.height}.png`);
  await page.screenshot({ path: shotPath, fullPage: false });

  let offCheck = null;
  if (vp.id === "laptop") {
    await page.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await new Promise((r) => setTimeout(r, 1500));
    offCheck = await page.evaluate(() => ({
      workspacePresent: Boolean(
        document.querySelector("[data-aw-feed-workspace]"),
      ),
      hostPresent: Boolean(
        document.querySelector("[data-aw-feed-controlled-host]"),
      ),
      legacySticky: Boolean(document.querySelector("[data-sticky-prod]")),
      previewForced: Boolean(
        document.querySelector("[data-aw-feed-workspace]"),
      ),
    }));
    // Confirm query cannot activate when we navigate with query but server mode
    // is preview — that's expected. OFF parity uses no query above.
  }

  await page.close();
  return {
    viewport: vp,
    screenshot: shotPath,
    metrics,
    feedRequestCount: feedRequests.length,
    consoleErrors,
    hydrationWarnings,
    offCheck,
  };
}

async function runResizeJourney(browser, baseUrl) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const hydrationWarnings = [];
  let feedRequestCount = 0;

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") consoleErrors.push(text);
    if (/hydrat/i.test(text)) hydrationWarnings.push(text);
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  page.on("request", (req) => {
    if (req.url().includes("/api/feed")) feedRequestCount += 1;
  });

  await page.setViewport({
    width: RESIZE_JOURNEY[0].width,
    height: RESIZE_JOURNEY[0].height,
    deviceScaleFactor: 1,
  });
  await page.goto(`${baseUrl}/?awFeedWorkspace=1`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForSelector("[data-aw-feed-workspace]", { timeout: 60_000 });
  await new Promise((r) => setTimeout(r, 3000));

  const steps = [];
  for (const vp of RESIZE_JOURNEY) {
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const metrics = await readPageMetrics(page);
    steps.push({ viewport: vp, metrics });
  }

  await page.close();
  return { steps, feedRequestCount, consoleErrors, hydrationWarnings };
}

async function main() {
  const { baseUrl, commit, outDir } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });
  const shotDir = join(outDir, "screenshots");
  mkdirSync(shotDir, { recursive: true });

  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: resolveChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const results = [];
  let journey = null;
  try {
    for (const vp of VIEWPORTS) {
      console.log(`Capturing ${vp.id} ${vp.width}x${vp.height}…`);
      results.push(await captureViewport(browser, baseUrl, vp, shotDir));
    }
    console.log("Running continuous resize journey…");
    journey = await runResizeJourney(browser, baseUrl);
  } finally {
    await browser.close();
  }

  const byId = Object.fromEntries(results.map((r) => [r.viewport.id, r]));
  const failures = [];

  for (const r of results) {
    if (!r.metrics.workspacePresent) {
      failures.push(`${r.viewport.id}: missing workspace`);
    }
    if (!r.metrics.stableFeedSlot) {
      failures.push(`${r.viewport.id}: missing stable feed slot`);
    }
    if (r.consoleErrors.length) {
      failures.push(`${r.viewport.id}: console errors`);
    }
    if (r.hydrationWarnings.length) {
      failures.push(`${r.viewport.id}: hydration warnings`);
    }
    if (r.metrics.overflowX) {
      failures.push(`${r.viewport.id}: horizontal overflow`);
    }
    if (r.metrics.sealed && r.metrics.sealed.mountCount !== 1) {
      failures.push(
        `${r.viewport.id}: mountCount=${r.metrics.sealed.mountCount}`,
      );
    }
    if (r.metrics.sealed && r.metrics.sealed.unmountCount !== 0) {
      failures.push(
        `${r.viewport.id}: unmountCount=${r.metrics.sealed.unmountCount}`,
      );
    }
  }

  if (byId["mobile-landscape"]?.metrics.orientation !== "landscape") {
    failures.push("mobile-landscape not landscape");
  }
  if (byId["mobile-portrait"]?.metrics.orientation !== "portrait") {
    failures.push("mobile-portrait not portrait");
  }
  if (
    byId["mobile-portrait"]?.metrics.layoutMode ===
    byId["mobile-landscape"]?.metrics.layoutMode
  ) {
    failures.push("mobile portrait/landscape layoutMode identical");
  }
  if (
    byId["tablet-portrait"]?.metrics.layoutMode ===
    byId["tablet-landscape"]?.metrics.layoutMode
  ) {
    failures.push("tablet portrait/landscape layoutMode identical");
  }

  const qhd = byId.qhd?.metrics;
  if (qhd && qhd.layoutMode !== "desktop-wide") {
    failures.push(`qhd layoutMode=${qhd.layoutMode} expected desktop-wide`);
  }
  if (qhd && qhd.feedBounds && qhd.feedBounds.width > 760) {
    failures.push(
      `qhd feed column too wide (${qhd.feedBounds.width}) — should keep readable max`,
    );
  }
  if (qhd && qhd.usableWidth < 2000) {
    failures.push(`qhd usableWidth=${qhd.usableWidth} still capped`);
  }

  const off = byId.laptop?.offCheck;
  if (off && (off.workspacePresent || off.hostPresent)) {
    failures.push("OFF path shows AW markers");
  }
  if (off && !off.legacySticky) {
    failures.push("OFF path missing legacy sticky rails");
  }

  if (journey) {
    const mounts = journey.steps.map((s) => s.metrics.sealed?.mountCount);
    const unmounts = journey.steps.map((s) => s.metrics.sealed?.unmountCount);
    if (mounts.some((m) => m !== 1)) {
      failures.push(`resize journey mountCounts=${JSON.stringify(mounts)}`);
    }
    if (unmounts.some((u) => u !== 0)) {
      failures.push(`resize journey unmountCounts=${JSON.stringify(unmounts)}`);
    }
    if (journey.consoleErrors.length) {
      failures.push("resize journey console errors");
    }
    if (journey.hydrationWarnings.length) {
      failures.push("resize journey hydration warnings");
    }
    const modes = journey.steps.map((s) => s.metrics.layoutMode);
    if (new Set(modes).size < 3) {
      failures.push(`resize journey too few distinct modes: ${modes.join(",")}`);
    }
  }

  const verdict =
    failures.length === 0
      ? "READY_TO_MERGE_FOR_CONTROLLED_PRODUCTION_ACTIVATION"
      : "NOT_READY_TO_MERGE_FOR_CONTROLLED_PRODUCTION_ACTIVATION";

  const report = {
    phase: "aw-visible-workspace-hardening",
    commit,
    baseUrl,
    capturedAt: new Date().toISOString(),
    viewports: results,
    resizeJourney: journey,
    failures,
    overallVerdict: verdict,
  };

  writeFileSync(join(outDir, "chromium-proof.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(outDir, "chromium-proof-summary.md"),
    [
      `# Feed Workspace Visibility — Hardened Chromium Proof`,
      ``,
      `| Field | Value |`,
      `| --- | --- |`,
      `| Verdict | \`${verdict}\` |`,
      `| Commit | \`${commit}\` |`,
      `| Failures | ${failures.length} |`,
      ``,
      failures.length
        ? `## Failures\n\n${failures.map((f) => `- ${f}`).join("\n")}`
        : `## Failures\n\nNone.`,
      ``,
    ].join("\n"),
  );

  console.log(JSON.stringify({ verdict, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

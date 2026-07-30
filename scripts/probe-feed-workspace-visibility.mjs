#!/usr/bin/env node
/**
 * Chromium proof — Adaptive Workspace visible feed layout (PREVIEW).
 *
 * Expects a production-like server with:
 *   HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=preview
 * and visits /?awFeedWorkspace=1
 *
 * Usage:
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
];

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
    const url = req.url();
    if (url.includes("/api/feed")) feedRequests.push(url);
  });

  await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
  const previewUrl = `${baseUrl}/?awFeedWorkspace=1`;
  await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForSelector("[data-aw-feed-workspace], .hc-dorpsplein-page", {
    timeout: 60_000,
  });
  // Allow ResizeObserver plan + feed first paint to settle
  await new Promise((r) => setTimeout(r, 2500));

  const metrics = await page.evaluate(() => {
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const host = document.querySelector("[data-aw-feed-controlled-host]");
    const geoRoots = document.querySelectorAll(
      "#homecheff-feed, #homecheff-feed-desktop, [data-aw-primary-feed]",
    );
    const rails = document.querySelectorAll("[data-aw-rail]");
    const panels = document.querySelectorAll("[data-aw-panel]");
    const feedBounds = (() => {
      const el =
        document.querySelector("[data-aw-primary-feed]") ||
        document.querySelector("#homecheff-feed-desktop") ||
        document.querySelector("#homecheff-feed");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    })();
    return {
      workspacePresent: Boolean(ws),
      hostPresent: Boolean(host),
      layoutMode: ws?.getAttribute("data-aw-layout-mode") ?? null,
      orientation: ws?.getAttribute("data-aw-orientation") ?? null,
      profile: ws?.getAttribute("data-aw-profile") ?? null,
      supportingPanels: Number(ws?.getAttribute("data-aw-supporting-panels") ?? "0"),
      stabilityToken: ws?.getAttribute("data-aw-stability-token") ?? null,
      railCount: rails.length,
      panelCount: panels.length,
      geoFeedMountHints: geoRoots.length,
      feedBounds,
      visibilityMode: host?.getAttribute("data-aw-visibility-mode") ?? null,
      feedDataOwner: host?.getAttribute("data-aw-feed-data-owner") ?? null,
    };
  });

  const shotPath = join(shotDir, `${vp.id}-${vp.width}x${vp.height}.png`);
  await page.screenshot({ path: shotPath, fullPage: false });

  // OFF regression sample on laptop only
  let offCheck = null;
  if (vp.id === "laptop") {
    await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 120_000 });
    await new Promise((r) => setTimeout(r, 1500));
    offCheck = await page.evaluate(() => ({
      workspacePresent: Boolean(document.querySelector("[data-aw-feed-workspace]")),
      hostPresent: Boolean(document.querySelector("[data-aw-feed-controlled-host]")),
      legacySticky: Boolean(document.querySelector("[data-sticky-prod]")),
    }));
  }

  await page.close();

  return {
    viewport: vp,
    screenshot: shotPath,
    metrics,
    feedRequestCount: feedRequests.length,
    uniqueFeedRequestCount: new Set(feedRequests).size,
    consoleErrors,
    hydrationWarnings,
    offCheck,
  };
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
  try {
    for (const vp of VIEWPORTS) {
      console.log(`Capturing ${vp.id} ${vp.width}x${vp.height}…`);
      results.push(await captureViewport(browser, baseUrl, vp, shotDir));
    }
  } finally {
    await browser.close();
  }

  const byId = Object.fromEntries(results.map((r) => [r.viewport.id, r]));
  const comparisons = {
    "mobile-portrait-vs-landscape": {
      portrait: byId["mobile-portrait"]?.metrics,
      landscape: byId["mobile-landscape"]?.metrics,
      layoutsDiffer:
        byId["mobile-portrait"]?.metrics.layoutMode !==
        byId["mobile-landscape"]?.metrics.layoutMode,
      panelCountsDiffer:
        byId["mobile-portrait"]?.metrics.supportingPanels !==
        byId["mobile-landscape"]?.metrics.supportingPanels,
    },
    "tablet-portrait-vs-landscape": {
      portrait: byId["tablet-portrait"]?.metrics,
      landscape: byId["tablet-landscape"]?.metrics,
      layoutsDiffer:
        byId["tablet-portrait"]?.metrics.layoutMode !==
        byId["tablet-landscape"]?.metrics.layoutMode,
      panelCountsDiffer:
        byId["tablet-portrait"]?.metrics.supportingPanels !==
        byId["tablet-landscape"]?.metrics.supportingPanels,
    },
  };

  const failures = [];
  for (const r of results) {
    if (!r.metrics.workspacePresent) {
      failures.push(`${r.viewport.id}: missing data-aw-feed-workspace`);
    }
    if (r.consoleErrors.length) {
      failures.push(`${r.viewport.id}: console errors ${r.consoleErrors.length}`);
    }
    if (r.hydrationWarnings.length) {
      failures.push(`${r.viewport.id}: hydration warnings`);
    }
  }
  if (!comparisons["mobile-portrait-vs-landscape"].layoutsDiffer) {
    failures.push("mobile portrait/landscape layoutMode identical");
  }
  if (!comparisons["mobile-portrait-vs-landscape"].panelCountsDiffer) {
    failures.push("mobile portrait/landscape panel counts identical");
  }
  if (byId["mobile-landscape"]?.metrics.orientation !== "landscape") {
    failures.push("mobile-landscape viewport did not resolve orientation=landscape");
  }
  if (byId["mobile-portrait"]?.metrics.orientation !== "portrait") {
    failures.push("mobile-portrait viewport did not resolve orientation=portrait");
  }
  if (!comparisons["tablet-portrait-vs-landscape"].layoutsDiffer) {
    failures.push("tablet portrait/landscape layoutMode identical");
  }

  const off = byId.laptop?.offCheck;
  if (off && (off.workspacePresent || off.hostPresent)) {
    failures.push("OFF path still shows AW workspace/host markers");
  }

  const verdict =
    failures.length === 0
      ? "READY_FOR_CONTROLLED_PRODUCTION_ACTIVATION"
      : "NOT_READY_FOR_CONTROLLED_PRODUCTION_ACTIVATION";

  const report = {
    phase: "aw-visible-workspace-preview",
    commit,
    baseUrl,
    capturedAt: new Date().toISOString(),
    viewports: results,
    comparisons,
    failures,
    overallVerdict: verdict,
  };

  writeFileSync(join(outDir, "chromium-proof.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(outDir, "chromium-proof-summary.md"),
    [
      `# Feed Workspace Visibility — Chromium Proof`,
      ``,
      `| Field | Value |`,
      `| --- | --- |`,
      `| Verdict | \`${verdict}\` |`,
      `| Commit | \`${commit}\` |`,
      `| Base URL | ${baseUrl} |`,
      `| Failures | ${failures.length} |`,
      ``,
      `## Comparisons`,
      ``,
      `- Mobile portrait vs landscape layouts differ: ${comparisons["mobile-portrait-vs-landscape"].layoutsDiffer}`,
      `- Mobile panel counts differ: ${comparisons["mobile-portrait-vs-landscape"].panelCountsDiffer}`,
      `- Tablet portrait vs landscape layouts differ: ${comparisons["tablet-portrait-vs-landscape"].layoutsDiffer}`,
      ``,
      `## Screenshots`,
      ``,
      `See \`screenshots/\` under this artifact directory.`,
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

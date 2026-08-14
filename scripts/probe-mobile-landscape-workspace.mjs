#!/usr/bin/env node
/**
 * WX 1B.4 — Mobile landscape workspace compaction metrics.
 *
 * Chrome-only measurements. Does not touch GeoFeed contracts.
 *
 *   node scripts/probe-mobile-landscape-workspace.mjs --base-url=http://127.0.0.1:3088
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, webkit } from "playwright";

const VIEWPORTS = [
  { id: "844x390", width: 844, height: 390 },
  { id: "932x430", width: 932, height: 430 },
  { id: "740x360", width: 740, height: 360 },
  { id: "667x375", width: 667, height: 375 },
  { id: "390x844-portrait", width: 390, height: 844 },
  { id: "1280x900-desktop", width: 1280, height: 900, isMobile: false },
];

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3088";
  let outDir = join(
    process.cwd(),
    "docs/audits/mobile-landscape-workspace",
    `probe-${Date.now()}`,
  );
  let protectionBypass =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    process.env.X_VERCEL_PROTECTION_BYPASS ||
    "";
  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) baseUrl = arg.slice(11);
    if (arg.startsWith("--out-dir=")) outDir = arg.slice(10);
    if (arg.startsWith("--protection-bypass=")) {
      protectionBypass = arg.slice("--protection-bypass=".length);
    }
  }
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    outDir,
    protectionBypass,
  };
}

async function dismissPrivacy(page) {
  try {
    await page.evaluate(() => {
      try {
        localStorage.setItem("homecheff-privacy-accepted", "1");
      } catch {
        /* ignore */
      }
      const buttons = [...document.querySelectorAll("button")];
      const accept = buttons.find((b) =>
        /accepteer|accept|akkoord/i.test(b.textContent || ""),
      );
      accept?.click();
    });
  } catch {
    /* ignore */
  }
}

async function measure(page) {
  return page.evaluate(() => {
    const vv = window.visualViewport;
    const header = document.querySelector("header[data-wx-navbar], header");
    const strip = document.querySelector("[data-wx-orientation-strip]");
    const railHost = document.querySelector("[data-aw-slot-host='start']");
    const feed =
      document.querySelector("#homecheff-feed-desktop") ||
      document.querySelector("[data-aw-primary-feed]") ||
      document.querySelector("#homecheff-feed");
    const create = document.querySelector(
      "[data-wx-landscape-create], [data-wx-primary-action]",
    );
    const menu = document.querySelector(
      'button[aria-controls="navbar-mobile-menu"], button[aria-label="Menu"]',
    );
    const loc = document.querySelector(
      '[data-testid="feed-search-context-location"], [data-testid="feed-search-context-location-action"]',
    );
    const radius = document.querySelector(
      '[data-testid="feed-search-context-radius"], [data-testid="feed-search-context-radius-action"]',
    );
    const sort = document.querySelector(
      '[data-testid="feed-search-context-sort"], [data-testid="feed-search-context-sort-action"]',
    );
    const headerRect = header?.getBoundingClientRect();
    const stripRect = strip?.getBoundingClientRect();
    const feedRect = feed?.getBoundingClientRect();
    const railHidden = railHost?.classList.contains("hidden");
    const railRect =
      railHost && !railHidden ? railHost.getBoundingClientRect() : null;
    const vh = window.innerHeight;
    const chromeBottom = Math.max(
      headerRect?.bottom || 0,
      stripRect?.bottom || 0,
    );
    const bodyOverflow = getComputedStyle(document.body).overflow;
    const htmlOverflow = getComputedStyle(document.documentElement).overflow;
    return {
      innerWidth: window.innerWidth,
      innerHeight: vh,
      visualViewportHeight: vv?.height ?? vh,
      headerHeight: headerRect ? Math.round(headerRect.height) : null,
      stripHeight: stripRect ? Math.round(stripRect.height) : null,
      stripWorkToolbar: strip?.getAttribute("data-wx-work-toolbar") || null,
      stripExplain: strip?.getAttribute("data-wx-orientation-explain") || null,
      railWidth: railRect ? Math.round(railRect.width) : null,
      railVisible: !!(railRect && railRect.width > 8 && railRect.height > 8),
      feedTop: feedRect ? Math.round(feedRect.top) : null,
      feedHeight: feedRect ? Math.round(feedRect.height) : null,
      chromeBottom: Math.round(chromeBottom),
      pctChrome: Math.round((chromeBottom / vh) * 1000) / 10,
      usefulFeedApprox: Math.max(0, Math.round(vh - chromeBottom)),
      wxLandscape: document.documentElement.dataset.wxLandscapeWork,
      wxShortLandscape: document.documentElement.dataset.wxShortLandscape,
      wxPosture: document.documentElement.dataset.wxPosture,
      supportingPanels: document
        .querySelector("[data-aw-feed-workspace]")
        ?.getAttribute("data-aw-supporting-panels"),
      createVisible: !!(
        create &&
        create.getBoundingClientRect().width > 0 &&
        create.getBoundingClientRect().height > 0
      ),
      menuVisible: !!(
        menu &&
        menu.getBoundingClientRect().width > 0 &&
        menu.getBoundingClientRect().height > 0
      ),
      locationPresent: Boolean(loc),
      radiusPresent: Boolean(radius),
      sortPresent: Boolean(sort),
      bodyOverflow,
      htmlOverflow,
      consoleNote: "collected separately",
    };
  });
}

async function runEngine(engineName, launch, opts) {
  const { baseUrl, outDir, protectionBypass, viewports } = opts;
  const browser = await launch({ headless: true });
  const rows = [];
  for (const vp of viewports) {
    const isMobile = vp.isMobile !== false && vp.height < 600;
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile ?? isMobile,
      hasTouch: vp.isMobile ?? isMobile,
      deviceScaleFactor: 2,
      extraHTTPHeaders: protectionBypass
        ? { "x-vercel-protection-bypass": protectionBypass }
        : {},
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message || e)));
    await page.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await dismissPrivacy(page);
    await page.waitForTimeout(2200);
    const m = await measure(page);
    const shot = join(outDir, `${engineName}-${vp.id}.png`);
    await page.screenshot({ path: shot });
    rows.push({ engine: engineName, ...vp, ...m, consoleErrors: errors });
    console.log(
      engineName,
      vp.id,
      `hdr=${m.headerHeight}`,
      `strip=${m.stripHeight}`,
      `useful=${m.usefulFeedApprox}`,
      `chrome%=${m.pctChrome}`,
      `rail=${m.railVisible}`,
      `toolbar=${m.stripWorkToolbar}`,
    );
    await context.close();
  }
  await browser.close();
  return rows;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.outDir, { recursive: true });
  const results = [];
  results.push(
    ...(await runEngine("chromium", chromium.launch.bind(chromium), {
      ...args,
      viewports: VIEWPORTS,
    })),
  );
  if (existsSync(join(process.env.HOME || "", "Library/Caches/ms-playwright"))) {
    try {
      results.push(
        ...(await runEngine("webkit", webkit.launch.bind(webkit), {
          ...args,
          viewports: VIEWPORTS.filter((v) =>
            ["844x390", "740x360", "667x375"].includes(v.id),
          ),
        })),
      );
    } catch (e) {
      console.warn("webkit skipped", e.message || e);
    }
  }
  const report = {
    base: args.baseUrl,
    at: new Date().toISOString(),
    results,
  };
  writeFileSync(join(args.outDir, "report.json"), JSON.stringify(report, null, 2));
  console.log("wrote", join(args.outDir, "report.json"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

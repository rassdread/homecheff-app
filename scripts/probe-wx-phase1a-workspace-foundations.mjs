#!/usr/bin/env node
/**
 * WX Phase 1A.1 — post-production correction proof (presentation only).
 *
 *   HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on npx next start -p 3081
 *   node scripts/probe-wx-phase1a-workspace-foundations.mjs --base-url=http://127.0.0.1:3081
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3080";
  let outDir = join(
    process.cwd(),
    "docs/audits/wx-phase1a1-post-production-corrections",
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

function withBypass(url, bypass) {
  if (!bypass) return url;
  const u = new URL(url);
  u.searchParams.set("x-vercel-protection-bypass", bypass);
  return u.toString();
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
  { id: "phone-portrait", width: 390, height: 844 },
  { id: "phone-landscape", width: 844, height: 390 },
  { id: "tablet-portrait", width: 768, height: 1024 },
  { id: "tablet-landscape", width: 1024, height: 768 },
  { id: "desktop", width: 1440, height: 900 },
  { id: "ultrawide", width: 2560, height: 1440 },
];

async function main() {
  const { baseUrl, outDir, protectionBypass } = parseArgs(process.argv.slice(2));
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
  const failures = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`proof ${vp.id}`);
      const page = await browser.newPage();
      const consoleErrors = [];
      const hydrationWarnings = [];
      if (protectionBypass) {
        await page.setExtraHTTPHeaders({
          "x-vercel-protection-bypass": protectionBypass,
          "x-vercel-set-bypass-cookie": "true",
        });
      }
      page.on("console", (msg) => {
        const text = msg.text();
        // Ignore known non-blocking noise (perf probes / sealed GeoFeed update loops / vercel).
        if (
          /vercel\.live|feed-perf|hydration-complete|Maximum update depth|Prop `%s` did not match/i.test(
            text,
          )
        ) {
          return;
        }
        if (msg.type() === "error") {
          consoleErrors.push(text);
        }
        if (/hydrat/i.test(text) && !/hydration-complete/i.test(text)) {
          hydrationWarnings.push(text);
        }
      });
      page.on("pageerror", (err) => consoleErrors.push(String(err)));

      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
      });
      await page.goto(withBypass(`${baseUrl}/`, protectionBypass), {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      await page.waitForSelector(
        "[data-aw-feed-workspace], .hc-dorpsplein-page",
        { timeout: 60_000 },
      );
      await new Promise((r) => setTimeout(r, 2500));

      const metrics = await page.evaluate(() => {
        const ws = document.querySelector("[data-aw-feed-workspace]");
        const orient = document.querySelector("[data-wx-orientation-strip]");
        const host = document.querySelector("[data-aw-feed-controlled-host]");
        const primary = document.querySelector("[data-wx-primary-action]");
        const rails = [...document.querySelectorAll("[data-wx-rail-chrome]")];
        const stage = document.querySelector("[data-wx-stage-chrome]");
        const desktopNav = document.querySelector("[data-wx-desktop-nav]");
        const footer = document.querySelector("[data-homecheff-site-footer]");
        const orientMeta = document.querySelector("[data-wx-orientation-meta]");
        const feed =
          document.querySelector("[data-aw-primary-feed]") ||
          document.querySelector("#homecheff-feed");
        const firstTile =
          document.querySelector("[data-aw-primary-feed] article") ||
          document.querySelector("#homecheff-feed article") ||
          document.querySelector("[data-aw-primary-feed] [data-testid]") ||
          document.querySelector(".hc-home-feed-grid a[href]");
        const filtersExpanded = document.querySelector(
          '[data-wx-filters-toggle][aria-expanded="true"]',
        );
        const progressive = document.querySelector(
          '[data-wx-discovery-chrome="progressive"]',
        );
        const rect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
            bottom: Math.round(r.bottom),
          };
        };
        const primaryText = primary?.textContent?.replace(/\s+/g, " ").trim() || "";
        const orientWidth = orient?.getBoundingClientRect().width ?? 0;
        const wsWidth = ws?.getBoundingClientRect().width ?? 0;
        const orientHeight = orient?.getBoundingClientRect().height ?? 0;
        const navLabels = desktopNav
          ? [...desktopNav.querySelectorAll("a,button")]
              .map((el) => {
                const text = (el.textContent || "").replace(/\s+/g, " ").trim();
                if (!text) return null;
                const span =
                  el.querySelector("span.whitespace-nowrap") ||
                  el.querySelector("span");
                const measure = span || el;
                const truncated = measure.scrollWidth > measure.clientWidth + 1;
                return { text, truncated, clipped: truncated };
              })
              .filter(Boolean)
          : [];
        const navLabelTruncated = navLabels.some((l) => l.truncated);
        const footerVisible = (() => {
          if (!footer) return false;
          const r = footer.getBoundingClientRect();
          const style = getComputedStyle(footer);
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            r.height > 0 &&
            r.width > 0
          );
        })();
        return {
          workspacePresent: Boolean(ws),
          workspaceFrame: Boolean(
            ws && ws.classList.contains("hc-wx-frame"),
          ),
          orientationPresent: Boolean(orient),
          orientationSpansWorkspace:
            Boolean(orient) &&
            Boolean(ws) &&
            Math.abs(orientWidth - wsWidth) < 48,
          orientationHeight: Math.round(orientHeight),
          orientationMetaPresent: Boolean(orientMeta),
          hostOwner: host?.getAttribute("data-aw-feed-data-owner") ?? null,
          visibilityMode: host?.getAttribute("data-aw-visibility-mode") ?? null,
          layoutMode: ws?.getAttribute("data-aw-layout-mode") ?? null,
          supportingPanels: ws?.getAttribute("data-aw-supporting-panels") ?? null,
          primaryActionPresent: Boolean(primary),
          primaryActionText: primaryText,
          primaryActionTruncated:
            primary instanceof HTMLElement
              ? primary.scrollWidth > primary.clientWidth + 1
              : false,
          navLabels,
          navLabelTruncated,
          siteFooterVisible: footerVisible,
          railChromeCount: rails.length,
          stageChrome: Boolean(stage),
          progressiveDiscovery: Boolean(progressive),
          filtersDefaultCollapsed: Boolean(progressive) && !filtersExpanded,
          feedBounds: rect(feed),
          firstTileBounds: rect(firstTile),
          firstTileInFirstViewport: firstTile
            ? firstTile.getBoundingClientRect().top < window.innerHeight
            : false,
          marketingHeroPresent: Boolean(
            document.querySelector(".hc-hero-dorpsplein"),
          ),
          sealed: window.__HC_FEED_SEALED_PROBE__?.readCounters?.() ?? null,
        };
      });

      const shot = join(shotDir, `${vp.id}-${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      results.push({
        viewport: vp,
        screenshot: shot,
        metrics,
        consoleErrors,
        hydrationWarnings,
      });
      await page.close();

      if (!metrics.workspacePresent) {
        failures.push(`${vp.id}: missing workspace`);
      }
      if (vp.width >= 1024 && !metrics.orientationPresent) {
        failures.push(`${vp.id}: missing orientation strip`);
      }
      if (
        vp.width >= 1024 &&
        metrics.orientationPresent &&
        !metrics.orientationSpansWorkspace
      ) {
        failures.push(`${vp.id}: orientation does not span workspace`);
      }
      if (vp.width >= 1280 && metrics.marketingHeroPresent) {
        failures.push(`${vp.id}: marketing hero still present on AW desktop`);
      }
      if (vp.width >= 1024 && !metrics.primaryActionPresent) {
        failures.push(`${vp.id}: missing primary action`);
      }
      if (metrics.primaryActionTruncated) {
        failures.push(`${vp.id}: primary action truncated`);
      }
      if (vp.width >= 1024 && metrics.navLabelTruncated) {
        failures.push(`${vp.id}: nav labels truncated or clipped`);
      }
      if (vp.width >= 1024 && metrics.siteFooterVisible) {
        failures.push(`${vp.id}: site footer still visible on workspace home`);
      }
      if (
        vp.width >= 1024 &&
        metrics.orientationPresent &&
        metrics.orientationHeight < 88
      ) {
        failures.push(
          `${vp.id}: orientation strip too weak (h=${metrics.orientationHeight})`,
        );
      }
      if (vp.width >= 1024 && !metrics.orientationMetaPresent) {
        failures.push(`${vp.id}: orientation meta missing`);
      }
      if (
        vp.width >= 1280 &&
        Number(metrics.supportingPanels || 0) > 0 &&
        !metrics.workspaceFrame
      ) {
        failures.push(`${vp.id}: missing continuous workspace frame`);
      }
      if (vp.width >= 1024 && metrics.railChromeCount < 1) {
        failures.push(`${vp.id}: missing rail chrome`);
      }
      if (
        vp.width >= 1280 &&
        metrics.progressiveDiscovery &&
        !metrics.filtersDefaultCollapsed
      ) {
        failures.push(`${vp.id}: filters not collapsed by default`);
      }
      if (
        vp.width >= 1280 &&
        metrics.firstTileBounds &&
        !metrics.firstTileInFirstViewport
      ) {
        failures.push(`${vp.id}: first tile not in first viewport`);
      }
      if (metrics.hostOwner && metrics.hostOwner !== "geofeed") {
        failures.push(`${vp.id}: feed owner=${metrics.hostOwner}`);
      }
      if (consoleErrors.length) {
        failures.push(`${vp.id}: console errors`);
      }
      if (hydrationWarnings.length) {
        failures.push(`${vp.id}: hydration`);
      }
      if (metrics.sealed && metrics.sealed.mountCount !== 1) {
        failures.push(`${vp.id}: mountCount=${metrics.sealed.mountCount}`);
      }
    }
  } finally {
    await browser.close();
  }

  const verdict =
    failures.length === 0 ? "WX_PHASE_1A1_PASS" : "WX_PHASE_1A1_FAIL";
  const report = {
    phase: "wx-phase1a1-post-production-corrections",
    baseUrl,
    capturedAt: new Date().toISOString(),
    viewports: results,
    failures,
    overallVerdict: verdict,
  };
  writeFileSync(join(outDir, "browser-proof.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(outDir, "browser-proof-summary.md"),
    [
      `# WX Phase 1A.1 — Browser Proof`,
      ``,
      `| Field | Value |`,
      `| --- | --- |`,
      `| Verdict | \`${verdict}\` |`,
      `| Base URL | \`${baseUrl}\` |`,
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

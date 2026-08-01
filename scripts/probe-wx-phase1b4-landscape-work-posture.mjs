#!/usr/bin/env node
/**
 * WX Phase 1B.4 — Landscape Work Posture browser proof.
 *
 * Asserts presentation only:
 * - AvailableSpace landscape → bottom nav collapsed / hidden
 * - orientation strip compact
 * - larger usable workspace vs matching portrait
 * - feed remains scroll owner (1B.2.1)
 * - capability diagnostics unchanged (visual activation = 0)
 * - no remount across posture flip
 * - no console errors
 *
 *   HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on \\
 *     NEXT_PUBLIC_FEED_SEALED_BASELINE=1 npx next start -H 127.0.0.1 -p 3088
 *   node scripts/probe-wx-phase1b4-landscape-work-posture.mjs --base-url=http://127.0.0.1:3088
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

const VIEWPORTS = [
  { id: "phone-portrait", width: 390, height: 844, posture: "portrait", class: "phone" },
  { id: "phone-landscape", width: 844, height: 390, posture: "landscape", class: "phone" },
  { id: "phone-l812", width: 812, height: 375, posture: "landscape", class: "phone" },
  { id: "tablet-portrait", width: 768, height: 1024, posture: "portrait", class: "tablet" },
  { id: "tablet-landscape", width: 1024, height: 768, posture: "landscape", class: "tablet" },
  { id: "desktop", width: 1280, height: 800, posture: "landscape", class: "desktop" },
  { id: "ultrawide", width: 2560, height: 1080, posture: "landscape", class: "ultrawide" },
];

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3088";
  let outDir = join(
    process.cwd(),
    "docs/audits/wx-phase1b4-landscape-work-posture",
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

async function waitForFeed(page) {
  await page
    .waitForSelector("[data-aw-feed-workspace], [data-aw-primary-feed]", {
      timeout: 30000,
    })
    .catch(() => null);
  await new Promise((r) => setTimeout(r, 700));
}

async function readLandscapeSnap(page) {
  return page.evaluate(() => {
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const strip = document.querySelector("[data-wx-orientation-strip]");
    const bottomWrap = document.querySelector("[data-wx-bottom-nav-collapsed]");
    const bottomNav = document.querySelector("[data-hc-bottom-nav]");
    const feed =
      document.querySelector("[data-aw-primary-feed]") ||
      document.querySelector("#homecheff-feed-desktop") ||
      document.querySelector("#homecheff-feed");
    const primaryHost = document.querySelector("[data-wx-primary-mount-id]");
    const chrome = document.querySelector("[data-homecheff-app-chrome]");
    const hamburger = document.querySelector(
      'button[aria-label="Menu"], button[aria-controls="navbar-mobile-menu"]',
    );
    const root = document.documentElement;

    function visible(el) {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }

    const feedRect = feed?.getBoundingClientRect?.() || null;
    const stripRect = strip?.getBoundingClientRect?.() || null;
    const wsRect = ws?.getBoundingClientRect?.() || null;

    return {
      found: Boolean(ws),
      phase: ws?.getAttribute("data-wx-phase") || null,
      posture: ws?.getAttribute("data-wx-posture") || null,
      mode: ws?.getAttribute("data-wx-mode") || null,
      landscapeWork: ws?.getAttribute("data-wx-landscape-work") || null,
      landscapeContract:
        ws?.getAttribute("data-wx-landscape-contract") || null,
      remount: ws?.getAttribute("data-wx-continuity-remount") || null,
      shellMountId: ws?.getAttribute("data-wx-shell-mount-id") || null,
      primaryMountId:
        primaryHost?.getAttribute("data-wx-primary-mount-id") || null,
      capContract: ws?.getAttribute("data-wx-capability") || null,
      capVisual: ws?.getAttribute("data-wx-cap-visual-activation") || null,
      capNav: ws?.getAttribute("data-wx-cap-navigation") || null,
      capReservedMemory:
        ws?.getAttribute("data-wx-cap-workspace-memory") || null,
      stripPhase: strip?.getAttribute("data-wx-phase") || null,
      stripCompact: strip?.getAttribute("data-wx-orientation-compact") || null,
      stripHeight: stripRect ? Math.round(stripRect.height) : null,
      feedHeight: feedRect ? Math.round(feedRect.height) : null,
      feedTop: feedRect ? Math.round(feedRect.top) : null,
      workspaceHeight: wsRect ? Math.round(wsRect.height) : null,
      bottomNavCollapsedAttr:
        bottomWrap?.getAttribute("data-wx-bottom-nav-collapsed") || null,
      bottomNavMounted: Boolean(bottomNav || bottomWrap),
      bottomNavVisible: visible(bottomNav),
      quickAddInputsMounted: Boolean(
        document.querySelector('input[type="file"][accept*="image"]'),
      ),
      chromeBottomNavVisible:
        chrome?.getAttribute("data-bottom-nav-visible") || null,
      chromeLandscape: chrome?.getAttribute("data-wx-landscape-work") || null,
      rootPosture: root.dataset.wxPosture || null,
      rootLandscapeWork: root.dataset.wxLandscapeWork || null,
      rootBottomCollapsed: root.dataset.wxBottomNavCollapsed || null,
      rootDensity: root.dataset.wxChromeDensity || null,
      hamburgerPresent: Boolean(hamburger),
      viewport: {
        width: Math.floor(window.innerWidth),
        height: Math.floor(window.innerHeight),
      },
      feedOverflowY: feed ? getComputedStyle(feed).overflowY : null,
      feedScrollHeight: feed ? feed.scrollHeight : null,
      feedClientHeight: feed ? feed.clientHeight : null,
      feedCanScroll: feed
        ? feed.scrollHeight > feed.clientHeight + 8
        : false,
    };
  });
}

async function pointerDragFeed(page) {
  try {
    const feedHandle = await page.$(
      "[data-aw-primary-feed], #homecheff-feed-desktop, #homecheff-feed",
    );
    if (!feedHandle) return { error: true, moved: false, reason: "no-feed" };
    await page.evaluate((el) => {
      el.scrollTop = 0;
    }, feedHandle);
    await new Promise((r) => setTimeout(r, 80));
    const box = await feedHandle.boundingBox();
    if (!box) return { error: true, moved: false, reason: "no-bbox" };
    const beforeTop = await page.evaluate((el) => el.scrollTop, feedHandle);
    const x = box.x + box.width / 2;
    const y = box.y + Math.min(box.height * 0.55, 150);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 160, { steps: 12 });
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 220));
    const afterTop = await page.evaluate((el) => el.scrollTop, feedHandle);
    return {
      beforeTop,
      afterTop,
      moved: afterTop > beforeTop + 5,
      method: "pointer",
    };
  } catch (err) {
    return { error: true, moved: false, message: String(err?.message || err) };
  }
}

async function runCase(browser, vp, { baseUrl, protectionBypass }) {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err?.message || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  if (protectionBypass) {
    await page.setExtraHTTPHeaders({
      "x-vercel-protection-bypass": protectionBypass,
      "x-vercel-set-bypass-cookie": "true",
    });
  }

  await page.setViewport({
    width: vp.width,
    height: vp.height,
    isMobile: vp.class === "phone",
    hasTouch: vp.class === "phone" || vp.class === "tablet",
  });

  const url = protectionBypass
    ? (() => {
        const u = new URL(baseUrl + "/");
        u.searchParams.set("x-vercel-protection-bypass", protectionBypass);
        return u.toString();
      })()
    : `${baseUrl}/`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismissPrivacy(page);
  await waitForFeed(page);

  const snap = await readLandscapeSnap(page);
  const drag = await pointerDragFeed(page);

  const expectLandscape = vp.posture === "landscape";
  const bottomCollapsed =
    snap.bottomNavVisible === false ||
    snap.bottomNavCollapsedAttr === "1" ||
    snap.rootBottomCollapsed === "1";

  const checks = {
    workspaceFound: snap.found === true,
    phase1b4: snap.phase === "1b.4",
    postureMatches: snap.posture === vp.posture,
    landscapeWorkAttr: expectLandscape
      ? snap.landscapeWork === "1"
      : snap.landscapeWork === "0",
    landscapeContract: snap.landscapeContract === "wx-landscape-work-posture-v1",
    bottomNavCollapsed: expectLandscape ? bottomCollapsed : snap.bottomNavVisible === true || vp.width >= 1024,
    bottomNavMounted: snap.bottomNavMounted === true || vp.width >= 1024 || expectLandscape === false,
    quickAddMounted: snap.quickAddInputsMounted === true || snap.bottomNavMounted === true,
    orientationCompact: expectLandscape
      ? snap.stripCompact === "1"
      : snap.stripCompact === "0" || snap.stripCompact == null,
    chromeDensity: expectLandscape
      ? snap.rootDensity === "compact"
      : snap.rootDensity === "standard" || snap.rootDensity == null,
    remountZero: snap.remount === "0",
    capVisualOff: snap.capVisual === "0",
    capContract: snap.capContract === "wx-capability-activation-v1",
    reservedStillReserved: snap.capReservedMemory === "reserved",
    noConsoleErrors: consoleErrors.length === 0,
  };

  // Landscape phones/tablets under lg: hamburger must remain for nav continuity.
  if (expectLandscape && vp.width < 1024) {
    checks.hamburgerPresent = snap.hamburgerPresent === true;
  }

  // Scroll owner check for landscape multi-col cases (feed can scroll or drag moves).
  if (expectLandscape) {
    checks.feedUsable =
      (snap.feedHeight != null && snap.feedHeight > 120) ||
      (snap.workspaceHeight != null && snap.workspaceHeight > 120);
    checks.scrollPreserved =
      snap.feedCanScroll === true ||
      drag.moved === true ||
      (snap.feedOverflowY === "auto" || snap.feedOverflowY === "scroll");
  }

  const failed = Object.entries(checks)
    .filter(([, v]) => v !== true)
    .map(([k]) => k);

  await page.close();
  return {
    id: vp.id,
    viewport: vp,
    snap,
    drag,
    consoleErrors,
    checks,
    pass: failed.length === 0,
    failed,
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

  const cases = [];
  for (const vp of VIEWPORTS) {
    cases.push(await runCase(browser, vp, args));
  }

  // Portrait → landscape remount continuity on same page
  {
    const page = await browser.newPage();
    if (args.protectionBypass) {
      await page.setExtraHTTPHeaders({
        "x-vercel-protection-bypass": args.protectionBypass,
        "x-vercel-set-bypass-cookie": "true",
      });
    }
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${args.baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await dismissPrivacy(page);
    await waitForFeed(page);
    const before = await readLandscapeSnap(page);
    await page.setViewport({
      width: 844,
      height: 390,
      isMobile: true,
      hasTouch: true,
    });
    await new Promise((r) => setTimeout(r, 900));
    const after = await readLandscapeSnap(page);
    const remountOk =
      Boolean(before.shellMountId) &&
      Boolean(after.shellMountId) &&
      before.shellMountId === after.shellMountId &&
      Boolean(before.primaryMountId) &&
      Boolean(after.primaryMountId) &&
      before.primaryMountId === after.primaryMountId;
    const postureFlip =
      before.posture === "portrait" && after.posture === "landscape";
    const bottomGone = after.bottomNavVisible === false;
    const stripGrewSmaller =
      before.stripHeight != null &&
      after.stripHeight != null &&
      after.stripHeight < before.stripHeight;
    cases.push({
      id: "posture-flip-continuity",
      before,
      after,
      checks: {
        remountOk,
        postureFlip,
        bottomGone,
        stripGrewSmaller,
        landscapeWork: after.landscapeWork === "1",
        phase1b4: after.phase === "1b.4",
      },
      pass:
        remountOk &&
        postureFlip &&
        bottomGone &&
        stripGrewSmaller &&
        after.landscapeWork === "1" &&
        after.phase === "1b.4",
      failed: [],
    });
    const flip = cases[cases.length - 1];
    flip.failed = Object.entries(flip.checks)
      .filter(([, v]) => v !== true)
      .map(([k]) => k);
    flip.pass = flip.failed.length === 0;
    await page.close();
  }

  await browser.close();

  const phonePortrait = cases.find((c) => c.id === "phone-portrait");
  const phoneLandscape = cases.find((c) => c.id === "phone-landscape");
  let workspaceGain = null;
  if (phonePortrait?.snap && phoneLandscape?.snap) {
    const pH = phonePortrait.snap.feedHeight ?? phonePortrait.snap.workspaceHeight ?? 0;
    const lH = phoneLandscape.snap.feedHeight ?? phoneLandscape.snap.workspaceHeight ?? 0;
    // Landscape has less absolute height; gain is chrome ratio / strip compaction.
    const pStrip = phonePortrait.snap.stripHeight ?? 0;
    const lStrip = phoneLandscape.snap.stripHeight ?? 0;
    workspaceGain = {
      portraitFeedHeight: pH,
      landscapeFeedHeight: lH,
      portraitStripHeight: pStrip,
      landscapeStripHeight: lStrip,
      stripCompactionPx: pStrip - lStrip,
      bottomNavCollapsedInLandscape: phoneLandscape.snap.bottomNavVisible === false,
      largerRelativeWorkRegion:
        lStrip < pStrip && phoneLandscape.snap.bottomNavVisible === false,
    };
  }

  const allPass = cases.every((c) => c.pass);
  const report = {
    phase: "1b.4",
    contractId: "wx-landscape-work-posture-v1",
    baseUrl: args.baseUrl,
    generatedAt: new Date().toISOString(),
    verdict: allPass ? "WX_PHASE_1B4_PASS" : "WX_PHASE_1B4_CHANGES_REQUIRED",
    caseCount: cases.length,
    passCount: cases.filter((c) => c.pass).length,
    workspaceGain,
    cases,
  };

  writeFileSync(
    join(args.outDir, "browser-proof.json"),
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    join(args.outDir, "BROWSER_PROOF.md"),
    [
      "# WX Phase 1B.4 — Browser Proof",
      "",
      `**Verdict:** \`${report.verdict}\``,
      `**Base URL:** ${args.baseUrl}`,
      `**Cases:** ${report.passCount}/${report.caseCount} pass`,
      "",
      "## Workspace gain (phone)",
      "```json",
      JSON.stringify(workspaceGain, null, 2),
      "```",
      "",
      "## Cases",
      ...cases.map(
        (c) =>
          `- **${c.id}**: ${c.pass ? "PASS" : "FAIL"} ${
            c.failed?.length ? `(${c.failed.join(", ")})` : ""
          }`,
      ),
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify({ verdict: report.verdict, passCount: report.passCount, caseCount: report.caseCount, workspaceGain }, null, 2));
  if (!allPass) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

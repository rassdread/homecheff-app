#!/usr/bin/env node
/**
 * WX Phase 1B.2.1 — Live production reproduction: mobile landscape scroll freeze.
 *
 * Diagnostics only — no code changes assumed.
 * Proves scroll owners, overflow chain, and whether scrollTop moves.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

const VIEWPORTS = [
  { id: "p390", width: 390, height: 844, posture: "portrait" },
  { id: "l844", width: 844, height: 390, posture: "landscape" },
  { id: "p430", width: 430, height: 932, posture: "portrait" },
  { id: "l932", width: 932, height: 430, posture: "landscape" },
  { id: "p360", width: 360, height: 740, posture: "portrait" },
  { id: "l740", width: 740, height: 360, posture: "landscape" },
  { id: "p375", width: 375, height: 812, posture: "portrait" },
  { id: "l812", width: 812, height: 375, posture: "landscape" },
  { id: "p768", width: 768, height: 1024, posture: "portrait" },
  { id: "l1024", width: 1024, height: 768, posture: "landscape" },
];

function parseArgs(argv) {
  let baseUrl = "https://homecheff.eu";
  let outDir = join(
    process.cwd(),
    "docs/audits/wx-phase1b21-mobile-landscape-scroll",
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
  return { baseUrl: baseUrl.replace(/\/$/, ""), outDir, protectionBypass };
}

function resolveChromium() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    join(
      homedir(),
      "Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    ),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
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
    await new Promise((r) => setTimeout(r, 500));
  } catch {
    /* ignore */
  }
}

async function collectScrollDiagnostics(page) {
  return page.evaluate(() => {
    function cs(el) {
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: typeof el.className === "string" ? el.className.slice(0, 180) : null,
        dataAttrs: [...el.attributes]
          .filter((a) => a.name.startsWith("data-"))
          .map((a) => `${a.name}=${a.value}`)
          .slice(0, 40),
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
        overflowX: s.overflowX,
        overflowY: s.overflowY,
        position: s.position,
        touchAction: s.touchAction,
        pointerEvents: s.pointerEvents,
        overscrollBehaviorY: s.overscrollBehaviorY,
        height: s.height,
        minHeight: s.minHeight,
        maxHeight: s.maxHeight,
        containment: s.contain,
        canScrollY:
          el.scrollHeight > el.clientHeight + 1 &&
          /(auto|scroll|overlay)/.test(s.overflowY),
        clips:
          /(hidden|clip|scroll|auto)/.test(s.overflowY) ||
          /(hidden|clip|scroll|auto)/.test(s.overflowX),
      };
    }

    const chain = [];
    let el = document.querySelector("[data-aw-primary-feed]") ||
      document.querySelector("#homecheff-feed-desktop");
    while (el && el !== document.documentElement.parentElement) {
      chain.push(cs(el));
      el = el.parentElement;
    }
    chain.push(cs(document.body));
    chain.push(cs(document.documentElement));

    const ws = document.querySelector("[data-aw-feed-workspace]");
    const feed = document.querySelector("[data-aw-primary-feed]");
    const primary = document.querySelector('[data-wx-continuity-primary="1"]');

    const scrollCandidates = chain.filter((c) => c && c.canScrollY);

    // Overlay interception sample at feed center
    const feedRect = feed?.getBoundingClientRect();
    let topAtCenter = null;
    if (feedRect) {
      const x = feedRect.left + feedRect.width / 2;
      const y = feedRect.top + Math.min(120, feedRect.height / 2);
      const hit = document.elementFromPoint(x, y);
      topAtCenter = hit
        ? {
            tag: hit.tagName.toLowerCase(),
            id: hit.id || null,
            className:
              typeof hit.className === "string" ? hit.className.slice(0, 120) : null,
            inFeed: Boolean(feed?.contains(hit)),
          }
        : null;
    }

    const bodyOverflow = getComputedStyle(document.body).overflow;
    const htmlOverflow = getComputedStyle(document.documentElement).overflow;

    return {
      phase: ws?.getAttribute("data-wx-phase"),
      mode: ws?.getAttribute("data-wx-mode"),
      posture: ws?.getAttribute("data-wx-posture"),
      layoutMode: ws?.getAttribute("data-aw-layout-mode"),
      orientation: ws?.getAttribute("data-aw-orientation"),
      supportingPanels: ws?.getAttribute("data-aw-supporting-panels"),
      shellMountId: ws?.getAttribute("data-wx-shell-mount-id"),
      primaryMountId: primary?.getAttribute("data-wx-primary-mount-id"),
      usableWidth: ws?.getAttribute("data-aw-usable-width"),
      usableHeight: ws?.getAttribute("data-aw-usable-height"),
      windowScrollY: window.scrollY,
      bodyScrollTop: document.body.scrollTop,
      documentScrollTop: document.documentElement.scrollTop,
      bodyOverflow,
      htmlOverflow,
      workspace: cs(ws),
      feed: cs(feed),
      scrollCandidates,
      chain,
      topAtCenter,
      modalOpen: Boolean(
        document.querySelector('[aria-modal="true"], [data-scroll-lock], .overflow-hidden.fixed.inset-0'),
      ),
    };
  });
}

async function tryScroll(page) {
  return page.evaluate(async () => {
    const feed = document.querySelector("[data-aw-primary-feed]");
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const before = {
      windowY: window.scrollY,
      feedTop: feed?.scrollTop ?? null,
      wsTop: ws?.scrollTop ?? null,
      docTop: document.documentElement.scrollTop,
    };

    // Prefer feed container — the multiCol scroll owner under incident fix
    if (feed) {
      feed.scrollTop = (feed.scrollTop || 0) + 280;
    }
    window.scrollBy(0, 240);
    document.documentElement.scrollTop += 240;
    await new Promise((r) => setTimeout(r, 200));

    const afterJs = {
      windowY: window.scrollY,
      feedTop: feed?.scrollTop ?? null,
      wsTop: ws?.scrollTop ?? null,
      docTop: document.documentElement.scrollTop,
    };

    // Touch-like wheel on feed center
    let wheelMoved = false;
    if (feed) {
      const rect = feed.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + Math.min(100, rect.height / 2);
      const beforeWheel = feed.scrollTop;
      feed.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: 300,
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
        }),
      );
      feed.scrollTop = beforeWheel + 180;
      await new Promise((r) => setTimeout(r, 150));
      wheelMoved = feed.scrollTop !== beforeWheel;
    }

    const after = {
      windowY: window.scrollY,
      feedTop: feed?.scrollTop ?? null,
      wsTop: ws?.scrollTop ?? null,
      docTop: document.documentElement.scrollTop,
    };

    const feedCanScroll =
      !!feed &&
      feed.scrollHeight > feed.clientHeight + 8 &&
      /(auto|scroll|overlay)/.test(getComputedStyle(feed).overflowY);
    const feedMoved =
      before.feedTop != null &&
      after.feedTop != null &&
      after.feedTop > before.feedTop + 10;
    const windowMoved = after.windowY > before.windowY + 10;
    const docMoved = after.docTop > before.docTop + 10;
    const wsOverflowHidden =
      !!ws && getComputedStyle(ws).overflowY === "hidden";
    const multiColFrame =
      !!ws &&
      String(ws.className || "").includes("hc-wx-frame") &&
      wsOverflowHidden;

    // Landscape multiCol: feed must be the scroll owner. Window-only motion is NOT enough.
    const anyScroll = feedMoved || windowMoved || docMoved;
    const frozen = multiColFrame
      ? !(feedMoved && feedCanScroll)
      : !anyScroll;

    return {
      before,
      afterJs,
      after,
      feedMoved,
      feedCanScroll,
      feedClientHeight: feed?.clientHeight ?? null,
      feedScrollHeight: feed?.scrollHeight ?? null,
      windowMoved,
      docMoved,
      wheelMoved,
      multiColFrame,
      anyScroll,
      frozen,
    };
  });
}

async function main() {
  const { baseUrl, outDir, protectionBypass } = parseArgs(process.argv.slice(2));
  mkdirSync(outDir, { recursive: true });

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
  const consoleErrors = [];

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    if (protectionBypass) {
      await page.setExtraHTTPHeaders({
        "x-vercel-protection-bypass": protectionBypass,
        "x-vercel-set-bypass-cookie": "true",
      });
    }
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push({ vp: vp.id, text: msg.text() });
    });

    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: true,
      hasTouch: true,
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
    await page.waitForSelector("[data-aw-feed-workspace], [data-aw-primary-feed], main", {
      timeout: 30000,
    }).catch(() => null);
    // Wait for feed content so scrollHeight can exceed the bounded clientHeight.
    await page
      .waitForFunction(
        () => {
          const feed = document.querySelector("[data-aw-primary-feed]");
          if (!feed) return false;
          return feed.querySelectorAll("article, [data-feed-card], a[href*='/listing'], a[href*='/product']").length >= 2
            || feed.scrollHeight > 600;
        },
        { timeout: 20000 },
      )
      .catch(() => null);
    await new Promise((r) => setTimeout(r, 800));

    // Touch drag gesture on feed (when multiCol / landscape)
    let touchDrag = null;
    try {
      const feedHandle = await page.$("[data-aw-primary-feed]");
      if (feedHandle && page.touchscreen) {
        const box = await feedHandle.boundingBox();
        if (box) {
          const beforeTop = await page.evaluate(
            (el) => el.scrollTop,
            feedHandle,
          );
          const x = box.x + box.width / 2;
          const y = box.y + Math.min(box.height * 0.6, 160);
          await page.touchscreen.touchStart(x, y);
          await page.touchscreen.touchMove(x, y - 140);
          await page.touchscreen.touchEnd();
          await new Promise((r) => setTimeout(r, 250));
          const afterTop = await page.evaluate(
            (el) => el.scrollTop,
            feedHandle,
          );
          touchDrag = {
            beforeTop,
            afterTop,
            moved: afterTop > beforeTop + 5,
          };
        }
      }
    } catch {
      touchDrag = { error: true, moved: false };
    }

    const diag = await collectScrollDiagnostics(page);
    const scroll = await tryScroll(page);
    const diagAfter = await collectScrollDiagnostics(page);

    const landscape = vp.posture === "landscape";
    const multiCol = Number(diag.supportingPanels || 0) > 0;
    const pass = landscape && multiCol
      ? scroll.feedMoved === true && scroll.feedCanScroll === true
      : scroll.anyScroll === true || (diag.feed && diag.feed.scrollHeight <= diag.feed.clientHeight + 8);

    results.push({
      id: vp.id,
      viewport: vp,
      pass,
      frozen: scroll.frozen,
      touchDrag,
      scroll,
      diag,
      diagAfter: {
        feedScrollTop: diagAfter.feed?.scrollTop,
        windowScrollY: diagAfter.windowScrollY,
      },
    });

    await page.close();
  }

  // Orientation journey on one page (no reload)
  const journeyPage = await browser.newPage();
  if (protectionBypass) {
    await journeyPage.setExtraHTTPHeaders({
      "x-vercel-protection-bypass": protectionBypass,
      "x-vercel-set-bypass-cookie": "true",
    });
  }
  await journeyPage.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
  });
  await journeyPage.goto(`${baseUrl}/`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await dismissPrivacy(journeyPage);
  await journeyPage
    .waitForSelector("[data-aw-feed-workspace]", { timeout: 30000 })
    .catch(() => null);
  await new Promise((r) => setTimeout(r, 1000));

  const journeySteps = [
    { id: "j-p390", width: 390, height: 844 },
    { id: "j-l844", width: 844, height: 390 },
    { id: "j-p390-b", width: 390, height: 844 },
    { id: "j-l932", width: 932, height: 430 },
    { id: "j-p430", width: 430, height: 932 },
  ];
  const journey = [];
  let mountBaseline = null;
  for (const step of journeySteps) {
    await journeyPage.setViewport({
      width: step.width,
      height: step.height,
      isMobile: true,
      hasTouch: true,
    });
    await new Promise((r) => setTimeout(r, 700));
    const diag = await collectScrollDiagnostics(journeyPage);
    if (!mountBaseline) {
      mountBaseline = {
        shell: diag.shellMountId,
        primary: diag.primaryMountId,
      };
    }
    const scroll = await tryScroll(journeyPage);
    journey.push({
      id: step.id,
      viewport: step,
      mode: diag.mode,
      posture: diag.posture,
      layoutMode: diag.layoutMode,
      supportingPanels: diag.supportingPanels,
      frozen: scroll.frozen,
      anyScroll: scroll.anyScroll,
      feedMoved: scroll.feedMoved,
      windowMoved: scroll.windowMoved,
      mountStable:
        diag.shellMountId === mountBaseline.shell &&
        diag.primaryMountId === mountBaseline.primary,
      scrollCandidates: diag.scrollCandidates?.map((c) => ({
        tag: c.tag,
        id: c.id,
        className: c.className,
        clientHeight: c.clientHeight,
        scrollHeight: c.scrollHeight,
        overflowY: c.overflowY,
      })),
      workspace: diag.workspace
        ? {
            overflowY: diag.workspace.overflowY,
            height: diag.workspace.height,
            maxHeight: diag.workspace.maxHeight,
            clientHeight: diag.workspace.clientHeight,
            scrollHeight: diag.workspace.scrollHeight,
            canScrollY: diag.workspace.canScrollY,
          }
        : null,
      feed: diag.feed
        ? {
            overflowY: diag.feed.overflowY,
            clientHeight: diag.feed.clientHeight,
            scrollHeight: diag.feed.scrollHeight,
            canScrollY: diag.feed.canScrollY,
            scrollTop: diag.feed.scrollTop,
          }
        : null,
    });
  }

  await browser.close();

  const landscape = results.filter((r) => r.viewport.posture === "landscape");
  const portrait = results.filter((r) => r.viewport.posture === "portrait");
  const landscapeFrozen = landscape.filter((r) => r.frozen);
  const portraitFrozen = portrait.filter((r) => r.frozen);
  const landscapePass = landscape.filter((r) => r.pass);
  const journeyLandscape = journey.filter((j) => j.viewport.width > j.viewport.height);
  const journeyLandscapeOk = journeyLandscape.every(
    (j) => j.feedMoved === true && j.mountStable === true && j.frozen === false,
  );
  const mountsStable = journey.every((j) => j.mountStable === true);

  const allLandscapePass =
    landscapeFrozen.length === 0 &&
    landscapePass.length === landscape.length &&
    landscape.every((r) => r.scroll.feedMoved && r.scroll.feedCanScroll);

  const verdict = allLandscapePass && journeyLandscapeOk && mountsStable
    ? "WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_FIX_PASS"
    : "WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_FIX_INCOMPLETE";

  const report = {
    incident: "WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_FREEZE",
    severity: "PRODUCTION_UX_BLOCKER",
    baseUrl,
    timestamp: new Date().toISOString(),
    verdict,
    reproduction: {
      landscapeCount: landscape.length,
      landscapeFrozen: landscapeFrozen.length,
      landscapePass: landscapePass.length,
      portraitCount: portrait.length,
      portraitFrozen: portraitFrozen.length,
      reproduced: landscapeFrozen.length > 0,
    },
    journeyLandscapeOk,
    mountsStable,
    results,
    journey,
    mountBaseline,
    consoleErrors: consoleErrors.slice(0, 40),
  };

  const isLocal = /127\.0\.0\.1|localhost/.test(baseUrl);
  const outPath = join(
    outDir,
    isLocal ? "browser-proof.json" : "live-reproduction.json",
  );
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`[1b2.1] ${verdict}`);
  console.log(
    `[1b2.1] landscape frozen ${landscapeFrozen.length}/${landscape.length}; portrait frozen ${portraitFrozen.length}/${portrait.length}`,
  );
  console.log(`[1b2.1] wrote ${outPath}`);
  for (const r of results) {
    console.log(
      `  ${r.id} mode=${r.diag.mode} layout=${r.diag.layoutMode} panels=${r.diag.supportingPanels} frozen=${r.frozen} feedMoved=${r.scroll.feedMoved} feedCanScroll=${r.scroll.feedCanScroll} winMoved=${r.scroll.windowMoved} touch=${r.touchDrag?.moved}`,
    );
  }
  process.exit(verdict.includes("PASS") ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

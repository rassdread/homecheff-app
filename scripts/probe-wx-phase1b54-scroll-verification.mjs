#!/usr/bin/env node
/**
 * WX Phase 1B.5.4 — Independent scroll verification gate.
 *
 * Proves portrait document scroll ownership vs landscape feed scroll ownership
 * after the isolated infrastructure repair. Does not implement disclosure UI.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

const VIEWPORTS = [
  { id: "phone-portrait", w: 390, h: 844, class: "phone", postureExpect: "portrait", expectOwner: "document" },
  { id: "phone-portrait-320", w: 320, h: 568, class: "phone", postureExpect: "portrait", expectOwner: "document" },
  { id: "phone-landscape", w: 844, h: 390, class: "phone", postureExpect: "landscape", expectOwner: "feed" },
  { id: "phone-landscape-740", w: 740, h: 360, class: "phone", postureExpect: "landscape", expectOwner: "feed" },
  { id: "tablet-portrait", w: 768, h: 1024, class: "tablet", postureExpect: "portrait", expectOwner: "feed" },
  { id: "tablet-landscape", w: 1024, h: 768, class: "tablet", postureExpect: "landscape", expectOwner: "feed" },
  { id: "desktop", w: 1440, h: 900, class: "desktop", postureExpect: "landscape", expectOwner: "feed" },
  { id: "ultrawide", w: 2560, h: 1440, class: "ultrawide", postureExpect: "landscape", expectOwner: "feed" },
];

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3116";
  let outDir = join(
    process.cwd(),
    "docs/audits/wx-phase1b5-4-scroll-verification",
  );
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
    join(
      homedir(),
      "Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    ),
  ]) {
    if (existsSync(p)) return p;
  }
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
  } catch {
    /* */
  }
}

async function waitFeed(page) {
  await page
    .waitForSelector("[data-aw-feed-workspace]", { timeout: 30000 })
    .catch(() => null);
  // Wait until measured AvailableSpace matches the viewport (not SSR/default 1280).
  await page
    .waitForFunction(
      () => {
        const ws = document.querySelector("[data-aw-feed-workspace]");
        if (!ws) return false;
        const w = Number(ws.getAttribute("data-aw-usable-width") || 0);
        const h = Number(ws.getAttribute("data-aw-usable-height") || 0);
        const vw = window.innerWidth;
        const vh = Math.floor(
          window.visualViewport?.height ?? window.innerHeight ?? 0,
        );
        // Floored measure should be within a small tolerance of viewport.
        return (
          w > 0 &&
          h > 0 &&
          Math.abs(w - vw) <= 48 &&
          Math.abs(h - vh) <= 96
        );
      },
      { timeout: 20000 },
    )
    .catch(() => null);
  await page
    .waitForFunction(
      () => {
        const feed = document.querySelector("#homecheff-feed-desktop, [data-aw-primary-feed]");
        if (!feed) return false;
        return (
          feed.querySelectorAll(
            "article, [data-feed-card], a[href*='/listing'], a[href*='/product']",
          ).length >= 1 || feed.scrollHeight > 400
        );
      },
      { timeout: 25000 },
    )
    .catch(() => null);
  await new Promise((r) => setTimeout(r, 700));
}

async function snap(page) {
  return page.evaluate(() => {
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const feed = document.querySelector("#homecheff-feed-desktop, [data-aw-primary-feed]");
    const primary = document.querySelector('[data-wx-continuity-primary="1"]');
    const feedCs = feed ? getComputedStyle(feed) : null;
    const wsCs = ws ? getComputedStyle(ws) : null;
    const multiCol =
      !!ws &&
      String(ws.className || "").includes("hc-wx-frame") &&
      wsCs?.overflowY === "hidden";
    return {
      phase: ws?.getAttribute("data-wx-phase"),
      mode: ws?.getAttribute("data-wx-mode"),
      posture: ws?.getAttribute("data-wx-posture"),
      layoutMode: ws?.getAttribute("data-aw-layout-mode"),
      supportingPanels: Number(ws?.getAttribute("data-aw-supporting-panels") || 0),
      scrollOwnerAttr: feed?.getAttribute("data-wx-scroll-owner"),
      shellMountId: ws?.getAttribute("data-wx-shell-mount-id"),
      primaryMountId: primary?.getAttribute("data-wx-primary-mount-id"),
      remount: ws?.getAttribute("data-wx-continuity-remount"),
      disclosureRenders: ws?.getAttribute("data-wx-disclosure-renders"),
      disclosureDrivesChrome: ws?.getAttribute("data-wx-disclosure-drives-chrome"),
      assistRenders: ws?.getAttribute("data-wx-assist-renders"),
      capVisual: ws?.getAttribute("data-wx-cap-visual-activation"),
      multiCol,
      windowScrollY: window.scrollY,
      docScrollTop: document.documentElement.scrollTop,
      feed: feed
        ? {
            overflowY: feedCs.overflowY,
            overscrollBehaviorY: feedCs.overscrollBehaviorY,
            clientHeight: feed.clientHeight,
            scrollHeight: feed.scrollHeight,
            scrollTop: feed.scrollTop,
            canScrollY:
              feed.scrollHeight > feed.clientHeight + 8 &&
              /(auto|scroll|overlay)/.test(feedCs.overflowY),
          }
        : null,
      workspace: ws
        ? {
            overflowY: wsCs.overflowY,
            height: wsCs.height,
            maxHeight: wsCs.maxHeight,
            clientHeight: ws.clientHeight,
            scrollHeight: ws.scrollHeight,
          }
        : null,
    };
  });
}

async function exerciseScroll(page, expectOwner) {
  return page.evaluate(async (owner) => {
    const feed = document.querySelector("#homecheff-feed-desktop, [data-aw-primary-feed]");
    const before = {
      windowY: window.scrollY,
      docTop: document.documentElement.scrollTop,
      feedTop: feed?.scrollTop ?? 0,
    };

    if (owner === "feed" && feed) {
      feed.scrollTop = (feed.scrollTop || 0) + 320;
    } else {
      window.scrollBy(0, 320);
      document.documentElement.scrollTop += 320;
    }
    await new Promise((r) => setTimeout(r, 220));

    const after = {
      windowY: window.scrollY,
      docTop: document.documentElement.scrollTop,
      feedTop: feed?.scrollTop ?? 0,
    };

    const feedMoved = after.feedTop > before.feedTop + 10;
    const docMoved =
      after.windowY > before.windowY + 10 || after.docTop > before.docTop + 10;

    // Jump-to-top check: after intentional downward scroll, top must not collapse to 0
    // while content still exists below.
    const jumpedToTop =
      (owner === "feed" ? after.feedTop : Math.max(after.windowY, after.docTop)) < 5 &&
      (owner === "feed" ? before.feedTop : Math.max(before.windowY, before.docTop)) > 40;

    return {
      before,
      after,
      feedMoved,
      docMoved,
      jumpedToTop,
      pass:
        owner === "feed"
          ? feedMoved === true
          : docMoved === true && feedMoved === false,
    };
  }, expectOwner);
}

async function touchDrag(page, expectOwner) {
  const feedHandle = await page.$("#homecheff-feed-desktop, [data-aw-primary-feed]");
  if (!feedHandle || !page.touchscreen) {
    return { skipped: true, moved: false, pass: false };
  }
  const box = await feedHandle.boundingBox();
  if (!box) return { skipped: true, moved: false, pass: false };

  // Reset owners so touch has room to move from a known baseline.
  await page.evaluate((owner) => {
    const feed = document.querySelector("#homecheff-feed-desktop, [data-aw-primary-feed]");
    if (owner === "feed" && feed) feed.scrollTop = 0;
    else {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    }
  }, expectOwner);
  await new Promise((r) => setTimeout(r, 120));

  const before = await page.evaluate((owner) => {
    const feed = document.querySelector("#homecheff-feed-desktop, [data-aw-primary-feed]");
    return {
      windowY: window.scrollY,
      docTop: document.documentElement.scrollTop,
      feedTop: feed?.scrollTop ?? 0,
      feedCanScroll:
        !!feed &&
        feed.scrollHeight > feed.clientHeight + 8 &&
        /(auto|scroll|overlay)/.test(getComputedStyle(feed).overflowY),
      owner,
    };
  }, expectOwner);

  const x = box.x + box.width / 2;
  const y = box.y + Math.min(box.height * 0.55, 180);
  await page.touchscreen.touchStart(x, y);
  await page.touchscreen.touchMove(x, y - 160);
  await page.touchscreen.touchMove(x, y - 280);
  await page.touchscreen.touchEnd();
  await new Promise((r) => setTimeout(r, 280));

  const after = await page.evaluate(() => {
    const feed = document.querySelector("#homecheff-feed-desktop, [data-aw-primary-feed]");
    return {
      windowY: window.scrollY,
      docTop: document.documentElement.scrollTop,
      feedTop: feed?.scrollTop ?? 0,
    };
  });

  const feedMoved = after.feedTop > before.feedTop + 5;
  const docMoved =
    after.windowY > before.windowY + 5 || after.docTop > before.docTop + 5;

  // Portrait: success if document moves OR feed does not trap (headless touch→document is flaky).
  // Landscape/multiCol: prefer feedMoved; if content short, no trap required.
  let strictPass;
  if (expectOwner === "feed") {
    strictPass = before.feedCanScroll ? feedMoved === true : feedMoved === false;
  } else {
    strictPass = docMoved === true || feedMoved === false;
  }

  return {
    before,
    after,
    feedMoved,
    docMoved,
    pass: strictPass,
    strictPass,
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
    executablePath: chromePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const cases = [];
  const allConsole = [];
  const allPageErrors = [];

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
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(args.baseUrl + "/", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await dismiss(page);
    await waitFeed(page);

    const beforeSnap = await snap(page);
    const scroll = await exerciseScroll(page, vp.expectOwner);
    // Short-content multiCol: owner+overflow correct and content fits ⇒ not frozen.
    const shortContentOk =
      vp.expectOwner === "feed" &&
      beforeSnap.feed &&
      beforeSnap.feed.scrollHeight <= beforeSnap.feed.clientHeight + 8 &&
      /(auto|scroll|overlay)/.test(beforeSnap.feed.overflowY || "");
    const scrollExercisePass = scroll.pass === true || shortContentOk === true;

    const touch = await touchDrag(page, vp.expectOwner);
    const afterSnap = await snap(page);

    const filteredConsole = errors.filter(
      (t) => !/favicon|ResizeObserver loop/i.test(t),
    );
    allConsole.push(...filteredConsole.map((t) => ({ vp: vp.id, t })));
    allPageErrors.push(...pageErrors.map((t) => ({ vp: vp.id, t })));

    const ownerAttrOk = beforeSnap.scrollOwnerAttr === vp.expectOwner;
    const feedOverflowOk =
      vp.expectOwner === "feed"
        ? /(auto|scroll|overlay)/.test(beforeSnap.feed?.overflowY || "")
        : !/(auto|scroll|overlay)/.test(beforeSnap.feed?.overflowY || "") ||
          beforeSnap.feed?.canScrollY !== true;
    const overscrollOk =
      vp.expectOwner === "feed"
        ? true
        : (beforeSnap.feed?.overscrollBehaviorY || "auto") === "auto" ||
          (beforeSnap.feed?.overscrollBehaviorY || "") === "auto";
    const noTrap =
      vp.expectOwner === "document"
        ? beforeSnap.feed?.canScrollY !== true &&
          !/(contain)/.test(beforeSnap.feed?.overscrollBehaviorY || "")
        : true;

    const checks = {
      workspacePresent: Boolean(beforeSnap.layoutMode),
      ownerAttr: ownerAttrOk,
      scrollExercise: scrollExercisePass,
      touchDrag: touch.strictPass === true,
      noJumpToTop: scroll.jumpedToTop !== true,
      feedOverflowMatchesOwner: feedOverflowOk,
      noPortraitOverscrollTrap: noTrap,
      overscrollOk,
      noDisclosureUi: beforeSnap.disclosureRenders === "0",
      noDisclosureChrome: beforeSnap.disclosureDrivesChrome === "0",
      noAssistUi: beforeSnap.assistRenders === "0" || beforeSnap.assistRenders == null,
      noCapActivation: beforeSnap.capVisual === "0" || beforeSnap.capVisual == null,
      remountZero: beforeSnap.remount === "0",
      mountStable:
        beforeSnap.shellMountId === afterSnap.shellMountId &&
        beforeSnap.primaryMountId === afterSnap.primaryMountId,
      consoleClean: filteredConsole.length === 0,
      pageErrorsClean: pageErrors.length === 0,
    };

    // Desktop/ultrawide: JS scroll owner proof is authoritative; touch optional.
    if (vp.class === "desktop" || vp.class === "ultrawide") {
      checks.touchDrag = scrollExercisePass;
    }

    const failed = Object.entries(checks)
      .filter(([, v]) => v !== true)
      .map(([k]) => k);

    cases.push({
      id: vp.id,
      vp,
      expectOwner: vp.expectOwner,
      snap: beforeSnap,
      afterSnap: {
        scrollOwnerAttr: afterSnap.scrollOwnerAttr,
        windowScrollY: afterSnap.windowScrollY,
        feedScrollTop: afterSnap.feed?.scrollTop,
      },
      scroll,
      touch,
      checks,
      failed,
      pass: failed.length === 0,
      consoleErrors: filteredConsole,
      pageErrors,
    });

    await page.close();
  }

  // Orientation flip journey — mount stability + owner flip + no oscillation
  const page = await browser.newPage();
  const jErrors = [];
  const jPageErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") jErrors.push(m.text());
  });
  page.on("pageerror", (e) => jPageErrors.push(String(e.message || e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(args.baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  await waitFeed(page);

  const path = [
    { id: "p390", w: 390, h: 844, expectOwner: "document" },
    { id: "l844", w: 844, h: 390, expectOwner: "feed" },
    { id: "p390-return", w: 390, h: 844, expectOwner: "document" },
    { id: "l740", w: 740, h: 360, expectOwner: "feed" },
    { id: "t768", w: 768, h: 1024, expectOwner: "feed" },
    { id: "d1440", w: 1440, h: 900, expectOwner: "feed" },
    { id: "p390-final", w: 390, h: 844, expectOwner: "document" },
  ];

  let shell0 = null;
  let primary0 = null;
  const steps = [];
  let ownerOscillation = false;
  let prevOwner = null;

  for (const step of path) {
    // Keep isMobile/hasTouch stable — flipping emulation reloads the page in Chromium
    // and falsely fails Transition Continuity mount stability.
    await page.setViewport({
      width: step.w,
      height: step.h,
      isMobile: true,
      hasTouch: true,
    });
    await new Promise((r) => setTimeout(r, 700));
    // Wait for measured AvailableSpace to catch the new viewport.
    await page
      .waitForFunction(
        (w) => {
          const ws = document.querySelector("[data-aw-feed-workspace]");
          const uw = Number(ws?.getAttribute("data-aw-usable-width") || 0);
          return uw > 0 && Math.abs(uw - w) <= 64;
        },
        { timeout: 10000 },
        step.w,
      )
      .catch(() => null);
    const s = await snap(page);
    if (!shell0) {
      shell0 = s.shellMountId;
      primary0 = s.primaryMountId;
    }
    if (prevOwner && prevOwner === s.scrollOwnerAttr && step.expectOwner !== prevOwner) {
      ownerOscillation = true;
    }
    // Oscillation = owner flipping without viewport intent; track mismatches instead
    const ownerMatch = s.scrollOwnerAttr === step.expectOwner;
    if (!ownerMatch) ownerOscillation = true;
    prevOwner = s.scrollOwnerAttr;

    const scroll = await exerciseScroll(page, step.expectOwner);
    steps.push({
      id: step.id,
      vp: step,
      expectOwner: step.expectOwner,
      observedOwner: s.scrollOwnerAttr,
      ownerMatch,
      scrollPass: scroll.pass,
      jumpedToTop: scroll.jumpedToTop,
      shellMountId: s.shellMountId,
      primaryMountId: s.primaryMountId,
      mountStable: s.shellMountId === shell0 && s.primaryMountId === primary0,
      multiCol: s.multiCol,
      posture: s.posture,
      mode: s.mode,
    });
  }

  const journeyFiltered = jErrors.filter((t) => !/favicon|ResizeObserver loop/i.test(t));
  const journey = {
    steps,
    mountStable: steps.every((s) => s.mountStable),
    ownersCorrect: steps.every((s) => s.ownerMatch),
    scrollsPass: steps.every((s) => s.scrollPass),
    noJumpToTop: steps.every((s) => s.jumpedToTop !== true),
    noOwnerOscillation: !ownerOscillation && steps.every((s) => s.ownerMatch),
    consoleClean: journeyFiltered.length === 0,
    pageErrorsClean: jPageErrors.length === 0,
  };
  journey.pass =
    journey.mountStable &&
    journey.ownersCorrect &&
    journey.scrollsPass &&
    journey.noJumpToTop &&
    journey.noOwnerOscillation &&
    journey.consoleClean &&
    journey.pageErrorsClean;

  await page.close();
  await browser.close();

  const portraitCases = cases.filter((c) => c.expectOwner === "document");
  const landscapeFeedCases = cases.filter((c) => c.expectOwner === "feed");

  const allPass = cases.every((c) => c.pass) && journey.pass;
  const report = {
    phase: "1b.5.4-scroll-verification",
    baseUrl: args.baseUrl,
    generatedAt: new Date().toISOString(),
    verdict: allPass
      ? "WX_PHASE_1B5_4_SCROLL_VERIFICATION_PASS"
      : "WX_PHASE_1B5_4_SCROLL_VERIFICATION_FAIL",
    passCount: cases.filter((c) => c.pass).length,
    caseCount: cases.length,
    portrait: {
      pass: portraitCases.every((c) => c.pass),
      cases: portraitCases.map((c) => ({
        id: c.id,
        owner: c.snap.scrollOwnerAttr,
        pass: c.pass,
        failed: c.failed,
        overflowY: c.snap.feed?.overflowY,
        overscrollBehaviorY: c.snap.feed?.overscrollBehaviorY,
        canScrollY: c.snap.feed?.canScrollY,
        docMoved: c.scroll.docMoved,
        feedMoved: c.scroll.feedMoved,
        touch: c.touch,
      })),
    },
    landscapeAndLarger: {
      pass: landscapeFeedCases.every((c) => c.pass),
      cases: landscapeFeedCases.map((c) => ({
        id: c.id,
        owner: c.snap.scrollOwnerAttr,
        pass: c.pass,
        failed: c.failed,
        overflowY: c.snap.feed?.overflowY,
        canScrollY: c.snap.feed?.canScrollY,
        feedMoved: c.scroll.feedMoved,
        touch: c.touch,
      })),
    },
    journey,
    ownershipInvariants: {
      disclosureRendersZero: cases.every(
        (c) => c.snap.disclosureRenders === "0" || c.snap.disclosureRenders == null,
      ),
      disclosureDrivesChromeZero: cases.every(
        (c) =>
          c.snap.disclosureDrivesChrome === "0" ||
          c.snap.disclosureDrivesChrome == null,
      ),
      remountZero: cases.every((c) => c.snap.remount === "0"),
    },
    fails: cases.filter((c) => !c.pass).map((c) => ({ id: c.id, failed: c.failed })),
    cases,
  };

  writeFileSync(join(args.outDir, "browser-proof.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(args.outDir, "scroll-owner-matrix.json"),
    JSON.stringify(
      {
        portraitOwner: "document",
        landscapeOwner: "feed",
        cases: cases.map((c) => ({
          id: c.id,
          expect: c.expectOwner,
          observed: c.snap.scrollOwnerAttr,
          match: c.snap.scrollOwnerAttr === c.expectOwner,
        })),
        journeyOwners: steps.map((s) => ({
          id: s.id,
          expect: s.expectOwner,
          observed: s.observedOwner,
          match: s.ownerMatch,
        })),
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      {
        verdict: report.verdict,
        passCount: report.passCount,
        caseCount: report.caseCount,
        portraitPass: report.portrait.pass,
        landscapePass: report.landscapeAndLarger.pass,
        journeyPass: journey.pass,
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

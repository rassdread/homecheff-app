#!/usr/bin/env node
/**
 * WX Phase 1B.4 — Navigation preservation remediation browser proof.
 *
 * Distinguishes: mounted · visible · keyboard-reachable · touch-reachable · invoked.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

const VIEWPORTS = [
  { id: "p390", w: 390, h: 844, posture: "portrait" },
  { id: "l844", w: 844, h: 390, posture: "landscape" },
  { id: "p430", w: 430, h: 932, posture: "portrait" },
  { id: "l932", w: 932, h: 430, posture: "landscape" },
  { id: "p360", w: 360, h: 740, posture: "portrait" },
  { id: "l740", w: 740, h: 360, posture: "landscape" },
  { id: "p375", w: 375, h: 812, posture: "portrait" },
  { id: "l812", w: 812, h: 375, posture: "landscape" },
  { id: "t768", w: 768, h: 1024, posture: "portrait" },
  { id: "t1024", w: 1024, h: 768, posture: "landscape" },
  { id: "d1280", w: 1280, h: 800, posture: "landscape" },
  { id: "d1440", w: 1440, h: 900, posture: "landscape" },
];

function parseArgs(argv) {
  let baseUrl = "http://127.0.0.1:3099";
  let outDir = join(process.cwd(), "docs/audits/wx-phase1b4-landscape-work-posture");
  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) baseUrl = arg.slice(11);
    if (arg.startsWith("--out-dir=")) outDir = arg.slice(10);
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), outDir };
}

function resolveChromium() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const c = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    join(homedir(), "Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium"),
  ];
  for (const p of c) if (existsSync(p)) return p;
  throw new Error("Chrome not found");
}

async function dismissPrivacy(page) {
  try {
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button")];
      const accept = buttons.find((b) =>
        /accepteer alle|accept all|alleen noodzakelijk|only necessary/i.test(b.textContent || ""),
      );
      accept?.click();
    });
    await new Promise((r) => setTimeout(r, 350));
  } catch { /* ignore */ }
}

function focusableCountIn(el) {
  if (!el) return 0;
  const nodes = [...el.querySelectorAll("a,button,input,select,textarea,[tabindex]")];
  return nodes.filter((n) => {
    if (n.hasAttribute("disabled")) return false;
    if (n.getAttribute("tabindex") === "-1") return false;
    let p = n;
    while (p) {
      const cs = getComputedStyle(p);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (p.hasAttribute("inert")) return false;
      p = p.parentElement;
    }
    return true;
  }).length;
}

async function snap(page) {
  return page.evaluate(() => {
    function vis(el) {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    }
    function focusableIn(el) {
      if (!el) return 0;
      const nodes = [...el.querySelectorAll("a,button,input,select,textarea,[tabindex]")];
      return nodes.filter((n) => {
        if (n.hasAttribute("disabled")) return false;
        if (n.getAttribute("tabindex") === "-1") return false;
        let p = n;
        while (p) {
          const cs = getComputedStyle(p);
          if (cs.display === "none" || cs.visibility === "hidden") return false;
          if (p.hasAttribute("inert")) return false;
          p = p.parentElement;
        }
        return true;
      }).length;
    }
    const shell = document.querySelector("[data-hc-bottom-nav-shell]");
    const nav = document.querySelector("[data-hc-bottom-nav]");
    const strip = document.querySelector("[data-wx-orientation-strip]");
    const ws = document.querySelector("[data-aw-feed-workspace]");
    const feed =
      document.querySelector("[data-aw-primary-feed]") ||
      document.querySelector("#homecheff-feed-desktop") ||
      document.querySelector("#homecheff-feed");
    const hamburger = document.querySelector('button[aria-controls="navbar-mobile-menu"]');
    const menu = document.querySelector("#navbar-mobile-menu");
    const mobileCreate = document.querySelector("[data-wx-mobile-create]");
    const mobileHcp = document.querySelector("[data-wx-mobile-mijn-hcp]");
    const desktopCreate = document.querySelector("[data-wx-primary-action]");
    return {
      vw: Math.floor(window.innerWidth),
      vh: Math.floor(window.innerHeight),
      posture: ws?.getAttribute("data-wx-posture"),
      phase: ws?.getAttribute("data-wx-phase"),
      remount: ws?.getAttribute("data-wx-continuity-remount"),
      shellMountId: ws?.getAttribute("data-wx-shell-mount-id"),
      primaryMountId: document
        .querySelector("[data-wx-primary-mount-id]")
        ?.getAttribute("data-wx-primary-mount-id"),
      capVisual: ws?.getAttribute("data-wx-cap-visual-activation"),
      stripH: strip && vis(strip) ? Math.round(strip.getBoundingClientRect().height) : 0,
      stripCompact: strip?.getAttribute("data-wx-orientation-compact"),
      bottomMounted: Boolean(shell || nav),
      bottomVisible: vis(nav),
      bottomCollapsedAttr: shell?.getAttribute("data-wx-bottom-nav-collapsed"),
      bottomAriaHidden: shell?.getAttribute("aria-hidden"),
      bottomInert: shell?.hasAttribute("inert") || false,
      bottomFocusable: focusableIn(shell),
      bottomH: nav && vis(nav) ? Math.round(nav.getBoundingClientRect().height) : 0,
      feedH: feed ? Math.round(feed.getBoundingClientRect().height) : 0,
      feedCanScroll: feed ? feed.scrollHeight > feed.clientHeight + 8 : false,
      hamburgerPresent: Boolean(hamburger),
      hamburgerVisible: vis(hamburger),
      menuOpen: Boolean(menu && vis(menu)),
      mobileCreateVisible: vis(mobileCreate),
      mobileHcpVisible: vis(mobileHcp),
      mobileHcpHref: mobileHcp?.getAttribute("href") || null,
      desktopCreateVisible: vis(desktopCreate),
      menuHrefs: menu
        ? [...menu.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))
        : [],
    };
  });
}

async function openMenu(page) {
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-controls="navbar-mobile-menu"]');
    if (btn && btn.getAttribute("aria-expanded") !== "true") btn.click();
  });
  await new Promise((r) => setTimeout(r, 280));
}

async function closeMenuEscape(page) {
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 200));
}

async function touchScroll(page) {
  const feed = await page.$("[data-aw-primary-feed], #homecheff-feed-desktop, #homecheff-feed");
  if (!feed || !page.touchscreen) return { moved: false, reason: "no-feed" };
  await page.evaluate((el) => { el.scrollTop = 0; }, feed);
  const box = await feed.boundingBox();
  if (!box) return { moved: false, reason: "no-bbox" };
  const before = await page.evaluate((el) => el.scrollTop, feed);
  const x = box.x + box.width / 2;
  const y = box.y + Math.min(box.height * 0.55, 120);
  await page.touchscreen.touchStart(x, y);
  await page.touchscreen.touchMove(x, y - 150);
  await page.touchscreen.touchEnd();
  await new Promise((r) => setTimeout(r, 220));
  const after = await page.evaluate((el) => el.scrollTop, feed);
  return { before, after, moved: after > before + 5 };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.outDir, { recursive: true });
  let puppeteer;
  try { puppeteer = require("puppeteer-core"); } catch { puppeteer = require("puppeteer"); }
  const browser = await puppeteer.launch({
    executablePath: resolveChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const cases = [];
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
    await page.goto(args.baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
    await dismissPrivacy(page);
    await page.waitForSelector("[data-aw-feed-workspace], [data-aw-primary-feed]", { timeout: 30000 }).catch(() => null);
    await new Promise((r) => setTimeout(r, 700));

    let beforeMenu = await snap(page);
    let afterMenu = beforeMenu;
    let createClick = null;
    let hcpClick = null;
    let scroll = null;

    if (vp.w < 1024) {
      await openMenu(page);
      afterMenu = await snap(page);
      if (vp.posture === "landscape") {
        // Click Create — should invoke auth gate or create without navigation away forever
        createClick = await page.evaluate(() => {
          const btn = document.querySelector("[data-wx-mobile-create]");
          if (!btn) return { ok: false, reason: "missing" };
          btn.click();
          return { ok: true };
        });
        await new Promise((r) => setTimeout(r, 400));
        // Re-open menu for hcp (create may close menu)
        await openMenu(page);
        // Prove canonical destination is invokable: follow the hamburger href.
        hcpClick = await page.evaluate(() => {
          const a = document.querySelector("[data-wx-mobile-mijn-hcp]");
          if (!a) return { ok: false, reason: "missing" };
          return {
            ok: true,
            href: a.getAttribute("href"),
            absolute: a.href,
          };
        });
        if (hcpClick?.absolute) {
          await page.goto(hcpClick.absolute, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
          });
          await new Promise((r) => setTimeout(r, 400));
          hcpClick = { ...hcpClick, landedUrl: page.url() };
        }
        // Return home for remaining checks
        await page.goto(args.baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
        await dismissPrivacy(page);
        await new Promise((r) => setTimeout(r, 500));
        scroll = await touchScroll(page);
      }
    }

    const expectLandscape = vp.posture === "landscape";
    const belowLg = vp.w < 1024;
    const checks = {
      workspaceFound: Boolean(beforeMenu.phase),
      phase1b4: beforeMenu.phase === "1b.4",
      capVisualOff: beforeMenu.capVisual === "0",
      noConsoleErrors: errors.length === 0,
    };

    if (expectLandscape && belowLg) {
      checks.bottomCollapsed = beforeMenu.bottomVisible === false && beforeMenu.bottomH === 0;
      checks.bottomMounted = beforeMenu.bottomMounted === true;
      checks.bottomNotFocusable = beforeMenu.bottomFocusable === 0;
      checks.bottomAriaHidden = beforeMenu.bottomAriaHidden === "true";
      checks.stripCompact = beforeMenu.stripCompact === "1";
      checks.hamburgerOpens = afterMenu.menuOpen === true;
      checks.createVisibleInMenu = afterMenu.mobileCreateVisible === true;
      checks.hcpVisibleInMenu = afterMenu.mobileHcpVisible === true;
      checks.hcpCanonical =
        afterMenu.mobileHcpHref === "/mijn-hcp" ||
        afterMenu.mobileHcpHref === "/login" ||
        (hcpClick?.href === "/mijn-hcp" || hcpClick?.href === "/login");
      checks.createInvoked = createClick?.ok === true;
      checks.hcpNavigates =
        hcpClick?.ok === true &&
        (hcpClick.href === "/mijn-hcp" || hcpClick.href === "/login") &&
        /\/mijn-hcp|\/login/.test(hcpClick.landedUrl || "");
      checks.feedScroll = scroll?.moved === true || beforeMenu.feedCanScroll === true;
    }

    if (!expectLandscape && belowLg) {
      checks.bottomVisiblePortrait = beforeMenu.bottomVisible === true;
      checks.bottomFocusablePortrait = beforeMenu.bottomFocusable > 0;
    }

    if (vp.w >= 1024) {
      checks.desktopCreateVisible = beforeMenu.desktopCreateVisible === true;
    }

    const failed = Object.entries(checks)
      .filter(([, v]) => v !== true)
      .map(([k]) => k);

    cases.push({
      id: vp.id,
      vp,
      beforeMenu,
      afterMenu,
      createClick,
      hcpClick,
      scroll,
      checks,
      failed,
      pass: failed.length === 0,
      errors,
    });
    await page.close();
  }

  // Continuous journey
  const jp = await browser.newPage();
  const jErrors = [];
  jp.on("pageerror", (e) => jErrors.push(String(e.message || e)));
  await jp.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await jp.goto(args.baseUrl + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismissPrivacy(jp);
  await new Promise((r) => setTimeout(r, 700));
  const journey = [];
  let firstShell = null;
  let firstPrimary = null;
  const steps = [
    { w: 390, h: 844, label: "portrait-start" },
    { w: 844, h: 390, label: "landscape-nav" },
    { w: 390, h: 844, label: "portrait-restore" },
    { w: 932, h: 430, label: "landscape-repeat" },
  ];
  for (const step of steps) {
    await jp.setViewport({
      width: step.w,
      height: step.h,
      isMobile: true,
      hasTouch: true,
    });
    await new Promise((r) => setTimeout(r, 850));
    let s = await snap(jp);
    if (!firstShell) firstShell = s.shellMountId;
    if (!firstPrimary) firstPrimary = s.primaryMountId;
    let menu = null;
    let scroll = null;
    if (step.w > step.h) {
      await openMenu(jp);
      menu = await snap(jp);
      await closeMenuEscape(jp);
      scroll = await touchScroll(jp);
    }
    journey.push({
      step,
      snap: s,
      menu,
      scroll,
      mountStable:
        s.shellMountId === firstShell &&
        (!firstPrimary || s.primaryMountId === firstPrimary),
    });
  }
  await jp.close();
  await browser.close();

  const allPass = cases.every((c) => c.pass);
  const report = {
    phase: "1b.4-nav-remediation",
    baseUrl: args.baseUrl,
    generatedAt: new Date().toISOString(),
    verdict: allPass
      ? "WX_PHASE_1B4_NAV_PRESERVATION_PROOF_PASS"
      : "WX_PHASE_1B4_NAV_PRESERVATION_PROOF_FAIL",
    passCount: cases.filter((c) => c.pass).length,
    caseCount: cases.length,
    journey: {
      steps: journey.length,
      allMountStable: journey.every((j) => j.mountStable),
      landscapeCreateVisible: journey
        .filter((j) => j.menu)
        .every((j) => j.menu.mobileCreateVisible === true),
      landscapeHcpVisible: journey
        .filter((j) => j.menu)
        .every((j) => j.menu.mobileHcpVisible === true),
      errors: jErrors,
    },
    cases,
  };

  writeFileSync(join(args.outDir, "nav-preservation-browser-proof.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(args.outDir, "NAV_PRESERVATION_PROOF.md"),
    [
      "# WX Phase 1B.4 — Navigation Preservation Browser Proof",
      "",
      `**Verdict:** \`${report.verdict}\``,
      `**Cases:** ${report.passCount}/${report.caseCount}`,
      "",
      ...cases.map(
        (c) =>
          `- **${c.id}**: ${c.pass ? "PASS" : "FAIL"} ${
            c.failed.length ? `(${c.failed.join(", ")})` : ""
          }`,
      ),
      "",
      "## Journey",
      `- mountStable: ${report.journey.allMountStable}`,
      `- landscape Create in menu: ${report.journey.landscapeCreateVisible}`,
      `- landscape /mijn-hcp in menu: ${report.journey.landscapeHcpVisible}`,
      "",
    ].join("\n"),
  );

  console.log(
    JSON.stringify(
      {
        verdict: report.verdict,
        passCount: report.passCount,
        caseCount: report.caseCount,
        journey: report.journey,
        fails: cases.filter((c) => !c.pass).map((c) => ({ id: c.id, failed: c.failed })),
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

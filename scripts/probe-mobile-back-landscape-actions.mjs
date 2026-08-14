#!/usr/bin/env node
/**
 * Mobile Back + short-landscape action acceptance probe.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.argv.find((a) => a.startsWith("--base-url="))?.slice(11) ||
  "http://127.0.0.1:3091";
const OUT =
  process.argv.find((a) => a.startsWith("--out-dir="))?.slice(10) ||
  join(process.cwd(), "docs/audits/mobile-back-landscape-actions", `probe-${Date.now()}`);

mkdirSync(OUT, { recursive: true });

async function dismiss(page) {
  await page.evaluate(() => {
    try {
      localStorage.setItem("homecheff-privacy-accepted", "1");
    } catch {}
    [...document.querySelectorAll("button")]
      .find((b) => /accepteer|accept|akkoord/i.test(b.textContent || ""))
      ?.click();
  }).catch(() => {});
}

async function measureLandscape(page) {
  return page.evaluate(() => {
    const menu = document.querySelector("[data-wx-workbar-menu]");
    const create = document.querySelector("[data-wx-workbar-create]");
    const search = document.querySelector("[data-wx-feed-search]");
    const strip = document.querySelector("[data-wx-orientation-strip]");
    const mr = menu?.getBoundingClientRect();
    const cr = create?.getBoundingClientRect();
    const zone = 64;
    const rightZoneLeft = window.innerWidth - zone;
    return {
      vh: window.innerHeight,
      vw: window.innerWidth,
      headerH: Math.round(
        document.querySelector("header[data-wx-navbar]")?.getBoundingClientRect()
          .height || 0,
      ),
      stripH: strip
        ? Math.round(strip.getBoundingClientRect().height)
        : null,
      createText: create?.textContent?.trim() || null,
      createReadable: !!(cr && cr.width > 40 && cr.height >= 36),
      createRight: cr ? Math.round(cr.right) : null,
      menuRight: mr ? Math.round(mr.right) : null,
      menuRightGap: mr ? Math.round(window.innerWidth - mr.right) : null,
      menuIntersectsOsZone: mr ? mr.right > rightZoneLeft : null,
      searchFont: search ? getComputedStyle(search).fontSize : null,
      searchColor: search ? getComputedStyle(search).color : null,
      searchPh: search
        ? getComputedStyle(search, "::placeholder").color
        : null,
      searchMinH: search ? getComputedStyle(search).minHeight : null,
      rail: (() => {
        const h = document.querySelector("[data-aw-slot-host='start']");
        if (!h || h.classList.contains("hidden")) return false;
        const r = h.getBoundingClientRect();
        return r.width > 8;
      })(),
      singleBar: strip?.getAttribute("data-wx-single-bar"),
    };
  });
}

const browser = await chromium.launch({ headless: true });
const report = { base: BASE, at: new Date().toISOString(), cases: {} };

{
  const ctx = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  await page.waitForSelector("[data-wx-single-bar='1']", { timeout: 60000 });
  await page.waitForTimeout(1500);
  report.cases.land844 = await measureLandscape(page);
  await page.screenshot({ path: join(OUT, "land-844.png") });

  const histBefore = await page.evaluate(() => window.history.length);
  await page.click("[data-wx-workbar-menu]");
  await page.waitForSelector("#navbar-mobile-menu", { timeout: 5000 });
  const menuOpen = await page.evaluate(() => {
    const panel = document.querySelector("#navbar-mobile-menu");
    const r = panel?.getBoundingClientRect();
    const zoneLeft = window.innerWidth - 64;
    return {
      visible: !!(r && r.width > 0),
      right: r ? Math.round(r.right) : null,
      intersectsOsZone: r ? r.right > zoneLeft : null,
      hist: window.history.length,
      state: window.history.state,
    };
  });
  report.cases.menuOpen = { histBefore, ...menuOpen };
  await page.screenshot({ path: join(OUT, "land-844-menu.png") });

  await page.goBack();
  await page.waitForTimeout(500);
  report.cases.menuBack = await page.evaluate(() => ({
    panel: !!document.querySelector("#navbar-mobile-menu"),
    path: location.pathname,
    hist: window.history.length,
  }));

  // open again + inflate test
  await page.click("[data-wx-workbar-menu]");
  await page.waitForTimeout(300);
  await page.click("[data-wx-workbar-menu]");
  await page.waitForTimeout(300);
  await page.click("[data-wx-workbar-menu]");
  await page.waitForTimeout(300);
  await page.goBack();
  await page.waitForTimeout(400);
  report.cases.historyInflation = await page.evaluate(() => ({
    panel: !!document.querySelector("#navbar-mobile-menu"),
    path: location.pathname,
    hist: window.history.length,
  }));

  // filter / sort if present
  const sortBtn = page.locator('[data-testid="feed-search-context-sort-action"]');
  if (await sortBtn.isVisible().catch(() => false)) {
    await sortBtn.click();
    await page.waitForTimeout(400);
    report.cases.sortOpen = await page.evaluate(() => ({
      panel: !!document.querySelector('[data-testid="feed-search-context-panel"]'),
      state: window.history.state,
    }));
    await page.goBack();
    await page.waitForTimeout(400);
    report.cases.sortBack = await page.evaluate(() => ({
      panel: !!document.querySelector('[data-testid="feed-search-context-panel"]'),
      path: location.pathname,
    }));
  }

  // listing back
  const href = await page.locator('a[href*="/product/"]').first().getAttribute("href");
  if (href) {
    await page.goto(new URL(href, BASE).toString(), {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(800);
    report.cases.listing = await page.evaluate(() => ({
      path: location.pathname,
      headerH: Math.round(
        document.querySelector("header")?.getBoundingClientRect().height || 0,
      ),
      suppressed: document.documentElement.dataset.wxNavbarSuppressed || "0",
    }));
    await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => null);
    await page.waitForTimeout(1200);
    report.cases.listingBack = await page.evaluate(() => ({
      path: location.pathname,
      singleBar: document
        .querySelector("[data-wx-orientation-strip]")
        ?.getAttribute("data-wx-single-bar"),
    }));
  }

  await ctx.close();
}

for (const [id, w, h] of [
  ["740", 740, 360],
  ["667", 667, 375],
  ["port", 390, 844],
  ["desk", 1280, 900],
]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    isMobile: h < 600,
    hasTouch: h < 600,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await dismiss(page);
  await page.waitForTimeout(2000);
  report.cases[id] = await measureLandscape(page);
  await page.screenshot({ path: join(OUT, `${id}.png`) });
  await ctx.close();
}

writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();

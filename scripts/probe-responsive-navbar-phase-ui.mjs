#!/usr/bin/env node
/**
 * Phase UI — Responsive NavBar viewport probe (anonymous guest).
 * Usage: node scripts/probe-responsive-navbar-phase-ui.mjs --base-url=http://127.0.0.1:3010
 */

import puppeteer from 'puppeteer';

const WIDTHS = [
  2560, 1920, 1600, 1440, 1366, 1280, 1180, 1024, 900, 820, 768,
  640, 540, 480, 430, 390, 360, 320,
];

function parseArgs(argv) {
  let baseUrl = 'http://127.0.0.1:3010';
  for (const a of argv) {
    if (a.startsWith('--base-url=')) baseUrl = a.slice('--base-url='.length);
  }
  return { baseUrl };
}

function isVisible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
  if (r.width < 2 || r.height < 2) return false;
  if (r.right < 0 || r.left > window.innerWidth || r.bottom < 0 || r.top > window.innerHeight) return false;
  const cx = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1);
  const cy = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1);
  const top = document.elementFromPoint(cx, cy);
  return top === el || el.contains(top);
}

async function probeViewport(page, baseUrl, width, height, label) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page
    .waitForFunction(() => document.querySelectorAll('header a[href="/login"]').length > 0, { timeout: 45000 })
    .catch(() => {});
  await new Promise((r) => setTimeout(r, 800));

  return page.evaluate((lbl) => {
    const login = Array.from(document.querySelectorAll('header a[href="/login"]')).find((a) =>
      /inlog|login/i.test(a.textContent || ''),
    );
    const register = Array.from(document.querySelectorAll('header a[href="/register"]')).find((a) =>
      /aanmel|regist/i.test(a.textContent || ''),
    );
    const hamburger = document.querySelector('[aria-controls="navbar-mobile-menu"]');
    const nav = document.querySelector('header nav');
    const shell = document.querySelector('[aria-label="Navigatie laden"]');
    const hero = document.querySelector('.hc-hero-dorpsplein, .hc-dorpsplein-page');
    const feed = document.querySelector('[aria-label="Marketplace laden"], #homecheff-feed-desktop, #homecheff-feed');

    function vis(el) {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
      if (r.width < 2 || r.height < 2) return false;
      if (r.right < 0 || r.left > window.innerWidth) return false;
      const cx = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1);
      const top = document.elementFromPoint(cx, cy);
      return top === el || el.contains(top);
    }

    return {
      label: lbl,
      viewport: window.innerWidth,
      loginVisible: vis(login),
      registerVisible: vis(register),
      loginRight: login ? Math.round(login.getBoundingClientRect().right) : null,
      registerRight: register ? Math.round(register.getBoundingClientRect().right) : null,
      hamburgerVisible: vis(hamburger),
      desktopNav: nav ? getComputedStyle(nav).display : 'none',
      navShell: !!shell,
      shellPointerEvents: shell ? getComputedStyle(shell).pointerEvents : null,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      heroPresent: !!hero,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      consoleHydration: 0,
    };
  }, label);
}

async function probeResize(page, baseUrl) {
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1000));
  const widths = [1280, 900, 640, 1024];
  const snapshots = [];
  for (const w of widths) {
    await page.setViewport({ width: w, height: 800 });
    await new Promise((r) => setTimeout(r, 400));
    const snap = await page.evaluate(() => {
      const login = document.querySelector('header a[href="/login"]');
      const register = document.querySelector('header a[href="/register"]');
      const headerH = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
      return {
        width: window.innerWidth,
        headerHeight: Math.round(headerH),
        loginVisible: login ? login.getBoundingClientRect().width > 0 : false,
        registerVisible: register ? register.getBoundingClientRect().width > 0 : false,
      };
    });
    snapshots.push(snap);
  }
  const heights = snapshots.map((s) => s.headerHeight);
  const layoutShift = Math.max(...heights) - Math.min(...heights) > 8;
  return { snapshots, layoutShift };
}

async function main() {
  const { baseUrl } = parseArgs(process.argv.slice(2));
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const consoleIssues = [];
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' || /hydration/i.test(t)) consoleIssues.push(t.slice(0, 200));
  });

  const portrait = [];
  const landscape = [];

  for (const w of WIDTHS) {
    portrait.push(await probeViewport(page, baseUrl, w, 900, `portrait-${w}`));
  }

  for (const w of [844, 768, 640, 480, 390]) {
    landscape.push(await probeViewport(page, baseUrl, w, 390, `landscape-${w}x390`));
  }

  const resize = await probeResize(page, baseUrl);

  // NavBarShell pointer-events check (simulate by visiting during fast navigation)
  await page.setViewport({ width: 900, height: 900 });
  await page.goto(baseUrl, { waitUntil: 'commit', timeout: 90000 }).catch(() => {});
  const shellSnap = await page.evaluate(() => {
    const shell = document.querySelector('[aria-label="Navigatie laden"]');
    if (!shell) return { shellSeen: false };
    return {
      shellSeen: true,
      pointerEvents: getComputedStyle(shell).pointerEvents,
      ariaBusy: shell.getAttribute('aria-busy'),
    };
  });

  await browser.close();

  const allPass = portrait.every((r) => r.loginVisible && r.registerVisible && !r.overflow);
  const failures = portrait.filter((r) => !r.loginVisible || !r.registerVisible || r.overflow);

  console.log(
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        baseUrl,
        allPass,
        failureCount: failures.length,
        failures,
        portrait,
        landscape,
        resize,
        shellSnap,
        consoleIssues: consoleIssues.slice(0, 8),
      },
      null,
      2,
    ),
  );
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});

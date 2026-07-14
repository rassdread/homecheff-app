#!/usr/bin/env node
/**
 * Wave 2 interaction root-cause probe — measures mount/click timing.
 * Usage: node scripts/probe-wave2-interaction-root-cause.mjs --base-url=http://127.0.0.1:3010
 */

import puppeteer from 'puppeteer';

function parseArgs(argv) {
  let baseUrl = 'http://127.0.0.1:3010';
  for (const a of argv) {
    if (a.startsWith('--base-url=')) baseUrl = a.slice('--base-url='.length);
  }
  return { baseUrl };
}

async function sampleInteraction(page, label) {
  return page.evaluate((lbl) => {
    const login = document.querySelector('header a[href="/login"]');
    const shell = document.querySelector('[aria-label="Navigatie laden"]');
    const main = document.querySelector('#main-content');
    const hamburger = document.querySelector('[aria-controls="navbar-mobile-menu"]');

    function hitTest(el) {
      if (!el) return { exists: false };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const cx = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1);
      const top = document.elementFromPoint(cx, cy);
      const blockers = [];
      if (top && top !== el && !el.contains(top)) {
        let n = top;
        for (let i = 0; i < 5 && n; i++) {
          blockers.push({
            tag: n.tagName,
            id: n.id || null,
            class: (n.className || '').toString().slice(0, 80),
            pe: getComputedStyle(n).pointerEvents,
            z: getComputedStyle(n).zIndex,
          });
          n = n.parentElement;
        }
      }
      return {
        exists: true,
        rect: { w: r.width, h: r.height, top: r.top, right: r.right },
        display: cs.display,
        visibility: cs.visibility,
        pointerEvents: cs.pointerEvents,
        clickable: top === el || el.contains(top),
        blocker: blockers[0] || null,
      };
    }

    const scripts = [...document.scripts].map((s) => s.src).filter(Boolean);
    const hcpChunk = scripts.find((u) => /HcpReward|gamification/i.test(u)) || null;
    const navChunk = scripts.find((u) => /NavBar/i.test(u)) || null;

    return {
      label: lbl,
      t: Math.round(performance.now()),
      login: hitTest(login),
      hamburger: hitTest(hamburger),
      shell: shell
        ? {
            present: true,
            pointerEvents: getComputedStyle(shell).pointerEvents,
            z: getComputedStyle(shell).zIndex,
          }
        : { present: false },
      mainPresent: !!main,
      mainChildCount: main?.childElementCount ?? 0,
      headerLinkCount: document.querySelectorAll('header a').length,
      buttonCount: document.querySelectorAll('button').length,
      hcpChunkLoaded: !!hcpChunk,
      navChunkLoaded: !!navChunk,
    };
  }, label);
}

async function main() {
  const { baseUrl } = parseArgs(process.argv.slice(2));
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleIssues = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (msg.type() === 'error' || /hydration/i.test(t)) consoleIssues.push(t);
  });
  page.on('pageerror', (e) => consoleIssues.push(String(e)));

  const timeline = [];
  const record = async (label) => timeline.push(await sampleInteraction(page, label));

  // Fetch raw HTML before JS
  const htmlRes = await fetch(`${baseUrl}/`);
  const html = await htmlRes.text();
  const ssr = {
    bytes: Buffer.byteLength(html, 'utf8'),
    loginInHtml: /href="\/login"/.test(html),
    registerInHtml: /href="\/register"/.test(html),
    navShellInHtml: /Navigatie laden/.test(html),
    buttonCount: (html.match(/<button/g) || []).length,
    linkLoginCount: (html.match(/href="\/login"/g) || []).length,
  };

  const navStart = Date.now();
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await record('t0-domcontentloaded');

  for (const ms of [50, 100, 200, 500, 1000, 2000, 5000]) {
    await new Promise((r) => setTimeout(r, 50));
    await record(`t+${ms}ms-since-last`);
  }

  await page.waitForFunction(
    () => document.querySelectorAll('header a[href="/login"]').length > 0,
    { timeout: 30000 },
  ).catch(() => {});
  await record('login-in-dom');

  // Click login and measure navigation
  let clickResult = { navigated: false, error: null };
  try {
    const beforeUrl = page.url();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null),
      page.click('header a[href="/login"]', { delay: 20 }),
    ]);
    clickResult = { navigated: page.url() !== beforeUrl, from: beforeUrl, to: page.url() };
  } catch (e) {
    clickResult = { navigated: false, error: String(e) };
  }
  await record('after-login-click');

  const perf = await page.evaluate(() =>
    typeof window.__hcFeedPerfReport === 'function' ? window.__hcFeedPerfReport() : null,
  );

  await browser.close();

  console.log(
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        baseUrl,
        ssr,
        navDurationMs: Date.now() - navStart,
        timeline,
        clickResult,
        perfCounters: perf?.counters ?? null,
        consoleIssues,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

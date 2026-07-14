#!/usr/bin/env node
/**
 * Phase 3F Wave 2 — Browser verification probe (Puppeteer).
 *
 * Prerequisites:
 *   npm run build with NEXT_PUBLIC_FEED_PERF_BASELINE=1
 *   next start -p <port>
 *
 * Usage:
 *   node scripts/probe-homepage-browser-phase3fw2.mjs --base-url=http://127.0.0.1:3010
 */

import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

function parseArgs(argv) {
  const opts = {
    baseUrl: 'http://127.0.0.1:3010',
    mobile: false,
    warm: false,
    label: 'anonymous-desktop-cold',
  };
  for (const arg of argv) {
    if (arg.startsWith('--base-url=')) opts.baseUrl = arg.slice('--base-url='.length);
    else if (arg === '--mobile') opts.mobile = true;
    else if (arg === '--warm') opts.warm = true;
    else if (arg.startsWith('--label=')) opts.label = arg.slice('--label='.length);
  }
  return opts;
}

async function loadPuppeteer() {
  try {
    return await import('puppeteer');
  } catch {
    return new Promise((resolve, reject) => {
      const child = spawn(
        'npx',
        ['-y', 'puppeteer', 'eval', 'console.log("ok")'],
        { stdio: 'pipe', shell: true },
      );
      child.on('close', async (code) => {
        if (code !== 0) return reject(new Error('puppeteer install failed'));
        try {
          resolve(await import('puppeteer'));
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}

async function runScenario(puppeteer, opts) {
  const started = performance.now();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    if (opts.mobile) {
      await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
    } else {
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    }

    const client = await page.createCDPSession();
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: !opts.warm });

    const consoleErrors = [];
    const consoleWarnings = [];
    const networkFailures = [];
    const chunkLoads = new Set();

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') consoleErrors.push(text);
      if (text.toLowerCase().includes('hydration')) consoleWarnings.push(text);
    });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));
    page.on('requestfailed', (req) => {
      networkFailures.push({ url: req.url(), failure: req.failure()?.errorText ?? 'unknown' });
    });
    page.on('response', (res) => {
      const url = res.url();
      if (url.includes('/_next/static/chunks/') && res.status() === 200) {
        chunkLoads.add(url.split('/').pop()?.split('?')[0] ?? url);
      }
    });

    const navStart = performance.now();
    await page.goto(`${opts.baseUrl}/`, { waitUntil: 'networkidle2', timeout: 120000 });
    const navMs = Math.round(performance.now() - navStart);

    // Wait for feed perf report or skeleton resolution
    await page.waitForFunction(
      () => {
        const w = window;
        if (typeof w.__hcFeedPerfReport === 'function') {
          const r = w.__hcFeedPerfReport();
          return r?.counters?.feedFetches >= 1;
        }
        return document.querySelector('[aria-label="Marketplace laden"]') == null;
      },
      { timeout: 60000 },
    ).catch(() => {});

    await new Promise((r) => setTimeout(r, 1500));

    const perfReport = await page.evaluate(() => {
      const w = window;
      const paints = performance.getEntriesByType('paint');
      const fcp = paints.find((p) => p.name === 'first-contentful-paint');
      const nav = performance.getEntriesByType('navigation')[0];
      const report =
        typeof w.__hcFeedPerfReport === 'function' ? w.__hcFeedPerfReport() : null;
      const skeletonVisible = Boolean(
        document.querySelector('[aria-label="Marketplace laden"]') ||
          document.querySelector('[aria-label="Feed laden"]') ||
          document.querySelector('[aria-busy="true"][aria-label="Navigatie laden"]'),
      );
      const feedTiles = document.querySelectorAll(
        '[data-feed-tile], .hc-feed-card, [class*="feed"] article, #homecheff-feed img',
      ).length;
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries[lcpEntries.length - 1];
      return {
        fcpMs: fcp ? Math.round(fcp.startTime) : null,
        lcpMs: lcp ? Math.round(lcp.startTime) : null,
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        loadMs: nav ? Math.round(nav.loadEventEnd) : null,
        perfReport: report,
        skeletonVisible,
        feedTileSignals: feedTiles,
        hasHcFeedPerf: typeof w.__hcFeedPerfReport === 'function',
      };
    });

    const htmlBytes = Buffer.byteLength(await page.content(), 'utf8');

    return {
      label: opts.label,
      viewport: opts.mobile ? 'mobile' : 'desktop',
      mode: opts.warm ? 'warm' : 'cold',
      navigationMs: navMs,
      htmlBytes,
      fcpMs: perfReport.fcpMs,
      lcpMs: perfReport.lcpMs,
      domContentLoadedMs: perfReport.domContentLoadedMs,
      loadMs: perfReport.loadMs,
      firstPaintMs: perfReport.fcpMs,
      appUsableMs: perfReport.perfReport?.milestones?.['app:usable'] ?? null,
      firstTileMs: perfReport.perfReport?.milestones?.['feed:first-tile-rendered'] ?? null,
      feedFetches: perfReport.perfReport?.counters?.feedFetches ?? null,
      geoFeedMounts: perfReport.perfReport?.counters?.geoFeedMounts ?? null,
      sessionFastPath: perfReport.perfReport?.sessionFastPath ?? null,
      milestones: perfReport.perfReport?.milestones ?? null,
      webVitals: perfReport.perfReport?.webVitals ?? null,
      skeletonVisibleAfterWait: perfReport.skeletonVisible,
      feedTileSignals: perfReport.feedTileSignals,
      hasHcFeedPerf: perfReport.hasHcFeedPerf,
      dynamicChunkCount: chunkLoads.size,
      dynamicChunksSample: [...chunkLoads].slice(0, 12),
      consoleErrors: consoleErrors.slice(0, 10),
      hydrationWarnings: consoleWarnings.slice(0, 10),
      networkFailures: networkFailures.filter((f) => !f.url.includes('favicon')).slice(0, 10),
      totalProbeMs: Math.round(performance.now() - started),
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const baseOpts = parseArgs(process.argv.slice(2));
  const puppeteer = await loadPuppeteer();

  const scenarios = [
    { ...baseOpts, warm: false, mobile: false, label: 'anonymous-desktop-cold' },
    { ...baseOpts, warm: true, mobile: false, label: 'anonymous-desktop-warm' },
    { ...baseOpts, warm: false, mobile: true, label: 'anonymous-mobile-cold' },
  ];

  const results = [];
  for (const sc of scenarios) {
    console.error(`Running ${sc.label}...`);
    results.push(await runScenario(puppeteer.default ?? puppeteer, sc));
  }

  console.log(JSON.stringify({ measuredAt: new Date().toISOString(), baseUrl: baseOpts.baseUrl, results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

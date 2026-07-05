#!/usr/bin/env node
/**
 * Verifies homepage sticky sidebars: scroll + ancestor overflow audit.
 * Usage: node scripts/audit-sticky-home.mjs [baseUrl]
 * Requires dev server on :3000 (or pass URL).
 */
import puppeteer from 'puppeteer';

const baseUrl = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://127.0.0.1:3000';
const prodMode = process.argv.includes('--prod');
const url = prodMode
  ? `${baseUrl.replace(/\/$/, '')}/`
  : `${baseUrl.replace(/\/$/, '')}/?stickyTest=1`;
const leftSelector = prodMode ? '[data-sticky-prod="left"]' : '[data-sticky-test="left"]';
const shellSelector = prodMode ? '.hc-home-sticky-grid' : '[data-sticky-test-shell]';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

let loaded = false;
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  if (prodMode) {
    await page
      .waitForSelector('#homecheff-feed-desktop .feed-card-geo, #homecheff-feed-desktop [class*="feed-card"]', {
        timeout: 60000,
      })
      .catch(() => undefined);
  }
  await page.waitForSelector(leftSelector, { timeout: 45000 });
  // Client URL param (?stickyTest=1) applies after hydration
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return el && getComputedStyle(el).position === 'sticky';
    },
    { timeout: 30000 },
    leftSelector
  );
  loaded = true;
} catch (err) {
  console.error(`Failed to load ${url}:`, err.message);
  await browser.close();
  process.exit(1);
}

const result = await page.evaluate(async (selectors) => {
  const { leftSelector, shellSelector } = selectors;
  function auditAncestorChain(el) {
    const chain = [];
    let node = el;
    while (node && node !== document.documentElement) {
      const s = getComputedStyle(node);
      chain.push({
        tag: node.tagName.toLowerCase(),
        id: node.id || null,
        className: typeof node.className === 'string' ? node.className.slice(0, 120) : null,
        overflowX: s.overflowX,
        overflowY: s.overflowY,
        position: s.position,
        height: s.height,
      });
      node = node.parentElement;
    }
    const htmlS = getComputedStyle(document.documentElement);
    const bodyS = getComputedStyle(document.body);
    chain.push({ tag: 'html', overflowX: htmlS.overflowX, overflowY: htmlS.overflowY });
    chain.push({ tag: 'body', overflowX: bodyS.overflowX, overflowY: bodyS.overflowY });
    return chain;
  }

  const left = document.querySelector(leftSelector);
  const shell = document.querySelector(shellSelector);
  if (!left || !shell) {
    return { ok: false, error: `sticky nodes not found (${leftSelector})` };
  }

  window.scrollTo(0, 0);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const topBefore = left.getBoundingClientRect().top;
  const absoluteTop = topBefore + window.scrollY;
  const scrollTarget = Math.max(0, absoluteTop - 80 + 20);
  window.scrollTo(0, scrollTarget);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const topAfterScroll = left.getBoundingClientRect().top;

  const stickyPosition = getComputedStyle(left).position;
  const gridDisplay = getComputedStyle(shell).display;

  const breakingAncestors = [];
  let node = left.parentElement;
  while (node) {
    const s = getComputedStyle(node);
    const ox = s.overflowX;
    const oy = s.overflowY;
    const o = s.overflow;
    if (
      o === 'hidden' ||
      o === 'auto' ||
      o === 'scroll' ||
      ox === 'hidden' ||
      oy === 'hidden' ||
      oy === 'auto' ||
      oy === 'scroll' ||
      s.transform !== 'none' ||
      s.filter !== 'none' ||
      s.perspective !== 'none' ||
      (s.contain && s.contain.includes('paint'))
    ) {
      breakingAncestors.push({
        tag: node.tagName.toLowerCase(),
        className: typeof node.className === 'string' ? node.className.slice(0, 100) : null,
        overflow: o,
        overflowX: ox,
        overflowY: oy,
        transform: s.transform,
      });
    }
    node = node.parentElement;
  }

  return {
    ok: true,
    stickyPosition,
    gridDisplay,
    topBefore,
    topAfterScroll,
    scrollTarget,
    /** Sticky should stay near top-20 (~80px) while still inside grid */
    stickyWorks: stickyPosition === 'sticky' && topAfterScroll >= 50 && topAfterScroll <= 100,
    breakingAncestors,
    ancestorChain: auditAncestorChain(left),
  };
}, { leftSelector, shellSelector });

await browser.close();

console.log('\n=== HomeCheff sticky audit ===');
console.log(`URL: ${url}`);
console.log(`Loaded: ${loaded}`);

if (!result.ok) {
  console.error('ERROR:', result.error);
  process.exit(1);
}

console.log(`position: ${result.stickyPosition}`);
console.log(`grid display: ${result.gridDisplay}`);
console.log(`top before scroll: ${result.topBefore.toFixed(1)}px`);
console.log(`top after scroll ${result.scrollTarget?.toFixed?.(0) ?? '?'}px: ${result.topAfterScroll.toFixed(1)}px`);
console.log(`sticky works: ${result.stickyWorks ? 'YES' : 'NO'}`);

if (result.breakingAncestors.length > 0) {
  console.log('\nPotential sticky-breaking ancestors:');
  for (const a of result.breakingAncestors) {
    console.log(`  - <${a.tag}> class="${a.className ?? ''}" overflow=${a.overflow} overflowX=${a.overflowX} overflowY=${a.overflowY}`);
  }
} else {
  console.log('\nNo overflow/transform breaking ancestors found.');
}

console.log('\nAncestor chain (first 8):');
for (const a of result.ancestorChain.slice(0, 8)) {
  console.log(
    `  ${a.tag}${a.id ? `#${a.id}` : ''} overflowX=${a.overflowX ?? '-'} overflowY=${a.overflowY ?? '-'} pos=${a.position ?? '-'}`
  );
}

process.exit(result.stickyWorks ? 0 : 1);

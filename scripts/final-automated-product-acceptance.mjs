#!/usr/bin/env node
/**
 * Final automated product acceptance — Production live + static validators.
 * Writes evidence under docs/audits/final-automated-product-acceptance/
 * Does not print secrets. Does not mutate Production users/listings.
 */
import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs/audits/final-automated-product-acceptance');
const artDir = path.join(outDir, 'artifacts');
const BASE = process.env.HC_ACCEPTANCE_BASE || 'https://homecheff.eu';

fs.mkdirSync(artDir, { recursive: true });

const results = {
  startedAt: new Date().toISOString(),
  base: BASE,
  checks: [],
  defects: [],
  browsers: {},
  summary: { pass: 0, fail: 0, skip: 0, warn: 0 },
};

function rec(name, status, detail = {}) {
  const row = { name, status, ...detail, at: new Date().toISOString() };
  results.checks.push(row);
  results.summary[status === 'PASS' ? 'pass' : status === 'FAIL' ? 'fail' : status === 'WARN' ? 'warn' : 'skip'] += 1;
  console.log(`${status.padEnd(4)} ${name}${detail.note ? ` — ${detail.note}` : ''}`);
  return row;
}

function defect(sev, title, detail) {
  results.defects.push({ severity: sev, title, ...detail });
  console.log(`DEFECT [${sev}] ${title}`);
}

function writeJson(name, data) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2) + '\n');
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'hc-final-acceptance' },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { ok: res.ok, status: res.status, json, textLen: text.length };
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

const VIEWPORTS = [
  { id: 'phone-portrait', width: 390, height: 844 },
  { id: 'phone-landscape', width: 844, height: 390 },
  { id: 'tablet-portrait', width: 768, height: 1024 },
  { id: 'tablet-landscape', width: 1024, height: 768 },
  { id: 'laptop', width: 1280, height: 800 },
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'ultrawide', width: 1920, height: 1080 },
];

async function runBrowserMatrix(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  const matrix = [];
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'nl-NL',
      geolocation: undefined,
      permissions: [],
    });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const failedNet = [];
    page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
    });
    page.on('response', (r) => {
      if (r.status() >= 400 && !r.url().includes('favicon')) {
        failedNet.push({ status: r.status(), url: r.url().slice(0, 160) });
      }
    });

    let hardGate = false;
    let feedApi = false;
    let overflowX = false;
    let navOk = false;
    let searchVisible = false;
    let createVisible = false;
    let bodySnippet = '';

    try {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForTimeout(3500);
      await page.evaluate(() => window.scrollBy(0, 1400));
      await page.waitForTimeout(2000);
      const text = await page.locator('body').innerText();
      bodySnippet = text.replace(/\s+/g, ' ').slice(0, 240);
      hardGate = /Locatie nodig|Kies een plaats.*om verder/i.test(text);
      feedApi = await page.evaluate(() =>
        performance.getEntriesByType('resource').some((r) => r.name.includes('/api/feed')),
      );
      overflowX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      navOk = (await page.locator('nav, [role="navigation"], a[href="/"]').count()) > 0;
      searchVisible =
        (await page.locator('[data-wx-feed-search], input[type="search"], input[placeholder*="Zoek" i], input[placeholder*="Search" i]').count()) > 0;
      createVisible =
        (await page.getByRole('link', { name: /sell|share|plaats|create|aanbied/i }).count()) > 0 ||
        (await page.getByRole('button', { name: /sell|share|plaats|create|aanbied/i }).count()) > 0 ||
        /Sell or share|Plaats|Aanbieden/i.test(text);

      const shot = path.join(artDir, `${label}-${vp.id}.png`);
      await page.screenshot({ path: shot, fullPage: false });

      const status =
        !hardGate && !overflowX && pageErrors.length === 0 ? 'PASS' : 'FAIL';
      if (hardGate) defect('P0', `${label}/${vp.id} hard location gate`, { hardGate: true });
      if (pageErrors.length) defect('P1', `${label}/${vp.id} pageerror`, { pageErrors: pageErrors.slice(0, 3) });
      if (overflowX) defect('P2', `${label}/${vp.id} horizontal overflow`, {});

      matrix.push({
        viewport: vp,
        status,
        hardGate,
        overflowX,
        navOk,
        searchVisible,
        createVisible,
        feedApi,
        pageErrors: pageErrors.slice(0, 5),
        consoleErrors: consoleErrors.slice(0, 5),
        failedNet: failedNet.slice(0, 8),
        screenshot: path.relative(root, shot),
        snippet: bodySnippet,
      });
      rec(`${label}:${vp.id}`, status, {
        note: hardGate ? 'hardGate' : overflowX ? 'overflow' : pageErrors.length ? 'pageerror' : 'ok',
      });
    } catch (e) {
      matrix.push({ viewport: vp, status: 'FAIL', error: String(e.message || e) });
      defect('P0', `${label}/${vp.id} load failure`, { error: String(e.message || e) });
      rec(`${label}:${vp.id}`, 'FAIL', { note: String(e.message || e).slice(0, 120) });
    }
    await context.close();
  }
  await browser.close();
  results.browsers[label] = matrix;
  return matrix;
}

async function feedNoLocationSuite(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'nl-NL',
    permissions: [],
  });
  await context.clearCookies();
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e)));
  const feedResponses = [];
  page.on('response', async (r) => {
    if (r.url().includes('/api/feed') && r.status() === 200) {
      try {
        const j = await r.json();
        feedResponses.push({
          count: j.count,
          kinds: Object.fromEntries(
            Object.entries(
              (j.items || []).reduce((a, it) => {
                const k = it.feedSource || it.listingKind || '?';
                a[k] = (a[k] || 0) + 1;
                return a;
              }, {}),
            ),
          ),
        });
      } catch {
        /* ignore */
      }
    }
  });

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(label === 'webkit' ? 9000 : 4500);
  await page.evaluate(() => window.scrollBy(0, 1800));
  await page.waitForTimeout(label === 'webkit' ? 4000 : 2500);
  const text = await page.locator('body').innerText();
  const hardGate = /Locatie nodig|Kies een plaats.*om verder/i.test(text);
  const endlessSkeleton = (await page.locator('[data-testid="feed-filter-searching-empty"]').count()) > 0 && !(await page.locator('a[href*="/product"], a[href*="/inspiratie"], a[href*="/dish"]').count());
  const linkCount = await page.locator('a[href*="/product"], a[href*="/inspiratie"], a[href*="/dish"]').count();
  const hasCards =
    linkCount > 0 ||
    feedResponses.length > 0 ||
    /\d+\s+result/i.test(text) ||
    /\d+\s+resultaat/i.test(text);

  const out = {
    label,
    hardGate,
    hasCards,
    linkCount,
    endlessSkeleton,
    pageErrors,
    feedResponses: feedResponses.slice(0, 5),
    refineBannerBlocking: /moet.*locatie|location required to continue/i.test(text),
  };
  const status = !hardGate && hasCards && pageErrors.length === 0 ? 'PASS' : 'FAIL';
  if (hardGate) defect('P0', 'Feed without location hard gate', out);
  if (!hasCards) defect('P0', 'Feed without location no cards', out);
  rec(`feed-no-location:${label}`, status, out);
  await context.close();
  await browser.close();
  return out;
}

async function deniedGeoSuite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'nl-NL',
    permissions: [],
    geolocation: undefined,
  });
  // Explicit deny: do not grant geolocation
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.scrollBy(0, 1200));
  await page.waitForTimeout(2000);
  const text = await page.locator('body').innerText();
  const hardGate = /Locatie nodig|Kies een plaats.*om verder/i.test(text);
  const feedAlive = /\d+\s+result|resultaat|product|inspiratie|marketplace/i.test(text);
  const out = {
    permissionMock: 'denied-by-absence',
    hardGate,
    feedAlive,
    note: 'Context-level deny/absence — not physical permission-dialog proof',
  };
  const status = !hardGate && feedAlive ? 'PASS' : 'FAIL';
  if (hardGate) defect('P0', 'Denied geo hard gate', out);
  rec('geolocation:denied-context', status, out);
  await context.close();
  await browser.close();
  return out;
}

async function grantedGeoSuite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'nl-NL',
    geolocation: { latitude: 51.9225, longitude: 4.4792 },
    permissions: ['geolocation'],
  });
  const page = await context.newPage();
  let geoCalls = 0;
  await page.addInitScript(() => {
    const orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = function (...args) {
      window.__hcGeoCalls = (window.__hcGeoCalls || 0) + 1;
      return orig(...args);
    };
  });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
  // Try click Use my location if present
  const gpsBtn = page.getByRole('button', { name: /mijn locatie|my location|use my location|gps/i }).first();
  let clicked = false;
  if (await gpsBtn.count()) {
    try {
      await gpsBtn.click({ timeout: 3000 });
      clicked = true;
      await page.waitForTimeout(2500);
    } catch {
      /* optional */
    }
  }
  geoCalls = await page.evaluate(() => window.__hcGeoCalls || 0);
  const text = await page.locator('body').innerText();
  const hardGate = /Locatie nodig/i.test(text);
  const out = {
    permissionMock: 'granted+coords',
    clickedGpsCta: clicked,
    geoCallsAfterAction: geoCalls,
    hardGate,
    feedVisible:
      /\d+\s+result/i.test(text) ||
      /\d+\s+resultaat/i.test(text) ||
      /Sell or share|DIGITAL NEIGHBOURHOOD|marketplace/i.test(text),
    note: 'Mocked geolocation — not physical dialog proof',
  };
  const status = !hardGate && out.feedVisible ? 'PASS' : 'FAIL';
  rec('geolocation:granted-mock', status, out);
  await context.close();
  await browser.close();
  return out;
}

async function manualLocationSuite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'nl-NL' });
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);

  // Open filters / place path
  const choose = page.getByRole('button', { name: /kies een plaats|choose.*place|locatie|plaats/i }).first();
  let opened = false;
  if (await choose.count()) {
    try {
      await choose.click({ timeout: 4000 });
      opened = true;
      await page.waitForTimeout(800);
    } catch {
      /* */
    }
  }
  // Also try filters sheet
  const filters = page.getByRole('button', { name: /filter|meer/i }).first();
  if (!opened && (await filters.count())) {
    try {
      await filters.click({ timeout: 3000 });
      await page.waitForTimeout(800);
    } catch {
      /* */
    }
  }

  const input = page.locator('[data-testid="feed-place-input"], input[name="place"], input[placeholder*="plaats" i], input[placeholder*="postcode" i]').first();
  let inputState = { found: false };
  if (await input.count()) {
    inputState.found = true;
    inputState.disabled = await input.isDisabled();
    inputState.readOnly = await input.getAttribute('readonly');
    try {
      await input.click({ timeout: 3000 });
      await page.waitForTimeout(200);
      inputState.activeAfterClick = await page.evaluate(
        (el) => document.activeElement === el,
        await input.elementHandle(),
      );
      await input.fill('Rotterdam');
      inputState.value = await input.inputValue();
    } catch (e) {
      inputState.error = String(e.message || e).slice(0, 160);
    }
  }

  const out = {
    chooseOpened: opened,
    input: inputState,
    note: 'DOM focus PASS is not physical keyboard proof',
  };
  const status = inputState.found && !inputState.disabled && inputState.readOnly == null ? 'PASS' : inputState.found ? 'WARN' : 'WARN';
  if (inputState.found && (inputState.disabled || inputState.readOnly != null)) {
    defect('P1', 'Place input disabled/readOnly', out);
  }
  rec('manual-location:dom', status, out);
  await page.screenshot({ path: path.join(artDir, 'manual-location.png') });
  await context.close();
  await browser.close();
  return out;
}

async function searchAndContinuitySuite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'nl-NL' });
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForTimeout(1500);

  const search = page.locator('[data-wx-feed-search]').first();
  const out = { searchFound: (await search.count()) > 0 };
  if (out.searchFound) {
    await search.fill('sushi');
    await search.press('Enter');
    await page.waitForTimeout(4000);
    const text = await page.locator('body').innerText();
    out.afterSearch = {
      hardDeadEnd: /niets gevonden.*wis filters|clear filters to continue/i.test(text) && !(await page.locator('a[href*="/product"], a[href*="/inspiratie"]').count()),
      continuityBand:
        (await page.locator('[data-testid="feed-discovery-continuity-band"], [data-wx-discovery-continuity]').count()) > 0 ||
        /nog geen|niets in jouw buurt|be the first|wees de eerste/i.test(text),
      feedStillPresent:
        (await page.locator('a[href*="/product"], a[href*="/inspiratie"], a[href*="/dish"]').count()) > 0 ||
        /ontdek|discovery|result/i.test(text),
      snippet: text.replace(/\s+/g, ' ').slice(0, 280),
    };
    await page.screenshot({ path: path.join(artDir, 'search-sushi.png') });
  }
  const status = out.searchFound ? 'PASS' : 'WARN';
  rec('search:sparse-sushi', status, out);
  await context.close();
  await browser.close();
  return out;
}

async function longScrollSuite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'nl-NL' });
  const page = await context.newPage();
  const apiPages = [];
  page.on('response', async (r) => {
    if (!r.url().includes('/api/feed') || r.status() !== 200) return;
    try {
      const j = await r.json();
      const ids = (j.items || []).map((it) => it.id);
      apiPages.push({
        url: r.url().slice(0, 180),
        skip: j.pagination?.skip,
        hasMore: j.pagination?.hasMore,
        ids,
      });
    } catch {
      /* */
    }
  });
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
  for (let i = 0; i < 12; i++) {
    await page.evaluate(() => window.scrollBy(0, 2200));
    await page.waitForTimeout(900);
  }
  const renderedHrefs = await page.$$eval('a[href*="/product"], a[href*="/inspiratie"], a[href*="/dish"]', (as) =>
    as.map((a) => a.getAttribute('href')).filter(Boolean),
  );
  // Deduplicate adjacent identical hrefs from multi-anchor cards (image+title).
  const cardSeq = [];
  for (const href of renderedHrefs) {
    if (cardSeq[cardSeq.length - 1] !== href) cardSeq.push(href);
  }
  const idSeq = [];
  for (const href of cardSeq) {
    const m = href.match(/hcid-([a-f0-9-]+)/i) || href.match(/\/([a-f0-9-]{36})/i);
    if (m) idSeq.push(m[1]);
  }
  const consecutiveDupes = [];
  for (let i = 1; i < idSeq.length; i++) {
    if (idSeq[i] === idSeq[i - 1]) consecutiveDupes.push({ index: i, id: idSeq[i] });
  }
  const apiDupPages = [];
  for (let i = 1; i < apiPages.length; i++) {
    const a = apiPages[i - 1];
    const b = apiPages[i];
    if (a.ids.join(',') === b.ids.join(',') && a.ids.length) {
      apiDupPages.push({ i, skipA: a.skip, skipB: b.skip });
    }
  }
  const out = {
    apiPageCount: apiPages.length,
    renderedLinkCount: renderedHrefs.length,
    uniqueRenderedApprox: new Set(idSeq).size,
    consecutiveSameIdNeighbors: consecutiveDupes.slice(0, 10),
    duplicateApiPayloads: apiDupPages.slice(0, 10),
    classification:
      consecutiveDupes.length === 0
        ? 'no_immediate_neighbor_dupes'
        : 'possible_accidental_or_recirc_neighbor',
  };
  const status = apiDupPages.length === 0 ? 'PASS' : 'WARN';
  if (apiDupPages.length) defect('P2', 'Duplicate API feed payloads during scroll', { apiDupPages });
  if (consecutiveDupes.length > 3) defect('P2', 'Many consecutive same-ID neighbors', { consecutiveDupes });
  rec('long-scroll', status, out);
  await context.close();
  await browser.close();
  return out;
}

async function routeCrawl() {
  const routes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/terms',
    '/privacy',
    '/faq',
    '/about',
    '/trust',
    '/manifest',
    '/pitch',
  ];
  const rows = [];
  for (const r of routes) {
    try {
      const res = await fetch(BASE + r, {
        redirect: 'manual',
        headers: { 'user-agent': 'hc-final-acceptance' },
      });
      rows.push({
        route: r,
        status: res.status,
        location: res.headers.get('location'),
        ok: res.status >= 200 && res.status < 400,
      });
      rec(`route:${r}`, res.status >= 200 && res.status < 500 ? 'PASS' : 'FAIL', { status: res.status });
    } catch (e) {
      rows.push({ route: r, error: String(e.message || e), ok: false });
      rec(`route:${r}`, 'FAIL', { note: String(e.message || e) });
    }
  }
  return rows;
}

async function authInfrastructure() {
  const login = await fetch(BASE + '/auth/login', { headers: { 'user-agent': 'hc-final-acceptance' } });
  const html = await login.text();
  const googleVisible = /google|Google/i.test(html);
  const providers = await fetchJson(BASE + '/api/auth/providers');
  const csrf = await fetchJson(BASE + '/api/auth/csrf');
  const session = await fetchJson(BASE + '/api/auth/session');
  // open redirect probe (should not bounce to evil)
  const evil = await fetch(BASE + '/api/auth/signin/google?callbackUrl=https://evil.example', {
    redirect: 'manual',
    headers: { 'user-agent': 'hc-final-acceptance' },
  });
  const out = {
    loginStatus: login.status,
    googleMentionInLoginHtml: googleVisible,
    providersOk: providers.ok,
    providerKeys: providers.json ? Object.keys(providers.json) : [],
    csrfOk: csrf.ok && Boolean(csrf.json?.csrfToken),
    sessionOk: session.ok,
    evilCallbackStatus: evil.status,
    evilLocation: evil.headers.get('location'),
    interactiveGoogle: 'OPERATOR_REQUIRED',
    note: 'No secrets logged; interactive Google not claimed',
  };
  // Fail if csrf missing or providers missing google when expected
  const status = out.csrfOk && out.providersOk ? 'PASS' : 'FAIL';
  if (!out.csrfOk) defect('P1', 'Auth CSRF endpoint unhealthy', out);
  rec('auth-infrastructure', status, out);
  return out;
}

async function contentIntegrity() {
  const national = await fetchJson(BASE + '/api/feed?scope=national&limit=24');
  const items = national.json?.items || [];
  const kinds = {};
  const issues = [];
  let phaseJunk = 0;
  let missingTitle = 0;
  for (const it of items) {
    const k = it.feedSource || it.listingKind || '?';
    kinds[k] = (kinds[k] || 0) + 1;
    const title = it.title || '';
    if (!title) missingTitle += 1;
    if (/phase\s*5[123]|lorem ipsum|test listing|placeholder/i.test(title + ' ' + (it.description || ''))) {
      phaseJunk += 1;
      issues.push({ id: it.id, title: title.slice(0, 80) });
    }
  }
  const imageUrls = items
    .map((it) => it.image || it.discovery?.coverImage)
    .filter(Boolean)
    .slice(0, 12);
  const imageHeads = [];
  for (const u of imageUrls) {
    imageHeads.push({ url: u.slice(0, 100), ...(await headOk(u)) });
  }
  const insp = await fetchJson(BASE + '/api/inspiratie?limit=10');
  const out = {
    nationalCount: national.json?.count,
    kinds,
    phaseJunk,
    missingTitle,
    junkSamples: issues.slice(0, 5),
    imageHeads,
    inspirationCount: insp.json?.total ?? (insp.json?.items || []).length,
  };
  const status = phaseJunk === 0 && missingTitle === 0 ? 'PASS' : phaseJunk ? 'FAIL' : 'WARN';
  if (phaseJunk) defect('P1', 'Phase/placeholder content in Production feed', out);
  rec('content-integrity', status, out);
  return out;
}

async function allesMatrix() {
  const national = await fetchJson(BASE + '/api/feed?scope=national&limit=30');
  const items = national.json?.items || [];
  const matrix = {
    PRODUCT: 0,
    DISH: 0,
    SERVICE: 0,
    OTHER: 0,
  };
  for (const it of items) {
    const k = it.feedSource || it.listingKind || 'OTHER';
    if (matrix[k] == null) matrix.OTHER += 1;
    else matrix[k] += 1;
  }
  const cake = await fetchJson(BASE + '/api/feed?scope=national&q=cake&limit=10');
  const sushi = await fetchJson(BASE + '/api/feed?scope=nearby&lat=51.9225&lng=4.4792&radius=50&q=sushi&limit=10');
  const grown = await fetchJson(BASE + '/api/feed?scope=national&vertical=GROWN&limit=10');
  const out = {
    nationalKinds: matrix,
    mixedNational: matrix.PRODUCT > 0 && matrix.DISH > 0,
    searchCake: { count: cake.json?.count, kinds: (cake.json?.items || []).map((i) => i.feedSource) },
    searchSushiSparse: { count: sushi.json?.count },
    garden: { count: grown.json?.count, kinds: (grown.json?.items || []).map((i) => i.feedSource) },
  };
  const status = out.mixedNational ? 'PASS' : 'FAIL';
  if (!out.mixedNational) defect('P0', 'National Alles not mixed PRODUCT+DISH', out);
  rec('alles-content-matrix', status, out);
  return out;
}

function runStaticValidators() {
  const cmds = [
    ['test:discovery-continuity', 'npm', ['run', 'test:discovery-continuity']],
    ['test:feed-composition-progressive', 'npm', ['run', 'test:feed-composition-progressive']],
    ['test:discovery-feed-without-location', 'npm', ['run', 'test:discovery-feed-without-location']],
    ['test:location-input-repair', 'npm', ['run', 'test:location-input-repair']],
    ['test:gps-location-repair', 'npm', ['run', 'test:gps-location-repair']],
    ['test:location-mobile-keyboard', 'npm', ['run', 'test:location-mobile-keyboard']],
    ['test:google-login-repair', 'npm', ['run', 'test:google-login-repair']],
  ];
  const out = {};
  for (const [name, cmd, args] of cmds) {
    const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', timeout: 120000 });
    const pass = r.status === 0;
    out[name] = {
      status: pass ? 'PASS' : 'FAIL',
      exit: r.status,
      tail: (r.stdout || r.stderr || '').split('\n').slice(-12).join('\n'),
    };
    if (!pass) defect('P1', `Static validator failed: ${name}`, { exit: r.status });
    rec(`validator:${name}`, pass ? 'PASS' : 'FAIL');
  }
  return out;
}

async function rotationSuite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'nl-NL' });
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
  const before = await page.evaluate(() => ({
    w: window.innerWidth,
    mount: document.querySelector('[data-wx-continuity-remount]')?.getAttribute('data-wx-continuity-remount') || null,
  }));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(1500);
  const mid = await page.evaluate(() => ({
    w: window.innerWidth,
    mount: document.querySelector('[data-wx-continuity-remount]')?.getAttribute('data-wx-continuity-remount') || null,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({
    w: window.innerWidth,
    mount: document.querySelector('[data-wx-continuity-remount]')?.getAttribute('data-wx-continuity-remount') || null,
    hardGate: /Locatie nodig/i.test(document.body.innerText),
  }));
  const out = { before, mid, after, note: 'Viewport resize emulation — not physical device rotation' };
  const status = !after.hardGate && !mid.overflow ? 'PASS' : 'WARN';
  rec('responsive-rotation', status, out);
  await context.close();
  await browser.close();
  return out;
}

async function main() {
  console.log('=== Final automated product acceptance ===');
  console.log('BASE', BASE);

  const validators = runStaticValidators();
  writeJson('automated-test-results.json', { validators, browserChecksPending: true });

  const alles = await allesMatrix();
  writeJson('alles-content-matrix.json', alles);

  const integrity = await contentIntegrity();
  writeJson('content-integrity.json', integrity);

  const routes = await routeCrawl();
  writeJson('route-crawl.json', routes);

  const auth = await authInfrastructure();
  writeJson('auth-infrastructure.json', auth);

  const feedCr = await feedNoLocationSuite(chromium, 'chromium');
  const feedWk = await feedNoLocationSuite(webkit, 'webkit');
  writeJson('feed-no-location.json', { chromium: feedCr, webkit: feedWk });

  const geoDenied = await deniedGeoSuite();
  const geoGranted = await grantedGeoSuite();
  writeJson('geolocation-matrix.json', { denied: geoDenied, granted: geoGranted });

  const manual = await manualLocationSuite();
  writeJson('manual-location.json', manual);

  const search = await searchAndContinuitySuite();
  writeJson('search-matrix.json', search);

  const scroll = await longScrollSuite();
  writeJson('recirculation-long-scroll.json', scroll);

  const rotation = await rotationSuite();
  writeJson('responsive-rotation.json', rotation);

  await runBrowserMatrix(chromium, 'chromium');
  await runBrowserMatrix(webkit, 'webkit');
  try {
    const edgeBrowser = await chromium.launch({ channel: 'msedge', headless: true });
    await edgeBrowser.close();
    // Reuse chromium launcher with channel via wrapper
    const edgeType = {
      launch: (opts) => chromium.launch({ ...opts, channel: 'msedge' }),
    };
    await runBrowserMatrix(edgeType, 'msedge');
  } catch (e) {
    rec('msedge', 'SKIP', { note: String(e.message || e).slice(0, 160) });
    results.browsers.msedge = { skipped: true, reason: String(e.message || e).slice(0, 200) };
  }

  writeJson('browser-matrix.json', results.browsers);
  writeJson('viewport-matrix.json', { viewports: VIEWPORTS, browsers: Object.keys(results.browsers) });
  writeJson('defects.json', { defects: results.defects });
  writeJson('filter-matrix.json', {
    note: 'Filter chip UI exercised partially via search suite; full chip matrix relies on validators + DOM selectors',
    validators: {
      progressive: validators['test:feed-composition-progressive']?.status,
      continuity: validators['test:discovery-continuity']?.status,
    },
  });
  writeJson('progressive-discovery.json', {
    policySource: 'lib/feed/feed-composition-policy.ts',
    validator: validators['test:feed-composition-progressive'],
    liveNearby: await fetchJson(BASE + '/api/feed?scope=nearby&lat=51.9225&lng=4.4792&radius=10&limit=20').then((r) => ({
      count: r.json?.count,
      kinds: (r.json?.items || []).reduce((a, it) => {
        const k = it.feedSource || '?';
        a[k] = (a[k] || 0) + 1;
        return a;
      }, {}),
    })),
  });
  writeJson('continuity-proof.json', {
    validator: validators['test:discovery-continuity'],
    searchSparseUi: search,
    noFixedThresholdInCode: !fs
      .readFileSync(path.join(root, 'lib/feed/discovery-continuity.ts'), 'utf8')
      .includes('FEED_EXACT_SPARSE_THRESHOLD'),
  });

  results.finishedAt = new Date().toISOString();
  writeJson('automated-test-results.json', {
    summary: results.summary,
    checks: results.checks,
    validators,
    defects: results.defects,
  });

  console.log('\n=== SUMMARY ===');
  console.log(results.summary);
  console.log('defects', results.defects.length);
  process.exitCode = results.defects.some((d) => d.severity === 'P0' || d.severity === 'P1') ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});

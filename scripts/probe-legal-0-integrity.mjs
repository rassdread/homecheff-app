#!/usr/bin/env node
/**
 * LEGAL-0 HTTP + UI probe.
 *
 *   BASE_URL=https://homecheff.eu node scripts/probe-legal-0-integrity.mjs
 *   BASE_URL=http://127.0.0.1:3000 node scripts/probe-legal-0-integrity.mjs
 */
import { chromium, webkit } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const OUT = path.join(
  process.cwd(),
  'docs/audits/legal-0-integrity',
  `probe-${Date.now()}`,
);
mkdirSync(OUT, { recursive: true });

const UNKNOWN_SLUG = '/this-slug-does-not-exist-legal0-xyz/';
const MISSING_UUID = '00000000-0000-4000-8000-000000000000';

async function httpProbe(pathname) {
  const url = `${BASE}${pathname}`;
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: { 'user-agent': 'HomeCheff-LEGAL0-probe' },
  });
  const location = res.headers.get('location');
  let body = '';
  let title = '';
  let robotsMeta = '';
  let canonical = '';
  let jsonLdTypes = [];
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html') && res.status !== 308 && res.status !== 307) {
    body = await res.text();
    const t = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    title = t ? t[1].replace(/\s+/g, ' ').trim() : '';
    const r = body.match(/<meta[^>]+name=["']robots["'][^>]*>/i);
    robotsMeta = r ? r[0] : '';
    const c = body.match(/rel=["']canonical["'][^>]*href=["']([^"']+)/i)
      || body.match(/href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    canonical = c ? c[1] : '';
    const ld = [...body.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    jsonLdTypes = ld.flatMap((m) => {
      try {
        const parsed = JSON.parse(m[1]);
        const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
        return nodes.map((n) => n && n['@type']).filter(Boolean);
      } catch {
        return [];
      }
    });
  }
  return {
    path: pathname,
    status: res.status,
    location,
    xRobots: res.headers.get('x-robots-tag'),
    title,
    robotsMeta,
    canonical,
    jsonLdTypes,
    has404Heading: /Page not found|404/.test(body),
    hasHomepageFeed: /id=["']homecheff-feed/.test(body),
    legalStamp: (body.match(/data-legal-document="(terms|privacy)"[\s\S]*?<\/p>/i) || [''])[0]
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200),
  };
}

async function browserPass(browserType, label, viewport) {
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  const rows = [];
  for (const p of ['/', '/terms/', '/privacy/', UNKNOWN_SLUG, `/product/${MISSING_UUID}/`]) {
    const response = await page.goto(`${BASE}${p}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    const status = response ? response.status() : null;
    const title = await page.title();
    const bodyText = await page.locator('body').innerText().catch(() => '');
    rows.push({
      label,
      path: p,
      status,
      title,
      has404: /page not found/i.test(bodyText) || title.toLowerCase().includes('not found'),
      hasFeed: Boolean(await page.$('#homecheff-feed-desktop, [data-homecheff-site-footer]')),
      legalText: (await page.locator('[data-legal-document]').textContent().catch(() => '')) || '',
    });
  }
  await browser.close();
  return rows;
}

const httpRows = [];
for (const p of [
  '/',
  '/terms/',
  '/privacy/',
  '/over-ons/',
  '/faq/',
  '/manifest/',
  '/constitution/',
  '/seo-hub/',
  '/affiliate/',
  '/contact/',
  UNKNOWN_SLUG,
  `/product/${MISSING_UUID}/`,
  `/profile/${MISSING_UUID}/`,
  `/user/this-user-does-not-exist-legal0/`,
  `/seller/${MISSING_UUID}/`,
  `/recipe/${MISSING_UUID}/`,
  `/listing/${MISSING_UUID}/`,
]) {
  httpRows.push(await httpProbe(p));
}

const browsers = [];
browsers.push(
  ...(await browserPass(chromium, 'chromium-desktop', { width: 1280, height: 800 })),
);
browsers.push(
  ...(await browserPass(chromium, 'chromium-mobile', {
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
  })),
);
browsers.push(
  ...(await browserPass(webkit, 'webkit-desktop', { width: 1280, height: 800 })),
);

const report = { base: BASE, httpRows, browsers };
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`wrote ${path.join(OUT, 'report.json')}`);

const unknown = httpRows.find((r) => r.path === UNKNOWN_SLUG);
if (!unknown || unknown.status !== 404) {
  console.error('UNKNOWN_SLUG_NOT_404', unknown);
  process.exitCode = 1;
}
for (const p of ['/terms/', '/privacy/', '/']) {
  const row = httpRows.find((r) => r.path === p);
  if (!row || row.status !== 200) {
    console.error('VALID_ROUTE_NOT_200', p, row);
    process.exitCode = 1;
  }
}

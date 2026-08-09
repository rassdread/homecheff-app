/**
 * Public routes performance probe (Playwright).
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 npx tsx scripts/audit-public-perf-browser.ts
 *   BASE_URL=https://homecheff.eu npx tsx scripts/audit-public-perf-browser.ts
 */
import { chromium, webkit, devices, type Browser, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const OUT_DIR = path.join(process.cwd(), 'docs/audits/public-routes-p0');

type Timings = {
  listingClientNavMs: number | null;
  listingUsefulContentMs: number | null;
  listingColdMs: number | null;
  profileClientNavMs: number | null;
  profileUsefulContentMs: number | null;
  profileColdMs: number | null;
  secondListingMs: number | null;
  listingCriticalProductApi: boolean;
  profileSellerProductsApi: boolean;
  listingApiCalls: string[];
  profileApiCalls: string[];
  listingCrash: boolean;
  profileOk: boolean;
};

function isUsefulListing(page: Page) {
  return page.locator('h1').first().isVisible({ timeout: 20000 });
}

async function waitUsefulListing(page: Page, started: number) {
  await page.waitForSelector('h1', { timeout: 25000 });
  // Commerce / price signal
  await page
    .locator('text=/€|EUR|Bestel|Contact|Ophalen|Beschikbaar/i')
    .first()
    .waitFor({ timeout: 15000 })
    .catch(() => undefined);
  return Date.now() - started;
}

async function waitUsefulProfile(page: Page, started: number) {
  await page.waitForSelector('h1, [data-profile-display-name]', { timeout: 25000 });
  // Aanbod grid or empty state
  await page
    .locator('text=/Aanbod|aanbod|Nog geen|Inspiratie/i')
    .first()
    .waitFor({ timeout: 20000 })
    .catch(() => undefined);
  return Date.now() - started;
}

async function runScenario(browser: Browser, label: string): Promise<{ label: string; timings: Timings; pageerrors: string[] }> {
  const context = await browser.newContext(
    label.includes('mobile')
      ? { ...devices['Pixel 7'], locale: 'nl-NL' }
      : { viewport: { width: 1440, height: 900 }, locale: 'nl-NL' },
  );
  const page = await context.newPage();
  const pageerrors: string[] = [];
  page.on('pageerror', (e) => pageerrors.push(String(e.message)));

  const listingApiCalls: string[] = [];
  const profileApiCalls: string[] = [];
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('/api/')) {
      const pathOnly = u.replace(BASE, '');
      if (page.url().includes('/product/') || page.url().includes('/listing/')) {
        listingApiCalls.push(pathOnly);
      }
      if (page.url().includes('/user/')) {
        profileApiCalls.push(pathOnly);
      }
    }
  });

  const feed = await fetch(`${BASE}/api/feed?scope=national&take=20`).then((r) => r.json());
  const items = (feed.items || []).filter((i: any) => i?.id && (i.image || i.Image?.[0] || i.photos?.[0]));
  const first = items[0];
  const second = items[1] || items[0];
  if (!first) throw new Error('no feed items');

  const listingHref =
    first.href ||
    `/product/${encodeURIComponent(String(first.title || 'item').toLowerCase().replace(/\s+/g, '-'))}-hcid-${first.id}`;
  // Prefer id-based path from feed when available
  const listingPath = `/product/${first.id}`;
  const sellerId = first.User?.id || first.seller?.id || first.sellerUserId;
  const username = first.User?.username || first.seller?.username;
  const profilePath = username
    ? `/user/${encodeURIComponent(username)}`
    : `/user/${sellerId}`;

  const timings: Timings = {
    listingClientNavMs: null,
    listingUsefulContentMs: null,
    listingColdMs: null,
    profileClientNavMs: null,
    profileUsefulContentMs: null,
    profileColdMs: null,
    secondListingMs: null,
    listingCriticalProductApi: false,
    profileSellerProductsApi: false,
    listingApiCalls: [],
    profileApiCalls: [],
    listingCrash: false,
    profileOk: false,
  };

  // Warm home
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(800);

  // A. feed → listing (client nav via goto still measures RSC+hydrate; click if link present)
  listingApiCalls.length = 0;
  let t0 = Date.now();
  const feedLink = page.locator(`a[href*="${first.id}"]`).first();
  if (await feedLink.count()) {
    await feedLink.click({ timeout: 10000 });
  } else {
    await page.goto(`${BASE}${listingPath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  timings.listingUsefulContentMs = await waitUsefulListing(page, t0);
  timings.listingClientNavMs = timings.listingUsefulContentMs;
  timings.listingApiCalls = [...listingApiCalls];
  timings.listingCriticalProductApi = listingApiCalls.some((u) =>
    /\/api\/products\/[^/]+$/.test(u.split('?')[0]),
  );
  timings.listingCrash = pageerrors.some((e) => /hasPublicDisplayPrice|Application error/i.test(e));

  // B. listing → profile
  profileApiCalls.length = 0;
  t0 = Date.now();
  const profileLink = page.locator(`a[href*="/user/"]`).first();
  if (await profileLink.count()) {
    await profileLink.click({ timeout: 10000 });
  } else {
    await page.goto(`${BASE}${profilePath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  timings.profileUsefulContentMs = await waitUsefulProfile(page, t0);
  timings.profileClientNavMs = timings.profileUsefulContentMs;
  timings.profileApiCalls = [...profileApiCalls];
  timings.profileSellerProductsApi = profileApiCalls.some((u) => u.includes('/api/seller/products'));
  timings.profileOk = !pageerrors.length;

  // C. profile → second listing
  t0 = Date.now();
  const secondPath = `/product/${second.id}`;
  const aanbodLink = page.locator(`a[href*="/product/"]`).first();
  if (await aanbodLink.count()) {
    await aanbodLink.click({ timeout: 10000 }).catch(async () => {
      await page.goto(`${BASE}${secondPath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    });
  } else {
    await page.goto(`${BASE}${secondPath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  timings.secondListingMs = await waitUsefulListing(page, t0);

  // D/E cold loads (new context pages)
  const coldListing = await context.newPage();
  t0 = Date.now();
  await coldListing.goto(`${BASE}${listingPath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  timings.listingColdMs = await waitUsefulListing(coldListing, t0);
  await coldListing.close();

  const coldProfile = await context.newPage();
  t0 = Date.now();
  await coldProfile.goto(`${BASE}${profilePath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  timings.profileColdMs = await waitUsefulProfile(coldProfile, t0);
  await coldProfile.close();

  await context.close();
  return { label, timings, pageerrors };
}

async function main() {
  const results: any = { base: BASE, at: new Date().toISOString(), browsers: {} };

  const chrome = await chromium.launch({ headless: true });
  results.browsers.chromium = await runScenario(chrome, 'chromium-desktop');
  results.browsers.mobile = await runScenario(chrome, 'chromium-mobile');
  await chrome.close();

  try {
    const wk = await webkit.launch({ headless: true });
    results.browsers.webkit = await runScenario(wk, 'webkit');
    await wk.close();
  } catch (e) {
    results.browsers.webkit = { error: String(e) };
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, 'perf-probe.json');
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  console.log(`Wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

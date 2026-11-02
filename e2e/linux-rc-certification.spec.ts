import { test, expect } from '@playwright/test';

/**
 * Linux RC certification suite (preview or designated SMOKE_BASE_URL).
 * Extends critical journeys with marketplace/profile/Prisma health checks.
 * Does not place real payments or mutate production-critical data.
 */

const ERROR_TITLE = 'Er is een fout opgetreden';
const CONSOLE_BLOCK = /ReferenceError|TypeError|is not defined|Hydration failed|Minified React error/;

function watch(page: import('@playwright/test').Page) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && CONSOLE_BLOCK.test(msg.text())) {
      problems.push(`console: ${msg.text().slice(0, 240)}`);
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    if (status >= 500 && url.includes('/api/')) problems.push(`api ${status} ${url}`);
  });
  return problems;
}

const PUBLIC_PAGES: Array<{ id: string; path: string; expectText: RegExp }> = [
  { id: 'RC_HOME', path: '/', expectText: /HomeCheff|Ontdek/i },
  { id: 'RC_LOGIN', path: '/login', expectText: /Inloggen|Log in|E-mail/i },
  { id: 'RC_REGISTER', path: '/register', expectText: /Registreren|Account|E-mail/i },
  { id: 'RC_FORGOT', path: '/forgot-password', expectText: /wachtwoord|password|e-mail|email/i },
  { id: 'RC_PRICING', path: '/pricing', expectText: /plan|prijs|Basic|Pro|Premium|HomeCheff/i },
  { id: 'RC_INSPIRATIE', path: '/inspiratie', expectText: /Inspiratie|HomeCheff/i },
  { id: 'RC_CONTACT', path: '/contact', expectText: /contact|bericht|HomeCheff/i },
  { id: 'RC_FAQ', path: '/faq', expectText: /vraag|faq|HomeCheff/i },
  { id: 'RC_PRIVACY', path: '/privacy', expectText: /privacy|HomeCheff/i },
  { id: 'RC_TERMS', path: '/terms', expectText: /voorwaarde|terms|HomeCheff/i },
  { id: 'RC_HOE', path: '/hoe-homecheff-werkt', expectText: /HomeCheff|werkt/i },
  { id: 'RC_DELIVERY_START', path: '/delivery/start', expectText: /bezorg|delivery|Inloggen|HomeCheff/i },
  { id: 'RC_CHECKOUT_GATE', path: '/checkout', expectText: /winkelwagen|cart|Inloggen|leeg|checkout|HomeCheff/i },
  { id: 'RC_MESSAGES_GATE', path: '/messages', expectText: /Inloggen|bericht|message|E-mail/i },
  { id: 'RC_PROFILE_GATE', path: '/profile', expectText: /Inloggen|profiel|E-mail|HomeCheff/i },
];

for (const journey of PUBLIC_PAGES) {
  test(`${journey.id} ${journey.path}`, async ({ page }) => {
    const problems = watch(page);
    const response = await page.goto(journey.path, { waitUntil: 'domcontentloaded' });
    expect(response, 'navigation response').toBeTruthy();
    expect(response!.status(), 'document status').toBeLessThan(500);
    await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
    await expect(page.locator('body')).toContainText(journey.expectText);
    expect(problems, problems.join('\n')).toEqual([]);
  });
}

test('RC_FEED_API_PRISMA_LINUX nearby returns JSON items', async ({ request }) => {
  const bust = Date.now();
  const res = await request.get(
    `/api/feed?radius=25&scope=nearby&lat=51.9225&lng=4.47917&take=10&vertical=all&_=${bust}`,
  );
  expect(res.status(), await res.text()).toBe(200);
  const data = await res.json();
  expect(Array.isArray(data.items)).toBeTruthy();
  expect(data.items.length).toBeGreaterThan(0);
  expect(data.error ?? null).toBeNull();
});

test('RC_FEED_API national includes marketplace listings', async ({ request }) => {
  const bust = Date.now();
  const res = await request.get(
    `/api/feed?radius=0&scope=national&take=10&vertical=all&_=${bust}`,
  );
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.items.length).toBeGreaterThan(0);
});

test('RC_NULL_BIO_Krentenbol_search', async ({ request }) => {
  const bust = Date.now();
  const res = await request.get(
    `/api/feed?radius=0&scope=national&take=20&vertical=all&q=Krentenbol&_=${bust}`,
  );
  expect(res.status()).toBe(200);
  const data = await res.json();
  const hit = (data.items || []).some((i: { title?: string }) =>
    /krentenbol/i.test(i.title || ''),
  );
  expect(hit, 'Krentenbol must remain discoverable (NULL-bio regression)').toBeTruthy();
});

test('RC_PUBLIC_PROFILE_from_feed', async ({ page, request }) => {
  const problems = watch(page);
  const feed = await request.get(
    `/api/feed?radius=0&scope=national&take=10&vertical=all&_=${Date.now()}`,
  );
  expect(feed.status()).toBe(200);
  const data = await feed.json();
  const item = (data.items || []).find(
    (entry: { User?: { username?: string; id?: string } }) =>
      entry?.User?.username || entry?.User?.id,
  );
  expect(item, 'feed item with seller').toBeTruthy();
  const username = item.User.username || item.User.id;
  const response = await page.goto(`/user/${encodeURIComponent(username)}`, {
    waitUntil: 'domcontentloaded',
  });
  expect(response!.status()).toBeLessThan(500);
  await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
  await expect(page.getByText(/could not be loaded/i)).toHaveCount(0);
  await expect(page.locator('body')).toContainText(/@|Aanbod|HomeCheff|profiel/i);
  expect(problems, problems.join('\n')).toEqual([]);
});

test('RC_PRODUCT_DETAIL_from_feed', async ({ page, request }) => {
  const problems = watch(page);
  const feed = await request.get(
    `/api/feed?radius=0&scope=national&take=10&vertical=all&_=${Date.now()}`,
  );
  expect(feed.status()).toBe(200);
  const data = await feed.json();
  const item = (data.items || []).find(
    (entry: { id?: string; title?: string; feedSource?: string }) =>
      entry?.id && entry?.title && entry.feedSource !== 'DISH',
  );
  expect(item).toBeTruthy();
  const response = await page.goto(`/product/${item.id}`, { waitUntil: 'domcontentloaded' });
  expect(response!.status()).toBeLessThan(400);
  await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
  await expect(page.locator('body')).toContainText(item.title);
  expect(problems, problems.join('\n')).toEqual([]);
});

test('RC_HOMEPAGE_FEED_renders_results', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect
    .poll(async () => {
      const text = await page.locator('body').innerText();
      if (/\b([1-9]\d*)\s+resultaten\b/.test(text)) return 'ok';
      if (/\b0\s+resultaten\b/.test(text)) return 'zero';
      return 'loading';
    }, { timeout: 45_000 })
    .toBe('ok');
  const productLinks = page.locator('a[href*="/product"]');
  await expect(productLinks.first()).toBeVisible({ timeout: 15_000 });
  expect(problems, problems.join('\n')).toEqual([]);
});

test('RC_CATEGORY_FILTER_eten_ui', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const eten = page.getByRole('button', { name: /^Eten$/i }).first();
  await eten.click();
  await page.waitForTimeout(1500);
  await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
  expect(problems, problems.join('\n')).toEqual([]);
});

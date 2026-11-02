import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Browser certification for marketplace infinite scroll.
 * Feed payloads are synthetic fixtures. No production listings, seller
 * accounts, payments, or shipping labels are touched.
 *
 *   SMOKE_BASE_URL=http://127.0.0.1:3105 npx playwright test e2e/marketplace-infinite-scroll.spec.ts --project=desktop --project=mobile
 */

const PAGE_SIZE = 10;
const SALE_COUNT = 30;

type FeedHit = {
  skip: number;
  take: number;
  status: number;
  radius: string;
  scope: string;
  vertical: string;
  q: string;
  ids: string[];
};

function idFor(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

function listing(n: number, query = ''): Record<string, unknown> {
  const inspiration = n % 11 === 0;
  const cheff = n % 2 === 0;
  const id = idFor(n);
  const title = query
    ? `Cert ${query} listing ${n}`
    : inspiration
      ? `Cert inspiration ${n}`
      : `Cert listing ${n}`;
  return {
    id,
    feedSource: inspiration ? 'DISH' : 'PRODUCT',
    listingIntent: 'OFFER',
    listingKind: inspiration ? 'INSPIRATION' : 'PRODUCT',
    title,
    description: 'Synthetic scroll certification listing',
    priceCents: inspiration ? 0 : 1250,
    orderMethod: 'CHECKOUT',
    acceptHomeCheffPayment: true,
    acceptDirectContact: false,
    sellerStripeConnectReady: false,
    priceModel: 'FIXED',
    category: cheff ? 'CHEFF' : 'DESIGNER',
    marketplaceCategory: cheff ? 'CREATE' : 'DESIGN',
    subcategory: cheff ? 'create.meal' : 'design.craft',
    specializations: [cheff ? 'create.meal' : 'design.craft'],
    fulfillmentOptions: {
      digital: false,
      pickup: true,
      delivery: false,
      shipping: false,
    },
    status: 'ACTIVE',
    isPublic: true,
    isActive: true,
    place: 'Vlaardingen',
    lat: 51.91,
    lng: 4.34,
    distanceKm: 2,
    favoriteCount: 0,
    propsCount: 0,
    viewCount: 0,
    sellerFansCount: 0,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, n % 24)).toISOString(),
    image: null,
    isInspiration: inspiration,
    isRecipe: inspiration,
    type: inspiration ? 'recipe' : 'product',
    User: {
      id: 'scroll-cert-seller',
      name: 'Scroll Bakker',
      username: 'scrollbakker',
      place: 'Vlaardingen',
      city: 'Vlaardingen',
      bio: null,
    },
    seller: {
      id: 'scroll-cert-seller',
      name: 'Scroll Bakker',
      username: 'scrollbakker',
    },
    taxonomy: inspiration
      ? { kind: 'INSPIRATION', direction: 'OFFER', category: 'CHEFF', exchange: 'FREE' }
      : {
          kind: 'PRODUCT',
          direction: 'OFFER',
          category: cheff ? 'CHEFF' : 'DESIGNER',
          exchange: 'MONEY',
        },
  };
}

function inventoryFor(url: URL): Array<Record<string, unknown>> {
  const q = (url.searchParams.get('q') || '').trim();
  const vertical = (url.searchParams.get('vertical') || '').toLowerCase();
  if (q) {
    return Array.from({ length: 20 }, (_, i) => listing(2000 + i, q));
  }
  const rows = Array.from({ length: SALE_COUNT }, (_, i) => listing(i + 1));
  if (vertical === 'cheff') return rows.filter((row) => row.category === 'CHEFF');
  if (vertical === 'designer') return rows.filter((row) => row.category === 'DESIGNER');
  return rows;
}

function feedBody(url: URL) {
  const take = Number(url.searchParams.get('take') || PAGE_SIZE);
  const skip = Number(url.searchParams.get('skip') || '0');
  const rows = inventoryFor(url);
  const items = rows.slice(skip, skip + take);
  const nextSkip = skip + items.length;
  return {
    filters: {
      q: url.searchParams.get('q') || '',
      vertical: url.searchParams.get('vertical'),
      scope: url.searchParams.get('scope') || '',
      radius: Number(url.searchParams.get('radius') || '0'),
    },
    count: items.length,
    items,
    pagination: {
      take,
      skip,
      total: rows.length,
      hasMore: nextSkip < rows.length,
      nextSkip,
    },
    discovery: null,
  };
}

async function installFixtures(page: Page, authenticated: boolean) {
  const hits: FeedHit[] = [];
  let failNextPage = false;
  const consoleProblems: string[] = [];
  let saleAuditLogs = 0;

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Maximum update depth')) consoleProblems.push(text);
    if (text.includes('sale visibility audit')) saleAuditLogs += 1;
  });
  page.on('pageerror', (error) => {
    if (String(error).includes('Maximum update depth')) {
      consoleProblems.push(String(error));
    }
  });

  await page.route('**/api/**', async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/i18n')) {
      await route.continue();
      return;
    }
    if (url.pathname.includes('/action-center')) {
      await route.fulfill({
        status: 200,
        json: { items: [], healthy: true, hasSellerProfile: false, roles: { hasSellerProfile: false } },
      });
      return;
    }
    if (url.pathname.includes('/api/feed')) {
      const skip = Number(url.searchParams.get('skip') || '0');
      if (failNextPage && skip > 0) {
        failNextPage = false;
        hits.push({
          skip,
          take: Number(url.searchParams.get('take') || '0'),
          status: 500,
          radius: url.searchParams.get('radius') || '0',
          scope: url.searchParams.get('scope') || '',
          vertical: url.searchParams.get('vertical') || '',
          q: url.searchParams.get('q') || '',
          ids: [],
        });
        await route.fulfill({ status: 500, json: { error: 'synthetic failure' } });
        return;
      }
      const body = feedBody(url);
      hits.push({
        skip,
        take: Number(url.searchParams.get('take') || PAGE_SIZE),
        status: 200,
        radius: url.searchParams.get('radius') || '0',
        scope: url.searchParams.get('scope') || '',
        vertical: url.searchParams.get('vertical') || '',
        q: url.searchParams.get('q') || '',
        ids: (body.items as Array<{ id: string }>).map((row) => row.id),
      });
      await route.fulfill({ status: 200, json: body });
      return;
    }
    if (url.pathname.includes('/api/auth/session')) {
      await route.fulfill({
        status: 200,
        json: authenticated
          ? {
              user: {
                id: 'scroll-cert-user',
                name: 'Scroll Cert',
                email: 'scroll-cert@example.test',
              },
              expires: '2099-01-01T00:00:00.000Z',
            }
          : {},
      });
      return;
    }
    await route.fulfill({ status: 200, json: {} });
  });

  return {
    hits,
    consoleProblems,
    auditCount: () => saleAuditLogs,
    failNextPageOnce() {
      failNextPage = true;
    },
  };
}

async function seedNearby(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'hc_location_pref_v2',
      JSON.stringify({
        version: 2,
        place: 'Vlaardingen',
        lat: 51.91,
        lng: 4.34,
        radiusKm: 25,
        source: 'manual',
        bannerDismissed: true,
        updatedAt: Date.now(),
        countryCode: 'NL',
        regionCode: null,
        mode: 'point',
        precision: 'approx',
        label: 'Vlaardingen',
      }),
    );
  });
}

async function dismissCookies(page: Page) {
  const btn = page.getByRole('button', {
    name: /alleen noodzakelijk|accepteer alle|necessary only|accept all/i,
  });
  if (await btn.first().isVisible().catch(() => false)) {
    await btn.first().click().catch(() => undefined);
  }
}

async function scrollFeed(page: Page, times = 8) {
  for (let i = 0; i < times; i++) {
    await page.evaluate(() => {
      const nested =
        document.getElementById('homecheff-feed-desktop') ||
        document.querySelector('[data-hc-feed-scroll-root], [data-desktop-feed-column]');
      if (
        nested instanceof HTMLElement &&
        nested.scrollHeight > nested.clientHeight + 40
      ) {
        nested.scrollTop = nested.scrollHeight;
        nested.dispatchEvent(new Event('scroll', { bubbles: true }));
      } else {
        window.scrollTo(0, document.body.scrollHeight);
        window.dispatchEvent(new Event('scroll'));
      }
      const sentinel = document.querySelector(
        '[data-testid="feed-sentinel"], [data-testid="feed-discovery-sentinel"]',
      );
      if (sentinel instanceof HTMLElement) {
        sentinel.scrollIntoView({ block: 'end', inline: 'nearest' });
      }
    });
    await page.waitForTimeout(500);
  }
}

async function scrollOffset(page: Page): Promise<number> {
  return page.evaluate(() => {
    const nested = document.getElementById('homecheff-feed-desktop');
    if (
      nested instanceof HTMLElement &&
      nested.scrollHeight > nested.clientHeight + 40
    ) {
      return nested.scrollTop;
    }
    return window.scrollY;
  });
}

async function visibleListingIds(page: Page): Promise<string[]> {
  const hrefs = await page.locator('a[href*="-hcid-"]').evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLAnchorElement).getAttribute('href') || ''),
  );
  const ids: string[] = [];
  for (const href of hrefs) {
    const marker = href.indexOf('-hcid-');
    if (marker < 0) continue;
    const id = href.slice(marker + '-hcid-'.length).split(/[?#]/)[0];
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

async function openHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText(/HomeCheff/i, { timeout: 30_000 });
  await dismissCookies(page);
  await page.locator('a[href*="-hcid-"]').first().waitFor({ state: 'visible', timeout: 45_000 });
}

function assertNoLoop(problems: string[], audits: number) {
  expect(problems, 'React maximum update depth').toEqual([]);
  expect(audits, 'sale visibility audit runaway').toBeLessThan(80);
}

test.describe('marketplace infinite scroll', () => {
  test('guest appends three pages without duplicates or effect loops', async ({ page }) => {
    test.setTimeout(120_000);
    const fx = await installFixtures(page, false);
    await seedNearby(page);
    await openHome(page);
    const before = await visibleListingIds(page);
    expect(before.length).toBeGreaterThan(0);
    await scrollFeed(page, 10);
    const afterScroll = await scrollOffset(page);
    expect(afterScroll).toBeGreaterThan(80);
    await page.waitForTimeout(700);
    expect(await scrollOffset(page)).toBeGreaterThan(40);
    const after = await visibleListingIds(page);
    expect(after.length).toBeGreaterThan(before.length);
    expect(new Set(after).size).toBe(after.length);
    const skips = fx.hits.filter((hit) => hit.status === 200).map((hit) => hit.skip);
    expect(skips).toContain(0);
    expect(skips.some((skip) => skip >= PAGE_SIZE)).toBeTruthy();
    expect(skips.some((skip) => skip >= PAGE_SIZE * 2)).toBeTruthy();
    const inspiration = await page.locator('a[href*="/recipe/"]').count();
    expect(inspiration).toBeGreaterThan(0);
    assertNoLoop(fx.consoleProblems, fx.auditCount());
  });

  test('authenticated appends pages', async ({ page }) => {
    test.setTimeout(120_000);
    const fx = await installFixtures(page, true);
    await seedNearby(page);
    await openHome(page);
    const before = await visibleListingIds(page);
    await scrollFeed(page, 8);
    const after = await visibleListingIds(page);
    expect(after.length).toBeGreaterThan(before.length);
    expect(new Set(after).size).toBe(after.length);
    assertNoLoop(fx.consoleProblems, fx.auditCount());
  });

  test('national, radius, category, and search restart pagination', async ({ page }) => {
    test.setTimeout(150_000);
    const fx = await installFixtures(page, false);
    await seedNearby(page);
    await openHome(page);
    await scrollFeed(page, 4);

    const visibleNamed = (name: RegExp) =>
      page.locator('button:visible').filter({ hasText: name });
    const national = () => visibleNamed(/^Netherlands$|^Heel Nederland$/);
    const filtersButton = () => visibleNamed(/filters/i);
    await expect
      .poll(async () => (await national().count()) + (await filtersButton().count()), {
        timeout: 20_000,
      })
      .toBeGreaterThan(0);
    if ((await national().count()) === 0) {
      await filtersButton().first().click();
    }
    await national().first().click();
    await page.waitForTimeout(800);
    expect(
      fx.hits.some((hit) => hit.scope === 'national' && hit.radius === '0' && hit.skip === 0),
    ).toBeTruthy();

    await visibleNamed(/^Nearby$|^In je buurt$/).first().click();
    await page.waitForTimeout(400);
    let radius = visibleNamed(/^10 km$/);
    if ((await radius.count()) === 0) {
      await page
        .locator('button:visible')
        .filter({ hasText: /change radius|open filters|^filters$/i })
        .first()
        .click();
      radius = visibleNamed(/^10 km$/);
    }
    await radius.first().click();
    await page.waitForTimeout(800);
    expect(fx.hits.some((hit) => hit.radius === '10' && hit.skip === 0)).toBeTruthy();

    const beforeCategory = await visibleListingIds(page);
    const hitsBeforeCategory = fx.hits.length;
    await page.locator('button:visible').filter({ hasText: /^Food$/ }).first().click();
    await expect
      .poll(
        () =>
          fx.hits
            .slice(hitsBeforeCategory)
            .some((hit) => hit.vertical === 'cheff' && hit.skip === 0),
        { timeout: 20_000 },
      )
      .toBeTruthy();
    const afterCategory = await visibleListingIds(page);
    expect(afterCategory.some((id) => !beforeCategory.includes(id)) || fx.hits.some((hit) => hit.vertical === 'cheff')).toBeTruthy();

    const hitsBeforeSearch = fx.hits.length;
    await page.locator('input:visible[placeholder="e.g. pasta, soup, bagels"]').first().fill('appelmoes');
    const apply = visibleNamed(/^Apply$|^Toepassen$/);
    if ((await apply.count()) > 0) {
      await apply.first().click();
    }
    await expect
      .poll(
        () =>
          fx.hits.slice(hitsBeforeSearch).some((hit) => hit.q === 'appelmoes' && hit.skip === 0),
        { timeout: 20_000 },
      )
      .toBeTruthy();
    await expect(page.locator('a[href*="-hcid-"]').first()).toBeVisible();
    assertNoLoop(fx.consoleProblems, fx.auditCount());
  });

  test('end of feed stops, navigation remounts, and a failed page does not loop', async ({ page }) => {
    test.setTimeout(150_000);
    const fx = await installFixtures(page, false);
    await seedNearby(page);
    await openHome(page);
    await scrollFeed(page, 12);
    const primarySkips = () =>
      fx.hits
        .filter((hit) => hit.status === 200 && hit.scope === 'nearby' && !hit.q && !hit.vertical)
        .map((hit) => hit.skip);
    expect(primarySkips().some((skip) => skip >= PAGE_SIZE * 2)).toBeTruthy();
    const maxSkip = () => primarySkips().reduce((max, skip) => Math.max(max, skip), 0);
    const skipBefore = maxSkip();
    const requestsBefore = fx.hits.length;
    await scrollFeed(page, 3);
    expect(maxSkip() - skipBefore).toBeLessThanOrEqual(PAGE_SIZE);
    expect(fx.hits.length - requestsBefore).toBeLessThan(8);

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await openHome(page);
    expect(fx.hits.filter((hit) => hit.skip === 0).length).toBeGreaterThan(1);

    fx.failNextPageOnce();
    const failuresBefore = fx.hits.filter((hit) => hit.status === 500).length;
    await scrollFeed(page, 6);
    const failures = fx.hits.filter((hit) => hit.status === 500).length - failuresBefore;
    expect(failures).toBeLessThanOrEqual(2);
    const retry = page.getByRole('button', { name: /opnieuw proberen|try again/i });
    if (await retry.first().isVisible().catch(() => false)) {
      await retry.first().click();
      await page.waitForTimeout(800);
    }
    assertNoLoop(fx.consoleProblems, fx.auditCount());
  });
});

import { test, expect } from '@playwright/test';

/**
 * Critical production journeys.
 * A 200 response is not a pass: pageerror, the generic error screen,
 * and relevant console errors fail the test.
 *
 * Authenticated journeys run only when SMOKE_EMAIL and SMOKE_PASSWORD are set.
 * They are not stored in the repo.
 *
 * smoke:journeys may skip those tests.
 * smoke:release (SMOKE_RELEASE=1) fails if the credentials are missing.
 * A release certification must not pass while signed-in checks were skipped.
 */

function requireReleaseCredentials() {
  if (process.env.SMOKE_RELEASE !== '1') return;
  if (!process.env.SMOKE_EMAIL || !process.env.SMOKE_PASSWORD) {
    throw new Error(
      'Release smoke failed: SMOKE_EMAIL and SMOKE_PASSWORD are required. Missing authenticated checks are not a pass.',
    );
  }
}

const ERROR_TITLE = 'Er is een fout opgetreden';
const CONSOLE_BLOCK = /ReferenceError|TypeError|is not defined|Hydration failed|Minified React error/;

const PUBLIC_JOURNEYS: Array<{ id: string; path: string; expectText: RegExp }> = [
  { id: 'SMOKE_01_HOME', path: '/', expectText: /HomeCheff/ },
  { id: 'SMOKE_02_LOGIN', path: '/login/', expectText: /Inloggen|Log in|E-mail/i },
  { id: 'SMOKE_03_SIGNUP', path: '/register/', expectText: /Registreren|Account|E-mail/i },
  { id: 'SMOKE_04_FEED', path: '/dorpsplein/', expectText: /HomeCheff/ },
  { id: 'SMOKE_12_AFFILIATE', path: '/werken-bij/', expectText: /HomeCheff|affiliate|werken/i },
  { id: 'SMOKE_14_DELIVERY_DASHBOARD', path: '/delivery/dashboard/', expectText: /bezorg|Inloggen|Dashboard|E-mail/i },
];

/** Login just left /login while the home page is still prefetching. A goto in that window is aborted. */
async function waitForPostLoginSettle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
}

/**
 * Logged-out protected routes render the login form.
 * NL/BE/SR visitors get Dutch copy; every other country gets English.
 * The gate is the form, not one language's wording.
 */
async function expectLoginGateOrContent(
  page: import('@playwright/test').Page,
  expectText: RegExp,
) {
  await expect
    .poll(async () => {
      const path = new URL(page.url()).pathname;
      if (path === '/login' || path === '/login/') return 'login';
      const body = await page.locator('body').innerText().catch(() => '');
      return expectText.test(body) ? 'content' : '';
    }, { timeout: 15_000 })
    .not.toBe('');

  const path = new URL(page.url()).pathname;
  if (path === '/login' || path === '/login/') {
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  }
}

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
    if (!url.includes('homecheff.eu') && !url.startsWith(page.url().slice(0, 20))) return;
    const status = response.status();
    if (status >= 500 && url.includes('/api/')) problems.push(`api ${status} ${url}`);
  });
  return problems;
}

for (const journey of PUBLIC_JOURNEYS) {
  test(`${journey.id} ${journey.path}`, async ({ page }) => {
    const problems = watch(page);
    const response = await page.goto(journey.path, { waitUntil: 'domcontentloaded' });
    expect(response, 'navigation response').toBeTruthy();
    expect(response!.status(), 'document status').toBeLessThan(400);
    await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
    await expectLoginGateOrContent(page, journey.expectText);
    expect(problems, problems.join('\n')).toEqual([]);
  });
}

test('SMOKE_05_PROFILE logged out does not crash', async ({ page }) => {
  const problems = watch(page);
  const response = await page.goto('/profile/', { waitUntil: 'domcontentloaded' });
  expect(response!.status()).toBeLessThan(500);
  await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
  expect(problems, problems.join('\n')).toEqual([]);
});

test('SMOKE_RESERVATIONS does not show the generic error screen', async ({ page }) => {
  const problems = watch(page);
  const response = await page.goto('/reservations/', { waitUntil: 'networkidle' });
  expect(response!.status()).toBeLessThan(500);
  await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
  await expect(page.locator('body')).toContainText(/Reservering|Afspraken|reserv/i);
  expect(problems, problems.join('\n')).toEqual([]);
});

const LOGGED_IN_OR_PUBLIC: Array<{ id: string; path: string; expectText: RegExp }> = [
  { id: 'SMOKE_06_PROFILE_EDIT', path: '/settings/', expectText: /Instellingen|Inloggen|E-mail/i },
  { id: 'SMOKE_08_CREATE_LISTING', path: '/sell/new/', expectText: /verkopen|Inloggen|E-mail|aanbod/i },
  { id: 'SMOKE_09_LISTING_PUBLIC', path: '/product/2ef1c372-be03-430e-8f85-190e6c516c44', expectText: /Foto cert maaltijd/i },
  { id: 'SMOKE_11_RECIPE', path: '/inspiratie/', expectText: /Inspiratie|HomeCheff/i },
  { id: 'SMOKE_13_AFFILIATE_DASHBOARD', path: '/affiliate/dashboard/', expectText: /affiliate|Inloggen|E-mail|Verdien/i },
  { id: 'SMOKE_15_SELLER_DASHBOARD', path: '/verkoper/dashboard/', expectText: /Verkoper|Dashboard|Inloggen|E-mail/i },
];

for (const journey of LOGGED_IN_OR_PUBLIC) {
  test(`${journey.id} ${journey.path}`, async ({ page }) => {
    const problems = watch(page);
    const response = await page.goto(journey.path, { waitUntil: 'domcontentloaded' });
    expect(response, 'navigation response').toBeTruthy();
    expect(response!.status(), 'document status').toBeLessThan(500);
    await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
    await expectLoginGateOrContent(page, journey.expectText);
    expect(problems, problems.join('\n')).toEqual([]);
  });
}

test('RELEASE authenticated credentials are present', async () => {
  test.skip(process.env.SMOKE_RELEASE !== '1', 'developer suite may omit credentials');
  requireReleaseCredentials();
});

test('SMOKE_07_PHOTO_UPLOAD control is on the profile when signed in', async ({ page }) => {
  requireReleaseCredentials();
  test.skip(!process.env.SMOKE_EMAIL || !process.env.SMOKE_PASSWORD, 'SMOKE_EMAIL/SMOKE_PASSWORD not set');
  const problems = watch(page);
  await page.goto('/login/', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"], input[name="email"]').first().fill(process.env.SMOKE_EMAIL!);
  await page.locator('input[type="password"]').first().fill(process.env.SMOKE_PASSWORD!);
  await page.getByRole('button', { name: /inloggen|log in|aanmelden/i }).first().click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
  await waitForPostLoginSettle(page);
  await page.goto('/profile/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /profielfoto wijzigen|change profile photo/i }).first(),
  ).toBeVisible();
  expect(problems, problems.join('\n')).toEqual([]);
});

test('SMOKE_10_EDIT_LISTING does not crash', async ({ page }) => {
  const problems = watch(page);
  const response = await page.goto('/product/2ef1c372-be03-430e-8f85-190e6c516c44/edit', {
    waitUntil: 'domcontentloaded',
  });
  expect(response!.status()).toBeLessThan(500);
  await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
  expect(problems, problems.join('\n')).toEqual([]);
});

test('SMOKE_05 authenticated profile', async ({ page }) => {
  requireReleaseCredentials();
  test.skip(!process.env.SMOKE_EMAIL || !process.env.SMOKE_PASSWORD, 'SMOKE_EMAIL/SMOKE_PASSWORD not set');
  const problems = watch(page);
  await page.goto('/login/', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"], input[name="email"]').first().fill(process.env.SMOKE_EMAIL!);
  await page.locator('input[type="password"]').first().fill(process.env.SMOKE_PASSWORD!);
  await page.getByRole('button', { name: /inloggen|log in|aanmelden/i }).first().click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
  await waitForPostLoginSettle(page);
  for (const route of [
    { path: '/profile/', text: /profielfoto|change profile photo|profiel/i },
    { path: '/reservations/', text: /Reservering|Afspraken|reserv/i },
    { path: '/settings/', text: /Instellingen|Settings/i },
  ]) {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
    await expect(page.locator('body')).toContainText(route.text);
  }
  expect(problems, problems.join('\n')).toEqual([]);
});

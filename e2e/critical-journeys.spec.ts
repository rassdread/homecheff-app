import { test, expect } from '@playwright/test';

/**
 * Critical production journeys.
 * A 200 response is not a pass: pageerror, the generic error screen,
 * and relevant console errors fail the test.
 *
 * Authenticated journeys run only when SMOKE_EMAIL and SMOKE_PASSWORD are set.
 * They are not stored in the repo.
 */

const ERROR_TITLE = 'Er is een fout opgetreden';
const CONSOLE_BLOCK = /ReferenceError|TypeError|is not defined|Hydration failed|Minified React error/;

const PUBLIC_JOURNEYS: Array<{ id: string; path: string; expectText: RegExp }> = [
  { id: 'SMOKE_01_HOME', path: '/', expectText: /HomeCheff/ },
  { id: 'SMOKE_02_LOGIN', path: '/login/', expectText: /Inloggen|Log in|E-mail/i },
  { id: 'SMOKE_03_SIGNUP', path: '/register/', expectText: /Registreren|Account|E-mail/i },
  { id: 'SMOKE_04_FEED', path: '/dorpsplein/', expectText: /HomeCheff/ },
  { id: 'SMOKE_12_AFFILIATE', path: '/werken-bij/', expectText: /HomeCheff|affiliate|werken/i },
  { id: 'SMOKE_14_DELIVERY_ENTRY', path: '/bezorger-worden/', expectText: /HomeCheff|bezorg/i },
];

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
    await expect(page.locator('body')).toContainText(journey.expectText);
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

test('SMOKE_05 authenticated profile', async ({ page }) => {
  test.skip(!process.env.SMOKE_EMAIL || !process.env.SMOKE_PASSWORD, 'SMOKE_EMAIL/SMOKE_PASSWORD not set');
  const problems = watch(page);
  await page.goto('/login/', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"], input[name="email"]').first().fill(process.env.SMOKE_EMAIL!);
  await page.locator('input[type="password"]').first().fill(process.env.SMOKE_PASSWORD!);
  await page.getByRole('button', { name: /inloggen|log in|aanmelden/i }).first().click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
  await page.goto('/profile/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
  await expect(page.locator('body')).toContainText(/Profielfoto|profiel/i);
  expect(problems, problems.join('\n')).toEqual([]);
});

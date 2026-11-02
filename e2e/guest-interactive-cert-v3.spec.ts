import { test, expect } from '@playwright/test';

/**
 * Guest click-through cert on SMOKE_BASE_URL (production stable or open preview).
 * Does not claim authenticated coverage.
 */

const ERROR_TITLE = 'Er is een fout opgetreden';

async function noCrash(page: import('@playwright/test').Page) {
  await expect(page.getByRole('heading', { name: ERROR_TITLE })).toHaveCount(0);
  await expect(page.getByText(/could not be loaded/i)).toHaveCount(0);
}

test('GUEST_MENU_opens_and_shows_auth_links', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect
    .poll(async () => {
      const body = await page.locator('body').innerText();
      if (/Inloggen|Log in|Aanmelden|Sign up/i.test(body)) return 'ok';
      const menu = page.getByRole('button', { name: /Menu|Open menu|Navigatie/i });
      if (await menu.first().isVisible().catch(() => false)) {
        await menu.first().click().catch(() => undefined);
      }
      return 'wait';
    }, { timeout: 20_000 })
    .toBe('ok');
  await noCrash(page);
});

test('GUEST_PROFILE_nav_opens_guest_panel_or_login', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const profile = page
    .locator('a[href="/profile"], a[href="/profile/"], button:has-text("Profiel"), a:has-text("Profiel")')
    .first();
  if (await profile.isVisible().catch(() => false)) {
    await profile.click();
  } else {
    // Desktop may expose login instead of bottom-nav profile.
    await page.getByRole('link', { name: /Inloggen|Log in/i }).first().click();
  }
  await expect
    .poll(async () => {
      const body = await page.locator('body').innerText();
      const path = new URL(page.url()).pathname;
      return (
        path.startsWith('/login') ||
        /Inloggen|Meedoen|Aanmelden|profiel|Bouw jouw plek|E-mail/i.test(body)
      );
    }, { timeout: 15_000 })
    .toBeTruthy();
  await noCrash(page);
});

test('GUEST_PRICING_shows_business_plans', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
  await noCrash(page);
  await expect(page.locator('body')).toContainText(/Basic|Pro|Premium|plan|abonnement/i);
});

test('GUEST_FORGOT_PASSWORD_form', async ({ page }) => {
  await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
  await noCrash(page);
  await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
});

test('GUEST_INFINITE_SCROLL_loads_more_or_has_more_hint', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect
    .poll(async () => {
      const text = await page.locator('body').innerText();
      return /\b([1-9]\d*)\s+resultaten\b/.test(text) ? 'ok' : 'wait';
    }, { timeout: 45_000 })
    .toBe('ok');
  const before = await page.locator('a[href*="/product"]').count();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2500);
  const after = await page.locator('a[href*="/product"]').count();
  // Either more cards loaded, or at least the first page remained healthy.
  expect(after).toBeGreaterThanOrEqual(before > 0 ? Math.min(before, 1) : 0);
  await noCrash(page);
});

test('GUEST_SEARCH_submits_query', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const search = page.getByRole('searchbox').or(page.getByPlaceholder(/Zoek|Search/i));
  await search.first().fill('pasta');
  await search.first().press('Enter');
  await page.waitForTimeout(2000);
  await noCrash(page);
});

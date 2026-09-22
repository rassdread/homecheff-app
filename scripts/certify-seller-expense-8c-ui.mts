#!/usr/bin/env npx tsx
/**
 * PHASE 8C §33 + §36 — production UI certification of the seller expense panel.
 *
 * Drives the real production UI at four viewports, creating one disposable
 * expense through the real form and removing it through the real delete button.
 * Every row it touches carries CERT_MARKER and cleanup is verified against the
 * database at the end.
 *
 *   npx tsx scripts/certify-seller-expense-8c-ui.mts
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from 'playwright';

function loadEnv(file: string) {
  const o: Record<string, string> = {};
  if (!fs.existsSync(file)) return o;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    o[m[1]!] = v;
  }
  return o;
}
const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v;

const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));
const HOST = process.env.PROD_URL || 'https://homecheff.eu';
const OUT = 'docs/audits/seller-expense-8c/ui-cert';
const CERT_MARKER = 'HC_8C_UI_CERT_DO_NOT_KEEP';

const { prisma } = await import('../lib/prisma');
// HomeCheff deliberately uses an unprefixed cookie name so native minting and
// middleware getToken stay aligned; reading it from source avoids guessing.
const { NEXTAUTH_SESSION_COOKIE_NAME } = await import('../lib/auth/session-cookie-name');

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail?: string) {
  if (ok) results.push(`  PASS  ${name}`);
  else {
    failures += 1;
    results.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function mintCookie(secret: string, userId: string, email: string) {
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: { token: Record<string, unknown>; secret: string; maxAge?: number }) => Promise<string>;
  };
  return encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret,
    maxAge: 900,
  });
}

const VIEWPORTS = [
  { name: 'desktop_1280x900', width: 1280, height: 900, scale: 1 },
  { name: 'mobile_390x844', width: 390, height: 844, scale: 1 },
  { name: 'landscape_844x390', width: 844, height: 390, scale: 1 },
  // 200% zoom modelled as CSS pixels halving at deviceScaleFactor 2, which is
  // what a browser zoom actually does to the layout viewport.
  { name: 'zoom_200', width: 640, height: 450, scale: 2 },
];

async function settle(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.setItem('privacy-notice-accepted', 'necessary');
    } catch {
      /* ignore */
    }
  }).catch(() => undefined);
}

async function main() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET required');

  const seller = await prisma.user.findFirst({
    where: { SellerProfile: { isNot: null } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  });
  if (!seller?.email) throw new Error('no seller account available');

  const token = await mintCookie(secret, seller.id, seller.email);
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const report: Record<string, any> = { host: HOST, viewports: {}, seller: seller.id };

  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.scale,
        locale: 'nl-NL',
      });
      await context.addCookies([
        {
          name: NEXTAUTH_SESSION_COOKIE_NAME,
          value: token,
          domain: new URL(HOST).hostname,
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
        },
      ]);
      const page = await context.newPage();
      await page.goto(`${HOST}/verdiensten`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await settle(page);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => undefined);
      await page.waitForTimeout(3000);

      const panel = page.locator('section[aria-labelledby="hc-expense-heading"]');
      const visible = await panel.isVisible().catch(() => false);
      check(`${vp.name}_PANEL_RENDERS`, visible);

      if (!visible) {
        await page.screenshot({ path: path.join(OUT, `${vp.name}-missing.png`), fullPage: true });
        await context.close();
        continue;
      }

      // No horizontal overflow at any viewport.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      check(`${vp.name}_NO_HORIZONTAL_OVERFLOW`, overflow <= 1, `overflow ${overflow}px`);

      await panel.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(OUT, `${vp.name}-panel.png`), fullPage: true });

      // The result must never be labelled as taxable profit.
      const text = await panel.innerText();
      check(
        `${vp.name}_NO_FALSE_TAX_CLAIM`,
        !/belastbare winst|belastbaar inkomen/i.test(text),
        'the partial result must not be presented as taxable profit',
      );
      check(
        `${vp.name}_DISCLOSES_INCOMPLETENESS`,
        /geen belastingaangifte|buiten HomeCheff/i.test(text),
      );

      // Open the dialog and verify its semantics and usability.
      await page.getByRole('button', { name: /Kosten toevoegen/i }).first().click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ state: 'visible', timeout: 15_000 });
      check(`${vp.name}_DIALOG_SEMANTICS`, await dialog.getAttribute('aria-modal') === 'true');
      check(
        `${vp.name}_DIALOG_LABELLED`,
        (await dialog.getAttribute('aria-labelledby')) === 'hc-expense-dialog-title',
      );

      // Every field is reachable and labelled.
      for (const id of ['hc-exp-what', 'hc-exp-amount', 'hc-exp-date', 'hc-exp-category']) {
        const labelled = await page.evaluate((fieldId) => {
          const el = document.getElementById(fieldId);
          if (!el) return false;
          return !!document.querySelector(`label[for="${fieldId}"]`);
        }, id);
        check(`${vp.name}_LABEL_${id}`, labelled);
      }

      // The dialog itself must not overflow horizontally on small screens.
      const dialogOverflow = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]') as HTMLElement | null;
        return d ? d.scrollWidth - d.clientWidth : 0;
      });
      check(`${vp.name}_DIALOG_NO_OVERFLOW`, dialogOverflow <= 1, `${dialogOverflow}px`);

      // Save must be genuinely clickable, not merely present: scroll it into
      // view, then ask the browser what is actually at its centre point. The
      // bottom navigation sits at z-[65] and will answer here if it overlaps.
      const save = dialog.getByRole('button', { name: 'Opslaan' });
      await save.scrollIntoViewIfNeeded().catch(() => undefined);
      const saveBox = await save.boundingBox();
      const occlusion = saveBox
        ? await page.evaluate(
            ({ x, y }) => {
              const el = document.elementFromPoint(x, y);
              if (!el) return 'NOTHING_AT_POINT';
              const btn = el.closest('button');
              if (btn && /Opslaan/.test(btn.textContent ?? '')) return null;
              const blocker = (el.closest('nav,[role="navigation"],header,footer') ??
                el) as HTMLElement;
              return `${blocker.tagName}.${blocker.className?.toString().slice(0, 60)}`;
            },
            { x: saveBox.x + saveBox.width / 2, y: saveBox.y + saveBox.height / 2 },
          )
        : 'NO_BOX';
      check(
        `${vp.name}_SAVE_REACHABLE_NOT_OCCLUDED`,
        occlusion === null,
        occlusion ? `covered by ${occlusion}` : undefined,
      );

      await page.screenshot({ path: path.join(OUT, `${vp.name}-dialog.png`), fullPage: false });

      // Keyboard: Escape closes.
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      check(`${vp.name}_ESCAPE_CLOSES_DIALOG`, !(await dialog.isVisible().catch(() => false)));

      report.viewports[vp.name] = { overflow, dialogOverflow };
      await context.close();
    }

    // --- One real round trip through the UI on desktop --------------------
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      locale: 'nl-NL',
    });
    await context.addCookies([
      {
        name: NEXTAUTH_SESSION_COOKIE_NAME,
        value: token,
        domain: new URL(HOST).hostname,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ]);
    const page = await context.newPage();
    await page.goto(`${HOST}/verdiensten`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await settle(page);
    // domcontentloaded, not networkidle: this page keeps long-lived connections
    // open, so networkidle stalls for its full timeout and leaves the app in a
    // state where the form no longer submits.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => undefined);
    await page.waitForTimeout(3000);

    // Status is recorded synchronously. Awaiting the body first would push to
    // this array after the assertion has already read it.
    const apiCalls: Array<{ method: string; status: number }> = [];
    page.on('response', (res) => {
      if (!res.url().includes('/api/seller/expenses')) return;
      const method = res.request().method();
      if (method === 'GET') return;
      apiCalls.push({ method, status: res.status() });
    });

    await page.getByRole('button', { name: /Kosten toevoegen/i }).first().click();
    const formDialog = page.getByRole('dialog');
    await formDialog.waitFor({ state: 'visible', timeout: 15_000 });
    await page.fill('#hc-exp-what', 'UI CERT verpakking');
    await page.fill('#hc-exp-amount', '12,34');
    await page.fill('#hc-exp-date', '2026-05-20');
    await page.selectOption('#hc-exp-category', 'PACKAGING');
    await page.fill('#hc-exp-notes', CERT_MARKER);
    await page.selectOption('#hc-exp-treatment', 'ORDINARY_EXPENSE');
    // Scope to the dialog: /verdiensten carries other checkboxes and buttons,
    // and an unscoped locator silently clicked one of them.
    await formDialog.getByRole('checkbox').first().check();
    const saveButton = formDialog.getByRole('button', { name: 'Opslaan' });
    check('UI_SAVE_BUTTON_IS_IN_DIALOG', (await saveButton.count()) === 1, `count=${await saveButton.count()}`);
    const postResponse = page.waitForResponse(
      (r) => r.url().includes('/api/seller/expenses') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await saveButton.click();
    await postResponse.catch(() => undefined);
    await page.waitForTimeout(3000);

    const formErrors = await formDialog
      .locator('[role="alert"]')
      .allInnerTexts()
      .catch(() => [] as string[]);
    report.createApiCalls = apiCalls;
    report.createFormErrors = formErrors;
    check(
      'UI_CREATE_NO_FORM_ERROR',
      formErrors.length === 0,
      formErrors.join(' | ') || undefined,
    );
    check(
      'UI_CREATE_API_ACCEPTED',
      apiCalls.some((c) => c.method === 'POST' && c.status === 201),
      JSON.stringify(apiCalls).slice(0, 300),
    );

    const created = await prisma.sellerExpense.findFirst({
      where: { notes: CERT_MARKER },
      select: { id: true, amountCents: true, taxYear: true, category: true, source: true, confirmationStatus: true },
    });
    check('UI_CREATE_PERSISTED', !!created);
    check('UI_CREATE_EXACT_CENTS', created?.amountCents === 1_234, `got ${created?.amountCents}`);
    check('UI_CREATE_YEAR_FROM_DATE', created?.taxYear === 2026);
    check('UI_CREATE_CATEGORY', created?.category === 'PACKAGING');
    check('UI_CREATE_SOURCE_IS_USER_PROVIDED', created?.source === 'USER_PROVIDED');
    check('UI_CREATE_CONFIRMED', created?.confirmationStatus === 'CONFIRMED');

    // The new row must appear in the list surface.
    const listText = await page.locator('section[aria-labelledby="hc-expense-heading"]').innerText();
    check('UI_ROW_VISIBLE_IN_PANEL', /UI CERT verpakking|€\s?12,34/.test(listText), listText.slice(0, 200));
    await page.screenshot({ path: path.join(OUT, 'desktop-with-expense.png'), fullPage: true });

    // Delete it through the real button.
    const deleteResponse = page.waitForResponse(
      (r) => r.url().includes('/api/seller/expenses/') && r.request().method() === 'DELETE',
      { timeout: 30_000 },
    );
    page.once('dialog', (d) => d.accept());
    await page
      .locator('section[aria-labelledby="hc-expense-heading"]')
      .getByRole('button', { name: /Verwijderen/i })
      .first()
      .click();
    await deleteResponse.catch(() => undefined);
    await page.waitForTimeout(3000);

    const afterUiDelete = await prisma.sellerExpense.findFirst({
      where: { notes: CERT_MARKER },
      select: { deletedAt: true },
    });
    check('UI_DELETE_SOFT_DELETES', afterUiDelete?.deletedAt != null);
    await page.screenshot({ path: path.join(OUT, 'desktop-after-delete.png'), fullPage: true });

    await context.close();
  } finally {
    await browser.close();
    // Cleanup: hard delete everything this run created, then verify.
    const removed = await prisma.sellerExpense.deleteMany({ where: { notes: CERT_MARKER } });
    const residue = await prisma.sellerExpense.count({ where: { notes: CERT_MARKER } });
    const total = await prisma.sellerExpense.count();
    check('UI_CLEANUP_REMOVED', removed.count >= 1);
    check('UI_CLEANUP_VERIFIED', residue === 0);
    check('UI_CLEANUP_TABLE_EMPTY', total === 0, `${total} rows remain`);

    report.checks = results;
    report.failures = failures;
    report.verdict = failures === 0 ? 'UI_CERTIFIED' : 'UI_FAILED';
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`\nPHASE 8C UI certification — ${results.length} checks, ${failures} failed\n`);
    console.log(results.join('\n'));
    if (failures > 0) process.exitCode = 1;
    await prisma.$disconnect();
  }
}

await main();

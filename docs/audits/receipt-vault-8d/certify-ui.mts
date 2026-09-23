/**
 * PHASE 8D §29, §33, §34 — the receipt vault as a seller actually meets it.
 *
 * Runs against production in a real browser: attach, view, close, delete, at
 * four viewports, plus the account-switch test that proves a cached receipt
 * does not survive a change of user.
 *
 * Hit-testing is done with elementFromPoint rather than bounding boxes,
 * because Phase 8C's bottom-nav defect was invisible to a box check — the
 * button was where it claimed to be, the nav was simply on top of it.
 *
 *   npx tsx docs/audits/receipt-vault-8d/certify-ui.mts
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium, type Page, type BrowserContext } from 'playwright';

const require = createRequire(import.meta.url);
const HOST = process.env.PROD_URL || 'https://homecheff.eu';
const OUT = path.join(process.cwd(), 'docs/audits/receipt-vault-8d/ui');
const CERT_MARKER = 'HC_8D_UI_CERT_DO_NOT_KEEP';

const { prisma } = await import('../../../lib/prisma');
const { NEXTAUTH_SESSION_COOKIE_NAME } = await import('../../../lib/auth/session-cookie-name');
const { makeJpegWithMetadata, makePdf } = await import('../../../scripts/evidence-sample-files');

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail?: string) {
  if (ok) results.push(`  PASS  ${name}`);
  else {
    failures += 1;
    results.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function mintCookie(userId: string, email: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET required');
  const { encode } = require('next-auth/jwt') as {
    encode: (p: { token: Record<string, unknown>; secret: string; maxAge?: number }) => Promise<string>;
  };
  return encode({ token: { sub: userId, email, id: userId, name: email.split('@')[0] }, secret, maxAge: 1800 });
}

async function addSession(context: BrowserContext, token: string) {
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
}

const VIEWPORTS = [
  { name: 'desktop_1280x900', width: 1280, height: 900, scale: 1 },
  { name: 'mobile_390x844', width: 390, height: 844, scale: 1 },
  { name: 'landscape_844x390', width: 844, height: 390, scale: 1 },
  { name: 'zoom_200', width: 640, height: 450, scale: 2 },
];

async function settle(page: Page) {
  await page
    .evaluate(() => {
      try {
        localStorage.setItem('privacy-notice-accepted', 'necessary');
      } catch {
        /* ignore */
      }
    })
    .catch(() => undefined);
}

/** True when the element really receives the click at its own centre. */
async function isTopmostAtCentre(page: Page, selector: string): Promise<{ ok: boolean; blocker: string }> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return { ok: false, blocker: 'missing' };
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (y < 0 || y > window.innerHeight) return { ok: false, blocker: 'offscreen' };
    const hit = document.elementFromPoint(x, y);
    if (!hit) return { ok: false, blocker: 'nothing' };
    if (el.contains(hit) || hit.contains(el)) return { ok: true, blocker: '' };
    const blocker = (hit as HTMLElement).closest('[data-hc-bottom-nav],[data-hc-bottom-nav-shell],nav');
    return { ok: false, blocker: blocker ? 'bottom-nav' : (hit as HTMLElement).tagName.toLowerCase() };
  }, selector);
}

async function main() {
  const [sellerA, sellerB] = await prisma.user.findMany({
    where: { SellerProfile: { isNot: null } },
    orderBy: { createdAt: 'asc' },
    take: 2,
    select: { id: true, email: true },
  });
  if (!sellerA?.email || !sellerB?.email) throw new Error('need two seller accounts');

  const tokenA = await mintCookie(sellerA.id, sellerA.email);
  const tokenB = await mintCookie(sellerB.id, sellerB.email);
  fs.mkdirSync(OUT, { recursive: true });

  // One expense for the whole run, made directly so the UI run starts from a
  // known state rather than depending on the create dialog.
  const expense = await prisma.sellerExpense.create({
    data: {
      sellerUserId: sellerA.id,
      expenseDate: new Date(Date.UTC(2026, 4, 12)),
      taxYear: 2026,
      amountCents: 4200,
      currency: 'EUR',
      category: 'MATERIALS',
      description: `${CERT_MARKER} synthetic`,
      notes: CERT_MARKER,
      source: 'USER_PROVIDED',
      fiscalTreatment: 'UNKNOWN',
      confirmationStatus: 'DRAFT',
    },
    select: { id: true },
  });

  const browser = await chromium.launch();
  const createdEvidenceIds: string[] = [];
  const report: Record<string, unknown> = { host: HOST, expenseId: expense.id, viewports: {} };

  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.scale,
        locale: 'nl-NL',
      });
      await addSession(context, tokenA);
      const page = await context.newPage();
      let listRequests = 0;
      const contentResponses: string[] = [];
      page.on('request', (req) => {
        if (req.method() === 'GET' && req.url().includes('/api/seller/evidence?expenseId=')) listRequests += 1;
      });
      page.on('response', (res) => {
        if (res.url().includes('/content')) contentResponses.push(String(res.status()));
      });
      page.on('requestfailed', (req) => {
        if (req.url().includes('/content')) contentResponses.push(`failed:${req.failure()?.errorText}`);
      });
      await page.goto(`${HOST}/verdiensten`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await settle(page);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => undefined);
      await page.waitForTimeout(3500);

      // Open the expense list, then the row holding our certification expense.
      const listToggle = page.locator('[aria-controls="hc-expense-list"]').first();
      await listToggle.waitFor({ state: 'visible', timeout: 25_000 }).catch(() => undefined);
      if (await listToggle.isVisible().catch(() => false)) {
        if ((await listToggle.getAttribute('aria-expanded')) !== 'true') await listToggle.click();
        await page.waitForTimeout(1200);
      }
      const row = page.getByRole('button', { name: new RegExp(CERT_MARKER) }).first();
      await row.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
      const rowVisible = await row.isVisible().catch(() => false);
      check(`${vp.name}_EXPENSE_ROW_VISIBLE`, rowVisible);
      if (!rowVisible) {
        await page.screenshot({ path: path.join(OUT, `${vp.name}-no-row.png`), fullPage: true });
        await context.close();
        continue;
      }
      await row.scrollIntoViewIfNeeded();
      if ((await row.getAttribute('aria-expanded')) !== 'true') await row.click();
      await page.waitForTimeout(1200);

      // --- the evidence panel itself ---------------------------------------
      const panel = page.locator('[data-hc-evidence-panel]').first();
      await panel.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
      const addLabel = panel.locator('label:has(input[type="file"])').first();
      await addLabel.scrollIntoViewIfNeeded();
      check(`${vp.name}_ADD_CONTROL_VISIBLE`, await addLabel.isVisible().catch(() => false));

      // §33: the control must actually be clickable, not merely present.
      //
      // Two separate questions. First, the keyboard path: focusing the input is
      // what a seller tabbing through the form does, and the browser's scroll
      // must not leave the control under a fixed bar. Second, operability at
      // all: brought to the middle of the viewport, nothing may sit on top.
      await panel.locator('input[type="file"]').first().focus().catch(() => undefined);
      await page.waitForTimeout(700);
      const afterFocus = await isTopmostAtCentre(page, '[data-hc-evidence-panel] label:has(input[type="file"])');
      check(`${vp.name}_ADD_NOT_COVERED_AFTER_FOCUS`, afterFocus.ok, `blocked by ${afterFocus.blocker}`);

      await page.evaluate(() => {
        document
          .querySelector('[data-hc-evidence-panel] label:has(input[type="file"])')
          ?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
      await page.waitForTimeout(700);
      const centred = await isTopmostAtCentre(page, '[data-hc-evidence-panel] label:has(input[type="file"])');
      check(`${vp.name}_ADD_OPERABLE`, centred.ok, `blocked by ${centred.blocker}`);

      // The size limit is stated before the seller picks anything (§8).
      const panelText = await panel.innerText();
      check(`${vp.name}_LIMIT_SHOWN_BEFORE_UPLOAD`, /MB/.test(panelText), panelText.slice(0, 120));
      check(
        `${vp.name}_NO_VERIFIED_CLAIM`,
        !/geverifieerd|gecontroleerd door homecheff|verified by/i.test(panelText),
        'panel must not claim HomeCheff checked the receipt',
      );

      // The file input accepts camera capture on mobile browsers (§13).
      const accept = await panel.locator('input[type="file"]').first().getAttribute('accept');
      check(`${vp.name}_ACCEPT_TYPES`, accept === 'image/jpeg,image/png,image/webp,application/pdf', String(accept));

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      check(`${vp.name}_NO_HORIZONTAL_OVERFLOW`, overflow <= 1, `${overflow}px`);

      // --- upload through the real input -------------------------------------
      await panel.locator('input[type="file"]').first().setInputFiles({
        name: 'bonnetje.jpg',
        mimeType: 'image/jpeg',
        buffer: makeJpegWithMetadata(),
      });
      await page.waitForTimeout(4000);

      // The panel has its own live region; the page has several others, so the
      // announcement is read from inside the panel rather than page-wide.
      const added = await panel.locator('[role="status"]').first().innerText().catch(() => '');
      check(`${vp.name}_UPLOAD_ANNOUNCED`, /toegevoegd/i.test(added), added.slice(0, 80));

      // The request count is the loop guard: one list fetch per open, plus one
      // refresh after the upload. Anything near double digits is a render loop.
      check(`${vp.name}_NO_REFETCH_LOOP`, listRequests <= 6, `${listRequests} list requests`);

      await page.screenshot({ path: path.join(OUT, `${vp.name}-attached.png`), fullPage: true });

      // --- viewer: dialog semantics, close control, keyboard (§34) -----------
      const viewBtn = panel.getByRole('button', { name: /^Bekijken$/ }).first();
      await viewBtn.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
      if (await viewBtn.isVisible().catch(() => false)) {
        await viewBtn.click();
        // The viewer specifically, not whatever other dialog the page may hold.
        const dialog = page.locator('[data-hc-evidence-viewer] [role="dialog"]').first();
        await dialog.waitFor({ state: 'visible', timeout: 15_000 });
        check(`${vp.name}_VIEWER_MODAL`, (await dialog.getAttribute('aria-modal')) === 'true');
        check(`${vp.name}_VIEWER_LABELLED`, Boolean(await dialog.getAttribute('aria-label')));

        // Focus lands on the close button, and the close button is reachable.
        const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
        check(`${vp.name}_VIEWER_FOCUS_ON_CLOSE`, /sluiten/i.test(focused), focused);
        const closeHit = await isTopmostAtCentre(page, '[data-hc-evidence-viewer] [role="dialog"] button[aria-label]');
        check(`${vp.name}_VIEWER_CLOSE_NOT_COVERED`, closeHit.ok, `blocked by ${closeHit.blocker}`);

        // The image really rendered — a broken private fetch would stay 0x0.
        // Polled rather than slept on: the first read of a cold object can take
        // several seconds, and a fixed wait would only measure the delay.
        const dims = await page
          .waitForFunction(
            () => {
              // Any dialog may match the selector, so look for the image across
              // all of them rather than trusting document order.
              const imgs = Array.from(
                document.querySelectorAll<HTMLImageElement>('[data-hc-evidence-viewer] img'),
              ).filter((i) => (i.getAttribute('src') ?? '').includes('/api/seller/evidence/'));
              const img = imgs.find((i) => i.complete && i.naturalWidth > 0);
              if (!img) return null;
              return { w: img.naturalWidth, h: img.naturalHeight, done: true };
            },
            undefined,
            { timeout: 25_000, polling: 400 },
          )
          .then((h) => h.jsonValue() as Promise<{ w: number; h: number; done: boolean }>)
          .catch(() => ({ w: 0, h: 0, done: false }));
        check(
          `${vp.name}_VIEWER_IMAGE_LOADED`,
          dims.w > 0 && dims.h > 0,
          `${JSON.stringify(dims)} content responses: [${contentResponses.join(', ')}]`,
        );
        await page.screenshot({ path: path.join(OUT, `${vp.name}-viewer.png`) });

        // No vault address anywhere in the page or the address bar (§28).
        // The public store legitimately appears here — it serves profile and
        // listing images — so the check targets the private store, the object
        // keys and any token, not the storage domain as a whole.
        const html = await page.content();
        const objectKeys = (
          await prisma.sellerFinancialEvidence.findMany({
            where: { linkedExpenseId: expense.id },
            select: { objectKey: true },
          })
        ).map((r) => r.objectKey);
        const leaked = [
          /\.private\.blob\.vercel-storage\.com/.test(html) ? 'private-store-host' : '',
          /vercel_blob_rw/.test(html) ? 'blob-token' : '',
          ...objectKeys.filter((k) => html.includes(k)).map(() => 'object-key'),
        ].filter(Boolean);
        check(`${vp.name}_NO_STORAGE_URL_IN_PAGE`, leaked.length === 0, leaked.join(', '));
        check(`${vp.name}_NO_SECRET_IN_LOCATION`, !/token|blob|ev%2F|ev\//i.test(page.url()), page.url());

        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);
        check(`${vp.name}_VIEWER_ESC_CLOSES`, !(await dialog.isVisible().catch(() => false)));
      } else {
        check(`${vp.name}_VIEWER_AVAILABLE`, false, 'no Bekijken button');
      }

      report.viewports = { ...(report.viewports as object), [vp.name]: { overflow, accept } };
      await context.close();
    }

    // Collect what the viewport loop created so cleanup is exact.
    const rows = await prisma.sellerFinancialEvidence.findMany({
      where: { linkedExpenseId: expense.id },
      select: { id: true },
    });
    createdEvidenceIds.push(...rows.map((r) => r.id));
    check('MULTIPLE_FILES_ACCUMULATED', rows.length >= 2, `${rows.length} items`);

    // --- §29 account switch -------------------------------------------------
    // A views a receipt, then B takes over the very same browser context.
    const target = rows[0];
    if (target) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'nl-NL' });
      await addSession(context, tokenA);
      const page = await context.newPage();
      const asA = await page.goto(`${HOST}/api/seller/evidence/${target.id}/content`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      check('SWITCH_A_CAN_VIEW', asA?.status() === 200, `status ${asA?.status()}`);
      const cc = asA?.headers()['cache-control'] ?? '';
      check('SWITCH_RESPONSE_NOT_CACHEABLE', /no-store/.test(cc) && /private/.test(cc), cc);

      // Log out, log in as B, ask for the same address again.
      await context.clearCookies();
      await addSession(context, tokenB);
      const asB = await page.goto(`${HOST}/api/seller/evidence/${target.id}/content`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      check('SWITCH_B_BLOCKED', asB?.status() === 404, `status ${asB?.status()}`);

      // And through history, which is where a cached body would surface.
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined);
      const afterBack = await page.evaluate(() => document.body?.innerText?.slice(0, 200) ?? '');
      const backStatus = await page.evaluate(async (url) => {
        const r = await fetch(url, { cache: 'force-cache' });
        return r.status;
      }, `${HOST}/api/seller/evidence/${target.id}/content`);
      check('SWITCH_B_BLOCKED_VIA_CACHE', backStatus === 404, `forced-cache status ${backStatus}`);
      report.afterBack = afterBack.slice(0, 120);
      await context.close();
    }
  } finally {
    // --- cleanup ------------------------------------------------------------
    const rows = await prisma.sellerFinancialEvidence.findMany({
      where: { OR: [{ id: { in: createdEvidenceIds } }, { linkedExpenseId: expense.id }] },
      select: { id: true, objectKey: true },
    });
    const { deleteVaultObjectsByKey } = await import('../../../lib/finance/evidence/evidence.server');
    await deleteVaultObjectsByKey(rows.map((r) => r.objectKey)).catch(() => 0);
    await prisma.sellerFinancialEvidence.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
    await prisma.sellerExpense.deleteMany({ where: { notes: { contains: CERT_MARKER } } });

    const residue =
      (await prisma.sellerExpense.count({ where: { notes: { contains: CERT_MARKER } } })) +
      (await prisma.sellerFinancialEvidence.count({ where: { id: { in: rows.map((r) => r.id) } } }));
    check('UI_CLEANUP_NO_RESIDUE', residue === 0, `${residue} left`);

    await browser.close().catch(() => undefined);
    report.results = results;
    report.failures = failures;
    fs.writeFileSync(path.join(OUT, 'ui-cert.json'), JSON.stringify(report, null, 2));
    console.log(`\nPHASE 8D UI CERTIFICATION — ${HOST}`);
    console.log(results.join('\n'));
    console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
    await prisma.$disconnect();
    process.exit(failures === 0 ? 0 : 1);
  }
}

void main();

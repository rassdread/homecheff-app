/**
 * Production certification: partner invitation commercial explanation.
 * Copy and UX only. No commission ledger, no Stripe charge.
 *
 * npx tsx --env-file=.env.local scripts/certify-partner-commercial-explanation.ts
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { chromium, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { disposeTempCertificationUsers } from '../lib/certification/dispose-temp-fixtures';

const BASE = 'https://homecheff.eu';
const SUFFIX = randomBytes(3).toString('hex');
const PASSWORD = `ExplainCert${SUFFIX}9!`;
const ARTIFACT = path.join(
  process.cwd(),
  'docs/audits/partner-commercial-explanation-cert',
  `run-${Date.now()}`,
);
mkdirSync(ARTIFACT, { recursive: true });

const prisma = new PrismaClient();
const createdUserIds: string[] = [];
const results: Record<string, string> = {};

function set(key: string, value: string) {
  results[key] = value;
  console.log(`${value.startsWith('FAIL') ? '❌' : '✅'} ${key}=${value}`);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(ARTIFACT, `${name}.png`), fullPage: true });
}

async function overflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1;
  });
}

async function createMain(email: string) {
  const id = randomUUID();
  const hash = await bcrypt.hash(PASSWORD, 10);
  await prisma.user.create({
    data: {
      id,
      email,
      username: `pxmain${SUFFIX}`.slice(0, 20),
      name: 'Cert Main',
      passwordHash: hash,
      emailVerified: new Date(),
      role: 'BUYER',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      affiliate: {
        create: {
          status: 'ACTIVE',
          parentAffiliateId: null,
          referralLinks: {
            create: {
              code: `PX${id.slice(0, 8).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`,
            },
          },
        },
      },
    },
  });
  createdUserIds.push(id);
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Inloggen', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 });
}

function attachConsole(page: Page, bucket: string[]) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') bucket.push(msg.text());
  });
  page.on('pageerror', (err) => bucket.push(err.message));
}

async function main() {
  const consoleErrors: string[] = [];
  const mainEmail = `px.main.${SUFFIX}@homecheff.invalid`;
  const inviteEmail = `px.invite.${SUFFIX}@homecheff.invalid`;
  await createMain(mainEmail);

  const browser = await chromium.launch({ headless: true });
  let finished = false;
  try {
    const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await desktop.newPage();
    attachConsole(page, consoleErrors);
    await login(page, mainEmail);

    await page.goto(`${BASE}/affiliate/partners?invite=1`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.getByText('40% van de platformfee', { exact: true }).waitFor({ timeout: 20000 });
    const mainText = await page.locator('body').innerText();
    const mainOk =
      mainText.includes('Nodig een partner uit') &&
      mainText.includes('40% van de platformfee') &&
      mainText.includes('niet over het volledige aankoopbedrag') &&
      mainText.includes('Partner uitnodigen');
    set('MAIN_INVITE_EXPLANATION', mainOk ? 'PASS' : 'FAIL');
    const desktopFit = await overflow(page);
    await shot(page, 'desktop-invite');
    set('DESKTOP', desktopFit && mainOk ? 'PASS' : 'FAIL');

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobile.newPage();
    attachConsole(mobilePage, consoleErrors);
    await login(mobilePage, mainEmail);
    await mobilePage.goto(`${BASE}/affiliate/partners?invite=1`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await mobilePage.getByText('40% van de platformfee', { exact: true }).waitFor({ timeout: 20000 });
    const mobileFit = await overflow(mobilePage);
    const mobileText = await mobilePage.locator('body').innerText();
    await shot(mobilePage, 'mobile-invite');
    set(
      'MOBILE',
      mobileFit && mobileText.includes('40% van de platformfee') && mobileText.includes('niet over het volledige aankoopbedrag')
        ? 'PASS'
        : 'FAIL',
    );

    const inviteRes = await page.request.post(`${BASE}/api/affiliate/create-sub`, {
      data: { email: inviteEmail, name: 'Cert Partner', locale: 'nl' },
    });
    const inviteJson = await inviteRes.json();
    const emailText = String(inviteJson?.invite?.emailText || '');
    const emailSubject = String(inviteJson?.invite?.emailSubject || '');
    const link = String(inviteJson?.invite?.inviteLink || '');
    const emailOk =
      inviteRes.ok() &&
      emailSubject.includes('Affiliate Partner') &&
      emailText.includes('40% van de toepasselijke HomeCheff-platformfee') &&
      emailText.includes('niet over het volledige aankoopbedrag') &&
      emailText.includes('Bekijk je uitnodiging') &&
      !emailText.includes('10%');
    set('INVITATION_EMAIL_UPDATED', emailOk ? 'PASS' : `FAIL:${inviteRes.status()}`);
    writeFileSync(path.join(ARTIFACT, 'email.txt'), `${emailSubject}\n\n${emailText}`);

    const guest = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const guestPage = await guest.newPage();
    attachConsole(guestPage, consoleErrors);
    await guestPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await guestPage.getByText('40% van de platformfee', { exact: true }).waitFor({ timeout: 20000 });
    const partnerText = await guestPage.locator('body').innerText();
    const partnerOk =
      partnerText.includes('Word Affiliate Partner van HomeCheff') &&
      partnerText.includes('Cert Main') &&
      partnerText.includes('40% van de platformfee') &&
      partnerText.includes('niet over het volledige aankoopbedrag') &&
      partnerText.includes('€100') &&
      partnerText.includes('€20') &&
      partnerText.includes('€8') &&
      partnerText.includes('kan per product') &&
      partnerText.includes('Hoe werkt het?') &&
      partnerText.includes('Deel HomeCheff') &&
      !partnerText.includes('10%') &&
      !/downline|upline|MLM/i.test(partnerText);
    set('PARTNER_ACCEPTANCE_EXPLANATION', partnerOk ? 'PASS' : 'FAIL');
    set('PARTNER_40_PERCENT_VISIBLE', partnerText.includes('40% van de platformfee') ? 'PASS' : 'FAIL');
    set('PLATFORM_FEE_EXPLICIT', partnerText.includes('platformfee') ? 'PASS' : 'FAIL');
    set(
      'NOT_ORDER_VALUE_EXPLICIT',
      partnerText.includes('niet over het volledige aankoopbedrag') ? 'PASS' : 'FAIL',
    );
    set('CALCULATION_EXAMPLE', partnerText.includes('€100') && partnerText.includes('€8') ? 'PASS' : 'FAIL');
    set('HOW_IT_WORKS', partnerText.includes('Hoe werkt het?') && partnerText.includes('Deel HomeCheff') ? 'PASS' : 'FAIL');
    set('MAIN_10_NOT_PROMINENT_TO_PARTNER', partnerText.includes('10%') ? 'FAIL' : 'PASS');
    set('NL_COPY', partnerOk ? 'PASS' : 'FAIL');

    const loginLink = guestPage.getByRole('link', { name: 'Inloggen' });
    const loginHref = await loginLink.getAttribute('href');
    const registerHref = await guestPage.getByRole('link', { name: 'Account Aanmaken' }).getAttribute('href');
    const ctaOk = Boolean(loginHref?.includes('/login') && registerHref?.includes('inviteToken'));
    set('PARTNER_CTA', ctaOk ? 'PASS' : 'FAIL');
    await shot(guestPage, 'desktop-accept');
    await loginLink.click();
    await guestPage.waitForURL((url) => url.pathname.startsWith('/login'), { timeout: 20000 });
    set('PARTNER_CTA_NAVIGATION', guestPage.url().includes('/login') ? 'PASS' : 'FAIL');

    const mobileGuest = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobileAccept = await mobileGuest.newPage();
    attachConsole(mobileAccept, consoleErrors);
    await mobileAccept.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await mobileAccept.getByText('40% van de platformfee', { exact: true }).waitFor({ timeout: 20000 });
    const mobileAcceptFit = await overflow(mobileAccept);
    await shot(mobileAccept, 'mobile-accept');
    if (!mobileAcceptFit) set('MOBILE', 'FAIL');

    const enGuest = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await enGuest.addCookies([
      { name: 'hc_locale', value: 'en', url: BASE },
      { name: 'hc_locale_pref', value: '1', url: BASE },
      { name: 'homecheff-language', value: 'en', url: BASE },
    ]);
    const enPage = await enGuest.newPage();
    attachConsole(enPage, consoleErrors);
    await enPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await enPage.getByText('40% of the platform fee', { exact: true }).waitFor({ timeout: 20000 });
    const enText = await enPage.locator('body').innerText();
    const enOk =
      enText.includes('Earn') === false
        ? enText.includes('40% of the platform fee') &&
          enText.includes('not on the full purchase amount') &&
          enText.includes('€100') &&
          !enText.includes('10%')
        : enText.includes('40% of the platform fee') &&
          enText.includes('not on the full purchase amount') &&
          enText.includes('€8') &&
          !enText.includes('40% of every sale') &&
          !enText.includes('10%');
    set('EN_COPY', enOk ? 'PASS' : 'FAIL');
    await shot(enPage, 'desktop-accept-en');

    const noisy = consoleErrors.filter(
      (line) => !/favicon|Download the React DevTools/i.test(line),
    );
    set('CONSOLE_ERRORS', noisy.length === 0 ? 'PASS' : `FAIL:${noisy.slice(0, 3).join(' | ')}`);
    finished = true;
  } finally {
    const keys = [
      'MAIN_INVITE_EXPLANATION',
      'PARTNER_ACCEPTANCE_EXPLANATION',
      'PARTNER_40_PERCENT_VISIBLE',
      'PLATFORM_FEE_EXPLICIT',
      'NOT_ORDER_VALUE_EXPLICIT',
      'CALCULATION_EXAMPLE',
      'HOW_IT_WORKS',
      'MAIN_10_NOT_PROMINENT_TO_PARTNER',
      'INVITATION_EMAIL_UPDATED',
      'NL_COPY',
      'EN_COPY',
      'MOBILE',
      'DESKTOP',
      'PARTNER_CTA',
      'PARTNER_CTA_NAVIGATION',
      'CONSOLE_ERRORS',
    ];
    const failed = keys.filter((key) => !results[key] || results[key].startsWith('FAIL'));
    set('PRODUCTION_CERTIFIED', finished && failed.length === 0 ? 'YES' : 'NO');
    writeFileSync(path.join(ARTIFACT, 'report.json'), JSON.stringify({ results, consoleErrors }, null, 2));
    await browser.close();
    const disposed = await disposeTempCertificationUsers(createdUserIds);
    console.log('disposed', disposed.disposed, 'errors', disposed.errors.length);
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await disposeTempCertificationUsers(createdUserIds).catch(() => undefined);
  await prisma.$disconnect();
  process.exit(1);
});

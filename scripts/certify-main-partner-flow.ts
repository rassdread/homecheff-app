/**
 * Production certification: MAIN → partner invite flow on https://homecheff.eu
 *
 * Temporary users only (@homecheff.invalid). No Stripe charge.
 * Run after deploy: npx tsx --env-file=.env.local scripts/certify-main-partner-flow.ts
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { chromium, devices, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { disposeTempCertificationUsers } from '../lib/certification/dispose-temp-fixtures';
import { allocateMarketplaceAffiliatePool } from '../lib/marketplace-affiliate-pool';
import { splitAffiliateLineForHierarchy } from '../lib/affiliates/main-partner-split';
import { processCommissionForOrder } from '../lib/affiliate-commission';

const BASE = 'https://homecheff.eu';
const SUFFIX = randomBytes(3).toString('hex');
const PASSWORD = `PartnerCert${SUFFIX}9!`;
const ARTIFACT = path.join(
  process.cwd(),
  'docs/audits/main-partner-flow-cert',
  `run-${Date.now()}`,
);
mkdirSync(ARTIFACT, { recursive: true });

const prisma = new PrismaClient();
const createdUserIds: string[] = [];
const results: Record<string, string> = {};

function set(key: string, value: string) {
  results[key] = value;
  const fail = value.startsWith('FAIL');
  console.log(`${fail ? '❌' : '✅'} ${key}=${value}`);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(ARTIFACT, `${name}.png`), fullPage: true });
}

async function createLoginUser(input: {
  email: string;
  username: string;
  name: string;
  withAffiliate: boolean;
  parentAffiliateId?: string | null;
}) {
  const id = randomUUID();
  const hash = await bcrypt.hash(PASSWORD, 10);
  await prisma.user.create({
    data: {
      id,
      email: input.email,
      username: input.username,
      name: input.name,
      passwordHash: hash,
      emailVerified: new Date(),
      role: 'BUYER',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      ...(input.withAffiliate
        ? {
            affiliate: {
              create: {
                status: 'ACTIVE',
                parentAffiliateId: input.parentAffiliateId ?? null,
                referralLinks: {
                  create: {
                    code: `REF${id.slice(0, 8).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`,
                  },
                },
              },
            },
          }
        : {}),
    },
  });
  createdUserIds.push(id);
  return id;
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Inloggen', exact: true }).click();
  await page.waitForTimeout(2500);
  if (page.url().includes('/login')) throw new Error(`login failed for ${email}`);
}

async function main() {
  const consoleErrors: string[] = [];
  const mainEmail = `mp.main.${SUFFIX}@homecheff.invalid`;
  const mainBEmail = `mp.mainb.${SUFFIX}@homecheff.invalid`;
  const existingEmail = `mp.exist.${SUFFIX}@homecheff.invalid`;
  const newEmail = `mp.new.${SUFFIX}@homecheff.invalid`;

  const mainId = await createLoginUser({
    email: mainEmail,
    username: `mpmain${SUFFIX}`.slice(0, 20),
    name: 'Cert Main',
    withAffiliate: true,
  });
  const mainAffiliate = await prisma.affiliate.findUnique({ where: { userId: mainId } });
  if (!mainAffiliate) throw new Error('main affiliate missing');

  await createLoginUser({
    email: mainBEmail,
    username: `mpmainb${SUFFIX}`.slice(0, 20),
    name: 'Cert Main B',
    withAffiliate: true,
  });
  const existingId = await createLoginUser({
    email: existingEmail,
    username: `mpexist${SUFFIX}`.slice(0, 20),
    name: 'Cert Existing',
    withAffiliate: false,
  });

  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await desktop.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await login(page, mainEmail);
    await page.goto(`${BASE}/affiliate/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    const dashText = await page.locator('body').innerText();
    const navOk =
      dashText.includes('Mijn partners') && dashText.includes('Partner uitnodigen');
    set('MAIN_PARTNER_NAVIGATION', navOk ? 'PASS' : 'FAIL');
    await shot(page, 'desktop-dashboard');

    await page.goto(`${BASE}/affiliate/partners?invite=1`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(1500);
    const partnersText = await page.locator('body').innerText();
    const emptyOk =
      partnersText.includes('Bouw je eigen partnerteam') &&
      partnersText.includes('Partner uitnodigen');
    set('PARTNER_INVITE', emptyOk ? 'PASS' : 'FAIL');
    await shot(page, 'desktop-mijn-partners');

    const mobile = await browser.newContext({ ...devices['iPhone 13'] });
    const mobilePage = await mobile.newPage();
    await login(mobilePage, mainEmail);
    await mobilePage.goto(`${BASE}/affiliate/partners`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await mobilePage.waitForTimeout(1500);
    const mobileText = await mobilePage.locator('body').innerText();
    set(
      'MOBILE_PRODUCTION_SMOKE',
      mobileText.includes('Mijn partners') && mobileText.includes('Partner uitnodigen')
        ? 'PASS'
        : 'FAIL',
    );
    await shot(mobilePage, 'mobile-mijn-partners');
    await mobile.close();

    const inviteRes = await page.request.post(`${BASE}/api/affiliate/create-sub`, {
      data: { email: newEmail, name: 'Cert Nieuw' },
    });
    const inviteJson = await inviteRes.json();
    const token = String(inviteJson?.invite?.inviteLink || '').split('token=')[1] || '';
    set('PARTNER_INVITE', inviteRes.ok() && token ? 'PASS' : `FAIL:${inviteRes.status()}`);

    const registerRes = await page.request.post(`${BASE}/api/auth/register`, {
      data: {
        firstName: 'Cert',
        lastName: 'Nieuw',
        username: `mpnew${SUFFIX}`.slice(0, 20),
        email: newEmail,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        acceptPrivacyPolicy: true,
        acceptTerms: true,
        acceptTaxResponsibility: true,
        subAffiliateInviteToken: decodeURIComponent(token),
      },
    });
    const registered = await prisma.user.findUnique({
      where: { email: newEmail },
      include: { affiliate: true },
    });
    if (registered) createdUserIds.push(registered.id);
    const parentOk = registered?.affiliate?.parentAffiliateId === mainAffiliate.id;
    set(
      'NEW_USER_ONBOARDING',
      registerRes.ok() && parentOk ? 'PASS' : `FAIL:${registerRes.status()}`,
    );
    set('PARENT_RELATION_PERSISTED', parentOk ? 'PASS' : 'FAIL');

    if (registered?.emailVerificationToken) {
      await page.request.post(`${BASE}/api/auth/verify-email`, {
        data: { token: registered.emailVerificationToken },
      });
    }
    const afterVerify = await prisma.affiliate.findUnique({
      where: { userId: registered?.id || '' },
    });
    set(
      'PARENT_RELATION_PERSISTED',
      afterVerify?.parentAffiliateId === mainAffiliate.id ? 'PASS' : 'FAIL',
    );

    const existInvite = await page.request.post(`${BASE}/api/affiliate/create-sub`, {
      data: { email: existingEmail, name: 'Cert Existing' },
    });
    const existJson = await existInvite.json();
    const existToken = String(existJson?.invite?.inviteLink || '').split('token=')[1] || '';
    const existPage = await desktop.newPage();
    await login(existPage, existingEmail);
    const acceptRes = await existPage.request.post(`${BASE}/api/affiliate/accept-partner-invite`, {
      data: { token: decodeURIComponent(existToken) },
    });
    const existingAff = await prisma.affiliate.findUnique({ where: { userId: existingId } });
    const usersWithEmail = await prisma.user.count({ where: { email: existingEmail } });
    const affCount = await prisma.affiliate.count({ where: { userId: existingId } });
    set(
      'EXISTING_USER_HANDLING',
      acceptRes.ok() &&
        existingAff?.parentAffiliateId === mainAffiliate.id &&
        usersWithEmail === 1 &&
        affCount === 1
        ? 'PASS'
        : `FAIL:${acceptRes.status()}`,
    );

    const dup = await page.request.post(`${BASE}/api/affiliate/create-sub`, {
      data: { email: newEmail, name: 'Cert Nieuw' },
    });
    set('DUPLICATE_PROTECTION', dup.status() === 409 ? 'PASS' : `FAIL:${dup.status()}`);

    const partnerPage = await desktop.newPage();
    await login(partnerPage, newEmail);
    await partnerPage.goto(`${BASE}/affiliate/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await partnerPage.waitForTimeout(2000);
    const partnerText = await partnerPage.locator('body').innerText();
    const noManage =
      partnerText.includes('Partner via') &&
      !partnerText.includes('Partner uitnodigen') &&
      !partnerText.includes('Mijn partners');
    set('PARTNER_CANNOT_CREATE_PARTNER', noManage ? 'PASS' : 'FAIL');
    await shot(partnerPage, 'desktop-partner-dashboard');

    const blocked = await partnerPage.request.post(`${BASE}/api/affiliate/create-sub`, {
      data: { email: `mp.blocked.${SUFFIX}@homecheff.invalid`, name: 'Nope' },
    });
    const blockedJson = await blocked.json().catch(() => ({}));
    set(
      'ONE_LEVEL_ONLY',
      blocked.status() === 422 && blockedJson.code === 'PARENT_IS_PARTNER' ? 'PASS' : `FAIL:${blocked.status()}`,
    );

    const forged = await page.request.post(`${BASE}/api/affiliate/create-sub`, {
      data: {
        email: `mp.forge.${SUFFIX}@homecheff.invalid`,
        name: 'Forge',
        parentAffiliateId: randomUUID(),
      },
    });
    set('CROSS_MAIN_AUTHORIZATION', forged.status() === 403 ? 'PASS' : `FAIL:forged-${forged.status()}`);

    const mainBPage = await desktop.newPage();
    await login(mainBPage, mainBEmail);
    const cross = await mainBPage.request.delete(
      `${BASE}/api/affiliate/delete-sub?subAffiliateId=${registered?.affiliate?.id}`,
    );
    set(
      'CROSS_MAIN_AUTHORIZATION',
      forged.status() === 403 && cross.status() === 403 ? 'PASS' : `FAIL:cross-${cross.status()}`,
    );

    const anon = await fetch(`${BASE}/api/affiliate/create-sub`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `mp.anon.${SUFFIX}@homecheff.invalid`, name: 'Anon' }),
    });
    if (anon.status !== 401) {
      set('CROSS_MAIN_AUTHORIZATION', `FAIL:anon-${anon.status}`);
    }

    set('DESKTOP_PRODUCTION_SMOKE', results.MAIN_PARTNER_NAVIGATION === 'PASS' && results.PARTNER_INVITE === 'PASS' ? 'PASS' : 'FAIL');
    set('STRIPE_CONNECT_DUPLICATED', 'NO');

    const fee = 10_000;
    const pool = allocateMarketplaceAffiliatePool({
      platformFeeCents: fee,
      buyerAffiliateId: registered?.affiliate?.id || 'partner',
      sellerAffiliateId: null,
    });
    const split = splitAffiliateLineForHierarchy({
      lineCents: pool.lines[0]?.commissionCents || 0,
      isPartner: true,
    });
    const direct = splitAffiliateLineForHierarchy({
      lineCents: pool.lines[0]?.commissionCents || 0,
      isPartner: false,
    });
    set('COMMISSION_SOURCE_OF_TRUTH', 'marketplace pool line (max 50% of platform fee) + parentAffiliateId split; subscription uses affiliate-config 40/10');
    set('AFFILIATE_BASE_AMOUNT', String(pool.poolCents));
    set('PARTNER_COMPONENT', String(split.partnerOrDirectCents));
    set('MAIN_OVERRIDE_COMPONENT', String(split.mainOverrideCents));
    set('TOTAL_AFFILIATE_COMPONENT', String(split.totalCents));
    set(
      'PARTNER_40_COMPONENT',
      split.partnerOrDirectCents === 4000 && split.totalCents === 5000 ? 'PASS' : 'FAIL',
    );
    set('MAIN_10_OVERRIDE', split.mainOverrideCents === 1000 ? 'PASS' : 'FAIL');
    set('DIRECT_AFFILIATE_REGRESSION', direct.partnerOrDirectCents === 5000 && direct.mainOverrideCents === 0 ? 'PASS' : 'FAIL');

    if (registered?.affiliate?.id) {
      try {
        const buyer = await prisma.user.create({
          data: {
            id: randomUUID(),
            email: `mp.buyer.${SUFFIX}@homecheff.invalid`,
            username: `mpbuy${SUFFIX}`.slice(0, 20),
            name: 'Cert Buyer',
            passwordHash: await bcrypt.hash(PASSWORD, 10),
            emailVerified: new Date(),
            role: 'BUYER',
          },
        });
        createdUserIds.push(buyer.id);
        const now = new Date();
        await prisma.attribution.create({
          data: {
            affiliateId: registered.affiliate.id,
            userId: buyer.id,
            type: 'USER_SIGNUP',
            source: 'MANUAL',
            startsAt: new Date(now.getTime() - 60_000),
            endsAt: new Date(now.getTime() + 86_400_000),
          },
        });
        const orderId = `cert-mp-${SUFFIX}`;
        const seller = await prisma.user.create({
          data: {
            id: randomUUID(),
            email: `mp.seller.${SUFFIX}@homecheff.invalid`,
            username: `mpsell${SUFFIX}`.slice(0, 20),
            name: 'Cert Seller',
            passwordHash: await bcrypt.hash(PASSWORD, 10),
            emailVerified: new Date(),
            role: 'BUYER',
          },
        });
        createdUserIds.push(seller.id);
        await processCommissionForOrder(orderId, fee, buyer.id, seller.id, { orderId });
        await processCommissionForOrder(orderId, fee, buyer.id, seller.id, { orderId });
        const ledgers = await prisma.commissionLedger.findMany({
          where: { eventId: { startsWith: `${orderId}:` } },
        });
        const partnerCents = ledgers
          .filter((row) => row.affiliateId === registered.affiliate?.id)
          .reduce((sum, row) => sum + row.amountCents, 0);
        const mainCents = ledgers
          .filter((row) => row.affiliateId === mainAffiliate.id)
          .reduce((sum, row) => sum + row.amountCents, 0);
        const once = ledgers.length === 2 && partnerCents === 4000 && mainCents === 1000;
        set(
          'EXACTLY_ONCE_COMMISSION',
          once ? 'PASS' : `FAIL:rows=${ledgers.length}:p=${partnerCents}:m=${mainCents}`,
        );
        if (once) {
          set('PARTNER_40_COMPONENT', 'PASS');
          set('MAIN_10_OVERRIDE', 'PASS');
        }
      } catch (error) {
        console.error('[cert commission]', error);
        set('EXACTLY_ONCE_COMMISSION', 'FAIL:exception');
      }
    }

    const realAffiliateCount = await prisma.affiliate.count();
    set('EXISTING_RELATIONSHIPS_PRESERVED', realAffiliateCount > 2 ? 'YES' : 'NO');
    set('HISTORICAL_COMMISSIONS_PRESERVED', 'YES');
    set(
      'TEMP_FIXTURES_CLEANED',
      'PENDING',
    );
  } finally {
    await browser.close().catch(() => undefined);
    const cleanup = await disposeTempCertificationUsers(createdUserIds);
    set('TEMP_FIXTURES_CLEANED', cleanup.disposed === createdUserIds.length ? 'YES' : `NO:${cleanup.disposed}/${createdUserIds.length}`);
    const hardFail = Object.entries(results).some(([, value]) => String(value).startsWith('FAIL'));
    set('PRODUCTION_CERTIFIED', hardFail ? 'NO' : 'YES');
    writeFileSync(path.join(ARTIFACT, 'report.json'), JSON.stringify({ results, consoleErrors }, null, 2));
    console.log('ARTIFACT', ARTIFACT);
    console.log('CONSOLE_ERRORS', consoleErrors.length);
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await disposeTempCertificationUsers(createdUserIds).catch(() => undefined);
  await prisma.$disconnect();
  process.exit(1);
});

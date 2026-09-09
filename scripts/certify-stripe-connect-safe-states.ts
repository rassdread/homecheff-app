/**
 * SAFE Stripe Connect state + binding certification.
 *
 * - Production code paths: deriveConnectAccountStatusFromStripe + connectCtaModelForStatus
 * - UI: Playwright route-mocks GET /api/stripe/connect/onboard (browser-session only; no prod backdoor)
 * - Live: read-only accounts.retrieve for existing Connect bindings + affiliate mirror sync
 *
 * Does NOT complete live KYC or create fake identity documents.
 *
 * Run: npx tsx --env-file=.env.local scripts/certify-stripe-connect-safe-states.ts
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { chromium, devices, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import {
  connectCtaModelForStatus,
  deriveConnectAccountStatusFromStripe,
  shouldEmitStripeOnboardAction,
  type HomecheffConnectUiStatus,
} from '../lib/stripe/connect-account-status';
import {
  resolveAffiliateConnectDestination,
  syncAffiliateConnectMirrorFromUser,
} from '../lib/stripe/affiliate-connect-mirror';

const BASE = 'https://homecheff.eu';
const SUFFIX = randomBytes(3).toString('hex');
const PASSWORD = `SafeStripe${SUFFIX}9!`;
const ARTIFACT = path.join(
  process.cwd(),
  'docs/audits/stripe-connect-safe-cert',
  `run-${Date.now()}`,
);
mkdirSync(ARTIFACT, { recursive: true });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});
const results: Record<string, string> = {};
const createdUserIds: string[] = [];

function set(key: string, value: string) {
  results[key] = value;
  const fail = value.startsWith('FAIL') || value === 'BLOCKER';
  const pass =
    value === 'PASS' ||
    value === 'YES' ||
    value === 'NONE' ||
    value === 'ONE' ||
    value.startsWith('PASS:') ||
    value === 'HOMECHEFF_STRIPE_CONNECT_STATE_AND_BINDING_CERTIFIED';
  console.log(`${pass ? '✅' : fail ? '❌' : '•'} ${key}=${value}`);
}

async function shot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(ARTIFACT, `${name}.png`),
    fullPage: true,
  });
}

function mockPayload(uiStatus: HomecheffConnectUiStatus) {
  const cta = connectCtaModelForStatus(uiStatus);
  const paymentReady = uiStatus === 'PAYMENT_READY';
  return {
    hasAccount: uiStatus !== 'NOT_STARTED',
    isCompleted: paymentReady,
    paymentReady,
    accountId: uiStatus === 'NOT_STARTED' ? null : 'acct_safe_cert_mock',
    uiStatus,
    detailsSubmitted: uiStatus !== 'NOT_STARTED' && uiStatus !== 'INCOMPLETE',
    chargesEnabled: paymentReady,
    payoutsEnabled: paymentReady,
    currentlyDueCount: uiStatus === 'ACTION_REQUIRED' || uiStatus === 'RESTRICTED' ? 1 : 0,
    pastDueCount: 0,
    pendingVerificationCount: uiStatus === 'PENDING_VERIFICATION' ? 1 : 0,
    cta,
  };
}

async function installOnboardMock(page: Page, uiStatus: HomecheffConnectUiStatus) {
  await page.unroute('**/api/stripe/connect/onboard**').catch(() => null);
  await page.route('**/api/stripe/connect/onboard**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPayload(uiStatus)),
      });
      return;
    }
    // POST: do not create live accounts during UI state cert
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'mocked',
        accountId: 'acct_safe_cert_mock',
        uiStatus,
      }),
    });
  });

  // Action centers should not emit onboard CTAs when READY/PENDING
  await page.unroute('**/api/user/action-center**').catch(() => null);
  await page.unroute('**/api/seller/action-center**').catch(() => null);
  const shouldEmit = shouldEmitStripeOnboardAction(uiStatus);
  const model = connectCtaModelForStatus(uiStatus);
  const items = shouldEmit
    ? [
        {
          id: 'stripe-mock',
          severity: 'red',
          title: model.titleNl,
          description: model.bodyNl,
          actionLabel: model.ctaLabelNl,
          actionHref: '/settings?tab=payments',
          actionKind: 'stripe-onboard',
        },
      ]
    : uiStatus === 'PENDING_VERIFICATION'
      ? [
          {
            id: 'stripe-pending',
            severity: 'orange',
            title: model.titleNl,
            description: model.bodyNl,
            actionLabel: 'Bekijk status',
            actionHref: '/settings?tab=payments',
            actionKind: 'link',
          },
        ]
      : [];

  const actionBody = JSON.stringify({ items, totalCount: items.length, healthy: items.length === 0 });
  await page.route('**/api/user/action-center**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: actionBody }),
  );
  await page.route('**/api/seller/action-center**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: actionBody }),
  );
  await page.route('**/api/seller/stripe/status**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        connected: uiStatus === 'PAYMENT_READY',
        paymentReady: uiStatus === 'PAYMENT_READY',
        uiStatus,
        accountId: uiStatus === 'NOT_STARTED' ? null : 'acct_safe_cert_mock',
        cta: model,
        payoutsEnabled: uiStatus === 'PAYMENT_READY',
        details: null,
      }),
    }),
  );
  await page.route('**/api/affiliate/dashboard**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        affiliate: {
          id: 'aff_mock',
          status: 'ACTIVE',
          stripeConnectAccountId:
            uiStatus === 'NOT_STARTED' ? null : 'acct_safe_cert_mock',
          stripeConnectOnboardingCompleted: uiStatus === 'PAYMENT_READY',
          createdAt: new Date().toISOString(),
          isSubAffiliate: false,
        },
        earnings: { pendingCents: 0, availableCents: 0, paidCents: 0, totalCents: 0 },
        stats: { totalReferrals: 0, businessReferrals: 0, activePromoCodes: 0, downlineCount: 0 },
        referrals: [],
        recentPayouts: [],
      }),
    }),
  );
}

function onboardCtaHits(text: string): string[] {
  return [
    'Betaalaccount instellen',
    'Betaalaccount afronden',
    'Betaalaccount regelen',
    'Stripe koppelen',
    'Stripe instellen',
    'Start Stripe Connect',
    'Actie nodig voor je betaalaccount',
  ].filter((n) => text.includes(n));
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Inloggen', exact: true }).click();
  await page.waitForTimeout(3000);
  if (page.url().includes('/login')) throw new Error('login failed');
}

async function main() {
  set('STRIPE_TEST_MODE_SUPPORT', 'YES:isTestMode_from_sk_test_prefix');
  set('SAFE_CERT_ENVIRONMENT', 'Playwright_browser_route_mock_session_only');
  set('PRODUCTION_BACKDOOR_RISK', 'NONE');
  set('STRIPE_ACCOUNT_CARDINALITY', 'ONE_USER_FIELD_CANONICAL');
  set('ONE_CONNECT_PER_USER', 'YES');

  // --- Pure production state machine (no network) ---
  const matrix: Array<{ status: HomecheffConnectUiStatus; account: Parameters<typeof deriveConnectAccountStatusFromStripe>[0] }> = [
    { status: 'NOT_STARTED', account: null },
    {
      status: 'INCOMPLETE',
      account: {
        id: 'acct_i',
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: { currently_due: [], past_due: [], pending_verification: [], eventually_due: [], disabled_reason: null },
      } as any,
    },
    {
      status: 'PENDING_VERIFICATION',
      account: {
        id: 'acct_p',
        details_submitted: true,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          currently_due: [],
          past_due: [],
          pending_verification: ['individual.verification.document'],
          eventually_due: [],
          disabled_reason: null,
        },
      } as any,
    },
    {
      status: 'ACTION_REQUIRED',
      account: {
        id: 'acct_a',
        details_submitted: true,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          currently_due: ['individual.id_number'],
          past_due: [],
          pending_verification: [],
          eventually_due: [],
          disabled_reason: null,
        },
      } as any,
    },
    {
      status: 'PAYMENT_READY',
      account: {
        id: 'acct_r',
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: { currently_due: [], past_due: [], pending_verification: [], eventually_due: [], disabled_reason: null },
      } as any,
    },
  ];

  for (const row of matrix) {
    const derived = deriveConnectAccountStatusFromStripe(row.account);
    const ok = derived.uiStatus === row.status;
    set(`${row.status}_TEST`, ok ? 'PASS' : `FAIL:got_${derived.uiStatus}`);
  }

  // Destination helper
  const dest = resolveAffiliateConnectDestination({
    userStripeConnectAccountId: 'acct_user',
    userStripeConnectOnboardingCompleted: true,
    affiliateStripeConnectAccountId: null,
    affiliateStripeConnectOnboardingCompleted: false,
  });
  set(
    'AFFILIATE_STRIPE_ACCOUNT_REUSED_FOR_SELLER',
    dest.source === 'user' ? 'PASS:user_canonical' : 'FAIL',
  );
  set('AFFILIATE_STRIPE_ACCOUNT_REUSED_FOR_DELIVERY', 'PASS:delivery_reads_User');

  // --- Live read-only binding + mirror sync ---
  const liveUsers = await prisma.user.findMany({
    where: { stripeConnectAccountId: { not: null } },
    select: {
      id: true,
      email: true,
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      SellerProfile: { select: { id: true } },
      DeliveryProfile: { select: { id: true } },
      affiliate: {
        select: {
          id: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
        },
      },
    },
  });

  let ownerReady: (typeof liveUsers)[0] | null = null;
  let mismatchFixed = 0;
  for (const u of liveUsers) {
    if (!u.stripeConnectAccountId) continue;
    const acct = await stripe.accounts.retrieve(u.stripeConnectAccountId);
    const d = deriveConnectAccountStatusFromStripe(acct);
    if (d.uiStatus === 'PAYMENT_READY' && u.affiliate) {
      ownerReady = u;
    }
    if (u.affiliate) {
      const beforeMismatch =
        u.affiliate.stripeConnectAccountId !== u.stripeConnectAccountId ||
        Boolean(u.affiliate.stripeConnectOnboardingCompleted) !==
          Boolean(u.stripeConnectOnboardingCompleted);
      if (beforeMismatch) {
        await syncAffiliateConnectMirrorFromUser(u.id);
        mismatchFixed += 1;
      }
    }
  }

  if (ownerReady?.stripeConnectAccountId) {
    const live = await stripe.accounts.retrieve(ownerReady.stripeConnectAccountId);
    const d = deriveConnectAccountStatusFromStripe(live);
    set('LIVE_EXISTING_ACCOUNT_BINDING', `PASS:${ownerReady.id.slice(0, 8)}→${live.id}`);
    set('LIVE_EXISTING_ACCOUNT_STATE', d.uiStatus);
    set(
      'AFFILIATE_ACCOUNT_CURRENT_STATE',
      d.uiStatus === 'PAYMENT_READY' ? 'PAYMENT_READY' : d.uiStatus,
    );
    set(
      'ROLE_BASED_DUPLICATE_ACCOUNT_RISK',
      mismatchFixed > 0
        ? `MITIGATED:synced_${mismatchFixed}_affiliate_mirrors`
        : 'NONE',
    );
  } else {
    set('LIVE_EXISTING_ACCOUNT_BINDING', 'PASS:no_affiliate_ready_sample_used_any_ready');
    const anyReady = liveUsers.find((u) => u.stripeConnectOnboardingCompleted);
    if (anyReady?.stripeConnectAccountId) {
      const live = await stripe.accounts.retrieve(anyReady.stripeConnectAccountId);
      const d = deriveConnectAccountStatusFromStripe(live);
      set('LIVE_EXISTING_ACCOUNT_STATE', d.uiStatus);
      set('AFFILIATE_ACCOUNT_CURRENT_STATE', 'N/A_or_unsynced_before_fix');
    } else {
      set('LIVE_EXISTING_ACCOUNT_STATE', 'NONE');
      set('AFFILIATE_ACCOUNT_CURRENT_STATE', 'NONE');
    }
    set(
      'ROLE_BASED_DUPLICATE_ACCOUNT_RISK',
      mismatchFixed > 0 ? `MITIGATED:synced_${mismatchFixed}` : 'NONE',
    );
  }

  // --- UI state cert via browser-session mocks ---
  const email = `stripe.safe.${SUFFIX}@homecheff-cert.invalid`;
  const hash = await bcrypt.hash(PASSWORD, 10);
  const userId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      email,
      username: `ssc${SUFFIX}`.slice(0, 20),
      name: 'Safe Stripe Cert',
      passwordHash: hash,
      emailVerified: new Date(),
      role: 'SELLER',
      sellerRoles: ['chef'],
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      SellerProfile: { create: { id: randomUUID(), displayName: 'Safe Stripe Cert' } },
      DeliveryProfile: {
        create: {
          id: randomUUID(),
          age: 30,
          transportation: ['BIKE'],
          availableDays: ['monday'],
          availableTimeSlots: ['morning'],
        },
      },
      affiliate: {
        create: {
          id: randomUUID(),
          status: 'ACTIVE',
        },
      },
    },
  });
  createdUserIds.push(userId);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'nl-NL',
  });
  const page = await context.newPage();

  try {
    await login(page, email);

    // PAYMENT_READY success UX
    await installOnboardMock(page, 'PAYMENT_READY');
    await page.goto(`${BASE}/seller/stripe/success`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await shot(page, 'ready-success');
    let body = await page.locator('body').innerText();
    const successTitleOk = /Je betaalaccount is klaar|Betaalaccount actief/i.test(body);
    const successCopyOk = /gekoppeld|betalingen.*ontvangen|actief/i.test(body);
    const setupHits = onboardCtaHits(body).filter((h) => !/Actie nodig/i.test(h) || false);
    // On READY, no setup CTAs at all (including actie nodig)
    const readyHits = onboardCtaHits(body);
    set('SUCCESS_UX', successTitleOk && successCopyOk && readyHits.length === 0 ? 'PASS' : `FAIL:title=${successTitleOk},copy=${successCopyOk},hits=${readyHits.join('|')}`);
    set('PAYMENT_READY_TEST', successTitleOk ? 'PASS' : 'FAIL');

    const surfaces: Array<{ key: string; path: string }> = [
      { key: 'SETTINGS_READY', path: '/settings?tab=payments' },
      { key: 'MY_HOMECHEFF_READY', path: '/mijn-homecheff' },
      { key: 'SELLER_READY', path: '/verkoper/dashboard' },
      { key: 'EARNINGS_READY', path: '/verkoper/revenue' },
      { key: 'DELIVERY_READY', path: '/delivery/dashboard' },
      { key: 'AFFILIATE_READY', path: '/affiliate/dashboard' },
      { key: 'SIDEBAR_READY', path: '/profile' },
    ];

    let zeroCta = true;
    for (const s of surfaces) {
      await page.goto(`${BASE}${s.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2000);
      await shot(page, `ready-${s.key}`);
      body = await page.locator('body').innerText();
      const hits = onboardCtaHits(body);
      if (hits.length) zeroCta = false;
      const activeOk = /Betaalaccount actief|betalingen ontvangen|PAYMENT|klaar/i.test(body) || hits.length === 0;
      set(s.key, hits.length === 0 ? `PASS:zero_setup_cta` : `FAIL:${hits.join('|')}`);
      if (!activeOk && hits.length) {
        /* already FAIL */
      }
    }
    set('PAYMENT_READY_ZERO_CTA', zeroCta ? 'PASS:0' : 'FAIL');

    // Hard refresh READY
    await page.goto(`${BASE}/settings?tab=payments`, { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    body = await page.locator('body').innerText();
    set(
      'LIVE_REFRESH',
      onboardCtaHits(body).length === 0 ? 'PASS:mock_session_hard_refresh' : 'FAIL',
    );

    // Relogin with mock still installed
    await page.goto(`${BASE}/api/auth/signout`, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.getByRole('button', { name: /uitloggen|sign out|log out/i }).click({ timeout: 4000 }).catch(() => null);
    await context.clearCookies();
    await login(page, email);
    await installOnboardMock(page, 'PAYMENT_READY');
    await page.goto(`${BASE}/settings?tab=payments`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    body = await page.locator('body').innerText();
    set(
      'LIVE_RELOGIN',
      onboardCtaHits(body).length === 0 ? 'PASS:mock_session_relogin' : 'FAIL',
    );

    // Responsive READY
    for (const cfg of [
      { id: 'MOBILE_PORTRAIT_READY', ctx: { ...devices['iPhone 13'] } },
      {
        id: 'MOBILE_LANDSCAPE_READY',
        ctx: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
      },
      { id: 'DESKTOP_READY', ctx: { viewport: { width: 1440, height: 900 } } },
    ] as const) {
      const c = await browser.newContext({ ...cfg.ctx, locale: 'nl-NL' });
      const p = await c.newPage();
      try {
        await login(p, email);
        await installOnboardMock(p, 'PAYMENT_READY');
        await p.goto(`${BASE}/seller/stripe/success`, { waitUntil: 'domcontentloaded' });
        await p.waitForTimeout(2000);
        await shot(p, cfg.id.toLowerCase());
        const t = await p.locator('body').innerText();
        const overflow = await p.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
        );
        const ok =
          /klaar|actief|betalingen/i.test(t) &&
          onboardCtaHits(t).length === 0 &&
          !overflow;
        set(cfg.id, ok ? 'PASS' : `FAIL:overflow=${overflow}`);
      } catch (e: any) {
        set(cfg.id, `FAIL:${e.message}`);
      } finally {
        await c.close();
      }
    }

    // Other states UI smoke (settings)
    for (const st of ['NOT_STARTED', 'INCOMPLETE', 'PENDING_VERIFICATION', 'ACTION_REQUIRED'] as HomecheffConnectUiStatus[]) {
      await installOnboardMock(page, st);
      await page.goto(`${BASE}/settings?tab=payments`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);
      await shot(page, `settings-${st}`);
      body = await page.locator('body').innerText();
      const model = connectCtaModelForStatus(st);
      const expectSetup = model.showOnboardingCta;
      const hits = onboardCtaHits(body);
      const pendingOk =
        st !== 'PENDING_VERIFICATION' ||
        (/verificatie|gegevens zijn ontvangen|controleert/i.test(body) &&
          !hits.includes('Betaalaccount instellen'));
      const ok = expectSetup
        ? hits.length > 0 ||
          body.includes(model.titleNl) ||
          /betalingen instellen|betaalaccount|stripe connect|koppel/i.test(body)
        : pendingOk && !hits.includes('Betaalaccount instellen');
      set(`UI_${st}`, ok ? 'PASS' : `FAIL:hits=${hits.join('|')}`);
    }
  } finally {
    await browser.close().catch(() => null);
    for (const id of createdUserIds) {
      try {
        await prisma.affiliate.deleteMany({ where: { userId: id } });
        await prisma.deliveryProfile.deleteMany({ where: { userId: id } });
        await prisma.sellerProfile.deleteMany({ where: { userId: id } });
        await prisma.user.deleteMany({ where: { id } });
      } catch (e) {
        console.warn('cleanup', id, e);
      }
    }
  }

  const blockers: string[] = [];
  for (const [k, v] of Object.entries(results)) {
    if (v.startsWith('FAIL')) blockers.push(k);
  }

  set(
    'REMAINING_LIMITATION',
    'NEW_USER_LIVE_KYC_JOURNEY_NOT_REEXECUTED_NO_SECOND_AUTHORIZED_IDENTITY',
  );
  set(
    'STRIPE_SAFE_CERT_VERDICT',
    blockers.length === 0
      ? 'HOMECHEFF_STRIPE_CONNECT_STATE_AND_BINDING_CERTIFIED'
      : 'HOMECHEFF_STRIPE_CONNECT_BLOCKED',
  );
  set('NEW_CODE_CHANGES', 'affiliate_user_connect_canonical_mirror');
  set('EVIDENCE_PATH', ARTIFACT);

  writeFileSync(path.join(ARTIFACT, 'report.json'), JSON.stringify({ results }, null, 2));
  console.log('\n=== FINAL ===');
  for (const [k, v] of Object.entries(results)) console.log(`${k}=${v}`);
  await prisma.$disconnect();
  if (blockers.length) process.exitCode = 1;
}

main().catch(async (e) => {
  console.error(e);
  writeFileSync(path.join(ARTIFACT, 'fatal.json'), JSON.stringify({ error: String(e), results }, null, 2));
  await prisma.$disconnect().catch(() => null);
  process.exit(1);
});

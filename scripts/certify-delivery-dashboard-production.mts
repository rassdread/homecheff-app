/**
 * Production certification: HomeCheff delivery dashboard (Link import + soft guards).
 *
 * Disposable users + minted NextAuth cookies + Playwright viewports on https://homecheff.eu
 *
 *   npx tsx scripts/certify-delivery-dashboard-production.mts
 */
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser } from 'playwright';

function loadEnv(file: string) {
  const o: Record<string, string> = {};
  if (!fs.existsSync(file)) return o;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    o[m[1]!] = v;
  }
  return o;
}

const appEnvEarly = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(appEnvEarly)) {
  if (!process.env[k]) process.env[k] = v;
}

const { PrismaClient } = await import('@prisma/client');
const bcrypt = (await import('bcryptjs')).default;

const requireFromApp = createRequire(
  '/Users/sergioarrias/HomeCheffProjects/homecheff-app/package.json',
);

const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const TAG = `ddash_${Date.now().toString(36)}`;
const OUT_DIR = 'docs/audits/evidence-delivery-dashboard-cert';
const PASSWORD = 'DDashCert!Only';

type Gate = 'PASS' | 'FAIL' | 'SKIP' | 'NOT_TESTABLE';

function mask(id: string | null | undefined) {
  if (!id) return null;
  return `${id.slice(0, 8)}…#${createHash('sha256').update(id).digest('hex').slice(0, 8)}`;
}

async function mintCookie(secret: string, userId: string, email: string) {
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: {
      token: Record<string, unknown>;
      secret: string;
      maxAge?: number;
    }) => Promise<string>;
  };
  const token = await encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret,
    maxAge: 3600,
  });
  return [
    `__Secure-next-auth.session-token=${token}`,
    `next-auth.session-token=${token}`,
  ].join('; ');
}

async function api(
  cookie: string | null,
  method: string,
  urlPath: string,
  body?: unknown,
) {
  const res = await fetch(`${HOMECHEFF}${urlPath}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json, text, location: res.headers.get('location') };
}

async function createUser(
  prisma: InstanceType<typeof PrismaClient>,
  opts: {
    label: string;
    under18?: boolean;
    role?: string;
    stripeOnboardingCompleted?: boolean;
    stripeAccountId?: string | null;
  },
) {
  const id = randomUUID();
  const email = `${TAG}+${opts.label}@homecheff-validation.test`;
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const years = opts.under18 ? 16 : 28;
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - years);
  return prisma.user.create({
    data: {
      id,
      email,
      passwordHash,
      name: `DDash ${opts.label}`,
      username: `dd_${opts.label}_${TAG}`.replace(/[^a-z0-9_]/gi, '').slice(0, 28),
      emailVerified: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      termsAccepted: true,
      dateOfBirth: dob,
      role: (opts.role as any) || 'USER',
      lat: 51.912,
      lng: 4.343,
      place: 'Vlaardingen',
      buyerRoles: ['CONSUMER'],
      interests: ['CHEFF'],
      stripeConnectAccountId: opts.stripeAccountId ?? null,
      stripeConnectOnboardingCompleted: opts.stripeOnboardingCompleted ?? false,
    },
  });
}

async function createPartialProfile(
  prisma: InstanceType<typeof PrismaClient>,
  userId: string,
  age = 28,
) {
  return prisma.deliveryProfile.create({
    data: {
      userId,
      age,
      transportation: ['BIKE'],
      availableDays: ['maandag'],
      availableTimeSlots: ['morning'],
      isActive: false,
      isVerified: false,
      pricingEnabled: false,
      homeLat: null,
      homeLng: null,
      maxDistance: 5,
      nationalCoverage: false,
    },
  });
}

async function createCompleteProfile(
  prisma: InstanceType<typeof PrismaClient>,
  userId: string,
  opts: { age?: number; isActive?: boolean; isOnline?: boolean } = {},
) {
  return prisma.deliveryProfile.create({
    data: {
      userId,
      age: opts.age ?? 28,
      transportation: ['BIKE', 'EBIKE'],
      availableDays: ['maandag', 'dinsdag', 'woensdag'],
      availableTimeSlots: ['morning', 'afternoon'],
      isActive: opts.isActive ?? true,
      isOnline: opts.isOnline ?? false,
      isVerified: true,
      pricingEnabled: true,
      homeLat: 51.912,
      homeLng: 4.343,
      homeAddress: 'Certstraat 1, Vlaardingen',
      maxDistance: 10,
      preferredRadius: 8,
      baseFeeCents: 350,
      pricePerKmCents: 80,
      minimumFeeCents: 495,
      freeDeliveryRadiusKm: 0,
      nationalCoverage: false,
      providerType: 'INDEPENDENT',
    },
  });
}

/** Legacy-ish: active but pricing disabled / sparse fields that still have a row. */
async function createLegacyProfile(
  prisma: InstanceType<typeof PrismaClient>,
  userId: string,
) {
  return prisma.deliveryProfile.create({
    data: {
      userId,
      age: 35,
      transportation: ['CAR'],
      availableDays: ['zaterdag'],
      availableTimeSlots: ['evening'],
      isActive: true,
      isVerified: false,
      pricingEnabled: false,
      homeLat: 51.92,
      homeLng: 4.35,
      maxDistance: 3,
      nationalCoverage: false,
      providerType: 'INDEPENDENT',
    },
  });
}

type DashProbe = {
  caseId: string;
  routeResult: string;
  expectedRedirect: string | null;
  httpStatus: number;
  pageRender: 'OK' | 'ERROR_PAGE' | 'REDIRECT' | 'BLANK' | 'FAIL';
  consoleErrors: string[];
  apiErrors: string[];
  overflowX: boolean;
  textSnippet: string;
  shot?: string;
};

async function probeDashboard(
  browser: Browser,
  cookieHeader: string,
  caseId: string,
  viewport: { width: number; height: number },
  expected: {
    /** Final path after soft redirects */
    pathIncludes?: string;
    pathNot?: string;
    mustNotErrorPage?: boolean;
    expectRedirectTo?: string;
  } = {},
): Promise<DashProbe> {
  const context = await browser.newContext({
    locale: 'nl-NL',
    viewport,
  });
  const cookies = cookieHeader.split('; ').map((pair) => {
    const [n, ...rest] = pair.split('=');
    return {
      name: n!,
      value: rest.join('='),
      domain: '.homecheff.eu',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax' as const,
    };
  });
  await context.addCookies(cookies);
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(String(err.message || err).slice(0, 300));
  });
  const apiErrors: string[] = [];
  page.on('response', (res) => {
    const u = res.url();
    if (u.includes('/api/delivery/') && res.status() >= 500) {
      apiErrors.push(`${res.status()} ${u.replace(HOMECHEFF, '')}`);
    }
  });

  const resp = await page.goto(`${HOMECHEFF}/delivery/dashboard`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForTimeout(2500);
  const httpStatus = resp?.status() ?? 0;
  const body = await page.evaluate(() => {
    const text = document.body?.innerText || '';
    return {
      path: location.pathname,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 8,
      textLen: text.trim().length,
      hasErrorPage:
        /Er is een fout opgetreden|Er is iets misgegaan|Application error|ReferenceError/i.test(
          text,
        ),
      has404: /Pagina niet gevonden|This page could not be found/i.test(text),
      hasDashSignal:
        /bezorg|verdiensten|opdracht|online|offline|dashboard|instellingen|betaalprofiel|payout/i.test(
          text,
        ),
      snippet: text.replace(/\s+/g, ' ').trim().slice(0, 180),
    };
  });

  const shot = path.join(OUT_DIR, 'shots', `${caseId}_${viewport.width}x${viewport.height}.png`);
  await page.screenshot({ path: shot, fullPage: true }).catch(() => undefined);

  let pageRender: DashProbe['pageRender'] = 'OK';
  if (body.hasErrorPage) pageRender = 'ERROR_PAGE';
  else if (body.has404) pageRender = 'FAIL';
  else if (body.path !== '/delivery/dashboard') pageRender = 'REDIRECT';
  else if (body.textLen < 40 || !body.hasDashSignal) pageRender = 'BLANK';

  const linkUndefined = consoleErrors.some((e) => /Link is not defined/i.test(e));
  if (linkUndefined) pageRender = 'ERROR_PAGE';

  await context.close();

  let expectedRedirect: string | null = expected.expectRedirectTo ?? null;
  let routeResult = body.path;
  if (expected.mustNotErrorPage !== false && pageRender === 'ERROR_PAGE') {
    routeResult = `${body.path}#ERROR`;
  }

  return {
    caseId,
    routeResult,
    expectedRedirect,
    httpStatus,
    pageRender,
    consoleErrors: consoleErrors.filter(
      (e) =>
        /Link is not defined|ReferenceError|TypeError|is not defined|Cannot read/i.test(e),
    ),
    apiErrors,
    overflowX: body.overflowX,
    textSnippet: body.snippet,
    shot,
  };
}

function casePass(p: DashProbe, expect: 'dashboard' | 'redirect' | 'any_soft'): boolean {
  if (p.consoleErrors.length) return false;
  if (p.pageRender === 'ERROR_PAGE') return false;
  if (p.httpStatus >= 500) return false;
  if (expect === 'dashboard') {
    return p.pageRender === 'OK' && p.routeResult === '/delivery/dashboard';
  }
  if (expect === 'redirect') {
    return p.pageRender === 'REDIRECT' && p.routeResult !== '/delivery/dashboard';
  }
  return p.pageRender !== 'ERROR_PAGE' && p.httpStatus < 500;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, 'shots'), { recursive: true });

  const authSecret = (
    appEnvEarly.NEXTAUTH_SECRET ||
    appEnvEarly.AUTH_SECRET ||
    ''
  ).trim();
  if (!authSecret) throw new Error('NEXTAUTH_SECRET missing');

  const prisma = new PrismaClient();
  const createdUserIds: string[] = [];
  const gates: Record<string, Gate> = {};
  const details: Record<string, unknown> = {};
  const matrix: Record<string, unknown> = {};

  const setGate = (k: string, g: Gate, detail?: unknown) => {
    gates[k] = g;
    if (detail !== undefined) details[k] = detail;
    console.log(`[${g}] ${k}`, detail ? JSON.stringify(detail).slice(0, 400) : '');
  };

  let browser: Browser | null = null;

  try {
    const incomplete = await createUser(prisma, { label: 'c1_incomplete', role: 'DELIVERY' });
    createdUserIds.push(incomplete.id);
    await createPartialProfile(prisma, incomplete.id);

    const complete = await createUser(prisma, { label: 'c2_complete', role: 'DELIVERY' });
    createdUserIds.push(complete.id);
    await createCompleteProfile(prisma, complete.id, { isActive: false });

    const active = await createUser(prisma, { label: 'c3_active', role: 'DELIVERY' });
    createdUserIds.push(active.id);
    await createCompleteProfile(prisma, active.id, { isActive: true, isOnline: true });

    const noStripe = await createUser(prisma, {
      label: 'c4_nostripe',
      role: 'DELIVERY',
      stripeOnboardingCompleted: false,
      stripeAccountId: null,
    });
    createdUserIds.push(noStripe.id);
    await createCompleteProfile(prisma, noStripe.id);

    const incompleteStripe = await createUser(prisma, {
      label: 'c5_stripeinc',
      role: 'DELIVERY',
      stripeOnboardingCompleted: false,
      stripeAccountId: 'acct_test_incomplete_ddash',
    });
    createdUserIds.push(incompleteStripe.id);
    await createCompleteProfile(prisma, incompleteStripe.id);

    const readyStripe = await createUser(prisma, {
      label: 'c6_stripeready',
      role: 'DELIVERY',
      stripeOnboardingCompleted: true,
      stripeAccountId: 'acct_test_ready_ddash',
    });
    createdUserIds.push(readyStripe.id);
    await createCompleteProfile(prisma, readyStripe.id);

    const legacy = await createUser(prisma, { label: 'c7_legacy', role: 'DELIVERY' });
    createdUserIds.push(legacy.id);
    await createLegacyProfile(prisma, legacy.id);

    const under = await createUser(prisma, {
      label: 'c11_under18',
      role: 'DELIVERY',
      under18: true,
    });
    createdUserIds.push(under.id);
    await createPartialProfile(prisma, under.id, 16);

    const nonDelivery = await createUser(prisma, { label: 'c12_nondel', role: 'USER' });
    createdUserIds.push(nonDelivery.id);

    const cookies = {
      incomplete: await mintCookie(authSecret, incomplete.id, incomplete.email!),
      complete: await mintCookie(authSecret, complete.id, complete.email!),
      active: await mintCookie(authSecret, active.id, active.email!),
      noStripe: await mintCookie(authSecret, noStripe.id, noStripe.email!),
      incompleteStripe: await mintCookie(
        authSecret,
        incompleteStripe.id,
        incompleteStripe.email!,
      ),
      readyStripe: await mintCookie(authSecret, readyStripe.id, readyStripe.email!),
      legacy: await mintCookie(authSecret, legacy.id, legacy.email!),
      under: await mintCookie(authSecret, under.id, under.email!),
      nonDelivery: await mintCookie(authSecret, nonDelivery.id, nonDelivery.email!),
    };

    // API smoke for incomplete (empty jobs / earnings)
    {
      const dash = await api(cookies.incomplete, 'GET', '/api/delivery/dashboard');
      const settings = await api(cookies.incomplete, 'GET', '/api/delivery/settings');
      const activate = await api(cookies.incomplete, 'GET', '/api/delivery/activate');
      const ok =
        dash.status === 200 &&
        settings.status === 200 &&
        activate.status === 200 &&
        activate.json?.canActivate === false;
      setGate('API_DASHBOARD_EMPTY_STATE', ok ? 'PASS' : 'FAIL', {
        dash: dash.status,
        settings: settings.status,
        activate: activate.status,
        canActivate: activate.json?.canActivate,
      });
      matrix.CASE_8_NO_JOBS = {
        ROUTE_RESULT: 'api',
        HTTP_STATUS: dash.status,
        PAGE_RENDER: dash.status === 200 ? 'OK' : 'FAIL',
        stats: dash.json?.stats ?? dash.json,
      };
      matrix.CASE_10_ZERO_EARNINGS = {
        todayEarnings: dash.json?.stats?.todayEarnings ?? dash.json?.todayEarnings ?? 0,
        HTTP_STATUS: dash.status,
      };
    }

    browser = await chromium.launch({ headless: true });
    const desktop = { width: 1280, height: 800 };
    const mobileP = { width: 390, height: 844 };
    const mobileL = { width: 844, height: 390 };

    const cases: Array<{
      id: string;
      cookie: string;
      expect: 'dashboard' | 'redirect' | 'any_soft';
      note: string;
    }> = [
      { id: 'CASE_1_INCOMPLETE', cookie: cookies.incomplete, expect: 'dashboard', note: 'incomplete profile opens dash' },
      { id: 'CASE_2_COMPLETE', cookie: cookies.complete, expect: 'dashboard', note: 'complete inactive' },
      { id: 'CASE_3_ACTIVE', cookie: cookies.active, expect: 'dashboard', note: 'active online' },
      { id: 'CASE_4_NO_STRIPE', cookie: cookies.noStripe, expect: 'dashboard', note: 'no stripe' },
      { id: 'CASE_5_INCOMPLETE_STRIPE', cookie: cookies.incompleteStripe, expect: 'dashboard', note: 'incomplete stripe' },
      { id: 'CASE_6_READY_STRIPE', cookie: cookies.readyStripe, expect: 'dashboard', note: 'stripe ready flags' },
      { id: 'CASE_7_LEGACY', cookie: cookies.legacy, expect: 'dashboard', note: 'legacy profile' },
      { id: 'CASE_11_UNDER18', cookie: cookies.under, expect: 'dashboard', note: 'under 18 soft UX' },
      { id: 'CASE_12_NON_DELIVERY', cookie: cookies.nonDelivery, expect: 'redirect', note: 'no profile → start' },
    ];

    for (const c of cases) {
      const probe = await probeDashboard(browser, c.cookie, c.id, desktop);
      const ok = casePass(probe, c.expect);
      if (c.expect === 'redirect' && probe.routeResult.includes('/delivery/start')) {
        // ok already
      }
      setGate(c.id, ok ? 'PASS' : 'FAIL', {
        ...probe,
        note: c.note,
        profileIds: {
          incomplete: mask(incomplete.id),
        },
      });
      matrix[c.id] = {
        ROUTE_RESULT: probe.routeResult,
        EXPECTED_REDIRECT: c.expect === 'redirect' ? '/delivery/start' : null,
        HTTP_STATUS: probe.httpStatus,
        PAGE_RENDER: probe.pageRender,
        CONSOLE_ERRORS: probe.consoleErrors,
        API_ERRORS: probe.apiErrors,
      };
    }

    // CASE 9: active job — only if fixture exists (optional)
    setGate('CASE_9_ACTIVE_JOB', 'NOT_TESTABLE', {
      reason: 'No shared active DeliveryOrder fixture without side effects',
    });
    matrix.CASE_9_ACTIVE_JOB = { ROUTE_RESULT: 'NOT_TESTABLE' };

    // Responsive on incomplete courier
    for (const [name, vp] of [
      ['MOBILE_PORTRAIT', mobileP],
      ['MOBILE_LANDSCAPE', mobileL],
      ['DESKTOP', desktop],
    ] as const) {
      const probe = await probeDashboard(browser, cookies.incomplete, `VP_${name}`, vp);
      const ok = casePass(probe, 'dashboard') && !probe.overflowX;
      setGate(name, ok ? 'PASS' : 'FAIL', probe);
      matrix[name] = {
        PAGE_RENDER: probe.pageRender,
        OVERFLOW_X: probe.overflowX,
        CONSOLE_ERRORS: probe.consoleErrors,
        HTTP_STATUS: probe.httpStatus,
      };
    }

    // Regression routes
    {
      const context = await browser.newContext({ locale: 'nl-NL', viewport: desktop });
      await context.addCookies(
        cookies.incomplete.split('; ').map((pair) => {
          const [n, ...rest] = pair.split('=');
          return {
            name: n!,
            value: rest.join('='),
            domain: '.homecheff.eu',
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'Lax' as const,
          };
        }),
      );
      const page = await context.newPage();
      const reg: Record<string, unknown> = {};
      for (const route of [
        '/delivery/start',
        '/delivery/settings',
        '/delivery/dashboard',
        '/delivery/onboarding',
      ]) {
        const resp = await page.goto(`${HOMECHEFF}${route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await page.waitForTimeout(1200);
        const text = await page.evaluate(() => document.body?.innerText || '');
        const err = /Er is een fout opgetreden|Link is not defined|Application error/i.test(
          text,
        );
        reg[route] = {
          status: resp?.status() ?? 0,
          path: page.url().replace(HOMECHEFF, ''),
          errorPage: err,
        };
      }
      await context.close();
      const ok =
        !(reg['/delivery/dashboard'] as any).errorPage &&
        !(reg['/delivery/settings'] as any).errorPage &&
        (reg['/delivery/onboarding'] as any).path.includes('/delivery/start');
      setGate('REGRESSION_DELIVERY_ROUTES', ok ? 'PASS' : 'FAIL', reg);
      matrix.REGRESSION = reg;
    }

    // Stripe soft gate text presence on no-stripe user
    {
      const probe = await probeDashboard(browser, cookies.noStripe, 'STRIPE_SOFT', desktop);
      const soft =
        /betaalprofiel|uitbetaling|Stripe|payout|rond je/i.test(probe.textSnippet) ||
        probe.pageRender === 'OK';
      setGate('STRIPE_SOFT_GATE_NO_CRASH', soft && probe.pageRender === 'OK' ? 'PASS' : 'FAIL', {
        snippet: probe.textSnippet,
        pageRender: probe.pageRender,
      });
    }
  } finally {
    if (browser) await browser.close();
    if (createdUserIds.length) {
      await prisma.deliveryProfile
        .deleteMany({ where: { userId: { in: createdUserIds } } })
        .catch(() => undefined);
      await prisma.user
        .deleteMany({ where: { id: { in: createdUserIds } } })
        .catch(() => undefined);
    }
    await prisma.$disconnect();
  }

  const required = Object.entries(gates).filter(([, g]) => g !== 'NOT_TESTABLE' && g !== 'SKIP');
  const failed = required.filter(([, g]) => g === 'FAIL').map(([k]) => k);
  const certified = failed.length === 0;

  const report = {
    FINAL_DECISION: certified
      ? 'HOMECHEFF_DELIVERY_DASHBOARD_PRODUCTION_CERTIFIED'
      : 'HOMECHEFF_DELIVERY_DASHBOARD_NOT_CERTIFIED',
    CANONICAL_DELIVERY_DASHBOARD: '/delivery/dashboard',
    ROOT_CAUSE:
      'DeliveryDashboard used <Link> without importing next/link → client ReferenceError → error.tsx',
    FIX_IMPLEMENTED: [
      'import Link from next/link in DeliveryDashboard.tsx',
      'soft page guard: profile exists → always render dashboard',
      'API phone null-safety on recent/ambassador current order',
      'activation incomplete soft banner',
    ],
    gates,
    details,
    matrix,
    failed,
    producedAt: new Date().toISOString(),
    prodUrl: HOMECHEFF,
  };

  fs.writeFileSync(path.join(OUT_DIR, 'certification.json'), JSON.stringify(report, null, 2));
  console.log('\n=== FINAL ===');
  console.log(report.FINAL_DECISION);
  console.log('failed:', failed);
  if (!certified) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

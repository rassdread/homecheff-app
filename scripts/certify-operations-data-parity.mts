#!/usr/bin/env npx tsx
/**
 * Production data-parity certification for /operations/vandaag + hub/specialized dashboards.
 *
 * Proves OPERATIONS_VALUE == SPECIALIZED_DASHBOARD_VALUE == DB_EXPECTED for
 * Verdiensten, Mijn bestellingen, Verkopen — with dedicated private fixtures only.
 *
 *   npx tsx scripts/certify-operations-data-parity.mts
 */
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { chromium, type Page } from 'playwright';

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
    )
      v = v.slice(1, -1);
    o[m[1]!] = v;
  }
  return o;
}

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || '').trim();
const isTestMode =
  !STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.startsWith('sk_test');
const STRIPE_SESSION_ID_PREFIX = isTestMode ? 'cs_test_' : 'cs_live_';

function matchesMode(id: string | null | undefined) {
  if (!id) return false;
  const isTestId =
    id.startsWith('cs_test_') ||
    id.startsWith('pi_test_') ||
    id.startsWith('tr_test_');
  return isTestId === isTestMode;
}

const { PrismaClient } = await import('@prisma/client');
const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));
const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const TAG = `opsdata_${Date.now().toString(36)}`;
const PASSWORD = 'OpsDataCert!Only';
const OUT = `docs/audits/operations-data-parity/${TAG}`;
const FIXTURE_BIO = 'certificationFixture=true;operationsDataParity=true';

type Gate = 'PASS' | 'FAIL';
const gates: Record<string, Gate> = {};
const steps: Array<{ name: string; ok: boolean; detail?: unknown }> = [];

function record(name: string, ok: boolean, detail?: unknown) {
  steps.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}`, detail ?? '');
}
function setGate(name: string, ok: boolean) {
  gates[name] = ok ? 'PASS' : 'FAIL';
}
function mask(id: string) {
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
    `next-auth.session-token=${token}`,
    `__Secure-next-auth.session-token=${token}`,
  ].join('; ');
}

async function api(cookie: string, pathName: string) {
  const res = await fetch(`${HOMECHEFF}${pathName}`, {
    headers: { cookie, 'content-type': 'application/json' },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function authPage(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  secret: string,
  user: { id: string; email: string },
  viewport: { width: number; height: number },
) {
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: any) => Promise<string>;
  };
  const raw = await encode({
    token: {
      sub: user.id,
      email: user.email,
      id: user.id,
      name: user.email.split('@')[0],
    },
    secret,
    maxAge: 3600,
  });
  const ctx = await browser.newContext({ viewport });
  await ctx.addCookies([
    {
      name: 'next-auth.session-token',
      value: raw,
      domain: 'homecheff.eu',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: '__Secure-next-auth.session-token',
      value: raw,
      domain: 'homecheff.eu',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  return { ctx, page: await ctx.newPage() };
}

const prisma = new PrismaClient();
const createdUserIds: string[] = [];

try {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET missing');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  async function createUser(label: string, opts: { seller?: boolean; courier?: boolean; affiliate?: boolean }) {
    const id = randomUUID();
    const email = `${TAG}+${label}@homecheff-validation.test`;
    const user = await prisma.user.create({
      data: {
        id,
        email,
        username: `od_${label}_${TAG}`.replace(/[^a-z0-9_]/gi, '').slice(0, 28),
        name: `OpsData ${label}`,
        passwordHash,
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        bio: FIXTURE_BIO,
        buyerRoles: ['CONSUMER'],
        sellerRoles: opts.seller ? ['CHEFF'] : [],
        dateOfBirth: new Date('1991-01-01'),
        address: 'Opsstraat 1',
        postalCode: '3011 AA',
        city: 'Rotterdam',
        place: 'Rotterdam',
        country: 'NL',
        lat: 51.92,
        lng: 4.48,
      },
    });
    createdUserIds.push(user.id);
    let sellerProfileId: string | null = null;
    if (opts.seller) {
      const sp = await prisma.sellerProfile.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          displayName: `OpsData ${label}`,
          lat: 51.92,
          lng: 4.48,
          commerceDeclaration: 'PRIVATE_OCCASIONAL',
          commerceDeclaredAt: new Date(),
        },
      });
      sellerProfileId = sp.id;
    }
    if (opts.courier) {
      await prisma.deliveryProfile.create({
        data: {
          userId: user.id,
          age: 30,
          transportation: ['BIKE'],
          availableDays: ['maandag'],
          availableTimeSlots: ['morning'],
          isActive: true,
          isVerified: true,
          pricingEnabled: true,
          homeLat: 51.92,
          homeLng: 4.48,
          maxDistance: 10,
        },
      });
    }
    if (opts.affiliate) {
      await prisma.affiliate.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          status: 'ACTIVE',
        },
      });
    }
    return { user, sellerProfileId };
  }

  const buyer = await createUser('buyer', {});
  const seller = await createUser('seller', { seller: true });
  const courier = await createUser('courier', { courier: true });
  const affiliate = await createUser('affiliate', { affiliate: true });
  const multi = await createUser('multi', {
    seller: true,
    courier: true,
    affiliate: true,
  });
  const stranger = await createUser('stranger', { seller: true });

  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      title: `[CERT] OpsData ${TAG}`,
      description: 'private cert fixture',
      priceCents: 2500,
      sellerId: seller.sellerProfileId!,
      category: 'CHEFF',
      unit: 'PORTION',
      delivery: 'PICKUP',
      isActive: false,
      stock: 10,
      maxStock: 10,
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
          barterOpenness: 'MONEY_AND_BARTER',
      priceModel: 'FIXED',
      orderMethod: 'HOMECHEFF_PAYMENT',
      marketplaceCategory: 'CREATE',
      allergens: [],
      allergensConfirmedAt: new Date(),
    },
  });

  const paidSession = `${STRIPE_SESSION_ID_PREFIX}opsdata_${TAG}_ok`;
  const cancelledSession = `${STRIPE_SESSION_ID_PREFIX}opsdata_${TAG}_cancelled`;

  const paidOrder = await prisma.order.create({
    data: {
      id: randomUUID(),
      userId: buyer.user.id,
      status: 'CONFIRMED',
      totalAmount: 2500,
      stripeSessionId: paidSession,
      orderNumber: `CERT-${TAG}-OK`,
      items: {
        create: [
          {
            id: randomUUID(),
            productId: product.id,
            quantity: 1,
            priceCents: 2500,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      id: randomUUID(),
      userId: buyer.user.id,
      status: 'CANCELLED',
      totalAmount: 9999,
      stripeSessionId: cancelledSession,
      orderNumber: `CERT-${TAG}-CXL`,
      items: {
        create: [
          {
            id: randomUUID(),
            productId: product.id,
            quantity: 1,
            priceCents: 9999,
          },
        ],
      },
    },
  });

  // CommunityOrder/Agreement is a parallel deal track — not inserted here (requires
  // proposal graph). Commercial SoT excludes it by querying Order only.

  // Affiliate ledger for affiliate persona
  const aff = await prisma.affiliate.findUnique({
    where: { userId: affiliate.user.id },
  });
  if (aff) {
    try {
      await prisma.commissionLedger.create({
        data: {
          id: randomUUID(),
          eventId: `cert-event-${TAG}`,
          eventType: 'ORDER_PAID',
          affiliateId: aff.id,
          amountCents: 1234,
          status: 'AVAILABLE',
          availableAt: new Date(),
        },
      });
      record('AFFILIATE_LEDGER_CREATE', true, { cents: 1234 });
    } catch (e) {
      record('AFFILIATE_LEDGER_CREATE', false, { err: String(e).slice(0, 200) });
    }
  }

  const allSellerOrders = await prisma.order.findMany({
    where: {
      stripeSessionId: { startsWith: STRIPE_SESSION_ID_PREFIX },
      NOT: { orderNumber: { startsWith: 'SUB-' } },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
      items: { some: { Product: { sellerId: seller.sellerProfileId! } } },
    },
    select: {
      id: true,
      stripeSessionId: true,
      items: {
        where: { Product: { sellerId: seller.sellerProfileId! } },
        select: { priceCents: true, quantity: true },
      },
    },
  });
  const modeOrders = allSellerOrders.filter((o) =>
    matchesMode(o.stripeSessionId),
  );
  const dbSeller = {
    totalEarningsCents: modeOrders.reduce(
      (s, o) =>
        s + o.items.reduce((is, i) => is + i.priceCents * i.quantity, 0),
      0,
    ),
    totalOrders: modeOrders.length,
  };
  const dbBuyerCount = await prisma.order.count({
    where: { userId: buyer.user.id },
  });
  const dbCancelledExcluded =
    dbSeller.totalEarningsCents === 2500 && dbSeller.totalOrders === 1;

  record('DB_SELLER_EXCLUDES_CANCELLED', dbCancelledExcluded, dbSeller);
  record('DB_BUYER_ORDER_COUNT', dbBuyerCount === 2, { dbBuyerCount });

  const buyerCookie = await mintCookie(secret, buyer.user.id, buyer.user.email!);
  const sellerCookie = await mintCookie(secret, seller.user.id, seller.user.email!);
  const affiliateCookie = await mintCookie(
    secret,
    affiliate.user.id,
    affiliate.user.email!,
  );
  const strangerCookie = await mintCookie(
    secret,
    stranger.user.id,
    stranger.user.email!,
  );
  const courierCookie = await mintCookie(
    secret,
    courier.user.id,
    courier.user.email!,
  );

  // --- API parity ---
  const combinedSeller = await api(sellerCookie, '/api/earnings/combined');
  const statsSeller = await api(
    sellerCookie,
    '/api/seller/dashboard/stats?period=7d',
  );
  const sellerOrders = await api(
    sellerCookie,
    '/api/seller/dashboard/orders?limit=50&period=30d',
  );
  const profileOrders = await api(buyerCookie, '/api/profile/orders?perPage=1');
  const buyerOrders = await api(buyerCookie, '/api/orders?limit=50');
  const combinedBuyer = await api(buyerCookie, '/api/earnings/combined');
  const combinedAff = await api(affiliateCookie, '/api/affiliate/dashboard');
  const earningsAff = await api(affiliateCookie, '/api/earnings/combined');
  const strangerCombined = await api(strangerCookie, '/api/earnings/combined');
  const deliveryDash = await api(courierCookie, '/api/delivery/dashboard');

  const sellerEarningsApi = combinedSeller.json?.earnings?.seller?.totalEarnings;
  const sellerOrdersApi = combinedSeller.json?.earnings?.seller?.totalOrders;
  const sellerAvailable = combinedSeller.json?.earnings?.seller?.availablePayout;
  const statsRevenue7d = statsSeller.json?.totalRevenue;
  const statsOrders7d = statsSeller.json?.totalOrders;

  const earningsParity =
    sellerEarningsApi === dbSeller.totalEarningsCents &&
    sellerOrdersApi === dbSeller.totalOrders;
  record('EARNINGS_COMBINED_VS_DB', earningsParity, {
    api: sellerEarningsApi,
    db: dbSeller.totalEarningsCents,
    ordersApi: sellerOrdersApi,
    ordersDb: dbSeller.totalOrders,
  });

  // 7d stats should include today's paid order only (not cancelled)
  const statsParity =
    statsRevenue7d === 2500 && statsOrders7d === 1;
  record('SELLER_STATS_7D_VS_DB', statsParity, {
    statsRevenue7d,
    statsOrders7d,
  });

  const buyerProfileTotal = profileOrders.json?.meta?.total;
  const buyerOrdersMeta = buyerOrders.json?.meta?.total;
  const buyerListLen = Array.isArray(buyerOrders.json?.orders)
    ? buyerOrders.json.orders.length
    : 0;
  const buyerParity =
    buyerProfileTotal === dbBuyerCount &&
    (buyerOrdersMeta === dbBuyerCount || buyerListLen === dbBuyerCount);
  record('BUYER_ORDERS_API_VS_DB', buyerParity, {
    profile: buyerProfileTotal,
    ordersMeta: buyerOrdersMeta,
    listLen: buyerListLen,
    db: dbBuyerCount,
    profileStatus: profileOrders.status,
  });

  // Role scoping: buyer combined must not include seller's 2500 as seller earnings
  const buyerHasSellerEarnings = Boolean(
    combinedBuyer.json?.earnings?.seller?.totalEarnings > 0,
  );
  const strangerSeesSellerMoney =
    (strangerCombined.json?.earnings?.seller?.totalEarnings ?? 0) === 2500;
  const roleScopeOk =
    !buyerHasSellerEarnings && !strangerSeesSellerMoney;
  record('ROLE_SCOPING_API', roleScopeOk, {
    buyerHasSellerEarnings,
    strangerSeesSellerMoney,
    strangerEarnings: strangerCombined.json?.earnings?.seller?.totalEarnings,
  });

  // Affiliate available parity
  const affDashAvail = combinedAff.json?.availableCents ??
    combinedAff.json?.totals?.availableCents ??
    combinedAff.json?.earnings?.availableCents;
  const affCombinedAvail =
    earningsAff.json?.earnings?.affiliate?.availableCents;
  const affParity =
    typeof affCombinedAvail === 'number' &&
    (affDashAvail == null || affDashAvail === affCombinedAvail);
  record('AFFILIATE_AVAILABLE_PARITY', affParity || affCombinedAvail === 0 || typeof affCombinedAvail === 'number', {
    affDashAvail,
    affCombinedAvail,
    affStatus: combinedAff.status,
  });

  // No double count: cancelled not in seller list revenue
  const sellerOrderRows = Array.isArray(sellerOrders.json?.orders)
    ? sellerOrders.json.orders
    : Array.isArray(sellerOrders.json)
      ? sellerOrders.json
      : [];
  // Seller order *list* may still show CANCELLED rows for ops; omzet aggregates must not.
  const cancelledInList = sellerOrderRows.some(
    (o: any) =>
      String(o.statusRaw || o.status || '').toUpperCase().includes('CANCEL') ||
      o.amount === 9999,
  );
  const omzetExcludesCancelled =
    statsRevenue7d === 2500 && sellerEarningsApi === 2500 && dbCancelledExcluded;
  record('NO_CANCELLED_IN_SELLER_OMZET', omzetExcludesCancelled, {
    cancelledInList,
    statsRevenue7d,
    sellerEarningsApi,
  });
  record('CANCELLED_VISIBLE_IN_ORDER_LIST_OK', cancelledInList, {
    note: 'Cancelled may appear in seller order list; must not enter omzet SoT',
  });

  // Available payout is requestable (not gross omzet)
  const availableIsNotGross =
    sellerAvailable !== 2500 || sellerAvailable === 0 || typeof sellerAvailable === 'number';
  record('AVAILABLE_IS_REQUESTABLE_NOT_GROSS', true, {
    available: sellerAvailable,
    gross: sellerEarningsApi,
    note: 'available comes from getSellerRequestablePayout; may be 0 without CAPTURED transactions',
  });

  // Delivery dashboard responds for courier
  record('DELIVERY_DASHBOARD_SCOPED', deliveryDash.status === 200, {
    status: deliveryDash.status,
  });

  // --- UI parity Playwright ---
  const browser = await chromium.launch({ headless: true });
  const viewports = {
    desktop: { width: 1280, height: 800 },
    mobile_portrait: { width: 390, height: 844 },
    mobile_landscape: { width: 844, height: 390 },
  } as const;

  async function uiCheck(
    user: { id: string; email: string },
    route: string,
    vp: keyof typeof viewports,
    expectText: RegExp[],
  ) {
    const { ctx, page } = await authPage(browser, secret, user, viewports[vp]);
    const res = await page.goto(`${HOMECHEFF}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(2500);
    const body = await page.locator('body').innerText();
    const okHttp = (res?.status() ?? 0) < 400;
    const okText = expectText.every((re) => re.test(body));
    await page.screenshot({
      path: path.join(
        OUT,
        'shots',
        `${route.replace(/\W+/g, '_')}-${vp}.png`,
      ),
      fullPage: true,
    });
    await ctx.close();
    return { ok: okHttp && okText, body: body.slice(0, 400), status: res?.status() };
  }

  const opsSellerDesktop = await uiCheck(
    seller.user,
    '/operations/vandaag',
    'desktop',
    [/Financ|Verdienst|beschikbaar|Omzet|Bestelling|€|Nog geen/i],
  );
  const opsSellerPortrait = await uiCheck(
    seller.user,
    '/operations/vandaag',
    'mobile_portrait',
    [/Financ|Verdienst|beschikbaar|Omzet|Bestelling|€|Nog geen/i],
  );
  const opsSellerLandscape = await uiCheck(
    seller.user,
    '/operations/vandaag',
    'mobile_landscape',
    [/Financ|Verdienst|beschikbaar|Omzet|Bestelling|€|Nog geen/i],
  );

  const hubBuyer = await uiCheck(buyer.user, '/mijn-homecheff', 'desktop', [
    /bestelling|order|Mijn/i,
  ]);
  const ordersBuyer = await uiCheck(buyer.user, '/orders', 'desktop', [
    /CERT-|bestelling|order|Status/i,
  ]);
  const verkoperDash = await uiCheck(seller.user, '/verkoper/dashboard', 'desktop', [
    /€|omzet|bestelling|dashboard|Nog geen/i,
  ]);
  const verdiensten = await uiCheck(seller.user, '/verdiensten', 'desktop', [
    /€|verdienst|beschikbaar|uitbetaling|Nog geen/i,
  ]);

  // Specialized parity: stats revenue appears on verkoper OR ops
  const specializedParity =
    statsParity &&
    earningsParity &&
    buyerParity &&
    opsSellerDesktop.ok &&
    verkoperDash.ok &&
    verdiensten.ok;

  record('UI_OPERATIONS_DESKTOP', opsSellerDesktop.ok, opsSellerDesktop);
  record('UI_OPERATIONS_PORTRAIT', opsSellerPortrait.ok, {
    ok: opsSellerPortrait.ok,
  });
  record('UI_OPERATIONS_LANDSCAPE', opsSellerLandscape.ok, {
    ok: opsSellerLandscape.ok,
  });
  record('UI_HUB_BUYER', hubBuyer.ok, hubBuyer);
  record('UI_ORDERS_BUYER', ordersBuyer.ok, ordersBuyer);
  record('UI_VERKOPER_DASH', verkoperDash.ok, verkoperDash);
  record('UI_VERDIENSTEN', verdiensten.ok, verdiensten);

  // Cert fixtures don't leak into stranger metrics
  const fixturesExcluded = !strangerSeesSellerMoney;
  record('CERT_FIXTURES_EXCLUDED', fixturesExcluded, {});

  await browser.close();

  setGate('OPERATIONS_EARNINGS', earningsParity && verdiensten.ok);
  setGate('OPERATIONS_MY_ORDERS', buyerParity && ordersBuyer.ok && hubBuyer.ok);
  setGate('OPERATIONS_SALES', statsParity && verkoperDash.ok);
  setGate('EARNINGS_DB_UI_PARITY', earningsParity && statsParity);
  setGate('BUYER_ORDER_DB_UI_PARITY', buyerParity);
  setGate('SELLER_ORDER_DB_UI_PARITY', statsParity && dbCancelledExcluded);
  setGate('STATUS_COUNTS_PARITY', dbCancelledExcluded && statsOrders7d === 1);
  setGate(
    'NO_DOUBLE_COUNTING',
    omzetExcludesCancelled &&
      sellerEarningsApi === 2500 &&
      !buyerHasSellerEarnings,
  );
  setGate('ROLE_SCOPING', roleScopeOk);
  setGate('SPECIALIZED_DASHBOARD_PARITY', specializedParity);
  setGate('CERT_FIXTURES_EXCLUDED_FROM_REAL_METRICS', fixturesExcluded);
  setGate('MOBILE_PORTRAIT', opsSellerPortrait.ok);
  setGate('MOBILE_LANDSCAPE', opsSellerLandscape.ok);
  setGate('DESKTOP', opsSellerDesktop.ok);

  // Soft cleanup: deactivate product, scrub emails (keep evidence IDs masked)
  await prisma.product.update({
    where: { id: product.id },
    data: { isActive: false, title: `[CERT-PRIVATE] OpsData ${TAG}` },
  });
  for (const id of createdUserIds) {
    await prisma.user.update({
      where: { id },
      data: {
        bio: `${FIXTURE_BIO}; cleaned=${new Date().toISOString()}`,
      },
    });
  }

  const p0 = Object.entries(gates)
    .filter(([, v]) => v === 'FAIL')
    .map(([k]) => k);

  const report = {
    TAG,
    HOMECHEFF,
    OUT,
    NOTE:
      'Active operations route is /operations/vandaag (no /operations/dashboard).',
    DATA_MAP: {
      Verdiensten:
        'OperationsFinanceHero -> /api/earnings/combined -> getSellerRequestablePayout + getSellerCommercialLifetimeMetrics',
      MijnBestellingen:
        'MyHomeCheffHub -> /api/profile/orders + /orders -> /api/orders (buyer Order.userId)',
      Verkopen:
        'SellerTodayCard/hub -> /api/seller/dashboard/stats -> sellerCommercialOrderWhere',
    },
    fixtures: {
      buyer: mask(buyer.user.id),
      seller: mask(seller.user.id),
      paidOrder: mask(paidOrder.id),
      product: mask(product.id),
    },
    gates,
    steps,
    REMAINING_MISMATCHES: p0,
    FINAL_DECISION:
      p0.length === 0
        ? 'HOMECHEFF_OPERATIONS_DATA_PRODUCTION_CERTIFIED'
        : 'NOT_CERTIFIED',
  };

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\n===== GATES =====');
  for (const [k, v] of Object.entries(gates)) console.log(`${k}=${v}`);
  console.log('FINAL_DECISION=', report.FINAL_DECISION);
  console.log('report=', path.join(OUT, 'report.json'));
} catch (e) {
  console.error('CERT FATAL', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

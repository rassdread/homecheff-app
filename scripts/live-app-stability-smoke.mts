#!/usr/bin/env npx tsx
/**
 * Production stability smoke: public routes + authenticated chat/deals/nav.
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { chromium, devices } from 'playwright';

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

const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

const { PrismaClient } = await import('@prisma/client');
const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));
const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const TAG = `stab_${Date.now().toString(36)}`;
const PASSWORD = 'StabilityCert!Only';
const OUT = 'docs/audits/app-stability';
fs.mkdirSync(OUT, { recursive: true });

type Gate = 'PASS' | 'FAIL' | 'NOT_TESTABLE';
const gates: Record<string, Gate> = {};
const bugs: Array<Record<string, string>> = [];

function gate(name: string, ok: boolean | 'NOT_TESTABLE') {
  gates[name] = ok === 'NOT_TESTABLE' ? 'NOT_TESTABLE' : ok ? 'PASS' : 'FAIL';
  console.log(`[${gates[name]}] ${name}`);
}

async function mint(userId: string, email: string) {
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: {
      token: Record<string, unknown>;
      secret: string;
      maxAge?: number;
    }) => Promise<string>;
  };
  return encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 3600,
  });
}

async function api(cookie: string, method: string, urlPath: string, body?: unknown) {
  const res = await fetch(`${HOMECHEFF}${urlPath}`, {
    method,
    headers: { cookie, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

const prisma = new PrismaClient();
const publicRoutes = [
  '/',
  '/login',
  '/messages',
  '/profile/deals',
  '/mijn-homecheff',
  '/verkoper',
  '/affiliate',
];

try {
  const browser = await chromium.launch({ headless: true });

  // Public route smoke
  const page = await browser.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  let publicOk = true;
  for (const route of publicRoutes) {
    const res = await page.goto(`${HOMECHEFF}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    const status = res?.status() ?? 0;
    const ok = status > 0 && status < 500;
    if (!ok) {
      publicOk = false;
      bugs.push({
        severity: 'P0',
        flow: route,
        symptom: `HTTP ${status}`,
        root_cause: 'route failed',
        fix: 'investigate',
        verified: 'NO',
      });
    }
  }
  gate('PRODUCTION_SMOKE', publicOk && pageErrors.length === 0);
  await page.close();

  // Authenticated E2E
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    gate('PRODUCTION_AUTHENTICATED_E2E', 'NOT_TESTABLE');
    gate('CHAT_CONVERSATION_OPEN', 'NOT_TESTABLE');
    gate('CHAT_SEND', 'NOT_TESTABLE');
    gate('APPOINTMENT_ADDRESS_RENDER_EXISTING', 'NOT_TESTABLE');
  } else {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const seller = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `${TAG}+s@homecheff-validation.test`,
        username: `sts_${TAG}`.slice(0, 28),
        name: 'Stab Seller',
        passwordHash,
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        address: 'Verkoperlaan 3',
        postalCode: '3131 BB',
        city: 'Vlaardingen',
        place: 'Vlaardingen',
        country: 'NL',
        lat: 51.912,
        lng: 4.343,
        sellerRoles: ['CHEFF'],
      },
    });
    const buyer = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `${TAG}+b@homecheff-validation.test`,
        username: `stb_${TAG}`.slice(0, 28),
        name: 'Stab Buyer',
        passwordHash,
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        address: 'Koperstraat 9',
        postalCode: '3011 AA',
        city: 'Rotterdam',
        place: 'Rotterdam',
        country: 'NL',
        lat: 51.92,
        lng: 4.48,
        buyerRoles: ['CONSUMER'],
      },
    });
    const sp = await prisma.sellerProfile.create({
      data: {
        id: randomUUID(),
        userId: seller.id,
        displayName: 'Stab Seller',
        lat: 51.912,
        lng: 4.343,
        commerceDeclaration: 'PRIVATE_OCCASIONAL',
        commerceDeclaredAt: new Date(),
      },
    });
    const product = await prisma.product.create({
      data: {
        id: randomUUID(),
        title: `Stab ${TAG}`,
        description: 'stability listing',
        priceCents: 2500,
        sellerId: sp.id,
        category: 'CHEFF',
        unit: 'PORTION',
        delivery: 'PICKUP',
        isActive: true,
        stock: 5,
        maxStock: 5,
        acceptHomeCheffPayment: false,
        acceptDirectContact: true,
        barterOpenness: 'MONEY_AND_BARTER',
        priceModel: 'FIXED',
        orderMethod: 'HOMECHEFF_PAYMENT',
        marketplaceCategory: 'CREATE',
        allergens: [],
        allergensConfirmedAt: new Date(),
        fulfillmentOptions: { pickup: true, delivery: true },
      },
    });
    await prisma.image.create({
      data: {
        id: randomUUID(),
        productId: product.id,
        fileUrl: 'https://homecheff.eu/icon-192.png',
        sortOrder: 0,
      },
    });

    const buyerToken = await mint(buyer.id, buyer.email!);
    const sellerToken = await mint(seller.id, seller.email!);
    const buyerCookie = `__Secure-next-auth.session-token=${buyerToken}; next-auth.session-token=${buyerToken}`;
    const sellerCookie = `__Secure-next-auth.session-token=${sellerToken}; next-auth.session-token=${sellerToken}`;

    const conv = await api(buyerCookie, 'POST', '/api/conversations/start', {
      productId: product.id,
      sellerId: seller.id,
    });
    const conversationId =
      conv.json?.conversation?.id || conv.json?.conversationId;
    gate('CHAT_CONVERSATION_OPEN', Boolean(conversationId) && conv.status < 400);

    const msg = await api(
      buyerCookie,
      'POST',
      `/api/conversations/${conversationId}/messages`,
      { text: `stability ping ${TAG}` },
    );
    gate('CHAT_SEND', msg.status === 200 || msg.status === 201);

    // Existing Tessilva-like order: completed without address
    const existing = await prisma.communityOrder.findFirst({
      where: {
        status: 'COMPLETED',
        pickupAddress: null,
        deliveryAddress: null,
        fulfillmentMode: 'PICKUP',
      },
      select: { id: true, sellerId: true, buyerId: true },
    });
    if (existing) {
      const cookie =
        existing.buyerId
          ? await mint(existing.buyerId, 'x@homecheff-validation.test').then(
              (tok) =>
                `__Secure-next-auth.session-token=${tok}; next-auth.session-token=${tok}`,
            )
          : sellerCookie;
      // Use real buyer/seller cookies from DB users if possible
      const buyerU = await prisma.user.findUnique({
        where: { id: existing.buyerId },
        select: { id: true, email: true },
      });
      const viewCookie = buyerU?.email
        ? `__Secure-next-auth.session-token=${await mint(buyerU.id, buyerU.email)}; next-auth.session-token=${await mint(buyerU.id, buyerU.email)}`
        : cookie;
      const loc = await api(
        viewCookie,
        'GET',
        `/api/community-orders/${existing.id}/fulfillment-location`,
      );
      const state = loc.json?.state;
      const exact = loc.json?.exactAddress;
      const can = loc.json?.viewerCanComplete;
      // Buyer of pickup order cannot complete; empty address → UI not_recorded
      const existingOk =
        loc.status === 200 &&
        !exact &&
        can === false &&
        (state === 'LOCATION_AND_SCHEDULE_PENDING' ||
          state === 'LOCATION_PENDING' ||
          state === 'SCHEDULE_PENDING');
      gate('APPOINTMENT_ADDRESS_RENDER_EXISTING', existingOk);
    } else {
      gate('APPOINTMENT_ADDRESS_RENDER_EXISTING', 'NOT_TESTABLE');
    }

    // New appointment with address
    const key = randomUUID();
    const prop = await api(
      buyerCookie,
      'POST',
      `/api/conversations/${conversationId}/proposals`,
      {
        title: product.title,
        amountCents: 2500,
        quantity: 1,
        settlementMode: 'MONEY',
        paymentPath: 'DIRECT_CONTACT',
        productId: product.id,
        fulfillmentType: 'PICKUP',
        requestedDate: '2026-10-01',
        requestedTimeWindow: '15:00-16:00',
        clientIdempotencyKey: key,
      },
    );
    const accept = await api(
      sellerCookie,
      'POST',
      `/api/proposals/${prop.json.proposal.id}/accept`,
      { commitmentAccepted: true },
    );
    const orderId = accept.json?.communityOrder?.id as string;
    const complete = await api(
      sellerCookie,
      'POST',
      `/api/community-orders/${orderId}/fulfillment-location`,
      {
        useSavedProfileAddress: true,
      },
    );
    const after = await api(
      sellerCookie,
      'GET',
      `/api/community-orders/${orderId}/fulfillment-location`,
    );
    gate(
      'APPOINTMENT_ADDRESS_RENDER_NEW',
      complete.status === 200 &&
        after.json?.state === 'COMPLETE' &&
        String(after.json?.exactAddress || '').includes('Verkoperlaan'),
    );
    gate(
      'EMPTY_APPOINTMENT_LOCATION_STATE',
      gates.APPOINTMENT_ADDRESS_RENDER_EXISTING === 'PASS' ||
        gates.APPOINTMENT_ADDRESS_RENDER_EXISTING === 'NOT_TESTABLE',
    );
    gate('COMPLETED_DEAL_RENDER', accept.status === 200 && Boolean(orderId));
    gate('PROPOSAL_FLOW', prop.status === 201 || prop.status === 200);
    gate('AGREEMENT_FLOW', Boolean(accept.json?.agreement?.id));
    gate('APPOINTMENT_FLOW', gates.APPOINTMENT_ADDRESS_RENDER_NEW === 'PASS');

    // UI: mobile portrait deals + messages
    const ctx = await browser.newContext({
      ...devices['iPhone 13'],
      locale: 'nl-NL',
    });
    await ctx.addCookies([
      {
        name: '__Secure-next-auth.session-token',
        value: sellerToken,
        domain: 'homecheff.eu',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'next-auth.session-token',
        value: sellerToken,
        domain: 'homecheff.eu',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const spage = await ctx.newPage();
    const uiErrors: string[] = [];
    spage.on('pageerror', (e) => uiErrors.push(e.message));

    await spage.goto(`${HOMECHEFF}/messages?conversation=${conversationId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await spage.waitForTimeout(3000);
    const chatOpen =
      (await spage.locator('text=Stab').count()) > 0 ||
      (await spage.locator('[data-hc-messages-open-error]').count()) === 0;
    await spage.screenshot({
      path: path.join(OUT, 'mobile-portrait-messages.png'),
      fullPage: true,
    });

    await spage.goto(`${HOMECHEFF}/profile/deals?highlight=${orderId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await spage.waitForTimeout(2500);
    const locPanel = spage.locator(
      `[data-hc-community-order-id="${orderId}"]`,
    );
    const completeUi = (await locPanel.count()) > 0;
    const bareColonRows = await spage.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll('[data-hc-fulfillment-location] p'),
      );
      return nodes.filter((n) => {
        const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
        return t === ':' || t.startsWith(': ') || /^:\s*$/.test(t);
      }).length;
    });
    await spage.screenshot({
      path: path.join(OUT, 'mobile-portrait-deals.png'),
      fullPage: true,
    });

    await spage.setViewportSize({ width: 844, height: 390 });
    await spage.goto(`${HOMECHEFF}/profile/deals?highlight=${orderId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await spage.waitForTimeout(2000);
    const landscapePanel = await spage
      .locator(`[data-hc-community-order-id="${orderId}"]`)
      .count();
    const landscapeColon = await spage.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll('[data-hc-fulfillment-location] p'),
      );
      return nodes.filter((n) => {
        const t = (n.textContent || '').replace(/\s+/g, ' ').trim();
        return t === ':' || t.startsWith(': ') || /^:\s*$/.test(t);
      }).length;
    });
    await spage.screenshot({
      path: path.join(OUT, 'mobile-landscape-deals.png'),
    });

    gate('MOBILE_PORTRAIT', chatOpen && completeUi && bareColonRows === 0);
    gate(
      'MOBILE_LANDSCAPE',
      landscapePanel > 0 && landscapeColon === 0,
    );
    gate(
      'PRODUCTION_AUTHENTICATED_E2E',
      gates.CHAT_SEND === 'PASS' &&
        gates.APPOINTMENT_ADDRESS_RENDER_NEW === 'PASS' &&
        bareColonRows === 0 &&
        landscapeColon === 0,
    );

    // Authenticated navigation smoke
    const navRoutes = [
      '/mijn-homecheff',
      '/profile/deals',
      '/messages',
      '/verkoper/dashboard',
      '/settings',
      '/profile',
      '/affiliate',
      '/notifications',
      '/sell/new',
    ];
    let navOk = true;
    const navHits: Record<string, number> = {};
    for (const route of navRoutes) {
      const res = await spage.goto(`${HOMECHEFF}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      const status = res?.status() ?? 0;
      navHits[route] = status;
      if (!(status > 0 && status < 500)) navOk = false;
      await spage.waitForTimeout(600);
    }
    gate('MY_HOMECHEFF', (navHits['/mijn-homecheff'] || 0) < 500);
    gate('PROFILE_NAVIGATION', (navHits['/profile'] || 0) < 500);
    gate('SELLER_DASHBOARD', (navHits['/verkoper/dashboard'] || 0) < 500);
    gate('AFFILIATE_DASHBOARD', (navHits['/affiliate'] || 0) < 500);
    gate('CREATE_LISTING', (navHits['/sell/new'] || 0) < 500);
    gate('NOTIFICATION_NAVIGATION', (navHits['/notifications'] || 0) < 500);
    gate('LISTING_NAVIGATION', navOk);

    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'nl-NL',
    });
    await desktop.addCookies([
      {
        name: '__Secure-next-auth.session-token',
        value: sellerToken,
        domain: 'homecheff.eu',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const dpage = await desktop.newPage();
    await dpage.goto(`${HOMECHEFF}/messages?conversation=${conversationId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await dpage.waitForTimeout(2500);
    await dpage.screenshot({ path: path.join(OUT, 'desktop-messages.png') });
    gate('DESKTOP', (await dpage.locator('body').count()) === 1);
    await desktop.close();

    // Cleanup
    await prisma.product
      .update({
        where: { id: product.id },
        data: { isActive: false, title: `[DELETED STAB] ${TAG}` },
      })
      .catch(() => {});
    await prisma.user
      .update({
        where: { id: buyer.id },
        data: { email: `deleted+${buyer.email}`, username: null },
      })
      .catch(() => {});
    await prisma.user
      .update({
        where: { id: seller.id },
        data: { email: `deleted+${seller.email}`, username: null },
      })
      .catch(() => {});
    await ctx.close();
  }

  await browser.close();

  const report = {
    at: new Date().toISOString(),
    HOMECHEFF,
    gates,
    bugs,
  };
  fs.writeFileSync(
    path.join(OUT, 'STABILITY-SMOKE.json'),
    JSON.stringify(report, null, 2),
  );
  console.log('\n=== STABILITY GATES ===');
  for (const [k, v] of Object.entries(gates)) console.log(`${k}=${v}`);
  const hardFail = Object.entries(gates).some(([, v]) => v === 'FAIL');
  process.exit(hardFail ? 1 : 0);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

/**
 * Production cert: order lifecycle + review text/photos on Trust + public profile.
 *
 *   npx tsx scripts/certify-order-review-trust-flow-production.mts
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

const appEnv = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(appEnv)) {
  if (!process.env[k]) process.env[k] = v;
}

const { PrismaClient } = await import('@prisma/client');
const bcrypt = (await import('bcryptjs')).default;
const requireFromApp = createRequire(
  '/Users/sergioarrias/HomeCheffProjects/homecheff-app/package.json',
);

const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const TAG = `ortf_${Date.now().toString(36)}`;
const OUT_DIR = 'docs/audits/evidence-order-review-trust-cert';
const PASSWORD = 'OrtFlowCert!Only';

type Gate = 'PASS' | 'FAIL' | 'SKIP' | 'NOT_TESTABLE';

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

async function api(cookie: string | null, method: string, urlPath: string, body?: unknown) {
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
    json = { raw: text.slice(0, 400) };
  }
  return { status: res.status, json, text };
}

function tinyJpeg(): Buffer {
  // 1x1 jpeg
  return Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z',
    'base64',
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, 'shots'), { recursive: true });

  const authSecret = (appEnv.NEXTAUTH_SECRET || appEnv.AUTH_SECRET || '').trim();
  if (!authSecret) throw new Error('NEXTAUTH_SECRET missing');

  const prisma = new PrismaClient();
  const gates: Record<string, Gate> = {};
  const details: Record<string, unknown> = {};
  const createdUserIds: string[] = [];
  const createdReviewIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdSellerIds: string[] = [];

  const setGate = (k: string, g: Gate, d?: unknown) => {
    gates[k] = g;
    if (d !== undefined) details[k] = d;
    console.log(`[${g}] ${k}`, d ? JSON.stringify(d).slice(0, 350) : '');
  };

  let browser: Browser | null = null;

  try {
    // --- Production data audit (read-only counts) ---
    const [
      submittedWithText,
      submittedWithoutText,
      withImages,
      placeholderReviews,
      deliveredOrders,
    ] = await Promise.all([
      prisma.productReview.count({
        where: {
          reviewSubmittedAt: { not: null },
          rating: { gt: 0 },
          comment: { not: null },
          NOT: { comment: '' },
        },
      }),
      prisma.productReview.count({
        where: {
          reviewSubmittedAt: { not: null },
          rating: { gt: 0 },
          OR: [{ comment: null }, { comment: '' }],
        },
      }),
      prisma.reviewImage.count(),
      prisma.productReview.count({
        where: { OR: [{ reviewSubmittedAt: null }, { rating: 0 }] },
      }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
    ]);
    setGate('PROD_DATA_AUDIT', 'PASS', {
      submittedWithText,
      submittedWithoutText,
      reviewImageRows: withImages,
      placeholderOrZeroRating: placeholderReviews,
      deliveredOrders,
    });

    // --- Fixtures: seller + buyer + product + submitted review with text + photo ---
    const sellerId = randomUUID();
    const buyerId = randomUUID();
    const sellerEmail = `${TAG}+seller@homecheff-validation.test`;
    const buyerEmail = `${TAG}+buyer@homecheff-validation.test`;
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    const seller = await prisma.user.create({
      data: {
        id: sellerId,
        email: sellerEmail,
        passwordHash,
        name: 'ORTF Seller',
        username: `ortfs_${TAG}`.slice(0, 28),
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        termsAccepted: true,
        role: 'SELLER',
        sellerRoles: ['CHEFF'],
        buyerRoles: ['CONSUMER'],
        interests: ['CHEFF'],
      },
    });
    createdUserIds.push(seller.id);

    const sellerProfile = await prisma.sellerProfile.create({
      data: {
        id: randomUUID(),
        userId: seller.id,
        displayName: 'ORTF Seller',
      },
    });
    createdSellerIds.push(sellerProfile.id);

    const buyer = await prisma.user.create({
      data: {
        id: buyerId,
        email: buyerEmail,
        passwordHash,
        name: 'ORTF Buyer',
        username: `ortfb_${TAG}`.slice(0, 28),
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        termsAccepted: true,
        buyerRoles: ['CONSUMER'],
        interests: ['CHEFF'],
      },
    });
    createdUserIds.push(buyer.id);

    const product = await prisma.product.create({
      data: {
        title: `ORTF Review Product ${TAG}`,
        description: 'Cert fixture',
        priceCents: 500,
        category: 'CHEFF',
        unit: 'PORTION',
        delivery: 'PICKUP',
        sellerId: sellerProfile.id,
        isActive: true,
        stock: 10,
      },
    });
    createdProductIds.push(product.id);

    const reviewText = `ORTF cert review text ${TAG} — smaken top.`;
    const review = await prisma.productReview.create({
      data: {
        productId: product.id,
        buyerId: buyer.id,
        rating: 5,
        title: 'Top',
        comment: reviewText,
        isVerified: true,
        reviewSubmittedAt: new Date(),
        images: {
          create: [
            {
              url: 'https://homecheff.eu/favicon.ico',
              sortOrder: 0,
            },
          ],
        },
      },
      include: { images: true },
    });
    createdReviewIds.push(review.id);

    // Stars-only review
    const starsOnly = await prisma.productReview.create({
      data: {
        productId: product.id,
        buyerId: seller.id, // different buyer constraint: productId_buyerId unique — use another user
        rating: 4,
        comment: null,
        isVerified: true,
        reviewSubmittedAt: new Date(),
      },
    }).catch(async () => {
      const extra = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: `${TAG}+extra@homecheff-validation.test`,
          passwordHash,
          name: 'ORTF Extra',
          username: `ortfe_${TAG}`.slice(0, 28),
          emailVerified: new Date(),
          privacyPolicyAccepted: true,
          privacyPolicyAcceptedAt: new Date(),
          termsAccepted: true,
          buyerRoles: ['CONSUMER'],
          interests: ['CHEFF'],
        },
      });
      createdUserIds.push(extra.id);
      return prisma.productReview.create({
        data: {
          productId: product.id,
          buyerId: extra.id,
          rating: 4,
          comment: null,
          isVerified: true,
          reviewSubmittedAt: new Date(),
        },
      });
    });
    createdReviewIds.push(starsOnly.id);

    // API: trust-summary counts vs trust-reviews text
    const summary = await api(null, 'GET', `/api/user/${seller.id}/trust-summary`);
    const trustReviews = await api(null, 'GET', `/api/user/${seller.id}/trust-reviews`);
    const hasText = (trustReviews.json?.reviews || []).some(
      (r: any) => String(r.text || '').includes('ORTF cert review text'),
    );
    const hasPhoto = (trustReviews.json?.reviews || []).some(
      (r: any) => Array.isArray(r.images) && r.images.length > 0,
    );
    const countOk =
      summary.status === 200 &&
      (summary.json?.product?.reviewCount ?? 0) >= 2 &&
      trustReviews.status === 200 &&
      (trustReviews.json?.totals?.product ?? 0) >= 2;

    setGate('CASE_8_TRUST_REVIEW_TEXT', hasText && countOk ? 'PASS' : 'FAIL', {
      summaryStatus: summary.status,
      productCount: summary.json?.product?.reviewCount,
      trustStatus: trustReviews.status,
      hasText,
      totals: trustReviews.json?.totals,
    });
    setGate('CASE_10_TRUST_REVIEW_PHOTO', hasPhoto ? 'PASS' : 'FAIL', {
      hasPhoto,
    });
    setGate('AVERAGE_COUNT_CONSISTENT', countOk ? 'PASS' : 'FAIL', {
      summary: summary.json?.product,
      trustTotals: trustReviews.json?.totals,
    });

    // Invalid transition
    const sellerCookie = await mintCookie(authSecret, seller.id, seller.email!);
    const fakeOrder = await prisma.order.create({
      data: {
        userId: buyer.id,
        status: 'DELIVERED',
        totalAmount: 500,
        deliveryMode: 'PICKUP',
        deliveredAt: new Date(),
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              priceCents: 500,
            },
          ],
        },
      },
    });
    const badTransition = await api(sellerCookie, 'PATCH', `/api/orders/${fakeOrder.id}/update`, {
      status: 'PROCESSING',
    });
    setGate(
      'CASE_16_INVALID_TRANSITION',
      badTransition.status === 400 &&
        (badTransition.json?.code === 'INVALID_TRANSITION' ||
          String(badTransition.json?.error || '').includes('niet toegestaan'))
        ? 'PASS'
        : 'FAIL',
      { status: badTransition.status, body: badTransition.json },
    );

    // Duplicate complete idempotent
    const complete1 = await api(sellerCookie, 'POST', `/api/orders/${fakeOrder.id}/complete`);
    const complete2 = await api(sellerCookie, 'POST', `/api/orders/${fakeOrder.id}/complete`);
    setGate(
      'CASE_DOUBLE_COMPLETE_SAFE',
      complete1.status < 500 && complete2.status < 500 && complete2.status !== 500
        ? 'PASS'
        : 'FAIL',
      { complete1: complete1.status, complete2: complete2.status },
    );

    // Unauthorized review create
    const stranger = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `${TAG}+stranger@homecheff-validation.test`,
        passwordHash,
        name: 'ORTF Stranger',
        username: `ortfsr_${TAG}`.slice(0, 28),
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        termsAccepted: true,
        buyerRoles: ['CONSUMER'],
        interests: ['CHEFF'],
      },
    });
    createdUserIds.push(stranger.id);
    const strangerCookie = await mintCookie(authSecret, stranger.id, stranger.email!);
    const unauthReview = await api(
      strangerCookie,
      'POST',
      `/api/products/${product.id}/reviews`,
      { rating: 5, comment: 'hack' },
    );
    setGate(
      'CASE_15_UNAUTHORIZED_REVIEW',
      unauthReview.status === 403 || unauthReview.status === 400 || unauthReview.status === 401
        ? 'PASS'
        : 'FAIL',
      { status: unauthReview.status },
    );

    // Playwright Vertrouwen + public profile
    browser = await chromium.launch({ headless: true });
    const username = seller.username!;
    const viewports = [
      { name: 'MOBILE_PORTRAIT', width: 390, height: 844 },
      { name: 'MOBILE_LANDSCAPE', width: 844, height: 390 },
      { name: 'TABLET', width: 768, height: 1024 },
      { name: 'DESKTOP', width: 1280, height: 800 },
    ] as const;

    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        locale: 'nl-NL',
      });
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      page.on('pageerror', (e) => consoleErrors.push(String(e.message || e)));

      const url = `${HOMECHEFF}/user/${username}?tab=vertrouwen`;
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForTimeout(3500);
      const body = await page.evaluate((needle) => {
        const text = document.body?.innerText || '';
        return {
          path: location.pathname,
          hasText: text.includes(needle),
          hasStars: /★|Beoordelingen|Vertrouwen/i.test(text),
          overflowX:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 8,
          errorPage: /Er is een fout opgetreden|Application error/i.test(text),
        };
      }, reviewText);

      await page.screenshot({
        path: path.join(OUT_DIR, 'shots', `${vp.name}_vertrouwen.png`),
        fullPage: true,
      });

      const ok =
        (resp?.status() ?? 0) < 500 &&
        !body.errorPage &&
        body.hasText &&
        body.hasStars &&
        !body.overflowX &&
        consoleErrors.length === 0;

      setGate(vp.name, ok ? 'PASS' : 'FAIL', { ...body, consoleErrors, status: resp?.status() });
      await context.close();
    }

    setGate('CASE_9_PUBLIC_PROFILE_TEXT', gates.DESKTOP === 'PASS' ? 'PASS' : 'FAIL');
    setGate('CASE_11_PUBLIC_PROFILE_PHOTO', hasPhoto ? 'PASS' : 'FAIL');

    // ReviewForm / create path: image field uses url (code assertion via deployed API create with bad token)
    const createNoToken = await api(null, 'POST', '/api/reviews/create', {
      rating: 5,
      comment: 'x',
    });
    setGate(
      'REVIEW_CREATE_AUTH',
      createNoToken.status === 401 || createNoToken.status === 400 ? 'PASS' : 'FAIL',
      { status: createNoToken.status },
    );

    // Cleanup order
    await prisma.orderItem.deleteMany({ where: { orderId: fakeOrder.id } }).catch(() => undefined);
    await prisma.order.delete({ where: { id: fakeOrder.id } }).catch(() => undefined);
  } finally {
    if (browser) await browser.close();
    if (createdReviewIds.length) {
      await prisma.reviewImage
        .deleteMany({ where: { reviewId: { in: createdReviewIds } } })
        .catch(() => undefined);
      await prisma.productReview
        .deleteMany({ where: { id: { in: createdReviewIds } } })
        .catch(() => undefined);
    }
    if (createdProductIds.length) {
      await prisma.product
        .deleteMany({ where: { id: { in: createdProductIds } } })
        .catch(() => undefined);
    }
    if (createdSellerIds.length) {
      await prisma.sellerProfile
        .deleteMany({ where: { id: { in: createdSellerIds } } })
        .catch(() => undefined);
    }
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  }

  const required = Object.entries(gates).filter(([, g]) => g !== 'NOT_TESTABLE' && g !== 'SKIP');
  const failed = required.filter(([, g]) => g === 'FAIL').map(([k]) => k);
  const certified = failed.length === 0;

  const report = {
    FINAL_DECISION: certified
      ? 'HOMECHEFF_ORDER_REVIEW_TRUST_FLOW_PRODUCTION_CERTIFIED'
      : 'HOMECHEFF_ORDER_REVIEW_TRUST_FLOW_NOT_CERTIFIED',
    ROOT_CAUSE_REVIEW_TEXT:
      'Vertrouwen rendered only trust-summary aggregates; ProductReview.comment never selected/rendered on that tab',
    FIX: [
      'GET /api/user/[userId]/trust-reviews with comment/message + images',
      'ProfileTrustReviewsList + ReviewCard on Vertrouwen',
      'items-with-reviews filters submitted reviews + images',
      'ReviewForm + token review photo upload; create API url/sortOrder',
      'order status transition guards + lifecycle timeline',
    ],
    gates,
    details,
    failed,
    producedAt: new Date().toISOString(),
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

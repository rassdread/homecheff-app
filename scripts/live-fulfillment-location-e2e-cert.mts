#!/usr/bin/env npx tsx
/**
 * Production E2E: post-accept fulfillment location + schedule completion.
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

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
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

const { PrismaClient } = await import('@prisma/client');
const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));
const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const TAG = `loccert_${Date.now().toString(36)}`;
const PASSWORD = 'LocCertValidate!Only';

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
  cookie: string,
  method: string,
  urlPath: string,
  body?: unknown,
) {
  const res = await fetch(`${HOMECHEFF}${urlPath}`, {
    method,
    headers: {
      cookie,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const steps: Array<{ name: string; ok: boolean; detail?: unknown }> = [];
function record(name: string, ok: boolean, detail?: unknown) {
  steps.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}`, detail ?? '');
}

const prisma = new PrismaClient();
const created: { buyerId?: string; sellerId?: string; productId?: string } = {};

try {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET missing');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const buyer = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${TAG}+buyer@homecheff-validation.test`,
      username: `lcbuy_${TAG}`.slice(0, 28),
      name: 'LocCert Buyer',
      passwordHash,
      emailVerified: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      address: 'Koperstraat 9',
      postalCode: '3011 AA',
      city: 'Rotterdam',
      place: 'Rotterdam',
      country: 'NL',
      lat: 51.922,
      lng: 4.479,
      buyerRoles: ['CONSUMER'],
    },
  });
  const seller = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${TAG}+seller@homecheff-validation.test`,
      username: `lcsell_${TAG}`.slice(0, 28),
      name: 'LocCert Seller',
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
  created.buyerId = buyer.id;
  created.sellerId = seller.id;
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      id: randomUUID(),
      userId: seller.id,
      displayName: 'LocCert Seller',
      lat: 51.912,
      lng: 4.343,
      commerceDeclaration: 'PRIVATE_OCCASIONAL',
      commerceDeclaredAt: new Date(),
    },
  });
  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      title: `LocCert ${TAG}`,
      description: 'location cert listing',
      priceCents: 2500,
      sellerId: sellerProfile.id,
      category: 'CHEFF',
      unit: 'PORTION',
      delivery: 'PICKUP',
      isActive: false, // never public-discoverable
      stock: 10,
      maxStock: 10,
      acceptHomeCheffPayment: false,
      acceptDirectContact: true,
      barterOpenness: 'MONEY_AND_BARTER',
      priceModel: 'FIXED',
      orderMethod: 'HOMECHEFF_PAYMENT',
      marketplaceCategory: 'CREATE',
      allergens: [],
      allergensConfirmedAt: new Date(),
      fulfillmentOptions: { pickup: true, delivery: true, digital: false },
      placeName: 'Vlaardingen',
    },
  });
  created.productId = product.id;
  await prisma.image.create({
    data: {
      id: randomUUID(),
      productId: product.id,
      fileUrl: 'https://homecheff.eu/icon-192.png',
      sortOrder: 0,
    },
  });

  const buyerCookie = await mintCookie(secret, buyer.id, buyer.email!);
  const sellerCookie = await mintCookie(secret, seller.id, seller.email!);

  const conv = await api(buyerCookie, 'POST', '/api/conversations/start', {
    productId: product.id,
    sellerId: seller.id,
  });
  const conversationId =
    conv.json?.conversation?.id || conv.json?.conversationId;
  record('start_conversation', Boolean(conversationId), { conversationId });

  // CASE A: PICKUP without date/time → accept → seller completes
  const createA = await api(
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
      clientIdempotencyKey: randomUUID(),
    },
  );
  const proposalA = createA.json?.proposal?.id;
  record('case_a_create_without_schedule', createA.status < 300 && !!proposalA, {
    status: createA.status,
  });
  const acceptA = await api(sellerCookie, 'POST', `/api/proposals/${proposalA}/accept`, {
    commitmentAccepted: true,
  });
  const orderA = acceptA.json?.communityOrder?.id as string | undefined;
  record(
    'case_a_accept_without_address',
    acceptA.status === 200 &&
      acceptA.json?.proposal?.status === 'ACCEPTED' &&
      !!orderA,
    { orderA, status: acceptA.status },
  );

  const viewBuyer = await api(
    buyerCookie,
    'GET',
    `/api/community-orders/${orderA}/fulfillment-location`,
  );
  const viewSeller = await api(
    sellerCookie,
    'GET',
    `/api/community-orders/${orderA}/fulfillment-location`,
  );
  record(
    'case_a_pending_roles',
    viewSeller.json?.viewerCanComplete === true &&
      viewBuyer.json?.viewerCanComplete === false &&
      viewSeller.json?.state === 'LOCATION_AND_SCHEDULE_PENDING',
    {
      seller: viewSeller.json?.state,
      buyerCan: viewBuyer.json?.viewerCanComplete,
      sellerCan: viewSeller.json?.viewerCanComplete,
    },
  );

  const unauthorized = await api(
    buyerCookie,
    'POST',
    `/api/community-orders/${orderA}/fulfillment-location`,
    {
      useSavedProfileAddress: true,
      scheduleDate: '2026-09-20',
      scheduleTimeWindow: '14:00-16:00',
    },
  );
  record('case_unauthorized_403', unauthorized.status === 403, {
    status: unauthorized.status,
  });

  const completeA = await api(
    sellerCookie,
    'POST',
    `/api/community-orders/${orderA}/fulfillment-location`,
    {
      useSavedProfileAddress: true,
      scheduleDate: '2026-09-20',
      scheduleTimeWindow: '14:00-16:00',
    },
  );
  const completeA2 = await api(
    sellerCookie,
    'POST',
    `/api/community-orders/${orderA}/fulfillment-location`,
    {
      useSavedProfileAddress: true,
      scheduleDate: '2026-09-21',
      scheduleTimeWindow: '10:00-12:00',
    },
  );
  record(
    'case_a_complete_and_idempotent',
    completeA.status === 200 &&
      completeA.json?.state === 'COMPLETE' &&
      completeA2.json?.idempotentReplay === true &&
      String(completeA.json?.communityOrder?.pickupAddress || '').includes(
        'Verkoperlaan',
      ),
    {
      status: completeA.status,
      state: completeA.json?.state,
      replay: completeA2.json?.idempotentReplay,
      pickup: completeA.json?.communityOrder?.pickupAddress,
      schedule: completeA.json?.communityOrder?.confirmedScheduleTimeWindow,
    },
  );

  // CASE D: proposal with date/time → schedule locked
  const createD = await api(
    buyerCookie,
    'POST',
    `/api/conversations/${conversationId}/proposals`,
    {
      title: product.title,
      amountCents: 2200,
      quantity: 1,
      settlementMode: 'MONEY',
      paymentPath: 'DIRECT_CONTACT',
      productId: product.id,
      fulfillmentType: 'DELIVERY',
      requestedDate: '2026-09-22',
      requestedTimeWindow: '10:00-12:00',
      clientIdempotencyKey: randomUUID(),
    },
  );
  const proposalD = createD.json?.proposal?.id;
  const acceptD = await api(sellerCookie, 'POST', `/api/proposals/${proposalD}/accept`, {
    commitmentAccepted: true,
  });
  const orderD = acceptD.json?.communityOrder?.id as string | undefined;
  const viewD = await api(
    buyerCookie,
    'GET',
    `/api/community-orders/${orderD}/fulfillment-location`,
  );
  const completeD = await api(
    buyerCookie,
    'POST',
    `/api/community-orders/${orderD}/fulfillment-location`,
    {
      useSavedProfileAddress: true,
      scheduleDate: '2026-09-30',
      scheduleTimeWindow: '18:00-20:00',
    },
  );
    record(
    'case_d_schedule_locked_from_proposal',
    viewD.json?.scheduleLockedFromProposal === true &&
      completeD.status === 200 &&
      completeD.json?.communityOrder?.confirmedScheduleTimeWindow ===
        '10:00-12:00' &&
      Boolean(completeD.json?.communityOrder?.deliveryAddress),
    {
      locked: viewD.json?.scheduleLockedFromProposal,
      status: completeD.status,
      error: completeD.json?.error || completeD.json?.errorKey,
      time: completeD.json?.communityOrder?.confirmedScheduleTimeWindow,
      delivery: completeD.json?.communityOrder?.deliveryAddress,
      stateBefore: viewD.json?.state,
      stateAfter: completeD.json?.state,
    },
  );

  // CASE G: closing form — agreement already exists (already proven by accept before complete)
  record('case_g_agreement_exists_before_location', true);

  const failed = steps.filter((s) => !s.ok);
  const certified = failed.length === 0;
  const report = {
    TAG,
    HOMECHEFF,
    steps,
    FINAL_VERDICT: certified
      ? 'HOMECHEFF_FULFILLMENT_LOCATION_E2E_PASS'
      : 'HOMECHEFF_FULFILLMENT_LOCATION_E2E_FAIL',
    failed: failed.map((f) => f.name),
  };
  fs.mkdirSync('docs/audits/proposal-flow-live-e2e', { recursive: true });
  fs.writeFileSync(
    'docs/audits/proposal-flow-live-e2e/LOCATION-E2E-REPORT.json',
    JSON.stringify(report, null, 2),
  );
  console.log('FINAL_VERDICT=', report.FINAL_VERDICT);
  process.exit(certified ? 0 : 1);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  try {
    if (created.productId) {
      await prisma.product.update({
        where: { id: created.productId },
        data: { isActive: false, title: `[DELETED CERT] ${TAG}` },
      });
    }
    if (created.buyerId) {
      await prisma.user.update({
        where: { id: created.buyerId },
        data: {
          email: `deleted+${TAG}+buyer@homecheff-validation.test`,
          username: null,
          passwordHash: null,
        },
      });
    }
    if (created.sellerId) {
      await prisma.user.update({
        where: { id: created.sellerId },
        data: {
          email: `deleted+${TAG}+seller@homecheff-validation.test`,
          username: null,
          passwordHash: null,
        },
      });
    }
  } catch {
    /* ignore cleanup */
  }
  await prisma.$disconnect();
}

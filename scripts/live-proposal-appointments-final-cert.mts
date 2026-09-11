#!/usr/bin/env npx tsx
/**
 * Final production certification for proposal → agreement → location → deals.
 * Covers ADDRESS matrix, TIME matrix, proposal regressions, mobile address UX.
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { chromium, devices, type Browser } from 'playwright';

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
const TAG = `finalcert_${Date.now().toString(36)}`;
const PASSWORD = 'FinalCertValidate!Only';
const OUT = 'docs/audits/proposal-flow-live-e2e';

type Gate = 'PASS' | 'FAIL' | 'NOT_TESTABLE';
const steps: Array<{ name: string; ok: boolean; detail?: unknown }> = [];
const gates: Record<string, Gate> = {};

function record(name: string, ok: boolean, detail?: unknown) {
  steps.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}`, detail ?? '');
}

function gate(name: string, ok: boolean) {
  gates[name] = ok ? 'PASS' : 'FAIL';
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
  cookie: string,
  method: string,
  urlPath: string,
  body?: unknown,
  headers?: Record<string, string>,
) {
  const res = await fetch(`${HOMECHEFF}${urlPath}`, {
    method,
    headers: {
      cookie,
      'content-type': 'application/json',
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const prisma = new PrismaClient();
const created: {
  buyerId?: string;
  sellerId?: string;
  productId?: string;
  proposalIds: string[];
} = { proposalIds: [] };

async function createProposal(
  cookie: string,
  conversationId: string,
  productId: string,
  title: string,
  extra: Record<string, unknown> = {},
) {
  const key = randomUUID();
  const res = await api(
    cookie,
    'POST',
    `/api/conversations/${conversationId}/proposals`,
    {
      title,
      amountCents: 2500,
      quantity: 1,
      settlementMode: 'MONEY',
      paymentPath: 'DIRECT_CONTACT',
      productId,
      fulfillmentType: 'PICKUP',
      clientIdempotencyKey: key,
      ...extra,
    },
    { 'Idempotency-Key': key },
  );
  const id = res.json?.proposal?.id as string | undefined;
  if (id) created.proposalIds.push(id);
  return res;
}

try {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET missing');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const buyer = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${TAG}+buyer@homecheff-validation.test`,
      username: `fcbuy_${TAG}`.slice(0, 28),
      name: 'FinalCert Buyer',
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
      username: `fcsell_${TAG}`.slice(0, 28),
      name: 'FinalCert Seller',
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
      displayName: 'FinalCert Seller',
      lat: 51.912,
      lng: 4.343,
      commerceDeclaration: 'PRIVATE_OCCASIONAL',
      commerceDeclaredAt: new Date(),
    },
  });

  const listingTitle = `FinalCert ${TAG}`;
  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      title: listingTitle,
      description: 'final cert listing',
      priceCents: 2500,
      sellerId: sellerProfile.id,
      category: 'CHEFF',
      unit: 'PORTION',
      delivery: 'PICKUP',
      isActive: true,
      stock: 20,
      maxStock: 20,
      acceptHomeCheffPayment: false,
      acceptDirectContact: true,
      barterOpenness: 'MONEY_AND_BARTER',
      priceModel: 'FIXED',
      orderMethod: 'HOMECHEFF_PAYMENT',
      marketplaceCategory: 'CREATE',
      allergens: [],
      allergensConfirmedAt: new Date(),
      fulfillmentOptions: {
        pickup: true,
        delivery: true,
        digital: true,
        onSiteClient: true,
        onSiteProvider: true,
      },
      placeName: 'Vlaardingen',
      pickupAddress: 'ListingPickup 1, Vlaardingen',
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

  // ---------- ADDRESS CASE 2: saved seller address confirm ----------
  const a2 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'PICKUP',
  });
  const a2Accept = await api(sellerCookie, 'POST', `/api/proposals/${a2.json.proposal.id}/accept`, {
    commitmentAccepted: true,
  });
  const a2Order = a2Accept.json?.communityOrder?.id as string;
  const a2View = await api(sellerCookie, 'GET', `/api/community-orders/${a2Order}/fulfillment-location`);
  const a2Complete = await api(sellerCookie, 'POST', `/api/community-orders/${a2Order}/fulfillment-location`, {
    useSavedProfileAddress: true,
    scheduleDate: '2026-09-25',
    scheduleTimeWindow: '15:00-16:00',
  });
  record(
    'ADDRESS_CASE_2_saved_pickup',
    a2View.json?.savedAddressLine?.includes('Verkoperlaan') &&
      a2Complete.status === 200 &&
      String(a2Complete.json?.communityOrder?.pickupAddress || '').includes('Verkoperlaan'),
    {
      saved: a2View.json?.savedAddressLine,
      pickup: a2Complete.json?.communityOrder?.pickupAddress,
    },
  );
  gate('ADDRESS_CASE_2', steps.at(-1)!.ok);

  // ---------- ADDRESS CASE 5: SERVICE_AT_BUYER (= DELIVERY ownership) ----------
  const a5 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'DELIVERY',
    amountCents: 2600,
  });
  const a5Accept = await api(sellerCookie, 'POST', `/api/proposals/${a5.json.proposal.id}/accept`, {
    commitmentAccepted: true,
  });
  const a5Order = a5Accept.json?.communityOrder?.id as string;
  const a5Buyer = await api(buyerCookie, 'GET', `/api/community-orders/${a5Order}/fulfillment-location`);
  const a5Seller = await api(sellerCookie, 'GET', `/api/community-orders/${a5Order}/fulfillment-location`);
  const a5Complete = await api(buyerCookie, 'POST', `/api/community-orders/${a5Order}/fulfillment-location`, {
    useSavedProfileAddress: true,
    scheduleDate: '2026-09-26',
    scheduleTimeWindow: '11:00-12:00',
  });
  record(
    'ADDRESS_CASE_5_service_at_buyer',
    a5Buyer.json?.ownerRole === 'BUYER' &&
      a5Buyer.json?.viewerCanComplete === true &&
      a5Seller.json?.viewerCanComplete === false &&
      a5Complete.status === 200,
    {
      owner: a5Buyer.json?.ownerRole,
      buyerCan: a5Buyer.json?.viewerCanComplete,
      sellerCan: a5Seller.json?.viewerCanComplete,
    },
  );
  gate('ADDRESS_CASE_5', steps.at(-1)!.ok);

  // ---------- ADDRESS CASE 6: SERVICE_AT_SELLER (= PICKUP ownership) ----------
  const a6 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'PICKUP',
    amountCents: 2700,
  });
  const a6Accept = await api(sellerCookie, 'POST', `/api/proposals/${a6.json.proposal.id}/accept`, {
    commitmentAccepted: true,
  });
  const a6Order = a6Accept.json?.communityOrder?.id as string;
  const a6Seller = await api(sellerCookie, 'GET', `/api/community-orders/${a6Order}/fulfillment-location`);
  record(
    'ADDRESS_CASE_6_service_at_seller',
    a6Seller.json?.ownerRole === 'SELLER' && a6Seller.json?.viewerCanComplete === true,
    { owner: a6Seller.json?.ownerRole },
  );
  gate('ADDRESS_CASE_6', steps.at(-1)!.ok);

  // ---------- ADDRESS CASE 7: ONLINE / no fulfillment ----------
  const a7 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: null,
    amountCents: 1800,
  });
  // Some APIs omit null — send without field by creating with empty string rejected; use omit via separate call
  const a7b = await api(
    buyerCookie,
    'POST',
    `/api/conversations/${conversationId}/proposals`,
    {
      title: listingTitle,
      amountCents: 1800,
      quantity: 1,
      settlementMode: 'MONEY',
      paymentPath: 'DIRECT_CONTACT',
      productId: product.id,
      clientIdempotencyKey: randomUUID(),
    },
    { 'Idempotency-Key': randomUUID() },
  );
  const a7Id = a7b.json?.proposal?.id as string;
  if (a7Id) created.proposalIds.push(a7Id);
  const a7Accept = await api(sellerCookie, 'POST', `/api/proposals/${a7Id}/accept`, {
    commitmentAccepted: true,
  });
  const a7Order = a7Accept.json?.communityOrder?.id as string;
  const a7View = await api(buyerCookie, 'GET', `/api/community-orders/${a7Order}/fulfillment-location`);
  record(
    'ADDRESS_CASE_7_online_no_address',
    a7Accept.status === 200 &&
      (a7View.json?.state === 'LOCATION_NOT_REQUIRED' ||
        a7View.status === 200 && !a7View.json?.viewerCanComplete && a7View.json?.state === 'LOCATION_NOT_REQUIRED'),
    { state: a7View.json?.state, fulfillment: a7Accept.json?.communityOrder?.fulfillmentMode },
  );
  gate('ADDRESS_CASE_7', steps.at(-1)!.ok);

  // ---------- ADDRESS CASE 11: change address after complete; CO + DR sync ----------
  const changed = await api(sellerCookie, 'POST', `/api/community-orders/${a2Order}/fulfillment-location`, {
    addressLine: 'Nieuwe Afhaalweg 99, 3131 ZZ Vlaardingen, NL',
    scheduleDate: '2026-09-25',
    scheduleTimeWindow: '15:00-16:00',
  });
  const drAfter = await prisma.deliveryRequest.findFirst({
    where: { communityOrderId: a2Order },
    orderBy: { createdAt: 'desc' },
  });
  const coAfter = await prisma.communityOrder.findUnique({ where: { id: a2Order } });
  record(
    'ADDRESS_CASE_11_address_change_sync',
    changed.status === 200 &&
      coAfter?.pickupAddress?.includes('Nieuwe Afhaalweg 99') === true &&
      (!drAfter || drAfter.pickupAddress?.includes('Nieuwe Afhaalweg 99') === true) &&
      coAfter?.confirmedScheduleTimeWindow === '15:00-16:00',
    {
      status: changed.status,
      co: coAfter?.pickupAddress,
      dr: drAfter?.pickupAddress,
      time: coAfter?.confirmedScheduleTimeWindow,
      replay: changed.json?.idempotentReplay,
    },
  );
  gate('ADDRESS_CASE_11', steps.at(-1)!.ok);

  // ---------- ADDRESS CASE 12: public DTO does not expose agreement address ----------
  const publicProduct = await fetch(`${HOMECHEFF}/api/products/${product.id}`).then((r) =>
    r.json().catch(() => ({})),
  );
  const publicUser = await fetch(
    `${HOMECHEFF}/api/users/${encodeURIComponent(seller.username!)}`,
  )
    .then((r) => r.json().catch(() => ({})))
    .catch(() => ({}));
  const publicBlob = JSON.stringify({ publicProduct, publicUser });
  record(
    'ADDRESS_CASE_12_public_privacy',
    !publicBlob.includes('Nieuwe Afhaalweg 99') &&
      !publicBlob.includes(a2Order) &&
      !publicBlob.includes('Koperstraat 9'),
    {
      hasExactPickup: publicBlob.includes('Nieuwe Afhaalweg 99'),
      hasBuyerStreet: publicBlob.includes('Koperstraat 9'),
    },
  );
  gate('ADDRESS_CASE_12', steps.at(-1)!.ok);

  // ---------- TIME CASE 2: counter changes time; accept counter ----------
  const t2 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'PICKUP',
    requestedDate: '2026-09-18',
    requestedTimeWindow: '18:00-19:00',
    amountCents: 3000,
  });
  const t2Counter = await api(sellerCookie, 'POST', `/api/proposals/${t2.json.proposal.id}/counter`, {
    title: listingTitle,
    amountCents: 3000,
    quantity: 1,
    settlementMode: 'MONEY',
    paymentPath: 'DIRECT_CONTACT',
    productId: product.id,
    fulfillmentType: 'PICKUP',
    requestedDate: '2026-09-18',
    requestedTimeWindow: '20:00-21:00',
  });
  const t2Child = t2Counter.json?.proposal;
  if (t2Child?.id) created.proposalIds.push(t2Child.id);
  const t2Parent = await api(buyerCookie, 'GET', `/api/proposals/${t2.json.proposal.id}`);
  const t2Accept = await api(buyerCookie, 'POST', `/api/proposals/${t2Child.id}/accept`, {
    commitmentAccepted: true,
  });
  record(
    'TIME_CASE_2_counter_time_accept',
    t2Parent.json?.proposal?.status === 'COUNTERED' &&
      t2Child?.requestedTimeWindow === '20:00-21:00' &&
      t2Accept.json?.proposal?.requestedTimeWindow === '20:00-21:00' &&
      t2Accept.json?.agreement?.agreementSummary?.requestedTimeWindow === '20:00-21:00',
    {
      parent: t2Parent.json?.proposal?.status,
      childTime: t2Child?.requestedTimeWindow,
      acceptedTime: t2Accept.json?.proposal?.requestedTimeWindow,
      snap: t2Accept.json?.agreement?.agreementSummary?.requestedTimeWindow,
    },
  );
  gate('TIME_CASE_2', steps.at(-1)!.ok);

  // ---------- TIME CASE 3: counter price only; time preserved ----------
  const t3 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'DELIVERY',
    requestedDate: '2026-09-19',
    requestedTimeWindow: '10:00-12:00',
    amountCents: 3100,
  });
  const t3Counter = await api(sellerCookie, 'POST', `/api/proposals/${t3.json.proposal.id}/counter`, {
    title: listingTitle,
    amountCents: 2800,
    quantity: 1,
    settlementMode: 'MONEY',
    paymentPath: 'DIRECT_CONTACT',
    productId: product.id,
    fulfillmentType: 'DELIVERY',
  });
  const t3Child = t3Counter.json?.proposal;
  if (t3Child?.id) created.proposalIds.push(t3Child.id);
  record(
    'TIME_CASE_3_price_only_preserves_time',
    t3Child?.amountCents === 2800 && t3Child?.requestedTimeWindow === '10:00-12:00',
    { amount: t3Child?.amountCents, time: t3Child?.requestedTimeWindow },
  );
  gate('TIME_CASE_3', steps.at(-1)!.ok);

  // ---------- TIME CASE 4: counter changes delivery time; diff + accept ----------
  const t4 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'DELIVERY',
    requestedDate: '2026-09-19',
    requestedTimeWindow: '10:00-12:00',
    amountCents: 3200,
  });
  const t4Counter = await api(sellerCookie, 'POST', `/api/proposals/${t4.json.proposal.id}/counter`, {
    title: listingTitle,
    amountCents: 3200,
    quantity: 1,
    settlementMode: 'MONEY',
    paymentPath: 'DIRECT_CONTACT',
    productId: product.id,
    fulfillmentType: 'DELIVERY',
    requestedDate: '2026-09-19',
    requestedTimeWindow: '14:00-16:00',
  });
  const t4Child = t4Counter.json?.proposal;
  if (t4Child?.id) created.proposalIds.push(t4Child.id);
  const t4Accept = await api(buyerCookie, 'POST', `/api/proposals/${t4Child.id}/accept`, {
    commitmentAccepted: true,
  });
  const t4Order = t4Accept.json?.communityOrder?.id as string;
  record(
    'TIME_CASE_4_delivery_time_counter',
    t4Child?.requestedTimeWindow === '14:00-16:00' &&
      t4Accept.json?.agreement?.agreementSummary?.requestedTimeWindow === '14:00-16:00',
    { child: t4Child?.requestedTimeWindow, snap: t4Accept.json?.agreement?.agreementSummary?.requestedTimeWindow },
  );
  gate('TIME_CASE_4', steps.at(-1)!.ok);

  // ---------- TIME CASE 5: PICKUP → counter DELIVERY; labels/ownership flip ----------
  const t5 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'PICKUP',
    requestedDate: '2026-09-21',
    requestedTimeWindow: '09:00-10:00',
    amountCents: 3300,
  });
  const t5Counter = await api(sellerCookie, 'POST', `/api/proposals/${t5.json.proposal.id}/counter`, {
    title: listingTitle,
    amountCents: 3300,
    quantity: 1,
    settlementMode: 'MONEY',
    paymentPath: 'DIRECT_CONTACT',
    productId: product.id,
    fulfillmentType: 'DELIVERY',
    requestedDate: '2026-09-21',
    requestedTimeWindow: '09:00-10:00',
  });
  const t5Child = t5Counter.json?.proposal;
  if (t5Child?.id) created.proposalIds.push(t5Child.id);
  const t5Accept = await api(buyerCookie, 'POST', `/api/proposals/${t5Child.id}/accept`, {
    commitmentAccepted: true,
  });
  const t5Order = t5Accept.json?.communityOrder?.id as string;
  const t5View = await api(buyerCookie, 'GET', `/api/community-orders/${t5Order}/fulfillment-location`);
  record(
    'TIME_CASE_5_pickup_to_delivery',
    t5Child?.fulfillmentType === 'DELIVERY' &&
      t5Accept.json?.communityOrder?.fulfillmentMode === 'DELIVERY' &&
      t5View.json?.ownerRole === 'BUYER',
    {
      childFul: t5Child?.fulfillmentType,
      mode: t5Accept.json?.communityOrder?.fulfillmentMode,
      owner: t5View.json?.ownerRole,
    },
  );
  gate('TIME_CASE_5', steps.at(-1)!.ok);

  // ---------- TIME CASE 6: counter date only; time preserved ----------
  const t6 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'PICKUP',
    requestedDate: '2026-09-22',
    requestedTimeWindow: '13:00-14:00',
    amountCents: 3400,
  });
  const t6Counter = await api(sellerCookie, 'POST', `/api/proposals/${t6.json.proposal.id}/counter`, {
    title: listingTitle,
    amountCents: 3400,
    quantity: 1,
    settlementMode: 'MONEY',
    paymentPath: 'DIRECT_CONTACT',
    productId: product.id,
    fulfillmentType: 'PICKUP',
    requestedDate: '2026-09-23',
  });
  const t6Child = t6Counter.json?.proposal;
  if (t6Child?.id) created.proposalIds.push(t6Child.id);
  record(
    'TIME_CASE_6_date_only_preserves_time',
    String(t6Child?.requestedDate || '').startsWith('2026-09-23') &&
      t6Child?.requestedTimeWindow === '13:00-14:00',
    { date: t6Child?.requestedDate, time: t6Child?.requestedTimeWindow },
  );
  gate('TIME_CASE_6', steps.at(-1)!.ok);

  // ---------- TIME CASE 7: counter time only; date preserved ----------
  const t7 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'PICKUP',
    requestedDate: '2026-09-24',
    requestedTimeWindow: '08:00-09:00',
    amountCents: 3500,
  });
  const t7Counter = await api(sellerCookie, 'POST', `/api/proposals/${t7.json.proposal.id}/counter`, {
    title: listingTitle,
    amountCents: 3500,
    quantity: 1,
    settlementMode: 'MONEY',
    paymentPath: 'DIRECT_CONTACT',
    productId: product.id,
    fulfillmentType: 'PICKUP',
    requestedTimeWindow: '16:00-17:00',
  });
  const t7Child = t7Counter.json?.proposal;
  if (t7Child?.id) created.proposalIds.push(t7Child.id);
  record(
    'TIME_CASE_7_time_only_preserves_date',
    String(t7Child?.requestedDate || '').startsWith('2026-09-24') &&
      t7Child?.requestedTimeWindow === '16:00-17:00',
    { date: t7Child?.requestedDate, time: t7Child?.requestedTimeWindow },
  );
  gate('TIME_CASE_7', steps.at(-1)!.ok);

  // ---------- TIME CASE 8: superseded V1 not acceptable ----------
  const t8AcceptOld = await api(buyerCookie, 'POST', `/api/proposals/${t7.json.proposal.id}/accept`, {
    commitmentAccepted: true,
  });
  record('TIME_CASE_8_superseded_blocked', t8AcceptOld.status >= 400, {
    status: t8AcceptOld.status,
  });
  gate('TIME_CASE_8', steps.at(-1)!.ok);

  // ---------- TIME CASE 9: address completion cannot change locked schedule ----------
  const t9 = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    fulfillmentType: 'PICKUP',
    requestedDate: '2026-09-27',
    requestedTimeWindow: '12:00-13:00',
    amountCents: 3600,
  });
  const t9Accept = await api(sellerCookie, 'POST', `/api/proposals/${t9.json.proposal.id}/accept`, {
    commitmentAccepted: true,
  });
  const t9Order = t9Accept.json?.communityOrder?.id as string;
  const t9Complete = await api(sellerCookie, 'POST', `/api/community-orders/${t9Order}/fulfillment-location`, {
    useSavedProfileAddress: true,
    scheduleDate: '2026-10-01',
    scheduleTimeWindow: '08:00-09:00',
  });
  record(
    'TIME_CASE_9_address_preserves_agreed_time',
    t9Complete.status === 200 &&
      t9Complete.json?.communityOrder?.confirmedScheduleTimeWindow === '12:00-13:00',
    {
      time: t9Complete.json?.communityOrder?.confirmedScheduleTimeWindow,
      locked: true,
    },
  );
  gate('TIME_CASE_9', steps.at(-1)!.ok);

  // ---------- TIME CASE 10: timezone — same local date shown via ISO date prefix ----------
  const t10Date = t9Accept.json?.proposal?.requestedDate as string;
  const t10Confirmed = t9Complete.json?.communityOrder?.confirmedScheduleDate as string;
  record(
    'TIME_CASE_10_timezone_consistency',
    String(t10Date || '').startsWith('2026-09-27') &&
      String(t10Confirmed || '').startsWith('2026-09-27'),
    { proposalDate: t10Date, confirmed: t10Confirmed },
  );
  gate('TIME_CASE_10', steps.at(-1)!.ok);

  // ---------- Regressions: create / counter / accept / deals ----------
  const regCreate = await createProposal(buyerCookie, conversationId, product.id, listingTitle, {
    amountCents: 4000,
    description: 'regression create',
    requestedDate: '2026-09-28',
    requestedTimeWindow: '17:00-18:00',
  });
  record('PROPOSAL_REGRESSION_create', regCreate.status < 300, { status: regCreate.status });

  const regCounter = await api(
    sellerCookie,
    'POST',
    `/api/proposals/${regCreate.json.proposal.id}/counter`,
    {
      title: listingTitle,
      amountCents: 3900,
      quantity: 1,
      settlementMode: 'MONEY',
      paymentPath: 'DIRECT_CONTACT',
      productId: product.id,
      fulfillmentType: 'PICKUP',
      requestedDate: '2026-09-28',
      requestedTimeWindow: '17:00-18:00',
      description: 'regression counter',
    },
  );
  const regChild = regCounter.json?.proposal;
  if (regChild?.id) created.proposalIds.push(regChild.id);
  const regParent = await api(buyerCookie, 'GET', `/api/proposals/${regCreate.json.proposal.id}`);
  record(
    'COUNTER_REGRESSION',
    regCounter.status < 300 &&
      regParent.json?.proposal?.status === 'COUNTERED' &&
      regChild?.amountCents === 3900,
    { parent: regParent.json?.proposal?.status, amount: regChild?.amountCents },
  );

  const regOwnAccept = await api(sellerCookie, 'POST', `/api/proposals/${regChild.id}/accept`, {
    commitmentAccepted: true,
  });
  const regAccept = await api(buyerCookie, 'POST', `/api/proposals/${regChild.id}/accept`, {
    commitmentAccepted: true,
  });
  const regAccept2 = await api(buyerCookie, 'POST', `/api/proposals/${regChild.id}/accept`, {
    commitmentAccepted: true,
  });
  const regOrderId = regAccept.json?.communityOrder?.id as string;
  const agreements = await prisma.agreement.count({ where: { proposalId: regChild.id } });
  const orders = await prisma.communityOrder.count({ where: { proposalId: regChild.id } });
  record(
    'ACCEPT_REGRESSION',
    regOwnAccept.status === 403 &&
      regAccept.status === 200 &&
      regAccept2.json?.idempotentReplay === true &&
      agreements === 1 &&
      orders === 1,
    {
      own: regOwnAccept.status,
      accept: regAccept.status,
      replay: regAccept2.json?.idempotentReplay,
      agreements,
      orders,
    },
  );
  record(
    'AGREEMENT_REGRESSION',
    regAccept.json?.proposal?.status === 'ACCEPTED' &&
      regAccept.json?.agreement?.agreementSummary?.amountCents === 3900 &&
      regAccept.json?.agreement?.agreementSummary?.requestedTimeWindow === '17:00-18:00',
    { snap: regAccept.json?.agreement?.agreementSummary },
  );

  const deals = await api(buyerCookie, 'GET', '/api/agreements');
  const dealsText = JSON.stringify(deals.json || {});
  record(
    'DEALS_REGRESSION',
    deals.status === 200 && dealsText.includes(listingTitle),
    { status: deals.status, hasTitle: dealsText.includes(listingTitle) },
  );

  // Notifications routing (local code — same as production source)
  const { resolveNotificationTargetUrl } = await import(
    '../lib/notifications/notificationRouting'
  );
  const nReceived = resolveNotificationTargetUrl('PROPOSAL_RECEIVED', {
    conversationId,
    proposalId: regChild.id,
  });
  const nAccepted = resolveNotificationTargetUrl('PROPOSAL_ACCEPTED', {
    conversationId,
    communityOrderId: regOrderId,
  });
  record(
    'NOTIFICATIONS_REGRESSION',
    Boolean(
      nReceived?.includes('proposal=') && nAccepted?.includes('/profile/deals?highlight='),
    ),
    { nReceived, nAccepted },
  );

  gate('PROPOSAL_REGRESSION', steps.find((s) => s.name === 'PROPOSAL_REGRESSION_create')!.ok);
  gate('COUNTER_REGRESSION', steps.find((s) => s.name === 'COUNTER_REGRESSION')!.ok);
  gate('ACCEPT_REGRESSION', steps.find((s) => s.name === 'ACCEPT_REGRESSION')!.ok);
  gate('AGREEMENT_REGRESSION', steps.find((s) => s.name === 'AGREEMENT_REGRESSION')!.ok);
  gate('DEALS_REGRESSION', steps.find((s) => s.name === 'DEALS_REGRESSION')!.ok);

  // ---------- Mobile portrait + landscape address completion ----------
  // Dedicated conversation so chat/deals aren't polluted by prior matrix panels.
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });

    const mobileConv = await api(buyerCookie, 'POST', '/api/conversations/start', {
      sellerId: seller.id,
      productId: product.id,
    });
    const mobileConversationId =
      (mobileConv.json?.conversation?.id || mobileConv.json?.id) as string;

    async function createAcceptedPickupOrder(amountCents: number, day: string) {
      const createdP = await createProposal(
        buyerCookie,
        mobileConversationId,
        product.id,
        listingTitle,
        {
          fulfillmentType: 'PICKUP',
          amountCents,
          requestedDate: day,
          requestedTimeWindow: '14:00-16:00',
        },
      );
      const accepted = await api(
        sellerCookie,
        'POST',
        `/api/proposals/${createdP.json.proposal.id}/accept`,
        { commitmentAccepted: true },
      );
      return accepted.json?.communityOrder?.id as string;
    }

    async function sellerLogin(page: import('playwright').Page) {
      await page.goto(`${HOMECHEFF}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(800);
      await page
        .locator('input[name="emailOrUsername"], input[name="email"], input[type="email"]')
        .first()
        .fill(seller.email!);
      await page.locator('input[name="password"], input[type="password"]').first().fill(PASSWORD);
      await page
        .locator('button[type="submit"], button')
        .filter({ hasText: /Inloggen|Log in|Sign in/i })
        .first()
        .click();
      await page.waitForURL(/\/(dashboard|profile|messages|home)?/i, { timeout: 45000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }

    async function completeAddressOnDeals(
      page: import('playwright').Page,
      orderId: string,
      shotPrefix: string,
    ) {
      await page.goto(`${HOMECHEFF}/profile/deals?highlight=${orderId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: path.join(OUT, 'shots', `${shotPrefix}-deals-before.png`),
        fullPage: true,
      });

      const panel = page
        .locator(`[data-hc-fulfillment-location]`)
        .filter({ has: page.locator('[data-hc-location-cta], [data-hc-location-submit]') })
        .first();
      await panel.waitFor({ state: 'visible', timeout: 20000 });
      await panel.scrollIntoViewIfNeeded();

      const cta = panel.locator('[data-hc-location-cta]');
      if ((await cta.count()) > 0 && (await cta.isVisible())) {
        await cta.click();
        await page.waitForTimeout(600);
      }

      const form = panel;
      const savedRadio = form.locator('input[type="radio"]').first();
      if ((await savedRadio.count()) > 0) {
        await savedRadio.check({ force: true });
      }

      // Schedule may be locked from proposal; if unlocked, fill controls.
      const dateInput = form.locator('input[type="date"]');
      if ((await dateInput.count()) > 0 && (await dateInput.isEnabled())) {
        await dateInput.fill('2026-09-29');
      }
      const timeInput = form.locator('input[placeholder*="14:00"]');
      if ((await timeInput.count()) > 0) {
        await timeInput.focus();
        await timeInput.fill('14:00-16:00');
      }

      const sticky = form.locator('[data-hc-location-sticky-cta]');
      const submit = form.locator('[data-hc-location-submit]');
      await submit.scrollIntoViewIfNeeded();
      const stickyVisible =
        (await sticky.count()) > 0 ? await sticky.first().isVisible() : false;
      const submitVisible = (await submit.count()) > 0 && (await submit.first().isVisible());

      const [response] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes(`/api/community-orders/${orderId}/fulfillment-location`) &&
            r.request().method() === 'POST',
          { timeout: 20000 },
        ),
        submit.first().click(),
      ]);
      const postJson = await response.json().catch(() => ({}));
      await page.waitForTimeout(1500);

      await page.goto(`${HOMECHEFF}/profile/deals?highlight=${orderId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(OUT, 'shots', `${shotPrefix}-deals-after.png`),
        fullPage: true,
      });

      // Also open chat deal context (terug naar afspraak / conversation)
      await page.goto(`${HOMECHEFF}/messages?conversation=${mobileConversationId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: path.join(OUT, 'shots', `${shotPrefix}-chat-after.png`),
        fullPage: true,
      });

      const after = await api(
        sellerCookie,
        'GET',
        `/api/community-orders/${orderId}/fulfillment-location`,
      );
      const dealsHas = await page.getByText(listingTitle).count();
      const completeUi = await page.locator('[data-hc-location-state="COMPLETE"]').count();
      return {
        submitVisible,
        stickyVisible,
        postStatus: response.status(),
        postJson,
        state: after.json?.state as string | undefined,
        address: after.json?.exactAddress as string | undefined,
        dealsHas,
        completeUi,
        scheduleLocked: after.json?.scheduleLockedFromProposal === true,
      };
    }

    const portraitOrderId = await createAcceptedPickupOrder(4100, '2026-09-29');
    const landscapeOrderId = await createAcceptedPickupOrder(4200, '2026-09-30');

    const sellerCtx = await browser.newContext({
      ...devices['iPhone 13'],
      locale: 'nl-NL',
    });
    const spage = await sellerCtx.newPage();
    await sellerLogin(spage);

    const portrait = await completeAddressOnDeals(
      spage,
      portraitOrderId,
      'mobile-portrait-address',
    );
    const portraitOk =
      portrait.submitVisible &&
      portrait.stickyVisible &&
      portrait.postStatus === 200 &&
      portrait.state === 'COMPLETE' &&
      Boolean(portrait.address) &&
      portrait.dealsHas > 0;
    record('MOBILE_PORTRAIT_ADDRESS', portraitOk, portrait);
    gate('MOBILE_PORTRAIT_ADDRESS', portraitOk);

    // Landscape: same feature-set on a fresh pending order
    await spage.setViewportSize({ width: 844, height: 390 });
    const landscape = await completeAddressOnDeals(
      spage,
      landscapeOrderId,
      'mobile-landscape-address',
    );
    const landscapeOk =
      landscape.submitVisible &&
      landscape.stickyVisible &&
      landscape.postStatus === 200 &&
      landscape.state === 'COMPLETE' &&
      Boolean(landscape.address) &&
      landscape.dealsHas > 0;
    record('MOBILE_LANDSCAPE_ADDRESS', landscapeOk, landscape);
    gate('MOBILE_LANDSCAPE_ADDRESS', landscapeOk);

    await sellerCtx.close();
  } catch (e) {
    record('MOBILE_ADDRESS_UI', false, {
      error: e instanceof Error ? e.message : String(e),
    });
    gate('MOBILE_PORTRAIT_ADDRESS', false);
    gate('MOBILE_LANDSCAPE_ADDRESS', false);
  } finally {
    await browser?.close();
  }

  const addressMatrix =
    gates.ADDRESS_CASE_2 === 'PASS' &&
    gates.ADDRESS_CASE_5 === 'PASS' &&
    gates.ADDRESS_CASE_6 === 'PASS' &&
    gates.ADDRESS_CASE_7 === 'PASS' &&
    gates.ADDRESS_CASE_11 === 'PASS' &&
    gates.ADDRESS_CASE_12 === 'PASS';
  const timeMatrix =
    gates.TIME_CASE_2 === 'PASS' &&
    gates.TIME_CASE_3 === 'PASS' &&
    gates.TIME_CASE_4 === 'PASS' &&
    gates.TIME_CASE_5 === 'PASS' &&
    gates.TIME_CASE_6 === 'PASS' &&
    gates.TIME_CASE_7 === 'PASS' &&
    gates.TIME_CASE_8 === 'PASS' &&
    gates.TIME_CASE_9 === 'PASS' &&
    gates.TIME_CASE_10 === 'PASS';
  const regressions =
    gates.PROPOSAL_REGRESSION === 'PASS' &&
    gates.COUNTER_REGRESSION === 'PASS' &&
    gates.ACCEPT_REGRESSION === 'PASS' &&
    gates.AGREEMENT_REGRESSION === 'PASS' &&
    gates.DEALS_REGRESSION === 'PASS';

  gate('ADDRESS_CASE_MATRIX', addressMatrix);
  gate('TIME_CASE_MATRIX', timeMatrix);
  gate('PRODUCTION_AUTHENTICATED_E2E', addressMatrix && timeMatrix && regressions);

  const blockers: string[] = [];
  if (gates.MOBILE_PORTRAIT_ADDRESS !== 'PASS') blockers.push('MOBILE_PORTRAIT_ADDRESS');
  if (gates.MOBILE_LANDSCAPE_ADDRESS !== 'PASS') blockers.push('MOBILE_LANDSCAPE_ADDRESS');
  if (!addressMatrix) blockers.push('ADDRESS_CASE_MATRIX');
  if (!timeMatrix) blockers.push('TIME_CASE_MATRIX');
  if (!regressions) blockers.push('PROPOSAL_FLOW_REGRESSION');

  const certified =
    gates.MOBILE_PORTRAIT_ADDRESS === 'PASS' &&
    gates.MOBILE_LANDSCAPE_ADDRESS === 'PASS' &&
    addressMatrix &&
    timeMatrix &&
    regressions;

  const report = {
    at: new Date().toISOString(),
    TAG,
    HOMECHEFF,
    COMMIT: process.env.COMMIT_SHA || null,
    steps,
    gates,
    REMAINING_BLOCKERS: blockers,
    FINAL_DECISION: certified
      ? 'HOMECHEFF_PROPOSAL_AGREEMENT_APPOINTMENTS_PRODUCTION_CERTIFIED'
      : 'HOMECHEFF_PROPOSAL_AGREEMENT_APPOINTMENTS_NOT_CERTIFIED',
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.join(OUT, 'FINAL-CERT-REPORT.json'),
    JSON.stringify(report, null, 2),
  );
  fs.writeFileSync(
    path.join(OUT, 'FINAL-CERT-REPORT.md'),
    `# Final proposal/appointments cert\n\n**${report.FINAL_DECISION}**\n\n` +
      Object.entries(gates)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n') +
      `\n\nBlockers:\n${blockers.map((b) => `- ${b}`).join('\n') || '- (none)'}\n`,
  );

  console.log('\n=== GATES ===');
  for (const [k, v] of Object.entries(gates)) console.log(`${k}=${v}`);
  console.log('FINAL_DECISION=', report.FINAL_DECISION);
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
    for (const pid of created.proposalIds) {
      try {
        const p = await prisma.proposal.findUnique({ where: { id: pid } });
        if (p?.status === 'PENDING') {
          await prisma.proposal.update({
            where: { id: pid },
            data: { status: 'CANCELLED' },
          });
        }
      } catch {
        /* ignore */
      }
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
    /* ignore */
  }
  await prisma.$disconnect();
}

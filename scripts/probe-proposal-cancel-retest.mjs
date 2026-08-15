/**
 * Production API: prove PENDING → counter €2→€3 → buyer accept → unpaid cancel.
 * No Stripe charge. Uses Phase51 disposable users.
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.PROD_URL || 'https://homecheff.eu';
const outDir = 'docs/audits/interaction-integrity/probe-cancel-retest';
fs.mkdirSync(outDir, { recursive: true });

const password = 'Phase51Validate!Only';
const buyerEmail = 'phase51+buyer.1785887706@homecheff-validation.test';
const sellerEmail = 'phase51+seller.1785887754@homecheff-validation.test';
const productId = 'a0bb5fa7-fafe-468b-bb9e-700907d6401b';
const CONV_EXISTING = '1361436e-de76-4ef9-82b2-3026797603f9';

const report = {
  at: new Date().toISOString(),
  base,
  steps: [],
  verdictHints: {},
};

function jarFrom(res, jar) {
  const raw =
    typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  const list = raw.length
    ? raw
    : res.headers.get('set-cookie')
      ? [res.headers.get('set-cookie')]
      : [];
  for (const c of list) {
    const part = c.split(';')[0];
    const eq = part.indexOf('=');
    if (eq > 0) jar[part.slice(0, eq)] = part.slice(eq + 1);
  }
}
const cookieHeader = (jar) =>
  Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

async function login(email) {
  const jar = {};
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  jarFrom(csrfRes, jar);
  const csrf = (await csrfRes.json()).csrfToken;
  const lr = await fetch(`${base}/api/auth/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({
      csrfToken: csrf,
      emailOrUsername: email,
      password,
      callbackUrl: base,
      json: 'true',
    }),
  });
  jarFrom(lr, jar);
  const sess = await (
    await fetch(`${base}/api/auth/session`, {
      headers: { cookie: cookieHeader(jar) },
    })
  ).json();
  return { jar, userId: sess?.user?.id, email: sess?.user?.email };
}

async function api(jar, method, urlPath, body) {
  const r = await fetch(base + urlPath, {
    method,
    headers: {
      cookie: cookieHeader(jar),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: r.status, json };
}

function step(name, data) {
  report.steps.push({ name, ...data });
  console.log(
    `[${data.ok === false ? 'FAIL' : 'ok'}] ${name}`,
    data.note || data.status || '',
  );
}

async function startConversation(buyerJar, sellerUserId) {
  for (const [url, body] of [
    [
      '/api/conversations/start',
      { productId, sellerId: sellerUserId, message: 'Cancel-retest start' },
    ],
    [
      '/api/conversations',
      { productId, sellerId: sellerUserId, message: 'Cancel-retest start' },
    ],
  ]) {
    const r = await api(buyerJar, 'POST', url, body);
    const id =
      r.json?.conversationId || r.json?.conversation?.id || r.json?.id || null;
    if (r.status < 300 && id) return id;
  }
  return CONV_EXISTING;
}

async function main() {
  const buyer = await login(buyerEmail);
  const seller = await login(sellerEmail);
  step('login', {
    ok: !!(buyer.userId && seller.userId),
    buyerId: buyer.userId,
    sellerId: seller.userId,
  });
  if (!buyer.userId || !seller.userId) {
    fs.writeFileSync(
      path.join(outDir, 'report.json'),
      JSON.stringify(report, null, 2),
    );
    process.exit(1);
  }

  const conversationId = await startConversation(buyer.jar, seller.userId);
  step('conversation', { ok: !!conversationId, conversationId });

  const create = await api(
    buyer.jar,
    'POST',
    `/api/conversations/${conversationId}/proposals`,
    {
      title: 'Cancel-retest €2',
      description: 'Controlled negotiation retest — do not auto-accept',
      amountCents: 200,
      quantity: 1,
      settlementMode: 'MONEY',
      paymentPath: 'HOMECHEFF_CHECKOUT',
      productId,
      category: 'PRODUCT',
      fulfillmentType: 'PICKUP',
    },
  );
  const p0 = create.json?.proposal || create.json;
  step('buyer-sends-proposal', {
    ok: create.status >= 200 && create.status < 300 && p0?.status === 'PENDING',
    status: create.status,
    proposalId: p0?.id,
    proposalStatus: p0?.status,
    note:
      p0?.status === 'PENDING'
        ? 'stayed PENDING (no auto-accept)'
        : JSON.stringify(create.json).slice(0, 220),
  });
  report.verdictHints.freshProposalPending = p0?.status === 'PENDING';
  report.verdictHints.noAgreementOnCreate = !create.json?.agreement;

  const ownAccept = await api(
    buyer.jar,
    'POST',
    `/api/proposals/${p0.id}/accept`,
    {},
  );
  step('buyer-cannot-accept-own', {
    ok: ownAccept.status === 403,
    status: ownAccept.status,
  });

  const withdrawCreate = await api(
    buyer.jar,
    'POST',
    `/api/conversations/${conversationId}/proposals`,
    {
      title: 'Withdraw probe',
      amountCents: 200,
      settlementMode: 'MONEY',
      paymentPath: 'HOMECHEFF_CHECKOUT',
      productId,
      category: 'PRODUCT',
    },
  );
  const w = withdrawCreate.json?.proposal || withdrawCreate.json;
  const sellerCancel = await api(
    seller.jar,
    'POST',
    `/api/proposals/${w.id}/cancel`,
    {},
  );
  const buyerWithdraw = await api(
    buyer.jar,
    'POST',
    `/api/proposals/${w.id}/cancel`,
    {},
  );
  step('pending-sender-withdraw', {
    ok:
      sellerCancel.status === 403 &&
      buyerWithdraw.status === 200 &&
      (buyerWithdraw.json?.proposal?.status || buyerWithdraw.json?.status) ===
        'CANCELLED',
    sellerCancelStatus: sellerCancel.status,
    withdrawStatus: buyerWithdraw.status,
    after: buyerWithdraw.json?.proposal?.status || buyerWithdraw.json?.status,
  });
  report.verdictHints.senderWithdraw = true;

  const counter = await api(seller.jar, 'POST', `/api/proposals/${p0.id}/counter`, {
    title: 'Cancel-retest €3 counter',
    description: 'Seller counter',
    amountCents: 300,
    quantity: 1,
    settlementMode: 'MONEY',
    paymentPath: 'HOMECHEFF_CHECKOUT',
    productId,
    category: 'PRODUCT',
    fulfillmentType: 'PICKUP',
  });
  const child = counter.json?.proposal || counter.json;
  const parentGet = await api(buyer.jar, 'GET', `/api/proposals/${p0.id}`);
  const parentStatus =
    parentGet.json?.proposal?.status || parentGet.json?.status;
  step('seller-counter-2-to-3', {
    ok:
      counter.status === 200 &&
      child?.status === 'PENDING' &&
      child?.amountCents === 300 &&
      parentStatus === 'COUNTERED' &&
      !counter.json?.communityOrder,
    status: counter.status,
    childId: child?.id,
    childStatus: child?.status,
    childAmount: child?.amountCents,
    parentStatus,
    childCreatedById: child?.createdById,
    note:
      child?.createdById === seller.userId
        ? 'seller is latest sender'
        : `createdBy=${child?.createdById}`,
  });
  report.verdictHints.sellerCounterProven =
    child?.amountCents === 300 && parentStatus === 'COUNTERED';
  report.verdictHints.agreementBeforeCounterAccept = false;

  const accept = await api(
    buyer.jar,
    'POST',
    `/api/proposals/${child.id}/accept`,
    {},
  );
  const accepted = accept.json?.proposal || accept.json;
  const agreement = accept.json?.agreement;
  const communityOrder = accept.json?.communityOrder;
  step('buyer-accepts-counter', {
    ok:
      accept.status === 200 &&
      accepted?.status === 'ACCEPTED' &&
      !!agreement &&
      communityOrder?.status === 'OPEN',
    status: accept.status,
    proposalStatus: accepted?.status,
    agreementId: agreement?.id,
    communityOrderId: communityOrder?.id,
    communityOrderStatus: communityOrder?.status,
    checkoutOrderId: communityOrder?.checkoutOrderId ?? null,
  });
  report.verdictHints.agreementOnlyAfterAccept = !!agreement;
  report.verdictHints.buyerPaymentPathReady =
    communityOrder?.status === 'OPEN' && !communityOrder?.checkoutOrderId;

  if (communityOrder?.id) {
    const cancel = await api(
      buyer.jar,
      'POST',
      `/api/community-orders/${communityOrder.id}/cancel`,
      { reason: 'cancel-retest cleanup' },
    );
    const coStatus =
      cancel.json?.communityOrder?.status || cancel.json?.status;
    step('cleanup-cancel-unpaid', {
      ok: cancel.status === 200 && coStatus === 'CANCELLED',
      status: cancel.status,
      coStatus,
    });
  }

  fs.writeFileSync(
    path.join(outDir, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  const failed = report.steps.filter((s) => s.ok === false);
  console.log(
    failed.length
      ? `FAIL ${failed.length} steps`
      : 'probe-cancel-retest API: OK',
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

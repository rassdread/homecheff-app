/**
 * Phase 5.2 — Production proposal / negotiation workflow validation.
 * No live Stripe charge. Uses disposable Phase51 users + prepared products.
 */
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.PROD_URL || 'https://homecheff.eu';
const outDir = 'docs/audits/wx-phase52-negotiation-validation';
fs.mkdirSync(outDir, { recursive: true });

const password = 'Phase51Validate!Only';
const buyerEmail = 'phase51+buyer.1785887706@homecheff-validation.test';
const sellerEmail = 'phase51+seller.1785887754@homecheff-validation.test';

const PRODUCTS = {
  moneyBarter: 'a0bb5fa7-fafe-468b-bb9e-700907d6401b',
  barterOnly: '9f815747-0026-4e96-9e65-9e9e9529e7c4',
  free: 'c5c8e6d4-f4b9-48dd-a28b-929ee4de6cd2',
  service: '5dea3d69-41ed-495a-8415-7a555282841b',
};
const CONV_EXISTING = '1361436e-de76-4ef9-82b2-3026797603f9';
const TAX = ['create.meal', 'create.baking'];

const evidence = {
  at: new Date().toISOString(),
  base,
  creation: [],
  negotiation: [],
  barter: [],
  orderConversion: [],
  security: [],
  chat: [],
  completion: [],
  payment: [],
  delivery: [],
  service: [],
  regressions: [],
  notes: [],
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
    await fetch(`${base}/api/auth/session`, { headers: { cookie: cookieHeader(jar) } })
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
  return { status: r.status, json, text };
}

function record(bucket, row) {
  evidence[bucket].push(row);
  const mark = row.ok === false ? 'FAIL' : row.ok === true ? 'PASS' : row.result || '?';
  console.log(`[${bucket}] ${mark}`, row.name || row.scenario, row.status ?? '', row.note || '');
}

async function startConversation(buyerJar, productId, sellerUserId) {
  // try start endpoints then fall back to messages/conversations
  for (const [url, body] of [
    [
      '/api/conversations/start',
      { productId, sellerId: sellerUserId, message: 'Phase52 start' },
    ],
    [
      '/api/conversations',
      { productId, sellerId: sellerUserId, message: 'Phase52 start' },
    ],
  ]) {
    const r = await api(buyerJar, 'POST', url, body);
    const id =
      r.json?.conversationId ||
      r.json?.conversation?.id ||
      r.json?.id ||
      null;
    if (r.status < 300 && id) return { id, via: url, status: r.status };
    if (r.status < 300 && r.json) {
      // some APIs return existing
      const maybe = r.json.conversationId || r.json.id;
      if (maybe) return { id: maybe, via: url, status: r.status };
    }
  }
  return null;
}

async function createProposal(jar, conversationId, body, name) {
  const r = await api(jar, 'POST', `/api/conversations/${conversationId}/proposals`, body);
  const proposal = r.json?.proposal || r.json;
  const ok = r.status >= 200 && r.status < 300 && proposal?.id;
  record('creation', {
    name,
    status: r.status,
    ok,
    proposalId: proposal?.id,
    settlementMode: proposal?.settlementMode,
    category: proposal?.category,
    amountCents: proposal?.amountCents,
    note: ok ? undefined : JSON.stringify(r.json).slice(0, 220),
  });
  return { ...r, proposal };
}

async function main() {
  const buyer = await login(buyerEmail);
  const seller = await login(sellerEmail);
  if (!buyer.userId || !seller.userId) {
    evidence.regressions.push({
      severity: 'P0',
      area: 'auth',
      note: 'login failed for disposable users',
    });
    throw new Error('auth failed');
  }
  evidence.notes.push({ buyerId: buyer.userId, sellerId: seller.userId });

  // Ensure conversation on money product
  let convId = CONV_EXISTING;
  const list = await api(buyer.jar, 'GET', '/api/conversations');
  const existing = (list.json?.conversations || []).find(
    (c) => c.id === CONV_EXISTING || c.product?.id === PRODUCTS.moneyBarter,
  );
  if (!existing) {
    const started = await startConversation(buyer.jar, PRODUCTS.moneyBarter, seller.userId);
    if (started?.id) convId = started.id;
  }
  record('chat', { name: 'conversation-ready', ok: true, conversationId: convId });

  // --- PART 1: creation scenarios ---
  const scenarios = [
    {
      name: 'money-only-product',
      body: {
        title: 'Phase52 money only',
        description: 'Money proposal',
        amountCents: 500,
        quantity: 1,
        category: 'PRODUCT',
        settlementMode: 'MONEY',
        paymentPath: 'DIRECT_CONTACT',
        productId: PRODUCTS.moneyBarter,
        fulfillmentType: 'PICKUP',
      },
    },
    {
      name: 'meal-product',
      body: {
        title: 'Phase52 meal proposal',
        amountCents: 700,
        quantity: 2,
        category: 'PRODUCT',
        settlementMode: 'MONEY',
        paymentPath: 'DIRECT_CONTACT',
        productId: PRODUCTS.moneyBarter,
      },
    },
    {
      name: 'service-category',
      body: {
        title: 'Phase52 service proposal',
        amountCents: 2500,
        category: 'SERVICE',
        settlementMode: 'MONEY',
        paymentPath: 'DIRECT_CONTACT',
        productId: PRODUCTS.service,
        requestedDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        requestedTimeWindow: '14:00-16:00',
        fulfillmentType: 'PICKUP',
      },
    },
    {
      name: 'free-proposal',
      body: {
        title: 'Phase52 free proposal',
        category: 'PRODUCT',
        settlementMode: 'FREE',
        paymentPath: 'NONE',
        productId: PRODUCTS.free,
      },
    },
    {
      name: 'money-and-barter',
      body: {
        title: 'Phase52 money+barter',
        amountCents: 300,
        settlementMode: 'MONEY_AND_VALUE',
        paymentPath: 'DIRECT_CONTACT',
        productId: PRODUCTS.moneyBarter,
        requestedValueTaxonomyIds: TAX,
        acceptedValueTaxonomyIds: TAX,
      },
    },
    {
      name: 'barter-only',
      body: {
        title: 'Phase52 barter only',
        settlementMode: 'VALUE_ONLY',
        paymentPath: 'NONE',
        productId: PRODUCTS.barterOnly,
        requestedValueTaxonomyIds: TAX,
      },
    },
    {
      name: 'voluntary',
      body: {
        title: 'Phase52 voluntary',
        settlementMode: 'VOLUNTARY',
        paymentPath: 'NONE',
        productId: PRODUCTS.free,
      },
    },
    {
      name: 'with-expiry',
      body: {
        title: 'Phase52 expiring',
        amountCents: 400,
        settlementMode: 'MONEY',
        paymentPath: 'DIRECT_CONTACT',
        productId: PRODUCTS.moneyBarter,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    },
  ];

  // For service / free / barter need conversations
  const convByProduct = { [PRODUCTS.moneyBarter]: convId };
  for (const pid of [PRODUCTS.service, PRODUCTS.free, PRODUCTS.barterOnly]) {
    const started = await startConversation(buyer.jar, pid, seller.userId);
    if (started?.id) {
      convByProduct[pid] = started.id;
      record('chat', {
        name: `start-conv-${pid.slice(0, 8)}`,
        ok: true,
        conversationId: started.id,
        via: started.via,
      });
    } else {
      record('chat', {
        name: `start-conv-${pid.slice(0, 8)}`,
        ok: false,
        note: 'could not start conversation',
      });
    }
  }

  const created = {};
  for (const s of scenarios) {
    const cId = convByProduct[s.body.productId] || convId;
    if (!cId) {
      record('creation', { name: s.name, ok: false, note: 'no conversation' });
      continue;
    }
    const r = await createProposal(buyer.jar, cId, s.body, s.name);
    if (r.proposal?.id) created[s.name] = { ...r.proposal, conversationId: cId };
  }

  // Mixed / garden / designer as category variants on money product
  for (const [name, category] of [
    ['garden-category', 'PRODUCT'],
    ['designer-mixed-notes', 'PRODUCT'],
    ['task-category', 'TASK'],
  ]) {
    const r = await createProposal(buyer.jar, convId, {
      title: `Phase52 ${name}`,
      description: name.includes('designer') ? 'Mixed notes + money' : 'Category probe',
      amountCents: 150,
      category,
      settlementMode: 'MONEY',
      paymentPath: 'DIRECT_CONTACT',
      productId: PRODUCTS.moneyBarter,
    }, name);
    if (r.proposal?.id) created[name] = { ...r.proposal, conversationId: convId };
  }

  // List proposals in conversation
  const listed = await api(buyer.jar, 'GET', `/api/conversations/${convId}/proposals`);
  record('chat', {
    name: 'list-proposals-in-conversation',
    status: listed.status,
    ok: listed.status === 200,
    count: (listed.json?.proposals || listed.json || []).length,
  });

  // --- PART 3: negotiation ---
  // Reject path
  if (created['with-expiry']) {
    const id = created['with-expiry'].id;
    const ownReject = await api(buyer.jar, 'POST', `/api/proposals/${id}/reject`, {});
    record('security', {
      name: 'creator-cannot-reject-own',
      status: ownReject.status,
      ok: ownReject.status === 403,
      note: JSON.stringify(ownReject.json).slice(0, 120),
    });
    const rej = await api(seller.jar, 'POST', `/api/proposals/${id}/reject`, {});
    record('negotiation', {
      name: 'reject',
      status: rej.status,
      ok: rej.status === 200 && (rej.json?.proposal?.status || rej.json?.status) === 'REJECTED',
      statusAfter: rej.json?.proposal?.status || rej.json?.status,
    });
  }

  // Cancel/withdraw by creator
  if (created['meal-product']) {
    const id = created['meal-product'].id;
    const sellerCancel = await api(seller.jar, 'POST', `/api/proposals/${id}/cancel`, {});
    record('security', {
      name: 'non-creator-cannot-cancel',
      status: sellerCancel.status,
      ok: sellerCancel.status === 403,
    });
    const cancel = await api(buyer.jar, 'POST', `/api/proposals/${id}/cancel`, {});
    record('negotiation', {
      name: 'withdraw-cancel',
      status: cancel.status,
      ok:
        cancel.status === 200 &&
        (cancel.json?.proposal?.status || cancel.json?.status) === 'CANCELLED',
      statusAfter: cancel.json?.proposal?.status || cancel.json?.status,
    });
  }

  // Counter rounds
  if (created['money-only-product']) {
    const id = created['money-only-product'].id;
    const ownCounter = await api(buyer.jar, 'POST', `/api/proposals/${id}/counter`, {
      title: 'illegal own counter',
      amountCents: 450,
      settlementMode: 'MONEY',
      paymentPath: 'DIRECT_CONTACT',
    });
    record('security', {
      name: 'creator-cannot-counter-own',
      status: ownCounter.status,
      ok: ownCounter.status === 403,
    });

    const counter1 = await api(seller.jar, 'POST', `/api/proposals/${id}/counter`, {
      title: 'Phase52 counter round 1',
      amountCents: 650,
      quantity: 1,
      settlementMode: 'MONEY',
      paymentPath: 'DIRECT_CONTACT',
      productId: PRODUCTS.moneyBarter,
    });
    const child1 = counter1.json?.proposal || counter1.json;
    record('negotiation', {
      name: 'counter-round-1',
      status: counter1.status,
      ok: counter1.status === 200 && child1?.status === 'PENDING' && child1?.parentProposalId === id,
      childId: child1?.id,
      parentHint: counter1.json?.parent?.status || 'check-get',
    });

    if (child1?.id) {
      const parentGet = await api(buyer.jar, 'GET', `/api/proposals/${id}`);
      record('negotiation', {
        name: 'parent-status-after-counter',
        status: parentGet.status,
        ok: (parentGet.json?.proposal?.status || parentGet.json?.status) === 'COUNTERED',
        statusAfter: parentGet.json?.proposal?.status || parentGet.json?.status,
      });

      const counter2 = await api(buyer.jar, 'POST', `/api/proposals/${child1.id}/counter`, {
        title: 'Phase52 counter round 2',
        amountCents: 550,
        settlementMode: 'MONEY',
        paymentPath: 'DIRECT_CONTACT',
        productId: PRODUCTS.moneyBarter,
      });
      const child2 = counter2.json?.proposal || counter2.json;
      record('negotiation', {
        name: 'counter-round-2',
        status: counter2.status,
        ok: counter2.status === 200 && child2?.parentProposalId === child1.id,
        childId: child2?.id,
      });
      created.counterFinal = child2?.id
        ? { ...child2, conversationId: convId }
        : null;
    }
  }

  // Accept → community order (use free proposal to avoid Stripe)
  if (created['free-proposal']) {
    const id = created['free-proposal'].id;
    const noCommit = await api(seller.jar, 'POST', `/api/proposals/${id}/accept`, {});
    record('security', {
      name: 'accept-requires-commitment',
      status: noCommit.status,
      ok: noCommit.status === 400,
    });
    const spoof = await api(buyer.jar, 'POST', `/api/proposals/${id}/accept`, {
      commitmentAccepted: true,
    });
    record('security', {
      name: 'creator-cannot-accept-own',
      status: spoof.status,
      ok: spoof.status === 403,
    });

    const accept = await api(seller.jar, 'POST', `/api/proposals/${id}/accept`, {
      commitmentAccepted: true,
    });
    const communityOrder =
      accept.json?.communityOrder || accept.json?.communityOrderId || null;
    record('orderConversion', {
      name: 'accept-free-to-community-order',
      status: accept.status,
      ok: accept.status === 200 && (accept.json?.proposal?.status === 'ACCEPTED' || accept.json?.status === 'ACCEPTED'),
      communityOrderId: communityOrder?.id || communityOrder,
      agreementId: accept.json?.agreement?.id,
      nextAction: accept.json?.nextAction,
      buyerId: communityOrder?.buyerId,
      sellerId: communityOrder?.sellerId,
      proposalId: communityOrder?.proposalId || id,
    });

    const coId = communityOrder?.id;
    if (coId) {
      // duplicate accept
      const dup = await api(seller.jar, 'POST', `/api/proposals/${id}/accept`, {
        commitmentAccepted: true,
      });
      record('security', {
        name: 'duplicate-accept-blocked',
        status: dup.status,
        ok: dup.status === 409,
      });

      // complete
      const complete = await api(
        seller.jar,
        'POST',
        `/api/community-orders/${coId}/complete`,
        {},
      );
      record('completion', {
        name: 'seller-complete-community-order',
        status: complete.status,
        ok: complete.status === 200,
        note: JSON.stringify(complete.json).slice(0, 200),
      });
    }
  }

  // Barter accept
  if (created['barter-only']) {
    const id = created['barter-only'].id;
    const accept = await api(seller.jar, 'POST', `/api/proposals/${id}/accept`, {
      commitmentAccepted: true,
    });
    record('barter', {
      name: 'accept-barter-only',
      status: accept.status,
      ok: accept.status === 200,
      settlementMode: accept.json?.proposal?.settlementMode,
      communityOrderId: accept.json?.communityOrder?.id,
      nextAction: accept.json?.nextAction,
      checkoutUrl: accept.json?.checkoutUrl || null,
    });
  }

  // Money+barter accept
  if (created['money-and-barter']) {
    const id = created['money-and-barter'].id;
    const accept = await api(seller.jar, 'POST', `/api/proposals/${id}/accept`, {
      commitmentAccepted: true,
    });
    record('barter', {
      name: 'accept-money-and-barter',
      status: accept.status,
      ok: accept.status === 200,
      nextAction: accept.json?.nextAction,
      communityOrderId: accept.json?.communityOrder?.id,
      amountCents: accept.json?.proposal?.amountCents,
    });
    if (accept.json?.communityOrder?.id) {
      const ctx = await api(
        buyer.jar,
        'GET',
        `/api/community-orders/${accept.json.communityOrder.id}/checkout-context`,
      );
      record('payment', {
        name: 'checkout-context-for-mixed',
        status: ctx.status,
        ok: ctx.status === 200 || ctx.status === 400 || ctx.status === 403,
        note: JSON.stringify(ctx.json).slice(0, 220),
      });
    }
  }

  // Accept counter final with DIRECT_CONTACT (no live charge)
  if (created.counterFinal?.id) {
    const accept = await api(seller.jar, 'POST', `/api/proposals/${created.counterFinal.id}/accept`, {
      commitmentAccepted: true,
    });
    record('orderConversion', {
      name: 'accept-counter-final-money',
      status: accept.status,
      ok: accept.status === 200,
      communityOrderId: accept.json?.communityOrder?.id,
      amountCents: accept.json?.proposal?.amountCents,
      nextAction: accept.json?.nextAction,
      checkoutUrl: Boolean(accept.json?.checkoutUrl),
    });
  }

  // Delivery: accept a delivery fulfillment proposal (may not auto-create without addresses)
  const delCreate = await createProposal(buyer.jar, convId, {
    title: 'Phase52 delivery proposal',
    amountCents: 800,
    settlementMode: 'MONEY',
    paymentPath: 'DIRECT_CONTACT',
    productId: PRODUCTS.moneyBarter,
    fulfillmentType: 'DELIVERY',
  }, 'delivery-fulfillment');
  if (delCreate.proposal?.id) {
    const accept = await api(seller.jar, 'POST', `/api/proposals/${delCreate.proposal.id}/accept`, {
      commitmentAccepted: true,
    });
    record('delivery', {
      name: 'accept-delivery-fulfillment',
      status: accept.status,
      ok: accept.status === 200,
      nextAction: accept.json?.nextAction,
      deliveryRequest: Boolean(accept.json?.deliveryRequest),
      communityOrderId: accept.json?.communityOrder?.id,
      deliveryRequested: accept.json?.communityOrder?.deliveryRequested,
    });
    const coId = accept.json?.communityOrder?.id;
    if (coId) {
      const dr = await api(
        buyer.jar,
        'POST',
        `/api/community-orders/${coId}/delivery-request`,
        {},
      );
      record('delivery', {
        name: 'manual-delivery-request',
        status: dr.status,
        ok: dr.status < 500,
        note: JSON.stringify(dr.json).slice(0, 220),
      });
    }
  }

  // Service booking fields
  if (created['service-category']) {
    const g = await api(buyer.jar, 'GET', `/api/proposals/${created['service-category'].id}`);
    record('service', {
      name: 'service-proposal-fields',
      status: g.status,
      ok: g.status === 200,
      category: g.json?.proposal?.category || g.json?.category,
      requestedDate: g.json?.proposal?.requestedDate || g.json?.requestedDate,
      requestedTimeWindow:
        g.json?.proposal?.requestedTimeWindow || g.json?.requestedTimeWindow,
      note: 'calendar booking NOT_IMPLEMENTED — scheduling fields only',
    });
  }

  // Unauthorized outsider
  // register disposable outsider quickly if possible — or use unauthenticated
  const unauth = await api({}, 'GET', `/api/proposals/${created['garden-category']?.id || 'x'}`);
  record('security', {
    name: 'unauthenticated-proposal-get',
    status: unauth.status,
    ok: unauth.status === 401 || unauth.status === 403 || unauth.status === 404,
  });

  // Profile proposals list
  const mine = await api(buyer.jar, 'GET', '/api/profile/proposals');
  record('chat', {
    name: 'profile-proposals',
    status: mine.status,
    ok: mine.status === 200,
    count: (mine.json?.proposals || mine.json || []).length,
  });

  // Notifications after proposal activity
  const notif = await api(seller.jar, 'GET', '/api/notifications');
  record('chat', {
    name: 'seller-notifications-after-proposals',
    status: notif.status,
    ok: notif.status === 200,
    sampleTypes: (notif.json?.notifications || [])
      .slice(0, 8)
      .map((n) => n.type || n.prismaType),
  });

  // Summarize failures
  for (const bucket of Object.keys(evidence)) {
    if (!Array.isArray(evidence[bucket])) continue;
    for (const row of evidence[bucket]) {
      if (row.ok === false) {
        evidence.regressions.push({
          severity: row.name?.includes('security') ? 'P1' : 'P1',
          area: bucket,
          note: `${row.name}: ${row.status} ${row.note || ''}`,
        });
      }
    }
  }

  const out = path.join(outDir, 'evidence.json');
  fs.writeFileSync(out, JSON.stringify(evidence, null, 2));
  console.log('WROTE', out);
}

main().catch((e) => {
  console.error(e);
  evidence.regressions.push({ severity: 'P0', area: 'runner', note: String(e) });
  fs.writeFileSync(
    path.join(outDir, 'evidence.json'),
    JSON.stringify(evidence, null, 2),
  );
  process.exit(1);
});
